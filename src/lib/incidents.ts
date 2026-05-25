import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Incident = Database["public"]["Tables"]["incidents"]["Row"];
export type EmergencyType = Database["public"]["Enums"]["emergency_type"];
export type Severity = Database["public"]["Enums"]["severity_level"];
export type IncidentStatus = Database["public"]["Enums"]["incident_status"];

export const EMERGENCY_TYPES: EmergencyType[] = ["Flood", "Fire", "Medical", "Structural Damage", "Other"];
export const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];
export const STATUSES: IncidentStatus[] = ["Active", "Responding", "Resolved"];

export const sosSchema = z.object({
  reporter_name: z.string().trim().min(2, "Name required").max(80),
  emergency_type: z.enum(["Flood", "Fire", "Medical", "Structural Damage", "Other"]),
  severity: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  description: z.string().trim().min(10, "Minimum 10 characters").max(1000),
  latitude: z.number(),
  longitude: z.number(),
  photo_base64: z.string().optional().nullable(),
});

export type SosInput = z.infer<typeof sosSchema>;

export function autoSeverity(type: EmergencyType): Severity {
  switch (type) {
    case "Fire":
    case "Structural Damage":
      return "Critical";
    case "Flood":
    case "Medical":
      return "High";
    default:
      return "Medium";
  }
}

export function severityColor(s: Severity) {
  return {
    Critical: { hex: "#f87171", tw: "text-red-400 border-red-400/50 bg-red-400/10", glow: "red-glow" },
    High: { hex: "#fbbf24", tw: "text-amber-400 border-amber-400/50 bg-amber-400/10", glow: "amber-glow" },
    Medium: { hex: "#38bdf8", tw: "text-sky-400 border-sky-400/50 bg-sky-400/10", glow: "sky-glow" },
    Low: { hex: "#34d399", tw: "text-emerald-400 border-emerald-400/50 bg-emerald-400/10", glow: "emerald-glow" },
  }[s];
}

export function statusColor(s: IncidentStatus) {
  return {
    Active: "text-red-400 border-red-400/40 bg-red-400/10",
    Responding: "text-amber-400 border-amber-400/40 bg-amber-400/10",
    Resolved: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  }[s];
}

export async function fetchIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

export async function createIncident(input: SosInput): Promise<Incident> {
  const parsed = sosSchema.parse(input);
  const severity = parsed.severity ?? autoSeverity(parsed.emergency_type);
  const { data, error } = await supabase
    .from("incidents")
    .insert({
      reporter_name: parsed.reporter_name,
      emergency_type: parsed.emergency_type,
      severity,
      description: parsed.description,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      photo_base64: parsed.photo_base64 ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data!;
}

export async function updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
  const patch: Partial<Incident> = { status };
  const { data, error } = await supabase
    .from("incidents")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data!;
}

export interface DashboardStats {
  totalActive: number;
  totalResponding: number;
  totalResolved: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  avgResponseMinutes: number;
}

export function computeStats(incidents: Incident[]): DashboardStats {
  const byType: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};
  let totalActive = 0, totalResponding = 0, totalResolved = 0;
  let respSum = 0, respCount = 0;
  for (const i of incidents) {
    byType[i.emergency_type] = (byType[i.emergency_type] ?? 0) + 1;
    bySeverity[i.severity] = (bySeverity[i.severity] ?? 0) + 1;
    if (i.status === "Active") totalActive++;
    else if (i.status === "Responding") totalResponding++;
    else if (i.status === "Resolved") {
      totalResolved++;
      if (i.resolved_at) {
        const m = (new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime()) / 60000;
        if (m > 0) { respSum += m; respCount++; }
      }
    }
  }
  return {
    totalActive, totalResponding, totalResolved, byType, bySeverity,
    avgResponseMinutes: respCount > 0 ? Math.round(respSum / respCount) : 0,
  };
}