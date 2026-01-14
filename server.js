const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority');

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String });

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(cookieSession({ name: 'session', keys: ['key'], maxAge: 24 * 60 * 60 * 1000 }));

// TAMPILAN PEMBELI (INDEX)
app.get('/', async (req, res) => {
    const data = await Buku.find() || [];
    res.send(`
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: sans-serif; background: #121212; color: white; padding: 20px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
                .card { background: #1e1e1e; padding: 10px; border-radius: 10px; border: 1px solid #333; text-align: center; }
                img { width: 100%; height: 250px; object-fit: cover; border-radius: 5px; }
                .price { color: #00ff88; font-weight: bold; }
                .btn { background: #25d366; color: white; text-decoration: none; padding: 8px; display: block; border-radius: 5px; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h1 style="text-align:center">📚 JESTRI STORE</h1>
            <div class="grid">
                ${data.map(b => `
                    <div class="card">
                        <img src="${b.gambar}">
                        <h3>${b.judul}</h3>
                        <p class="price">Rp ${b.harga.toLocaleString('id-ID')}</p>
                        <a href="https://wa.me/628123456789" class="btn">Beli Sekarang</a>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `);
});

// LOGIN & ADMIN (Sederhana tapi Rapi)
app.get('/login', (req, res) => {
    res.send('<form action="/admin-dashboard" method="POST"><input type="password" name="password"><button>Login</button></form>');
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') { req.session.admin = true; res.redirect('/jestri-control'); }
    else { res.send('Salah!'); }
});

app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const data = await Buku.find() || [];
    res.send(`
        <style>body{font-family:sans-serif; padding:20px;} input{display:block; margin:10px 0; padding:10px; width:100%;}</style>
        <h2>Panel Admin</h2>
        <form action="/tambah-buku" method="POST">
            <input type="text" name="judul" placeholder="Judul" required>
            <input type="text" name="penulis" placeholder="Penulis" required>
            <input type="number" name="harga" placeholder="Harga (Angka)" required>
            <input type="text" name="gambar" placeholder="Link Gambar" required>
            <button type="submit" style="padding:10px; width:100%; background:orange;">SIMPAN</button>
        </form>
        <hr>
        ${data.map(b => `<p>${b.judul} - Rp ${b.harga} <a href="/hapus-buku/${b._id}">Hapus</a></p>`).join('')}
    `);
});

app.post('/tambah-buku', async (req, res) => {
    if (req.session.admin) await new Buku({...req.body, harga: Number(req.body.harga)}).save();
    res.redirect('/jestri-control');
});

app.get('/hapus-buku/:id', async (req, res) => {
    if (req.session.admin) await Buku.findByIdAndDelete(req.params.id);
    res.redirect('/jestri-control');
});

module.exports = app;

