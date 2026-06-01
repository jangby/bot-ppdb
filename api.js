const axios = require('axios');
const config = require('./config');

// Fungsi untuk hit API Statistik (!stat)
async function getStat() {
    try {
        const response = await axios.get(`${config.API_URL}/stat`);
        return response.data; // Mengembalikan JSON dari Laravel
    } catch (error) {
        console.error("Error getStat:", error.message);
        return null;
    }
}

// Fungsi untuk hit API Status Pendaftaran (!cekstatus)
async function checkStatus(no_daftar) {
    try {
        const response = await axios.get(`${config.API_URL}/status/${no_daftar}`);
        return response.data;
    } catch (error) {
        // Jika error 404 (Data tidak ditemukan)
        if (error.response && error.response.status === 404) {
            return error.response.data;
        }
        console.error("Error checkStatus:", error.message);
        return null;
    }
}

// Fungsi untuk hit API Rincian (!rincian)
async function getRincian() {
    try {
        const response = await axios.get(`${config.API_URL}/rincian`);
        return response.data;
    } catch (error) {
        console.error("Error getRincian:", error.message);
        return null;
    }
}

// Fungsi mengecek token awal
async function checkToken(token) {
    try {
        console.log(`\n🔍 [DEBUG] Mencari token ke: ${config.API_URL}/wa-check-token/${token}`);
        const response = await axios.get(`${config.API_URL}/wa-check-token/${token}`);
        console.log(`✅ [DEBUG] Hasil Server:`, response.data);
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error(`❌ [DEBUG] Server membalas dengan Error ${error.response.status}:`, error.response.data);
            if (error.response.status === 404) return error.response.data;
        } else {
            console.error(`🚨 [DEBUG] Bot gagal menghubungi server Laravel! Pesan:`, error.message);
            console.error(`💡 Tips: Pastikan 'php artisan serve' menyala dan gunakan http://127.0.0.1:8000`);
        }
        return null;
    }
}

// Fungsi mengirim semua data yang sudah terkumpul ke server
async function submitDaftar(data) {
    try {
        const response = await axios.post(`${config.API_URL}/wa-submit-daftar`, data);
        return response.data;
    } catch (error) {
        if (error.response) return error.response.data;
        console.error("Error submitDaftar:", error.message);
        return null;
    }
}

module.exports = {
    getStat,
    checkStatus,
    getRincian,
    checkToken,    // Tambahan baru
    submitDaftar
};