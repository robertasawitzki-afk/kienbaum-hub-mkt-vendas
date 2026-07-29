import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Mic, MicOff, Send, Square, Volume2, VolumeX, Sparkles, Loader2, Ear } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { simulatorChat, simulatorFeedback, synthesizeSpeechFn } from "@/lib/ai.functions";
import { SaveOutputButton } from "@/components/save-output-button";
import { OutputsHistory } from "@/components/outputs-history";

export const Route = createFileRoute("/treinamento/simulador")({
  head: () => ({ meta: [{ title: "Simulador de Vendas — Kienbaum Hub de Mkt & Vendas" }] }),
  component: SimuladorPage,
});

type Msg = { role: "user" | "assistant"; content: string };

// A Google não documenta o gênero de cada voz — use "Testar voz" para calibrar de ouvido
// e trocar o campo `voice` de cada persona se alguma soar errada.
const PERSONAS = [
  { key: "ceo_industrial", label: "CEO industrial (familiar, R$ 400M)", voice: "Puck" }, // Roberto Almeida (m)
  { key: "cfo", label: "CFO de serviços B2B (R$ 800M)", voice: "Kore" }, // Marina Costa (f)
  { key: "chro", label: "CHRO de varejo (15k colaboradores)", voice: "Orus" }, // Paulo Henrique (m)
  { key: "dono_familiar", label: "Dono familiar fundador (72 anos)", voice: "Fenrir" }, // Dr. Antônio (m)
];

function SimuladorPage() {
  const chat = useServerFn(simulatorChat);
  const feedbackFn = useServerFn(simulatorFeedback);
  const speakFn = useServerFn(synthesizeSpeechFn);
  const [persona, setPersona] = useState("ceo_industrial");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOut, setVoiceOut] = useState(true);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loadingFb, setLoadingFb] = useState(false);
  const recogRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, voiceLoading]);

  function speakBrowserFallback(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    u.rate = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const ptVoice =
      voices.find((v) => v.lang === "pt-BR" && /google|natural|wavenet/i.test(v.name)) ??
      voices.find((v) => v.lang === "pt-BR");
    if (ptVoice) u.voice = ptVoice;
    window.speechSynthesis.speak(u);
  }

  async function speak(text: string) {
    if (!voiceOut) return;
    setVoiceLoading(true);
    try {
      const voice = PERSONAS.find((p) => p.key === persona)?.voice;
      const { audioUrl } = await speakFn({ data: { text: text.slice(0, 2000), voice } });
      audioRef.current?.pause();
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      await audio.play();
    } catch {
      // Gemini TTS indisponível (chave/modelo) — cai para a voz do navegador.
      speakBrowserFallback(text);
    } finally {
      setVoiceLoading(false);
    }
  }

  async function testVoice() {
    const voice = PERSONAS.find((p) => p.key === persona)?.voice;
    setTestingVoice(true);
    try {
      const { audioUrl } = await speakFn({ data: { text: "Olá, tudo bem? Vamos começar nossa reunião.", voice } });
      audioRef.current?.pause();
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      await audio.play();
    } catch (e: any) {
      alert(e.message ?? "Não foi possível testar a voz agora.");
    } finally {
      setTestingVoice(false);
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const { reply } = await chat({ data: { persona, history: next } });
      setMessages([...next, { role: "assistant", content: reply }]);
      void speak(reply);
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: `⚠️ ${e.message ?? "Erro na IA."}` }]);
    } finally {
      setThinking(false);
    }
  }

  function toggleMic() {
    if (typeof window === "undefined") return;
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Reconhecimento de voz não suportado neste navegador. Use Chrome ou Edge.");
      return;
    }
    if (listening && recogRef.current) {
      recogRef.current.stop();
      return;
    }
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setInput(txt);
      if (e.results[e.results.length - 1].isFinal) {
        rec.stop();
        void send(txt);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recogRef.current = rec;
    setListening(true);
    rec.start();
  }

  function reset() {
    setMessages([]);
    setFeedback(null);
    setInput("");
    audioRef.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }

  async function requestFeedback() {
    if (messages.length < 2) return;
    setLoadingFb(true);
    try {
      const { feedback: fb } = await feedbackFn({ data: { persona, history: messages } });
      setFeedback(fb);
    } catch (e: any) {
      setFeedback(`⚠️ ${e.message ?? "Erro ao gerar feedback."}`);
    } finally {
      setLoadingFb(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        module="Treinamento · 1.5"
        title="Simulador de Vendas com IA"
        description="Treinamento conversacional por voz. A IA assume uma persona C-level e responde como em reunião real."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setVoiceOut((v) => !v)}>
              {voiceOut ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {voiceOut ? "Voz ligada" : "Voz desligada"}
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>Reiniciar</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Bot className="h-4 w-4 text-primary" />Persona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={persona} onValueChange={(v) => { setPersona(v); reset(); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERSONAS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => void testVoice()} disabled={testingVoice} className="w-full" size="sm" variant="outline">
              {testingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ear className="h-4 w-4" />}
              Testar voz
            </Button>
            <p className="text-xs text-muted-foreground">Inicie falando ou digitando. Pratique GPCT, SPIN e abertura consultiva.</p>
            <Button onClick={requestFeedback} disabled={messages.length < 2 || loadingFb} className="w-full" size="sm" variant="secondary">
              {loadingFb ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Avaliar minha performance
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-[60vh] min-h-[480px]">
          <CardContent className="flex-1 overflow-y-auto space-y-3 p-4">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-12">
                <Bot className="mx-auto h-8 w-8 mb-2 text-primary/60" />
                Inicie a reunião. Cumprimente o cliente e conduza a conversa.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  <div className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">{m.role === "user" ? "Você (CP)" : "Cliente"}</div>
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start"><Badge variant="secondary"><Loader2 className="h-3 w-3 animate-spin mr-1" />Pensando…</Badge></div>
            )}
            {!thinking && voiceLoading && (
              <div className="flex justify-start"><Badge variant="secondary"><Volume2 className="h-3 w-3 animate-pulse mr-1" />Preparando áudio…</Badge></div>
            )}
            <div ref={endRef} />
          </CardContent>
          <div className="border-t border-border p-3 flex gap-2">
            <Button type="button" variant={listening ? "destructive" : "outline"} size="icon" onClick={toggleMic} title="Falar">
              {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }}
              placeholder={listening ? "Ouvindo…" : "Digite ou clique no microfone…"}
              rows={2}
              className="resize-none"
            />
            <Button onClick={() => void send(input)} disabled={!input.trim() || thinking}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {feedback && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Feedback do coach</CardTitle>
            <SaveOutputButton
              kind="simulador"
              title={`Simulação · ${PERSONAS.find((p) => p.key === persona)?.label ?? persona}`}
              content={`# Feedback do coach\n\n${feedback}\n\n---\n\n# Transcrição\n\n${messages.map((m) => `**${m.role === "user" ? "CP" : "Cliente"}:** ${m.content}`).join("\n\n")}`}
              meta={{ persona }}
            />
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground/90">{feedback}</pre>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <OutputsHistory kind="simulador" title="Simulações salvas" />
      </div>
    </PageContainer>
  );
}

// silence unused warning for icon set used conditionally
void MicOff;