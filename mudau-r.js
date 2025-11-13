// mudau-r.js
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const config = require('./config.env') // We'll load your env here

// Convert env file to JS object
const dotenv = require('dotenv')
dotenv.config()

async function startBot() {
  try {
    // Load authentication
    const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_ID)

    // Create WhatsApp socket
    const sock = makeWASocket({
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      auth: state
    })

    sock.ev.on('creds.update', saveCreds)

    console.log(`🤖 ${config.BOT_NAME} started!`)
    console.log(`👑 Owner: ${config.OWNER_NAME} (${config.OWNER_NUMBER})`)
    console.log(`💬 Prefix: ${config.PREFIX}`)

    // Listen to messages
    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0]
      if (!msg.message || msg.key.fromMe) return

      const sender = msg.key.remoteJid
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text

      if (!text) return

      // Check for prefix
      if (text.startsWith(config.PREFIX)) {
        const command = text.slice(config.PREFIX.length).trim().split(' ')[0]
        const args = text.slice(config.PREFIX.length + command.length).trim()

        switch (command.toLowerCase()) {
          case 'ping':
            await sock.sendMessage(sender, { text: 'Pong!' })
            break
          case 'owner':
            await sock.sendMessage(sender, { text: `Owner: ${config.OWNER_NAME}` })
            break
          default:
            await sock.sendMessage(sender, { text: `Unknown command: ${command}` })
        }
      }
    })

  } catch (err) {
    console.error('❌ Error starting bot:', err)
  }
}

startBot()
