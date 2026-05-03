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
  "dashboard",
];

const ALLOWED_ACTIONS = ["start", "stop", "restart", "logs"];

export async function GET() {
  try {
    const { stdout } = await execFileAsync("docker", [
      "ps",
      "-a",
      "--format",
      "{{json .}}",
    ]);

    const containers = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const c = JSON.parse(line);

        return {
          id: c.ID,
          name: c.Names,
          image: c.Image,
          status: c.State,
          fullStatus: c.Status,
          ports: c.Ports || "-",
          runningFor: c.RunningFor,
        };
      })
      .filter((container) => ALLOWED_CONTAINERS.includes(container.name));

    return Response.json({
      ok: true,
      containers,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        containers: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = body.name ?? body.container;
    const action = body.action;

    if (!ALLOWED_CONTAINERS.includes(name)) {
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

    if (action === "logs") {
      const { stdout, stderr } = await execFileAsync("docker", [
        "logs",
        "--tail",
        "120",
        name,
      ]);

      return Response.json({
        ok: true,
        name,
        action,
        logs: stdout || stderr || "No logs found",
      });
    }

    const { stdout, stderr } = await execFileAsync("docker", [action, name]);

    return Response.json({
      ok: true,
      name,
      action,
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
