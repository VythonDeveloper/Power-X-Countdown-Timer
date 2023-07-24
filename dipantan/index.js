import { Router } from "express";
import { readFile } from "fs/promises";
import admin from "firebase-admin";
import Stopwatch from "timer-stopwatch";
import { calculateResult } from "./firebase.js";
import {
  getCircleResult,
  insertCirclePlayer,
  isCircleRunning,
  getWalletAddBal,
  getWalletWithdrawdBal,
  getRecentCircleRunning,
  updateWalletAddBal,
  updateWalletWithdrawBal,
  insertTransactionHistory,
  getCircleWinner,
  getTotalGamePlayed,
  getLevels,
  getCommisionByLevel,
  getNumberFromReferId,
  updateCommisionWallet,
  insertCommisionHistory,
  getFees,
} from "../../utils/index.js";
import conn from "../../mysql.db.config.js";
import { checkAmount } from "../../middlewares/index.js";

const router = Router();
const json = await readFile(
  new URL(
    "../../flashwin-3b845-firebase-adminsdk-elfgc-8fecb3f2d2.json",
    import.meta.url
  )
);

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(json)),
  databaseURL: "https://smartwin-445e6-default-rtdb.firebaseio.com"
});

//setup end datetime for timer
const seconds = 1000 * 32; //32 seconds

//create timer
const timer = new Stopwatch(seconds, { refreshRateMS: 1000 });

router.get("/", (req, res) => {
  res.send("Hello from circle route");
});

router.get("/timer/start", async (req, res) => {
  try {
    if (timer.state == 1) {
      return res.send({
        error: true,
        message: "Timer is already running",
      });
    }
    admin
      .database()
      .ref("circle/")
      .remove()
      .then(() => {
        admin.database().ref("circle/currentuser").remove();
        calculateResult(admin); // calculate result
        let key = null;
        // send to firebase every second
        timer.onTime(function (time) {
          const seconds = parseInt(time.ms / 1000);
          // check if data is already in firebase
          admin
            .database()
            .ref("circle/timer")
            .once("value", (snapshot) => {
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

        // restart timer after 5 seconds
        timer.onDone(function () {
          setTimeout(async () => {
            admin
              .database()
              .ref("circle/timer")
              .remove()
              .then(() => {
                admin.database().ref("circle/currentuser").remove();
                timer.reset();
                timer.start();
              });
          }, 5000);
        });
        timer.start(); // start timer
        res.send({
          error: false,
          message: "Timer started",
        });
      });
  } catch (err) {
    console.log(err);
  }
  //
});

router.post("/timer/stop", (req, res) => {
  const body = req.body;
  timer.reset();
  timer.stop(); // stop timer
  admin.database().ref("circle/timer").set(null); // reset timer to 0 in firebase
  res.send("timer stopped");
});

router.post("/play", checkAmount, async (req, res) => {

  const colors = ["red", "blue", "orange"];
  const animals = ["lion", "elephant", "cow", "trophy"];

  // 0 to 36 numbers
  const numbers = [
    0,
    "00",
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
  ]

  try {
    const add_bal = await getWalletAddBal(req); // add balance
    const withdraw_bal = await getWalletWithdrawdBal(req); // withdraw balance
    const total_bal = parseFloat(add_bal + withdraw_bal); // total balance

    if (req.session.user) {
      // const { amount, color, number, animal } = req.body;
      const amount = req.body.amount;
      const color = req.body.color?.toLowerCase();
      const number = Number(req.body.number);
      const animal = req.body.animal?.toLowerCase();

      if (!colors.includes(color) && !numbers.includes(number) && !animals.includes(animal)) {
        return res.send({
          error: true,
          message: "Invalid color or number or animal",
        });
      }

      const user_id = req.session.user.number;
      if (amount) {
        if (amount <= total_bal) {
          const game_id = await getRecentCircleRunning();
          const isRunning = await isCircleRunning(game_id);
          if (color || number || animal) {
            if (isRunning) {
              const fees = await getFees("circle");
              // if add balance
              const game_amount = amount - (amount * fees) / 100;

              await insertCirclePlayer(
                game_id,
                user_id,
                animal,
                color,
                number,
                amount,
                game_amount
              );
              // update wallet balance
              if (add_bal >= amount) {
                await updateWalletAddBal(add_bal - amount, req);
              } else if (total_bal === amount) {
                await updateWalletAddBal(0, req);
                await updateWalletWithdrawBal(0, req);
              } else {
                await updateWalletAddBal(0, req);
                await updateWalletWithdrawBal(
                  withdraw_bal - (amount - add_bal),
                  req
                );
              }
              // insert transaction history
              await insertTransactionHistory(
                user_id,
                amount,
                "debit",
                "circle"
              );
              // insert to firebase
              admin.database().ref("circle/currentuser").push({
                game_id,
                user_id,
                animal,
                color,
                number,
                amount,
              });

              const totalGamePlayed = await getTotalGamePlayed(
                req.session.user.number
              );
              if (totalGamePlayed === 100) {
                // task4 done
                const reward = `select task4 from taskreward`;
                conn.query(reward, async (err, result) => {
                  if (err) {
                    console.log(err);
                  }
                  const reward = result[0].task4;
                  await updateWalletWithdrawBal(reward, req);
                  await insertTransactionHistory(
                    req.session.user.number,
                    reward,
                    "credit",
                    "task4"
                  );
                });
              } else if (totalGamePlayed === 1000) {
                // task5 done
                const reward = `select task5 from taskreward`;
                conn.query(reward, async (err, result) => {
                  if (err) {
                    console.log(err);
                  }
                  const reward = result[0].task5;
                  await updateWalletWithdrawBal(reward, req);
                  await insertTransactionHistory(
                    req.session.user.number,
                    reward,
                    "credit",
                    "task5"
                  );
                });
              } else if (totalGamePlayed === 10000) {
                // task6 done
                const reward = `select task6 from taskreward`;
                conn.query(reward, async (err, result) => {
                  if (err) {
                    console.log(err);
                  }
                  const reward = result[0].task6;
                  await updateWalletWithdrawBal(reward, req);
                  await insertTransactionHistory(
                    req.session.user.number,
                    reward,
                    "credit",
                    "task6"
                  );
                });
              }
              const levels = await getLevels(req.session.user.number);
              const { level1, level2, level3 } = levels;
              if (level1) {
                const commision = await getCommisionByLevel("level1");
                const levelNumber = await getNumberFromReferId(level1);
                const total_commision = (amount * commision) / 100;
                await updateCommisionWallet(levelNumber, total_commision); // update commision wallet
                await insertCommisionHistory(
                  levelNumber,
                  total_commision,
                  "level1",
                  level1,
                );
              }
              if (level2) {
                const commision = await getCommisionByLevel("level2");
                const levelNumber = await getNumberFromReferId(level2);
                const total_commision = (amount * commision) / 100;
                await updateCommisionWallet(levelNumber, total_commision);
                await insertCommisionHistory(
                  levelNumber,
                  total_commision,
                  "level2",
                  level2
                );
              }
              if (level3) {
                const commision = await getCommisionByLevel("level3");
                const levelNumber = await getNumberFromReferId(level3);
                const total_commision = (amount * commision) / 100;
                await updateCommisionWallet(levelNumber, total_commision);
                await insertCommisionHistory(
                  levelNumber,
                  total_commision,
                  "level3",
                  level3
                );
              }

              return res.send({
                error: false,
                game_id,
                message: "You have joined the game",
              });
            } else {
              return res.send({
                error: true,
                message: "Game is not running",
              });
            }
          } else {
            return res.send({
              error: true,
              message: "color, number or animal is required",
            });
          }
        } else {
          return res.send({
            error: true,
            message: "Insufficient Balance",
          });
        }
      }
      else {
        return res.send({
          error: true,
          message: "amount is required",
        });
      }
    } else {
      return res.send({
        error: true,
        message: "You are not logged in",
      });
    }
  } catch (err) {
    console.log(err);
  }
});

router.post("/result", async (req, res) => {
  const { game_id } = req.body;
  if (req.session.user) {
    if (game_id) {
      const result = await getCircleResult(game_id, req.session.user.number);
      const winner = await getCircleWinner(game_id);
      if (result || winner) {
        if (winner.is_running == 1) {
          return res.send({
            error: true,
            message: "Game is still running",
          });
        }
        res.send({
          error: false,
          result,
          winner,
        });
      } else {
        res.send({
          error: true,
          message: "game_id is invalid",
        });
      }
    } else {
      res.send({
        error: true,
        message: "game_id is required",
      });
    }
  } else {
    res.send({
      error: true,
      message: "You are not logged in",
    });
  }
});

router.get("/history", async (req, res) => {
  if (req.session.user) {
    const sql = `SELECT
    circle_result.game_id,
      circle_result.winner_color,
      circle_result.winner_animal,
      circle_result.winner_number,
      circle.date,
      circle.user_color,
      circle.user_number,
      circle.user_animal,
      circle.transaction,
      circle.amount,
      circle.actual_amount
      from circle
    inner join circle_result
    on circle.game_id=circle_result.game_id
      where circle.user_id = '${req.session.user.number}'`;
    conn.query(sql, (err, result) => {
      if (err) {
        console.log(err);
        res.send({
          error: true,
          message: "Something went wrong",
        });
      } else {
        res.send({
          error: false,
          result,
        });
      }
    });
  } else {
    res.send({
      error: true,
      message: "You are not logged in",
    });
  }
});

export default router;
