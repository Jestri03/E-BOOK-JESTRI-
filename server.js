const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority');

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-secret'], maxAge: 24 * 60 * 60 * 1000 }));

const style = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;600&display=swap');
    body { font-family: 'Poppins', sans-serif; background: #0a0a0a; color: white; margin: 0; padding: 0; }
    .header { text-align: center; padding: 50px 0; background: #111; border-bottom: 3px solid #f39c12; box-shadow: 0 5px 20px rgba(243,156,18,0.2); }
    .header h1 { color: #f39c12; letter-spacing: 5px; text-transform: uppercase; margin: 0; }
    .container { max-width: 1200px; margin: auto; padding: 40px 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
    .card { background: #181818; border-radius: 20px; overflow: hidden; border: 1px solid #333; transition: 0.4s; text-align: center; }
    .card:hover { transform: translateY(-10px); border-color: #f39c12; box-shadow: 0 10px 30px rgba(243,156,18,0.3); }
    .card img { width: 100%; height: 400px; object-fit: cover; }
    .info { padding: 25px; }
    .price { color: #2ecc71; font-size: 1.6em; font-weight: bold; margin-bottom: 20px; display: block; }
    .btn { background: #f39c12; color: white; text-decoration: none; padding: 15px; display: block; border-radius: 12px; font-weight: bold; transition: 0.3s; }
    .btn:hover { background: #e67e22; transform: scale(1.05); }
    .admin-form { background: #181818; padding: 30px; border-radius: 20px; max-width: 500px; margin: 0 auto 40px; border: 1px solid #333; }
    input { width: 100%; padding: 15px; margin: 10px 0; border-radius: 10px; border: 1px solid #444; background: #222; color: white; box-sizing: border-box; }
    .btn-save { width: 100%; padding: 15px; background: #f39c12; border: none; color: white; border-radius: 10px; cursor: pointer; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; background: #181818; border-radius: 15px; overflow: hidden; }
    th, td { padding: 15px; border-bottom: 1px solid #333; text-align: left; }
    th { background: #222; color: #f39c12; }
</style>`;

app.get('/', async (req, res) => {
    const data = await Buku.find() || [];
    const items = data.map(b => `
        <div class="card">
            <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/400x600?text=No+Cover'">
            <div class="info">
                <h3>${b.judul}</h3>
                <span class="price">Rp ${b.harga.toLocaleString('id-ID')}</span>
                <a href="https://wa.me/628123456789?text=Beli%20${b.judul}" class="btn">BELI SEKARANG</a>
            </div>
        </div>`).join('');
    res.send(`<!DOCTYPE html><html><head><title>JESTRI STORE</title>${style}</head><body><div class="header"><h1>JESTRI E-BOOK</h1></div><div class="container"><div class="grid">${items}</div></div></body></html>`);
});

app.get('/login', (req, res) => {
    res.send(`<html><head>${style}</head><body><div class="container"><div class="admin-form"><h2>ADMIN LOGIN</h2><form action="/admin-dashboard" method="POST"><input type="password" name="password" placeholder="Password" required><button class="btn-save">LOGIN</button></form></div></div></body></html>`);
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') { req.session.admin = true; res.redirect('/jestri-control'); }
    else res.send("Salah!");
});

app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const data = await Buku.find() || [];
    const rows = data.map(b => `<tr><td>${b.judul}</td><td>Rp ${b.harga.toLocaleString('id-ID')}</td><td><a href="/hapus-buku/${b._id}" style="color:red">Hapus</a></td></tr>`).join('');
    res.send(`<html><head>${style}</head><body><div class="container"><div class="admin-form"><h2>TAMBAH BUKU</h2><form action="/tambah-buku" method="POST"><input type="text" name="judul" placeholder="Judul"><input type="number" name="harga" placeholder="Harga"><input type="text" name="gambar" placeholder="Link Gambar"><button class="btn-save">SIMPAN</button></form></div><table>${rows}</table></div></body></html>`);
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

