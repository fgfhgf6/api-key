const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// PENGATURAN KODE RAHASIA & KUNCI UTAMA
// ==========================================
const ADMIN_SECRET_CODE = 'adminmaskay55'; // Kode rahasia login admin Anda
const MASTER_API_KEY = 'maskay';       // API Key bawaan/utama

// Menyimpan daftar API Key yang valid di dalam memori RAM server
let VALID_API_KEYS = [MASTER_API_KEY];

// Konfigurasi CORS agar bisa diakses website Vercel
const ALLOWED_ORIGINS = ['http://localhost:5500', 'http://127.0.0.1:5500'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const isVercel = origin.endsWith('.vercel.app');
        if (ALLOWED_ORIGINS.indexOf(origin) !== -1 || isVercel) {
            return callback(null, true);
        } else {
            return callback(new Error('Akses CORS ditolak oleh server.'), false);
        }
    }
}));

const FIRST_NAMES = ['Budi', 'Andi', 'Joko', 'Siti', 'Dewi', 'Rini', 'Rian', 'Eko', 'Agus'];
const LAST_NAMES = ['Santoso', 'Wijaya', 'Prasetyo', 'Lestari', 'Kurniawan', 'Hidayat'];

/**
 * [ENDPOINT 1] GET: Pembuat NIK (Metode GET ala api.qsr.web.id)
 */
app.get('/api/generate-nik', (req, res) => {
    try {
        const { prov, kota, kec, dob, gender, nama, apikey } = req.query;

        // Validasi apakah API Key yang dimasukkan ada di dalam daftar array kita
        if (!apikey || !VALID_API_KEYS.includes(apikey)) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Unauthorized: API Key salah, tidak aktif, atau tidak dimasukkan.' 
            });
        }

        if (!prov || !kota || !kec || !dob || !gender) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Parameter tidak lengkap. Butuh: prov, kota, kec, dob, gender.' 
            });
        }

        const [dayPart, monthPart, yearPart] = dob.split('-');
        let day = parseInt(dayPart, 10);
        const month = monthPart.padStart(2, '0');
        const year = yearPart.substring(2);

        if (gender.toLowerCase() === 'wanita') day += 40;
        const dayStr = String(day).padStart(2, '0');

        const randomNum = crypto.randomInt(1, 1000);
        const nomorUrut = String(randomNum).padStart(4, '0');
        const nik = `${prov}${kota}${kec}${dayStr}${month}${year}${nomorUrut}`;

        let finalNama = nama || `${FIRST_NAMES[crypto.randomInt(0, FIRST_NAMES.length)]} ${LAST_NAMES[crypto.randomInt(0, LAST_NAMES.length)]}`;

        return res.status(200).json({ 
            status: 'success', 
            data: { nama: finalNama, gender, tanggal_lahir: dob, nik } 
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

/**
 * [ENDPOINT 2] GET: Akses Admin untuk Menambah API Key Baru ke Memori
 */
app.get('/api/admin/add-key', (req, res) => {
    try {
        const { secret, newkey } = req.query;

        // 1. Validasi Kode Rahasia Admin
        if (!secret || secret !== ADMIN_SECRET_CODE) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: Kode Rahasia Admin Salah!'
            });
        }

        if (!newkey) {
            return res.status(400).json({
                status: 'error',
                message: 'Gagal: Parameter `newkey` baru belum diisi.'
            });
        }

        // 2. Cek apakah kunci sudah terdaftar sebelumnya
        if (VALID_API_KEYS.includes(newkey)) {
            return res.status(400).json({
                status: 'error',
                message: 'Gagal: API Key tersebut sudah terdaftar di server.'
            });
        }

        // 3. Masukkan kunci baru ke memori RAM server
        VALID_API_KEYS.push(newkey);

        return res.status(200).json({
            status: 'success',
            message: `Berhasil menambahkan API Key baru!`,
            total_active_keys: VALID_API_KEYS.length,
            all_keys: VALID_API_KEYS
        });

    } catch (error) {
        return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));









