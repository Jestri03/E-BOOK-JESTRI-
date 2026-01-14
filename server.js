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
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap');
        body { font-family: 'Inter', sans-serif; margin: 0; background: #fff; color: #2d3436; overflow-x: hidden; }
        
        /* Navbar */
        .navbar { background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 99; border-bottom: 1px solid #f1f1f1; }
        .nav-left { display: flex; align-items: center; gap: 15px; }
        .menu-btn { font-size: 1.2rem; cursor: pointer; background: none; border: none; padding: 5px; }
        .logo { font-weight: 700; font-size: 1.1rem; letter-spacing: 1px; }
        .btn-donate { background: #000; color: #fff; padding: 8px 16px; border-radius: 50px; text-decoration: none; font-size: 0.8rem; font-weight: 600; }

        /* Sidebar Overlay */
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #fff; z-index: 1000; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 20px 0 50px rgba(0,0,0,0.05); padding: 20px; }
        .sidebar.active { left: 0; }
        .sidebar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .close-btn { font-size: 1.5rem; cursor: pointer; }
        
        .genre-list { display: flex; flex-direction: column; gap: 5px; }
        .genre-item { padding: 15px; border-radius: 10px; text-decoration: none; color: #636e72; transition: 0.3s; font-size: 0.95rem; }
        .genre-item:hover { background: #f8f9fa; color: #000; }
        .genre-item.active { background: #f1f2f6; color: #000; font-weight: 600; }

        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); z-index: 999; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }

        /* Main Content */
        .container { max-width: 800px; margin: auto; padding: 20px; }
        .search-container { margin: 10px 0 30px; }
        .search-box { width: 100%; padding: 15px 20px; border: 1px solid #eee; border-radius: 15px; background: #f8f9fa; outline: none; font-size: 0.9rem; }

        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .card { background: #fff; border-radius: 12px; overflow: hidden; transition: 0.3s; }
        .card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 12px; background: #eee; }
        .card-info { padding: 10px 5px; }
        .card-info h3 { font-size: 0.85rem; margin: 5px 0; font-weight: 500; height: 35px; overflow: hidden; }
        .card-price { color: #10ac84; font-weight: 700; font-size: 0.9rem; }
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
                <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
                <div class="card-info">
                    <h3>${b.judul}</h3>
                    <div class="card-price">Rp ${Number(b.harga).toLocaleString('id-ID')}</div>
                </div>
            </div>`).join('');

        res.send(`<!DOCTYPE html><html>${head}<body>
            <div class="overlay" id="overlay"></div>
            <div class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <span style="font-weight:700">GENRE</span>
                    <i class="fa fa-times close-btn" id="closeMenu"></i>
                </div>
                <div class="genre-list">${genreHtml}</div>
            </div>

            <div class="navbar">
                <div class="nav-left">
                    <button class="menu-btn" id="openMenu"><i class="fa fa-bars-staggered"></i></button>
                    <div class="logo">JESTRI.</div>
                </div>
                <a href="#" class="btn-donate">Donate</a>
            </div>

            <div class="container">
                <div class="search-container">
                    <form action="/">
                        <input type="text" name="search" class="search-box" placeholder="Cari buku..." value="${search || ''}">
                    </form>
                </div>
                ${data.length > 0 ? `<div class="grid">${cards}</div>` : `<div style="text-align:center;color:#999;margin-top:50px">Kosong.</div>`}
            </div>

            <script>
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('overlay');
                document.getElementById('openMenu').onclick = () => { sidebar.classList.add('active'); overlay.classList.add('active'); };
                document.getElementById('closeMenu').onclick = () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); };
                overlay.onclick = () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); };
            </script>
        </body></html>`);
    } catch (e) { res.status(500).send("Error"); }
});

// Route admin tetap berfungsi normal...
app.get('/login', (req, res) => { res.send('<form action="/login" method="POST"><input type="password" name="pw"><button>Enter</button></form>'); });
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

