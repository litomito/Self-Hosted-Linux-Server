export const runtime = "nodejs";

const PROMETHEUS_URL =
  process.env.PROMETHEUS_URL ?? "http://prometheus:9090";

async function queryPrometheus(query: string) {
  const url = `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(
    query
  )}`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Prometheus query failed: ${query}`);
  }

  const data = await res.json();
  const value = data?.data?.result?.[0]?.value?.[1];

  return value ? Number(value) : null;
}

export async function GET() {
  try {
    const [cpuIdle, memoryAvailable, memoryTotal, containersUp, prometheusUp] =
      await Promise.all([
        queryPrometheus(
          'avg(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100'
        ),
        queryPrometheus("node_memory_MemAvailable_bytes"),
        queryPrometheus("node_memory_MemTotal_bytes"),
        queryPrometheus('count(container_last_seen{name!=""})'),
        queryPrometheus('up{job="prometheus"}'),
      ]);

    const cpuUsage = cpuIdle === null ? null : 100 - cpuIdle;

    const memoryUsage =
      memoryAvailable === null || memoryTotal === null
        ? null
        : ((memoryTotal - memoryAvailable) / memoryTotal) * 100;

    return Response.json({
      ok: true,
      cpuUsage,
      memoryUsage,
      containersUp,
      prometheusUp,
      ts: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}
