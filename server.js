const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000
}).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, 
    harga: Number, 
    gambar: String, 
    genre: { type: String, default: 'Semua' } 
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-key'], maxAge: 24 * 60 * 60 * 1000 }));

// UI CSS Agar Mirip Video (Clean & Professional)
const head = `
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; background: #f4f4f4; color: #333; }
        .navbar { background: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 1000; }
        .logo { font-weight: bold; font-size: 1.2rem; }
        .btn-donate { background: #ff4757; color: white; border: none; padding: 8px 15px; border-radius: 20px; font-weight: bold; text-decoration: none; }
        .search-container { padding: 20px; text-align: center; background: white; }
        .search-box { width: 90%; max-width: 500px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; }
        .genre-menu { display: flex; overflow-x: auto; padding: 10px; background: white; gap: 10px; border-bottom: 1px solid #eee; }
        .genre-item { padding: 8px 15px; background: #eee; border-radius: 20px; text-decoration: none; color: #555; font-size: 0.9rem; white-space: nowrap; }
        .genre-item.active { background: #3498db; color: white; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 15px; padding: 15px; }
        .card { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .card img { width: 100%; height: 220px; object-fit: cover; }
        .card-info { padding: 10px; text-align: center; }
        .card-info h3 { font-size: 0.9rem; margin: 5px 0; height: 35px; overflow: hidden; }
        .card-price { color: #2ecc71; font-weight: bold; margin-bottom: 10px; display: block; }
        .btn-beli { background: #27ae60; color: white; text-decoration: none; padding: 8px; display: block; border-radius: 5px; font-size: 0.8rem; }
        .empty { text-align: center; padding: 50px; color: #999; }
    </style>
</head>`;

// --- HALAMAN PEMBELI ---
app.get('/', async (req, res) => {
    try {
        const { search, genre } = req.query;
        let query = {};
        
        if (search) query.judul = { $regex: search, $options: 'i' };
        if (genre && genre !== 'Semua') query.genre = genre;

        const data = await Buku.find(query).lean();
        const genres = ['Semua', 'Fiksi', 'Edukasi', 'Teknologi', 'Bisnis'];

        const genreHtml = genres.map(g => `<a href="/?genre=${g}" class="genre-item ${genre === g || (!genre && g === 'Semua') ? 'active' : ''}">${g}</a>`).join('');

        const cards = data.map(b => `
            <div class="card">
                <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
                <div class="card-info">
                    <h3>${b.judul}</h3>
                    <span class="card-price">Rp ${Number(b.harga).toLocaleString('id-ID')}</span>
                    <a href="https://wa.me/628XXXXXXXXX?text=Beli%20${b.judul}" class="btn-beli">BELI SEKARANG</a>
                </div>
            </div>`).join('');

        res.send(`<!DOCTYPE html><html>${head}<body>
            <div class="navbar"><i class="fa fa-bars"></i><div class="logo">E-BOOK JESTRI</div><a href="#" class="btn-donate"><i class="fa fa-heart"></i> DONATE</a></div>
            <div class="search-container">
                <form action="/"><input type="text" name="search" class="search-box" placeholder="Cari Buku / Penulis..." value="${search || ''}"></form>
            </div>
            <div class="genre-menu">${genreHtml}</div>
            ${data.length > 0 ? `<div class="grid">${cards}</div>` : `<div class="empty">Belum ada koleksi buku.</div>`}
        </body></html>`);
    } catch (e) { res.send("Error"); }
});

// LOGIN & ADMIN (Tetap Minimalis)
app.get('/login', (req, res) => { res.send('<form action="/login" method="POST"><input type="password" name="pw"><button>MASUK</button></form>'); });
app.post('/login', (req, res) => { if(req.body.pw==='JESTRI0301209'){req.session.admin=true;res.redirect('/admin');} });
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const data = await Buku.find().lean();
    const rows = data.map(b => `<li>${b.judul} <a href="/del/${b._id}">Hapus</a></li>`).join('');
    res.send(`<h2>Admin</h2><form action="/add" method="POST">
        <input name="judul" placeholder="Judul"><input name="harga" placeholder="Harga">
        <input name="gambar" placeholder="Link Gambar">
        <select name="genre"><option>Fiksi</option><option>Edukasi</option><option>Teknologi</option><option>Bisnis</option></select>
        <button>Simpan</button></form><ul>${rows}</ul>`);
});
app.post('/add', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.redirect('/admin'); });
app.get('/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });

module.exports = app;

