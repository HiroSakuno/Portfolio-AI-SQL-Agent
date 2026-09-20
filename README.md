# SQL Agent

Single-page workspace for asking questions about a Supabase database through an AI agent and comparing the answers with an embedded Power BI report.

## Rodar localmente

Requer Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Depois, abra o endereço local exibido no terminal. Para verificar a versão de produção:

```bash
npm run build
```

## Configure the integrations

Create a `.env.local` file for local development:

```bash
NEXT_PUBLIC_CHAT_WEBHOOK_URL=https://your-agent.example.com/webhook
NEXT_PUBLIC_POWER_BI_EMBED_URL=https://app.powerbi.com/view?r=your-report-token
NEXT_PUBLIC_SITE_URL=https://your-domain.example.com
```

The chat sends `{ message }` as JSON with a `POST` request to the configured n8n webhook. The webhook response can be plain text or JSON with an `output`, `response`, `message`, `text`, or `answer` field. Keep private Power BI embed tokens and agent credentials on the server; only expose a browser-safe embed URL here.
