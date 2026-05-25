import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { TacticalBg, TacticalCard } from "@/components/TacticalBg";
import { ArrowLeft, Camera, Crosshair, Loader2, Radio, Send, CheckCircle2, AlertTriangle, X } from "lucide-react";
import {
  EMERGENCY_TYPES,
  SEVERITIES,
  autoSeverity,
  createIncident,
  severityColor,
  sosSchema,
  type EmergencyType,
  type Severity,
} from "@/lib/incidents";


export default function ReportPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState<EmergencyType>("Fire");
  const [severity, setSeverity] = useState<Severity>(autoSeverity("Fire"));
  const [severityTouched, setSeverityTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "ok" | "error">("idle");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [camOpen, setCamOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);

  useEffect(() => {
    locate();
  }, []);

  useEffect(() => {
    if (!severityTouched) setSeverity(autoSeverity(type));
  }, [type, severityTouched]);

  function locate() {
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      setGeoError("Geolocation not supported");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoStatus("ok");
        setGeoError(null);
      },
      (err) => {
        setGeoStatus("error");
        setGeoError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const mutation = useMutation({
    mutationFn: createIncident,
    onSuccess: (data) => setSubmitted({ id: data.id }),
    onError: (e: Error) => setFormError(e.message),
  });

  function submit() {
    setFormError(null);
    if (!coords) {
      setFormError("GPS lock required. Tap Re-acquire to enable location.");
      return;
    }
    const parsed = sosSchema.safeParse({
      reporter_name: name,
      emergency_type: type,
      severity,
      description,
      latitude: coords.lat,
      longitude: coords.lng,
      photo_base64: photo,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid payload");
      return;
    }
    mutation.mutate(parsed.data);
  }

  if (submitted) {
    return (
      <div className="relative min-h-screen text-slate-100">
        <TacticalBg />
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
          <div className="relative grid h-24 w-24 place-items-center rounded-full border-2 border-emerald-400/60 bg-emerald-400/10 emerald-glow">
            <span className="absolute inset-0 rounded-full border-2 border-emerald-400 pulse-ring" />
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          </div>
          <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-emerald-400">Signal Received · Unit Dispatched</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight">EMERGENCY TRANSMITTED</h1>
          <p className="mt-3 max-w-md text-slate-400">
            Incident <span className="font-mono text-emerald-400">#{submitted.id.slice(0, 8).toUpperCase()}</span> is now active on the command grid. Field units have been alerted.
          </p>
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => {
                setSubmitted(null);
                setName("");
                setDescription("");
                setPhoto(null);
                setSeverityTouched(false);
              }}
              className="rounded-md border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-sm font-medium hover:bg-slate-800"
            >
              File another report
            </button>
            <Link to="/" className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
              Return to base
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sev = severityColor(severity);

  return (
    <div className="relative min-h-screen text-slate-100">
      <TacticalBg />
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-emerald-400">
            <ArrowLeft className="h-4 w-4" /> Abort · Return
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-red-400/40 bg-red-400/10 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-red-300">SOS Channel · Live</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-red-400">
          <Radio className="h-3 w-3" /> Priority Uplink · Encrypted
        </div>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">EMERGENCY <span className="text-red-400">SOS</span></h1>
        <p className="mt-2 max-w-xl text-sm text-slate-400">Submit a real-time incident report. Your location, identity, and signal are transmitted directly to command operations.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <TacticalCard className="p-6">
            <div className="grid gap-5">
              <Field label="Reporter Callsign / Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. J. Reyes"
                  className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-4 py-2.5 font-mono text-sm outline-none focus:border-emerald-400"
                />
              </Field>

              <Field label="Emergency Class">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  {EMERGENCY_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`rounded-md border px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition ${type === t ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-500"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Severity Level (auto-assigned, override allowed)">
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITIES.map((s) => {
                    const c = severityColor(s);
                    const active = severity === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setSeverity(s); setSeverityTouched(true); }}
                        className={`rounded-md border px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition ${active ? c.tw : "border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-500"}`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Situation Report">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Describe the situation, hazards, casualties, structures involved..."
                  className="w-full resize-none rounded-md border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                />
                <div className="mt-1 text-right font-mono text-[10px] text-slate-500">{description.length}/1000</div>
              </Field>

              <Field label="Field Imagery (optional)">
                {photo ? (
                  <div className="relative overflow-hidden rounded-md border border-slate-700">
                    <img src={photo} alt="Captured" className="h-48 w-full object-cover" />
                    <button onClick={() => setPhoto(null)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-slate-950/80 hover:bg-red-500/80">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCamOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-slate-700 bg-slate-950/40 py-6 text-sm text-slate-400 hover:border-emerald-400 hover:text-emerald-400"
                  >
                    <Camera className="h-5 w-5" /> Capture from device camera
                  </button>
                )}
              </Field>

              {formError && (
                <div className="flex items-start gap-2 rounded-md border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <button
                onClick={submit}
                disabled={mutation.isPending}
                className={`relative mt-2 flex items-center justify-center gap-3 rounded-md border-2 border-red-400 bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 font-mono text-sm font-bold uppercase tracking-[0.25em] text-white red-glow transition hover:from-red-400 hover:to-red-500 disabled:opacity-60 ${mutation.isError ? "shake" : ""}`}
              >
                {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {mutation.isPending ? "Transmitting…" : "Transmit Emergency Signal"}
              </button>
            </div>
          </TacticalCard>

          <div className="space-y-4">
            <TacticalCard className="p-5" glow={coords ? "emerald" : "amber"}>
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">GPS Lock</div>
                <button onClick={locate} className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 hover:text-emerald-300">Re-acquire</button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-full border ${coords ? "border-emerald-400/60 bg-emerald-400/10" : "border-amber-400/60 bg-amber-400/10"}`}>
                  {geoStatus === "locating" ? <Loader2 className="h-5 w-5 animate-spin text-amber-300" /> : <Crosshair className={`h-5 w-5 ${coords ? "text-emerald-400" : "text-amber-400"}`} />}
                </div>
                <div>
                  {coords ? (
                    <>
                      <div className="font-mono text-sm text-emerald-300">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Coordinate lock acquired</div>
                    </>
                  ) : (
                    <>
                      <div className="font-mono text-sm text-amber-300">{geoStatus === "locating" ? "Acquiring..." : "No fix"}</div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{geoError ?? "Awaiting satellites"}</div>
                    </>
                  )}
                </div>
              </div>
            </TacticalCard>

            <TacticalCard className="p-5" glow={sev.glow.includes("red") ? "red" : sev.glow.includes("amber") ? "amber" : sev.glow.includes("sky") ? "sky" : "emerald"}>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">Threat Assessment</div>
              <div className="mt-3 flex items-baseline gap-2">
                <div className="text-3xl font-black" style={{ color: sev.hex }}>{severity.toUpperCase()}</div>
              </div>
              <div className="mt-2 font-mono text-[11px] text-slate-400">{type} · Priority dispatch protocol engaged.</div>
            </TacticalCard>

            <TacticalCard className="p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">Operational Notice</div>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li>• Submitting falsifies signal may constitute an offence.</li>
                <li>• Stay on-scene if safe; dispatch will contact via callsign.</li>
                <li>• Photo is optional but improves response accuracy.</li>
              </ul>
            </TacticalCard>
          </div>
        </div>
      </main>

      {camOpen && <CameraModal onClose={() => setCamOpen(false)} onCapture={(b64) => { setPhoto(b64); setCamOpen(false); }} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">{label}</div>
      {children}
    </div>
  );
}

function CameraModal({ onClose, onCapture }: { onClose: () => void; onCapture: (b64: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch((e) => setErr(e.message ?? "Camera unavailable"));
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function snap() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    const w = Math.min(v.videoWidth, 1280);
    const scale = w / v.videoWidth;
    canvas.width = w;
    canvas.height = v.videoHeight * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL("image/jpeg", 0.7));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-950 emerald-glow">
        <div className="flex items-center justify-between border-b border-slate-800 p-3">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-400">Field Camera · Live Feed</div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-800"><X className="h-4 w-4" /></button>
        </div>
        <div className="relative aspect-video bg-black">
          {err ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-red-300">{err}</div>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-4 rounded border-2 border-emerald-400/40">
                <div className="absolute -left-1 -top-1 h-4 w-4 border-l-2 border-t-2 border-emerald-400" />
                <div className="absolute -right-1 -top-1 h-4 w-4 border-r-2 border-t-2 border-emerald-400" />
                <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-emerald-400" />
              </div>
            </>
          )}
        </div>
        <div className="flex justify-center gap-3 p-4">
          <button onClick={onClose} className="rounded-md border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Cancel</button>
          <button onClick={snap} disabled={!ready || !!err} className="rounded-md bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">Capture Frame</button>
        </div>
      </div>
    </div>
  );
}