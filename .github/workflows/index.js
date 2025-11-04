/* 
 * MUDAU-R WhatsApp Bot
 * Author: Mudau Thendo (Royal Boy 👑)
 */

const { kord } = require("./core");

// Example: a simple ping command to test the bot
kord({
  cmd: "ping",
  desc: "Check if bot is online",
  fromMe: false,
  type: "user",
  gc: true
}, async (m) => {
  await m.send("🏓 Pong! MUDAU-R is online 🩵");
});

// You will later import other command files like:
// require("./commands/royalCards");
// require("./commands/chatbot");
