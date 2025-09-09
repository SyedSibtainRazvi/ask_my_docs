import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";

let store: PineconeStore | null = null;

export async function getVectorStore() {
  if (store) return store;
  const client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = client.index(process.env.PINECONE_INDEX!);
  store = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings({ model: "text-embedding-3-large" }),
    { pineconeIndex: index }
  );
  return store;
}
