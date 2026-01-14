const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// Set timeout supaya gak stuck item polos kalau DB lemot
const mongoURI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(mongoURI, { 
    serverSelectionTimeoutMS: 5000 
}).catch(err => console.log("DB Koneksi Gagal, tapi web tetep jalan."));

const Buku = mongoose.model('Buku', { judul: String, harga: Number, gambar: String });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-mewah'], maxAge: 24 * 60 * 60 * 1000 }));

// CSS MEWAH (Ditanam langsung di head biar gak putih/hitam polos)
const head = `
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: white; margin: 0; padding: 0; }
        .header { text-align: center; padding: 40px 0; background: #111; border-bottom: 3px solid #f39c12; }
        .header h1 { color: #f39c12; letter-spacing: 4px; margin: 0; }
        .container { max-width: 1200px; margin: auto; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .card { background: #161616; border-radius: 15px; overflow: hidden; border: 1px solid #333; text-align: center; transition: 0.3s; }
        .card:hover { transform: translateY(-10px); border-color: #f39c12; }
        .card img { width: 100%; height: 350px; object-fit: cover; background: #222; }
        .info { padding: 15px; }
        .price { color: #2ecc71; font-size: 1.4em; font-weight: bold; margin: 10px 0; display: block; }
        .btn { background: #f39c12; color: white; text-decoration: none; padding: 12px; display: block; border-radius: 8px; font-weight: bold; }
        .admin-box { background: #161616; padding: 20px; border-radius: 15px; max-width: 400px; margin: 20px auto; border: 1px solid #333; }
        input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; background: #222; color: white; border: 1px solid #444; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #f39c12; border: none; color: white; border-radius: 8px; cursor: pointer; font-weight: bold; }
        table { width: 100%; margin-top: 20px; border-collapse: collapse; }
        th, td { padding: 12px; border: 1px solid #333; text-align: left; }
    </style>
</head>`;

app.get('/', async (req, res) => {
    try {
        const data = await Buku.find().lean() || [];
        let items = data.map(b => `
            <div class="card">
                <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/400x600?text=No+Image'">
                <div class="info">
                    <h3>${b.judul}</h3>
                    <span class="price">Rp ${Number(b.harga).toLocaleString('id-ID')}</span>
                    <a href="https://wa.me/628XXXXXXXXX" class="btn">BELI SEKARANG</a>
                </div>
            </div>`).join('');

        res.send(`<html>${head}<body>
            <div class="header"><h1>JESTRI STORE</h1></div>
            <div class="container">
                <div class="grid">${items || '<p style="text-align:center; width:100%;">Katalog Kosong. Silakan Login Admin.</p>'}</div>
            </div>
        </body></html>`);
    } catch (e) {
        // Jika DB Error, jangan kasih item polos, kasih pesan ini
        res.send(`<html>${head}<body><div class="header"><h1>JESTRI STORE</h1></div><div class="container"><h2>Gagal ambil data. Cek koneksi MongoDB lo, Bro!</h2></div></body></html>`);
    }
});

app.get('/login', (req, res) => {
    res.send(`<html>${head}<body><div class="admin-box"><h2>ADMIN LOGIN</h2><form action="/admin-dashboard" method="POST"><input type="password" name="password" placeholder="Password" required><button>MASUK</button></form></div></body></html>`);
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') { 
        req.session.admin = true; 
        res.redirect('/jestri-control'); 
    } else { 
        res.send("<script>alert('Salah!'); window.location='/login';</script>"); 
    }
});

app.get('/jestri-control', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const data = await Buku.find().lean() || [];
    const rows = data.map(b => `<tr><td>${b.judul}</td><td>Rp ${b.harga}</td><td><a href="/hapus-buku/${b._id}" style="color:red">Hapus</a></td></tr>`).join('');
    res.send(`<html>${head}<body><div class="container">
        <div class="admin-box">
            <h2>TAMBAH BUKU</h2>
            <form action="/tambah-buku" method="POST">
                <input type="text" name="judul" placeholder="Judul" required>
                <input type="number" name="harga" placeholder="Harga" required>
                <input type="text" name="gambar" placeholder="Link Gambar" required>
                <button>SIMPAN</button>
            </form>
        </div>
        <table><thead><tr><th>Judul</th><th>Harga</th><th>Aksi</th></tr></thead><tbody>${rows}</tbody></table>
    </div></body></html>`);
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

