import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const DashboardPage = lazy(() => import("@/components/pages/DashboardPage"));

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-[#060b12]" />}>
      <DashboardPage />
    </Suspense>
  ),
});