"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  logs: string;
  container: string;
};

export default function LogModal({ open, onClose, logs, container }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[90%] max-w-5xl rounded-xl bg-zinc-900 border border-zinc-800 p-5">

        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">
            Logs – {container}
          </h2>

          <button
            onClick={onClose}
            className="px-3 py-1 border rounded hover:bg-zinc-800"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto rounded bg-black p-3 text-xs text-green-400 font-mono">
          <pre className="whitespace-pre-wrap">{logs}</pre>
        </div>
      </div>
    </div>
  );
}
