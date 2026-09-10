const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// PENGATURAN KODE RAHASIA & KUNCI UTAMA
// ==========================================
const ADMIN_SECRET_CODE = 'adminmaskay55'; // Kode rahasia login admin Anda di web
const MASTER_API_KEY = 'maskay';       // API Key bawaan/utama untuk user biasa

// Menyimpan daftar API Key yang valid di dalam memori RAM server
let VALID_API_KEYS = [MASTER_API_KEY];

// ==========================================
// FIX KONEKSI: MENGIZINKAN SEMUA WEBSITE (NETLIFY/LOCAL)
// ==========================================
app.use(cors({ origin: '*' }));

app.use(express.json());

const FIRST_NAMES = ['Budi', 'Andi', 'Joko', 'Siti', 'Dewi', 'Rini', 'Rian', 'Eko', 'Agus'];
const LAST_NAMES = ['Santoso', 'Wijaya', 'Prasetyo', 'Lestari', 'Kurniawan', 'Hidayat'];

/**
 * [ENDPOINT 1] GET: Pembuat NIK
 */
app.get('/api/generate-nik', (req, res) => {
    try {
        const { prov, kota, kec, dob, gender, nama, apikey } = req.query;

        // Validasi apakah API Key yang dimasukkan ada di dalam daftar array
        if (!apikey || !VALID_API_KEYS.includes(apikey)) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Unauthorized: API Key salah, tidak aktif, atau tidak dimasukkan.' 
            });
        }

        // Validasi kelengkapan data parameter
        if (!prov || !kota || !kec || !dob || !gender) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Parameter tidak lengkap. Butuh: prov, kota, kec, dob, gender.' 
            });
        }

        // Logika rumus pembuatan angka NIK KTP Indonesia
        const [dayPart, monthPart, yearPart] = dob.split('-');
        let day = parseInt(dayPart, 10);
        const month = monthPart.padStart(2, '0');
        const year = yearPart.substring(2);

        // Aturan khusus wanita: tanggal lahir ditambah 40
        if (gender.toLowerCase() === 'wanita') day += 40;
        const dayStr = String(day).padStart(2, '0');

        // Nomor urut otomatis acak 4 digit (0001 - 0999)
        const randomNum = crypto.randomInt(1, 1000);
        const nomorUrut = String(randomNum).padStart(4, '0');
        
        // Gabungkan susunan angka menjadi 16 digit NIK
        const nik = `${prov}${kota}${kec}${dayStr}${month}${year}${nomorUrut}`;

        // Pasang nama kustom jika diinput, atau acak nama lokal jika kosong
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
 * [ENDPOINT 2] GET: Akses Admin untuk Menambah API Key Baru
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

        // 3. Masukkan kunci baru ke memori RAM server agar langsung aktif
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
