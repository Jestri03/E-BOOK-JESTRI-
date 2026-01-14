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

// UI MODERN, ELEGAN, & MINIMALIS
const head = `
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap');
        
        body { font-family: 'Inter', sans-serif; margin: 0; background: #fafafa; color: #2d3436; line-height: 1.6; }
        
        /* Navbar Elegan */
        .navbar { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .logo { font-weight: 600; font-size: 1.1rem; letter-spacing: -0.5px; color: #1e272e; }
        .btn-donate { background: #000; color: #fff; border: none; padding: 8px 18px; border-radius: 50px; font-size: 0.85rem; font-weight: 600; text-decoration: none; transition: 0.3s; }
        .btn-donate:hover { background: #333; transform: translateY(-2px); }

        /* Search Minimalis */
        .search-container { padding: 30px 20px 10px; text-align: center; }
        .search-box { width: 100%; max-width: 600px; padding: 14px 25px; border: 1px solid #e0e0e0; border-radius: 50px; font-size: 0.95rem; outline: none; transition: 0.3s; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .search-box:focus { border-color: #000; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }

        /* Genre Menu Smooth */
        .genre-menu { display: flex; overflow-x: auto; padding: 15px 20px; gap: 12px; scrollbar-width: none; }
        .genre-menu::-webkit-scrollbar { display: none; }
        .genre-item { padding: 8px 20px; background: #fff; border: 1px solid #eee; border-radius: 50px; text-decoration: none; color: #636e72; font-size: 0.85rem; white-space: nowrap; transition: 0.3s; }
        .genre-item.active { background: #000; color: #fff; border-color: #000; }

        /* Grid & Card Elegan */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap: 20px; padding: 20px; }
        .card { background: #fff; border-radius: 16px; overflow: hidden; transition: 0.4s; border: 1px solid rgba(0,0,0,0.03); box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .card:hover { transform: translateY(-8px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
        .card img { width: 100%; height: 240px; object-fit: cover; }
        
        .card-info { padding: 15px; text-align: left; }
        .card-info h3 { font-size: 0.9rem; font-weight: 600; margin: 0 0 8px 0; color: #2d3436; height: 40px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .card-price { color: #10ac84; font-weight: 600; font-size: 1rem; margin-bottom: 12px; display: block; }
        
        .btn-beli { background: #f1f2f6; color: #2d3436; text-decoration: none; padding: 10px; display: block; border-radius: 10px; font-size: 0.8rem; font-weight: 600; text-align: center; transition: 0.3s; }
        .btn-beli:hover { background: #000; color: #fff; }

        .empty { text-align: center; padding: 100px 20px; color: #b2bec3; font-weight: 300; }
    </style>
</head>`;

app.get('/', async (req, res) => {
    try {
        const { search, genre } = req.query;
        let query = {};
        if (search) query.judul = { $regex: search, $options: 'i' };
        if (genre && genre !== 'Semua') query.genre = genre;

        const data = await Buku.find(query).lean();
        const genres = ['Semua', 'Fiksi', 'Edukasi', 'Teknologi', 'Bisnis'];

        const genreHtml = genres.map(g => `
            <a href="/?genre=${g}" class="genre-item ${genre === g || (!genre && g === 'Semua') ? 'active' : ''}">${g}</a>
        `).join('');

        const cards = data.map(b => `
            <div class="card">
                <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/300x450?text=Cover+Buku'">
                <div class="card-info">
                    <h3>${b.judul}</h3>
                    <span class="card-price">Rp ${Number(b.harga).toLocaleString('id-ID')}</span>
                    <a href="https://wa.me/628123456789?text=Saya%20tertarik%20dengan%20${b.judul}" class="btn-beli">Detail Produk</a>
                </div>
            </div>`).join('');

        res.send(`<!DOCTYPE html><html>${head}<body>
            <div class="navbar">
                <i class="fa-solid fa-align-left" style="font-size: 1.2rem;"></i>
                <div class="logo">JESTRI.</div>
                <a href="#" class="btn-donate">Donate</a>
            </div>
            <div class="search-container">
                <form action="/">
                    <input type="text" name="search" class="search-box" placeholder="Cari judul e-book..." value="${search || ''}">
                </form>
            </div>
            <div class="genre-menu">${genreHtml}</div>
            <div class="container">
                ${data.length > 0 ? `<div class="grid">${cards}</div>` : `<div class="empty">Tidak ada buku ditemukan.</div>`}
            </div>
        </body></html>`);
    } catch (e) { res.status(500).send("Server Error"); }
});

// Admin minimalis tetap di bawah
app.get('/login', (req, res) => { res.send('<form action="/login" method="POST" style="text-align:center;padding-top:100px;"><input type="password" name="pw" placeholder="Pass"><button>Enter</button></form>'); });
app.post('/login', (req, res) => { if(req.body.pw==='JESTRI0301209'){req.session.admin=true;res.redirect('/admin');} });
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const data = await Buku.find().lean();
    const rows = data.map(b => `<li>${b.judul} <a href="/del/${b._id}">Hapus</a></li>`).join('');
    res.send(`<h2>Admin</h2><form action="/add" method="POST">
        <input name="judul" placeholder="Judul"><input name="harga" placeholder="Harga"><input name="gambar" placeholder="Link Gambar">
        <select name="genre"><option>Fiksi</option><option>Edukasi</option><option>Teknologi</option><option>Bisnis</option></select><button>Simpan</button></form><ul>${rows}</ul>`);
});
app.post('/add', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.redirect('/admin'); });
app.get('/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });

module.exports = app;

