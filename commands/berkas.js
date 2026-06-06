module.exports = {
    name: '.berkas',
    description: 'Cek kelengkapan dokumen persyaratan fisik',
    async execute(sock, remoteJid, args, api, msg) {
        
        // 1. Cek argumen (Wajib memasukkan No Daftar / NIK)
        if (args.length === 0) {
            return await sock.sendMessage(remoteJid, { 
                text: '💡 *Format Salah*\n\nContoh penggunaan:\nKetik *.berkas REG-2026123456*\natau\nKetik *!berkas 3201234567890001* (Menggunakan NIK)' 
            }, { quoted: msg });
        }

        const keyword = args[0];
        await sock.sendMessage(remoteJid, { text: `🔍 _Sedang merekap status dokumen untuk ID: *${keyword}*..._` });

        // 2. Tarik data dari API
        const res = await api.cekBerkas(keyword);
        
        if (!res || !res.success) {
            return await sock.sendMessage(remoteJid, { 
                text: `❌ *Data Tidak Ditemukan*\n\nPastikan Nomor Pendaftaran atau 16 digit NIK yang Anda masukkan sudah benar.` 
            }, { quoted: msg });
        }

        // 3. Susun Checklist Laporan
        const data = res.data;
        const master = data.master || [];
        const terkumpul = data.terkumpul || [];
        let lengkapSemua = true;

        let text = `📂 *STATUS KELENGKAPAN BERKAS* 📂\n\n`;
        text += `👤 *Nama:* ${data.nama_lengkap}\n`;
        text += `📝 *No Daftar:* ${data.no_daftar}\n\n`;
        text += `*Rincian Dokumen Fisik:*\n`;

        if (master.length === 0) {
            text += `_Belum ada syarat berkas yang diatur panitia._\n`;
        } else {
            for (const item of master) {
                // Cek apakah item master ini ada di dalam array terkumpul
                if (terkumpul.includes(item)) {
                    text += `✅ ${item}\n`;
                } else {
                    text += `❌ ${item} *(Belum diserahkan)*\n`;
                    lengkapSemua = false; // Jika ada 1 saja yang belum, berarti tidak lengkap
                }
            }
        }
        
        text += `\n--------------------------------\n`;

        // 4. Kesimpulan Akhir
        if (lengkapSemua && master.length > 0) {
            text += `🎉 *ALHAMDULILLAH*\nSeluruh berkas persyaratan telah lengkap dan diserahkan ke Panitia/Sekretariat. Terima kasih.`;
        } else {
            text += `⚠️ *PERHATIAN*\nMohon segera lengkapi dan serahkan berkas yang bertanda (❌) ke sekretariat panitia saat kedatangan ke Pondok.`;
        }

        await sock.sendMessage(remoteJid, { text }, { quoted: msg });
    }
};