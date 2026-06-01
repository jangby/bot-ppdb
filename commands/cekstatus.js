module.exports = {
    name: '!cekstatus',
    async execute(sock, remoteJid, args, api) {
        if (args.length === 0) {
            await sock.sendMessage(remoteJid, { text: 'Format salah! Ketik: *!cekstatus [Nomor_Pendaftaran]*\nContoh: !cekstatus SPMB-24-0001' });
            return;
        }

        const noDaftar = args[0];
        await sock.sendMessage(remoteJid, { text: `⏳ Sedang mencari data untuk nomor pendaftaran: ${noDaftar}...` });
        
        const data = await api.checkStatus(noDaftar);

        if (data && data.success) {
            const p = data.data;
            const reply = `🎓 *DATA PENDAFTARAN*\n\nNama: ${p.nama}\nNo Daftar: ${p.no_daftar}\nJenjang: ${p.jenjang}\nAsal Sekolah: ${p.asal_sekolah}\n\n*STATUS SELEKSI:*\nStatus: ${p.status}\nJadwal Tes: ${p.jadwal_tes}\nRuang Tes: ${p.ruang_tes}\n\nCek selengkapnya di: ${p.link_cek}`;
            await sock.sendMessage(remoteJid, { text: reply });
        } else if (data && !data.success) {
            await sock.sendMessage(remoteJid, { text: `❌ ${data.message}` });
        } else {
            await sock.sendMessage(remoteJid, { text: 'Terjadi kesalahan sistem saat mengecek data.' });
        }
    }
};