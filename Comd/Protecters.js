const wa = require('@open-wa/wa-automate');
const fs = require('fs');

const DATA_FILE = './roles.json';

// ---------- Fixed Owner ----------
const owner = ['+27799648540']; // Mudau Thendo

// ---------- Roles ----------
let echelon = []; // mods
let nebula = [];  // guards
let commanders = []; // commanders who can broadcast

// Load existing roles from JSON
if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    echelon = data.echelon || [];
    nebula = data.nebula || [];
} else {
    fs.writeFileSync(DATA_FILE, JSON.stringify({echelon, nebula}, null, 2));
}

// Load commanders from separate JSON
if (fs.existsSync('./commanders.json')) {
    commanders = JSON.parse(fs.readFileSync('./commanders.json')).commanders || [];
} else {
    fs.writeFileSync('./commanders.json', JSON.stringify({commanders}, null, 2));
}

// ---------- Save Functions ----------
function saveRoles() {
    fs.writeFileSync(DATA_FILE, JSON.stringify({echelon, nebula}, null, 2));
}
function saveCommanders() {
    fs.writeFileSync('./commanders.json', JSON.stringify({commanders}, null, 2));
}

// ---------- Show Roles Function ----------
function showRoles() {
    let message = `
╔═❖────────────────❖═╗
        アニメ・Sector X 
╚═❖────────────────❖═╝

╭─❖ 👑 𝗢𝘄𝗻𝗲𝗿 👑 ❖─╮
│ ✦ ${owner.join('\n│ ✦ ')}
╰───────────❖───────────╯

╭─❖ ⚔️ 𝗘𝗰𝗵𝗼𝗹𝗼𝗻 ⚔️ ❖─╮
│ ✦ ${echelon.length ? echelon.join('\n│ ✦ ') : '- No mods yet'}
╰───────────❖───────────╯
> Use .addmod to add someone here

╭─❖ 🌌 𝗡𝗲𝗯𝘂𝗹𝗮 🌌 ❖─╮
│ ✦ ${nebula.length ? nebula.join('\n│ ✦ ') : '- No guards yet'}
╰───────────❖───────────╯

╭─❖ ⚔️ Commanders ⚔️ ❖─╮
│ ✦ ${commanders.length ? commanders.join('\n│ ✦ ') : '- No commanders yet'}
╰───────────❖───────────╯
`;
    return message;
}

// ---------- Role Checks ----------
function isOwner(sender) { return owner.includes(sender); }
function isMod(sender) { return echelon.includes(sender); }
function isGuard(sender) { return nebula.includes(sender); }
function isCommander(sender) { return commanders.includes(sender) || isOwner(sender); }

// ---------- Add/Remove Functions ----------
function addMod(number) { if (!echelon.includes(number)) { echelon.push(number); saveRoles(); return `${number} added to Echelon! ⚔️`; } return `${number} is already a mod!`; }
function delMod(number) { if (echelon.includes(number)) { echelon = echelon.filter(x => x !== number); saveRoles(); return `${number} removed from Echelon! ⚔️`; } return `${number} is not a mod!`; }
function addGuard(number) { if (!nebula.includes(number)) { nebula.push(number); saveRoles(); return `${number} added to Nebula! 🌌`; } return `${number} is already a guard!`; }
function delGuard(number) { if (nebula.includes(number)) { nebula = nebula.filter(x => x !== number); saveRoles(); return `${number} removed from Nebula! 🌌`; } return `${number} is not a guard!`; }
function addCommander(number) { if (!commanders.includes(number)) { commanders.push(number); saveCommanders(); return `${number} added as Commander! ⚔️`; } return `${number} is already a commander!`; }
function delCommander(number) { if (commanders.includes(number)) { commanders = commanders.filter(x=>x!==number); saveCommanders(); return `${number} removed from Commanders! ⚔️`; } return `${number} is not a commander!`; }

// ---------- Broadcast Function ----------
async function broadcastToGroups(client, text) {
    const allChats = await client.getAllChats();
    const groupChats = allChats.filter(c => c.isGroup);
    for (let group of groupChats) {
        await client.sendText(group.id, `📢 Commander Broadcast:\n\n${text}`);
    }
}

// ---------- Start Bot ----------
wa.create().then(client => {
    client.onMessage(async msg => {
        const sender = msg.sender.id.split('@')[0];
        const text = msg.body.trim();

        // ---------- Ensure Owner/Guard Presence in Groups ----------
        if (msg.isGroupMsg) {
            const groupParticipants = msg.chat.groupMetadata.participants.map(p => p.id.split('@')[0]);
            if (!groupParticipants.some(p => owner.includes(p)) && !groupParticipants.some(p => nebula.includes(p))) {
                await client.sendText(msg.from, `❌ Bot inactive: No owner or guard in this group.`);
                return;
            }
        }

        // ---------- Everyone Commands ----------
        if (text === '.mods' || text === '.roles') {
            await client.sendText(msg.from, showRoles());
        }
        if (text === '.commanders') {
            await client.sendText(msg.from, `╭─❖ ⚔️ Commanders ⚔️ ❖─╮\n│ ✦ ${commanders.length ? commanders.join('\n│ ✦ ') : '- No commanders yet'}\n╰───────────❖───────────╯`);
        }

        // ---------- Owner Commands ----------
        if (isOwner(sender)) {
            if (text.startsWith('.addmod ')) await client.sendText(msg.from, addMod(text.split(' ')[1]));
            if (text.startsWith('.delmod ')) await client.sendText(msg.from, delMod(text.split(' ')[1]));
            if (text.startsWith('.addguard ')) await client.sendText(msg.from, addGuard(text.split(' ')[1]));
            if (text.startsWith('.delguard ')) await client.sendText(msg.from, delGuard(text.split(' ')[1]));
            if (text.startsWith('.addcommander ')) await client.sendText(msg.from, addCommander(text.split(' ')[1]));
            if (text.startsWith('.delcommander ')) await client.sendText(msg.from, delCommander(text.split(' ')[1]));
        }

        // ---------- Commander Broadcast ----------
        if (isCommander(sender) && text.startsWith('.broadcast ')) {
            const broadcastMessage = text.replace('.broadcast ','');
            await broadcastToGroups(client, broadcastMessage);
            await client.sendText(msg.from, `✅ Broadcast sent to all groups!`);
        }

        // ---------- Mod Commands ----------
        if (isMod(sender)) {
            if (text.startsWith('.join ')) {
                const link = text.split(' ')[1];
                await client.joinGroupViaLink(link);
                await client.sendText(msg.from, `✅ Joined group!`);
            }
            if (text === '.leave') {
                await client.leaveGroup(msg.chatId);
            }
        }

    });
});
function getSenderNumberFromMessage(message) {
  // Try multiple common message shapes used in different bots/baileys versions
  // result returned without '+' and normalized to country code form when possible
  const possible = message?.sender || message?.from || message?.key?.participant || message?.author || message?.pushname;
  if (!possible) return '';
  return normalizeNumber(possible);
}

function isOwner(message) {
  const sender = getSenderNumberFromMessage(message);
  return sender === OWNER_NUMBER || sender === `+${OWNER_NUMBER}` || sender === `0${OWNER_NUMBER.slice(2)}`;
}

/* ---------- command implementations ---------- */

// Build the cheat-style panel text
function buildModsPanel(modsArr, guardsArr) {
  let txt = '';
  txt += '╭━━━★彡 アニメ・Sector X 彡★━━━╮\n';
  txt += '│  👑 Animal Sector X 👑        │\n';
  txt += '│  📌 Mods & Guards             │\n';
  txt += '╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n';

  txt += '🛡️ GUARDS 🛡️\n';
  if (!guardsArr || guardsArr.length === 0) {
    txt += '  None\n\n';
  } else {
    guardsArr.forEach((g, i) => {
      txt += `  [${i + 1}] ${g}\n`;
    });
    txt += '\n';
  }

  txt += '⚔️ MODS ⚔️\n';
  if (!modsArr || modsArr.length === 0) {
    txt += '  None\n\n';
  } else {
    modsArr.forEach((m, i) => {
      txt += `  [${i + 1}] ${m}\n`;
    });
    txt += '\n';
  }

  txt += '──────────────────────────────\n';
  txt += '⚠️ Warning: Do NOT misuse mod powers.\n';
  txt += 'Unauthorized actions can lead to a ban from Animal Sector X bots/community\n';
  txt += '──────────────────────────────';
  return txt;
}

/* ---------- exported command(s) ---------- */

/**
 * Exports a set of command handlers in one file.
 * Many command loaders expect module.exports = { name, run }, but since you
 * asked for everything in one file, this module exposes a `commands` map
 * for flexibility. Your loader may need slight adaptation (check bottom).
 */
module.exports = {
  // primary name to help some loaders
  name: 'protecters',

  // provide a commands map to register individually if your loader supports it
  commands: {
    mods: {
      description: 'Shows list of Mods and Guards (public)',
      run: async (bot, message, args) => {
        try {
          const modsData = readJson(MODS_FILE) || { mods: [] };
          const guardsData = readJson(GUARDS_FILE) || { guards: [] };

          // send panel
          const panel = buildModsPanel(modsData.mods, guardsData.guards);
          await bot.sendMessage(message.from, { text: panel });
        } catch (err) {
          console.error('protecters.mods error:', err);
          await bot.sendMessage(message.from, { text: '❌ Failed to load mods & guards list.' });
        }
      }
    },

    addmod: {
      description: 'Adds a number to the Mods list (owner only)',
      run: async (bot, message, args) => {
        try {
          if (!isOwner(message)) return bot.sendMessage(message.from, { text: '❌ Only the owner can use this.' });
          if (!args[0]) return bot.sendMessage(message.from, { text: '❌ Usage: .addmod <number>' });

          const target = args[0].startsWith('+') ? args[0] : (args[0].startsWith('0') ? args[0] : '+' + args[0]);
          const modsData = readJson(MODS_FILE) || { mods: [] };

          if (modsData.mods.includes(target)) return bot.sendMessage(message.from, { text: '⚠️ This number is already a mod.' });

          modsData.mods.push(target);
          writeJson(MODS_FILE, modsData);

          await bot.sendMessage(message.from, { text: `✅ Added ${target} to Mods list.` });
        } catch (err) {
          console.error('protecters.addmod error:', err);
          await bot.sendMessage(message.from, { text: '❌ Failed to add mod.' });
        }
      }
    },

    delmod: {
      description: 'Deletes a number from the Mods list (owner only)',
      run: async (bot, message, args) => {
        try {
          if (!isOwner(message)) return bot.sendMessage(message.from, { text: '❌ Only the owner can use this.' });
          if (!args[0]) return bot.sendMessage(message.from, { text: '❌ Usage: .delmod <number>' });

          const target = args[0].startsWith('+') ? args[0] : (args[0].startsWith('0') ? args[0] : '+' + args[0]);
          const modsData = readJson(MODS_FILE) || { mods: [] };

          if (!modsData.mods.includes(target)) return bot.sendMessage(message.from, { text: '⚠️ This number is not a mod.' });

          modsData.mods = modsData.mods.filter(n => n !== target);
          writeJson(MODS_FILE, modsData);

          await bot.sendMessage(message.from, { text: `✅ Deleted ${target} from Mods list.` });
        } catch (err) {
          console.error('protecters.delmod error:', err);
          await bot.sendMessage(message.from, { text: '❌ Failed to delete mod.' });
        }
      }
    },

    addguard: {
      description: 'Adds a number to the Guards list (owner only)',
      run: async (bot, message, args) => {
        try {
          if (!isOwner(message)) return bot.sendMessage(message.from, { text: '❌ Only the owner can use this.' });
          if (!args[0]) return bot.sendMessage(message.from, { text: '❌ Usage: .addguard <number>' });

          const target = args[0].startsWith('+') ? args[0] : (args[0].startsWith('0') ? args[0] : '+' + args[0]);
          const guardsData = readJson(GUARDS_FILE) || { guards: [] };

          if (guardsData.guards.includes(target)) return bot.sendMessage(message.from, { text: '⚠️ This number is already a guard.' });

          guardsData.guards.push(target);
          writeJson(GUARDS_FILE, guardsData);

          await bot.sendMessage(message.from, { text: `✅ Added ${target} to Guards list.` });
        } catch (err) {
          console.error('protecters.addguard error:', err);
          await bot.sendMessage(message.from, { text: '❌ Failed to add guard.' });
        }
      }
    },

    delguard: {
      description: 'Deletes a number from the Guards list (owner only)',
      run: async (bot, message, args) => {
        try {
          if (!isOwner(message)) return bot.sendMessage(message.from, { text: '❌ Only the owner can use this.' });
          if (!args[0]) return bot.sendMessage(message.from, { text: '❌ Usage: .delguard <number>' });

          const target = args[0].startsWith('+') ? args[0] : (args[0].startsWith('0') ? args[0] : '+' + args[0]);
          const guardsData = readJson(GUARDS_FILE) || { guards: [] };

          if (!guardsData.guards.includes(target)) return bot.sendMessage(message.from, { text: '⚠️ This number is not a guard.' });

          guardsData.guards = guardsData.guards.filter(n => n !== target);
          writeJson(GUARDS_FILE, guardsData);

          await bot.sendMessage(message.from, { text: `✅ Deleted ${target} from Guards list.` });
        } catch (err) {
          console.error('protecters.delguard error:', err);
          await bot.sendMessage(message.from, { text: '❌ Failed to delete guard.' });
        }
      }
    }
  },

  /**
   * Some command loaders expect a single { name, run } export.
   * For compatibility, export a default run that maps the base command to subcommands:
   * Use: .protecters mods  OR  .protecters addmod <num>  etc.
   * But most of the time you'll want to register each sub-command by name (.mods, .addmod, ...).
   */
  run: async (bot, message, args) => {
    // if user typed .protecters <subcmd> ...
    const sub = (args && args[0]) ? args[0].toLowerCase() : 'mods';
    const subArgs = args.slice(1);
    const cmd = module.exports.commands[sub];
    if (cmd) return cmd.run(bot, message, subArgs);
    // default fallback: show panel
    return module.exports.commands.mods.run(bot, message, []);
  }
};  if (!num) return '';
  let s = String(num).trim();
  // if starts with +, remove it
  if (s.startsWith('+')) s = s.slice(1);
  // if starts with 0 (local), convert to 27 country code (South Africa assumption)
  if (/^0\d+/.test(s)) s = '27' + s.slice(1);
  return s;
}

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function writeJson(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
}

function getSenderNumberFromMessage(message) {
  // Try multiple common message shapes used in different bots/baileys versions
  // result returned without '+' and normalized to country code form when possible
  const possible = message?.sender || message?.from || message?.key?.participant || message?.author || message?.pushname;
  if (!possible) return '';
  return normalizeNumber(possible);
}

function isOwner(message) {
  const sender = getSenderNumberFromMessage(message);
  return sender === OWNER_NUMBER || sender === `+${OWNER_NUMBER}` || sender === `0${OWNER_NUMBER.slice(2)}`;
}

/* ---------- command implementations ---------- */

// Build the cheat-style panel text
function buildModsPanel(modsArr, guardsArr) {
  let txt = '';
  txt += '╭━━━★彡 アニメ・Sector X 彡★━━━╮\n';
  txt += '│  👑 Animal Sector X 👑        │\n';
  txt += '│  📌 Mods & Guards             │\n';
  txt += '╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n';

  txt += '🛡️ GUARDS 🛡️\n';
  if (!guardsArr || guardsArr.length === 0) {
    txt += '  None\n\n';
  } else {
    guardsArr.forEach((g, i) => {
      txt += `  [${i + 1}] ${g}\n`;
    });
    txt += '\n';
  }

  txt += '⚔️ MODS ⚔️\n';
  if (!modsArr || modsArr.length === 0) {
    txt += '  None\n\n';
  } else {
    modsArr.forEach((m, i) => {
      txt += `  [${i + 1}] ${m}\n`;
    });
    txt += '\n';
  }

  txt += '──────────────────────────────\n';
  txt += '⚠️ Warning: Do NOT misuse mod powers.\n';
  txt += 'Unauthorized actions can lead to a ban from Animal Sector X bots/community\n';
  txt += '──────────────────────────────';
  return txt;
}

/* ---------- exported command(s) ---------- */

/**
 * Exports a set of command handlers in one file.
 * Many command loaders expect module.exports = { name, run }, but since you
 * asked for everything in one file, this module exposes a `commands` map
 * for flexibility. Your loader may need slight adaptation (check bottom).
 */
module.exports = {
  // primary name to help some loaders
  name: 'protecters',

  // provide a commands map to register individually if your loader supports it
  commands: {
    mods: {
      description: 'Shows list of Mods and Guards (public)',
      run: async (bot, message, args) => {
        try {
          const modsData = readJson(MODS_FILE) || { mods: [] };
          const guardsData = readJson(GUARDS_FILE) || { guards: [] };

          // send panel
          const panel = buildModsPanel(modsData.mods, guardsData.guards);
          await bot.sendMessage(message.from, { text: panel });
        } catch (err) {
          console.error('protecters.mods error:', err);
          await bot.sendMessage(message.from, { text: '❌ Failed to load mods & guards list.' });
        }
      }
    },

    addmod: {
      description: 'Adds a number to the Mods list (owner only)',
      run: async (bot, message, args) => {
        try {
          if (!isOwner(message)) return bot.sendMessage(message.from, { text: '❌ Only the owner can use this.' });
          if (!args[0]) return bot.sendMessage(message.from, { text: '❌ Usage: .addmod <number>' });

          const target = args[0].startsWith('+') ? args[0] : (args[0].startsWith('0') ? args[0] : '+' + args[0]);
          const modsData = readJson(MODS_FILE) || { mods: [] };

          if (modsData.mods.includes(target)) return bot.sendMessage(message.from, { text: '⚠️ This number is already a mod.' });

          modsData.mods.push(target);
          writeJson(MODS_FILE, modsData);

          await bot.sendMessage(message.from, { text: `✅ Added ${target} to Mods list.` });
        } catch (err) {
          console.error('protecters.addmod error:', err);
          await bot.sendMessage(message.from, { text: '❌ Failed to add mod.' });
        }
      }
    },

    delmod: {
      description: 'Deletes a number from the Mods list (owner only)',
      run: async (bot, message, args) => {
        try {
          if (!isOwner(message)) return bot.sendMessage(message.from, { text: '❌ Only the owner can use this.' });
          if (!args[0]) return bot.sendMessage(message.from, { text: '❌ Usage: .delmod <number>' });

          const target = args[0].startsWith('+') ? args[0] : (args[0].startsWith('0') ? args[0] : '+' + args[0]);
          const modsData = readJson(MODS_FILE) || { mods: [] };

          if (!modsData.mods.includes(target)) return bot.sendMessage(message.from, { text: '⚠️ This number is not a mod.' });

          modsData.mods = modsData.mods.filter(n => n !== target);
          writeJson(MODS_FILE, modsData);

          await bot.sendMessage(message.from, { text: `✅ Deleted ${target} from Mods list.` });
        } catch (err) {
          console.error('protecters.delmod error:', err);
          await bot.sendMessage(message.from, { text: '❌ Failed to delete mod.' });
        }
      }
    },

    addguard: {
      description: 'Adds a number to the Guards list (owner only)',
      run: async (bot, message, args) => {
        try {
          if (!isOwner(message)) return bot.sendMessage(message.from, { text: '❌ Only the owner can use this.' });
          if (!args[0]) return bot.sendMessage(message.from, { text: '❌ Usage: .addguard <number>' });

          const target = args[0].startsWith('+') ? args[0] : (args[0].startsWith('0') ? args[0] : '+' + args[0]);
          const guardsData = readJson(GUARDS_FILE) || { guards: [] };

          if (guardsData.guards.includes(target)) return bot.sendMessage(message.from, { text: '⚠️ This number is already a guard.' });

          guardsData.guards.push(target);
          writeJson(GUARDS_FILE, guardsData);

          await bot.sendMessage(message.from, { text: `✅ Added ${target} to Guards list.` });
        } catch (err) {
          console.error('protecters.addguard error:', err);
          await bot.sendMessage(message.from, { text: '❌ Failed to add guard.' });
        }
      }
    },

    delguard: {
      description: 'Deletes a number from the Guards list (owner only)',
      run: async (bot, message, args) => {
        try {
          if (!isOwner(message)) return bot.sendMessage(message.from, { text: '❌ Only the owner can use this.' });
          if (!args[0]) return bot.sendMessage(message.from, { text: '❌ Usage: .delguard <number>' });

          const target = args[0].startsWith('+') ? args[0] : (args[0].startsWith('0') ? args[0] : '+' + args[0]);
          const guardsData = readJson(GUARDS_FILE) || { guards: [] };

          if (!guardsData.guards.includes(target)) return bot.sendMessage(message.from, { text: '⚠️ This number is not a guard.' });

          guardsData.guards = guardsData.guards.filter(n => n !== target);
          writeJson(GUARDS_FILE, guardsData);

          await bot.sendMessage(message.from, { text: `✅ Deleted ${target} from Guards list.` });
        } catch (err) {
          console.error('protecters.delguard error:', err);
          await bot.sendMessage(message.from, { text: '❌ Failed to delete guard.' });
        }
      }
    }
  },

  /**
   * Some command loaders expect a single { name, run } export.
   * For compatibility, export a default run that maps the base command to subcommands:
   * Use: .protecters mods  OR  .protecters addmod <num>  etc.
   * But most of the time you'll want to register each sub-command by name (.mods, .addmod, ...).
   */
  run: async (bot, message, args) => {
    // if user typed .protecters <subcmd> ...
    const sub = (args && args[0]) ? args[0].toLowerCase() : 'mods';
    const subArgs = args.slice(1);
    const cmd = module.exports.commands[sub];
    if (cmd) return cmd.run(bot, message, subArgs);
    // default fallback: show panel
    return module.exports.commands.mods.run(bot, message, []);
  }
};
