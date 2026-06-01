const config = require('../config');

module.exports = {
    name: '!syncgrup',
    description: 'Menarik otomatis nomor yang sudah selesai verifikasi ke dalam grup',
    async execute(sock, remoteJid, args, api, msg) {
        
        // 1. Pastikan perintah ini hanya bisa dijalankan DI DALAM GRUP
        const isGroup = remoteJid.endsWith('@g.us');
        if (!isGroup) {
            return await sock.sendMessage(remoteJid, { 
                text: '❌ Perintah ini khusus untuk mengelola grup dan hanya bisa dijalankan di dalam grup PPDB.' 
            }, { quoted: msg });
        }

        // ==========================================
        // 2. VALIDASI ADMIN PPDB
        // ==========================================
        let senderRaw = msg.key.participantAlt || msg.key.participant || msg.participant || msg.key.remoteJid;
        let senderNumber = senderRaw.split('@')[0].split(':')[0];
        
        const allowedAdmins = config.ADMIN_PPDB.map(num => String(num).trim());

        if (!allowedAdmins.includes(senderNumber)) {
            return await sock.sendMessage(remoteJid, { 
                text: '⛔ *Akses Ditolak*\nHanya Admin PPDB yang bisa menjalankan sinkronisasi grup.' 
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(remoteJid, { text: '🔄 _Menganalisis anggota grup dan menyinkronkan dengan data server..._' });

            // 3. Ambil seluruh data peserta yang ada di grup saat ini
            const groupMetadata = await sock.groupMetadata(remoteJid);
            const currentParticipants = groupMetadata.participants.map(p => p.id.split('@')[0].split(':')[0]); 

            // 4. Ambil data nomor dari database Laravel
            const response = await api.getPesertaLulus();
            if (!response || !response.success) {
                return await sock.sendMessage(remoteJid, { text: '❌ Gagal mengambil data nomor peserta dari server.' });
            }

            const dbNumbersRaw = response.data; 

            // ==========================================
            // 5. PENYARINGAN & CEK NOMOR AKTIF WA
            // ==========================================
            let missingNumbers = [];
            
            for (const num of dbNumbersRaw) {
                const pureNumber = num.split('@')[0];
                
                // Syarat 1: Panjang nomor masuk akal
                if (pureNumber.length >= 10 && pureNumber.length <= 15) {
                    
                    // Syarat 2: Belum ada di dalam grup
                    if (!currentParticipants.includes(pureNumber)) {
                        
                        // Syarat 3: Pastikan nomor tersebut BENAR-BENAR TERDAFTAR DI WHATSAPP
                        try {
                            const [waResult] = await sock.onWhatsApp(pureNumber);
                            
                            // waResult.exists akan bernilai true jika nomor tersebut punya akun WA
                            if (waResult && waResult.exists) {
                                missingNumbers.push(waResult.jid); // Gunakan JID asli dari server WA
                            } else {
                                console.log(`[SKIP] Nomor palsu / tidak ada WA: ${pureNumber}`);
                            }
                        } catch (err) {
                            console.log(`[ERROR] Gagal mengecek nomor: ${pureNumber}`);
                        }
                    }
                }
            }

            if (missingNumbers.length === 0) {
                return await sock.sendMessage(remoteJid, { 
                    text: '✅ *Semua Beres!*\nSeluruh pendaftar yang sudah selesai verifikasi sudah berada di dalam grup ini (Data yang tersisa adalah nomor yang tidak terdaftar di WhatsApp).' 
                });
            }

            console.log("\n[DEBUG] Menambahkan JID VALID ke grup:", missingNumbers);

            // 6. Masukkan nomor yang tertinggal ke dalam grup
            await sock.sendMessage(remoteJid, { 
                text: `Menemukan *${missingNumbers.length}* nomor aktif WA yang belum masuk. Sedang menarik ke dalam grup...` 
            });

            // Eksekusi penambahan anggota menggunakan Baileys
            const addResponse = await sock.groupParticipantsUpdate(
                remoteJid, 
                missingNumbers,
                "add" 
            );

            // Cek hasilnya
            await sock.sendMessage(remoteJid, { 
                text: `✅ Eksekusi selesai. Telah mencoba menambahkan ${missingNumbers.length} nomor.\n\n_(Catatan: Jika ada nomor yang menolak ditambahkan, itu karena settingan privasi grup di HP mereka)_` 
            });

        } catch (error) {
            console.error('Error Sync Grup:', error);
            
            if (error.message.includes('not-authorized')) {
                await sock.sendMessage(remoteJid, { text: '❌ *Gagal!*\nPastikan Bot ini sudah diangkat menjadi Admin Grup agar bisa menambahkan anggota.' });
            } else {
                await sock.sendMessage(remoteJid, { text: `❌ Terjadi kesalahan: ${error.message}` });
            }
        }
    }
};