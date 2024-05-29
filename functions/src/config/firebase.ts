import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

const db = getFirestore();

const entry = db.collection("entries").doc();

const entryObject = {
    id: entry.id,
    title: "entry title here",
    text: "entry text here",
};

entry.set(entryObject);

export { db };