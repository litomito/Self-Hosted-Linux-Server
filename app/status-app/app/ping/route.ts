// GET /ping
// Extremt enkel endpoint som ibland är skön att ha för snabbtest.
export async function GET() {
  return new Response("OK\n", { status: 200 });
}
