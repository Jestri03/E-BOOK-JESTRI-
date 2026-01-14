const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONNECTION (With Extra Protection) ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000 // Menunggu 10 detik sebelum menyerah
})
.then(() => console.log("DB Berhasil Terhubung!"))
.catch(err => console.error("Gagal konek DB: ", err));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

// --- MIDDLEWARE ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({
    name: 'jestri_session',
    keys: ['SUPER_SECRET_JESTRI'],
    maxAge: 24 * 60 * 60 * 1000,
    secure: false, // Penting: Biar lancar di semua link
    httpOnly: true
}));

// --- ROUTES ---

// Mode Pembeli (Tetap Sempurna)
app.get('/', async (req, res) => {
    try {
        const initial = await Buku.find().sort({_id:-1}).limit(12).lean();
        // (Masukkan template HTML Pembeli yang lengkap dari pesan sebelumnya di sini)
        res.send(`...isi template pembeli...`);
    } catch (e) {
        res.status(500).send("Gagal memuat data pembeli.");
    }
});

// Login Page
app.get('/login', (req, res) => {
    res.send(`
    <div style="text-align:center; padding:50px; font-family:sans-serif;">
        <h2>🔐 ADMIN LOGIN</h2>
        <form action="/login" method="POST">
            <input type="password" name="pw" placeholder="Kunci Akses" style="padding:15px; width:200px; border-radius:10px; border:1px solid #ccc;"><br><br>
            <button type="submit" style="padding:15px 30px; background:black; color:white; border-radius:10px; cursor:pointer;">MASUK</button>
        </form>
    </div>`);
});

app.post('/login', (req, res) => {
    if (req.body.pw === 'JESTRI0301209') {
        req.session.admin = true;
        res.redirect('/admin');
    } else {
        res.send("<script>alert('Password Salah!'); window.location.href='/login';</script>");
    }
});

// Dashboard Admin (Perbaikan Total)
app.get('/admin', async (req, res) => {
    if(!req.session || !req.session.admin) return res.redirect('/login');
    try {
        const b = await Buku.find().sort({_id:-1}).lean();
        res.send(`
        <div style="font-family:sans-serif; max-width:600px; margin:auto; padding:20px;">
            <h3>DASHBOARD ADMIN JESTRI</h3>
            <hr>
            <form action="/add" method="POST" style="background:#f9f9f9; padding:20px; border-radius:15px;">
                <input name="judul" placeholder="Judul Buku" style="width:100%; padding:10px; margin-bottom:10px;" required>
                <input name="penulis" placeholder="Penulis" style="width:100%; padding:10px; margin-bottom:10px;" required>
                <input name="harga" type="number" placeholder="Harga" style="width:100%; padding:10px; margin-bottom:10px;" required>
                <input name="gambar" placeholder="Link Gambar (URL)" style="width:100%; padding:10px; margin-bottom:10px;" required>
                <button type="submit" style="width:100%; padding:15px; background:green; color:white; border:none; border-radius:10px;">UPLOAD BUKU</button>
            </form>
            <br>
            <a href="/logout" style="color:red">LOGOUT</a>
        </div>`);
    } catch (e) {
        res.status(500).send("Gagal masuk dashboard.");
    }
});

// Post Buku Baru (Sempurna)
app.post('/add', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    await new Buku(req.body).save();
    res.redirect('/admin');
});

app.get('/logout', (req, res) => { req.session = null; res.redirect('/'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Active on Port " + PORT));

