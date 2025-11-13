/*
 * MUDAU-R Gambling Module
 * Created by Mudau Thendo
 */

const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected for gambling"))
  .catch(err => console.log("❌ MongoDB error:", err));

const userSchema = new mongoose.Schema({
  id: String,
  wallet: { type: Number, default: 1000 },
  bank: { type: Number, default: 0 },
});

const groupSchema = new mongoose.Schema({
  id: String,
  gambling: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);
const Group = mongoose.model("Group", groupSchema);

// Helpers
async function getUser(id) {
  let user = await User.findOne({ id });
  if (!user) {
    user = new User({ id });
    await user.save();
  }
  return user;
}

async function isGamblingOn(groupId) {
  const group = await Group.findOne({ id: groupId });
  return group?.gambling ?? false;
}

async function toggleGambling(groupId, status) {
  let group = await Group.findOne({ id: groupId });
  if (!group) group = new Group({ id: groupId });
  group.gambling = status;
  await group.save();
  return group.gambling;
}

// Gambling commands handler
async function handleGamblingCommand(m, bot, mods, owners) {
  const text = m.text.trim();
  const args = text.split(" ");
  const cmd = args[0].replace(".", "").toLowerCase();

  // Toggle gambling
  if(cmd === "gambling") {
    if(!mods.includes(m.sender) && !owners.includes(m.sender)) return bot.sendMessage(m.chat, { text: "❌ Only owner/mods can toggle gambling!" });
    if(!args[1] || !["on","off"].includes(args[1].toLowerCase())) return bot.sendMessage(m.chat, { text: "Usage: .gambling on/off" });
    await toggleGambling(m.chat, args[1].toLowerCase() === "on");
    return bot.sendMessage(m.chat, { text: `✅ Gambling is now ${args[1].toUpperCase()}!` });
  }

  if(!await isGamblingOn(m.chat)) return bot.sendMessage(m.chat, { text: "❌ Gambling is OFF for this group." });

  const user = await getUser(m.sender);

  switch(cmd) {
    case "slots":
      const slot = ["🍎","🍌","🍒"];
      const spin = [slot[Math.floor(Math.random()*3)], slot[Math.floor(Math.random()*3)], slot[Math.floor(Math.random()*3)]];
      let reward = 0;
      if(spin[0]===spin[1] && spin[1]===spin[2]) reward = 1000;
      user.wallet += reward;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🎰 ${spin.join(" ")}\nYou won: ${reward}! Wallet: ${user.wallet}` });

    case "dice":
      const dice = Math.floor(Math.random()*6)+1;
      const rewardDice = dice*100;
      user.wallet += rewardDice;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🎲 You rolled a ${dice}! Earned ${rewardDice}. Wallet: ${user.wallet}` });

    case "coinflip|cf":
      const betAmount = parseInt(args[1]) || 100;
      if(user.wallet < betAmount) return bot.sendMessage(m.chat, { text: "❌ Not enough balance!" });
      const coin = Math.random() < 0.5 ? "Heads" : "Tails";
      const win = Math.random() < 0.5;
      user.wallet += win ? betAmount : -betAmount;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🪙 Coinflip: ${coin}! You ${win ? "won" : "lost"} ${betAmount}. Wallet: ${user.wallet}` });

    case "gamble":
      const gambleAmount = parseInt(args[1]) || 100;
      if(user.wallet < gambleAmount) return bot.sendMessage(m.chat, { text: "❌ Not enough balance!" });
      const gambleWin = Math.random() < 0.5;
      user.wallet += gambleWin ? gambleAmount : -gambleAmount;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🎲 Gamble ${gambleWin ? "won" : "lost"} ${gambleAmount}. Wallet: ${user.wallet}` });

    case "bet":
      const bet = parseInt(args[1]) || 50;
      if(user.wallet < bet) return bot.sendMessage(m.chat, { text: "❌ Not enough balance!" });
      const betWin = Math.random() < 0.6;
      user.wallet += betWin ? bet : -bet;
      await user.save();
      return bot.sendMessage(m.chat, { text: `💰 You ${betWin ? "won" : "lost"} ${bet}. Wallet: ${user.wallet}` });

    case "lottery":
      const lotteryWin = Math.random() < 0.05;
      const lotteryPrize = 5000;
      if(lotteryWin) user.wallet += lotteryPrize;
      await user.save();
      return bot.sendMessage(m.chat, { text: lotteryWin ? `🎉 Jackpot! You won ${lotteryPrize}! Wallet: ${user.wallet}` : "❌ No luck this time in the lottery." });

    case "roulette":
      const rouletteAmount = parseInt(args[1]) || 100;
      const color = args[2]?.toLowerCase() || "red";
      if(user.wallet < rouletteAmount) return bot.sendMessage(m.chat, { text: "❌ Not enough balance!" });
      const rouletteWin = Math.random() < 0.5;
      user.wallet += rouletteWin ? rouletteAmount : -rouletteAmount;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🎡 Roulette (${color}): You ${rouletteWin ? "won" : "lost"} ${rouletteAmount}. Wallet: ${user.wallet}` });

    case "blackjack|bj":
      const blackjackWin = Math.random() < 0.5;
      const blackjackAmount = Math.floor(Math.random()*500)+100;
      user.wallet += blackjackWin ? blackjackAmount : -blackjackAmount;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🃏 Blackjack: You ${blackjackWin ? "won" : "lost"} ${blackjackAmount}. Wallet: ${user.wallet}` });

    case "jackpot":
      const jackpotAmount = parseInt(args[1]) || 500;
      const jackpotWin = Math.random() < 0.02;
      if(jackpotWin) user.wallet += jackpotAmount * 20;
      await user.save();
      return bot.sendMessage(m.chat, { text: jackpotWin ? `💎 JACKPOT! You won ${jackpotAmount*20}! Wallet: ${user.wallet}` : "No jackpot this time." });

    case "crash":
      const crashBet = parseInt(args[1]) || 100;
      if(user.wallet < crashBet) return bot.sendMessage(m.chat, { text: "❌ Not enough balance!" });
      const crashMultiplier = Math.random()*5;
      const crashWin = crashBet * crashMultiplier;
      user.wallet += crashWin;
      await user.save();
      return bot.sendMessage(m.chat, { text: `💥 Crash multiplier x${crashMultiplier.toFixed(2)}. You won ${crashWin.toFixed(0)}! Wallet: ${user.wallet}` });

    case "wheel":
      const wheelRewards = [100,200,300,400,500,1000];
      const reward = wheelRewards[Math.floor(Math.random()*wheelRewards.length)];
      user.wallet += reward;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🎡 You spun the wheel and won ${reward}! Wallet: ${user.wallet}` });

    case "highlow|hl":
      const hlBet = parseInt(args[1]) || 100;
      if(user.wallet < hlBet) return bot.sendMessage(m.chat, { text: "❌ Not enough balance!" });
      const guess = args[2]?.toLowerCase() || "high";
      const number = Math.floor(Math.random()*100)+1;
      const hlWin = (guess==="high" && number>50) || (guess==="low" && number<=50);
      user.wallet += hlWin ? hlBet : -hlBet;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🔢 HighLow: Number=${number}, You ${hlWin ? "won" : "lost"} ${hlBet}. Wallet: ${user.wallet}` });

    case "race":
      const raceBet = parseInt(args[1]) || 100;
      if(user.wallet < raceBet) return bot.sendMessage(m.chat, { text: "❌ Not enough balance!" });
      const raceWin = Math.random() < 0.5;
      user.wallet += raceWin ? raceBet*2 : -raceBet;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🏁 Race: You ${raceWin ? "won" : "lost"} ${raceBet}. Wallet: ${user.wallet}` });

    case "coinbet|cb":
      const coinBetAmount = parseInt(args[1]) || 100;
      if(user.wallet < coinBetAmount) return bot.sendMessage(m.chat, { text: "❌ Not enough balance!" });
      const coinBetWin = Math.random() < 0.5;
      user.wallet += coinBetWin ? coinBetAmount : -coinBetAmount;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🪙 Coinbet: You ${coinBetWin ? "won" : "lost"} ${coinBetAmount}. Wallet: ${user.wallet}` });

    case "jackpotclaim|jp":
      const claimAmount = Math.floor(Math.random()*1000)+500;
      const won = Math.random()<0.05;
      if(won) user.wallet += claimAmount;
      await user.save();
      return bot.sendMessage(m.chat, { text: won ? `🎉 Jackpot claim won ${claimAmount}! Wallet: ${user.wallet}` : "❌ Jackpot claim failed." });

    default:
      return bot.sendMessage(m.chat, { text: "Unknown gambling command." });
  }
}

module.exports = { handleGamblingCommand, toggleGambling };
