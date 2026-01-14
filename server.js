const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// Database Connection - Optimasi Pool Size untuk Kecepatan
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10, 
}).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, harga: Number, gambar: String, genre: { type: String, default: 'Semua' } 
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-key'], maxAge: 24 * 60 * 60 * 1000 }));

// Helper untuk Render Kartu Buku (Dipakai Frontend & API)
const renderCards = (data, genre = 'Semua') => {
    if (data.length === 0) {
        const msg = genre !== 'Semua' ? `Belum ada buku kategori ${genre.toLowerCase()}.` : "Belum ada koleksi buku.";
        return `<div class="empty-msg" style="grid-column: 1/3;"><i class="fa-solid fa-book-open"></i>${msg}</div>`;
    }
    return data.map(b => `
        <div class="card" onclick="location.href='https://wa.me/6285189415489?text=Beli%20${encodeURIComponent(b.judul)}'">
            <img src="${b.gambar}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
            <div class="card-info">
                <h3>${b.judul}</h3>
                <div class="card-price">Rp ${b.harga.toLocaleString('id-ID')}</div>
            </div>
        </div>`).join('');
};

// --- ENDPOINT API (Kunci Anti-Delay) ---
app.get('/api/buku', async (req, res) => {
    const { genre, search } = req.query;
    let query = {};
    if (search) query.judul = { $regex: search, $options: 'i' };
    if (genre && genre !== 'Semua') query.genre = genre;
    const data = await Buku.find(query).sort({_id:-1}).lean();
    res.send(renderCards(data, genre));
});

// --- FRONTEND ---
app.get('/', async (req, res) => {
    const genres = [
        { name: 'Fiksi', color: 'red' }, { name: 'Edukasi', color: 'blue' },
        { name: 'Teknologi', color: 'yellow' }, { name: 'Bisnis', color: 'red' },
        { name: 'Self Dev', color: 'blue' }, { name: 'Misteri', color: 'yellow' },
        { name: 'Komik', color: 'red' }, { name: 'Sejarah', color: 'blue' }
    ];

    const data = await Buku.find().sort({_id:-1}).limit(20).lean();

    res.send(`<!DOCTYPE html><html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        :root { --red: #e74c3c; --blue: #3498db; --yellow: #f1c40f; --dark: #1a1a1a; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; transition: all 0.2s ease; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; color: var(--dark); }
        
        .navbar { background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 999; border-bottom: 1px solid #f0f0f0; }
        .btn-donate { background: #2ecc71; color: #fff; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-size: 0.8rem; font-weight: 700; }

        .sidebar { position: fixed; top: 0; left: -100%; width: 280px; height: 100%; background: #fff; z-index: 1001; padding: 30px 20px; box-shadow: 15px 0 40px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1000; display: none; backdrop-filter: blur(3px); }
        .overlay.active { display: block; }

        .genre-item { display: block; padding: 14px 18px; border-radius: 12px; text-decoration: none; color: #555; margin-bottom: 6px; font-weight: 600; cursor: pointer; }
        .genre-item.red { border-left: 5px solid var(--red); }
        .genre-item.blue { border-left: 5px solid var(--blue); }
        .genre-item.yellow { border-left: 5px solid var(--yellow); }
        .genre-item.active { background: var(--dark); color: #fff !important; }

        .container { max-width: 800px; margin: auto; padding: 20px; }
        .search-box { width: 100%; padding: 16px 22px; border: 1px solid #eee; border-radius: 18px; background: #f8f8f8; outline: none; margin-bottom: 25px; font-size: 1rem; }

        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; min-height: 400px; }
        .card { background: #fff; border-radius: 20px; animation: fadeIn 0.4s ease; }
        .card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .empty-msg { text-align: center; padding: 80px 20px; color: #ccc; grid-column: 1/3; }
        .empty-msg i { display: block; font-size: 3rem; margin-bottom: 10px; }

        .social-float { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 998; }
        .social-icon { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; font-size: 1.2rem; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .social-icon.wa { background: #25d366; } .social-icon.ig { background: #e4405f; } .social-icon.tg { background: #0088cc; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .loading-shimmer { opacity: 0.5; pointer-events: none; }
    </style>
</head>
<body>
    <div class="overlay" id="overlay"></div>
    <div class="sidebar" id="sidebar">
        <h3 style="margin-bottom:25px">E-BOOK JESTRI</h3>
        <div class="genre-item active" onclick="loadCategory('Semua', this)" style="border-left: 5px solid #000">Semua Buku</div>
        <div style="font-size: 0.7rem; color: #ccc; margin: 20px 0 10px 15px; font-weight: 800; letter-spacing:1px">GENRE</div>
        ${genres.map(g => `<div class="genre-item ${g.color}" onclick="loadCategory('${g.name}', this)">${g.name}</div>`).join('')}
    </div>

    <nav class="navbar">
        <div style="display:flex; align-items:center; gap:12px;">
            <i class="fa-solid fa-bars-staggered" onclick="toggleMenu()" style="font-size:1.4rem; cursor:pointer"></i>
            <div style="font-weight:800; font-size:1rem;">E-BOOK JESTRI</div>
        </div>
        <a href="https://link.dana.id/qr/39bpg786" class="btn-donate">DONATE</a>
    </nav>

    <div class="container">
        <input type="text" id="searchInput" class="search-box" placeholder="Cari judul buku...">
        <div class="grid" id="bookGrid">${renderCards(data)}</div>
    </div>

    <div class="social-float">
        <a href="https://wa.me/6285189415489" class="social-icon wa"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri?igsh=Ym1nb253bmtoZGd3" class="social-icon ig"><i class="fa-brands fa-instagram"></i></a>
        <a href="https://t.me/+62895327806441" class="social-icon tg"><i class="fa-brands fa-telegram"></i></a>
    </div>

    <script>
        const grid = document.getElementById('bookGrid');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');

        function toggleMenu() {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }

        overlay.onclick = toggleMenu;

        async function loadCategory(genre, el) {
            // UI Feedback
            grid.classList.add('loading-shimmer');
            document.querySelectorAll('.genre-item').forEach(i => i.classList.remove('active'));
            if(el) el.classList.add('active');
            if(window.innerWidth < 768) toggleMenu();

            // Fetch Data Tanpa Reload
            const res = await fetch(\`/api/buku?genre=\${genre}\`);
            const html = await res.text();
            
            setTimeout(() => {
                grid.innerHTML = html;
                grid.classList.remove('loading-shimmer');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100); 
        }

        // Real-time Search Tanpa Delay
        let searchTimeout;
        document.getElementById('searchInput').oninput = (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                grid.classList.add('loading-shimmer');
                const res = await fetch(\`/api/buku?search=\${e.target.value}\`);
                grid.innerHTML = await res.text();
                grid.classList.remove('loading-shimmer');
            }, 300);
        };
    </script>
</body></html>`);
});

// --- ADMIN PANEL (Optimized) ---
app.get('/login', (req, res) => {
    res.send('<body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f4f4f4;font-family:sans-serif"><form action="/login" method="POST" style="background:#fff;padding:40px;border-radius:25px;box-shadow:0 10px 30px rgba(0,0,0,0.05)"><h2>JESTRI ADMIN</h2><input type="password" name="pw" placeholder="Password" style="width:100%;padding:15px;margin-bottom:15px;border-radius:10px;border:1px solid #ddd"><button style="width:100%;padding:15px;background:#000;color:#fff;border:none;border-radius:10px;font-weight:700">LOGIN</button></form></body>');
});

app.post('/login', (req, res) => {
    if(req.body.pw === 'JESTRI0301209') { req.session.admin = true; res.redirect('/admin'); }
    else { res.send('Wrong Password'); }
});

app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<body style="font-family:sans-serif; padding:20px; max-width:700px; margin:auto; background:#fafafa;">
        <h1>ADMIN DASHBOARD</h1>
        <div style="background:#fff; padding:25px; border-radius:20px; box-shadow:0 5px 15px rgba(0,0,0,0.05); margin-bottom:30px;">
            <form action="/add" method="POST" style="display:grid; gap:10px;">
                <input name="judul" placeholder="Judul Buku" required style="padding:12px; border-radius:8px; border:1px solid #eee;">
                <input name="harga" type="number" placeholder="Harga" required style="padding:12px; border-radius:8px; border:1px solid #eee;">
                <input name="gambar" placeholder="URL Link Gambar" required style="padding:12px; border-radius:8px; border:1px solid #eee;">
                <select name="genre" style="padding:12px; border-radius:8px; border:1px solid #eee;">
                    ${['Fiksi','Edukasi','Teknologi','Bisnis','Self Dev','Misteri','Komik','Sejarah'].map(g => `<option>${g}</option>`).join('')}
                </select>
                <button style="padding:15px; background:#2ecc71; color:#fff; border:none; border-radius:10px; font-weight:800; cursor:pointer;">TAMBAH BUKU</button>
            </form>
        </div>
        <div style="display:grid; gap:10px;">
            ${b.map(x => `
                <div style="background:#fff; padding:15px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; border:1px solid #eee;">
                    <div><b>${x.judul}</b><br><small>${x.genre} - Rp ${x.harga}</small></div>
                    <a href="/del/${x._id}" style="color:red; text-decoration:none; font-weight:700;" onclick="return confirm('Hapus?')">HAPUS</a>
                </div>`).join('')}
        </div>
    </body>`);
});

app.post('/add', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.redirect('/admin'); });
app.get('/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });

module.exports = app;

