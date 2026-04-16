from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import urllib.request
import urllib.error
import os
from dotenv import load_dotenv

load_dotenv()

DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")
HOST = "0.0.0.0"
PORT = 5001

if not DISCORD_WEBHOOK_URL:
    raise ValueError("DISCORD_WEBHOOK_URL is missing")
else:
    print("DISCORD_WEBHOOK_URL =", DISCORD_WEBHOOK_URL)

def send_to_discord(content: str) -> None:
    data = json.dumps({"content": content}).encode("utf-8")

    req = urllib.request.Request(
        DISCORD_WEBHOOK_URL,
        data=data,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "python-discord-webhook-test/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode("utf-8", errors="replace")
            print("Discord response status:", response.status)
            print("Discord response body:", body)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print("Discord HTTPError status:", e.code)
        print("Discord HTTPError body:", error_body)
        raise

class AlertHandler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length)

        try:
            payload = json.loads(raw_body.decode("utf-8"))
            alerts = payload.get("alerts", [])

            if not alerts:
                message = "Alertmanager skickade en alert utan alerts-fält."
            else:
                lines = []

                for alert in alerts:
                    status = alert.get("status", "unknown")
                    labels = alert.get("labels", {})
                    annotations = alert.get("annotations", {})

                    alertname = labels.get("alertname", "unknown")
                    severity = labels.get("severity", "unknown")
                    summary = annotations.get("summary", "No summary")
                    description = annotations.get("description", "No description")

                    lines.append(
                        f"🚨 Alert: {alertname}\n"
                        f"Status: {status}\n"
                        f"Severity: {severity}\n"
                        f"Summary: {summary}\n"
                        f"Description: {description}"
                    )

                message = "\n\n".join(lines)

            send_to_discord(message)

            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok\n")

        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f"error: {e}\n".encode("utf-8"))

    def log_message(self, format: str, *args) -> None:
        return


if __name__ == "__main__":
    server = HTTPServer((HOST, PORT), AlertHandler)
    print(f"Listening on http://{HOST}:{PORT}")
    server.serve_forever()
