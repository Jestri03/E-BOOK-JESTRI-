const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONNECTION (Optimized) ---
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

// --- API ENDPOINT (Super Fast) ---
app.get('/api/buku', async (req, res) => {
    try {
        const { genre, search } = req.query;
        let query = {};
        if (search) query.judul = { $regex: search, $options: 'i' };
        if (genre && genre !== 'Semua') query.genre = genre;
        const data = await Buku.find(query).sort({_id:-1}).lean();
        
        if (data.length === 0) {
            return res.send(`<div class="empty-msg" style="grid-column:1/3;text-align:center;padding:100px 20px;color:#ccc;">
                <i class="fa-solid fa-face-frown" style="font-size:3rem;display:block;margin-bottom:15px;opacity:0.2"></i>
                Belum ada buku di kategori ini.
            </div>`);
        }

        const html = data.map(b => `
            <div class="card" onclick="location.href='https://wa.me/6285189415489?text=Halo%20Admin,%20saya%20mau%20order%20buku:%20${encodeURIComponent(b.judul)}'">
                <img src="${b.gambar}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
                <div class="card-info">
                    <h3>${b.judul}</h3>
                    <div class="card-price">Rp ${Number(b.harga).toLocaleString('id-ID')}</div>
                </div>
            </div>`).join('');
        res.send(html);
    } catch (e) { res.status(500).send("Error"); }
});

// --- MAIN UI ---
app.get('/', async (req, res) => {
    const genres = [
        { name: 'Fiksi', color: 'red' }, { name: 'Edukasi', color: 'blue' },
        { name: 'Teknologi', color: 'yellow' }, { name: 'Bisnis', color: 'red' },
        { name: 'Self Dev', color: 'blue' }, { name: 'Misteri', color: 'yellow' },
        { name: 'Komik', color: 'red' }, { name: 'Sejarah', color: 'blue' }
    ];
    const initialData = await Buku.find().sort({_id:-1}).limit(10).lean();

    res.send(`<!DOCTYPE html><html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        :root { --red: #ff4757; --blue: #2e86de; --yellow: #ffa502; --green: #2ed573; --dark: #1e272e; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; outline: none; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; color: var(--dark); overflow-x: hidden; }
        
        .navbar { background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 999; border-bottom: 1px solid #f1f1f1; }
        .logo { font-weight: 800; font-size: 1.1rem; letter-spacing: -0.5px; }
        .btn-donate { background: var(--green); color: #fff; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-size: 0.8rem; font-weight: 800; border:none; cursor:pointer; box-shadow: 0 4px 10px rgba(46, 213, 115, 0.3); }

        .sidebar { position: fixed; top: 0; left: -105%; width: 280px; height: 100%; background: #fff; z-index: 1001; transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1); padding: 30px 20px; box-shadow: 20px 0 50px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1000; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }

        .genre-item { display: block; padding: 14px 15px; border-radius: 12px; text-decoration: none; color: #57606f; margin-bottom: 5px; font-weight: 600; cursor: pointer; border-left: 4px solid transparent; transition: 0.1s; }
        .genre-item.red { border-left-color: var(--red); }
        .genre-item.blue { border-left-color: var(--blue); }
        .genre-item.yellow { border-left-color: var(--yellow); }
        .genre-item.active { background: #f1f2f6; color: #000; font-weight: 800; border-left-width: 6px; }

        .container { max-width: 800px; margin: auto; padding: 20px; }
        .search-box { width: 100%; padding: 16px 20px; border: 1px solid #f1f1f1; border-radius: 18px; background: #f5f6fa; font-size: 1rem; margin-bottom: 25px; transition: 0.2s; }
        .search-box:focus { background: #fff; border-color: var(--dark); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }

        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; min-height: 300px; transition: opacity 0.15s; }
        .card { background: #fff; border-radius: 20px; animation: fadeIn 0.3s ease; }
        .card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
        .card-info h3 { font-size: 0.85rem; margin: 10px 0 5px; font-weight: 700; height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .card-price { color: var(--green); font-weight: 800; font-size: 0.9rem; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .social-float { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 998; }
        .social-icon { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; font-size: 1.4rem; box-shadow: 0 8px 20px rgba(0,0,0,0.15); transition: 0.2s; }
        .social-icon.wa { background: #25d366; } .social-icon.ig { background: #e4405f; } .social-icon.tg { background: #0088cc; }
        
        /* Loader Style */
        .loading-state { grid-column: 1/3; text-align: center; padding: 80px 0; color: #999; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--blue); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 15px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="overlay" id="overlay"></div>
    <div class="sidebar" id="sidebar">
        <div style="font-weight:800; font-size:1.3rem; margin-bottom:30px;">E-BOOK JESTRI</div>
        <div class="genre-item active" onclick="loadContent('Semua', this)" style="border-left-color: #000">Semua Buku</div>
        <div style="font-size: 0.7rem; color: #ccc; font-weight: 800; letter-spacing: 1px; margin: 25px 0 10px 10px;">KATALOG GENRE</div>
        ${genres.map(g => `<div class="genre-item ${g.color}" onclick="loadContent('${g.name}', this)">${g.name}</div>`).join('')}
    </div>

    <nav class="navbar">
        <div style="display:flex; align-items:center; gap:15px;">
            <i class="fa-solid fa-bars-staggered" onclick="toggleMenu()" style="font-size:1.4rem; cursor:pointer"></i>
            <div class="logo">E-BOOK JESTRI</div>
        </div>
        <button onclick="location.href='https://link.dana.id/qr/39bpg786'" class="btn-donate">DONATE</button>
    </nav>

    <div class="container">
        <input type="text" id="searchInput" class="search-box" placeholder="Cari judul buku...">
        <div class="grid" id="bookGrid">
            ${initialData.length > 0 ? initialData.map(b => `
                <div class="card" onclick="location.href='https://wa.me/6285189415489?text=Order%20${encodeURIComponent(b.judul)}'">
                    <img src="${b.gambar}">
                    <div class="card-info">
                        <h3>${b.judul}</h3>
                        <div class="card-price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                    </div>
                </div>`).join('') : '<div class="loading-state">Katalog Kosong</div>'}
        </div>
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

        async function loadContent(genre, el) {
            // 1. UPDATE UI INSTAN (0ms Delay)
            document.querySelectorAll('.genre-item').forEach(i => i.classList.remove('active'));
            if(el) el.classList.add('active');
            if(window.innerWidth < 768 && sidebar.classList.contains('active')) toggleMenu();

            // Tampilkan loader segera
            grid.innerHTML = \`<div class="loading-state">
                <div class="spinner"></div>
                <p>Membuka koleksi \${genre}...</p>
            </div>\`;
            grid.style.opacity = '1';

            // 2. AMBIL DATA DARI SERVER
            try {
                const res = await fetch(\`/api/buku?genre=\${encodeURIComponent(genre)}\`);
                const html = await res.text();
                
                // 3. RENDER HASIL
                grid.innerHTML = html;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
                grid.innerHTML = '<div class="loading-state">Gagal memuat data.</div>';
            }
        }

        let sTO;
        document.getElementById('searchInput').oninput = (e) => {
            clearTimeout(sTO);
            sTO = setTimeout(async () => {
                grid.style.opacity = '0.5';
                const res = await fetch(\`/api/buku?search=\${encodeURIComponent(e.target.value)}\`);
                grid.innerHTML = await res.text();
                grid.style.opacity = '1';
            }, 200);
        };
    </script>
</body></html>`);
});

// --- ADMIN DASHBOARD (Sempurna) ---
app.get('/login', (req, res) => {
    res.send('<body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f4f4f4;font-family:sans-serif"><form action="/login" method="POST" style="background:#fff;padding:40px;border-radius:25px;box-shadow:0 10px 30px rgba(0,0,0,0.05)"><h2>ADMIN LOGIN</h2><input type="password" name="pw" placeholder="Password Admin" style="width:100%;padding:15px;margin-bottom:15px;border-radius:10px;border:1px solid #ddd;outline:none"><button style="width:100%;padding:15px;background:#000;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer">MASUK</button></form></body>');
});

app.post('/login', (req, res) => {
    if(req.body.pw === 'JESTRI0301209') { req.session.admin = true; res.redirect('/admin'); }
    else { res.send('Salah Password!'); }
});

app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<body style="font-family:sans-serif; padding:20px; max-width:600px; margin:auto; background:#f9f9f9;">
        <div style="display:flex; justify-content:space-between; align-items:center">
            <h1>ADMIN PANEL</h1>
            <a href="/" style="text-decoration:none; color:#666">Ke Toko</a>
        </div>
        <div style="background:#fff; padding:25px; border-radius:25px; box-shadow:0 5px 20px rgba(0,0,0,0.05); margin-bottom:30px;">
            <form action="/add" method="POST" style="display:grid; gap:12px;">
                <input name="judul" placeholder="Judul Buku" required style="padding:14px; border-radius:12px; border:1px solid #eee;">
                <input name="harga" type="number" placeholder="Harga" required style="padding:14px; border-radius:12px; border:1px solid #eee;">
                <input name="gambar" placeholder="URL Link Gambar" required style="padding:14px; border-radius:12px; border:1px solid #eee;">
                <select name="genre" style="padding:14px; border-radius:12px; border:1px solid #eee; background:#fff">
                    ${['Fiksi','Edukasi','Teknologi','Bisnis','Self Dev','Misteri','Komik','Sejarah'].map(g => `<option>${g}</option>`).join('')}
                </select>
                <button style="padding:16px; background:black; color:#fff; border:none; border-radius:12px; font-weight:800; cursor:pointer">SIMPAN</button>
            </form>
        </div>
        <h3>Daftar Buku (${b.length})</h3>
        ${b.map(x => `
            <div style="background:#fff; padding:15px; border-radius:15px; display:flex; justify-content:space-between; align-items:center; border:1px solid #eee; margin-bottom:10px;">
                <div><b>${x.judul}</b><br><small style="color:#999">${x.genre} - Rp ${x.harga.toLocaleString('id-ID')}</small></div>
                <a href="/del/${x._id}" style="color:red; text-decoration:none; font-weight:800;" onclick="return confirm('Hapus?')">HAPUS</a>
            </div>`).join('')}
    </body>`);
});

app.post('/add', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.redirect('/admin'); });
app.get('/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });

module.exports = app;

