const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs'); // Tambahan: Library untuk membaca file system
const path = require('path'); // Tambahan: Library untuk membaca path/lokasi folder
const api = require('./api');
const { sessions, formSteps } = require('./session');

// ==========================================
// MENGUMPULKAN SEMUA COMMAND
// ==========================================
const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop'),
        syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\nScan QR Code di bawah ini menggunakan WhatsApp Anda:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus. Mencoba menghubungkan kembali dalam 3 detik...', shouldReconnect);
            
            if (shouldReconnect) {
                setTimeout(() => {
                    startBot();
                }, 3000);
            } else {
                console.log('Anda telah logout dari WhatsApp. Silakan hapus folder "auth_info_baileys" dan scan QR ulang.');
            }
        } else if (connection === 'open') {
            console.log('\n✅ Bot WhatsApp Berhasil Terhubung dan Siap Digunakan!\n');
            console.log(`📂 Berhasil memuat ${commands.size} perintah (commands).`);
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        const textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const commandName = textMessage.trim().split(' ')[0].toLowerCase();
        const args = textMessage.trim().split(' ').slice(1);

        console.log(`Pesan masuk dari ${remoteJid}: ${textMessage}`);

        // ==========================================
        // FITUR INTERAKTIF: PENGISIAN BIODATA WA
        // ==========================================
        if (sessions.has(remoteJid)) {
            const session = sessions.get(remoteJid);
            const answer = textMessage.trim();

            // Fitur Membatalkan Form
            if (answer.toUpperCase() === 'BATAL') {
                sessions.delete(remoteJid);
                return await sock.sendMessage(remoteJid, { text: '🚫 *Pengisian dibatalkan.*\nData yang belum terkirim telah dihapus dari sistem.' });
            }

            // --- FASE 1: KONFIRMASI DATA (JIKA SEMUA SUDAH DIISI) ---
            if (session.isConfirming) {
                if (answer.toUpperCase() === 'YA') {
                    await sock.sendMessage(remoteJid, { text: '⏳ _Semua data valid. Sedang menyimpan ke server..._' });
                    
                    const submitResponse = await api.submitDaftar(session.collectedData);
                    
                    if (submitResponse && submitResponse.success) {
                        await sock.sendMessage(remoteJid, { 
                            text: `🎉 *PENDAFTARAN BERHASIL!*\n\nNomor Pendaftaran: *${submitResponse.data?.no_daftar || 'Selesai'}*\nSilakan ketik *!cekstatus [Nomor_Pendaftaran]* untuk mengecek update seleksi.` 
                        });
                        sessions.delete(remoteJid); // Bersihkan memori
                    } else {
                        const errorMsg = submitResponse?.message || 'Terjadi kesalahan pada database (Pastikan kolom database Anda sudah nullable jika opsional).';
                        await sock.sendMessage(remoteJid, { text: `❌ *Gagal Menyimpan Data*\nAlasan: ${errorMsg}\n\nKetik *YA* untuk mencoba kirim ulang, atau *EDIT* untuk memperbaiki data.` });
                    }
                } else if (answer.toUpperCase() === 'EDIT') {
                    // Mengulang pengisian data yang kosong
                    session.currentStepIndex = 0;
                    session.isConfirming = false;
                    const firstQuestion = session.missingSteps[0].question;
                    await sock.sendMessage(remoteJid, { text: `🔄 *Mode Perbaikan*\nMari kita ulangi pengisian sisanya.\n\n${firstQuestion}` });
                } else {
                    await sock.sendMessage(remoteJid, { text: '⚠️ Ketik *YA* jika data sudah benar, atau *EDIT* jika ingin mengulang.' });
                }
                return; // Berhenti di sini, jangan lanjut ke bawah
            }

            // --- FASE 2: TANYA JAWAB DAN VALIDASI ---
            const currentStep = session.missingSteps[session.currentStepIndex];
            let finalAnswer = answer;

            // A. Mengubah tanda strip (-) menjadi null agar tidak membuat error di database
            if (finalAnswer === '-') {
                finalAnswer = null;
            }

            // B. Validasi NIK dan KK (Harus 16 Digit)
            if (finalAnswer !== null && (currentStep.key === 'nik' || currentStep.key === 'no_kk' || currentStep.key === 'nik_ayah' || currentStep.key === 'nik_ibu')) {
                if (!/^\d{16}$/.test(finalAnswer)) {
                    return await sock.sendMessage(remoteJid, { text: `❌ *Format Salah!*\nPastikan isian berjumlah tepat *16 digit angka* (tanpa spasi/huruf).\n\nSilakan ketik ulang:` });
                }
            }

            // C. Validasi Tanggal Lahir (Kirim murni DD-MM-YYYY ke Laravel)
            if (finalAnswer !== null && currentStep.key === 'tanggal_lahir') {
                const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
                if (!dateRegex.test(finalAnswer)) {
                    return await sock.sendMessage(remoteJid, { text: `❌ *Format Tanggal Salah!*\nGunakan format *DD-MM-YYYY* dengan tanda strip (Contoh: 24-05-2010).\n\nSilakan ketik ulang:` });
                }
                // (Baris konversi dihapus agar bot mengirim sesuai persis ketikan user)
            }

            // D. Validasi Anak Ke / Jumlah Saudara (Harus berupa angka mutlak jika diisi)
            if (finalAnswer !== null && (currentStep.key === 'anak_ke' || currentStep.key === 'jumlah_saudara')) {
                if (!/^\d+$/.test(finalAnswer)) {
                    return await sock.sendMessage(remoteJid, { text: `❌ *Format Salah!*\nPastikan isian hanya berupa *Angka* (Contoh: 1).\n\nSilakan ketik ulang:` });
                }
            }

            // Simpan jawaban yang sudah tervalidasi ke memori
            session.collectedData[currentStep.key] = finalAnswer;

            // Pindah ke pertanyaan berikutnya
            session.currentStepIndex++;

            if (session.currentStepIndex < session.missingSteps.length) {
                // Ajukan pertanyaan selanjutnya
                const nextQuestion = session.missingSteps[session.currentStepIndex].question;
                return await sock.sendMessage(remoteJid, { text: nextQuestion });
            } else {
                // --- FASE 3: JIKA PERTANYAAN HABIS, TAMPILKAN REKAP ---
                session.isConfirming = true; // Aktifkan mode konfirmasi
                
                let summary = `📋 *KONFIRMASI DATA BIODATA*\n\nMohon periksa kembali data Anda dengan teliti:\n\n`;

                // Loop semua pertanyaan agar urutannya rapi
                for (const step of formSteps) {
                    const value = session.collectedData[step.key];
                    if (value !== undefined) { // Tampilkan jika datanya ada
                        // Mengambil teks di antara tanda bintang *...* sebagai Label
                        const labelMatch = step.question.match(/\*(.*?)\*/); 
                        const label = labelMatch ? labelMatch[1] : step.key;
                        
                        // Jika value null (karena user mengetik -), tampilkan "(Kosong)"
                        summary += `🔹 *${label}*: ${value !== null ? value : '-(Kosong)'}\n`;
                    }
                }

                summary += `\n─────────────────────\nApakah data di atas sudah benar?\n\nKetik *YA* untuk mengirim ke server.\nKetik *EDIT* untuk mengulang pengisian.\nKetik *BATAL* untuk membatalkan.`;

                return await sock.sendMessage(remoteJid, { text: summary });
            }
        }

        // ==========================================
        // EKSEKUSI COMMAND BIASA SECARA OTOMATIS
        // ==========================================
        if (commands.has(commandName)) {
            console.log(`[Perintah Diterima] ${commandName} dari ${remoteJid}`);
            try {
                await commands.get(commandName).execute(sock, remoteJid, args, api, msg);
            } catch (error) {
                console.error(`Error saat menjalankan ${commandName}:`, error);
                await sock.sendMessage(remoteJid, { text: '❌ Terjadi kesalahan pada server bot saat mengeksekusi perintah ini.' });
            }
        }
    });
}

startBot();