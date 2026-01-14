const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- KONFIGURASI DATABASE (Optimasi Speed) ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10
}).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, harga: Number, gambar: String, genre: { type: String, default: 'Semua' } 
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-key'], maxAge: 24 * 60 * 60 * 1000 }));

// --- RENDERER HELPER (Cepat & Akurat) ---
const renderCards = (data, genre = 'Semua') => {
    if (data.length === 0) {
        const msg = genre !== 'Semua' ? `Belum ada buku kategori ${genre.toLowerCase()}.` : "Belum ada koleksi buku.";
        return `<div class="empty-msg" style="grid-column: 1/3;"><i class="fa-solid fa-face-frown" style="font-size:3rem;display:block;margin-bottom:15px;opacity:0.2"></i>${msg}</div>`;
    }
    return data.map(b => `
        <div class="card" onclick="location.href='https://wa.me/6285189415489?text=Halo%20Admin,%20saya%20mau%20order%20buku:%20${encodeURIComponent(b.judul)}'">
            <img src="${b.gambar}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
            <div class="card-info">
                <h3>${b.judul}</h3>
                <div class="card-price">Rp ${Number(b.harga).toLocaleString('id-ID')}</div>
            </div>
        </div>`).join('');
};

// --- ENDPOINT API ---
app.get('/api/buku', async (req, res) => {
    const { genre, search } = req.query;
    let query = {};
    if (search) query.judul = { $regex: search, $options: 'i' };
    if (genre && genre !== 'Semua') query.genre = genre;
    const data = await Buku.find(query).sort({_id:-1}).lean();
    res.send(renderCards(data, genre));
});

// --- HALAMAN UTAMA ---
app.get('/', async (req, res) => {
    const genres = [
        { name: 'Fiksi', color: 'red' }, { name: 'Edukasi', color: 'blue' },
        { name: 'Teknologi', color: 'yellow' }, { name: 'Bisnis', color: 'red' },
        { name: 'Self Dev', color: 'blue' }, { name: 'Misteri', color: 'yellow' },
        { name: 'Komik', color: 'red' }, { name: 'Sejarah', color: 'blue' }
    ];
    const data = await Buku.find().sort({_id:-1}).limit(12).lean();

    res.send(`<!DOCTYPE html><html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        :root { --red: #ff4757; --blue: #2e86de; --yellow: #ffa502; --dark: #1e272e; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; color: var(--dark); }
        
        .navbar { background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 999; border-bottom: 1px solid #f1f1f1; }
        .logo { font-weight: 800; font-size: 1rem; letter-spacing: -0.5px; }
        .btn-donate { background: #2ed573; color: #fff; padding: 10px 18px; border-radius: 50px; text-decoration: none; font-size: 0.75rem; font-weight: 800; }

        .sidebar { position: fixed; top: 0; left: -100%; width: 280px; height: 100%; background: #fff; z-index: 1001; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding: 30px 20px; box-shadow: 20px 0 50px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1000; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }

        .sidebar-brand { font-weight: 800; font-size: 1.2rem; margin-bottom: 30px; display: block; }
        .sidebar-label { font-size: 0.7rem; color: #ccc; font-weight: 800; letter-spacing: 1px; margin: 20px 0 10px 10px; text-transform: uppercase; }

        .genre-item { display: block; padding: 14px 15px; border-radius: 12px; text-decoration: none; color: #57606f; margin-bottom: 5px; font-weight: 600; cursor: pointer; border-left: 4px solid transparent; }
        .genre-item.red { border-left-color: var(--red); }
        .genre-item.blue { border-left-color: var(--blue); }
        .genre-item.yellow { border-left-color: var(--yellow); }
        .genre-item.active { background: #f1f2f6; color: #000; font-weight: 800; border-left-width: 6px; }

        .container { max-width: 800px; margin: auto; padding: 20px; }
        .search-box { width: 100%; padding: 16px 20px; border: 1px solid #f1f1f1; border-radius: 18px; background: #f5f6fa; outline: none; margin-bottom: 25px; font-family: inherit; font-size: 1rem; }
        .search-box:focus { background: #fff; border-color: var(--dark); }

        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; min-height: 400px; }
        .card { background: #fff; border-radius: 20px; transition: 0.2s; }
        .card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .card-info h3 { font-size: 0.9rem; margin: 10px 0 5px; font-weight: 700; height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .card-price { color: #2ecc71; font-weight: 800; font-size: 0.95rem; }

        .empty-msg { text-align: center; padding: 100px 20px; color: #ccc; font-weight: 600; }

        .social-float { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 998; }
        .social-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; font-size: 1.3rem; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: 0.2s; }
        .social-icon.wa { background: #25d366; } .social-icon.ig { background: #e4405f; } .social-icon.tg { background: #0088cc; }
        .social-icon:active { transform: scale(0.9); }
    </style>
</head>
<body>
    <div class="overlay" id="overlay"></div>
    <div class="sidebar" id="sidebar">
        <span class="sidebar-brand">E-BOOK JESTRI</span>
        <div class="genre-item active" onclick="loadCategory('Semua', this)" style="border-left-color: #000">Semua Buku</div>
        <div class="sidebar-label">GENRE</div>
        ${genres.map(g => `<div class="genre-item ${g.color}" onclick="loadCategory('${g.name}', this)">${g.name}</div>`).join('')}
    </div>

    <nav class="navbar">
        <div style="display:flex; align-items:center; gap:12px;">
            <i class="fa-solid fa-bars-staggered" onclick="toggleMenu()" style="font-size:1.4rem; cursor:pointer"></i>
            <div class="logo">E-BOOK JESTRI</div>
        </div>
        <a href="https://link.dana.id/qr/39bpg786" class="btn-donate">DONATE</a>
    </nav>

    <div class="container">
        <input type="text" id="searchInput" class="search-box" placeholder="Cari judul e-book...">
        <div class="grid" id="bookGrid">${renderCards(data)}</div>
    </div>

    <div class="social-float">
        <a href="https://wa.me/6285189415489" class="social-icon wa"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri?igsh=Ym1nb253bmtoZGd3" class="social-icon ig"><i class="fa-brands fa-instagram"></i></a>
        <a href="https://t.me/0895327806441" class="social-icon tg"><i class="fa-brands fa-telegram"></i></a>
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
            // INSTANT FEEDBACK
            grid.style.opacity = '0.3';
            grid.innerHTML = \`<div class="empty-msg" style="grid-column: 1/3;">
                                <i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem;display:block;margin-bottom:10px;opacity:1;color:var(--blue)"></i>
                                Memuat buku \${genre}...
                             </div>\`;
            
            document.querySelectorAll('.genre-item').forEach(i => i.classList.remove('active'));
            if(el) el.classList.add('active');
            if(window.innerWidth < 768) toggleMenu();

            const res = await fetch(\`/api/buku?genre=\${encodeURIComponent(genre)}\`);
            grid.innerHTML = await res.text();
            grid.style.opacity = '1';
        }

        let sTO;
        document.getElementById('searchInput').oninput = (e) => {
            clearTimeout(sTO);
            sTO = setTimeout(async () => {
                grid.style.opacity = '0.5';
                const res = await fetch(\`/api/buku?search=\${encodeURIComponent(e.target.value)}\`);
                grid.innerHTML = await res.text();
                grid.style.opacity = '1';
            }, 150);
        };
    </script>
</body></html>`);
});

// --- ADMIN PANEL (Sempurna) ---
app.get('/login', (req, res) => {
    res.send('<body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f4f4f4;font-family:sans-serif"><form action="/login" method="POST" style="background:#fff;padding:40px;border-radius:25px;box-shadow:0 10px 30px rgba(0,0,0,0.05)"><h2>ADMIN JESTRI</h2><input type="password" name="pw" placeholder="Password" style="width:100%;padding:15px;margin-bottom:15px;border-radius:10px;border:1px solid #ddd;outline:none"><button style="width:100%;padding:15px;background:#000;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer">MASUK</button></form></body>');
});

app.post('/login', (req, res) => {
    if(req.body.pw === 'JESTRI0301209') { req.session.admin = true; res.redirect('/admin'); }
    else { res.send('Akses Ditolak'); }
});

app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<body style="font-family:sans-serif; padding:20px; max-width:600px; margin:auto; background:#f9f9f9;">
        <h1 style="letter-spacing:-1px">DASHBOARD ADMIN</h1>
        <div style="background:#fff; padding:25px; border-radius:25px; box-shadow:0 5px 20px rgba(0,0,0,0.05); margin-bottom:30px;">
            <form action="/add" method="POST" style="display:grid; gap:12px;">
                <input name="judul" placeholder="Judul Buku" required style="padding:14px; border-radius:12px; border:1px solid #eee; outline:none">
                <input name="harga" type="number" placeholder="Harga" required style="padding:14px; border-radius:12px; border:1px solid #eee; outline:none">
                <input name="gambar" placeholder="URL Gambar" required style="padding:14px; border-radius:12px; border:1px solid #eee; outline:none">
                <select name="genre" style="padding:14px; border-radius:12px; border:1px solid #eee; background:#fff">
                    ${['Fiksi','Edukasi','Teknologi','Bisnis','Self Dev','Misteri','Komik','Sejarah'].map(g => `<option>${g}</option>`).join('')}
                </select>
                <button style="padding:16px; background:#2ecc71; color:#fff; border:none; border-radius:12px; font-weight:800; cursor:pointer">PUBLIKASIKAN BUKU</button>
            </form>
        </div>
        <h3>Katalog Buku (${b.length})</h3>
        ${b.map(x => `
            <div style="background:#fff; padding:15px; border-radius:15px; display:flex; justify-content:space-between; align-items:center; border:1px solid #eee; margin-bottom:10px;">
                <div><b style="font-size:0.9rem">${x.judul}</b><br><small style="color:#999">${x.genre} - Rp ${x.harga}</small></div>
                <a href="/del/${x._id}" style="color:#ff4757; text-decoration:none; font-weight:800; font-size:0.8rem" onclick="return confirm('Hapus buku ini?')">HAPUS</a>
            </div>`).join('')}
        <br><a href="/" style="display:block; text-align:center; color:#999; text-decoration:none; font-size:0.8rem">Kembali ke Toko</a>
    </body>`);
});

app.post('/add', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.redirect('/admin'); });
app.get('/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });

module.exports = app;

