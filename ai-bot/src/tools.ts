// src/tools.ts

import { tool, type ToolSet } from "ai";
import { env } from "cloudflare:workers";
import { z } from "zod/v3";

// Shape of the OpenAI embeddings response that we care about
type OpenAIEmbeddingResponse = {
  data: { embedding: number[] }[];
};

/**
 * FAQ search tool
 * - Embeds the user's question with OpenAI
 * - Queries the Cloudflare Vectorize index
 * - Returns the most relevant FAQs (question + answer + score)
 */
const faqSearch = tool({
  description:
    "Search the ecommerce FAQ knowledge base stored in Cloudflare Vectorize and return relevant question–answer pairs.",
  inputSchema: z.object({
    query: z.string().describe("The user's natural language question.")
  }),
  // Note the second argument: { env }
  execute: async ({ query }, options) => {

  
  

    // 1) Embed the query using OpenAI
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: [query]
      })
    });

    const embeddingJson =
      (await embeddingResponse.json()) as OpenAIEmbeddingResponse;
    const queryEmbedding = embeddingJson.data[0].embedding;

    // 2) Query Vectorize using the embedding
    const vectorResult = await env.VECTORIZE.query(queryEmbedding, {
      topK: 5,
      returnMetadata: true,
      returnValues: false
    });
    
    const matches =
      vectorResult.matches?.map((m) => ({
        id: m.id,
        score: m.score,
        question: m.metadata?.question as string | undefined,
        answer: m.metadata?.answer as string | undefined
      })) ?? [];

    // 3) Return data for the LLM to use when forming an answer
    return { query, matches: matches?.filter((m) => m.question && m.answer)};
  }
});

export const tools = {
  faqSearch
} satisfies ToolSet;

// We don't have any confirmation-only tools for now
export const executions = {};
