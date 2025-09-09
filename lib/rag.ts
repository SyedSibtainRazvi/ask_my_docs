import { getVectorStore } from "./vectorstore";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { formatDocumentsAsString } from "langchain/util/document";

export async function buildRAGChain() {
  const vs = await getVectorStore();
  const retriever = vs.asRetriever({ k: 8 });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Answer strictly from provided context. If not in context, say you don't know. Cite as [doc:{docId} p:{page}].",
    ],
    ["human", "Question: {question}\n\nContext:\n{context}"],
  ]);

  const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.2 });

  return RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);
}
