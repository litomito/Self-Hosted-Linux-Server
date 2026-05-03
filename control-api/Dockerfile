FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY discord_webhook.py .

EXPOSE 5001

CMD ["python", "discord_webhook.py"]
