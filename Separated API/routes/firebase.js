// firebase.js

import admin from "firebase-admin";
import { readFile } from "fs/promises";

let firebaseApp; // Global variable to store the Firebase app instance

export async function getFirebaseApp() {
  if (!firebaseApp) {
    const json = await readFile(
      new URL(
        "../../countdown-timer-5d62f-firebase-adminsdk-x2az6-f0b9ce8d6c.json",
        import.meta.url
      )
    );

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(json)),
      databaseURL: "https://countdown-timer-5d62f-default-rtdb.firebaseio.com"
    });
  }

  return firebaseApp;
}
