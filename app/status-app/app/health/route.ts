// Next.js App Router route handler.
// Den här filen skapar endpointen GET /health
// Perfekt för Docker healthchecks, Prometheus probes, Nginx checks, osv.

export const runtime = "nodejs"; 
// runtime=nodejs => körs som vanlig Node-server (bra för Docker).
// (Alternativet "edge" kan funka men är onödigt här.)

export async function GET() {
  // Dessa miljövariabler sätter vi senare i Docker Compose
  // så vi kan se vilken release och vilken slot som kör (blue/green).
  const version = process.env.APP_VERSION ?? "0.0.0";
  const slot = process.env.SLOT ?? "unknown";

  // Response.json() skickar JSON med status 200
  // Innehåller ok + version + slot + timestamp => superbra för felsökning.
  return Response.json(
    {
      ok: true,
      version,
      slot,
      ts: new Date().toISOString(),
    },
    { status: 200 }
  );
}
