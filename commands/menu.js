module.exports = {
    name: '.menu',
    description: 'Menampilkan daftar perintah/layanan bot',
    async execute(sock, remoteJid, args, api, msg) {
        
        let text = `🌟 *PUSAT LAYANAN INFORMASI PPDB* 🌟\n\n`;
        text += `Assalamu'alaikum wa rahmatullahi wa barakatuh.\n`;
        text += `Selamat datang, Bapak/Ibu Wali Santri yang dirahmati Allah. 🙏\n\n`;
        
        text += `Perkenalkan, saya adalah Asisten Virtual Otomatis yang siap membantu Bapak/Ibu selama 24 jam penuh.\n\n`;
        
        text += `👇 *CARA PENGGUNAAN*\n`;
        text += `Untuk memanggil informasi, Bapak/Ibu **wajib mengetik tanda titik ( . )** tepat di depan kata perintah, tanpa spasi.\n`;
        text += `Contoh: Bapak/Ibu ingin melihat brosur, maka ketik: *.brosur* lalu kirim.\n\n`;
        
        text += `Berikut adalah daftar menu yang bisa Bapak/Ibu gunakan saat ini:\n\n`;

        text += `📂 *INFORMASI PONDOK*\n`;
        text += `Ketik ➡️ *.brosur*  (Rincian biaya & program)\n`;
        text += `Ketik ➡️ *.asrama*  (Barang bawaan mondok)\n\n`;

        text += `📝 *LAYANAN PENDAFTARAN*\n`;
        text += `Ketik ➡️ *.tagihan*  (Cek status pembayaran)\n`;
        text += `Ketik ➡️ *.daftar [token]*  (Isi biodata via WA)\n\n`;

        text += `🎓 *PEMANTAUAN UJIAN & BERKAS*\n`;
        text += `_(PENTING: Untuk menu di bawah ini, beri spasi lalu masukkan Nomor Daftar atau NIK anak setelah perintah)_\n\n`;
        
        text += `Ketik ➡️ *.cekstatus*  (Hasil kelulusan)\n`;
        text += `Ketik ➡️ *.berkas*  (Cek kelengkapan dokumen)\n`;
        text += `Ketik ➡️ *.kartutes*  (Download QR Code Ujian)\n`;
        text += `Ketik ➡️ *.antrean*  (Pantau sisa giliran tes)\n\n`;

        text += `💡 *CONTOH PENGETIKAN YANG BENAR:*\n`;
        text += `✔️ *.antrean REG-2026123456*\n`;
        text += `✔️ *.cekstatus 3201234567890001*\n\n`;

        text += `--------------------------------\n`;
        text += `👨‍💻 *INGIN BERTANYA KEPADA PANITIA?*\n`;
        text += `Jika Bapak/Ibu kesulitan atau ada pertanyaan yang tidak ada di menu, silakan awali *chat* Bapak/Ibu dengan kata *Admin*.\n\n`;
        text += `_Contoh: "Admin, mohon bantuan cara daftar ulang."_`;

        // Kirim pesan ke WhatsApp
        await sock.sendMessage(remoteJid, { text }, { quoted: msg });
    }
};