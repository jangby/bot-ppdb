const config = require('../config');

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
        str = str.split(',')[0]; // Buang angka di belakang koma sen
    }
    
    // Buang semua karakter selain angka (titik ribuan, huruf Rp, dll)
    str = str.replace(/[^0-9]/g, '');
    return Number(str) || 0;
}

module.exports = {
    name: '!cari',
    description: 'Mencari kilat data pendaftar santri',
    async execute(sock, remoteJid, args, api, msg) {
        
        let senderRaw = msg.key.participantAlt || msg.key.remoteJidAlt || msg.key.participant || msg.participant || msg.key.remoteJid;
        let senderNumber = senderRaw.split('@')[0].split(':')[0];
        const allowedAdmins = config.ADMIN_PPDB.map(num => String(num).trim());

        if (!allowedAdmins.includes(senderNumber)) {
            return await sock.sendMessage(remoteJid, { text: '⛔ *Akses Ditolak*\nPerintah ini khusus untuk internal Panitia PPDB.' }, { quoted: msg });
        }

        if (args.length === 0) {
            return await sock.sendMessage(remoteJid, { text: '💡 *Format Salah*\nContoh penggunaan: *!cari Deni*' }, { quoted: msg });
        }

        const keyword = args.join(' ');
        await sock.sendMessage(remoteJid, { text: `🔍 _Mencari data dengan kata kunci "${keyword}"..._` });

        const res = await api.searchSantri(keyword);
        if (!res || !res.success || res.data.length === 0) {
            return await sock.sendMessage(remoteJid, { text: `❌ *Tidak Ditemukan*\nTidak ada data santri yang cocok dengan kata kunci "${keyword}".` });
        }

        let text = `🔍 *HASIL PENCARIAN KILAT PPDB* 🔍\n` +
                   `Menampilkan ${res.data.length} hasil teratas:\n` +
                   `====================================\n`;

        for (let c of res.data) {
            let totalTagihan = 0;
            let totalTerbayar = 0;
            
            if (c.bills && Array.isArray(c.bills)) {
                for(let b of c.bills) {
                    totalTagihan += bersihkanAngka(b.nominal_tagihan ?? b.nominal);
                    totalTerbayar += bersihkanAngka(b.nominal_terbayar ?? b.nominal_disetor);
                }
            }
            
            let sisa = totalTagihan - totalTerbayar;

            text += `\n👤 *Nama:* ${c.nama_lengkap}\n` +
                    `📝 *No Daftar:* ${c.no_daftar}\n` +
                    `🎓 *Jenjang:* ${c.jenjang} | *Status:* ${c.status_seleksi}\n` +
                    `📞 *No WA Wali:* ${c.parent ? (c.parent.no_hp_ayah || c.parent.no_hp_ibu || '-') : '-'}\n` +
                    `💰 *Keuangan:* Sisa Tagihan Rp ${sisa.toLocaleString('id-ID')} (${sisa === 0 ? '✅ LUNAS' : '⚠️ BELUM LUNAS'})\n` +
                    `------------------------------------`;
        }

        await sock.sendMessage(remoteJid, { text });
    }
};