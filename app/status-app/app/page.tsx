// Detta är startsidan GET /
// Standard i App Router är server-rendering (bra)
// vilket gör att vi kan läsa process.env direkt här.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const version = process.env.APP_VERSION ?? "0.0.0";
  const slot = process.env.SLOT ?? "unknown";

  return (
    <main style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Self-Healing Linux Platform</h1>
      <p>Status: OK</p>
      <p>Active slot: {slot}</p>
      <p>Version: {version}</p>
    </main>
  );
}
