import { onRequest } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineSecret } from "firebase-functions/params";
import { db } from "./config/firebase";
import * as express from "express";

const app = express();

app.post("/movies", async (req, res) => {
  try {

    const userId = req.headers['userid'];

    // Extract genre from request body
    const genre = req.body.genre;

    if (!genre) {
      throw new Error("Genre is required.");
    }

    // Initialize Google API Key
    const geminiApiKey = defineSecret('API_KEY');
    const genAI = new GoogleGenerativeAI(geminiApiKey.value());
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create prompt with the genre
    const prompt = `Recommend a list of movies to me based on the ${genre} genre. Only respond with the movie recommendations without adding any other information. Generate new recommendations each time I send a message`;

    // Generate content based on the prompt
    const result = await model.generateContent(prompt);

    // Extract response text
    const response = await result.response;
    const responseText = response.text();

    // Put movie recommendations in an array, remove any newlines, numbering, asterisks, and hyphens
    const movieRecommendations = responseText
      .split('\n')
      .map(movie => movie.replace(/^[\d\*\-]+\.\s*|\*\s*|\-\s*/g, '').trim())
      .filter(movie => movie);

    // Add results to Firestore collection
    const entry = db.collection("movieRecommendationDatabase").doc();
    const entryObject = {
      id: entry.id,
      userId: userId,
      prompt: prompt,
      result: movieRecommendations
    };
    await entry.set(entryObject);

    // Send response
    res.send({ "movie_recommendations": movieRecommendations });

  } catch (error) {
    console.error(error);
    if (error.message === "Genre is required.") {
      res.status(400).send(error.message);
    } else {
      res.status(500).send("Error generating movie recommendations.");
    }
  }
});

// Return all results in the firestore collection
app.get("/history", async (req, res) => {
  try {
    const allEntries = await db.collection("movieRecommendationDatabase").get();
    return res.status(200).json(allEntries.docs);
  } catch (error) {
    return res.status(500).json("We found an error fetching your request!");
  }

});

exports.app = onRequest(app);