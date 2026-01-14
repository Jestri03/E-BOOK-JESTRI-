const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority')
    .then(() => console.log("DB OK"))
    .catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-secret'], maxAge: 24 * 60 * 60 * 1000 }));

const style = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;600&display=swap');
    body { font-family: 'Poppins', sans-serif; background: #0a0a0a; color: white; margin: 0; padding: 0; }
    .header { text-align: center; padding: 50px 0; background: #111; border-bottom: 3px solid #f39c12; }
    .header h1 { color: #f39c12; letter-spacing: 5px; margin: 0; font-size: 2.5em; }
    .container { max-width: 1200px; margin: auto; padding: 40px 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
    .card { background: #161616; border-radius: 20px; overflow: hidden; border: 1px solid #333; transition: 0.5s; text-align: center; }
    .card:hover { transform: translateY(-10px); border-color: #f39c12; box-shadow: 0 10px 30px rgba(243,156,18,0.3); }
    .card img { width: 100%; height: 380px; object-fit: cover; }
    .info { padding: 25px; }
    .price { color: #2ecc71; font-size: 1.6em; font-weight: bold; margin-bottom: 15px; display: block; }
    .btn { background: #f39c12; color: white; text-decoration: none; padding: 15px; display: block; border-radius: 12px; font-weight: bold; }
    .admin-form { background: #161616; padding: 30px; border-radius: 20px; max-width: 500px; margin: 0 auto 40px; border: 1px solid #333; }
    input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #444; background: #222; color: white; box-sizing: border-box; }
    button { width: 100%; padding: 15px; background: #f39c12; border: none; color: white; border-radius: 10px; cursor: pointer; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; background: #161616; margin-top: 20px; }
    th, td { padding: 15px; border: 1px solid #333; text-align: left; }
</style>`;

// HALAMAN UTAMA PEMBELI
app.get('/', async (req, res) => {
    let data = [];
    try { data = await Buku.find(); } catch (e) {}
    
    // Kalau database kosong, tampilin info ini biar gak putih polos
    const items = data.length > 0 ? data.map(b => `
        <div class="card">
            <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/400x600?text=No+Cover'">
            <div class="info">
                <h3>${b.judul}</h3>
                <span class="price">Rp ${Number(b.harga).toLocaleString('id-ID')}</span>
                <a href="https://wa.me/628123456789?text=Beli%20${b.judul}" class="btn">🛒 BELI SEKARANG</a>
            </div>
        </div>`).join('') : '<h2 style="text-align:center; grid-column:1/-1;">Katalog Kosong. Silakan Admin Login untuk tambah buku.</h2>';

    res.send(`<!DOCTYPE html><html><head><title>JESTRI STORE</title>${style}</head><body><div class="header"><h1>JESTRI E-BOOK</h1></div><div class="container"><div class="grid">${items}</div></div></body></html>`);
});

// LOGIN & ADMIN PANEL
app.get('/login', (req, res) => {
    res.send(`<html><head>${style}</head><body><div class="container"><div class="admin-form"><h2>🔐 LOGIN ADMIN</h2><form action="/admin-dashboard" method="POST"><input type="password" name="password" placeholder="Password Admin" required><button>MASUK</button></form></div></div></body></html>`);
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') { req.session.admin = true; res.redirect('/jestri-control'); }
    else res.send("<script>alert('Salah!'); window.location='/login';</script>");
});

app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    let data = []; try { data = await Buku.find(); } catch (e) {}
    const rows = data.map(b => `<tr><td>${b.judul}</td><td>Rp ${Number(b.harga).toLocaleString('id-ID')}</td><td><a href="/hapus-buku/${b._id}" style="color:red">Hapus</a></td></tr>`).join('');
    res.send(`<html><head>${style}</head><body><div class="container"><div class="admin-form"><h2>🚀 TAMBAH BUKU</h2><form action="/tambah-buku" method="POST"><input type="text" name="judul" placeholder="Judul" required><input type="number" name="harga" placeholder="Harga" required><input type="text" name="gambar" placeholder="URL Gambar" required><button>SIMPAN</button></form><p style="text-align:center;"><a href="/" style="color:#888;">Lihat Toko</a></p></div><table><thead><tr><th>Judul</th><th>Harga</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table></div></body></html>`);
});

app.post('/tambah-buku', async (req, res) => {
    if (req.session.admin) {
        await new Buku({ judul: req.body.judul, harga: Number(req.body.harga), gambar: req.body.gambar }).save();
    }
    res.redirect('/jestri-control');
});

app.get('/hapus-buku/:id', async (req, res) => {
    if (req.session.admin) await Buku.findByIdAndDelete(req.params.id);
    res.redirect('/jestri-control');
});

module.exports = app;

