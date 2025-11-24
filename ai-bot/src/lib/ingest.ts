// src/lib/ingest.ts
import faqs from "../data/ecommerce_faq.json";

type FAQItem = { question: string; answer: string };
type FAQFile = { questions: FAQItem[] };

export async function ingestFaq(env: Env) {
  const { questions } = faqs as FAQFile;

  const batchSize = 16;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    const texts = batch.map((x) => x.question);

    // 1) embed with OpenAI
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: texts
      })
    });

    // parse and validate response
    const embedJson = (await embeddingResponse.json()) as { data: { embedding: number[] }[] } ;
    const vectors = embedJson.data;

    // 2) build Vectorize objects
    const vectorPayload = batch.map((item, idx) => ({
      id: `faq-${i + idx}`,
      values: vectors[idx].embedding,
      metadata: {
        question: item.question,
        answer: item.answer
      }
    }));

    // 3) insert into Vectorize
    await env.VECTORIZE.upsert(vectorPayload);
  }

  return "FAQ ingestion completed";
}
