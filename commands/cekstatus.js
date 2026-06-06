module.exports = {
    name: '.cekstatus',
    description: 'Mengecek status kelulusan / seleksi santri',
    async execute(sock, remoteJid, args, api, msg) {
        
        if (args.length === 0) {
            return await sock.sendMessage(remoteJid, { 
                text: '💡 *Format Salah*\n\nKetik: *.cekstatus [Nomor Daftar / NIK]*\nContoh: *.cekstatus REG-2026123456*' 
            }, { quoted: msg });
        }

        const keyword = args[0];
        await sock.sendMessage(remoteJid, { text: `🔍 _Mencari data kelulusan untuk ID: *${keyword}*..._` });

        // Tarik data dari API
        const res = await api.cekStatus(keyword);
        
        if (!res || !res.success) {
            return await sock.sendMessage(remoteJid, { 
                text: `❌ *Data Tidak Ditemukan*\n\nPastikan Nomor Pendaftaran atau NIK yang Anda masukkan sudah benar.` 
            }, { quoted: msg });
        }

        const data = res.data;
        let text = `🎓 *HASIL SELEKSI PPDB* 🎓\n\n`;
        text += `👤 Nama: *${data.nama_lengkap}*\n`;
        text += `📝 No Daftar: *${data.no_daftar}*\n`;
        text += `📌 Status Seleksi: *${data.status_seleksi}*\n\n`;
        text += `_Catatan: Jika ada pertanyaan lebih lanjut, silakan hubungi Admin._`;

        // ==========================================
        // SISTEM KEAMANAN PRIVASI (ALIHKAN KE JAPRI JIKA DI GRUP)
        // ==========================================
        const isGroup = remoteJid.endsWith('@g.us');
        const sender = isGroup ? (msg.key.participant || msg.participant) : remoteJid;

        if (isGroup) {
            try {
                // 1. Kirim hasil aslinya ke PM (Japri)
                await sock.sendMessage(sender, { text: text });
                
                // 2. Kirim notifikasi di Grup
                await sock.sendMessage(remoteJid, { 
                    text: `🔒 Halo @${sender.split('@')[0]},\nDemi menjaga kerahasiaan data calon santri, hasil kelulusan telah sistem kirimkan ke *Pesan Pribadi (Japri)* Anda.\n\n_Silakan cek pesan masuk dari Bot._`,
                    mentions: [sender]
                }, { quoted: msg });
            } catch (err) {
                await sock.sendMessage(remoteJid, { 
                    text: `⚠️ @${sender.split('@')[0]}, Bot tidak dapat mengirim pesan Japri kepada Anda (mungkin karena pengaturan privasi WA).\n\nSilakan kirim chat *Ping* ke nomor Bot ini terlebih dahulu, lalu ulangi perintahnya.`,
                    mentions: [sender]
                }, { quoted: msg });
            }
        } else {
            // Jika sedari awal sudah japri, kirim langsung
            await sock.sendMessage(remoteJid, { text: text }, { quoted: msg });
        }
    }
};