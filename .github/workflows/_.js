/*
 * MUDAU-R Owner & Mods Commands
 * Author: Mudau Thendo (Royal Boy 👑)
 */

const { kord: mudauR, getData, storeData, isAdmin, prefix } = require("../core");

const OWNER_NUMBER = "27799648540@s.whatsapp.net";

// ---------------- Mods List ----------------
mudauR({
  cmd: "mods",
  desc: "Show all current mods",
  fromMe: false,
  type: "user",
  gc: true
}, async (m) => {
  try {
    const data = await getData("mudauR_mods") || {};
    const mods = Object.keys(data);
    if (mods.length === 0) return await m.send("_No mods found!_");
    await m.send(`╭━━★彡 MODS LIST 彡★━━╮\n${mods.map((mod, i) => `★ ${i+1}. ${mod}`).join("\n")}\n╰━━━━━━━━━━━━╯`);
  } catch(e) {
    console.log("Mods list error:", e);
    await m.send("_Something went wrong 😢_");
  }
});

// ---------------- Owner Info ----------------
mudauR({
  cmd: "owner",
  desc: "Show owner number",
  fromMe: false,
  type: "user",
  gc: true
}, async (m) => {
  try {
    await m.send(`★ Owner: Royal Boy 👑\n★ Number: 27799648540`);
  } catch(e) {
    console.log("Owner info error:", e);
    await m.send("_Something went wrong 😢_");
  }
});

// ---------------- Add Mod ----------------
mudauR({
  cmd: "addmod",
  desc: "Add a user as mod",
  fromMe: true,
  type: "user",
  gc: true,
  adminOnly: true
}, async (m, text) => {
  try {
    if (!text) return await m.send("Reply or mention user to add as mod.");
    const target = m.mentionedJid?.[0] || m.quoted?.sender;
    if (!target) return await m.send("_Invalid user!_");

    const data = await getData("mudauR_mods") || {};
    data[target] = true;
    await storeData("mudauR_mods", data);

    await m.send("_User added as MOD ✅_");
  } catch(e) {
    console.log("Add mod error:", e);
    await m.send("_Something went wrong 😢_");
  }
});

// ---------------- Remove Mod ----------------
mudauR({
  cmd: "delmod",
  desc: "Remove a mod",
  fromMe: true,
  type: "user",
  gc: true,
  adminOnly: true
}, async (m, text) => {
  try {
    if (!text) return await m.send("Reply or mention mod to remove.");
    const target = m.mentionedJid?.[0] || m.quoted?.sender;
    const data = await getData("mudauR_mods") || {};
    if (!data[target]) return await m.send("_This user is not a mod!_");

    delete data[target];
    await storeData("mudauR_mods", data);
    await m.send("_User removed from MODS ✅_");
  } catch(e) {
    console.log("Del mod error:", e);
    await m.send("_Something went wrong 😢_");
  }
});

// ---------------- Ban User ----------------
mudauR({
  cmd: "ban",
  desc: "Ban user from using the bot",
  fromMe: true,
  type: "user",
  gc: true,
  adminOnly: true
}, async (m, text) => {
  try {
    if (!text) return await m.send("Reply or mention user to ban.");
    const target = m.mentionedJid?.[0] || m.quoted?.sender;

    const data = await getData("mudauR_bans") || {};
    data[target] = true;
    await storeData("mudauR_bans", data);

    await m.send("_User has been banned ✅_");
  } catch(e) {
    console.log("Ban error:", e);
    await m.send("_Something went wrong 😢_");
  }
});

// ---------------- Unban User ----------------
mudauR({
  cmd: "unban",
  desc: "Unban user",
  fromMe: true,
  type: "user",
  gc: true,
  adminOnly: true
}, async (m, text) => {
  try {
    if (!text) return await m.send("Reply or mention user to unban.");
    const target = m.mentionedJid?.[0] || m.quoted?.sender;

    const data = await getData("mudauR_bans") || {};
    delete data[target];
    await storeData("mudauR_bans", data);

    await m.send("_User has been unbanned ✅_");
  } catch(e) {
    console.log("Unban error:", e);
    await m.send("_Something went wrong 😢_");
  }
});

// ---------------- Bot Join Group ----------------
mudauR({
  cmd: "join",
  desc: "Make bot join a group via invite link",
  fromMe: true,
  type: "user"
}, async (m, text) => {
  try {
    if (!text) return await m.send("Provide invite link!");
    await m.client.joinGroupViaLink(text);
    await m.send("_Joined the group ✅_");
  } catch(e) {
    console.log("Join error:", e);
    await m.send("_Something went wrong 😢_");
  }
});

// ---------------- Bot Leave Group ----------------
mudauR({
  cmd: "leave",
  desc: "Make bot leave a group",
  fromMe: true,
  type: "user",
  gc: true
}, async (m) => {
  try {
    const chatData = await getData("mudauR_mods") || {};
    const mods = Object.keys(chatData);
    if (mods.length === 0) {
      await m.send("_Warning: No mods in this group! Bot will leave in 5 minutes if no mod joins._");
      setTimeout(async () => {
        const updatedData = await getData("mudauR_mods") || {};
        if (Object.keys(updatedData).length === 0) {
          await m.client.groupLeave(m.chat);
        }
      }, 300000); // 5 minutes
    } else {
      await m.client.groupLeave(m.chat);
      await m.send("_Left the group ✅_");
    }
  } catch(e) {
    console.log("Leave error:", e);
    await m.send("_Something went wrong 😢_");
  }
});

// ---------------- Lock/Unlock Command ----------------
mudauR({
  cmd: "lockcmd",
  desc: "Lock a command in the group",
  fromMe: true,
  type: "user",
  gc: true,
  adminOnly: true
}, async (m, text) => {
  try {
    if (!text) return await m.send("Usage: .lockcmd <command>");
    const locked = await getData("mudauR_locked_cmds") || {};
    locked[text.toLowerCase()] = true;
    await storeData("mudauR_locked_cmds", locked);
    await m.send(`_Command ${text} locked ✅_`);
  } catch(e) {
    console.log("Lock cmd error:", e);
    await m.send("_Something went wrong 😢_");
  }
});

mudauR({
  cmd: "unlockcmd",
  desc: "Unlock a command in the group",
  fromMe: true,
  type: "user",
  gc: true,
  adminOnly: true
}, async (m, text) => {
  try {
    if (!text) return await m.send("Usage: .unlockcmd <command>");
    const locked = await getData("mudauR_locked_cmds") || {};
    delete locked[text.toLowerCase()];
    await storeData("mudauR_locked_cmds", locked);
    await m.send(`_Command ${text} unlocked ✅_`);
  } catch(e) {
    console.log("Unlock cmd error:", e);
    await m.send("_Something went wrong 😢_");
  }
}); 
