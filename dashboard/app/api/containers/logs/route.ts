import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const ALLOWED_CONTAINERS = [
  "app_blue",
  "app_green",
  "nginx",
  "prometheus",
  "grafana",
  "node_exporter",
  "cadvisor",
  "loki",
  "promtail",
  "alertmanager",
  "blackbox_exporter",
  "discord_webhook",
];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const container = url.searchParams.get("name");

    if (!container || !ALLOWED_CONTAINERS.includes(container)) {
      return Response.json(
        { ok: false, error: "Container not allowed", logs: "" },
        { status: 400 }
      );
    }

    const { stdout, stderr } = await execFileAsync("docker", [
      "logs",
      "--tail",
      "120",
      container,
    ]);

    return Response.json({
      ok: true,
      container,
      logs: stdout || stderr || "",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        logs: "",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
