import { onRequest } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as express from "express";
import { addEntry, getAllEntries } from "./entryController";
import { db } from "./config/firebase";
import * as functions from 'firebase-functions'
// import { log } from "console";

const app = express();

// Initialize Google API Key
// Where can I store this API key on firebase without this manual?
const API_KEY = "AIzaSyBDBX_GREZ1vB0ETo7KEW46JcJ3nPfueyo";
const genAI = new GoogleGenerativeAI(functions.config.api.key);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Define Express route
app.post("/api/movies", async (req, res) => {
  try {
    // Define default prompt
    // const prompt = `Recommend movies to me based on the romance genre. Only
    // respo nd with the movie recommendations without adding any other informat
    // ion. Generate new recommendations each time I send a messsage.`;

    // Extract prompt from request body if available
    const prompt = req.body.prompt;
    console.log("result: ==============>", req.body);

    // Generate content based on the prompt
    const result = await model.generateContent(prompt);

    // Extract response text
    const response = await result.response;
    const text = response.text();
    const entry = db.collection("entries").doc();

    const entryObject = {
      id: entry.id,
      prompt,
      text,
    };

    entry.set(entryObject);

    // Send response
    res.send({ text: text });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating movie recommendations.");
  }
});

app.post("/entries", addEntry);
app.get("/getAllEntries", getAllEntries);

// Export Express app as Firebase Function
exports.app = onRequest(app);
