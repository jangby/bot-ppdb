module.exports = {
    name: '.stat',
    async execute(sock, remoteJid, args, api) {
        await sock.sendMessage(remoteJid, { text: '⏳ Sedang mengambil data statistik...' });
        
        const data = await api.getStat();
        
        if (data && data.success) {
            let reply = `📊 *STATISTIK PPDB*\n\nTotal Pendaftar: ${data.data.total} Orang\n\n*Per Jenjang:*\n`;
            for (const [jenjang, jumlah] of Object.entries(data.data.jenjang)) {
                reply += `- ${jenjang}: ${jumlah} Santri\n`;
            }
            reply += `\n*Per Status:*\n`;
            for (const [status, jumlah] of Object.entries(data.data.status)) {
                reply += `- ${status}: ${jumlah}\n`;
            }
            await sock.sendMessage(remoteJid, { text: reply });
        } else {
            await sock.sendMessage(remoteJid, { text: '❌ Gagal mengambil data statistik. Pastikan server web menyala.' });
        }
    }
};