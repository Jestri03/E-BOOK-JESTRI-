const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000
}).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, harga: Number, gambar: String, genre: { type: String, default: 'Semua' } 
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-key'], maxAge: 24 * 60 * 60 * 1000 }));

const head = `
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; color: #1a1a1a; overflow-x: hidden; }
        
        .navbar { background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 999; border-bottom: 1px solid #f0f0f0; }
        .nav-left { display: flex; align-items: center; gap: 15px; }
        .menu-btn { font-size: 1.5rem; cursor: pointer; border: none; background: none; padding: 5px; }
        .logo { font-weight: 800; font-size: 1.2rem; }
        .btn-donate { background: #000; color: #fff; padding: 8px 16px; border-radius: 50px; text-decoration: none; font-size: 0.8rem; font-weight: 600; }

        /* SIDEBAR (Fix Sesuai Panah) */
        .sidebar { position: fixed; top: 0; left: -100%; width: 280px; height: 100%; background: #fff; z-index: 1001; transition: 0.4s; padding: 30px 20px; box-shadow: 10px 0 30px rgba(0,0,0,0.05); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); z-index: 1000; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }

        .genre-item { display: block; padding: 15px; border-radius: 12px; text-decoration: none; color: #666; margin-bottom: 5px; font-weight: 500; }
        .genre-item.active { background: #f0f0f0; color: #000; font-weight: 700; }

        .container { max-width: 800px; margin: auto; padding: 20px; }
        .search-box { width: 100%; padding: 15px 20px; border: 1px solid #eee; border-radius: 15px; background: #f9f9f9; outline: none; margin-bottom: 25px; }

        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .card { background: #fff; border-radius: 20px; overflow: hidden; }
        .card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .card-info { padding: 10px 5px; }
        .card-price { color: #2ecc71; font-weight: 700; }
    </style>
</head>`;

app.get('/', async (req, res) => {
    const { search, genre } = req.query;
    let query = {};
    if (search) query.judul = { $regex: search, $options: 'i' };
    if (genre && genre !== 'Semua') query.genre = genre;

    const data = await Buku.find(query).sort({_id:-1}).lean();
    const genres = ['Semua', 'Fiksi', 'Edukasi', 'Teknologi', 'Bisnis'];

    const genreHtml = genres.map(g => `<a href="/?genre=${g}" class="genre-item ${genre === g || (!genre && g === 'Semua') ? 'active' : ''}">${g}</a>`).join('');
    const cards = data.map(b => `<div class="card"><img src="${b.gambar}"><div class="card-info"><h3>${b.judul}</h3><div class="card-price">Rp ${b.harga.toLocaleString()}</div></div></div>`).join('');

    res.send(`<!DOCTYPE html><html>${head}<body>
        <div class="overlay" id="overlay"></div>
        <div class="sidebar" id="sidebar">
            <h3 style="margin-bottom:20px; padding-left:15px;">Kategori</h3>
            ${genreHtml}
        </div>
        <nav class="navbar">
            <div class="nav-left">
                <button class="menu-btn" id="openMenu"><i class="fa-solid fa-bars-staggered"></i></button>
                <div class="logo">JESTRI.</div>
            </div>
            <a href="#" class="btn-donate">Donate</a>
        </nav>
        <div class="container">
            <form><input type="text" name="search" class="search-box" placeholder="Cari e-book..." value="${search||''}"></form>
            <div class="grid">${cards}</div>
        </div>
        <script>
            const s=document.getElementById('sidebar'), o=document.getElementById('overlay');
            document.getElementById('openMenu').onclick=()=>{s.classList.add('active'); o.classList.add('active');};
            o.onclick=()=>{s.classList.remove('active'); o.classList.remove('active');};
        </script>
    </body></html>`);
});

// Route Admin Simple
app.get('/login', (req, res) => { res.send('<form action="/login" method="POST"><input type="password" name="pw"><button>Login</button></form>'); });
app.post('/login', (req, res) => { if(req.body.pw==='JESTRI0301209'){req.session.admin=true;res.redirect('/admin');} });
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().lean();
    res.send(`<h2>Admin</h2><form action="/add" method="POST"><input name="judul" placeholder="Judul"><input name="harga" type="number" placeholder="Harga"><input name="gambar" placeholder="URL Gambar"><button>Tambah</button></form><ul>${b.map(x=>`<li>${x.judul} <a href="/del/${x._id}">Hapus</a></li>`).join('')}</ul>`);
});
app.post('/add', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.redirect('/admin'); });
app.get('/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });

module.exports = app;

