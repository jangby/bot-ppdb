const sessions = new Map();

// Daftar lengkap pertanyaan sesuai dengan <form> di web Laravel Anda
const formSteps = [
    // ==========================================
    // SECTION A: DATA PRIBADI
    // ==========================================
    { key: 'jenjang', question: '🎓 *Jenjang Pendidikan*\nKetik jenjang yang dituju (*SMP* *SMA* atau *Takhosus*):' },
    { key: 'nama_lengkap', question: '👤 *Nama Lengkap*\nKetik nama lengkap calon santri sesuai Akte/KK:' },
    { key: 'jenis_kelamin', question: '🚻 *Jenis Kelamin*\nKetik *L* untuk Laki-laki atau *P* untuk Perempuan:' },
    { key: 'tempat_lahir', question: '📍 *Tempat Lahir*\nKetik kota/tempat lahir calon santri (Contoh: Bandung):' },
    { key: 'tanggal_lahir', question: '📅 *Tanggal Lahir*\nKetik tanggal lahir dengan format *DD-MM-YYYY*\n(Contoh: 24-05-2010):' },
    { key: 'nisn', question: '🎓 *NISN* (Opsional)\nKetik angka NISN santri. \n_Ketik tanda strip ( *-* ) jika belum ada/tidak tahu_' },
    { key: 'nik', question: '💳 *NIK Santri*\nKetik 16 digit NIK santri (Lihat di KK):' },
    { key: 'asal_sekolah', question: '🏫 *Asal Sekolah*\nKetik nama sekolah asal sebelumnya:' },
    { key: 'no_kk', question: '📑 *Nomor KK*\nKetik 16 digit Nomor Kartu Keluarga:' },
    { key: 'anak_ke', question: '🔢 *Anak Ke-*\nAnak ke berapa? (Ketik angka saja, contoh: 1)\n_Ketik tanda strip ( *-* ) jika tidak ingin mengisi_' },
    { key: 'jumlah_saudara', question: '👥 *Jumlah Saudara*\nBerapa jumlah saudaranya? (Ketik angka saja)\n_Ketik tanda strip ( *-* ) jika tidak ingin mengisi_' },

    // ==========================================
    // SECTION B: ALAMAT DOMISILI
    // ==========================================
    { key: 'alamat', question: '🏠 *Alamat Jalan/Dusun*\nKetik nama Jalan/Dusun/Kampung *(tanpa RT/RW)*:' },
    { key: 'rt', question: '🏘️ *RT*\nKetik angka RT (Contoh: 01):' },
    { key: 'rw', question: '🏘️ *RW*\nKetik angka RW (Contoh: 02):' },
    { key: 'kode_pos', question: '📮 *Kode Pos*\nKetik angka Kode Pos (Contoh: 40552)\n_Ketik tanda strip ( *-* ) jika tidak tahu_' },
    { key: 'desa', question: '📌 *Desa / Kelurahan*\nKetik nama Desa atau Kelurahan:' },
    { key: 'kecamatan', question: '📌 *Kecamatan*\nKetik nama Kecamatan:' },
    { key: 'kabupaten', question: '🏙️ *Kabupaten / Kota*\nKetik nama Kabupaten / Kota:' },
    { key: 'provinsi', question: '🗺️ *Provinsi*\nKetik nama Provinsi:' },

    // ==========================================
    // SECTION C: DATA AYAH
    // ==========================================
    { key: 'nama_ayah', question: '👨 *Nama Ayah*\nKetik nama lengkap Ayah Kandung:' },
    { key: 'nik_ayah', question: '💳 *NIK Ayah* (Opsional)\nKetik 16 digit NIK Ayah, atau ketik *-* jika tidak ada:' },
    { key: 'pekerjaan_ayah', question: '💼 *Pekerjaan Ayah*\nKetik pekerjaan Ayah saat ini:' },
    { key: 'no_hp_ayah', question: '📱 *No. HP / WA Ayah*\nKetik nomor WA Ayah yang bisa dihubungi (Contoh: 0812...):' },
    { key: 'penghasilan_ayah', question: '💰 *Penghasilan Ayah* (Opsional)\nKetik rata-rata penghasilan per bulan (Contoh: 3000000) atau ketik *-*:' },

    // ==========================================
    // SECTION D: DATA IBU
    // ==========================================
    { key: 'nama_ibu', question: '👩 *Nama Ibu*\nKetik nama lengkap Ibu Kandung:' },
    { key: 'nik_ibu', question: '💳 *NIK Ibu* (Opsional)\nKetik 16 digit NIK Ibu, atau ketik *-* jika tidak ada:' },
    { key: 'pekerjaan_ibu', question: '💼 *Pekerjaan Ibu*\nKetik pekerjaan Ibu saat ini:' },
    { key: 'no_hp_ibu', question: '📱 *No. HP / WA Ibu*\nKetik nomor WA Ibu yang bisa dihubungi (Contoh: 0812...):' },
    { key: 'penghasilan_ibu', question: '💰 *Penghasilan Ibu* (Opsional)\nKetik rata-rata penghasilan per bulan (Contoh: 3000000) atau ketik *-*:' }
];

module.exports = { sessions, formSteps };