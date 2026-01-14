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

        .sidebar { position: fixed; top: 0; left: -100%; width: 280px; height: 100%; background: #fff; z-index: 1001; transition: 0.4s; padding: 30px 20px; box-shadow: 10px 0 30px rgba(0,0,0,0.05); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); z-index: 1000; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }

        .sidebar h3 { font-size: 1.2rem; margin-bottom: 25px; font-weight: 800; }
        .sidebar-label { font-size: 0.75rem; color: #999; font-weight: 700; letter-spacing: 1px; margin: 20px 0 10px 15px; text-transform: uppercase; }

        .genre-item { display: block; padding: 12px 15px; border-radius: 12px; text-decoration: none; color: #555; margin-bottom: 2px; font-weight: 500; font-size: 0.95rem; }
        .genre-item.active { background: #f4f4f4; color: #000; font-weight: 700; }
        .genre-item:hover { background: #fafafa; }

        .container { max-width: 800px; margin: auto; padding: 20px; }
        .search-box { width: 100%; padding: 15px 20px; border: 1px solid #eee; border-radius: 15px; background: #f9f9f9; outline: none; margin-bottom: 25px; font-family: inherit; }

        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .card { background: #fff; border-radius: 20px; text-decoration: none; color: inherit; }
        .card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .card-info { padding: 10px 5px; }
        .card-info h3 { font-size: 0.9rem; margin: 5px 0; font-weight: 700; line-height: 1.3; height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .card-price { color: #2ecc71; font-weight: 800; font-size: 1rem; }
    </style>
</head>`;

app.get('/', async (req, res) => {
    const { search, genre } = req.query;
    let query = {};
    if (search) query.judul = { $regex: search, $options: 'i' };
    if (genre && genre !== 'Semua') query.genre = genre;

    const data = await Buku.find(query).sort({_id:-1}).lean();
    
    // 8 Genre Populer Dunia
    const genres = ['Fiksi', 'Edukasi', 'Teknologi', 'Bisnis', 'Self Dev', 'Misteri', 'Komik', 'Sejarah'];

    const genreHtml = genres.map(g => `<a href="/?genre=${g}" class="genre-item ${genre === g ? 'active' : ''}">${g}</a>`).join('');

    res.send(`<!DOCTYPE html><html>${head}<body>
        <div class="overlay" id="overlay"></div>
        <div class="sidebar" id="sidebar">
            <h3>Kategori</h3>
            <a href="/" class="genre-item ${!genre || genre === 'Semua' ? 'active' : ''}">Semua</a>
            
            <div class="sidebar-label">GENRE</div>
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
            <form action="/"><input type="text" name="search" class="search-box" placeholder="Cari judul buku..." value="${search||''}"></form>
            <div class="grid">
                ${data.length > 0 ? data.map(b => `
                    <div class="card" onclick="window.location.href='https://wa.me/628XXXXXXXX?text=Halo, saya ingin membeli buku: ${b.judul}'">
                        <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
                        <div class="card-info">
                            <h3>${b.judul}</h3>
                            <div class="card-price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                        </div>
                    </div>`).join('') : '<p style="text-align:center; grid-column: 1/3; color: #999;">Belum ada buku di kategori ini.</p>'}
            </div>
        </div>

        <script>
            const s=document.getElementById('sidebar'), o=document.getElementById('overlay');
            document.getElementById('openMenu').onclick=()=>{s.classList.add('active'); o.classList.add('active');};
            o.onclick=()=>{s.classList.remove('active'); o.classList.remove('active');};
        </script>
    </body></html>`);
});

// Admin routes (Tetap sama agar tidak error)
app.get('/login', (req, res) => { res.send('<body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif"><form action="/login" method="POST" style="padding:20px;border:1px solid #eee;border-radius:15px"><h2>Admin</h2><input type="password" name="pw" placeholder="Password"><button>Masuk</button></form></body>'); });
app.post('/login', (req, res) => { if(req.body.pw==='JESTRI0301209'){req.session.admin=true;res.redirect('/admin');} });
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<h2>Admin Panel</h2><form action="/add" method="POST" style="display:grid;gap:10px;max-width:300px">
        <input name="judul" placeholder="Judul"><input name="harga" type="number" placeholder="Harga"><input name="gambar" placeholder="Link Gambar">
        <select name="genre"><option>Fiksi</option><option>Edukasi</option><option>Teknologi</option><option>Bisnis</option><option>Self Dev</option><option>Misteri</option><option>Komik</option><option>Sejarah</option></select>
        <button>Tambah</button></form><hr><ul>${b.map(x=>`<li>${x.judul} (${x.genre}) <a href="/del/${x._id}">Hapus</a></li>`).join('')}</ul>`);
});
app.post('/add', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.redirect('/admin'); });
app.get('/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });

module.exports = app;

