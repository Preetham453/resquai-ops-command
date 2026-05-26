import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { TacticalBg, TacticalCard, SignalBars } from "@/components/TacticalBg";
import {
  fetchIncidents,
  computeStats,
  severityColor,
  statusColor,
  updateIncidentStatus,
  STATUSES,
  type Incident,
  type IncidentStatus,
} from "@/lib/incidents";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Lock, Shield, Radio, AlertOctagon, Flame, Droplets, Heart, Building2, HelpCircle, Activity, Clock, ZoomIn, Filter, Trash2 } from "lucide-react";


const DISPATCHER_CODE = "BLUEORCHIDS2K26";

export default function DashboardPage() {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => { setUnlocked(sessionStorage.getItem("resqu-auth") === "1"); }, []);
  if (!unlocked) return <Gate onUnlock={() => { sessionStorage.setItem("resqu-auth", "1"); setUnlocked(true); }} />;
  return <Command />;
}

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim() === DISPATCHER_CODE) onUnlock();
    else { setErr(true); setTimeout(() => setErr(false), 500); }
  }
  return (
    <div className="relative flex min-h-screen items-center justify-center text-slate-100">
      <TacticalBg />
      <div className={`w-full max-w-md px-6 ${err ? "shake" : ""}`}>
        <Link to="/" className="mb-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-emerald-400">
          <ArrowLeft className="h-4 w-4" /> Abort
        </Link>
        <TacticalCard className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full border border-emerald-400/50 bg-emerald-400/10 emerald-glow">
              <Lock className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-400">Restricted Access · Tier-1</div>
            <h1 className="mt-2 text-2xl font-black">DISPATCHER AUTHORIZATION</h1>
            <p className="mt-2 text-sm text-slate-400">Enter command clearance code to access live operations.</p>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Clearance code"
              autoFocus
              className={`w-full rounded-md border bg-slate-950/60 px-4 py-3 text-center font-mono tracking-widest outline-none ${err ? "border-red-400" : "border-slate-700 focus:border-emerald-400"}`}
            />
            <button type="submit" className="w-full rounded-md bg-emerald-500 px-4 py-3 font-mono text-sm font-bold uppercase tracking-widest text-slate-950 hover:bg-emerald-400">
              Authenticate
            </button>
            <div className="text-center font-mono text-[10px] text-slate-500">Demo clearance: {DISPATCHER_CODE}</div>
          </form>
        </TacticalCard>
      </div>
    </div>
  );
}

function Command() {
  const qc = useQueryClient();
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: fetchIncidents,
    refetchInterval: 5000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("incidents-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => {
        qc.invalidateQueries({ queryKey: ["incidents"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const [filterStatus, setFilterStatus] = useState<"All" | IncidentStatus>("All");
  const [focusId, setFocusId] = useState<string | null>(null);

  const filtered = useMemo(
    () => incidents.filter((i) => filterStatus === "All" || i.status === filterStatus),
    [incidents, filterStatus],
  );
  const stats = useMemo(() => computeStats(incidents), [incidents]);
  const focus = incidents.find((i) => i.id === focusId) ?? null;

  const center: [number, number] = incidents.length
    ? [incidents[0].latitude, incidents[0].longitude]
    : [37.7749, -122.4194];

  return (
    <div className="relative min-h-screen text-slate-100">
      <TacticalBg />
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-emerald-400">
              <ArrowLeft className="h-4 w-4" /> Base
            </Link>
            <div className="hidden h-6 border-l border-slate-700 md:block" />
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <div className="font-mono text-xs uppercase tracking-widest text-emerald-400">Command Operations</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Clock4 />
            <SignalBars />
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-300">Live · Realtime</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <StatTile label="Active" value={stats.totalActive} icon={<AlertOctagon className="h-4 w-4" />} glow="red" />
          <StatTile label="Responding" value={stats.totalResponding} icon={<Activity className="h-4 w-4" />} glow="amber" />
          <StatTile label="Resolved" value={stats.totalResolved} icon={<Shield className="h-4 w-4" />} glow="emerald" />
          <StatTile label="Avg Response" value={`${stats.avgResponseMinutes}m`} icon={<Clock className="h-4 w-4" />} glow="sky" />
          <StatTile label="Critical" value={stats.bySeverity.Critical ?? 0} icon={<Flame className="h-4 w-4" />} glow="red" />
          <StatTile label="Total Signals" value={incidents.length} icon={<Radio className="h-4 w-4" />} glow="emerald" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px_400px]">
          <TacticalCard className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-400">Tactical Grid · Live Map</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{filtered.length} signals plotted</div>
            </div>
            <div className="h-[60vh] min-h-[460px] w-full">
              <MapContainer center={center} zoom={13} className="h-full w-full" preferCanvas zoomControl={false}>
                <ZoomCtrl />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
                <LiveTracker />
                <FocusFly focus={focus} />
                {filtered.map((i) => {
                  const c = severityColor(i.severity);
                  return (
                    <CircleMarker
                      key={i.id}
                      center={[i.latitude, i.longitude]}
                      radius={i.status === "Resolved" ? 6 : 10}
                      pathOptions={{ color: c.hex, fillColor: c.hex, fillOpacity: 0.6, weight: 2 }}
                      eventHandlers={{ click: () => setFocusId(i.id) }}
                    >
                      <Popup>
                        <div className="font-mono text-xs">
                          <div className="font-bold">{i.emergency_type} · {i.severity}</div>
                          <div className="text-slate-600">{i.reporter_name}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </TacticalCard>

          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-2">
              <Filter className="ml-2 h-3.5 w-3.5 text-slate-500" />
              {(["All", ...STATUSES] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`flex-1 rounded-md px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition ${filterStatus === s ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:bg-slate-800"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <TacticalCard className="flex h-[60vh] min-h-[460px] flex-col overflow-hidden p-0">
              <div className="border-b border-slate-800 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-400">
                Incident Queue
              </div>
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <Empty msg="Loading signals..." />
                ) : filtered.length === 0 ? (
                  <Empty msg="No incidents on record. Submit a signal via /report to populate the grid." />
                ) : (
                  filtered.map((i) => (
                    <IncidentRow key={i.id} incident={i} active={focusId === i.id} onSelect={() => setFocusId(i.id)} />
                  ))
                )}
              </div>
            </TacticalCard>
          </div>

          <TacticalCard className="flex h-[calc(60vh+60px)] min-h-[520px] flex-col overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-400">Command Panel</div>
              {focus && (
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  #{focus.id.slice(0, 8).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {focus ? (
                <InlineDetail incident={focus} onClose={() => setFocusId(null)} />
              ) : (
                <Empty msg="Select an incident from the queue to deploy command actions." />
              )}
            </div>
          </TacticalCard>
        </div>

      </main>
    </div>
  );
}

function StatTile({ label, value, icon, glow }: { label: string; value: number | string; icon: React.ReactNode; glow: "red" | "amber" | "emerald" | "sky" }) {
  return (
    <TacticalCard glow={glow} className="p-3">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</div>
        <div className="text-slate-500">{icon}</div>
      </div>
      <div className="mt-1 font-mono text-2xl font-black tabular-nums">{value}</div>
    </TacticalCard>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center font-mono text-xs text-slate-500">{msg}</div>
  );
}

function typeIcon(t: string) {
  const cls = "h-4 w-4";
  if (t === "Fire") return <Flame className={cls} />;
  if (t === "Flood") return <Droplets className={cls} />;
  if (t === "Medical") return <Heart className={cls} />;
  if (t === "Structural Damage") return <Building2 className={cls} />;
  return <HelpCircle className={cls} />;
}

function IncidentRow({ incident, active, onSelect }: { incident: Incident; active: boolean; onSelect: () => void }) {
  const sev = severityColor(incident.severity);
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-start gap-3 border-b border-slate-800 px-4 py-3 text-left transition ${active ? "bg-emerald-400/5" : "hover:bg-slate-800/40"}`}
    >
      <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md border" style={{ borderColor: sev.hex + "60", color: sev.hex }}>
        {typeIcon(incident.emergency_type)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-semibold">{incident.emergency_type}</div>
          <span className={`rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${sev.tw}`}>{incident.severity}</span>
          <span className={`rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${statusColor(incident.status)}`}>{incident.status}</span>
        </div>
        <div className="mt-0.5 truncate text-xs text-slate-400">{incident.description}</div>
        <div className="mt-1 flex items-center gap-3 font-mono text-[10px] text-slate-500">
          <span>{incident.reporter_name}</span>
          <span>{new Date(incident.created_at).toLocaleTimeString()}</span>
          <span className="truncate">{incident.latitude.toFixed(3)}, {incident.longitude.toFixed(3)}</span>
        </div>
      </div>
      <ZoomIn className="h-3.5 w-3.5 flex-shrink-0 text-slate-600" />
    </button>
  );
}

function InlineDetail({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: (status: IncidentStatus) => updateIncidentStatus(incident.id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents"] }),
  });
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("incidents").delete().eq("id", incident.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incidents"] }); onClose(); },
  });
  const sev = severityColor(incident.severity);

  return (
    <div className="p-4">
      {incident.photo_base64 && (
              <img src={incident.photo_base64} alt="Field" className="mb-3 w-full rounded-md border border-slate-700 object-cover" />
            )}
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${sev.tw}`}>{incident.severity}</span>
              <span className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${statusColor(incident.status)}`}>{incident.status}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-300">
                {typeIcon(incident.emergency_type)} {incident.emergency_type}
              </span>
            </div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Reporter</div>
            <div className="text-sm">{incident.reporter_name}</div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Situation Report</div>
            <p className="whitespace-pre-wrap text-sm text-slate-300">{incident.description}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Coords</div>
                <div className="font-mono text-emerald-300">{incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Received</div>
                <div className="font-mono text-slate-300">{new Date(incident.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Status Control</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => update.mutate(s)}
                  disabled={update.isPending || incident.status === s}
                  className={`rounded-md border px-2 py-2 font-mono text-[10px] uppercase tracking-wider transition ${incident.status === s ? statusColor(s) : "border-slate-700 text-slate-400 hover:bg-slate-800"} ${update.isPending ? "opacity-60" : ""}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => del.mutate()}
              disabled={del.isPending}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-red-400/40 bg-red-400/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-red-300 hover:bg-red-400/20 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Purge from grid
            </button>
    </div>
  );
}

function FocusFly({ focus }: { focus: Incident | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.latitude, focus.longitude], 15, { duration: 0.8 });
  }, [focus, map]);
  return null;
}

function LiveTracker() {
  const map = useMap();
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [acc, setAcc] = useState<number>(0);
  const centeredRef = useState({ done: false })[0];
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const next: [number, number] = [p.coords.latitude, p.coords.longitude];
        setPos(next);
        setAcc(p.coords.accuracy ?? 0);
        if (!centeredRef.done) {
          centeredRef.done = true;
          map.flyTo(next, 15, { duration: 0.8 });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [map, centeredRef]);
  if (!pos) return null;
  return (
    <>
      <CircleMarker
        center={pos}
        radius={8}
        pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.9, weight: 2 }}
      >
        <Popup>
          <div className="font-mono text-xs">
            <div className="font-bold">You are here</div>
            <div>±{Math.round(acc)}m</div>
          </div>
        </Popup>
      </CircleMarker>
      {acc > 0 && (
        <CircleMarker
          center={pos}
          radius={Math.min(40, Math.max(12, acc / 5))}
          pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.08, weight: 1, dashArray: "4 4" }}
        />
      )}
    </>
  );
}

function ZoomCtrl() {
  const map = useMap();
  useEffect(() => {
    L.control.zoom({ position: "bottomright" }).addTo(map);
  }, [map]);
  return null;
}

function Clock4() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hidden font-mono text-[11px] uppercase tracking-widest text-slate-400 md:block">
      {now.toISOString().slice(11, 19)} UTC
    </div>
  );
}