"use client";

import { useEffect, useState } from "react";
import LogModal from "./LogModal";

type Container = {
  id: string;
  name: string;
  image: string;
  status: string;
  fullStatus: string;
  ports: string;
  runningFor: string;
};

type ActionResult = {
  ok: boolean;
  name?: string;
  action?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
  logs?: string;
};

export default function ContainerOverview() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [logs, setLogs] = useState("");
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("No container action yet");
  const [loading, setLoading] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/containers", { cache: "no-store" });
      const data = await res.json();

      if (data.ok) {
        setContainers(data.containers || []);
      }
    } catch {
      setContainers([]);
    }
  }

  useEffect(() => {
    load();

    const interval = setInterval(load, 3000);

    return () => clearInterval(interval);
  }, []);

  async function action(
    name: string,
    actionName: "start" | "stop" | "restart" | "logs"
  ) {
    setLoading(`${actionName}:${name}`);

    try {
      const res = await fetch("/api/containers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ name, action: actionName }),
      });

      const data: ActionResult = await res.json();

      if (!data.ok) {
        setResult(`Failed ❌\n${data.error ?? "Unknown error"}`);
        return;
      }

      if (actionName === "logs") {
        setLogs(data.logs || "No logs found");
        setSelected(name);
        setOpen(true);
        return;
      }

      setResult(
        `Success ✅
Command: docker ${data.action} ${data.name}
Stdout:
${data.stdout || "-"}
Stderr:
${data.stderr || "-"}`
      );

      await load();
    } catch (error) {
      setResult(
        `Failed ❌
${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <section>
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Containers</h2>
          <p className="text-sm text-zinc-400">
            Docker container status, actions and logs.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
        >
          Refresh containers
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {containers.map((container) => (
          <ContainerCard
            key={container.id}
            container={container}
            loading={loading}
            onAction={action}
          />
        ))}
      </div>

      <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-xs text-zinc-300">
        {result}
      </pre>

      <LogModal
        open={open}
        onClose={() => setOpen(false)}
        logs={logs}
        container={selected}
      />
    </section>
  );
}

function ContainerCard({
  container,
  loading,
  onAction,
}: {
  container: Container;
  loading: string | null;
  onAction: (
    name: string,
    actionName: "start" | "stop" | "restart" | "logs"
  ) => void;
}) {
  const isRunning = container.status === "running";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">{container.name}</h3>

            <span
              className={
                isRunning
                  ? "rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-300"
                  : "rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-300"
              }
            >
              {container.status}
            </span>
          </div>

          <div className="mt-3 space-y-1 text-sm text-zinc-400">
            <p className="truncate">Image: {container.image}</p>
            <p>Status: {container.fullStatus}</p>
            <p className="truncate">Ports: {container.ports || "-"}</p>
            <p>Running for: {container.runningFor}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <ContainerButton
            label="Start"
            actionName="start"
            container={container.name}
            loading={loading}
            onAction={onAction}
            className="bg-green-600 hover:bg-green-500"
          />

          <ContainerButton
            label="Stop"
            actionName="stop"
            container={container.name}
            loading={loading}
            onAction={onAction}
            className="bg-orange-600 hover:bg-orange-500"
          />

          <ContainerButton
            label="Restart"
            actionName="restart"
            container={container.name}
            loading={loading}
            onAction={onAction}
            className="bg-blue-600 hover:bg-blue-500"
          />

          <ContainerButton
            label="Logs"
            actionName="logs"
            container={container.name}
            loading={loading}
            onAction={onAction}
            className="border border-zinc-700 bg-transparent hover:bg-zinc-800"
          />
        </div>
      </div>
    </div>
  );
}

function ContainerButton({
  label,
  actionName,
  container,
  loading,
  onAction,
  className,
}: {
  label: string;
  actionName: "start" | "stop" | "restart" | "logs";
  container: string;
  loading: string | null;
  onAction: (
    name: string,
    actionName: "start" | "stop" | "restart" | "logs"
  ) => void;
  className: string;
}) {
  const isLoading = loading === `${actionName}:${container}`;

  return (
    <button
      type="button"
      onClick={() => onAction(container, actionName)}
      disabled={loading !== null}
      className={`rounded-lg px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {isLoading ? "Running..." : label}
    </button>
  );
}
