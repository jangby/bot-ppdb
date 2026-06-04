// Fungsi Inti (Core Engine) untuk semua urusan Grup
const eksekusiGrup = async (sock, remoteJid, args, msg, aksi) => {
    
    // 1. Validasi: Pastikan perintah dilakukan di dalam Grup
    if (!remoteJid.endsWith('@g.us')) {
        return await sock.sendMessage(remoteJid, { text: '⛔ Perintah ini hanya berfungsi di dalam Grup WhatsApp!' }, { quoted: msg });
    }

    const groupMetadata = await sock.groupMetadata(remoteJid);
    const participants = groupMetadata.participants;
    const groupName = groupMetadata.subject; // Mengambil nama grup

    const getNumber = (jid) => {
        if (!jid) return '';
        return jid.split('@')[0].split(':')[0];
    };

    // 2. HAK VETO & VALIDASI PENGIRIM
    const isFromMe = msg.key.fromMe; 
    const senderId = msg.key.participant || msg.participant;
    const senderNumber = getNumber(senderId);
    const senderData = participants.find(p => getNumber(p.id) === senderNumber);
    
    const isSenderAdmin = isFromMe || senderData?.admin === 'admin' || senderData?.admin === 'superadmin';
    
    if (!isSenderAdmin) {
        return await sock.sendMessage(remoteJid, { text: '⛔ Maaf, hanya *Admin Grup* yang bisa menggunakan fitur ini!' }, { quoted: msg });
    }

    // ==========================================
    // EKSEKUSI C: BROADCAST (JAPRI SEMUA ANGGOTA)
    // ==========================================
    if (aksi === 'bc') {
        if (args.length === 0) {
            return await sock.sendMessage(remoteJid, { 
                text: `⚠️ *Format Salah*\n\nSilakan masukkan pesan pengumuman setelah perintah.\n\nContoh:\n*.bc Assalamu'alaikum, besok tes wawancara dimulai jam 8 pagi.*` 
            }, { quoted: msg });
        }

        const pesanBc = args.join(' ');
        const botId = getNumber(sock.user?.id || sock.user?.jid);

        // Kirim notifikasi bahwa proses dimulai
        await sock.sendMessage(remoteJid, { 
            text: `📢 *Memulai Broadcast...*\n\nMengirim pesan ke ${participants.length} anggota grup.\n_Mohon tunggu, sistem menggunakan jeda pengiriman agar nomor Bot tidak diblokir oleh WhatsApp._ ⏳` 
        }, { quoted: msg });

        let sukses = 0;
        let gagal = 0;

        // Looping ke setiap anggota grup
        for (let member of participants) {
            const memberId = member.id;
            const memberNumber = getNumber(memberId);

            // Lewati jika itu adalah nomor bot itu sendiri
            if (memberNumber === botId) continue;

            try {
                // SANGAT PENTING: Jeda 2.5 detik per pesan anti-banned
                await new Promise(resolve => setTimeout(resolve, 2500));
                
                // Susun pesan Japri
                const formatPesan = `📢 *PENGUMUMAN DARI PANITIA*\n_Grup: ${groupName}_\n\n${pesanBc}`;
                
                await sock.sendMessage(memberId, { text: formatPesan });
                sukses++;
            } catch (err) {
                console.error(`Gagal BC ke ${memberNumber}:`, err.message);
                gagal++;
            }
        }

        // Laporan Selesai
        return await sock.sendMessage(remoteJid, { 
            text: `✅ *BROADCAST SELESAI!*\n\nLaporan Pengiriman:\n🟢 Berhasil terkirim: ${sukses} orang\n🔴 Gagal/Nomor tidak aktif: ${gagal} orang` 
        }, { quoted: msg });
    }

    // ==========================================
    // EKSEKUSI A: TUTUP & BUKA GRUP
    // ==========================================
    if (aksi === 'close') {
        await sock.groupSettingUpdate(remoteJid, 'announcement');
        return await sock.sendMessage(remoteJid, { text: '🔒 *Grup Ditutup*\nHanya Admin yang dapat mengirim pesan ke dalam grup ini.' });
    }
    
    if (aksi === 'open') {
        await sock.groupSettingUpdate(remoteJid, 'not_announcement');
        return await sock.sendMessage(remoteJid, { text: '🔓 *Grup Dibuka*\nSeluruh peserta sekarang dapat kembali berdiskusi.' });
    }

    // ==========================================
    // EKSEKUSI B: KICK, ADD, PROMOTE, DEMOTE
    // ==========================================
    let users = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    
    if (users.length === 0 && msg.message?.extendedTextMessage?.contextInfo?.participant) {
        users.push(msg.message.extendedTextMessage.contextInfo.participant); 
    }
    
    if (users.length === 0 && args.length > 0) {
        let number = args[0].replace(/[^0-9]/g, '');
        if (number.startsWith('0')) number = '62' + number.slice(1);
        if (number) users.push(number + '@s.whatsapp.net'); 
    }

    if (users.length === 0) {
        return await sock.sendMessage(remoteJid, { 
            text: `⚠️ *Format Salah*\n\nSilakan *Tag (@)* orangnya, balas (*Reply*) pesannya, atau ketik nomor WA-nya (628...).\nContoh: *.${aksi} @Orangnya*` 
        }, { quoted: msg });
    }

    try {
        if (aksi === 'kick') await sock.groupParticipantsUpdate(remoteJid, users, 'remove');
        if (aksi === 'add') await sock.groupParticipantsUpdate(remoteJid, users, 'add');
        if (aksi === 'promote') await sock.groupParticipantsUpdate(remoteJid, users, 'promote');
        if (aksi === 'demote') await sock.groupParticipantsUpdate(remoteJid, users, 'demote');
        
        let aksiText = {
            'kick': 'MENGELUARKAN', 'add': 'MENAMBAHKAN', 
            'promote': 'MENJADIKAN ADMIN', 'demote': 'MENCABUT ADMIN'
        };
        
        await sock.sendMessage(remoteJid, { text: `✅ Berhasil *${aksiText[aksi]}* target di grup ini.` }, { quoted: msg });

    } catch (e) {
        console.error("Gagal eksekusi grup:", e);
        await sock.sendMessage(remoteJid, { text: `❌ Gagal memproses perintah.\n_Pastikan nomor target benar atau target tidak diproteksi oleh WA._` }, { quoted: msg });
    }
};

// ==========================================
// DAFTARKAN SEMUA PERINTAH SECARA BORONGAN
// ==========================================
module.exports = [
    { name: '.kick', execute: (s, r, a, api, m) => eksekusiGrup(s, r, a, m, 'kick') },
    { name: '.add', execute: (s, r, a, api, m) => eksekusiGrup(s, r, a, m, 'add') },
    { name: '.promote', execute: (s, r, a, api, m) => eksekusiGrup(s, r, a, m, 'promote') },
    { name: '.demote', execute: (s, r, a, api, m) => eksekusiGrup(s, r, a, m, 'demote') },
    { name: '.close', execute: (s, r, a, api, m) => eksekusiGrup(s, r, a, m, 'close') },
    { name: '.open', execute: (s, r, a, api, m) => eksekusiGrup(s, r, a, m, 'open') },
    { name: '.bc', execute: (s, r, a, api, m) => eksekusiGrup(s, r, a, m, 'bc') } // <-- PERINTAH BARU KITA
];