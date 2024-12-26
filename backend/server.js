const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { OpenAI } = require("langchain/llms/openai");
const { PineconeClient } = require("@pinecone-database/pinecone");
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { VectorStore } = require("langchain/vectorstores/pinecone");
require("dotenv").config();

const app = express();
app.use(express.json());
const upload = multer();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pinecone = new PineconeClient();
(async () => {
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT,
    apiKey: process.env.PINECONE_API_KEY,
  });
})();
const index = pinecone.Index(process.env.PINECONE_INDEX);

// Upload and process PDF
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const pdfBuffer = req.file.buffer;
    const pdfText = await pdfParse(pdfBuffer);

    const pdfLoader = new PDFLoader();
    const documents = await pdfLoader.loadFromBuffer(pdfBuffer);

    const vectorStore = await VectorStore.fromDocuments(documents, openai, {
      pineconeIndex: index,
      textKey: "text",
    });

    res
      .status(200)
      .json({ message: "PDF uploaded and processed successfully!" });
  } catch (error) {
    console.error("Error processing PDF:", error);
    res.status(500).json({ error: "Failed to process PDF" });
  }
});

app.post("/query", async (req, res) => {
  try {
    const { message } = req.body;

    const vectorStore = new VectorStore({ pineconeIndex: index });
    const relevantDocs = await vectorStore.similaritySearch(message, 5);

    const context = relevantDocs.map((doc) => doc.text).join("\n");

    const response = await openai.call({
      prompt: `Context: ${context}\nQuestion: ${message}`,
      max_tokens: 150,
    });

    res.status(200).json({ reply: response.text });
  } catch (error) {
    console.error("Error querying chatbot:", error);
    res.status(500).json({ error: "Failed to query chatbot." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
