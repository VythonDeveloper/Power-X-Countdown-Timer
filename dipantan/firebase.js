import conn from "../../mysql.db.config.js";
import {
  updateCircleResult,
  startCircle,
  getCircleBonus,
  updateWalletWithdrawBal,
  getWalletWithdrawdBal,
  insertTransactionHistory,
  updateTransactionCircle,
  getCircleWinner,
} from "../../utils/index.js";

export const calculateResult = (admin) => {
  admin
    .database()
    .ref("circle/timer/")
    .on("value", async (snapshot) => {
      const data = snapshot.val() || null;
      if (data) {
        const game_id = Object.keys(data)[0];
        const min = 1;
        const timer = data[game_id].time;
        try {
          const data = [
            { number: 11, color: "orange", animal: "lion" },
            { number: 24, color: "blue", animal: "lion" },
            { number: 18, color: "orange", animal: "lion" },
            { number: 29, color: "blue", animal: "trophy" },
            { number: 2, color: "orange", animal: "trophy" },
            { number: 20, color: "blue", animal: "elephant" },
            { number: 16, color: "orange", animal: "elephant" },
            { number: 32, color: "blue", animal: "elephant" },
            { number: 5, color: "orange", animal: "elephant" },
            { number: 35, color: "blue", animal: "elephant" },
            { number: 3, color: "orange", animal: "elephant" },
            { number: 34, color: "blue", animal: "elephant" },
            { number: 14, color: "orange", animal: "elephant" },
            { number: 0, color: "red", animal: "elephant" },
            { number: 28, color: "orange", animal: "elephant" },
            { number: 15, color: "blue", animal: "elephant" },
            { number: 36, color: "orange", animal: "elephant" },
            { number: 12, color: "blue", animal: "cow" },
            { number: 27, color: "orange", animal: "cow" },
            { number: 8, color: "blue", animal: "cow" },
            { number: 33, color: "orange", animal: "cow" },
            { number: 13, color: "blue", animal: "cow" },
            { number: 30, color: "orange", animal: "cow" },
            { number: 9, color: "blue", animal: "cow" },
            { number: 26, color: "orange", animal: "cow" },
            { number: 4, color: "blue", animal: "cow" },
            { number: 23, color: "orange", animal: "cow" },
            { number: 10, color: "blue", animal: "cow" },
            { number: 21, color: "orange", animal: "cow" },
            { number: 17, color: "blue", animal: "lion" },
            { number: 25, color: "orange", animal: "lion" },
            { number: 6, color: "blue", animal: "lion" },
            { number: 0, color: "red", animal: "lion" },
            { number: 22, color: "blue", animal: "lion" },
            { number: 7, color: "orange", animal: "lion" },
            { number: 19, color: "blue", animal: "lion" },
            { number: 1, color: "orange", animal: "lion" },
            { number: 31, color: "blue", animal: "lion" },
          ];

          /* random index generate */
          // find diff
          let difference = data.length - min;

          // generate random number
          let rand = Math.random();

          // multiply with difference
          rand = Math.floor(rand * difference);

          // add with min value
          rand = rand + min;

          // const animals = await getAnimals();
          // const colors = await getColors();
          // const numbers = await getNumbers();

          // const winnerAnimal = randomizer(animals);
          // const winnerColor = randomizer(colors);
          // const winnerNumber = randomizer(numbers);

          const winnerAnimal = data[rand].animal;
          const winnerColor = data[rand].color;
          const winnerNumber = data[rand].number;

          if (timer == 30) {
            await startCircle(game_id);
          }
          if (timer == 9) {
            await updateCircleResult(
              game_id,
              winnerAnimal,
              winnerColor,
              winnerNumber
            );
          }
          if (timer == 6) {
            // find all rows matching the game_id
            const winner = await getCircleWinner(game_id);

            const winnerAnimal = winner?.winner_animal;
            const winnerColor = winner?.winner_color;
            const winnerNumber = winner?.winner_number;

            const sql = `SELECT * FROM circle WHERE game_id = '${game_id}'`;
            conn.query(sql, async (err, result) => {
              if (err) throw err;
              try {
                if (result.length > 0) {
                  result.map(async (row) => {
                    const {
                      user_id,
                      user_color,
                      user_number,
                      user_animal,
                      amount,
                    } = row;

                    // console.log(winnerAnimal, winnerColor, winnerNumber);
                    // console.log(user_animal, user_color, user_number);

                    const withdraw_bal = await getWalletWithdrawdBal(user_id);
                    if (user_color) {
                      if (user_color === winnerColor) {
                        //update wallet
                        const bonus = await getCircleBonus(user_color);
                        const withdraw_bal_ = await updateWalletWithdrawBal(
                          parseFloat(amount * bonus) + withdraw_bal,
                          user_id
                        );
                        if (withdraw_bal_) {
                          // insert transaction history
                          await insertTransactionHistory(
                            user_id,
                            parseFloat(amount * bonus),
                            "credit",
                            "circle"
                          );
                          await updateTransactionCircle(
                            game_id,
                            user_id,
                            parseFloat(amount * bonus)
                          );
                          console.log("updated wallet");
                        }
                      }
                    }
                    if (user_animal) {
                      if (user_animal === winnerAnimal) {
                        //update wallet
                        const bonus = await getCircleBonus(user_animal);
                        const withdraw_bal_ = await updateWalletWithdrawBal(
                          parseFloat(amount * bonus) + withdraw_bal,
                          user_id
                        );
                        if (withdraw_bal_) {
                          // insert transaction history
                          await insertTransactionHistory(
                            user_id,
                            parseFloat(amount * bonus),
                            "credit",
                            "circle"
                          );
                          await updateTransactionCircle(
                            game_id,
                            user_id,
                            parseFloat(amount * bonus)
                          );
                          console.log("updated wallet");
                        }
                      }
                    }
                    if (user_number) {
                      if (user_number === winnerNumber) {
                        //update wallet
                        const bonus = await getCircleBonus(user_number);
                        const withdraw_bal_ = await updateWalletWithdrawBal(
                          parseFloat(amount * bonus) + withdraw_bal,
                          user_id
                        );
                        if (withdraw_bal_) {
                          // insert transaction history
                          await insertTransactionHistory(
                            user_id,
                            parseFloat(amount * bonus),
                            "credit",
                            "circle"
                          );
                          await updateTransactionCircle(
                            game_id,
                            user_id,
                            parseFloat(amount * bonus)
                          );
                          console.log("updated wallet");
                        }
                      }
                    }
                  });
                }
              } catch (err) {
                console.log(err);
              }
            });
          }
        } catch (err) {
          console.log(err);
        }
      }
    });
};
