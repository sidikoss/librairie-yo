# n8n Setup for Librairie YO

This project now emits order events to `/api/n8n-event`:

- `order.created`
- `order.status_changed`

## 1) Import workflows in n8n

Import these files from this repository:

- `docs/n8n/workflows/01-order-created-telegram.json`
- `docs/n8n/workflows/02-order-status-telegram.json`
- `docs/n8n/workflows/03-daily-sales-report-telegram.json`

After import:

1. Set Telegram credentials on each `Telegram` node.
2. Activate the workflows.

## 2) Configure environment variables

### In this app (Vercel or local env)

Set these server-side vars:

- `N8N_WEBHOOK_ORDER_CREATED_URL=https://<your-n8n>/webhook/librairie-yo/order-created`
- `N8N_WEBHOOK_ORDER_STATUS_CHANGED_URL=https://<your-n8n>/webhook/librairie-yo/order-status-changed`
- `N8N_WEBHOOK_SHARED_SECRET=<optional-secret>`

### In n8n runtime env

Used by workflow expressions:

- `TELEGRAM_CHAT_ID=<your-chat-id>`
- `FIREBASE_DB_URL=https://librairie-yo-default-rtdb.firebaseio.com`

## 3) If n8n runs only on your local machine

Expose it publicly for Vercel callbacks (example with Cloudflare Tunnel):

```bash
cloudflared tunnel --url http://localhost:5678
```

Then use the generated `https://...trycloudflare.com` URL in:

- `N8N_WEBHOOK_ORDER_CREATED_URL`
- `N8N_WEBHOOK_ORDER_STATUS_CHANGED_URL`

## 4) Quick checks

Check the relay endpoint:

```bash
curl https://librairie-yo-gui.vercel.app/api/n8n-event
```

Expected: `supportedEvents` and whether URLs are configured.

Send a manual test:

```bash
curl -X POST https://librairie-yo-gui.vercel.app/api/n8n-event \
  -H \"Content-Type: application/json\" \
  -d '{\"event\":\"order.created\",\"data\":{\"orderId\":\"TEST-1\",\"status\":\"pending\",\"total\":10000,\"customer\":{\"name\":\"Test\",\"phone\":\"224600000000\"},\"items\":[{\"title\":\"Book A\",\"qty\":1,\"price\":10000}]}}'
```

