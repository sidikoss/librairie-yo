# Telegram Admin Setup

This project now includes a Telegram admin webhook at:

- `https://<your-domain>/api/telegram-webhook`

## 1) Add Vercel environment variables

Set these env vars in your Vercel project:

- `TELEGRAM_BOT_TOKEN`: token from BotFather
- `TELEGRAM_ADMIN_CHAT_ID`: your Telegram chat id (or private group id)
- `TELEGRAM_WEBHOOK_SECRET`: random secret string (recommended)
- `FIREBASE_DB_URL`: Firebase RTDB base URL (example: `https://librairie-yo-default-rtdb.firebaseio.com`)

## 2) Register Telegram webhook

Run this command after deployment:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://librairie-yo-gui.vercel.app/api/telegram-webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
  }'
```

## 3) Use admin commands in Telegram

Send these commands in your admin chat:

- `/menu` or `/help` -> show full admin menu
- `/stats` -> global stats (pending, approved, revenue)
- `/today` -> summary of today's orders
- `/pending [n]` -> list pending orders with action buttons
- `/approved [n]` -> list approved orders
- `/rejected [n]` -> list rejected orders
- `/recent [n]` -> list latest orders
- `/search <text>` -> search by order id, phone, customer, or reference
- `/order <id>` -> show one order
- `/approve <id>` -> approve one order
- `/reject <id>` -> reject one order

You can also approve/reject directly with inline buttons and refresh cards in place.
