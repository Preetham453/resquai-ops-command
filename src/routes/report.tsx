import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const ReportPage = lazy(() => import("@/components/pages/ReportPage"));

export const Route = createFileRoute("/report")({
  ssr: false,
  component: () => (
    <Suspense fallback={<div className="min-h-screen bg-[#060b12]" />}>
      <ReportPage />
    </Suspense>
  ),
});