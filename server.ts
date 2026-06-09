import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client using server-side key
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined. Features requiring Gemini API might fail.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// API Route for modifying/refactoring the Java Digital Diary code via Gemini
app.post("/api/java-code/generate", async (req, res) => {
  const { prompt, files } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  const ai = getAiClient();
  if (!ai) {
    return res.status(503).json({
      error: "Gemini API client is not configured. Please set GEMINI_API_KEY in the secrets panel."
    });
  }

  try {
    const formattedFiles = Object.entries(files || {})
      .map(([filename, content]) => `=== FILE: ${filename} ===\n${content}`)
      .join("\n\n");

    const systemInstruction = `You are an expert Java and MySQL software architect.
Your task is to modify the provided Java Digital Diary project files based on the user's instructions.
Always preserve standard Java conventions and best practices for Swing UI, JDBC, and object-oriented design.

You MUST return a JSON array containing the updated files, with their filename and newContent.
Ensure you return all major files (even if unchanged, or slightly modified to stay in sync), so the project remains fully functional.
Strictly adhere to the following JSON structure:
[
  {
    "filename": "schema.sql",
    "newContent": "... updated content ..."
  },
  {
    "filename": "DatabaseConnection.java",
    "newContent": "... updated content ..."
  },
  ...
]

Do not return any conversational text, markdown wrapping (other than pure JSON inside the text), or extra characters. Only return valid JSON matching this schema description.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Apply this instruction to the Java/MySQL Swing project:
${prompt}

Here are the current files:
${formattedFiles}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              filename: {
                type: Type.STRING,
                description: "The name of the file (e.g. DiaryDAO.java)"
              },
              newContent: {
                type: Type.STRING,
                description: "The complete updated source code content of the file."
              }
            },
            required: ["filename", "newContent"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini.");
    }

    const updatedFiles = JSON.parse(text);
    return res.json({ success: true, files: updatedFiles });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    return res.status(500).json({
      error: "Failed to generate Java code modifications: " + (error.message || error)
    });
  }
});

// Serve health status
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// Configure Vite middleware or serve static dist
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server is listening on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Vite failed to initialize:", err);
});
