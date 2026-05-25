import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { TacticalBg, TacticalCard, SignalBars } from "@/components/TacticalBg";
import { Radio, Shield, ArrowRight, Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen text-slate-100">
      <TacticalBg />
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/15 emerald-glow">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-mono text-sm font-bold tracking-widest text-emerald-400">RESQU<span className="text-slate-100">AI</span></div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Tactical Response · v1.0</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SignalBars />
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-300">System Online</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">
          <Activity className="h-3 w-3 text-emerald-400" /> Emergency Operations Network
        </div>
        <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
          <span className="text-slate-100">TACTICAL DISASTER</span><br />
          <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-sky-400 bg-clip-text text-transparent">RESPONSE.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-400">
          Real-time emergency coordination and intelligent field response infrastructure. Built for first responders, dispatchers, and the citizens they protect.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <PortalCard to="/report" title="Citizen SOS Portal" desc="Transmit emergency reports with live GPS, scene capture, and AI severity classification." icon={<Radio className="h-7 w-7" />} glow="red" />
          <PortalCard to="/dashboard" title="Dispatcher Command Center" desc="Live incident map, tactical queue, and unit coordination. Clearance required." icon={<Shield className="h-7 w-7" />} glow="emerald" />
        </div>

        <div className="mt-16 grid grid-cols-2 gap-3 text-xs md:grid-cols-3 lg:grid-cols-6">
          {["Live GPS Reporting","AI Severity Classification","Real-Time Dispatcher Tracking","Tactical Mapping","Evidence Capture","Incident Timeline"].map((f) => (
            <div key={f} className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-slate-400">
              <span className="text-emerald-400">▸</span> {f}
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 font-mono text-[10px] uppercase tracking-widest text-slate-500">
          <span>ResquAI · Emergency Operations Network</span>
          <span className="flex items-center gap-3"><SignalBars /> Network Uptime 99.98% · v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}

function PortalCard({ to, title, desc, icon, glow }: { to: string; title: string; desc: string; icon: React.ReactNode; glow: "emerald" | "red" }) {
  return (
    <Link to={to} className="group block">
      <TacticalCard glow={glow} className="p-8 transition hover:-translate-y-0.5 hover:bg-slate-900/80">
        <div className="flex items-start justify-between">
          <div className={`grid h-14 w-14 place-items-center rounded-xl ${glow === "red" ? "bg-red-400/15 text-red-400" : "bg-emerald-400/15 text-emerald-400"}`}>{icon}</div>
          <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-emerald-400" />
        </div>
        <h3 className="mt-6 text-2xl font-bold text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">{desc}</p>
        <div className="mt-6 font-mono text-[10px] uppercase tracking-widest text-slate-500">▸ Enter Portal</div>
      </TacticalCard>
    </Link>
  );
}
}
