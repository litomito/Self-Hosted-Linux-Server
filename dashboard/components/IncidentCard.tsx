type Incident = {
  file: string;
  content: string;
};

export function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500">{incident.file}</p>

      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-zinc-300">
        {incident.content}
      </pre>
    </div>
  );
}
