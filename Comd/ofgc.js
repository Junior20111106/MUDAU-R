// ofgc.js
// Command: .ofgc
// Shows the official community link with Royal/Anime-style text
// Created for 🙃🩵JUSTICE BY JUNIOR🩵🙃

module.exports = {
    name: 'ofgc',
    description: 'Shows the official community link with Royal styling',
    alias: ['officialgc', 'community', 'ogc'],
    async execute(m, conn) {
        // m = message object
        // conn = WhatsApp connection/socket

        const replyText = `
╭━━━★彡 アニメ・Sector X 彡★━━━╮
┃ 👑 Official Community 👑
┃
┃ Welcome to the Royal Realm of our Bot! ✨
┃ Here, only the chosen ones gather to explore
┃ the latest updates, secrets, and exclusive content.
┃
┃ 🔹 Join the Office:
┃   https://chat.whatsapp.com/JdCeTIp4tbG8XHAXGWCrcF?mode=wwt
┃
┃ 💠 Stay updated on bot commands, tips, and special events!
┃ 💠 Share your ideas and help the community grow!
┃
┃ アニメ・Sector X awaits you… Are you ready to claim your throne? 👑
╰━━━━━━━━━━━━━━━━━━━━━━╯
`;

        await conn.sendMessage(m.from, { text: replyText }, { quoted: m });
    }
};
