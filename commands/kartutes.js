module.exports = {
    name: '.kartutes',
    description: 'Mengunduh gambar QR Code Kartu Tes',
    async execute(sock, remoteJid, args, api, msg) {
        
        if (args.length === 0) {
            return await sock.sendMessage(remoteJid, { 
                text: '💡 *Format Salah*\n\nKetik: *.kartutes [Nomor Daftar / NIK]*\nContoh: *.kartutes REG-2026123456*' 
            }, { quoted: msg });
        }

        const keyword = args[0];
        await sock.sendMessage(remoteJid, { text: `🪪 _Menyiapkan QR Code Kartu Tes untuk ID: *${keyword}*..._` });

        // Tarik data dari API
        const res = await api.getKartuTes(keyword);
        
        if (!res || !res.success) {
            return await sock.sendMessage(remoteJid, { 
                text: `❌ *Data Tidak Ditemukan*\n\nPastikan Nomor Pendaftaran atau NIK valid.` 
            }, { quoted: msg });
        }

        const data = res.data;
        const caption = `🎓 *KARTU UJIAN DIGITAL* 🎓\n\n👤 *Nama:* ${data.nama_lengkap}\n📝 *No Daftar:* ${data.no_daftar}\n\n_Silakan simpan gambar QR Code di atas dan tunjukkan kepada panitia saat hari H._`;

        // ==========================================
        // SISTEM KEAMANAN PRIVASI KARTU TES (GAMBAR)
        // ==========================================
        const isGroup = remoteJid.endsWith('@g.us');
        const sender = isGroup ? (msg.key.participant || msg.participant) : remoteJid;

        if (isGroup) {
            try {
                // 1. Kirim Gambar ke PM (Japri)
                await sock.sendMessage(sender, { 
                    image: { url: data.file_url },
                    caption: caption
                });
                
                // 2. Beritahu di grup
                await sock.sendMessage(remoteJid, { 
                    text: `🔒 Halo @${sender.split('@')[0]},\nDemi menjaga keamanan dan menghindari penyalahgunaan QR Code ujian Ananda, Kartu Tes telah dikirimkan ke *Pesan Pribadi (Japri)* Anda.\n\n_Silakan cek pesan masuk dari Bot._`,
                    mentions: [sender]
                }, { quoted: msg });
            } catch (err) {
                await sock.sendMessage(remoteJid, { 
                    text: `⚠️ @${sender.split('@')[0]}, Bot tidak dapat mengirimkan gambar Kartu Tes ke Japri Anda (mungkin karena pengaturan privasi WA).\n\nSilakan kirim chat *Ping* ke nomor Bot ini terlebih dahulu, lalu ulangi perintahnya.`,
                    mentions: [sender]
                }, { quoted: msg });
            }
        } else {
            // Jika sudah di PM, kirim gambar langsung seperti biasa
            try {
                await sock.sendMessage(remoteJid, { 
                    image: { url: data.file_url },
                    caption: caption
                }, { quoted: msg });
            } catch (error) {
                console.error("Gagal mengirim Gambar:", error);
                await sock.sendMessage(remoteJid, { 
                    text: `⚠️ *Gagal Mengunduh Gambar*\nSistem gagal memproses QR Code. Coba ulangi beberapa saat lagi.` 
                }, { quoted: msg });
            }
        }
    }
};