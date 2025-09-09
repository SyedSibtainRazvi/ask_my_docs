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
  // Increase the number of retrieved documents for better coverage
  const retriever = vs.asRetriever({ k: 12 });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a helpful assistant that answers questions based on the provided context from documents. 
      
      Instructions:
      - If the user greets you (hi, hello, hey, etc.), respond warmly and ask how you can help them with their documents
      - Answer ONLY based on the information provided in the context when asked about document content
      - If the information is not in the context, say "I don't have that information in the provided documents"
      - Be specific and direct in your answers
      - If asked about names, look for any names mentioned in the context
      - If asked about specific details, extract the exact information from the context
      - Always be helpful and friendly
      
      Context: {context}`,
    ],
    ["human", "Question: {question}"],
  ]);

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.1,
  });

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
