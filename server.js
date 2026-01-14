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
    body { font-family: 'Poppins', sans-serif; background: #080808; color: white; margin: 0; padding: 0; }
    .header { text-align: center; padding: 60px 0; background: linear-gradient(135deg, #1a1a1a 0%, #080808 100%); border-bottom: 3px solid #f39c12; }
    .header h1 { color: #f39c12; letter-spacing: 4px; text-transform: uppercase; margin: 0; font-size: 2.5em; }
    .container { max-width: 1200px; margin: auto; padding: 40px 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 35px; }
    .card { background: #121212; border-radius: 20px; overflow: hidden; border: 1px solid #222; transition: 0.5s; text-align: center; box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
    .card:hover { transform: translateY(-15px); border-color: #f39c12; box-shadow: 0 15px 40px rgba(243, 156, 18, 0.2); }
    .card img { width: 100%; height: 400px; object-fit: cover; }
    .info { padding: 25px; }
    .info h3 { font-size: 1.4em; margin-bottom: 10px; color: #f39c12; }
    .price { color: #2ecc71; font-size: 1.7em; font-weight: 600; margin-bottom: 20px; display: block; }
    .btn { background: #f39c12; color: white; text-decoration: none; padding: 15px; display: block; border-radius: 12px; font-weight: 600; transition: 0.3s; }
    .btn:hover { background: #e67e22; transform: scale(1.05); }
    .admin-form { background: #121212; padding: 30px; border-radius: 20px; max-width: 500px; margin: 0 auto 50px; border: 1px solid #333; }
    input { width: 100%; padding: 15px; margin: 10px 0; border-radius: 10px; border: 1px solid #333; background: #1a1a1a; color: white; box-sizing: border-box; }
    .btn-save { width: 100%; padding: 15px; background: #f39c12; border: none; color: white; border-radius: 10px; cursor: pointer; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; background: #121212; border-radius: 15px; overflow: hidden; }
    th, td { padding: 20px; text-align: left; border-bottom: 1px solid #222; }
    th { background: #222; color: #f39c12; }
</style>`;

app.get('/', async (req, res) => {
    const data = await Buku.find() || [];
    const items = data.map(b => `
        <div class="card">
            <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/400x600?text=Cover+Buku'">
            <div class="info">
                <h3>${b.judul}</h3>
                <span class="price">Rp ${b.harga.toLocaleString('id-ID')}</span>
                <a href="https://wa.me/628123456789?text=Order%20${b.judul}" class="btn">🛒 BELI SEKARANG</a>
            </div>
        </div>`).join('');
    res.send(`<!DOCTYPE html><html><head><title>JESTRI STORE</title>${style}</head><body><div class="header"><h1>JESTRI E-BOOK</h1></div><div class="container"><div class="grid">${items || '<p style="text-align:center; width:100%;">Belum ada buku.</p>'}</div></div></body></html>`);
});

app.get('/login', (req, res) => {
    res.send(`<html><head>${style}</head><body><div class="container"><div class="admin-form"><h2>🔐 LOGIN ADMIN</h2><form action="/admin-dashboard" method="POST"><input type="password" name="password" placeholder="Password Admin" required><button class="btn-save">MASUK</button></form></div></div></body></html>`);
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') { req.session.admin = true; res.redirect('/jestri-control'); }
    else res.send("<script>alert('Salah!'); window.location='/login';</script>");
});

app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const data = await Buku.find() || [];
    const rows = data.map(b => `<tr><td>${b.judul}</td><td>Rp ${b.harga.toLocaleString('id-ID')}</td><td><a href="/hapus-buku/${b._id}" style="color:#e74c3c;">Hapus</a></td></tr>`).join('');
    res.send(`<html><head>${style}</head><body><div class="container"><div class="admin-form"><h2>🚀 TAMBAH BUKU</h2><form action="/tambah-buku" method="POST"><input type="text" name="judul" placeholder="Judul" required><input type="number" name="harga" placeholder="Harga" required><input type="text" name="gambar" placeholder="URL Gambar" required><button class="btn-save">SIMPAN</button></form><p style="text-align:center;"><a href="/" style="color:#888;">Lihat Toko</a></p></div><table><thead><tr><th>Judul</th><th>Harga</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table></div></body></html>`);
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

