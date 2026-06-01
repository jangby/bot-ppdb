module.exports = {
    name: '!ping',
    async execute(sock, remoteJid, args, api) {
        await sock.sendMessage(remoteJid, { text: 'Pong! Bot PPDB aktif dan siap melayani.' });
    }
};