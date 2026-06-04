// Fungsi pembantu pintas untuk membersihkan angka desimal / format IDR
function bersihkanAngka(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    
    let str = String(val).trim();
    
    // 1. Jika format desimal database murni (cth: "4000000.00")
    if (/^\d+\.\d+$/.test(str)) {
        return Math.floor(parseFloat(str));
    }
    
    // 2. Jika format lokal/rupiah dengan koma sen (cth: "4.000.000,00")
    if (str.includes(',')) {
        str = str.split(',')[0]; 
    }
    
    // Buang semua karakter selain angka (titik ribuan, Rp, dll)
    str = str.replace(/[^0-9]/g, '');
    return Number(str) || 0;
}

module.exports = {
    name: '.tagihan',
    description: 'Cek ringkasan tagihan keuangan PPDB',
    async execute(sock, remoteJid, args, api, msg) {
        
        // 1. Proteksi Grup (Wajib Japri untuk menjaga privasi keuangan)
        const isGroup = remoteJid.endsWith('@g.us');
        if (isGroup) {
            return await sock.sendMessage(remoteJid, { 
                text: '🔒 *Peringatan Privasi*\nData keuangan bersifat sensitif. Silakan kirim perintah *!tagihan* melalui pesan pribadi (Japri) langsung ke bot ini.' 
            }, { quoted: msg });
        }

        // 2. Radar Anti-LID untuk melacak nomor asli pengirim di Japri
        let senderRaw = msg.key.participantAlt || msg.key.remoteJidAlt || msg.key.participant || msg.participant || msg.key.remoteJid;
        let senderNumber = senderRaw.split('@')[0].split(':')[0];
        
        await sock.sendMessage(remoteJid, { text: '🔍 _Merekap ringkasan keuangan dari server..._' });

        // 3. Tarik data dari API Laravel
        const res = await api.getProfilSantri(senderNumber);
        
        if (!res || !res.success || res.type === 'verifikasi_awal') {
            return await sock.sendMessage(remoteJid, { 
                text: '❌ *Data Tidak Ditemukan*\nData tagihan belum tersedia atau nomor Anda belum terdaftar di database keuangan utama.' 
            });
        }

        // 4. Menyusun laporan teks RINGKASAN
        let text = `💰 *RINGKASAN KEUANGAN PPDB* 💰\n`;
        
        for (let c of res.data) {
            let totalTagihan = 0;
            let totalBayar = 0;

            text += `\n👤 *${c.nama_lengkap}* (${c.jenjang})\n`;
            text += `📝 No. Daftar: ${c.no_daftar}\n\n`;

            if (c.bills && Array.isArray(c.bills)) {
                // Proses menjumlahkan semua tagihan di belakang layar (tanpa menampilkannya satu per satu)
                for (let b of c.bills) {
                    let tagihanNum = bersihkanAngka(b.nominal_tagihan ?? b.nominal);
                    let terbayarNum = bersihkanAngka(b.nominal_terbayar ?? b.nominal_disetor);
                    
                    totalTagihan += tagihanNum;
                    totalBayar += terbayarNum;
                }
            }

            let totalSisa = totalTagihan - totalBayar;

            // Menampilkan Hasil Akhir Saja
            text += `📈 *Total Tagihan:* Rp ${totalTagihan.toLocaleString('id-ID')}\n`;
            text += `✅ *Total Terbayar:* Rp ${totalBayar.toLocaleString('id-ID')}\n`;
            text += `⚠️ *Sisa Pembayaran:* ${totalSisa === 0 ? '*LUNAS 🎉*' : `*Rp ${totalSisa.toLocaleString('id-ID')}*`}\n`;
            text += `\n--------------------------------\n`;
        }
        
        text += `_Mohon abaikan pesan ini jika Anda sudah melunasi pembayaran hari ini._`;
        
        // 5. Kirim laporan akhir
        await sock.sendMessage(remoteJid, { text });
    }
};