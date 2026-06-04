module.exports = {
    name: '.brosur',
    description: 'Menampilkan informasi pendaftaran dan brosur PPDB',
    async execute(sock, remoteJid, args, api, msg) {
        
        // Memberikan efek sedang menyiapkan dokumen
        await sock.sendMessage(remoteJid, { text: `📄 _Sedang menyiapkan informasi pendaftaran dan brosur..._` });

        // ==========================================
        // 1. SUSUN PESAN TEKS (CAPTION)
        // ==========================================
        let text = `🏫 *INFORMASI PENDAFTARAN & BROSUR PPDB* 🏫\n\n`;
        text += `Assalamu'alaikum Bapak/Ibu Wali Santri.\n`;
        text += `Terima kasih atas niat baiknya untuk memondokkan putra/putrinya di pesantren kami. 🙏\n\n`;

        text += `📝 *ALUR PENDAFTARAN:*\n`;
        text += `1️⃣ Transfer biaya pendaftaran ke rekening resmi panitia.\n`;
        text += `2️⃣ Konfirmasi pembayaran ke Admin untuk mendapatkan *Token Pendaftaran*.\n`;
        text += `3️⃣ Isi formulir biodata (Bisa otomatis dengan mengetik *.daftar [token]* di chat ini).\n`;
        text += `4️⃣ Hadir ke pondok untuk Tes Wawancara & Lapor Kedatangan.\n\n`;

        text += `_Catatan: Jika Bapak/Ibu ingin bertanya lebih lanjut, silakan ketik *Admin* untuk dihubungkan langsung dengan panitia manusia._`;

        // ==========================================
        // 2. KIRIM GAMBAR BROSUR (LOCAL FILE) + TEKS
        // ==========================================
        try {
            // Path menuju file gambar di dalam folder assets
            const imagePath = './brosur.jpeg';

            await sock.sendMessage(remoteJid, { 
                image: { url: imagePath }, // Membaca file dari memori lokal
                caption: text // Teksnya langsung kita jadikan caption di bawah gambar
            }, { quoted: msg });

        } catch (err) {
            console.error('Gagal mengirim gambar brosur lokal:', err.message);
            // Jika gambarnya tidak ditemukan, kirim teksnya saja sebagai cadangan
            await sock.sendMessage(remoteJid, { text: text }, { quoted: msg });
        }
    }
};