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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; color: #1a1a1a; overflow-x: hidden; }
        
        /* Navbar */
        .navbar { background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 999; border-bottom: 1px solid #f0f0f0; }
        .nav-left { display: flex; align-items: center; gap: 12px; }
        .menu-btn { font-size: 1.4rem; cursor: pointer; border: none; background: none; padding: 5px; }
        .logo { font-weight: 800; font-size: 1.1rem; letter-spacing: -0.5px; text-transform: uppercase; }
        .btn-donate { background: #000; color: #fff; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-size: 0.8rem; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }

        /* Sidebar */
        .sidebar { position: fixed; top: 0; left: -100%; width: 280px; height: 100%; background: #fff; z-index: 1001; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); padding: 30px 20px; box-shadow: 15px 0 40px rgba(0,0,0,0.08); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1000; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }

        .sidebar h3 { font-size: 1.3rem; margin-bottom: 25px; font-weight: 800; padding-left: 10px; }
        .sidebar-label { font-size: 0.7rem; color: #aaa; font-weight: 800; letter-spacing: 1.5px; margin: 25px 0 10px 15px; text-transform: uppercase; }

        .genre-item { display: block; padding: 14px 18px; border-radius: 14px; text-decoration: none; color: #555; margin-bottom: 4px; font-weight: 600; font-size: 0.95rem; }
        .genre-item.active { background: #000; color: #fff; }
        .genre-item:hover:not(.active) { background: #f5f5f5; }

        /* Main Content */
        .container { max-width: 800px; margin: auto; padding: 20px; }
        .search-box { width: 100%; padding: 16px 22px; border: 1px solid #eee; border-radius: 18px; background: #f8f8f8; outline: none; margin-bottom: 30px; font-family: inherit; font-size: 1rem; transition: 0.3s; }
        .search-box:focus { background: #fff; border-color: #000; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }

        /* Book Grid */
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
        .card { background: #fff; border-radius: 22px; text-decoration: none; color: inherit; transition: 0.3s; }
        .card:active { transform: scale(0.96); }
        .card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 22px; box-shadow: 0 8px 25px rgba(0,0,0,0.07); }
        .card-info { padding: 12px 5px; }
        .card-info h3 { font-size: 0.95rem; margin: 5px 0; font-weight: 700; line-height: 1.3; color: #222; }
        .card-price { color: #27ae60; font-weight: 800; font-size: 1.05rem; }

        /* Empty State */
        .empty-msg { text-align: center; padding: 100px 20px; color: #999; font-weight: 500; font-size: 0.95rem; line-height: 1.6; }
        .empty-msg i { display: block; font-size: 3rem; margin-bottom: 15px; opacity: 0.2; }
    </style>
</head>`;

app.get('/', async (req, res) => {
    const { search, genre } = req.query;
    let query = {};
    if (search) query.judul = { $regex: search, $options: 'i' };
    if (genre && genre !== 'Semua') query.genre = genre;

    const data = await Buku.find(query).sort({_id:-1}).lean();
    
    // 8 Genre Populer
    const genres = ['Fiksi', 'Edukasi', 'Teknologi', 'Bisnis', 'Self Dev', 'Misteri', 'Komik', 'Sejarah'];
    const genreHtml = genres.map(g => `<a href="/?genre=${g}" class="genre-item ${genre === g ? 'active' : ''}">${g}</a>`).join('');

    // Pesan Kosong Dinamis
    let emptyText = search ? `Hasil pencarian "${search}" tidak ditemukan.` : `Belum ada koleksi buku.`;
    if (genre && genre !== 'Semua') {
        emptyText = `Belum ada buku kategori ${genre.toLowerCase()}.`;
    }

    res.send(`<!DOCTYPE html><html lang="id">${head}<body>
        <div class="overlay" id="overlay"></div>
        <div class="sidebar" id="sidebar">
            <h3>Menu</h3>
            <a href="/" class="genre-item ${!genre || genre === 'Semua' ? 'active' : ''}">Semua Buku</a>
            
            <div class="sidebar-label">GENRE</div>
            ${genreHtml}
        </div>

        <nav class="navbar">
            <div class="nav-left">
                <button class="menu-btn" id="openMenu"><i class="fa-solid fa-bars-staggered"></i></button>
                <div class="logo">E-BOOK JESTRI</div>
            </div>
            <a href="https://wa.me/628XXXXXXXX" class="btn-donate">Donate</a>
        </nav>

        <div class="container">
            <form action="/">
                <input type="text" name="search" class="search-box" placeholder="Cari judul e-book idaman..." value="${search||''}">
            </form>

            <div class="grid">
                ${data.length > 0 ? data.map(b => `
                    <div class="card" onclick="window.location.href='https://wa.me/628XXXXXXXX?text=Halo Admin, saya ingin beli: ${b.judul}'">
                        <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
                        <div class="card-info">
                            <h3>${b.judul}</h3>
                            <div class="card-price">Rp ${Number(b.harga).toLocaleString('id-ID')}</div>
                        </div>
                    </div>`).join('') : `
                    <div class="empty-msg" style="grid-column: 1/3;">
                        <i class="fa-solid fa-book-open"></i>
                        ${emptyText}
                    </div>`}
            </div>
        </div>

        <script>
            const s=document.getElementById('sidebar'), o=document.getElementById('overlay');
            document.getElementById('openMenu').onclick=()=>{s.classList.add('active'); o.classList.add('active');};
            o.onclick=()=>{s.classList.remove('active'); o.classList.remove('active');};
        </script>
    </body></html>`);
});

// Admin Area (Simplified for maintenance)
app.get('/login', (req, res) => res.send('<form action="/login" method="POST" style="text-align:center;margin-top:50px;"><input type="password" name="pw" placeholder="Admin Password"><button>Login</button></form>'));
app.post('/login', (req, res) => { if(req.body.pw==='JESTRI0301209'){req.session.admin=true;res.redirect('/admin');} });
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<h2>Admin JESTRI</h2><form action="/add" method="POST">
        <input name="judul" placeholder="Judul"><input name="harga" type="number" placeholder="Harga"><input name="gambar" placeholder="Link Gambar">
        <select name="genre">${['Fiksi','Edukasi','Teknologi','Bisnis','Self Dev','Misteri','Komik','Sejarah'].map(g=>`<option>${g}</option>`)}</select>
        <button>Tambah</button></form><ul>${b.map(x=>`<li>${x.judul} - <a href="/del/${x._id}">Hapus</a></li>`).join('')}</ul>`);
});
app.post('/add', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.redirect('/admin'); });
app.get('/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });

module.exports = app;

