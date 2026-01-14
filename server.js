const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONNECTION ---
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

// --- API ENDPOINT (Zero Latency) ---
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
                Tidak ada buku ditemukan.
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

// --- HALAMAN UTAMA PEMBELI ---
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
        .btn-donate { background: var(--green); color: #fff; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-size: 0.8rem; font-weight: 800; border:none; cursor:pointer; }

        .sidebar { position: fixed; top: 0; left: -105%; width: 280px; height: 100%; background: #fff; z-index: 1001; transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1); padding: 30px 20px; box-shadow: 20px 0 50px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1000; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }

        .genre-item { display: block; padding: 14px 15px; border-radius: 12px; text-decoration: none; color: #57606f; margin-bottom: 5px; font-weight: 600; cursor: pointer; border-left: 4px solid transparent; }
        .genre-item.red { border-left-color: var(--red); }
        .genre-item.blue { border-left-color: var(--blue); }
        .genre-item.yellow { border-left-color: var(--yellow); }
        .genre-item.active { background: #f1f2f6; color: #000; font-weight: 800; border-left-width: 6px; }

        .container { max-width: 800px; margin: auto; padding: 20px; }
        .search-box { width: 100%; padding: 16px 20px; border: 1px solid #f1f1f1; border-radius: 18px; background: #f5f6fa; font-size: 1rem; margin-bottom: 25px; }

        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; min-height: 300px; }
        .card { background: #fff; border-radius: 20px; animation: fadeIn 0.3s ease; }
        .card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
        .card-info h3 { font-size: 0.85rem; margin: 10px 0 5px; font-weight: 700; height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .card-price { color: var(--green); font-weight: 800; font-size: 0.9rem; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .social-float { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 998; }
        .social-icon { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; font-size: 1.4rem; box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
        .social-icon.wa { background: #25d366; } .social-icon.ig { background: #e4405f; } .social-icon.tg { background: #0088cc; }
        
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
            ${initialData.map(b => `
                <div class="card" onclick="location.href='https://wa.me/6285189415489?text=Order%20${encodeURIComponent(b.judul)}'">
                    <img src="${b.gambar}">
                    <div class="card-info">
                        <h3>${b.judul}</h3>
                        <div class="card-price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                    </div>
                </div>`).join('')}
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
            document.querySelectorAll('.genre-item').forEach(i => i.classList.remove('active'));
            if(el) el.classList.add('active');
            if(window.innerWidth < 768 && sidebar.classList.contains('active')) toggleMenu();

            grid.innerHTML = \`<div class="loading-state"><div class="spinner"></div><p>Membuka koleksi \${genre}...</p></div>\`;
            
            const res = await fetch(\`/api/buku?genre=\${encodeURIComponent(genre)}\`);
            grid.innerHTML = await res.text();
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

// --- ADMIN DASHBOARD (OPTIMAL MODE) ---
app.get('/login', (req, res) => {
    res.send('<body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f4f4f4;font-family:sans-serif;margin:0"><form action="/login" method="POST" style="background:#fff;padding:40px;border-radius:30px;width:90%;max-width:400px;box-shadow:0 15px 35px rgba(0,0,0,0.1)"> <div style="text-align:center;margin-bottom:20px"><i class="fa-solid fa-user-shield" style="font-size:3rem;color:#2e86de"></i></div><h2 style="text-align:center;margin-bottom:30px">JESTRI ADMIN</h2><input type="password" name="pw" placeholder="Password Rahasia" autofocus style="width:100%;padding:18px;margin-bottom:20px;border-radius:15px;border:1px solid #ddd;font-size:1rem;outline:none"><button style="width:100%;padding:18px;background:#000;color:#fff;border:none;border-radius:15px;font-weight:800;font-size:1rem;cursor:pointer">MASUK KE DASHBOARD</button></form></body>');
});

app.post('/login', (req, res) => {
    if(req.body.pw === 'JESTRI0301209') { req.session.admin = true; res.redirect('/admin'); }
    else { res.send('<script>alert("Password Salah!"); window.location="/login";</script>'); }
});

app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: sans-serif; margin: 0; background: #f8f9fa; padding: 15px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding: 10px 5px; }
        .header h1 { margin: 0; font-size: 1.5rem; letter-spacing: -1px; }
        
        .form-card { background: #fff; padding: 25px; border-radius: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 30px; }
        .form-card h3 { margin-top: 0; margin-bottom: 20px; color: #2e86de; }
        
        input, select { width: 100%; padding: 16px; margin-bottom: 15px; border-radius: 12px; border: 1px solid #eee; font-size: 1rem; box-sizing: border-box; background: #fafafa; }
        input:focus { border-color: #2e86de; background: #fff; outline: none; }
        
        .btn-add { width: 100%; padding: 18px; background: #2e86de; color: #fff; border: none; border-radius: 15px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: 0.2s; }
        .btn-add:active { transform: scale(0.98); background: #1b6ca8; }

        .book-list { display: grid; gap: 12px; }
        .book-item { background: #fff; padding: 15px; border-radius: 18px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #eee; }
        .book-info b { display: block; font-size: 1rem; color: #333; margin-bottom: 4px; }
        .book-info span { font-size: 0.85rem; color: #999; font-weight: 600; }
        
        .btn-del { color: #ff4757; text-decoration: none; font-weight: 800; font-size: 0.85rem; padding: 10px; border: 1px solid #ffeef0; border-radius: 10px; background: #fff5f6; }
    </style>
    </head>
    <body>
        <div class="header">
            <h1>ADMIN PANEL</h1>
            <a href="/" style="text-decoration:none; color:#666; font-weight:700;"><i class="fa-solid fa-eye"></i> Lihat Toko</a>
        </div>

        <div class="form-card">
            <h3><i class="fa-solid fa-plus-circle"></i> Tambah Buku Baru</h3>
            <form action="/add" method="POST">
                <input name="judul" placeholder="Judul Buku" required>
                <input name="harga" type="number" placeholder="Harga (Contoh: 15000)" required>
                <input name="gambar" placeholder="Link URL Gambar" required>
                <select name="genre">
                    ${['Fiksi','Edukasi','Teknologi','Bisnis','Self Dev','Misteri','Komik','Sejarah'].map(g => `<option>${g}</option>`).join('')}
                </select>
                <button class="btn-add">PUBLIKASIKAN SEKARANG</button>
            </form>
        </div>

        <h3>Daftar Koleksi (${b.length})</h3>
        <div class="book-list">
            ${b.map(x => `
                <div class="book-item">
                    <div class="book-info">
                        <b>${x.judul}</b>
                        <span>${x.genre} • Rp ${x.harga.toLocaleString('id-ID')}</span>
                    </div>
                    <a href="/del/${x._id}" class="btn-del" onclick="return confirm('Hapus buku ini?')"><i class="fa-solid fa-trash"></i></a>
                </div>`).join('')}
        </div>
    </body></html>`);
});

// --- FIX REDIRECT LOGIC ---
app.post('/add', async (req, res) => { 
    if(req.session.admin) {
        await new Buku(req.body).save(); 
        res.redirect('/admin'); // Tetap di halaman admin setelah nambah
    } else {
        res.redirect('/login');
    }
});

app.get('/del/:id', async (req, res) => { 
    if(req.session.admin) {
        await Buku.findByIdAndDelete(req.params.id); 
        res.redirect('/admin'); // Tetap di halaman admin setelah hapus
    } else {
        res.redirect('/login');
    }
});

module.exports = app;

