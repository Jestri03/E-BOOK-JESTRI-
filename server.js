const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// KONEKSI DATABASE - Gue tambahin timeout biar gak stuck hitam
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000
}).then(() => console.log("Database Terhubung!")).catch(err => console.log("DB Error: " + err));

const Buku = mongoose.model('Buku', { judul: String, harga: Number, gambar: String, penulis: String });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-mewah'], maxAge: 24 * 60 * 60 * 1000 }));

// CSS MEWAH - Gue tanam biar pembeli liat tampilan premium
const layout = (isi) => `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JESTRI E-BOOK STORE</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;600&display=swap');
        body { font-family: 'Poppins', sans-serif; background: #0a0a0a; color: white; margin: 0; padding: 0; }
        .header { text-align: center; padding: 50px 20px; background: #111; border-bottom: 4px solid #f39c12; }
        .header h1 { color: #f39c12; margin: 0; letter-spacing: 4px; text-transform: uppercase; }
        .container { max-width: 1200px; margin: auto; padding: 40px 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
        .card { background: #181818; border-radius: 20px; overflow: hidden; border: 1px solid #333; transition: 0.4s; text-align: center; }
        .card:hover { transform: translateY(-10px); border-color: #f39c12; box-shadow: 0 10px 30px rgba(243,156,18,0.3); }
        .card img { width: 100%; height: 400px; object-fit: cover; background: #222; }
        .info { padding: 25px; }
        .info h3 { font-size: 1.4em; margin-bottom: 10px; color: #f39c12; }
        .price { color: #2ecc71; font-size: 1.7em; font-weight: bold; margin-bottom: 20px; display: block; }
        .btn-beli { background: #f39c12; color: white; text-decoration: none; padding: 15px; display: block; border-radius: 12px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header"><h1>JESTRI E-BOOK</h1></div>
    <div class="container">${isi}</div>
</body>
</html>`;

// --- ROUTE PEMBELI ---
app.get('/', async (req, res) => {
    try {
        let data = await Buku.find().lean();
        
        // Proteksi: Kalau database lo belum ada isinya, jangan biarin kosong hitam
        if (!data || data.length === 0) {
            return res.send(layout(`
                <div style="text-align:center; padding: 50px;">
                    <h2 style="color:#888;">KATALOG MASIH KOSONG</h2>
                    <p>Silakan Login Admin untuk menambah buku baru.</p>
                    <a href="/login" style="color:#f39c12; text-decoration:none; font-weight:bold;">MASUK KE ADMIN</a>
                </div>
            `));
        }

        const cards = data.map(b => `
            <div class="card">
                <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/400x600?text=Gambar+Buku'">
                <div class="info">
                    <h3>${b.judul}</h3>
                    <span class="price">Rp ${Number(b.harga).toLocaleString('id-ID')}</span>
                    <a href="https://wa.me/628123456789?text=Halo, saya mau beli: ${b.judul}" class="btn-beli">🛒 BELI SEKARANG</a>
                </div>
            </div>
        `).join('');

        res.send(layout(`<div class="grid">${cards}</div>`));

    } catch (e) {
        res.status(500).send("Error koneksi database. Coba refresh halaman.");
    }
});

// --- ROUTE ADMIN ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><body style="background:#0a0a0a; color:white; font-family:sans-serif; text-align:center; padding-top:100px;">
        <h2>🔐 ADMIN LOGIN</h2>
        <form action="/admin-dashboard" method="POST">
            <input type="password" name="password" placeholder="Password Admin" style="padding:10px; border-radius:5px; border:none; width:250px;">
            <button style="padding:10px 20px; background:#f39c12; border:none; border-radius:5px; color:white; font-weight:bold; cursor:pointer; margin-top:10px;">MASUK</button>
        </form>
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

app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const data = await Buku.find().lean() || [];
    const rows = data.map(b => `<tr><td>${b.judul}</td><td>${b.harga}</td><td><a href="/hapus-buku/${b._id}" style="color:red">Hapus</a></td></tr>`).join('');
    res.send(`<!DOCTYPE html><body style="background:#111; color:white; padding:20px; font-family:sans-serif;">
        <h2>DASHBOARD ADMIN</h2>
        <form action="/tambah-buku" method="POST" style="background:#222; padding:20px; border-radius:10px;">
            <input type="text" name="judul" placeholder="Judul Buku" required style="width:100%; padding:10px; margin-bottom:10px;">
            <input type="number" name="harga" placeholder="Harga (Angka)" required style="width:100%; padding:10px; margin-bottom:10px;">
            <input type="text" name="gambar" placeholder="Link Link Gambar" required style="width:100%; padding:10px; margin-bottom:10px;">
            <button style="padding:10px 20px; background:#f39c12; border:none; color:white; font-weight:bold;">TAMBAH BUKU</button>
        </form>
        <table border="1" style="width:100%; margin-top:20px; border-collapse:collapse;">
            <thead><tr><th>Judul</th><th>Harga</th><th>Aksi</th></tr></thead>
            <tbody>${rows}</tbody>
        </table><br><a href="/" style="color:orange;">Lihat Toko</a>
    </body></html>`);
});

app.post('/tambah-buku', async (req, res) => {
    if (req.session.admin) await new Buku({ judul: req.body.judul, harga: Number(req.body.harga), gambar: req.body.gambar }).save();
    res.redirect('/jestri-control');
});

app.get('/hapus-buku/:id', async (req, res) => {
    if (req.session.admin) await Buku.findByIdAndDelete(req.params.id);
    res.redirect('/jestri-control');
});

module.exports = app;

