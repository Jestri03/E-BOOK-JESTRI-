const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// KONEKSI DATABASE
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority');

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-rahasia'], maxAge: 24 * 60 * 60 * 1000 }));

// CSS MEWAH UNTUK TAMPILAN PEMBELI & ADMIN
const style = `
<style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f0f0f; color: #ffffff; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: auto; }
    h1 { text-align: center; color: #f39c12; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 40px; }
    
    /* Grid Tampilan Pembeli */
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
    .card { background: #1a1a1a; border-radius: 20px; overflow: hidden; transition: 0.4s; border: 1px solid #333; box-shadow: 0 15px 35px rgba(0,0,0,0.5); }
    .card:hover { transform: translateY(-15px); border-color: #f39c12; }
    .card img { width: 100%; height: 380px; object-fit: cover; }
    .info { padding: 20px; text-align: center; }
    .info h3 { margin: 10px 0; font-size: 1.3em; color: #f39c12; }
    .info p { color: #ccc; font-size: 0.9em; margin-bottom: 15px; }
    .price { font-size: 1.5em; color: #2ecc71; font-weight: bold; margin-bottom: 20px; }
    .btn-wa { display: block; background: #25d366; color: white; text-decoration: none; padding: 12px; border-radius: 10px; font-weight: bold; transition: 0.3s; }
    .btn-wa:hover { background: #128c7e; transform: scale(1.05); }

    /* Form Admin */
    .admin-box { background: #1a1a1a; padding: 30px; border-radius: 20px; max-width: 500px; margin: 20px auto; border: 1px solid #333; }
    input { width: 100%; padding: 15px; margin: 10px 0; border-radius: 10px; border: 1px solid #444; background: #262626; color: white; box-sizing: border-box; }
    .btn-save { width: 100%; padding: 15px; background: #f39c12; border: none; color: white; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 1.1em; }
    
    /* Tabel Admin */
    table { width: 100%; margin-top: 40px; border-collapse: collapse; background: #1a1a1a; border-radius: 10px; overflow: hidden; }
    th, td { padding: 15px; border: 1px solid #333; text-align: left; }
    th { background: #333; color: #f39c12; }
    .del-link { color: #e74c3c; text-decoration: none; font-weight: bold; }
</style>
`;

// 1. TAMPILAN PEMBELI (UTAMA)
app.get('/', async (req, res) => {
    try {
        const data = await Buku.find() || [];
        let cards = data.map(b => `
            <div class="card">
                <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/400x600?text=Cover+Tidak+Ada'">
                <div class="info">
                    <h3>${b.judul}</h3>
                    <p>Penulis: ${b.penulis}</p>
                    <div class="price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                    <a href="https://wa.me/628123456789?text=Halo, saya mau beli buku: ${b.judul}" class="btn-wa">🛒 BELI SEKARANG</a>
                </div>
            </div>
        `).join('');

        res.send(`<!DOCTYPE html><html><head><title>JESTRI STORE</title>${style}</head><body>
            <div class="container">
                <h1>📚 JESTRI E-BOOK STORE</h1>
                <div class="grid">${cards || '<p style="text-align:center; grid-column:1/-1;">Belum ada buku tersedia.</p>'}</div>
            </div>
        </body></html>`);
    } catch (e) { res.send("Gagal memuat database."); }
});

// 2. LOGIN ADMIN
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><title>Login Admin</title>${style}</head><body>
        <div class="admin-box">
            <h2 style="text-align:center">🔐 LOGIN ADMIN</h2>
            <form action="/admin-dashboard" method="POST">
                <input type="password" name="password" placeholder="Password Admin" required>
                <button class="btn-save">MASUK KE PANEL</button>
            </form>
        </div>
    </body></html>`);
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') { 
        req.session.admin = true; 
        res.redirect('/jestri-control'); 
    } else { 
        res.send("<script>alert('Password Salah!'); window.location='/login';</script>"); 
    }
});

// 3. DASHBOARD ADMIN (FUNGSI TAMBAH/HAPUS)
app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const data = await Buku.find() || [];
    let rows = data.map(b => `
        <tr>
            <td>${b.judul}</td>
            <td>Rp ${b.harga.toLocaleString('id-ID')}</td>
            <td><a href="/hapus-buku/${b._id}" class="del-link" onclick="return confirm('Hapus buku ini?')">Hapus</a></td>
        </tr>
    `).join('');

    res.send(`<!DOCTYPE html><html><head><title>Admin Panel</title>${style}</head><body>
        <div class="container">
            <div class="admin-box">
                <h2 style="text-align:center">🛠️ TAMBAH BUKU BARU</h2>
                <form action="/tambah-buku" method="POST">
                    <input type="text" name="judul" placeholder="Judul Buku" required>
                    <input type="text" name="penulis" placeholder="Nama Penulis" required>
                    <input type="number" name="harga" placeholder="Harga (Contoh: 50000)" required>
                    <input type="text" name="gambar" placeholder="Link URL Gambar (Contoh dari Pinterest)" required>
                    <button class="btn-save">SIMPAN KE KATALOG</button>
                </form>
                <div style="text-align:center; margin-top:15px;">
                    <a href="/" style="color:#aaa; text-decoration:none;">⬅ Lihat Toko</a>
                </div>
            </div>
            <table><thead><tr><th>Judul Buku</th><th>Harga</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table>
        </div>
    </body></html>`);
});

app.post('/tambah-buku', async (req, res) => {
    if (req.session.admin) {
        await new Buku({
            judul: req.body.judul,
            penulis: req.body.penulis,
            harga: Number(req.body.harga),
            gambar: req.body.gambar
        }).save();
    }
    res.redirect('/jestri-control');
});

app.get('/hapus-buku/:id', async (req, res) => {
    if (req.session.admin) await Buku.findByIdAndDelete(req.params.id);
    res.redirect('/jestri-control');
});

module.exports = app;

