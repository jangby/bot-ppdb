module.exports = {
    name: '.asrama',
    description: 'Informasi perlengkapan dan persiapan mondok',
    async execute(sock, remoteJid, args, api, msg) {
        
        // Memberikan efek sedang mengetik/loading
        await sock.sendMessage(remoteJid, { text: `🧳 _Sedang mengambil daftar perlengkapan asrama dari server..._` });

        // Tarik data dari API Laravel
        const res = await api.getInfoAsrama();
        
        if (!res || !res.success) {
            return await sock.sendMessage(remoteJid, { 
                text: `❌ *Gagal Mengambil Data*\n\nMohon maaf, sistem sedang sibuk atau informasi asrama belum diatur oleh panitia.` 
            }, { quoted: msg });
        }

        const data = res.data;

        // Susun Laporan Teks
        let text = `🏢 *INFO PERSIAPAN ASRAMA / MONDOK* 🏢\n\n`;
        text += `Assalamu'alaikum. Berikut adalah panduan barang bawaan santri baru saat kedatangan ke Pondok Pesantren:\n\n`;

        text += `✅ *PERLENGKAPAN WAJIB DIBAWA:*\n`;
        text += `${data.wajib}\n\n`;

        text += `🚫 *BARANG DILARANG KERAS:*\n`;
        text += `${data.dilarang}\n\n`;

        text += `--------------------------------\n`;
        text += `_📌 Pastikan seluruh barang bawaan (terutama pakaian dan alat mandi) telah diberi nama agar tidak tertukar di asrama._`;

        // Kirim pesan ke WhatsApp
        await sock.sendMessage(remoteJid, { text }, { quoted: msg });
    }
};