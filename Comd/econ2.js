/*
 * MUDAU-R Economy & Gambling System
 * Created by Mudau Thendo
 */

const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected for MUDAU-R economy"))
  .catch(err => console.log("❌ MongoDB error:", err));

// Schemas
const userSchema = new mongoose.Schema({
  id: String,
  wallet: { type: Number, default: 1000 },
  bank: { type: Number, default: 0 },
  inventory: { type: Array, default: [] }
});

const groupSchema = new mongoose.Schema({
  id: String,
  economy: { type: Boolean, default: false }
});

const User = mongoose.model("User", userSchema);
const Group = mongoose.model("Group", groupSchema);

// Helper functions
async function getUser(id) {
  let user = await User.findOne({ id });
  if (!user) {
    user = new User({ id });
    await user.save();
  }
  return user;
}

async function isEconomyOn(groupId) {
  const group = await Group.findOne({ id: groupId });
  return group?.economy ?? false;
}

async function toggleEconomy(groupId, status) {
  let group = await Group.findOne({ id: groupId });
  if (!group) group = new Group({ id: groupId });
  group.economy = status;
  await group.save();
  return group.economy;
}

// Main command handler
async function handleEconomyCommand(m, bot, mods, owners) {
  const text = m.text.trim();
  const args = text.split(" ");
  const cmd = args[0].replace(".", "").toLowerCase();

  if(cmd === "economy") {
    if(!mods.includes(m.sender) && !owners.includes(m.sender)) return bot.sendMessage(m.chat, { text: "❌ Only owner/mods can toggle economy!" });
    if(!args[1] || !["on","off"].includes(args[1].toLowerCase())) return bot.sendMessage(m.chat, { text: "Usage: .economy on/off" });
    await toggleEconomy(m.chat, args[1].toLowerCase() === "on");
    return bot.sendMessage(m.chat, { text: `✅ Economy is now ${args[1].toUpperCase()} for this group!` });
  }

  if(!await isEconomyOn(m.chat)) return bot.sendMessage(m.chat, { text: "❌ Economy is OFF for this group." });

  const user = await getUser(m.sender);

  switch(cmd) {
    case "wallet":
      return bot.sendMessage(m.chat, { text: `💰 Wallet: ${user.wallet}\n🏦 Bank: ${user.bank}` });

    case "bank":
      return bot.sendMessage(m.chat, { text: `🏦 Bank: ${user.bank}\n💰 Wallet: ${user.wallet}` });

    case "lb":
      const top = await User.find().sort({ wallet: -1 }).limit(10);
      let leaderboard = "📜 Top 10 Richest Users:\n";
      top.forEach((u,i) => leaderboard += `${i+1}. ${u.id} - Wallet: ${u.wallet}\n`);
      return bot.sendMessage(m.chat, { text: leaderboard });

    case "give":
      if(!args[1] || !args[2]) return bot.sendMessage(m.chat, { text: "Usage: .give <user> <amount>" });
      const targetId = args[1].replace(/[^0-9]/g,"");
      const giveAmount = parseInt(args[2]);
      if(isNaN(giveAmount) || giveAmount <=0) return bot.sendMessage(m.chat, { text: "Enter a valid amount." });
      if(user.wallet < giveAmount) return bot.sendMessage(m.chat, { text: "❌ Not enough balance!" });
      const target = await getUser(targetId);
      user.wallet -= giveAmount;
      target.wallet += giveAmount;
      await user.save();
      await target.save();
      return bot.sendMessage(m.chat, { text: `✅ You gave ${giveAmount} to ${targetId}. Wallet: ${user.wallet}` });

    case "rob":
      if(!args[1]) return bot.sendMessage(m.chat, { text: "Usage: .rob <user>" });
      const victimId = args[1].replace(/[^0-9]/g,"");
      const victim = await getUser(victimId);
      if(victim.wallet < 100) return bot.sendMessage(m.chat, { text: "❌ Victim has too little money." });
      const stolen = Math.floor(Math.random() * Math.min(victim.wallet,500)) + 50;
      victim.wallet -= stolen;
      user.wallet += stolen;
      await victim.save();
      await user.save();
      return bot.sendMessage(m.chat, { text: `💰 You robbed ${stolen} from ${victimId}! Wallet: ${user.wallet}` });

    case "daily":
      user.wallet += 500;
      await user.save();
      return bot.sendMessage(m.chat, { text: `💎 You claimed daily reward: 500. Wallet: ${user.wallet}` });

    case "work":
      const earn = Math.floor(Math.random()*500)+100;
      user.wallet += earn;
      await user.save();
      return bot.sendMessage(m.chat, { text: `💼 You worked and earned ${earn}. Wallet: ${user.wallet}` });

    case "slots":
      const slot = ["🍎","🍌","🍒"];
      const spin = [slot[Math.floor(Math.random()*3)], slot[Math.floor(Math.random()*3)], slot[Math.floor(Math.random()*3)]];
      let reward = 0;
      if(spin[0]===spin[1] && spin[1]===spin[2]) reward=1000;
      user.wallet += reward;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🎰 ${spin.join(" ")}\nYou won: ${reward}! Wallet: ${user.wallet}` });

    case "dice":
      const dice = Math.floor(Math.random()*6)+1;
      const rewardDice = dice*100;
      user.wallet += rewardDice;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🎲 You rolled a ${dice}! Earned ${rewardDice}. Wallet: ${user.wallet}` });

    case "coinflip":
      const coin = Math.random() < 0.5 ? "Heads" : "Tails";
      const bet = Math.floor(Math.random()*500)+50;
      user.wallet += bet;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🪙 Coinflip: ${coin}! You won ${bet}. Wallet: ${user.wallet}` });

    case "hunt":
      const hunted = Math.floor(Math.random()*300)+50;
      user.wallet += hunted;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🏹 You hunted and earned ${hunted}! Wallet: ${user.wallet}` });

    case "fish":
      const fishMoney = Math.floor(Math.random()*250)+50;
      user.wallet += fishMoney;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🎣 You fished and earned ${fishMoney}. Wallet: ${user.wallet}` });

    case "farm":
      const farmMoney = Math.floor(Math.random()*400)+50;
      user.wallet += farmMoney;
      await user.save();
      return bot.sendMessage(m.chat, { text: `🌾 You farmed and earned ${farmMoney}. Wallet: ${user.wallet}` });

    case "shop":
      return bot.sendMessage(m.chat, { text: `🛒 Shop: buy items using .buy <item>` });

    case "buy":
      return bot.sendMessage(m.chat, { text: `✅ Purchase completed! (Function placeholder)` });

    case "sell":
      return bot.sendMessage(m.chat, { text: `💰 Item sold! (Function placeholder)` });

    default:
      return bot.sendMessage(m.chat, { text: "Unknown economy command." });
  }
}

module.exports = { handleEconomyCommand, toggleEconomy };
