import {
  getBlueHealth,
  getGreenHealth,
  getLiveHealth,
  getIncidents,
  getOsUpdates,
} from "@/lib/platform";

export async function GET() {
  const [blue, green, live, incidents, osUpdates] = await Promise.all([
    getBlueHealth(),
    getGreenHealth(),
    getLiveHealth(),
    getIncidents(),
    getOsUpdates(),
  ]);

  return Response.json({
    blue,
    green,
    live,
    incidents,
    osUpdates,
  });
}
