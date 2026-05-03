const services = [
  {
    name: "Grafana",
    url: "http://192.168.1.170:3005",
    description: "Dashboards, metrics och logs",
  },
  {
    name: "Prometheus",
    url: "http://192.168.1.170:9090",
    description: "Metrics och alert rules",
  },
  {
    name: "Alertmanager",
    url: "http://192.168.1.170:9093",
    description: "Alerts och routing",
  },
  {
    name: "Blackbox Exporter",
    url: "http://192.168.1.170:9115",
    description: "App-level health probing",
  },
  {
    name: "cAdvisor",
    url: "http://192.168.1.170:8080",
    description: "Container metrics",
  },
];

export function ServiceLinks() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {services.map((service) => (
        <a
          key={service.name}
          href={service.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-600 hover:bg-zinc-800"
        >
          <p className="font-semibold">{service.name}</p>
          <p className="mt-1 text-sm text-zinc-400">{service.description}</p>
          <p className="mt-2 text-xs text-blue-300">{service.url}</p>
        </a>
      ))}
    </div>
  );
}
