import { onRequest } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineSecret } from "firebase-functions/params";
import { db } from "./config/firebase";
import * as express from "express";

const app = express();

app.post("/getMovies", async (req, res) => {
  try {
    // Initialize Google API Key
    const geminiApiKey = defineSecret('API_KEY');
    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Extract prompt from request body if available
    const prompt = req.body.prompt;

    // Generate content based on the prompt
    const result = await model.generateContent(prompt);

    // Extract response text
    const response = await result.response;
    const movieRecommendations = response.text();

    // Add results to firestore collection
    const entry = db.collection("movieDatabase").doc();
    const entryObject = {
      id: entry.id,
      prompt: prompt,
      result: movieRecommendations,
    };
    entry.set(entryObject);

    // Send response
    res.send({ Recommendations: movieRecommendations });

    // Return error 
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating movie recommendations.");
  }
});

// Return all results in the firestore collection
app.get("/getHistory", async (req, res) => {
  try {
    const allEntries = await db.collection("movieDatabase").get();
    return res.status(200).json(allEntries.docs);
  } catch (error) {
    return res.status(500).json("We found an error fetching your request!");
  }

});

// Export Express app as Firebase Function
exports.app = onRequest(app);
