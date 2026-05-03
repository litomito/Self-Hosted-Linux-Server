type HealthData = {
  ok: boolean;
  version: string;
  slot: string;
  ts: string;
};

export function HealthCard({
  title,
  data,
  active,
}: {
  title: string;
  data: HealthData | null;
  active?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{title}</h3>
        <StatusBadge healthy={Boolean(data?.ok)} />
      </div>

      {active && (
        <span className="text-xs text-blue-300 bg-blue-500/10 px-2 py-1 rounded mt-2 inline-block">
          active
        </span>
      )}

      {data ? (
        <div className="text-sm mt-3 space-y-1 text-zinc-300">
          <p>Version: {data.version}</p>
          <p>Slot: {data.slot}</p>
        </div>
      ) : (
        <p className="text-red-400 text-sm mt-2">No response</p>
      )}
    </div>
  );
}

function StatusBadge({ healthy }: { healthy: boolean }) {
  return (
    <span
      className={
        healthy
          ? "text-green-300 bg-green-500/10 px-2 py-1 rounded text-xs"
          : "text-red-300 bg-red-500/10 px-2 py-1 rounded text-xs"
      }
    >
      {healthy ? "healthy" : "down"}
    </span>
  );
}
