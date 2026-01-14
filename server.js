const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// Database Connection
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000
}).catch(err => console.log("Koneksi DB Gagal"));

const Buku = mongoose.model('Buku', { 
    judul: String, harga: Number, gambar: String, genre: { type: String, default: 'Semua' } 
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-key'], maxAge: 24 * 60 * 60 * 1000 }));

// UI STYLING (Premium Minimalist)
const head = `
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700&display=swap');
        :root { --accent: #000000; --text: #1a1a1a; --bg: #ffffff; --grey: #f7f7f7; }
        * { box-sizing: border-box; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: var(--bg); color: var(--text); overflow-x: hidden; }
        
        /* Navbar */
        .navbar { background: rgba(255,255,255,0.9); backdrop-filter: blur(15px); padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #eee; }
        .nav-left { display: flex; align-items: center; gap: 15px; }
        .menu-btn { font-size: 1.4rem; cursor: pointer; border: none; background: none; }
        .logo { font-weight: 800; font-size: 1.2rem; letter-spacing: -0.5px; }
        .btn-donate { background: var(--accent); color: #fff; padding: 10px 22px; border-radius: 12px; text-decoration: none; font-size: 0.85rem; font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }

        /* Sidebar Overlay */
        .sidebar { position: fixed; top: 0; left: -300px; width: 300px; height: 100%; background: #fff; z-index: 1001; padding: 30px; box-shadow: 25px 0 50px rgba(0,0,0,0.05); }
        .sidebar.active { left: 0; }
        .sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
        .close-btn { font-size: 1.6rem; cursor: pointer; }
        .genre-list { display: flex; flex-direction: column; gap: 8px; }
        .genre-item { padding: 16px 20px; border-radius: 14px; text-decoration: none; color: #666; font-weight: 500; font-size: 1rem; }
        .genre-item:hover { background: var(--grey); color: var(--accent); }
        .genre-item.active { background: #000; color: #fff; }

        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1000; display: none; backdrop-filter: blur(5px); opacity: 0; transition: 0.4s; }
        .overlay.active { display: block; opacity: 1; }

        /* Content */
        .main { max-width: 900px; margin: auto; padding: 25px; }
        .search-container { margin-bottom: 35px; }
        .search-box { width: 100%; padding: 18px 25px; border: 1px solid #f0f0f0; border-radius: 20px; background: var(--grey); outline: none; font-size: 1rem; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
        .search-box:focus { border-color: #000; background: #fff; }

        /* Grid Buku */
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; }
        .card { background: #fff; cursor: pointer; position: relative; }
        .card:hover { transform: translateY(-8px); }
        .card img { width: 100%; aspect-ratio: 3/4.5; object-fit: cover; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); background: #eee; }
        .card-info { padding: 15px 5px; }
        .card-info h3 { font-size: 1rem; font-weight: 700; margin: 5px 0 8px; color: var(--text); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3; }
        .card-price { color: #27ae60; font-weight: 700; font-size: 1.1rem; }
        .badge { position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.9); padding: 5px 12px; border-radius: 10px; font-size: 0.7rem; font-weight: 700; }

        @media (max-width: 500px) { .grid { gap: 15px; } .card img { border-radius: 18px; } }
    </style>
</head>`;

// --- FRONTEND PEMBELI ---
app.get('/', async (req, res) => {
    try {
        const { search, genre } = req.query;
        let query = {};
        if (search) query.judul = { $regex: search, $options: 'i' };
        if (genre && genre !== 'Semua') query.genre = genre;

        const data = await Buku.find(query).sort({ _id: -1 }).lean();
        const genres = ['Semua', 'Fiksi', 'Edukasi', 'Teknologi', 'Bisnis', 'Self Dev'];

        const genreHtml = genres.map(g => `
            <a href="/?genre=${g}" class="genre-item ${genre === g || (!genre && g === 'Semua') ? 'active' : ''}">${g}</a>
        `).join('');

        const cards = data.map(b => `
            <div class="card" onclick="window.location.href='https://wa.me/628XXXXXXXXX?text=Beli%20${b.judul}'">
                <span class="badge">${b.genre}</span>
                <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
                <div class="card-info">
                    <h3>${b.judul}</h3>
                    <div class="card-price">Rp ${Number(b.harga).toLocaleString('id-ID')}</div>
                </div>
            </div>`).join('');

        res.send(`<!DOCTYPE html><html lang="id">${head}<body>
            <div class="overlay" id="overlay"></div>
            <div class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <span style="font-weight:800; font-size: 1.2rem;">KATALOG</span>
                    <i class="fa fa-xmark close-btn" id="closeMenu"></i>
                </div>
                <div class="genre-list">${genreHtml}</div>
                <div style="margin-top: 50px; font-size: 0.8rem; color: #ccc;">© 2024 JESTRI STORE</div>
            </div>

            <nav class="navbar">
                <div class="nav-left">
                    <button class="menu-btn" id="openMenu"><i class="fa-solid fa-bars-staggered"></i></button>
                    <div class="logo">JESTRI.</div>
                </div>
                <a href="#" class="btn-donate">Donate</a>
            </nav>

            <div class="main">
                <div class="search-container">
                    <form action="/">
                        <input type="text" name="search" class="search-box" placeholder="Cari judul e-book idamanmu..." value="${search || ''}">
                    </form>
                </div>
                ${data.length > 0 ? `<div class="grid">${cards}</div>` : `<div style="text-align:center; padding:80px; color:#bbb;">Produk tidak ditemukan.</div>`}
            </div>

            <script>
                const s = document.getElementById('sidebar'), o = document.getElementById('overlay');
                document.getElementById('openMenu').onclick = () => { s.classList.add('active'); o.classList.add('active'); };
                document.getElementById('closeMenu').onclick = o.onclick = () => { s.classList.remove('active'); o.classList.remove('active'); };
            </script>
        </body></html>`);
    } catch (e) { res.status(500).send("Crash"); }
});

// --- ADMIN PANEL ---
app.get('/login', (req, res) => { res.send('<body style="background:#000; display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;"><form action="/login" method="POST" style="background:#fff; padding:40px; border-radius:20px; text-align:center;"><h2 style="margin-bottom:20px;">ADMIN LOGIN</h2><input type="password" name="pw" placeholder="Password" style="width:100%; padding:15px; border-radius:10px; border:1px solid #ddd; margin-bottom:15px;"><button style="width:100%; padding:15px; background:#000; color:#fff; border:none; border-radius:10px; font-weight:bold;">MASUK</button></form></body>'); });

app.post('/login', (req, res) => { if(req.body.pw==='JESTRI0301209'){req.session.admin=true;res.redirect('/admin');} else {res.send("Salah Pass");} });

app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const data = await Buku.find().sort({_id:-1}).lean();
    const rows = data.map(b => `
        <div style="background:#f9f9f9; padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <span><b>${b.judul}</b> (Rp ${b.harga})</span>
            <a href="/del/${b._id}" style="color:red; text-decoration:none; font-weight:bold;">HAPUS</a>
        </div>`).join('');

    res.send(`<body style="font-family:sans-serif; padding:20px; max-width:600px; margin:auto;">
        <h2>TAMBAH E-BOOK</h2>
        <form action="/add" method="POST" style="display:flex; flex-direction:column; gap:10px; background:#eee; padding:20px; border-radius:20px;">
            <input name="judul" placeholder="Judul Buku" required style="padding:12px; border-radius:8px; border:none;">
            <input name="harga" type="number" placeholder="Harga" required style="padding:12px; border-radius:8px; border:none;">
            <input name="gambar" placeholder="Link Gambar (URL)" required style="padding:12px; border-radius:8px; border:none;">
            <select name="genre" style="padding:12px; border-radius:8px; border:none;">
                <option>Fiksi</option><option>Edukasi</option><option>Teknologi</option><option>Bisnis</option><option>Self Dev</option>
            </select>
            <button style="padding:15px; background:#27ae60; color:#fff; border:none; border-radius:8px; font-weight:bold;">SIMPAN BUKU</button>
        </form>
        <hr style="margin:40px 0;">
        <h2>DAFTAR BUKU</h2>${rows}
        <br><a href="/" style="display:block; text-align:center; color:#666;">Ke Halaman Toko</a>
    </body>`);
});

app.post('/add', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.redirect('/admin'); });
app.get('/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });

module.exports = app;

