"use client";

import { useEffect, useState } from "react";

type Metrics = {
  ok: boolean;
  cpuUsage: number | null;
  memoryUsage: number | null;
  containersUp: number | null;
  prometheusUp: number | null;
  ts: string;
  error?: string;
};

function formatPercent(value: number | null) {
  if (value === null) return "unknown";
  return `${value.toFixed(1)}%`;
}

export function MetricsOverview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  async function fetchMetrics() {
    try {
      const res = await fetch("/api/metrics", { cache: "no-store" });
      const data = await res.json();
      setMetrics(data);
    } catch {
      setMetrics(null);
    }
  }

  useEffect(() => {
    fetchMetrics();

    const interval = setInterval(fetchMetrics, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold">Live Metrics</h2>

      {!metrics?.ok && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-4 text-sm text-red-300">
          Could not load metrics
          {metrics?.error ? `: ${metrics.error}` : ""}
        </div>
      )}

      {metrics?.ok && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <MetricCard label="CPU usage" value={formatPercent(metrics.cpuUsage)} />
          <MetricCard
            label="Memory usage"
            value={formatPercent(metrics.memoryUsage)}
          />
          <MetricCard
            label="Containers tracked"
            value={String(metrics.containersUp ?? "unknown")}
          />
          <MetricCard
            label="Prometheus"
            value={metrics.prometheusUp === 1 ? "up" : "down"}
          />
        </div>
      )}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
