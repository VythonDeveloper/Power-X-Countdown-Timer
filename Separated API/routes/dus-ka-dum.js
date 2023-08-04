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
}, 'second');

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

// Route to start the timer
router.get("/timer/start", async (req, res) => {
  try {
    // checking whether the time is up?
    if (timer.state == 1) {
      return res.send({
        error: true,
        message: "dus-ka-dum Timer is already running",
      });
    }

    // if timer is not started will start here
    let key = null;
    // Send to Firebase every second
    timer.onTime(function (time) {
      const seconds = parseInt(time.ms / 1000);
      // Check if data is already in Firebase
      admin.database().ref("dus-ka-dum/timer").once("value", (snapshot) => {
        if (snapshot.val() == null) {
          key = admin.database().ref("dus-ka-dum/timer").push({
            time: seconds,
            period: getCurrentDateTime(),
          }).key;
        } else {
          if (key !== null) {
            admin
              .database()
              .ref("dus-ka-dum/timer/" + key)
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
      message: "dus-ka-dum Timer started",
    });

  } catch (err) {
    console.log(err);
  }
});

// Route to stop the timer
router.post("/timer/stop", (req, res) => {
  timer.reset();
  timer.stop(); // Stop timer
  admin.database().ref("dus-ka-dum/timer").set(null); // Reset timer to 0 in Firebase
  res.send("dus-ka-dum Timer stopped");
});

export default router;
