import { readdir, readFile } from "fs/promises";
import path from "path";

const INCIDENT_DIR = path.join(process.cwd(), "..", "docs", "incidents");

export async function GET() {
  try {
    const files = await readdir(INCIDENT_DIR);

    const incidents = await Promise.all(
      files
        .filter((file) => file.endsWith(".log"))
        .sort()
        .reverse()
        .slice(0, 10)
        .map(async (file) => {
          const content = await readFile(path.join(INCIDENT_DIR, file), "utf-8");

          return {
            file,
            content,
          };
        })
    );

    return Response.json({ incidents });
  } catch (error) {
    return Response.json(
      { incidents: [], error: "Could not read incidents" },
      { status: 200 }
    );
  }
}
