const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// Database Connection dengan Optimasi Speed
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
}).catch(err => console.log("DB Connection Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, harga: Number, gambar: String, genre: { type: String, default: 'Semua' } 
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-key'], maxAge: 24 * 60 * 60 * 1000 }));

// UI STYLING (Optimized & Clean Colors)
const head = `
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        :root { --red: #e74c3c; --blue: #3498db; --yellow: #f1c40f; --dark: #1a1a1a; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; color: var(--dark); overflow-x: hidden; }
        
        /* Navbar */
        .navbar { background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 999; border-bottom: 1px solid #f0f0f0; }
        .logo { font-weight: 800; font-size: 1rem; color: var(--dark); }
        .btn-donate { background: #2ecc71; color: #fff; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-size: 0.8rem; font-weight: 700; border: none; }

        /* Sidebar */
        .sidebar { position: fixed; top: 0; left: -100%; width: 280px; height: 100%; background: #fff; z-index: 1001; transition: 0.3s ease; padding: 30px 20px; box-shadow: 10px 0 30px rgba(0,0,0,0.05); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1000; display: none; backdrop-filter: blur(3px); }
        .overlay.active { display: block; }

        /* Genre Colors (Red, Blue, Yellow style) */
        .genre-item { display: block; padding: 14px 18px; border-radius: 12px; text-decoration: none; color: #555; margin-bottom: 6px; font-weight: 600; font-size: 0.9rem; }
        .genre-item.red { border-left: 5px solid var(--red); }
        .genre-item.blue { border-left: 5px solid var(--blue); }
        .genre-item.yellow { border-left: 5px solid var(--yellow); }
        .genre-item.active { background: #f4f4f4; color: #000; }

        /* Social Icons Floating */
        .social-float { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 998; }
        .social-icon { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; font-size: 1.2rem; box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: 0.2s; }
        .social-icon.wa { background: #25d366; }
        .social-icon.ig { background: #e4405f; }
        .social-icon.tg { background: #0088cc; }

        /* Content */
        .container { max-width: 800px; margin: auto; padding: 20px; }
        .search-box { width: 100%; padding: 15px 20px; border: 1px solid #eee; border-radius: 15px; background: #f9f9f9; outline: none; margin-bottom: 20px; font-family: inherit; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .card { background: #fff; border-radius: 20px; }
        .card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .card-info { padding: 10px 5px; }
        .card-price { color: #2ecc71; font-weight: 800; }

        /* Admin Styles */
        .admin-card { background: #f8f9fa; padding: 20px; border-radius: 20px; margin-bottom: 20px; }
        .admin-input { width: 100%; padding: 12px; margin-bottom: 10px; border-radius: 10px; border: 1px solid #ddd; }
        .btn-del { color: var(--red); font-weight: 700; text-decoration: none; }
    </style>
</head>`;

app.get('/', async (req, res) => {
    const { search, genre } = req.query;
    let query = {};
    if (search) query.judul = { $regex: search, $options: 'i' };
    if (genre && genre !== 'Semua') query.genre = genre;

    const data = await Buku.find(query).sort({_id:-1}).lean();
    
    // Genre dengan warna terpisah
    const genres = [
        { name: 'Fiksi', color: 'red' },
        { name: 'Edukasi', color: 'blue' },
        { name: 'Teknologi', color: 'yellow' },
        { name: 'Bisnis', color: 'red' },
        { name: 'Self Dev', color: 'blue' },
        { name: 'Misteri', color: 'yellow' },
        { name: 'Komik', color: 'red' },
        { name: 'Sejarah', color: 'blue' }
    ];

    const genreHtml = genres.map(g => `
        <a href="/?genre=${g.name}" class="genre-item ${g.color} ${genre === g.name ? 'active' : ''}">${g.name}</a>
    `).join('');

    let emptyText = genre && genre !== 'Semua' ? `Belum ada buku kategori ${genre.toLowerCase()}.` : "Belum ada koleksi buku.";

    res.send(`<!DOCTYPE html><html>${head}<body>
        <div class="overlay" id="overlay"></div>
        <div class="sidebar" id="sidebar">
            <h3 style="margin-left:15px">E-BOOK JESTRI</h3>
            <a href="/" class="genre-item ${!genre || genre === 'Semua' ? 'active' : ''}" style="border-left: 5px solid #000">Semua Buku</a>
            <div style="font-size: 0.7rem; color: #ccc; margin: 20px 0 10px 15px; font-weight: 800;">GENRE</div>
            ${genreHtml}
        </div>

        <nav class="navbar">
            <div style="display:flex; align-items:center; gap:12px;">
                <i class="fa-solid fa-bars-staggered" id="openMenu" style="font-size:1.4rem; cursor:pointer"></i>
                <div class="logo">E-BOOK JESTRI</div>
            </div>
            <a href="https://link.dana.id/qr/39bpg786" class="btn-donate">DONATE</a>
        </nav>

        <div class="container">
            <form action="/"><input type="text" name="search" class="search-box" placeholder="Cari buku..." value="${search||''}"></form>
            <div class="grid">
                ${data.length > 0 ? data.map(b => `
                    <div class="card" onclick="location.href='https://wa.me/6285189415489?text=Beli%20${b.judul}'">
                        <img src="${b.gambar}">
                        <div class="card-info">
                            <h3 style="font-size:0.9rem; margin:5px 0;">${b.judul}</h3>
                            <div class="card-price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                        </div>
                    </div>`).join('') : `<p style="grid-column:1/3; text-align:center; padding:50px; color:#999;">${emptyText}</p>`}
            </div>
        </div>

        <div class="social-float">
            <a href="https://wa.me/6285189415489" class="social-icon wa"><i class="fa-brands fa-whatsapp"></i></a>
            <a href="https://www.instagram.com/jesssstri?igsh=Ym1nb253bmtoZGd3" class="social-icon ig"><i class="fa-brands fa-instagram"></i></a>
            <a href="https://t.me/+62895327806441" class="social-icon tg"><i class="fa-brands fa-telegram"></i></a>
        </div>

        <script>
            const s=document.getElementById('sidebar'), o=document.getElementById('overlay');
            document.getElementById('openMenu').onclick=()=>{s.classList.add('active'); o.classList.add('active');};
            o.onclick=()=>{s.classList.remove('active'); o.classList.remove('active');};
        </script>
    </body></html>`);
});

// ADMIN PANEL (Sempurna & Clean)
app.get('/login', (req, res) => { res.send(`<body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f4f4f4"><form action="/login" method="POST" style="background:#fff;padding:30px;border-radius:20px;box-shadow:0 10px 20px rgba(0,0,0,0.05)"><h3>Admin Login</h3><input type="password" name="pw" placeholder="Password" style="width:100%;padding:12px;margin-bottom:10px;border-radius:10px;border:1px solid #ddd"><button style="width:100%;padding:12px;background:#000;color:#fff;border:none;border-radius:10px;font-weight:bold">MASUK</button></form></body>`); });
app.post('/login', (req, res) => { if(req.body.pw==='JESTRI0301209'){req.session.admin=true;res.redirect('/admin');} });

app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<!DOCTYPE html><html>${head}<body style="padding:20px; max-width:600px; margin:auto;">
        <h2 style="margin-bottom:30px">JESTRI ADMIN PANEL</h2>
        <div class="admin-card">
            <h4>Tambah Buku Baru</h4>
            <form action="/add" method="POST">
                <input name="judul" class="admin-input" placeholder="Judul Buku" required>
                <input name="harga" type="number" class="admin-input" placeholder="Harga" required>
                <input name="gambar" class="admin-input" placeholder="URL Link Gambar" required>
                <select name="genre" class="admin-input">
                    <option>Fiksi</option><option>Edukasi</option><option>Teknologi</option><option>Bisnis</option><option>Self Dev</option><option>Misteri</option><option>Komik</option><option>Sejarah</option>
                </select>
                <button style="width:100%; padding:15px; background:#27ae60; color:#fff; border:none; border-radius:10px; font-weight:800;">SIMPAN BUKU</button>
            </form>
        </div>
        <h4>Daftar Katalog (${b.length})</h4>
        ${b.map(x=>`
            <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:15px; border-radius:15px; border:1px solid #eee; margin-bottom:10px;">
                <span><b>${x.judul}</b><br><small style="color:#999">${x.genre}</small></span>
                <a href="/del/${x._id}" class="btn-del" onclick="return confirm('Hapus buku ini?')">HAPUS</a>
            </div>
        `).join('')}
        <br><a href="/" style="display:block; text-align:center; color:#ccc; text-decoration:none;">Kembali ke Toko</a>
    </body></html>`);
});

app.post('/add', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.redirect('/admin'); });
app.get('/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });

module.exports = app;

