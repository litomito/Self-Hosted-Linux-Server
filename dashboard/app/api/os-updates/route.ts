import { readdir, readFile } from "fs/promises";
import path from "path";

const OS_UPDATE_DIR = path.join(process.cwd(), "..", "docs", "os-updates");

export async function GET() {
  try {
    const files = await readdir(OS_UPDATE_DIR);

    const updates = await Promise.all(
      files
        .filter((file) => file.endsWith(".log"))
        .sort()
        .reverse()
        .slice(0, 5)
        .map(async (file) => {
          const content = await readFile(path.join(OS_UPDATE_DIR, file), "utf-8");

          return {
            file,
            content,
          };
        })
    );

    return Response.json({ updates });
  } catch {
    return Response.json({ updates: [] }, { status: 200 });
  }
}
