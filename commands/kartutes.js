module.exports = {
    name: '.kartutes',
    description: 'Mengunduh file PDF Kartu Ujian Digital',
    async execute(sock, remoteJid, args, api, msg) {
        
        if (args.length === 0) {
            return await sock.sendMessage(remoteJid, { 
                text: '💡 *Format Salah*\n\nContoh:\nKetik *!kartutes REG-2026123456*\natau *!kartutes 3201234567890001*' 
            }, { quoted: msg });
        }

        const keyword = args[0];
        await sock.sendMessage(remoteJid, { text: `⏳ _Memproses pembuatan Kartu Ujian untuk ID: *${keyword}*..._` });

        // 1. Tarik Data URL PDF dari API Laravel
        const res = await api.getKartuTes(keyword);
        
        if (!res || !res.success) {
            return await sock.sendMessage(remoteJid, { 
                text: `❌ *Data Tidak Ditemukan*\n\nPastikan Nomor Pendaftaran atau NIK valid.` 
            }, { quoted: msg });
        }

        const data = res.data;
        const caption = `🎓 *KARTU UJIAN DIGITAL* 🎓\n\n👤 *Nama:* ${data.nama_lengkap}\n📝 *No Daftar:* ${data.no_daftar}\n\n_Silakan simpan gambar QR Code di atas dan tunjukkan kepada panitia saat hari H._`;

        // 2. Kirim sebagai Gambar (Image)
        try {
            await sock.sendMessage(remoteJid, { 
                image: { url: data.file_url },
                caption: caption
            }, { quoted: msg });
        } catch (error) {
            console.error("Gagal mengirim Gambar:", error);
            await sock.sendMessage(remoteJid, { 
                text: `⚠️ *Gagal Mengunduh File*\nServer gagal memproses gambar. Coba ulangi beberapa saat lagi.` 
            }, { quoted: msg });
        }
    }
};