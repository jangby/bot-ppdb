const config = require('../config');

module.exports = {
    name: '.rekap',
    description: 'Melihat live rekapitulasi statistik PPDB',
    async execute(sock, remoteJid, args, api, msg) {
        
        // Validasi Admin (Anti-LID)
        let senderRaw = msg.key.participantAlt || msg.key.remoteJidAlt || msg.key.participant || msg.participant || msg.key.remoteJid;
        let senderNumber = senderRaw.split('@')[0].split(':')[0];
        const allowedAdmins = config.ADMIN_PPDB.map(num => String(num).trim());

        if (!allowedAdmins.includes(senderNumber)) {
            return await sock.sendMessage(remoteJid, { text: '⛔ *Akses Ditolak*\nPerintah rekap statistik ini hanya bisa diakses oleh Admin PPDB.' }, { quoted: msg });
        }

        await sock.sendMessage(remoteJid, { text: '📊 _Mengunduh data statistik terbaru dari server..._' });

        const res = await api.getStatsPPDB();
        if (!res || !res.success) {
            return await sock.sendMessage(remoteJid, { text: '❌ Gagal mengambil statistik dari server.' });
        }

        let s = res.summary;
        let text = `📊 *LAPORAN LIVE STATISTIK PPDB 2026* 📊\n` +
                   `----------------------------------------\n\n` +
                   `📈 *TOTAL PENDAFTAR:* *${s.total} Anak*\n` +
                   `▪️ Laki-laki: ${s.laki} anak\n` +
                   `▪️ Perempuan: ${s.perempuan} anak\n\n` +
                   `📝 *STATUS PROSES:*\n` +
                   `▪️ Belum Di-review: ${s.pending} anak\n` +
                   `▪️ Lulus Seleksi: *${s.diterima} anak*\n\n` +
                   `🏫 *RINCIAN PER JENJANG:*\n`;

        for (let j of res.jenjang) {
            let namaJenjang = j.jenjang ? j.jenjang : 'Lainnya';
            text += `▪️ ${namaJenjang}: ${j.total} pendaftar\n`;
        }

        text += `\n----------------------------------------\n` +
                `_Data dikirim live dari server database pada ${new Date().toLocaleTimeString('id-ID')} WIB._`;

        await sock.sendMessage(remoteJid, { text });
    }
};