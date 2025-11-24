// src/server.ts

import { routeAgentRequest, type Schedule } from "agents";
import { AIChatAgent } from "agents/ai-chat-agent";

import {
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet
} from "ai";

import { openai } from "@ai-sdk/openai";
import { processToolCalls, cleanupMessages } from "./utils";
import { tools, executions } from "./tools";
import { ingestFaq } from "./lib/ingest";

// Use OpenAI model (loaded via env)
const model = openai("gpt-4o-mini");

/**
 * Chat Agent implementation
 */
export class Chat extends AIChatAgent<Env> {
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    const allTools = {
      ...tools,
      ...this.mcp.getAITools()
    };

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const cleanedMessages = cleanupMessages(this.messages);

        const processedMessages = await processToolCalls({
          messages: cleanedMessages,
          dataStream: writer,
          tools: allTools,
          executions
        });

        const result = streamText({
          system: `
You are an ecommerce support assistant.

ALWAYS use the "faqSearch" tool first to retrieve relevant answers 
from the FAQ knowledge base stored in Cloudflare Vectorize.
If no FAQ is relevant, reply normally.
          `,
          messages: convertToModelMessages(processedMessages),
          model,
          tools: allTools,
          onFinish: onFinish as unknown as StreamTextOnFinishCallback<
            typeof allTools
          >,
          stopWhen: stepCountIs(10)
        });

        writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }

  async executeTask(description: string, _task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        parts: [{ type: "text", text: `Task run: ${description}` }],
        metadata: { createdAt: new Date() }
      }
    ]);
  }
}

/**
 * Worker entry point
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    const url = new URL(request.url);

    // health check
if (url.pathname === "/check-open-ai-key") {
  const hasKey = Boolean(env.OPENAI_API_KEY);
  return Response.json({ success: hasKey });
}


    // FAQ ingestion endpoint
    // if (url.pathname === "/admin/ingest-faq" && request.method === "POST") {
    //   // return new Response("Not implemented", { status: 501 });
    //   const token = url.searchParams.get("token");
    //   if (token !== env.INGEST_TOKEN) {
    //     return new Response("Unauthorized", { status: 401 });
    //   }

    //   const msg = await ingestFaq(env);
    //   return new Response(msg);
    // }
     if (url.pathname === "/admin/ingest-faq" && request.method === "POST") {
      const token = url.searchParams.get("token");

      if (token !== env.INGEST_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }

      try {
        const msg = await ingestFaq(env);
        return new Response(msg, { status: 200 });
      } catch (err) {
        console.error("Error ingesting FAQ:", err);
        return new Response("Error ingesting FAQ", { status: 500 });
      }
    }


    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
