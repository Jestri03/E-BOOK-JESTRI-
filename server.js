const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// Koneksi Database
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
}).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { judul: String, harga: Number, gambar: String });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['key1'], maxAge: 24 * 60 * 60 * 1000 }));

// MODE PEMBELI - Langsung Muncul Tanpa Nunggu
app.get('/', async (req, res) => {
    try {
        const data = await Buku.find().lean() || [];
        
        let content = '';
        if (data.length === 0) {
            content = '<h2 style="text-align:center; color:#888;">BELUM ADA KOLEKSI BUKU.</h2>';
        } else {
            content = `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:20px;">
                ${data.map(b => `
                    <div style="background:#1a1a1a; padding:15px; border-radius:15px; border:1px solid #333; text-align:center;">
                        <img src="${b.gambar}" style="width:100%; height:300px; object-fit:cover; border-radius:10px;">
                        <h3 style="color:#f39c12;">${b.judul}</h3>
                        <p style="color:#2ecc71; font-weight:bold; font-size:1.2em;">Rp ${Number(b.harga).toLocaleString('id-ID')}</p>
                        <a href="https://wa.me/628XXXXXXXXX" style="background:#f39c12; color:white; padding:10px; display:block; text-decoration:none; border-radius:8px; font-weight:bold;">BELI SEKARANG</a>
                    </div>
                `).join('')}
            </div>`;
        }

        res.send(`
            <!DOCTYPE html>
            <html style="background:#0a0a0a; color:white; font-family:sans-serif;">
            <head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>JESTRI STORE</title></head>
            <body style="margin:0; padding:20px;">
                <h1 style="text-align:center; color:#f39c12; letter-spacing:3px;">JESTRI STORE</h1>
                <div style="max-width:1200px; margin:auto;">${content}</div>
            </body>
            </html>
        `);
    } catch (e) {
        res.send("<h1>Server Error. Mohon Refresh Halaman.</h1>");
    }
});

// Admin Route Simple
app.get('/login', (req, res) => {
    res.send('<body style="background:#0a0a0a;color:white;text-align:center;"><form action="/login" method="POST"><h2>LOGIN ADMIN</h2><input type="password" name="pw"><button>MASUK</button></form></body>');
});
app.post('/login', (req, res) => {
    if(req.body.pw === 'JESTRI0301209') { req.session.admin=true; res.redirect('/admin'); }
    else res.send("Salah");
});
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    res.send('<body style="background:#111;color:white;padding:20px;"><h2>Tambah Buku</h2><form action="/add" method="POST"><input name="judul" placeholder="Judul"><input name="harga" placeholder="Harga"><input name="gambar" placeholder="Link Gambar"><button>SIMPAN</button></form><br><a href="/">Lihat Toko</a></body>');
});
app.post('/add', async (req, res) => {
    if(req.session.admin) await new Buku(req.body).save();
    res.redirect('/admin');
});

module.exports = app;

