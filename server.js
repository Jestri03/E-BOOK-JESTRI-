const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000,
}).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

// --- PERBAIKAN SESSION (Gue ubah secure jadi false biar lancar) ---
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieSession({ 
    name: 'jestri_session',
    keys: ['CORE-KEY-01'], 
    maxAge: 24 * 60 * 60 * 1000,
    secure: false, // Ubah ke false supaya bisa login meski belum pakai SSL/HTTPS
    httpOnly: true
}));

// --- LOGIN ROUTE (Gue tambahin debug log) ---
app.post('/login', (req, res) => {
    const { pw } = req.body;
    console.log("Mencoba Login dengan PW:", pw); // Cek di terminal/console
    
    if (pw === 'JESTRI0301209') {
        req.session.admin = true;
        console.log("Login Berhasil!");
        return res.redirect('/admin');
    } else {
        console.log("Login Gagal: Password Salah");
        return res.send("<script>alert('Password Salah!'); window.location.href='/login';</script>");
    }
});

// --- DASHBOARD ADMIN (Gue tambahin pengecekan manual) ---
app.get('/admin', async (req, res) => {
    if(!req.session || !req.session.admin) {
        console.log("Akses Ditolak: Belum Login");
        return res.redirect('/login');
    }
    const b = await Buku.find().sort({_id:-1}).lean();
    // (Gunakan sisa kode tampilan admin dari sebelumnya di sini...)
    res.send(`...tampilan admin lo...`); 
});

