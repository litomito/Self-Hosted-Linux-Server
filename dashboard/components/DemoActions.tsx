"use client";

import { useState } from "react";

type ActionName =
  | "kill_active_slot"
  | "stop_active_slot"
  | "kill_both_slots"
  | "trigger_deploy";

type ActionResponse = {
  ok: boolean;
  action?: string;
  dockerCommand?: string;
  command?: string;
  activeSlot?: string;
  service?: string;
  stdout?: string;
  stderr?: string;
  error?: string;
};

export function DemoActions() {
  const [loadingAction, setLoadingAction] = useState<ActionName | null>(null);
  const [result, setResult] = useState("No action yet");

  async function runAction(action: ActionName) {
    setLoadingAction(action);
    setResult(`Running ${action}...`);

    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
        cache: "no-store",
      });

      const data: ActionResponse = await res.json();

      if (!data.ok) {
        setResult(`Failed ❌\n${data.error ?? "Unknown error"}`);
        return;
      }

      setResult(
        `Success ✅
Action: ${data.action}
Command: ${data.command ?? `docker ${data.dockerCommand} ${data.service}`}
Active slot: ${data.activeSlot ?? "-"}
Stdout:
${data.stdout || "-"}
Stderr:
${data.stderr || "-"}`
      );
    } catch (error) {
      setResult(
        `Fetch failed ❌
${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-red-200">Demo Actions</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Simulate failures and platform operations live.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ActionButton
            label="Kill active"
            action="kill_active_slot"
            loadingAction={loadingAction}
            onRun={runAction}
            className="bg-red-600 hover:bg-red-500"
          />

          <ActionButton
            label="Stop active"
            action="stop_active_slot"
            loadingAction={loadingAction}
            onRun={runAction}
            className="bg-orange-600 hover:bg-orange-500"
          />

          <ActionButton
            label="Kill both slots"
            action="kill_both_slots"
            loadingAction={loadingAction}
            onRun={runAction}
            className="bg-rose-700 hover:bg-rose-600"
          />

          <ActionButton
            label="Trigger deploy"
            action="trigger_deploy"
            loadingAction={loadingAction}
            onRun={runAction}
            className="bg-blue-600 hover:bg-blue-500"
          />
        </div>
      </div>

      <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-300">
        {result}
      </pre>
    </div>
  );
}

function ActionButton({
  label,
  action,
  loadingAction,
  onRun,
  className,
}: {
  label: string;
  action: ActionName;
  loadingAction: ActionName | null;
  onRun: (action: ActionName) => void;
  className: string;
}) {
  const loading = loadingAction === action;
  const disabled = loadingAction !== null;

  return (
    <button
      type="button"
      onClick={() => onRun(action)}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? "Running..." : label}
    </button>
  );
}
