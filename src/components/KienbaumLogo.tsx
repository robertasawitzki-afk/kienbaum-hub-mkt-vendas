import logoWhite from "@/assets/kienbaum-logo-white.png";

export function KienbaumLogo({ height = 26 }: { height?: number }) {
  return <img src={logoWhite} alt="Kienbaum" style={{ height, width: "auto", display: "block" }} />;
}
