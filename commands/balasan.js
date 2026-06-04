const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
    name: '.balasan',
    description: 'Mengatur auto-reply dinamis untuk Admin CS',
    async execute(sock, remoteJid, args, api, msg) {
        
        // 1. Validasi Keamanan: Hanya Admin CS yang boleh mengatur ini
        let senderRaw = msg.key.participantAlt || msg.key.remoteJidAlt || msg.key.participant || msg.participant || msg.key.remoteJid;
        let senderNumber = senderRaw.split('@')[0].split(':')[0];

        if (senderNumber !== config.ADMIN_CS_NUMBER) {
            return await sock.sendMessage(remoteJid, { text: '⛔ *Akses Ditolak*\nHanya Admin CS Utama yang bisa menggunakan perintah ini.' }, { quoted: msg });
        }

        // 2. Siapkan File Database Mini untuk menyimpan template
        const dbReplyPath = path.join(__dirname, '../database_autoreply.json');
        let autoReplies = {};
        if (fs.existsSync(dbReplyPath)) {
            autoReplies = JSON.parse(fs.readFileSync(dbReplyPath));
        }

        const fullText = args.join(' ');
        const parts = fullText.split('|').map(s => s.trim());
        const action = parts[0]?.toLowerCase();

        // 3. Logika Menambah Template Balasan
        if (action === 'tambah' && parts.length === 3) {
            const keyword = parts[1].toLowerCase();
            const replyText = parts[2];
            autoReplies[keyword] = replyText;
            
            fs.writeFileSync(dbReplyPath, JSON.stringify(autoReplies, null, 2));
            return await sock.sendMessage(remoteJid, { text: `✅ Berhasil menyimpan Auto-Reply!\n\n▪️ *Kata Kunci:* ${keyword}\n▪️ *Balasan:* ${replyText}` }, { quoted: msg });
        }

        // 4. Logika Menghapus Template
        if (action === 'hapus' && parts.length === 2) {
            const keyword = parts[1].toLowerCase();
            if (autoReplies[keyword]) {
                delete autoReplies[keyword];
                fs.writeFileSync(dbReplyPath, JSON.stringify(autoReplies, null, 2));
                return await sock.sendMessage(remoteJid, { text: `🗑️ Berhasil menghapus Auto-Reply untuk kata kunci: *${keyword}*` }, { quoted: msg });
            } else {
                return await sock.sendMessage(remoteJid, { text: `❌ Kata kunci *${keyword}* tidak ditemukan di sistem.` }, { quoted: msg });
            }
        }

        // 5. Logika Melihat Daftar Template
        if (action === 'list') {
            if (Object.keys(autoReplies).length === 0) return await sock.sendMessage(remoteJid, { text: '📭 Belum ada data Auto-Reply yang tersimpan.' }, { quoted: msg });
            
            let text = '📋 *DAFTAR AUTO-REPLY DINAMIS*\n\n';
            for (const kw in autoReplies) {
                text += `🔑 *Kata Kunci:* ${kw}\n💬 *Balasan:* ${autoReplies[kw]}\n\n`;
            }
            return await sock.sendMessage(remoteJid, { text });
        }

        // 6. Jika Format Salah, Tampilkan Panduan
        const panduan = `💡 *PANDUAN PENGGUNAAN !balasan*\nGunakan tanda pemisah garis lurus (|) untuk membedakan perintah.\n\n` +
                        `1️⃣ *Menambah / Mengubah Balasan:*\n!balasan tambah | kata kunci | isi pesan balasan\n_Contoh:_ !balasan tambah | jadwal | Ujian akan dilaksanakan pada 20 Agustus._\n\n` +
                        `2️⃣ *Menghapus Balasan:*\n!balasan hapus | kata kunci\n_Contoh:_ !balasan hapus | jadwal\n\n` +
                        `3️⃣ *Melihat Daftar Balasan:*\n!balasan list`;
        
        await sock.sendMessage(remoteJid, { text: panduan }, { quoted: msg });
    }
};