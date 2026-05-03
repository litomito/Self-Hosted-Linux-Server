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

const ALLOWED_ACTIONS = ["start", "stop", "restart"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const container = body.container;
    const action = body.action;

    if (!ALLOWED_CONTAINERS.includes(container)) {
      return Response.json(
        { ok: false, error: "Container not allowed" },
        { status: 400 }
      );
    }

    if (!ALLOWED_ACTIONS.includes(action)) {
      return Response.json(
        { ok: false, error: "Action not allowed" },
        { status: 400 }
      );
    }

    const { stdout, stderr } = await execFileAsync("docker", [
      action,
      container,
    ]);

    return Response.json({
      ok: true,
      action,
      container,
      stdout,
      stderr,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
