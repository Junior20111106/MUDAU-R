/* 
 * the fantastic royal menu
 * Part of MUDAU-R – Royal Menu v2
 */

const { changeFont } = require("../core")
const { prefix, kord, wtype, commands, config, mods, sudos } = require("../core")

const getRandomFont = () => {
  const fonts = ["sansItalic", "monospace"]
  return fonts[Math.floor(Math.random() * fonts.length)]
}

kord({
  cmd: "menu|help",
  desc: "Display the full royal commands menu",
  react: "👑",
  fromMe: wtype,
  type: "help",
}, async (m) => {
  try {
    // Categorize commands
    const types = {}
    commands.forEach(({ cmd, type }) => {
      if (!cmd) return
      const main = cmd.split("|")[0].trim()
      const cat = type || "Other"
      if (!types[cat]) types[cat] = []
      types[cat].push(main)
    })

    const requestedCategory = m.text?.toLowerCase().trim() || null
    const categoryNames = Object.keys(types).map(t => t.toLowerCase())
    const readmore = String.fromCharCode(8206).repeat(4001)

    // Header
    const groupName = m.pushName || "Private Chat"
    const totalMods = mods?.length || 0
    const totalSudos = sudos?.length || 0

    const header = `╔═✦・Sector X 彡✦═╗
┃ Name    : Mulu
┃ Owner   : Mudau thendo
┃ Prefix  : ${prefix}
════════════════════`

    // If specific category requested
    if (requestedCategory && categoryNames.includes(requestedCategory)) {
      const actualCat = Object.keys(types).find(t => t.toLowerCase() === requestedCategory)
      const catTitle = await changeFont(actualCat.toUpperCase(), "monospace")
      const cmds = types[actualCat].map(cmd => `│ ${prefix}${cmd}`).join("\n")
      const styledCmds = await changeFont(cmds, getRandomFont())

      const final = `${header}

╔═✦彡 ${catTitle} 彡✦═╗
${styledCmds}
════════════════════
`
      return m.send(final)
    }

    // Show all categories
    const categoryBlocks = await Promise.all(Object.keys(types).map(async (cat) => {
      const catTitle = await changeFont(cat.toUpperCase(), "monospace")
      const cmds = types[cat].map(c => `│ ${prefix}${c}`).join("\n")
      const styledCmds = await changeFont(cmds, getRandomFont())

      return `
╔═✦彡 ${catTitle} 彡✦═╗
${styledCmds}
════════════════════`
    }))

    const menu = `${header}\n${categoryBlocks.join("\n")}\n\nTip: Use ${prefix}menu [category] for specific commands`
    return m.send(menu)

  } catch (e) {
    console.log("Royal Menu Error:", e)
    return await m.sendErr(e)
  }
})
