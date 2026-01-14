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
    :root { --primary: #f39c12; --dark: #0a0a0a; --card: #161616; --text: #ffffff; }
    body { font-family: 'Poppins', sans-serif; background: var(--dark); color: var(--text); margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: auto; }
    header { text-align: center; padding: 40px 0; }
    header h1 { font-size: 2.5em; color: var(--primary); text-transform: uppercase; letter-spacing: 5px; margin: 0; text-shadow: 0 0 20px rgba(243, 156, 18, 0.3); }
    
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; padding: 20px; }
    .card { background: var(--card); border-radius: 20px; overflow: hidden; transition: 0.5s; border: 1px solid #222; position: relative; }
    .card:hover { transform: translateY(-15px); border-color: var(--primary); box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    .card img { width: 100%; height: 400px; object-fit: cover; transition: 0.5s; }
    .card:hover img { transform: scale(1.1); }
    
    .info { padding: 25px; text-align: center; background: linear-gradient(to top, #111, transparent); }
    .info h3 { margin: 10px 0; font-size: 1.4em; color: var(--primary); }
    .info p { color: #888; font-size: 0.9em; margin-bottom: 15px; }
    .price { font-size: 1.6em; color: #2ecc71; font-weight: bold; margin-bottom: 20px; display: block; }
    
    .btn-wa { display: block; background: var(--primary); color: white; text-decoration: none; padding: 15px; border-radius: 12px; font-weight: bold; font-size: 1.1em; transition: 0.3s; }
    .btn-wa:hover { background: #d35400; box-shadow: 0 0 20px rgba(211, 84, 0, 0.4); }

    .admin-form { background: var(--card); padding: 40px; border-radius: 20px; max-width: 500px; margin: 40px auto; border: 1px solid #333; }
    input { width: 100%; padding: 15px; margin: 10px 0; border-radius: 10px; border: 1px solid #333; background: #222; color: white; font-size: 1em; }
    .btn-save { width: 100%; padding: 15px; background: var(--primary); border: none; color: white; border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 10px; }
    
    table { width: 100%; margin-top: 50px; border-collapse: collapse; background: var(--card); border-radius: 15px; overflow: hidden; }
    th, td { padding: 20px; text-align: left; border-bottom: 1px solid #222; }
    th { background: #222; color: var(--primary); text-transform: uppercase; }
    .del { color: #ff4757; text-decoration: none; font-weight: bold; }
</style>
`;

app.get('/', async (req, res) => {
    const data = await Buku.find() || [];
    let items = data.map(b => `
        <div class="card">
            <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/400x600?text=Cover+Buku'">
            <div class="info">
                <h3>${b.judul}</h3>
                <p>Karya: ${b.penulis}</p>
                <span class="price">Rp ${b.harga.toLocaleString('id-ID')}</span>
                <a href="https://wa.me/628123456789?text=Halo, saya ingin order buku ${b.judul}" class="btn-wa">PESAN SEKARANG</a>
            </div>
        </div>
    `).join('');

    res.send(`<!DOCTYPE html><html><head><title>JESTRI E-BOOK</title>${style}</head><body>
        <div class="container">
            <header><h1>JESTRI E-BOOK STORE</h1></header>
            <div class="grid">${items || '<p style="text-align:center; grid-column:1/-1;">Katalog sedang kosong...</p>'}</div>
        </div>
    </body></html>`);
});

app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head>${style}</head><body>
        <div class="admin-form">
            <h2 style="text-align:center; color:var(--primary)">🔐 ADMIN LOGIN</h2>
            <form action="/admin-dashboard" method="POST">
                <input type="password" name="password" placeholder="Password Rahasia" required>
                <button class="btn-save">LOGIN</button>
            </form>
        </div>
    </body></html>`);
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') { req.session.admin = true; res.redirect('/jestri-control'); }
    else { res.send("<script>alert('Password Salah!'); window.location='/login';</script>"); }
});

app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const data = await Buku.find() || [];
    let rows = data.map(b => `
        <tr>
            <td><b>${b.judul}</b></td>
            <td>Rp ${b.harga.toLocaleString('id-ID')}</td>
            <td><a href="/hapus-buku/${b._id}" class="del">Hapus</a></td>
        </tr>
    `).join('');

    res.send(`<!DOCTYPE html><html><head>${style}</head><body>
        <div class="container">
            <div class="admin-form">
                <h2 style="text-align:center; color:var(--primary)">🚀 TAMBAH DATA BUKU</h2>
                <form action="/tambah-buku" method="POST">
                    <input type="text" name="judul" placeholder="Judul Buku" required>
                    <input type="text" name="penulis" placeholder="Penulis" required>
                    <input type="number" name="harga" placeholder="Harga (Angka)" required>
                    <input type="text" name="gambar" placeholder="Link URL Gambar" required>
                    <button class="btn-save">PUBLIKASIKAN</button>
                </form>
                <p style="text-align:center"><a href="/" style="color:#666; text-decoration:none;">Lihat Toko</a></p>
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

