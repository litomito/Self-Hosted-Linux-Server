import { readdir, readFile } from "fs/promises";
import path from "path";

export type HealthData = {
  ok: boolean;
  version: string;
  slot: string;
  ts: string;
};

export type Incident = {
  file: string;
  content: string;
};

export type OsUpdate = {
  file: string;
  content: string;
};

const BLUE_HEALTH_URL =
  process.env.BLUE_HEALTH_URL ?? "http://app_blue:3000/health";

const GREEN_HEALTH_URL =
  process.env.GREEN_HEALTH_URL ?? "http://app_green:3000/health";

const LIVE_HEALTH_URL =
  process.env.LIVE_HEALTH_URL ?? "http://nginx/health";

const INCIDENT_DIR =
  process.env.INCIDENT_DIR ??
  "/home/server/Self-Hosted-Linux-Server/docs/incidents";

const OS_UPDATE_DIR =
  process.env.OS_UPDATE_DIR ??
  "/home/server/Self-Hosted-Linux-Server/docs/os-updates";

async function safeFetch(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function readLogFiles(dir: string, limit: number) {
  try {
    const files = await readdir(dir);

    return await Promise.all(
      files
        .filter((file) => file.endsWith(".log"))
        .sort()
        .reverse()
        .slice(0, limit)
        .map(async (file) => {
          const content = await readFile(path.join(dir, file), "utf-8");

          return {
            file,
            content,
          };
        })
    );
  } catch {
    return [];
  }
}

export async function getBlueHealth(): Promise<HealthData | null> {
  return safeFetch(BLUE_HEALTH_URL);
}

export async function getGreenHealth(): Promise<HealthData | null> {
  return safeFetch(GREEN_HEALTH_URL);
}

export async function getLiveHealth(): Promise<HealthData | null> {
  return safeFetch(LIVE_HEALTH_URL);
}

export async function getIncidents(): Promise<Incident[]> {
  return readLogFiles(INCIDENT_DIR, 10);
}

export async function getOsUpdates(): Promise<OsUpdate[]> {
  return readLogFiles(OS_UPDATE_DIR, 5);
}
