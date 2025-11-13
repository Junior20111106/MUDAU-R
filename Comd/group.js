/*
 * MUDAU-R Games Module (TTT + WCG)
 * Created by Mudau Thendo
 */

const mongoose = require("mongoose");

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected for MUDAU-R games"))
  .catch(err => console.log("❌ MongoDB error:", err));

// Schemas
const wcgSchema = new mongoose.Schema({
  chatId: String,
  players: { type: Array, default: [] },
  question: String,
  answer: String,
  active: { type: Boolean, default: false }
});

const tttSchema = new mongoose.Schema({
  chatId: String,
  board: { type: Array, default: [" ", " ", " ", " ", " ", " ", " ", " ", " "] },
  playerX: String,
  playerO: String,
  turn: String,
  active: { type: Boolean, default: false }
});

const WCG = mongoose.model("WCG", wcgSchema);
const TTT = mongoose.model("TTT", tttSchema);

// --------------------- WCG Handlers ---------------------
async function handleWCG(m, bot) {
  const args = m.text.split(" ");
  const cmd = args[0].replace(".", "").toLowerCase();
  const chatId = m.chat;
  const sender = m.sender;

  switch(cmd) {
    case "wcg":
      // Create game
      if(await WCG.findOne({ chatId, active: true })) return bot.sendMessage(chatId, { text: "❌ A WCG game is already active!" });
      const newGame = new WCG({ chatId, players: [sender], question: "Guess a number 1-10", answer: Math.floor(Math.random()*10)+1, active: true });
      await newGame.save();
      return bot.sendMessage(chatId, { text: `🎮 WCG created! Use .wcgjoin to join.\nQuestion: ${newGame.question}` });

    case "wcgjoin":
      const game = await WCG.findOne({ chatId, active: true });
      if(!game) return bot.sendMessage(chatId, { text: "❌ No active WCG game!" });
      if(game.players.includes(sender)) return bot.sendMessage(chatId, { text: "❌ You already joined!" });
      game.players.push(sender);
      await game.save();
      return bot.sendMessage(chatId, { text: `✅ Player joined! Total players: ${game.players.length}` });

    case "wcgend":
      const endGame = await WCG.findOne({ chatId, active: true });
      if(!endGame) return bot.sendMessage(chatId, { text: "❌ No active WCG game!" });
      endGame.active = false;
      await endGame.save();
      return bot.sendMessage(chatId, { text: "✅ WCG game ended!" });

    default:
      return;
  }
}

// --------------------- TTT Handlers ---------------------
async function handleTTT(m, bot) {
  const args = m.text.split(" ");
  const cmd = args[0].replace(".", "").toLowerCase();
  const chatId = m.chat;
  const sender = m.sender;

  switch(cmd) {
    case "ttt":
      // Create game
      if(await TTT.findOne({ chatId, active: true })) return bot.sendMessage(chatId, { text: "❌ A TTT game is already active!" });
      const newGame = new TTT({ chatId, playerX: sender, turn: sender, active: true });
      await newGame.save();
      return bot.sendMessage(chatId, { text: `🎮 TTT game created! Use .tttjoin to join as player O.` });

    case "tttjoin":
      const game = await TTT.findOne({ chatId, active: true });
      if(!game) return bot.sendMessage(chatId, { text: "❌ No active TTT game!" });
      if(game.playerO) return bot.sendMessage(chatId, { text: "❌ Game already has 2 players!" });
      if(sender === game.playerX) return bot.sendMessage(chatId, { text: "❌ You are already player X!" });
      game.playerO = sender;
      await game.save();
      return bot.sendMessage(chatId, { text: `✅ Player O joined! Game starts.\n${game.playerX}'s turn.` });

    case "tttend":
      const endGame = await TTT.findOne({ chatId, active: true });
      if(!endGame) return bot.sendMessage(chatId, { text: "❌ No active TTT game!" });
      endGame.active = false;
      await endGame.save();
      return bot.sendMessage(chatId, { text: "✅ TTT game ended!" });

    case "tttmove":
      const tttGame = await TTT.findOne({ chatId, active: true });
      if(!tttGame) return bot.sendMessage(chatId, { text: "❌ No active TTT game!" });
      if(sender !== tttGame.turn) return bot.sendMessage(chatId, { text: "❌ Not your turn!" });

      const pos = parseInt(args[1])-1;
      if(isNaN(pos) || pos <0 || pos>8) return bot.sendMessage(chatId, { text: "❌ Invalid position! (1-9)" });
      if(tttGame.board[pos] !== " ") return bot.sendMessage(chatId, { text: "❌ Position already taken!" });

      const symbol = sender === tttGame.playerX ? "X" : "O";
      tttGame.board[pos] = symbol;
      tttGame.turn = sender === tttGame.playerX ? tttGame.playerO : tttGame.playerX;

      // Check win
      const b = tttGame.board;
      const winPatterns = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
      ];
      let winner = null;
      winPatterns.forEach(p => {
        if(b[p[0]]===symbol && b[p[1]]===symbol && b[p[2]]===symbol) winner = sender;
      });

      if(winner){
        tttGame.active = false;
        await tttGame.save();
        return bot.sendMessage(chatId, { text: `🎉 ${winner} wins!\nBoard: ${b.join(" | ")}` });
      }

      // Check draw
      if(!b.includes(" ")){
        tttGame.active = false;
        await tttGame.save();
        return bot.sendMessage(chatId, { text: `🤝 Draw!\nBoard: ${b.join(" | ")}` });
      }

      await tttGame.save();
      return bot.sendMessage(chatId, { text: `Board: ${b.join(" | ")}\nNext turn: ${tttGame.turn}` });

    default:
      return;
  }
}

module.exports = { handleWCG, handleTTT };
