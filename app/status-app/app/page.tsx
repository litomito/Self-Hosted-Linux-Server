// Detta är startsidan GET /
// Standard i App Router är server-rendering (bra)
// vilket gör att vi kan läsa process.env direkt här.

export default function Home() {
  // Visar version + slot på startsidan
  // så att du direkt ser om Nginx pekar på blue eller green.
  const version = process.env.APP_VERSION ?? "0.0.0";
  const slot = process.env.SLOT ?? "unknown";

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, lineHeight: 1.6 }}>
      <h1>Self-Healing Linux Status App</h1>

      <p><b>Status:</b> OK</p>
      <p><b>Version:</b> {version}</p>
      <p><b>Slot:</b> {slot}</p>

      <hr style={{ margin: "24px 0" }} />

      <p>
        <b>Endpoints:</b>
      </p>
      <ul>
        <li>
          <code>/health</code> – maskinläsbar healthcheck (används av Docker/monitoring)
        </li>
      </ul>
    </main>
  );
}
