const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority');

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-secret'], maxAge: 24 * 60 * 60 * 1000 }));

// CSS MEWAH (Gue simpan di variabel biar rapi)
const style = `
<style>
    body { font-family: 'Segoe UI', sans-serif; background: #121212; color: white; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: auto; }
    h1 { text-align: center; color: #f39c12; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 2px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 25px; }
    .card { background: #1e1e1e; border-radius: 15px; overflow: hidden; transition: 0.3s; box-shadow: 0 10px 20px rgba(0,0,0,0.3); border: 1px solid #333; }
    .card:hover { transform: translateY(-10px); border-color: #f39c12; }
    .card img { width: 100%; height: 350px; object-fit: cover; }
    .info { padding: 20px; text-align: center; }
    .info h3 { margin: 10px 0; font-size: 1.2em; }
    .info p { color: #aaa; font-size: 0.9em; }
    .price { font-size: 1.4em; color: #2ecc71; font-weight: bold; margin: 15px 0; }
    .btn-wa { display: block; background: #25d366; color: white; text-decoration: none; padding: 12px; border-radius: 8px; font-weight: bold; transition: 0.3s; }
    .btn-wa:hover { background: #128c7e; }
    .admin-box { background: #1e1e1e; padding: 30px; border-radius: 15px; max-width: 500px; margin: auto; border: 1px solid #333; }
    input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #444; background: #2c2c2c; color: white; box-sizing: border-box; }
    .btn-save { width: 100%; padding: 12px; background: #f39c12; border: none; color: white; border-radius: 8px; font-weight: bold; cursor: pointer; }
    table { width: 100%; margin-top: 30px; border-collapse: collapse; }
    th, td { padding: 12px; border: 1px solid #333; text-align: left; }
    th { background: #333; }
</style>
`;

// TAMPILAN PEMBELI
app.get('/', async (req, res) => {
    const data = await Buku.find() || [];
    let cards = data.map(b => `
        <div class="card">
            <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/350x500?text=No+Image'">
            <div class="info">
                <h3>${b.judul}</h3>
                <p>Penulis: ${b.penulis}</p>
                <p class="price">Rp ${b.harga.toLocaleString('id-ID')}</p>
                <a href="https://wa.me/628123456789?text=Halo, saya ingin beli buku ${b.judul}" class="btn-wa">BELI SEKARANG</a>
            </div>
        </div>
    `).join('');

    res.send(`<!DOCTYPE html><html><head>${style}</head><body>
        <div class="container">
            <h1>📚 JESTRI E-BOOK STORE</h1>
            <div class="grid">${cards || '<p style="text-align:center; grid-column:1/-1;">Belum ada buku tersedia.</p>'}</div>
        </div>
    </body></html>`);
});

// LOGIN & ADMIN
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head>${style}</head><body>
        <div class="admin-box">
            <h2>LOGIN ADMIN</h2>
            <form action="/admin-dashboard" method="POST">
                <input type="password" name="password" placeholder="Masukkan Password" required>
                <button class="btn-save">MASUK</button>
            </form>
        </div>
    </body></html>`);
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') { req.session.admin = true; res.redirect('/jestri-control'); }
    else { res.send("<script>alert('Salah!'); window.location='/login';</script>"); }
});

app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const data = await Buku.find() || [];
    let rows = data.map(b => `
        <tr>
            <td>${b.judul}</td>
            <td>Rp ${b.harga.toLocaleString('id-ID')}</td>
            <td><a href="/hapus-buku/${b._id}" style="color:#e74c3c;">Hapus</a></td>
        </tr>
    `).join('');

    res.send(`<!DOCTYPE html><html><head>${style}</head><body>
        <div class="container">
            <div class="admin-box">
                <h2>🛠️ TAMBAH BUKU</h2>
                <form action="/tambah-buku" method="POST">
                    <input type="text" name="judul" placeholder="Judul Buku" required>
                    <input type="text" name="penulis" placeholder="Penulis" required>
                    <input type="number" name="harga" placeholder="Harga (Angka)" required>
                    <input type="text" name="gambar" placeholder="Link Gambar (URL)" required>
                    <button class="btn-save">SIMPAN BUKU</button>
                </form>
                <p><a href="/" style="color:#aaa;">Lihat Website</a></p>
            </div>
            <table><thead><tr><th>Judul</th><th>Harga</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table>
        </div>
    </body></html>`);
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

