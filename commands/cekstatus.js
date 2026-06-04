module.exports = {
    name: '.cekstatus',
    description: 'Mengecek status kelulusan via No Daftar atau NIK',
    async execute(sock, remoteJid, args, api, msg) {
        
        // Cek apakah user memberikan argumen/kata kunci
        if (args.length === 0) {
            return await sock.sendMessage(remoteJid, { 
                text: '💡 *Format Salah*\n\nContoh penggunaan:\nKetik *!cekstatus REG-2026123456*\natau\nKetik *!cekstatus 3201234567890001* (Menggunakan NIK)' 
            }, { quoted: msg });
        }

        // Ambil argumen pertama sebagai keyword pencarian
        const keyword = args[0];
        
        await sock.sendMessage(remoteJid, { text: `🔍 _Sedang mencari data untuk ID: *${keyword}*..._` });

        // Tembak API Laravel
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
        
        // Tampilkan NIK jika ada, disensor sebagian untuk privasi jika diakses di grup
        if (c.nik) {
            const isGroup = remoteJid.endsWith('@g.us');
            const nikTampil = isGroup ? c.nik.substring(0, 6) + '**********' : c.nik;
            text += `🪪 *NIK:* ${nikTampil}\n`;
        }

        text += `\n📊 *Status Seleksi:* *${(c.status_seleksi || 'PENDING').toUpperCase()}*\n`;
        
        // Jika sudah lulus atau diterima, tampilkan lokasi ujiannya (jika disetting)
        const statusLower = (c.status_seleksi || '').toLowerCase();
        if (['lulus', 'diterima', 'lulus administrasi', 'approved'].includes(statusLower)) {
            text += `\n📍 *LOKASI TES / WAWANCARA*\n`;
            text += `🚪 Ruang Santri: ${c.santri_room ? c.santri_room.nama_ruangan : 'Menunggu Jadwal'}\n`;
            text += `🚪 Ruang Wali: ${c.wali_room ? c.wali_room.nama_ruangan : 'Menunggu Jadwal'}\n`;
        } else {
            text += `\n_Mohon bersabar, berkas/data Anda sedang dalam antrean review oleh Panitia._\n`;
        }
        
        text += `\n--------------------------------`;

        await sock.sendMessage(remoteJid, { text }, { quoted: msg });
    }
};