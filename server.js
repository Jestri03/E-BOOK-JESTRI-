const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- KONEKSI DATABASE (OPTIMAL) ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 15000 // Menunggu lebih lama agar tidak "Invocation Failed"
}).then(() => console.log("Database Connected!"))
  .catch(err => console.error("DB Error: ", err));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

// --- MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({
    name: 'jestri_session',
    keys: ['CORE-JESTRI-99'],
    maxAge: 24 * 60 * 60 * 1000,
    secure: false, // Penting agar bisa login di semua kondisi
    httpOnly: true
}));

// --- ROUTE ADMIN (PERBAIKAN TOTAL) ---

// Halaman Login
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Login</title><style>body{margin:0;background:#0f172a;height:100vh;display:grid;place-items:center;font-family:sans-serif;color:#fff;}.box{width:90%;max-width:320px;padding:40px;background:rgba(255,255,255,0.05);border-radius:25px;border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(10px);text-align:center;}input{width:100%;padding:15px;margin:20px 0;border-radius:10px;border:none;background:rgba(255,255,255,0.1);color:#fff;text-align:center;box-sizing:border-box;}button{width:100%;padding:15px;border-radius:10px;border:none;background:#3b82f6;color:#fff;font-weight:800;cursor:pointer;}</style></head><body><div class="box"><h2>Admin Entry</h2><form action="/login" method="POST"><input type="password" name="pw" placeholder="Kunci Akses" required autofocus><button>MASUK</button></form></div></body></html>`);
});

app.post('/login', (req, res) => {
    if (req.body.pw === 'JESTRI0301209') {
        req.session.admin = true;
        res.redirect('/admin');
    } else {
        res.send("<script>alert('Password Salah!'); window.location.href='/login';</script>");
    }
});

// Dashboard Admin (Tempat Tambah Buku)
app.get('/admin', async (req, res) => {
    if(!req.session || !req.session.admin) return res.redirect('/login');
    try {
        const b = await Buku.find().sort({_id:-1}).lean();
        res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:sans-serif;background:#f4f7f6;margin:0;padding:20px;display:flex;justify-content:center;} .wrap{width:100%;max-width:500px;} .card{background:#fff;padding:20px;border-radius:15px;box-shadow:0 5px 15px rgba(0,0,0,0.05);} input, select{width:100%;padding:12px;margin-bottom:10px;border-radius:8px;border:1px solid #ddd;box-sizing:border-box;} button{width:100%;padding:15px;background:#000;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;}</style></head><body>
        <div class="wrap">
            <div style="display:flex;justify-content:space-between;align-items:center;"><h3>ADMIN DASHBOARD</h3><a href="/logout" style="color:red;text-decoration:none;">LOGOUT</a></div>
            <div class="card">
                <form action="/add" method="POST">
                    <input name="judul" placeholder="Judul Buku" required>
                    <input name="penulis" placeholder="Penulis" required>
                    <input name="harga" type="number" placeholder="Harga (Contoh: 50000)" required>
                    <input name="gambar" placeholder="Link URL Gambar (IMG BB)" required>
                    <select name="genre"><option>Fiksi</option><option>Edukasi</option><option>Teknologi</option><option>Bisnis</option></select>
                    <button type="submit">POSTING BUKU</button>
                </form>
            </div>
            <div style="margin-top:20px;">
                ${b.map(x => `<div style="background:#fff;padding:10px;border-radius:10px;margin-bottom:5px;display:flex;justify-content:space-between;border:1px solid #eee;"><span>${x.judul}</span><a href="/del/${x._id}" style="color:red;text-decoration:none;">Hapus</a></div>`).join('')}
            </div>
        </div></body></html>`);
    } catch (e) { res.send("Gagal memuat dashboard admin."); }
});

// Tambah Buku
app.post('/add', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    await new Buku(req.body).save();
    res.redirect('/admin');
});

// Hapus Buku
app.get('/del/:id', async (req, res) => {
    if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); }
});

// Logout
app.get('/logout', (req, res) => { req.session = null; res.redirect('/'); });

// Mode Pembeli (Root)
app.get('/', async (req, res) => {
    try {
        const initial = await Buku.find().sort({_id:-1}).limit(20).lean();
        // (Gunakan kode HTML Mode Pembeli yang lo punya sebelumnya di sini)
        res.send("Halaman Pembeli - Silakan masukkan HTML Katalog lo di sini.");
    } catch (e) { res.send("Error memuat katalog."); }
});

module.exports = app; // Penting untuk Vercel

