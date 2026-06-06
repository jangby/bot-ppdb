module.exports = {
    name: '.berkas',
    description: 'Mengecek kelengkapan dokumen fisik pendaftaran',
    async execute(sock, remoteJid, args, api, msg) {
        
        if (args.length === 0) {
            return await sock.sendMessage(remoteJid, { 
                text: '💡 *Format Salah*\n\nKetik: *.berkas [Nomor Daftar / NIK]*\nContoh: *.berkas REG-2026123456*' 
            }, { quoted: msg });
        }

        const keyword = args[0];
        await sock.sendMessage(remoteJid, { text: `📁 _Mengecek kelengkapan dokumen untuk ID: *${keyword}*..._` });

        // Tarik data dari API
        const res = await api.cekBerkas(keyword);
        
        if (!res || !res.success) {
            return await sock.sendMessage(remoteJid, { 
                text: `❌ *Data Tidak Ditemukan*\n\nPastikan Nomor Pendaftaran atau NIK valid.` 
            }, { quoted: msg });
        }

        const data = res.data;
        let text = `📂 *STATUS KELENGKAPAN BERKAS* 📂\n\n`;
        text += `👤 Nama: *${data.nama_lengkap}*\n`;
        text += `📝 No Daftar: *${data.no_daftar}*\n\n`;
        text += `📑 *Dokumen yang sudah diserahkan:*\n`;
        text += `${data.berkas_terkumpul || '- Belum ada dokumen fisik yang diserahkan'}\n\n`;
        text += `_Mohon segera lengkapi dokumen yang belum diserahkan ke meja panitia._`;

        // ==========================================
        // SISTEM KEAMANAN PRIVASI (ALIHKAN KE JAPRI JIKA DI GRUP)
        // ==========================================
        const isGroup = remoteJid.endsWith('@g.us');
        const sender = isGroup ? (msg.key.participant || msg.participant) : remoteJid;

        if (isGroup) {
            try {
                await sock.sendMessage(sender, { text: text });
                
                await sock.sendMessage(remoteJid, { 
                    text: `🔒 Halo @${sender.split('@')[0]},\nDemi kerahasiaan data administrasi, status kelengkapan berkas telah dikirimkan ke *Pesan Pribadi (Japri)* Anda.\n\n_Silakan cek pesan masuk dari Bot._`,
                    mentions: [sender]
                }, { quoted: msg });
            } catch (err) {
                await sock.sendMessage(remoteJid, { 
                    text: `⚠️ @${sender.split('@')[0]}, Bot tidak dapat mengirim pesan Japri kepada Anda (mungkin karena pengaturan privasi WA).\n\nSilakan kirim chat *Ping* ke nomor Bot ini terlebih dahulu, lalu ulangi perintahnya.`,
                    mentions: [sender]
                }, { quoted: msg });
            }
        } else {
            await sock.sendMessage(remoteJid, { text: text }, { quoted: msg });
        }
    }
};