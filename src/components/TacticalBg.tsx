export function TacticalBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 tactical-grid opacity-80" />
      <div className="absolute inset-0 scanline" />
      <div className="absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-sky-500/10 blur-3xl" />
    </div>
  );
}

export function TacticalCard({ children, className = "", glow = "emerald" }: { children: React.ReactNode; className?: string; glow?: "emerald" | "amber" | "red" | "sky" }) {
  const glowClass = { emerald: "emerald-glow", amber: "amber-glow", red: "red-glow", sky: "sky-glow" }[glow];
  return (
    <div className={`relative rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl ${glowClass} ${className}`}>
      <Bracket pos="tl" /><Bracket pos="tr" /><Bracket pos="bl" /><Bracket pos="br" />
      {children}
    </div>
  );
}

function Bracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const map: Record<string, string> = {
    tl: "top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl",
    tr: "top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl",
    bl: "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl",
    br: "bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl",
  };
  return <div className={`pointer-events-none absolute h-4 w-4 border-emerald-400/60 ${map[pos]}`} />;
}

export function SignalBars({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-end gap-0.5 ${className}`}>
      {[3, 6, 9, 12].map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-sm bg-emerald-400/80"
          style={{ height: `${h}px`, animation: `pulse 1.4s ease-in-out ${i * 0.15}s infinite` }}
        />
      ))}
    </div>
  );
}