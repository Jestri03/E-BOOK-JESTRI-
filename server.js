const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority');

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-mewah'], maxAge: 24 * 60 * 60 * 1000 }));

const style = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;600&display=swap');
    body { font-family: 'Poppins', sans-serif; background: #0a0a0a; color: white; margin: 0; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; }
    .card { background: #161616; border-radius: 20px; overflow: hidden; border: 1px solid #333; transition: 0.4s; text-align: center; }
    .card:hover { transform: translateY(-10px); border-color: #f39c12; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .card img { width: 100%; height: 380px; object-fit: cover; }
    .info { padding: 20px; }
    .price { color: #2ecc71; font-size: 1.5em; font-weight: bold; margin-bottom: 15px; display: block; }
    .btn { background: #f39c12; color: white; text-decoration: none; padding: 12px; display: block; border-radius: 10px; font-weight: bold; }
    .admin-box { background: #161616; padding: 30px; border-radius: 20px; max-width: 500px; margin: auto; border: 1px solid #333; }
    input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #444; background: #222; color: white; box-sizing: border-box; }
    button { width: 100%; padding: 15px; background: #f39c12; border: none; color: white; border-radius: 10px; cursor: pointer; font-weight: bold; }
    table { width: 100%; margin-top: 30px; border-collapse: collapse; }
    th, td { padding: 15px; border-bottom: 1px solid #333; text-align: left; }
</style>`;

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
    res.send(`<html><head>${style}</head><body><h1 style="text-align:center; color:#f39c12">JESTRI E-BOOK STORE</h1><div class="grid">${cards}</div></body></html>`);
});

app.get('/login', (req, res) => {
    res.send(`<html><head>${style}</head><body><div class="admin-box"><h2>LOGIN ADMIN</h2><form action="/admin-dashboard" method="POST"><input type="password" name="password" placeholder="Password"><button>MASUK</button></form></div></body></html>`);
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') { req.session.admin = true; res.redirect('/jestri-control'); }
    else res.send("Salah!");
});

app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const data = await Buku.find() || [];
    const rows = data.map(b => `<tr><td>${b.judul}</td><td>Rp ${b.harga.toLocaleString('id-ID')}</td><td><a href="/hapus-buku/${b._id}" style="color:red">Hapus</a></td></tr>`).join('');
    res.send(`<html><head>${style}</head><body><div class="admin-box"><h2>TAMBAH BUKU</h2><form action="/tambah-buku" method="POST"><input type="text" name="judul" placeholder="Judul"><input type="text" name="penulis" placeholder="Penulis"><input type="number" name="harga" placeholder="Harga"><input type="text" name="gambar" placeholder="Link Gambar"><button>SIMPAN</button></form></div><table>${rows}</table></body></html>`);
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

