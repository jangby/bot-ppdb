const config = require('../config');

module.exports = {
    name: '.getkontak',
    description: 'Men-download file VCF berisi kontak seluruh wali santri',
    async execute(sock, remoteJid, args, api, msg) {
        
        // 1. Validasi Admin (Bisa dari Japri maupun Grup - ANTI LID)
        // Gabungan radar participantAlt (Grup) dan remoteJidAlt (Japri)
        let senderRaw = msg.key.participantAlt || msg.key.remoteJidAlt || msg.key.participant || msg.participant || msg.key.remoteJid;
        
        // Ambil hanya angkanya saja
        let senderNumber = senderRaw.split('@')[0].split(':')[0];
        
        const allowedAdmins = config.ADMIN_PPDB.map(num => String(num).trim());

        if (!allowedAdmins.includes(senderNumber)) {
            return await sock.sendMessage(remoteJid, { 
                text: '⛔ *Akses Ditolak*\nPerintah ini hanya untuk Admin PPDB.' 
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(remoteJid, { text: '⏳ _Menyiapkan file buku telepon (vCard)..._' }, { quoted: msg });

            // 2. Ambil data dari server
            const response = await api.getKontakWali();
            
            if (!response || !response.success || response.data.length === 0) {
                return await sock.sendMessage(remoteJid, { text: '❌ Tidak ada data kontak yang bisa diambil saat ini.' });
            }

            const daftarKontak = response.data;
            let vcfString = '';

            // 3. Merangkai format VCF (vCard)
            for (const kontak of daftarKontak) {
                // Menghindari karakter aneh di nama
                const namaBersih = kontak.nama.replace(/[^a-zA-Z0-9 ]/g, "");
                
                vcfString += 'BEGIN:VCARD\n';
                vcfString += 'VERSION:3.0\n';
                
                // [PERBAIKAN]: Mengubah format nama sesuai permintaan Anda
                vcfString += `FN:Ortu ${namaBersih} 2026-2027\n`; 
                
                vcfString += `TEL;type=CELL;type=VOICE;waid=${kontak.no_wa}:+${kontak.no_wa}\n`; 
                vcfString += 'END:VCARD\n';
            }

            // 4. Ubah text (string) menjadi file Buffer (dokumen)
            const vcfBuffer = Buffer.from(vcfString, 'utf-8');

            // 5. Kirim file ke WhatsApp
            await sock.sendMessage(remoteJid, { 
                document: vcfBuffer, 
                fileName: 'Kontak_Wali_Santri_2026.vcf', 
                mimetype: 'text/vcard',
                caption: `✅ *Selesai!*\n\nBerhasil merangkum *${daftarKontak.length}* kontak wali santri.\n\nSilakan klik/unduh file di atas, lalu pilih *Buka dengan Kontak (Contacts)* untuk menyimpan semuanya ke HP Anda secara otomatis.`
            }, { quoted: msg });

        } catch (error) {
            console.error('Error Get Kontak:', error);
            await sock.sendMessage(remoteJid, { text: `❌ Terjadi kesalahan saat membuat file kontak.` }, { quoted: msg });
        }
    }
};