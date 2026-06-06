const { sessions, formSteps } = require('../session');

module.exports = {
    name: '.daftar',
    description: 'Mulai mengisi formulir pendaftaran interaktif',
    async execute(sock, remoteJid, args, api, msg) {
        
        // 1. Cek apakah user sedang dalam sesi pengisian form
        if (sessions.has(remoteJid)) {
            return await sock.sendMessage(remoteJid, { 
                text: '⚠️ Anda sedang dalam proses pengisian formulir.\nSilakan jawab pertanyaan sebelumnya atau ketik *BATAL* untuk membatalkan dan mengulang dari awal.' 
            }, { quoted: msg });
        }

        // 2. Validasi Token
        if (args.length === 0) {
            return await sock.sendMessage(remoteJid, { 
                text: '❌ Format salah!\n\nCara penggunaan:\n*!daftar [KODE_TOKEN]*\nContoh: .daftar ABC123XYZ' 
            }, { quoted: msg });
        }

        const token = args[0];
        await sock.sendMessage(remoteJid, { text: '⏳ _Memeriksa token pendaftaran Anda..._' });

        // 3. Cek Token ke Server API Laravel
        const response = await api.checkToken(token);
        
        // Jika server mati (return null)
        if (!response) {
            return await sock.sendMessage(remoteJid, { 
                text: `🚨 *Sistem Offline*\nGagal terhubung ke server database.` 
            }, { quoted: msg });
        }

        // Jika success: false (Entah karena token salah ATAU karena data sudah lengkap)
        if (!response.success) {
            const pesanDariServer = response.message || 'Token tidak valid / kedaluwarsa.';
            return await sock.sendMessage(remoteJid, { 
                text: `❌ *Pemberitahuan:*\n${pesanDariServer}` 
            }, { quoted: msg });
        }

        // 4. Ambil data yang dikembalikan server
        const existingData = response.data; 
        existingData.token = token; 

        // Samakan key 'nama' dari API ke 'nama_lengkap' sesuai format bot kita
        if (existingData.nama && !existingData.nama_lengkap) {
            existingData.nama_lengkap = existingData.nama;
        }

        // 5. Saring pertanyaan: HANYA tanyakan data yang belum ada isinya di database
        const missingSteps = formSteps.filter(step => !existingData[step.key]);

        // Jaga-jaga jika ternyata semua array pertanyaan sudah terjawab
        if (missingSteps.length === 0) {
            return await sock.sendMessage(remoteJid, { 
                text: '✅ *Data Sudah Lengkap!*\nSeluruh biodata untuk token ini sudah terisi penuh di sistem.' 
            });
        }

        // 6. Simpan ke Sesi Memori Bot
        sessions.set(remoteJid, {
            collectedData: existingData,
            missingSteps: missingSteps,
            currentStepIndex: 0,
            isConfirming: false
        });

        // ==========================================
        // 7. SIAPKAN PESAN SAMBUTAN INTERAKTIF
        // ==========================================
        let welcomeMsg = `✅ *Token Valid!*\n\n`;

        // Cek apakah data ini adalah data "Pancingan" dari Admin (registerBasic)
        if (response.is_admin_filled && existingData.nama_lengkap) {
            const labelJK = existingData.jenis_kelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)';
            
            welcomeMsg += `Halo Orangtua/Wali Dari *${existingData.nama_lengkap}*, kami menemukan data awal Anda yang telah didaftarkan oleh panitia:\n\n` +
                          `🏫 Jenjang: *${existingData.jenjang}*\n` +
                          `🚻 Jenis Kelamin: *${labelJK}*\n\n` +
                          `Mari lengkapi sisa biodata Anda.\n`;
        } else {
            // Jika murni mendaftar dari web sendiri tanpa campur tangan admin
            welcomeMsg += `Mari lengkapi biodata pendaftaran Anda secara berurutan.\n`;
        }

        welcomeMsg += `_(Ketik *BATAL* kapan saja jika ingin membatalkan)_\n\n`;
        
        // Ajukan Pertanyaan Pertama yang tersisa (Biasanya akan langsung melompat ke pertanyaan Tempat Lahir / NIK)
        const firstQuestion = missingSteps[0].question;
        
        await sock.sendMessage(remoteJid, { text: welcomeMsg + firstQuestion });
    }
};