"use client";

import { useEffect, useState } from "react";

import { SummaryCard } from "@/components/SummaryCard";
import { HealthCard } from "@/components/HealthCard";
import { IncidentCard } from "@/components/IncidentCard";
import { OsUpdateCard } from "@/components/OsUpdateCard";
import { ServiceLinks } from "@/components/ServiceLinks";
import { DemoActions } from "@/components/DemoActions";
import { MetricsOverview } from "@/components/MetricsOverview";
import ContainerOverview from "@/components/ContainerOverview";

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export default function Page() {
  const [data, setData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/platform", {
        cache: "no-store",
      });

      const json = await res.json();

      setData(json);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch platform data:", error);
    }
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <p className="text-sm text-zinc-400">Loading dashboard...</p>
      </main>
    );
  }

  const { blue, green, live, incidents, osUpdates } = data;
  const activeSlot = live?.slot ?? "unknown";

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-10">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-zinc-400">Self-Healing Linux Platform</p>
            <h1 className="text-4xl font-bold">LIVE Dashboard ⚡</h1>
          </div>

          <p className="text-sm text-zinc-400">
            Last updated:{" "}
            <span className="text-green-400">
              {lastUpdated ? formatTimestamp(lastUpdated) : "—"}
            </span>
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard label="Active slot" value={activeSlot} />
          <SummaryCard label="Live version" value={live?.version ?? "unknown"} />
          <SummaryCard
            label="Platform health"
            value={live?.ok ? "healthy" : "down"}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <HealthCard title="Blue" data={blue} active={activeSlot === "blue"} />
          <HealthCard title="Green" data={green} active={activeSlot === "green"} />
          <HealthCard title="Live (Nginx)" data={live} active />
        </section>

        <MetricsOverview />

        <ContainerOverview />

        <section>
          <DemoActions />
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Service Links</h2>
          <ServiceLinks />
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">Incident Timeline</h2>

	  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {incidents.length === 0 ? (
              <p className="text-sm text-zinc-400">No incidents</p>
            ) : (
              incidents.map((incident: any) => (
                <IncidentCard key={incident.file} incident={incident} />
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">OS Update Logs</h2>

          <div className="space-y-4">
            {osUpdates.length === 0 ? (
              <p className="text-sm text-zinc-400">No OS update logs</p>
            ) : (
              osUpdates.map((update: any) => (
                <OsUpdateCard key={update.file} update={update} />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
