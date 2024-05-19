import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

const db = getFirestore();

const entry = db.collection("movieRecommendationDatabase").doc();

const entryObject = {};

entry.set(entryObject);

export { db };
