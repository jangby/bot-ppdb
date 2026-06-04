const config = require('../config');

module.exports = {
    name: '.rincianspmb',
    description: 'Melihat rincian pendaftar dan progres target secara rapi',
    
    // Menangkap parameter msg yang baru saja kita tambahkan di index.js
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
        // 2. VALIDASI NOMOR DARI CONFIG.JS
        // ==========================================
        
        // 1. Coba ambil dari remoteJidAlt (ini tempat WA menyembunyikan nomor asli saat mode LID)
        // 2. Jika kosong, coba ambil dari participant (biasanya untuk grup)
        // 3. Jika kosong juga, baru gunakan remoteJid bawaan
        let senderRaw = msg.key.remoteJidAlt || msg.key.participant || msg.participant || msg.key.remoteJid;
        
        // Memisahkan JID dari ekstensinya (@s.whatsapp.net atau @lid)
        let senderNumber = senderRaw.split('@')[0];
        
        // Menghilangkan kode device jika ada (contoh: 628123456:2 menjadi 628123456)
        senderNumber = senderNumber.split(':')[0];

        // --- BISA DIHAPUS JIKA SUDAH BERHASIL (DEBUGGING) ---
        console.log('Nomor yang berhasil ditangkap:', senderNumber);

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
            await sock.sendMessage(remoteJid, { 
                text: '🔄 _Mengunduh rincian pendaftar..._' 
            }, { quoted: msg });

            // Menggunakan fungsi getRincian() dari api.js agar lebih terpusat dan rapi
            const response = await api.getRincian();
            
            if (!response || !response.success) {
                return await sock.sendMessage(remoteJid, { 
                    text: '❌ *GAGAL*\nTidak dapat membaca data rincian dari server.' 
                }, { quoted: msg });
            }

            const data = response.data;
            const santri = data.santri;
            const santriyah = data.santriyah;

            const createProgressBar = (percent) => {
                const totalBars = 10;
                const filledBars = Math.round((percent / 100) * totalBars);
                const emptyBars = totalBars - filledBars;
                const fill = Math.max(0, filledBars);
                const empty = Math.max(0, emptyBars);
                return `[${'█'.repeat(fill)}${'░'.repeat(empty)}]`;
            };

            const formatGroupedList = (dataList) => {
                if (!Array.isArray(dataList) || dataList.length === 0) {
                    return '_(Belum ada pendaftar)_';
                }

                const groups = {};
                
                dataList.forEach(item => {
                    const match = item.match(/^(.*?)\s*\(([^)]+)\)$/);
                    let namaLengkap, jenjang, alamatTeks = "";
                    
                    if (match) {
                        let namaDanAlamat = match[1].trim();
                        jenjang = match[2].trim();
                        
                        if (namaDanAlamat.includes('#')) {
                            const splitData = namaDanAlamat.split('#');
                            namaLengkap = splitData[0].trim();
                            alamatTeks = splitData[1].trim(); 
                        } else {
                            namaLengkap = namaDanAlamat;
                        }
                    } else {
                        namaLengkap = item.trim();
                        jenjang = "Lainnya"; 
                    }

                    if (!groups[jenjang]) {
                        groups[jenjang] = [];
                    }
                    groups[jenjang].push({ nama: namaLengkap, alamat: alamatTeks });
                });

                let formattedText = '';
                for (const jenjang in groups) {
                    formattedText += `*➤ JENJANG ${jenjang.toUpperCase()}*\n`;
                    
                    groups[jenjang].forEach((santri, i) => {
                        if (santri.alamat) {
                            formattedText += `${i + 1}. *${santri.nama}*\n`;
                            formattedText += `> 🏠 _${santri.alamat}_\n\n`; 
                        } else {
                            formattedText += `${i + 1}. ${santri.nama}\n`;
                        }
                    });
                    
                    formattedText = formattedText.trimEnd() + '\n\n'; 
                }
                
                return formattedText.trimEnd(); 
            };

            const listSantri = formatGroupedList(santri.list);
            const listSantriyah = formatGroupedList(santriyah.list);

            const replyMsg = `📊 *RINCIAN PENDAFTAR SPMB* 📊\n\n` +
                             `🎯 *PROGRES KUOTA PENERIMAAN*\n` +
                             `_(*Catatan:* Jenjang SMA Lanjutan tidak dihitung ke dalam progres)_\n\n` +
                             `👨‍🎓 *Santri (Putra)*\n` +
                             `Progress: ${santri.progres} / ${santri.target} (${santri.persentase}%)\n` +
                             `${createProgressBar(santri.persentase)}\n\n` +
                             `👩‍🎓 *Santriyah (Putri)*\n` +
                             `Progress: ${santriyah.progres} / ${santriyah.target} (${santriyah.persentase}%)\n` +
                             `${createProgressBar(santriyah.persentase)}\n\n` +
                             `─────────────────────\n\n` +
                             `📝 *DAFTAR NAMA SANTRI*\n` +
                             `${listSantri}\n\n` +
                             `📝 *DAFTAR NAMA SANTRIYAH*\n` +
                             `${listSantriyah}`;

            await sock.sendMessage(remoteJid, { text: replyMsg }, { quoted: msg });

        } catch (error) {
            console.error('Error fetch rincian PPDB:', error);
            await sock.sendMessage(remoteJid, { 
                text: '🚨 *Sistem Offline*\nTerjadi kesalahan koneksi ke server.' 
            }, { quoted: msg });
        }
    }
};