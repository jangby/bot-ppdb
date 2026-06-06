module.exports = {
    name: '.cekstatus',
    description: 'Mengecek status kelulusan via No Daftar atau NIK',
    async execute(sock, remoteJid, args, api, msg) {
        
        // Cek apakah user memberikan argumen/kata kunci
        if (args.length === 0) {
            return await sock.sendMessage(remoteJid, { 
                text: '💡 *Format Salah*\n\nContoh penggunaan:\nKetik *.cekstatus REG-2026123456*\natau\nKetik *.cekstatus 3201234567890001* (Menggunakan NIK)' 
            }, { quoted: msg });
        }

        // Ambil argumen pertama sebagai keyword pencarian
        const keyword = args[0];
        
        await sock.sendMessage(remoteJid, { text: `🔍 _Sedang mencari data untuk ID: *${keyword}*..._` });

        // Tembak API Laravel (Menggunakan fungsi yang benar: cekStatusSantri)
        const res = await api.cekStatusSantri(keyword);
        
        if (!res || !res.success) {
            return await sock.sendMessage(remoteJid, { 
                text: `❌ *Data Tidak Ditemukan*\n\nPastikan Nomor Pendaftaran atau 16 digit NIK yang Anda masukkan sudah benar dan tidak ada spasi yang tertinggal.` 
            }, { quoted: msg });
        }

        // Susun laporan kelulusan
        const c = res.data;
        let text = `🎓 *STATUS SELEKSI PPDB* 🎓\n\n`;
        text += `👤 *Nama:* ${c.nama_lengkap}\n`;
        text += `📝 *No Daftar:* ${c.no_daftar}\n`;
        text += `🎓 *Jenjang:* ${c.jenjang}\n`;
        text += `🪪 *NIK:* ${c.nik || '-'}\n`;
        
        text += `\n📊 *Status Seleksi:* *${(c.status_seleksi || 'PENDING').toUpperCase()}*\n`;
        
        // Jika sudah lulus atau diterima, tampilkan lokasi ujiannya
        const statusLower = (c.status_seleksi || '').toLowerCase();
        if (['lulus', 'diterima', 'lulus administrasi', 'approved'].includes(statusLower)) {
            text += `\n📍 *LOKASI TES / WAWANCARA*\n`;
            text += `🚪 Ruang Santri: ${c.santri_room ? c.santri_room.nama_ruangan : 'Menunggu Jadwal'}\n`;
            text += `🚪 Ruang Wali: ${c.wali_room ? c.wali_room.nama_ruangan : 'Menunggu Jadwal'}\n`;
        } else {
            text += `\n_Mohon bersabar, berkas/data Anda sedang dalam antrean review oleh Panitia._\n`;
        }
        
        text += `\n--------------------------------`;

        // ==========================================
        // SISTEM KEAMANAN PRIVASI (ALIHKAN KE JAPRI JIKA DI GRUP)
        // ==========================================
        const isGroup = remoteJid.endsWith('@g.us');
        
        // Tangkap nomor asli pengirim pesan
        const sender = isGroup ? (msg.key.participant || msg.participant) : remoteJid;

        if (isGroup) {
            try {
                // 1. Kirim hasil aslinya ke PM (Japri) pengirim
                await sock.sendMessage(sender, { text: text });
                
                // 2. Kirim notifikasi di Grup untuk memberi tahu bahwa data sudah di-Japri
                await sock.sendMessage(remoteJid, { 
                    text: `🔒 Halo @${sender.split('@')[0]},\nDemi menjaga kerahasiaan NIK dan data pribadi Ananda, hasil pengecekan telah sistem kirimkan ke *Pesan Pribadi (Japri)* Anda.\n\n_Silakan cek pesan masuk dari Bot._`,
                    mentions: [sender]
                }, { quoted: msg });
                
            } catch (err) {
                // Jika gagal japri (biasanya karena orang tua mensetting privasi tolak pesan nomor baru)
                await sock.sendMessage(remoteJid, { 
                    text: `⚠️ @${sender.split('@')[0]}, Bot tidak dapat mengirim pesan Japri kepada Anda.\n\nSilakan kirim chat *Ping* ke nomor Bot ini terlebih dahulu untuk membuka jalur pesan, lalu ulangi perintahnya.`,
                    mentions: [sender]
                }, { quoted: msg });
            }
        } else {
            // Jika sedari awal perintahnya memang diketik di Japri, langsung kirim balasannya
            await sock.sendMessage(remoteJid, { text: text }, { quoted: msg });
        }
    }
};