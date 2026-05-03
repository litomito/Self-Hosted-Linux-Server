type OsUpdate = {
  file: string;
  content: string;
};

export function OsUpdateCard({ update }: { update: OsUpdate }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500">{update.file}</p>

      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-zinc-300">
        {update.content}
      </pre>
    </div>
  );
}
