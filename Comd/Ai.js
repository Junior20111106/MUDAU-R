/* 
 * Mulu Chatbot
 * Created by Mudau Thendo
 */

const { kord, wtype } = require("../core");
const axios = require("axios");
const PREFIX = ".";

// Load API keys from env‑vars (you must set these)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const META_AI_API_KEY = process.env.META_AI_API_KEY; // placeholder

let chatbotStatus = false; // OFF by default

// Utility to call ChatGPT
async function callChatGPT(prompt) {
  const url = "https://api.openai.com/v1/chat/completions";
  try {
    const resp = await axios.post(url, {
      model: "gpt-4o-mini",            // or whichever model you want
      messages: [
        { role: "system", content: "You are Mulu, the royal chatbot assistant." },
        { role: "user", content: prompt }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    return resp.data.choices[0].message.content;
  } catch (err) {
    console.error("ChatGPT API Error:", err.response?.data || err.message);
    return "Sorry, I encountered an error with my brain 🧠.";
  }
}

// Utility placeholder for Meta AI (you must implement based on their docs)
async function callMetaAI(prompt) {
  // Example: Use Meta AI API similar to OpenAI style
  const url = "https://api.meta.ai/v1/…"; // correct endpoint
  try {
    const resp = await axios.post(url, {
      prompt: prompt,
      // …other required params
    }, {
      headers: {
        "Authorization": `Bearer ${META_AI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    return resp.data.result; // adjust based on actual response
  } catch (err) {
    console.error("Meta AI API Error:", err.response?.data || err.message);
    return null;
  }
}

// Command to toggle bot
kord({
  cmd: "chatbot",
  desc: "Turn the chatbot ON or OFF",
  react: "🤖",
  fromMe: wtype,
  type: "command",
}, async (m) => {
  const args = m.text?.trim().split(/\s+/) || [];
  if (args.length < 2) return m.send(`Usage: ${PREFIX}chatbot on/off`);
  const action = args[1].toLowerCase();
  if (action === "on") {
    chatbotStatus = true;
    return m.send("🤖 Mulu Chatbot is now ON 👑⚔️");
  } else if (action === "off") {
    chatbotStatus = false;
    return m.send("🤖 Mulu Chatbot is now OFF 👑⚔️");
  } else {
    return m.send(`Usage: ${PREFIX}chatbot on/off`);
  }
});

// Test command
kord({
  cmd: "aitest",
  desc: "Test if chatbot is working",
  react: "👑",
  fromMe: wtype,
  type: "command",
}, async (m) => {
  if (!chatbotStatus) return m.send("Chatbot is OFF. Use .chatbot on to enable.");
  return m.send("Mulu chatbot is working 👑⚔️");
});

// Main message handler when chatbot is ON
kord({
  cmd: ".*",         // catch‑all
  desc: "AI Chatbot handler",
  react: "💬",
  fromMe: false,
  type: "chat",
}, async (m) => {
  if (!chatbotStatus) return;
  const userMessage = m.text;
  if (!userMessage) return;

  // Choose which AI to call (you can randomize or choose priority)
  let aiResponse = await callChatGPT(userMessage);

  // Optionally fallback to Meta AI if ChatGPT fails or you want multi‑AI
  if (!aiResponse || aiResponse.trim() === "") {
    const metaResp = await callMetaAI(userMessage);
    if (metaResp) aiResponse = metaResp;
  }

  // Final reply
  await m.send(`Mulu 🤖: ${aiResponse} 👑⚔️`);
});
