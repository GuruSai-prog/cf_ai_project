Here is a **clean, simple, professional README.md** tailored for your Cloudflare project using **Workers + Vectorize + OpenAI**.
It is **easy to understand**, explains **how to run the code**, and meets the **cf_ai_ project requirements**.

You can copy-paste this as **README.md**.

---

# 📘 FAQ Search Chatbot (Cloudflare Workers + Vectorize + OpenAI)

This project is an intelligent FAQ Search Agent built on **Cloudflare Workers**, leveraging:

* **Cloudflare Vectorize** for semantic search
* **OpenAI embeddings** to index FAQ content
* **Fetch-based Worker API**
* **A chat interface using Cloudflare’s Agents SDK**

The bot takes user questions, runs a semantic search against a Vectorize index, and generates natural language answers based on the most relevant FAQ entries.

---

## 🚀 Features

* Vectorized semantic search for FAQ queries
* Embedding-based indexing using OpenAI
* Cloudflare Worker agent with tool-calling
* Simple ingestion endpoint to upload FAQ data
* Fast, serverless chat API

---

# 📦 Project Structure

```
cf_ai_faq_search/
│── src/
│   ├── server.ts           # Worker & agent logic
│   ├── tools.ts            # Tools exposed to the LLM (including FAQ search)
│   ├── lib/
│   │   ├── ingestFaq.ts    # FAQ ingestion + embedding + Vectorize upsert
│   ├── data/
│   │   ├── ecommerce_faq.json
│── public/
│── env.d.ts                # TypeScript Env interface
│── wrangler.toml           # Cloudflare configuration
│── README.md
│── PROMPTS.md
```

---

# 🔧 Prerequisites

Before running the project locally, make sure you have:

* **Node.js 18+**
* **Cloudflare Wrangler CLI**
* Cloudflare account with:

  * Workers enabled
  * Vectorize enabled

Install Wrangler globally if you don’t have it:

```bash
npm install -g wrangler
```

---

# 🔐 Environment Setup

### 1. Create `.dev.vars` inside the project root

```
OPENAI_API_KEY=your_openai_key_here
INGEST_TOKEN=your_custom_ingest_token
```

### 2. Add your Vars to Cloudflare (production)

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put INGEST_TOKEN
```

---

# 🗂️ Create a Vectorize Index

Use the Wrangler command:

```bash
npx wrangler vectorize create faq-index-ecomm --dimensions 1536
```

Make sure your `wrangler.toml` includes:

```toml
[[vectorize]]
binding = "FAQ_INDEX"
index_name = "faq-index-ecomm"
```

---

# 🧠 Ingest FAQ Data

Run the ingestion endpoint (requires your INGEST_TOKEN):

```bash
curl -X POST "http://localhost:8787/admin/ingest-faq?token=YOUR_INGEST_TOKEN"
```

This will:

* Read `ecommerce_faq.json`
* Embed each question using OpenAI
* Upsert vectors into Vectorize

---

# ▶️ Run the Dev Server (Local)

```bash
npm install
npm run dev
```

This starts the Worker at:

```
http://localhost:8787
```

---

# 🌐 Deploy to Cloudflare

```bash
npm run deploy
```

or:

```bash
npx wrangler deploy
```

---

# 🧪 Test the FAQ Search Tool

After deployment or local dev:

```
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is your return policy?"}]}'
```

If everything is working, you should get an answer pulled from **ecommerce_faq.json**.

---

# 🛠️ Troubleshooting

### ❌ “Env does not exist”

Make sure:

* Your `env.d.ts` exports:

```ts
export interface Env {
  OPENAI_API_KEY: string;
  INGEST_TOKEN: string;
  FAQ_INDEX: VectorizeIndex;
}
```

* You **did NOT** import env.d.ts — it is only for TypeScript types.

---

### ❌ Vector search returns empty results

Check if ingestion succeeded:

```bash
npx wrangler vectorize list-vectors faq-index-ecomm --count=5
```

If results show vector IDs → ingestion is working.
