module.exports = {
    name: '.cekstatus',
    description: 'Mengecek status kelulusan via No Daftar atau NIK',
    async execute(sock, remoteJid, args, api, msg) {
        
        const isGroup = remoteJid.endsWith('@g.us');
        
        // 1. Jika di grup, HAPUS PESAN PERINTAHNYA TERLEBIH DAHULU agar NIK tidak terlihat
        if (isGroup) {
            try {
                await sock.sendMessage(remoteJid, { delete: msg.key });
            } catch (err) {
                console.log("Gagal menghapus pesan perintah (Bot mungkin bukan admin):", err);
            }
        }

        // 2. Cek apakah user memberikan argumen
        if (args.length === 0) {
            const msgError = '💡 *Format Salah*\n\nContoh penggunaan:\nKetik *.cekstatus REG-2026123456*\natau\nKetik *.cekstatus 3201234567890001*';
            
            if (isGroup) {
                // Kirim peringatan ke Japri jika salah format di grup
                const sender = msg.key.participant;
                await sock.sendMessage(sender, { text: msgError });
                return;
            }
            return await sock.sendMessage(remoteJid, { text: msgError }, { quoted: msg });
        }

        const keyword = args[0];
        
        // Kirim status "Sedang mencari" (Di Japri jika di grup)
        const targetJid = isGroup ? (msg.key.participant || msg.participant) : remoteJid;
        await sock.sendMessage(targetJid, { text: `🔍 _Sedang mencari data untuk ID: *${keyword}*..._` });

        // Tembak API Laravel
        const res = await api.cekStatusSantri(keyword);
        
        if (!res || !res.success) {
            return await sock.sendMessage(targetJid, { 
                text: `❌ *Data Tidak Ditemukan*\n\nPastikan Nomor Pendaftaran atau 16 digit NIK yang Anda masukkan sudah benar.` 
            });
        }

        // Susun laporan kelulusan
        const c = res.data;
        let text = `🎓 *STATUS SELEKSI PPDB* 🎓\n\n`;
        text += `👤 *Nama:* ${c.nama_lengkap}\n`;
        text += `📝 *No Daftar:* ${c.no_daftar}\n`;
        text += `🎓 *Jenjang:* ${c.jenjang}\n`;
        text += `🪪 *NIK:* ${c.nik || '-'}\n`;
        text += `\n📊 *Status Seleksi:* *${(c.status_seleksi || 'PENDING').toUpperCase()}*\n`;
        
        const statusLower = (c.status_seleksi || '').toLowerCase();
        if (['lulus', 'diterima', 'lulus administrasi', 'approved'].includes(statusLower)) {
            text += `\n📍 *LOKASI TES / WAWANCARA*\n`;
            text += `🚪 Ruang Santri: ${c.santri_room ? c.santri_room.nama_ruangan : 'Menunggu Jadwal'}\n`;
            text += `🚪 Ruang Wali: ${c.wali_room ? c.wali_room.nama_ruangan : 'Menunggu Jadwal'}\n`;
        } else {
            text += `\n_Mohon bersabar, berkas/data Anda sedang dalam antrean review oleh Panitia._\n`;
        }
        
        text += `\n--------------------------------`;

        // 3. Kirim hasil ke Japri
        try {
            await sock.sendMessage(targetJid, { text: text });
            
            // Jika asal mulanya di grup, beri notifikasi singkat di grup
            if (isGroup) {
                const sender = msg.key.participant;
                await sock.sendMessage(remoteJid, { 
                    text: `🔒 Halo @${sender.split('@')[0]},\nHasil pengecekan NIK/No Daftar telah saya kirimkan ke *Pesan Pribadi (Japri)* Anda untuk menjaga privasi data.`,
                    mentions: [sender]
                });
            }
        } catch (err) {
            if (isGroup) {
                await sock.sendMessage(remoteJid, { 
                    text: `⚠️ @${msg.key.participant.split('@')[0]}, Bot tidak bisa mengirim Japri. Silakan chat Bot terlebih dahulu agar jalur pesan terbuka.`,
                    mentions: [msg.key.participant]
                });
            }
        }
    }
};