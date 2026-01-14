const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority');

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-rahasia'], maxAge: 24 * 60 * 60 * 1000 }));

const layout = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        :root { --p: #f39c12; --bg: #0a0a0a; --c: #161616; }
        body { font-family: sans-serif; background: var(--bg); color: white; margin: 0; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .card { background: var(--c); border-radius: 15px; overflow: hidden; border: 1px solid #333; transition: 0.3s; text-align: center; }
        .card:hover { transform: translateY(-10px); border-color: var(--p); }
        .card img { width: 100%; height: 300px; object-fit: cover; }
        .info { padding: 15px; }
        .price { color: #2ecc71; font-size: 1.3em; font-weight: bold; margin: 10px 0; display: block; }
        .btn { background: var(--p); color: white; text-decoration: none; padding: 12px; display: block; border-radius: 8px; font-weight: bold; }
        .admin-form { background: var(--c); padding: 20px; border-radius: 15px; max-width: 400px; margin: auto; }
        input { width: 100%; padding: 10px; margin: 10px 0; border-radius: 5px; border: 1px solid #444; background: #222; color: white; box-sizing: border-box; }
        button { width: 100%; padding: 10px; background: var(--p); border: none; color: white; border-radius: 5px; cursor: pointer; }
        table { width: 100%; margin-top: 20px; border-collapse: collapse; }
        th, td { padding: 10px; border: 1px solid #333; text-align: left; }
    </style>
</head>
<body>${content}</body>
</html>`;

app.get('/', async (req, res) => {
    const data = await Buku.find() || [];
    const cards = data.map(b => `
        <div class="card">
            <img src="${b.gambar}">
            <div class="info">
                <h3>${b.judul}</h3>
                <span class="price">Rp ${b.harga.toLocaleString('id-ID')}</span>
                <a href="https://wa.me/628123456789" class="btn">BELI SEKARANG</a>
            </div>
        </div>`).join('');
    res.send(layout(`<h1 style="text-align:center; color:#f39c12">JESTRI E-BOOK</h1><div class="grid">${cards}</div>`));
});

app.get('/login', (req, res) => {
    res.send(layout(`<div class="admin-form"><h2>ADMIN LOGIN</h2><form action="/admin-dashboard" method="POST"><input type="password" name="password" placeholder="Password"><button>MASUK</button></form></div>`));
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') { req.session.admin = true; res.redirect('/jestri-control'); }
    else res.send("Salah!");
});

app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const data = await Buku.find() || [];
    const rows = data.map(b => `<tr><td>${b.judul}</td><td>${b.harga}</td><td><a href="/hapus-buku/${b._id}" style="color:red">Hapus</a></td></tr>`).join('');
    res.send(layout(`<div class="admin-form"><h2>TAMBAH BUKU</h2><form action="/tambah-buku" method="POST"><input type="text" name="judul" placeholder="Judul"><input type="number" name="harga" placeholder="Harga"><input type="text" name="gambar" placeholder="Link Gambar"><button>SIMPAN</button></form></div><table>${rows}</table>`));
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

