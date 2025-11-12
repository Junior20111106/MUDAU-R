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
        アニメ・Sector X 💠
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
