module.exports = {
    name: '.status',
    description: 'Cek status pendaftaran santri',
    async execute(sock, remoteJid, args, api, msg) {
        
        // Cek jika perintah dipakai di grup
        const isGroup = remoteJid.endsWith('@g.us');
        if (isGroup) {
            return await sock.sendMessage(remoteJid, { text: '🔒 *Peringatan Privasi*\nUntuk menjaga kerahasiaan data anak Anda, perintah *.status* hanya bisa digunakan melalui pesan pribadi (Japri) ke bot ini.' }, { quoted: msg });
        }

        // Radar Anti-LID untuk mendapatkan nomor asli di Japri
        let senderRaw = msg.key.participantAlt || msg.key.remoteJidAlt || msg.key.participant || msg.participant || msg.key.remoteJid;
        let senderNumber = senderRaw.split('@')[0].split(':')[0];
        await sock.sendMessage(remoteJid, { text: '🔍 _Sedang mencari data Anda di server..._' });

        const res = await api.getProfilSantri(senderNumber);
        
        if (!res || !res.success) {
            return await sock.sendMessage(remoteJid, { text: '❌ *Data Tidak Ditemukan*\nPastikan Anda mengirim pesan ini menggunakan Nomor WA yang sama dengan yang didaftarkan ke sistem PSB.' });
        }

        // Jika baru di tahap verifikasi awal (belum isi biodata)
        if (res.type === 'verifikasi_awal') {
            let v = res.data;
            let text = `📋 *STATUS TAHAP AWAL*\n\n` +
                       `Berkas Perjanjian: *${v.status_berkas.toUpperCase()}*\n` +
                       `Bukti Pembayaran: *${v.status_bayar.toUpperCase()}*\n\n` +
                       `_Catatan: Anda belum masuk ke database utama. Silakan selesaikan pembayaran dan lengkapi formulir biodata._`;
            return await sock.sendMessage(remoteJid, { text });
        }

        // Jika sudah masuk database utama
        let text = `🎓 *STATUS CALON SANTRI*\n`;
        for (let c of res.data) {
            text += `\n👤 *Nama:* ${c.nama_lengkap}\n`;
            text += `📝 *No Daftar:* ${c.no_daftar}\n`;
            text += `📌 *Jenjang:* ${c.jenjang}\n`;
            text += `📊 *Status Berkas:* *${c.status_seleksi.toUpperCase()}*\n`;
            
            if (c.status_seleksi.toLowerCase() === 'diterima' || c.status_seleksi.toLowerCase() === 'lulus') {
                 text += `\n📍 *LOKASI TES / INTERVIEW*\n`;
                 text += `🚪 Ruang Santri: ${c.santri_room ? c.santri_room.nama_ruangan : 'Belum ditentukan'}\n`;
                 text += `🚪 Ruang Wali: ${c.wali_room ? c.wali_room.nama_ruangan : 'Belum ditentukan'}\n`;
            }
            text += `\n--------------------------------\n`;
        }
        
        await sock.sendMessage(remoteJid, { text });
    }
};