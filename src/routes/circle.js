import { Router } from "express";
import { readFile } from "fs/promises";
import admin from "firebase-admin";
import Stopwatch from "timer-stopwatch";

const router = Router();

// Firebase Admin SDK Initialization
const json = await readFile(
  new URL(
    "../../countdown-timer-5d62f-firebase-adminsdk-x2az6-f0b9ce8d6c.json",
    import.meta.url
  )
);

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(json)),
  databaseURL: "https://countdown-timer-5d62f-default-rtdb.firebaseio.com"
});

// Setup end datetime for timer
const seconds = 1000 * 300; // 32 seconds

// Create timer
const timer = new Stopwatch(seconds, { refreshRateMS: 1000 });

// Route to start the timer
router.get("/timer/start", async (req, res) => {
  try {
    if (timer.state == 1) {
      return res.send({
        error: true,
        message: "Fast-Parity Timer is already running",
      });
    }

    let key = null;
    // Send to Firebase every second
    timer.onTime(function (time) {
      const seconds = parseInt(time.ms / 1000);
      // Check if data is already in Firebase
      admin.database().ref("circle/timer").once("value", (snapshot) => {
        if (snapshot.val() == null) {
          key = admin.database().ref("circle/timer").push({
            time: seconds,
          }).key;
        } else {
          if (key !== null) {
            admin
              .database()
              .ref("circle/timer/" + key)
              .update({
                time: seconds,
              });
          }
        }
      });
    });

    // Restart timer after 10 seconds
    timer.onDone(function () {
      setTimeout(async () => {
        admin
          .database()
          .ref("circle/timer")
          .remove()
          .then(() => {
            timer.reset();
            timer.start();
          });
      }, 10000);
    });

    timer.start(); // Start timer
    res.send({
      error: false,
      message: "Fast-Parity Timer started",
    });

  } catch (err) {
    console.log(err);
  }
});

// Route to stop the timer
router.post("/timer/stop", (req, res) => {
  timer.reset();
  timer.stop(); // Stop timer
  admin.database().ref("circle/timer").set(null); // Reset timer to 0 in Firebase
  res.send("Fast-Parity Timer stopped");
});

export default router;
