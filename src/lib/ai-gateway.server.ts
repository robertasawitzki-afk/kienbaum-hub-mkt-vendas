// Cliente direto da API do Google Gemini (Google AI Studio).
// Requer GEMINI_API_KEY no ambiente do servidor. Veja README para como gerar a chave.
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
        | { type: "file"; file: { filename: string; file_data: string } }
      >;
};

function requireGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key)
    throw new Error(
      "GEMINI_API_KEY ausente no servidor. Gere uma chave em aistudio.google.com/apikey e adicione ao .env.",
    );
  return key;
}

function dataUrlToInline(url: string): { mimeType: string; data: string } {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(url);
  if (!m) throw new Error("Anexo inválido: esperado data URL base64.");
  return { mimeType: m[1], data: m[2] };
}

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

function toGeminiParts(content: ChatMessage["content"]): GeminiPart[] {
  if (typeof content === "string") return [{ text: content }];
  return content.map((c) => {
    if (c.type === "text") return { text: c.text };
    if (c.type === "image_url") return { inlineData: dataUrlToInline(c.image_url.url) };
    return { inlineData: dataUrlToInline(c.file.file_data) };
  });
}

function toGeminiPayload(messages: ChatMessage[]) {
  const systemParts: GeminiPart[] = [];
  const contents: GeminiContent[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(...toGeminiParts(m.content));
      continue;
    }
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: toGeminiParts(m.content),
    });
  }
  return { systemParts, contents };
}

/** Modelo do Gemini sobrecarregado (503) é transitório — tenta mais uma vez antes de desistir. */
async function geminiRequest(model: string, body: Record<string, unknown>) {
  const key = requireGeminiKey();
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${key}`;
  const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };

  let res = await fetch(url, opts);
  if (res.status === 503) {
    await new Promise((r) => setTimeout(r, 1500));
    res = await fetch(url, opts);
  }

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    if (res.status === 429)
      throw new Error(
        "Limite de requisições da API Gemini atingido. Tente novamente em instantes.",
      );
    if (res.status === 400 || res.status === 403)
      throw new Error(
        "Chave da API Gemini inválida ou sem permissão. Confira GEMINI_API_KEY no .env.",
      );
    if (res.status === 503)
      throw new Error(
        "O Gemini está sobrecarregado no momento. Tente novamente em alguns instantes.",
      );
    throw new Error(`Falha na IA (${res.status}): ${raw.slice(0, 300)}`);
  }
  return res.json();
}

export async function aiComplete(
  messages: ChatMessage[],
  opts: { model?: string; temperature?: number } = {},
): Promise<string> {
  const model = opts.model ?? process.env.GEMINI_MODEL ?? "gemini-flash-latest";
  const { systemParts, contents } = toGeminiPayload(messages);

  const data = await geminiRequest(model, {
    ...(systemParts.length ? { systemInstruction: { parts: systemParts } } : {}),
    contents,
    ...(opts.temperature !== undefined
      ? { generationConfig: { temperature: opts.temperature } }
      : {}),
  });

  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p: { text?: string }) => p.text ?? "").join("");
}

/** Transcreve um áudio (webm/wav/mp3/m4a) em português usando o Gemini. */
export async function transcribeAudio(input: {
  mime: string;
  dataBase64: string;
}): Promise<string> {
  const model = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
  const data = await geminiRequest(model, {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Transcreva este áudio literalmente em português do Brasil. Devolva apenas o texto transcrito, sem comentários, sem marcações.",
          },
          { inlineData: { mimeType: input.mime, data: input.dataBase64 } },
        ],
      },
    ],
  });
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();
}

function pcm16ToWav(pcmBase64: string, sampleRate = 24000, channels = 1): string {
  const pcm = Buffer.from(pcmBase64, "base64");
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * channels * 2;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(channels * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]).toString("base64");
}

/**
 * Sintetiza fala natural via Gemini TTS. Retorna um data URL audio/wav pronto para <audio>.
 * Se o modelo de TTS não estiver disponível na conta/chave, lança erro — o chamador deve
 * cair de volta para a voz do navegador (speechSynthesis).
 */
export async function synthesizeSpeech(text: string, voiceName = "Kore"): Promise<string> {
  const model = process.env.GEMINI_TTS_MODEL ?? "gemini-2.5-flash-preview-tts";
  const data = await geminiRequest(model, {
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
  });
  const inline = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (!inline?.data) throw new Error("TTS Gemini não retornou áudio.");
  const wavBase64 = pcm16ToWav(inline.data);
  return `data:audio/wav;base64,${wavBase64}`;
}
