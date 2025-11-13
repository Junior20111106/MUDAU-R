/**
 * protecters.js
 * Single-file Mods & Guards system
 *
 * Commands provided (use your bot prefix, e.g. .):
 *  - .mods                -> show guards & mods (public)
 *  - .addmod <number>     -> add mod (owner only)
 *  - .delmod <number>     -> delete mod (owner only)
 *  - .addguard <number>   -> add guard (owner only)
 *  - .delguard <number>   -> delete guard (owner only)
 *
 * Owner number (as requested): 27799648540
 *
 * Place in: commands/protecters.js
 * Requires: database/mods.json and database/guards.json (auto-created if missing)
 */

const fs = require('fs');
const path = require('path');

const OWNER_NUMBER_RAW = '27799648540'; // as provided
const OWNER_NUMBER = normalizeNumber(OWNER_NUMBER_RAW);

// paths
const DB_DIR = path.join(__dirname, '..', 'database');
const MODS_FILE = path.join(DB_DIR, 'mods.json');
const GUARDS_FILE = path.join(DB_DIR, 'guards.json');

// ensure database folder and files exist
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(MODS_FILE)) fs.writeFileSync(MODS_FILE, JSON.stringify({ mods: [] }, null, 2));
if (!fs.existsSync(GUARDS_FILE)) fs.writeFileSync(GUARDS_FILE, JSON.stringify({ guards: [] }, null, 2));

/* ---------- helpers ---------- */
function normalizeNumber(num) {
  // Accept formats like "2779...", "+2779...", "0799...", etc.
  if (!num) return '';
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
