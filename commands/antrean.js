module.exports = {
    name: '.antrean',
    description: 'Cek sisa antrean tes wawancara secara real-time',
    async execute(sock, remoteJid, args, api, msg) {
        
        if (args.length === 0) {
            return await sock.sendMessage(remoteJid, { 
                text: '💡 *Format Salah*\n\nContoh penggunaan:\nKetik *!antrean REG-2026123456*\natau menggunakan NIK:\nKetik *!antrean 3201234567890001*' 
            }, { quoted: msg });
        }

        const keyword = args[0];
        await sock.sendMessage(remoteJid, { text: `📡 _Menghubungkan ke monitor antrean untuk ID: *${keyword}*..._` });

        // Tarik data dari API
        const res = await api.cekAntrean(keyword);
        
        if (!res || !res.success) {
            return await sock.sendMessage(remoteJid, { 
                text: `❌ *Data Tidak Ditemukan*\n\nPastikan Nomor Pendaftaran atau NIK valid.` 
            }, { quoted: msg });
        }

        const data = res.data;
        let text = `📊 *LIVE INFO ANTREAN TES* 📊\n\n`;
        text += `👤 *Nama:* ${data.nama_lengkap}\n\n`;

        // 3 Skenario Jawaban Bot
        if (data.status_antrian === 'belum_hadir') {
            text += `⚠️ *Status:* Belum Hadir / Belum Scan QR\n\n`;
            text += `Ananda belum terdaftar dalam antrean hari ini. Jika Anda sudah berada di lokasi, silakan tunjukkan Kartu Tes ke meja panitia untuk mendapatkan Nomor Antrean.`;
        } 
        else if (data.status_antrian === 'sudah_dipanggil') {
            text += `✅ *Status:* Sudah Dipanggil\n\n`;
            text += `Giliran Ananda sudah lewat atau sedang berlangsung di dalam ruangan saat ini.`;
        } 
        else {
            text += `🎫 *Nomor Antrean Ananda:* *${data.nomor_saya}*\n`;
            text += `📢 *Antrean Saat Ini:* *${data.nomor_sekarang === 0 ? 'Belum ada yang dipanggil' : data.nomor_sekarang}*\n\n`;
            
            if (data.sisa_antrean === 0) {
                text += `🔥 *GILIRAN SELANJUTNYA!* 🔥\nMohon segera bersiap di depan pintu ruangan, Ananda adalah giliran berikutnya!`;
            } else {
                text += `⏳ *Sisa Menunggu:* *${data.sisa_antrean} orang lagi*\n\n`;
                text += `_Silakan bersantai di area tunggu. Anda dapat mengecek kembali sisa antrean ini kapan saja secara berkala._`;
            }
        }

        await sock.sendMessage(remoteJid, { text }, { quoted: msg });
    }
};