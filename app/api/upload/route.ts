import { NextRequest, NextResponse } from "next/server";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getVectorStore } from "@/lib/vectorstore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const title = (form.get("title") as string) || file?.name || "Document";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    console.log(`Processing PDF: ${title}`);

    // Load PDF using LangChain
    const loader = new WebPDFLoader(file, {
      parsedItemSeparator: "\n\n",
    });
    const docs = await loader.load();

    // Add metadata to each document
    const docsWithMetadata = docs.map((doc) => {
      const docId = crypto.randomUUID();
      return {
        ...doc,
        metadata: {
          ...doc.metadata,
          title,
          docId,
          page:
            doc.metadata?.loc?.pageNumber ??
            doc.metadata?.pdf?.pageNumber ??
            null,
          uploadedAt: new Date().toISOString(),
        },
      };
    });

    // Split documents into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 150,
    });
    const splitDocs = await splitter.splitDocuments(docsWithMetadata);

    console.log(`Split into ${splitDocs.length} chunks`);

    // Get vector store and add documents
    const vs = await getVectorStore();
    await vs.addDocuments(splitDocs);

    console.log(`Successfully uploaded ${title}`);

    return NextResponse.json({
      success: true,
      title,
      chunks: splitDocs.length,
      pages: docs.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}
