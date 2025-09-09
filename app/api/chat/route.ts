import { NextRequest } from "next/server";
import { buildRAGChain } from "@/lib/rag";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const question = messages?.at(-1)?.content || "";

    if (!question.trim()) {
      return new Response("No question provided", { status: 400 });
    }

    console.log(`Chat question: ${question}`);

    const chain = await buildRAGChain();
    const response = await chain.invoke(question);

    return new Response(response, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Failed to process chat", { status: 500 });
  }
}
