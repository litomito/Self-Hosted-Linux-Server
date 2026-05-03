import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const ROOT_DIR = "/home/server/Self-Hosted-Linux-Server";
const ACTIVE_FILE = `${ROOT_DIR}/infra/nginx/active_upstream.conf`;

const ALLOWED_ACTIONS = [
  "kill_active_slot",
  "stop_active_slot",
  "kill_both_slots",
  "trigger_deploy",
];

async function getActiveSlot() {
  const { stdout } = await execFileAsync("cat", [ACTIVE_FILE]);
  return stdout.includes("upstream_green.conf") ? "green" : "blue";
}

function serviceForSlot(slot: string) {
  return slot === "blue" ? "app_blue" : "app_green";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;

    if (!ALLOWED_ACTIONS.includes(action)) {
      return Response.json(
        { ok: false, error: "Action not allowed" },
        { status: 400 }
      );
    }

    if (action === "trigger_deploy") {
      const { stdout, stderr } = await execFileAsync(
        `${ROOT_DIR}/scripts/deploy.sh`,
        [],
        {
          cwd: ROOT_DIR,
          timeout: 120000,
          maxBuffer: 1024 * 1024 * 5,
        }
      );

      return Response.json({
        ok: true,
        action,
        command: "./scripts/deploy.sh",
        stdout,
        stderr,
      });
    }

    if (action === "kill_both_slots") {
      const { stdout, stderr } = await execFileAsync("docker", [
        "kill",
        "app_blue",
        "app_green",
      ]);

      return Response.json({
        ok: true,
        action,
        dockerCommand: "kill",
        service: "app_blue app_green",
        stdout,
        stderr,
      });
    }

    const activeSlot = await getActiveSlot();
    const service = serviceForSlot(activeSlot);
    const dockerCommand = action === "stop_active_slot" ? "stop" : "kill";

    const { stdout, stderr } = await execFileAsync("docker", [
      dockerCommand,
      service,
    ]);

    return Response.json({
      ok: true,
      action,
      dockerCommand,
      activeSlot,
      service,
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
