import { Router } from "express";
import { readFile } from "fs/promises";
import admin from "firebase-admin";
import Stopwatch from "timer-stopwatch";
import axios from "axios";

const router = Router();

// Firebase Admin SDK Initialization
const json = await readFile(
  new URL(
    "../../firebase-secret-key.json",
    import.meta.url
  )
);

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(json)),
  databaseURL: "https://game-project-timer-default-rtdb.firebaseio.com"
}, 'dus-ka-dum');

// Get current time period
function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const dateTime = `${year}${month}${date}${hours}${minutes}${seconds}`;
  return dateTime;
}

// Setup end datetime for timer
const seconds = 1000 * 300; // 32 seconds

// Create timer
const timer = new Stopwatch(seconds, { refreshRateMS: 1000 });
let isTimerRunning = false;
let gamePeriod = '';

async function makeGameEntryAPI() {
  gamePeriod = getCurrentDateTime();
  try {
    const formData = new FormData();
    formData.append("period", gamePeriod);
    formData.append("scriptPassword", "ad38b53ef326ef");

    const response = await axios.post("https://vedicpetsclinicandsurgerycentre.com/power-x/apis/dus-ka-dum/game-details-entry.php", formData);
    console.log("API response:", response.data);
  } catch (error) {
    console.error("API error:", error.message);
  }
}

// Route to start the timer
router.get("/timer/start", async (req, res) => {
  try {
    // checking whether the time is up?
    if (timer.state == 1) {
      return res.send({
        error: true,
        message: "Dus-Ka-Dum Timer is already running",
      });
    }

    // if timer is not started will start here
    await admin
      .database()
      .ref("dus-ka-dum/timer")
      .remove();

    // Send to Firebase every second
    timer.onTime(async function (time) {
      const seconds = parseInt(time.ms / 1000);
      // Check if data is already in Firebase
      const snapshot = await admin.database().ref("dus-ka-dum/timer").once("value");
      if (!snapshot.exists()) {
        await makeGameEntryAPI();

        // Use set() to insert data with the custom key
        await admin.database().ref(`dus-ka-dum/timer/${gamePeriod}`).set({
          time: seconds,
          period: gamePeriod,
        });

      } else {
        if (gamePeriod !== null) {
          await admin
            .database()
            .ref(`dus-ka-dum/timer/${gamePeriod}`)
            .update({
              time: seconds,
            });
        }
      }
    });

    // Restart timer after 10 seconds
    timer.onDone(function () {
      setTimeout(async () => {
        await admin
          .database()
          .ref("dus-ka-dum/timer")
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
      message: "Dus-Ka-Dum Timer started",
    });

  } catch (err) {
    console.log(err);
  }
});


// Route to stop the timer
router.get("/timer/stop", async (req, res) => {
  timer.reset();
  timer.stop(); // Stop timer
  await admin.database().ref("dus-ka-dum/timer").set(null); // Reset timer to 0 in Firebase
  res.send({
    error: true,
    message: "Dus-Ka-Dum Timer stopped",
  });
});

export default router;
