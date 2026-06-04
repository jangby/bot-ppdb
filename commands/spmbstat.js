const config = require('../config');

module.exports = {
    name: '.spmbstat',
    description: 'Melihat statistik pendaftar PPDB secara real-time',
    
    // Pastikan menangkap parameter msg dari index.js
    async execute(sock, remoteJid, args, api, msg) {
        
        // ==========================================
        // 1. VALIDASI PRIVATE MESSAGE (PM) ONLY
        // ==========================================
        const isGroup = remoteJid.endsWith('@g.us');
        if (isGroup) {
            return await sock.sendMessage(remoteJid, { 
                text: '❌ *Akses Ditolak*\nPerintah ini bersifat rahasia dan hanya dapat digunakan melalui Private Message (Japri) langsung ke bot.' 
            }, { quoted: msg });
        }

        // ==========================================
        // 2. VALIDASI NOMOR DARI CONFIG.JS (Bypass LID)
        // ==========================================
        
        // 1. Coba ambil dari remoteJidAlt (ini tempat WA menyembunyikan nomor asli saat mode LID)
        // 2. Jika kosong, coba ambil dari participant (biasanya untuk grup)
        // 3. Jika kosong juga, baru gunakan remoteJid bawaan
        let senderRaw = msg.key.remoteJidAlt || msg.key.participant || msg.participant || msg.key.remoteJid;
        
        // Memisahkan JID dari ekstensinya (@s.whatsapp.net atau @lid)
        let senderNumber = senderRaw.split('@')[0];
        
        // Menghilangkan kode device jika ada (contoh: 628123456:2 menjadi 628123456)
        senderNumber = senderNumber.split(':')[0];

        // Membersihkan spasi tak sengaja dari array config
        const allowedAdmins = config.ADMIN_PPDB.map(num => String(num).trim());

        if (!allowedAdmins || !allowedAdmins.includes(senderNumber)) {
            return await sock.sendMessage(remoteJid, { 
                text: '⛔ *Akses Ditolak*\nNomor Anda tidak terdaftar sebagai Admin PPDB. Anda tidak memiliki izin untuk melihat data ini.' 
            }, { quoted: msg });
        }

        // ==========================================
        // 3. JIKA LOLOS VALIDASI, JALANKAN PERINTAH
        // ==========================================
        try {
            // 1. Pesan Loading
            await sock.sendMessage(remoteJid, { 
                text: '🔄 _Menyinkronkan data dengan sistem SPMB..._' 
            }, { quoted: msg });

            // 2. Menggunakan fungsi getStat() dari api.js 
            const response = await api.getStat();
            
            if (!response || !response.success) {
                return await sock.sendMessage(remoteJid, { 
                    text: '❌ *GAGAL*\nTidak dapat membaca data dari server PPDB.' 
                }, { quoted: msg });
            }

            const data = response.data;

            // Mendapatkan Waktu Saat Ini (WIB)
            const waktuUpdate = new Date().toLocaleString('id-ID', { 
                timeZone: 'Asia/Jakarta', 
                dateStyle: 'full', 
                timeStyle: 'short' 
            });

            // 3. Rangkai teks untuk Jenjang (Dinamis)
            let jenjangText = '📊 *Rincian per Jenjang*\n╭───────────────\n';
            for (const [key, value] of Object.entries(data.jenjang)) {
                jenjangText += `│ 🔹 *${key}* : ${value} Santri\n`;
            }
            jenjangText += '╰───────────────\n';

            // 4. Rangkai teks untuk Status (Dinamis)
            let statusText = '📋 *Progress Pendaftaran*\n╭───────────────\n';
            for (const [key, value] of Object.entries(data.status)) {
                // Gunakan emoji berbeda berdasarkan keyword status
                let icon = '🔸';
                if (key.toLowerCase().includes('verifikasi') || key.toLowerCase().includes('lulus')) icon = '✅';
                if (key.toLowerCase().includes('tunggu') || key.toLowerCase().includes('baru')) icon = '⏳';
                if (key.toLowerCase().includes('tolak') || key.toLowerCase().includes('batal')) icon = '❌';

                statusText += `│ ${icon} *${key}* : ${value} Santri\n`;
            }
            statusText += '╰───────────────';

            // 5. Gabungkan menjadi satu pesan utuh yang Estetik
            const replyMsg = `🎓 *STATISTIK SPMB PONDOK* 🎓\n` +
                             `_Update: ${waktuUpdate} WIB_\n\n` +
                             `╭─── *TOTAL PENDAFTAR* ──\n` +
                             `│ 👥 *${data.total}* Santri\n` +
                             `╰───────────────\n\n` +
                             `${jenjangText}\n` +
                             `${statusText}\n\n` +
                             `💡 _Data diambil secara real-time dari website._`;

            // 6. Kirim balasan akhir ke WhatsApp
            await sock.sendMessage(remoteJid, { text: replyMsg }, { quoted: msg });

        } catch (error) {
            console.error('Error fetch data PPDB:', error);
            await sock.sendMessage(remoteJid, { 
                text: '🚨 *Sistem Offline*\n\nTerjadi kesalahan saat menghubungi server PPDB. Pastikan web PPDB sedang menyala.' 
            }, { quoted: msg });
        }
    }
};