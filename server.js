const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONNECTION ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 10000,
}).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieSession({ name: 'session', keys: ['jestri-key'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API PEMBELI (FIXED QUERY) ---
app.get('/api/buku', async (req, res) => {
    try {
        const { genre, search } = req.query;
        let query = {};
        if (search) query.judul = { $regex: search, $options: 'i' };
        if (genre && genre !== 'Semua') query.genre = genre;
        
        const data = await Buku.find(query).sort({_id:-1}).lean();
        
        if (!data || data.length === 0) {
            return res.send(\`<div style="grid-column:1/3;text-align:center;padding:80px 20px;color:#ccc">
                <i class="fa-solid fa-box-open" style="font-size:3rem;margin-bottom:15px;opacity:0.3"></i>
                <p>Belum ada buku di kategori \${genre || ''}</p>
            </div>\`);
        }

        const html = data.map(b => `
            <div class="card" onclick="location.href='https://wa.me/6285189415489?text=Order%20${encodeURIComponent(b.judul)}'">
                <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
                <div class="card-body">
                    <h3>${b.judul}</h3>
                    <p>${b.penulis}</p>
                    <div class="price">Rp ${Number(b.harga).toLocaleString('id-ID')}</div>
                </div>
            </div>`).join('');
        res.send(html);
    } catch (err) { res.status(500).send("Error"); }
});

// --- HALAMAN UTAMA PEMBELI (PERFECTION) ---
app.get('/', async (req, res) => {
    const genres = ['Fiksi','Edukasi','Teknologi','Bisnis','Self Dev','Misteri','Komik','Sejarah'];
    const initialData = await Buku.find().sort({_id:-1}).limit(12).lean();

    res.send(`<!DOCTYPE html><html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        :root { --blue: #2e86de; --green: #2ed573; --dark: #1e272e; --gray: #f5f6fa; }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; color: var(--dark); }
        
        .navbar { background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 999; border-bottom: 1px solid #f1f1f1; }
        .sidebar { position: fixed; top: 0; left: -105%; width: 280px; height: 100%; background: #fff; z-index: 1001; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding: 30px 20px; box-shadow: 20px 0 50px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1000; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }

        .genre-item { display: block; padding: 14px 15px; border-radius: 12px; color: #57606f; margin-bottom: 5px; font-weight: 600; cursor: pointer; border-left: 4px solid transparent; transition: 0.2s; }
        .genre-item.active { background: var(--gray); color: #000; font-weight: 800; border-left-color: var(--blue); }

        .container { max-width: 800px; margin: auto; padding: 20px; min-height: 80vh; }
        .search-box { width: 100%; padding: 16px 20px; border: 1px solid #eee; border-radius: 18px; background: var(--gray); font-size: 1rem; margin-bottom: 25px; outline: none; }

        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; transition: opacity 0.3s; }
        .card { background: #fff; border-radius: 20px; overflow: hidden; animation: fadeIn 0.4s ease; cursor: pointer; }
        .card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
        .card-body { padding: 10px 5px; }
        .card-body h3 { font-size: 0.85rem; margin: 5px 0 2px; font-weight: 700; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.4em; }
        .card-body p { font-size: 0.75rem; color: #888; margin: 0; }
        .price { color: var(--green); font-weight: 800; font-size: 0.95rem; margin-top: 5px; }

        .social-float { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 998; }
        .social-icon { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; font-size: 1.4rem; box-shadow: 0 8px 20px rgba(0,0,0,0.2); transition: 0.3s; }
        .social-icon:active { transform: scale(0.9); }
        
        .loader { grid-column: 1/3; text-align: center; padding: 50px; display: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="overlay" id="overlay" onclick="toggleMenu()"></div>
    <div class="sidebar" id="sidebar">
        <h2 style="margin-bottom:30px; letter-spacing:-1px">E-BOOK JESTRI</h2>
        <div class="genre-item active" onclick="loadC('Semua', this)">Semua Buku</div>
        <div style="font-size:0.7rem; color:#ccc; font-weight:800; margin:20px 0 10px 15px; letter-spacing:1px">KATEGORI</div>
        ${genres.map(g => `<div class="genre-item" onclick="loadC('${g}', this)">${g}</div>`).join('')}
    </div>

    <nav class="navbar">
        <div style="display:flex; align-items:center; gap:15px">
            <i class="fa-solid fa-bars-staggered" onclick="toggleMenu()" style="font-size:1.4rem; cursor:pointer"></i>
            <div style="font-weight:800; font-size:1.1rem">E-BOOK JESTRI</div>
        </div>
        <button onclick="location.href='https://link.dana.id/qr/39bpg786'" style="background:var(--green); color:#fff; border:none; padding:8px 18px; border-radius:20px; font-weight:800; font-size:0.75rem">DONATE</button>
    </nav>

    <div class="container">
        <input type="text" id="s" class="search-box" placeholder="Cari judul buku favoritmu...">
        <div class="grid" id="bookGrid">
            ${initialData.map(b => `
                <div class="card" onclick="location.href='https://wa.me/6285189415489?text=Order%20${encodeURIComponent(b.judul)}'">
                    <img src="${b.gambar}">
                    <div class="card-body">
                        <h3>${b.judul}</h3>
                        <p>${b.penulis}</p>
                        <div class="price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                    </div>
                </div>`).join('')}
        </div>
    </div>

    <div class="social-float">
        <a href="https://wa.me/6285189415489" class="social-icon" style="background:#25d366"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="social-icon" style="background:#e4405f"><i class="fa-brands fa-instagram"></i></a>
        <a href="https://t.me/+62895327806441" class="social-icon" style="background:#0088cc"><i class="fa-brands fa-telegram"></i></a>
    </div>

    <script>
        function toggleMenu() {
            document.getElementById('sidebar').classList.toggle('active');
            document.getElementById('overlay').classList.toggle('active');
        }

        async function loadC(g, el) {
            const grid = document.getElementById('bookGrid');
            document.querySelectorAll('.genre-item').forEach(i => i.classList.remove('active'));
            el.classList.add('active');
            if(window.innerWidth < 768) toggleMenu();

            grid.style.opacity = '0.3'; // Efek transisi halus
            
            try {
                const res = await fetch(\`/api/buku?genre=\${encodeURIComponent(g)}\`);
                const html = await res.text();
                grid.innerHTML = html;
            } catch (e) {
                grid.innerHTML = '<p style="grid-column:1/3;text-align:center">Gagal memuat data.</p>';
            } finally {
                grid.style.opacity = '1';
            }
        }

        let timeout;
        document.getElementById('s').oninput = (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                const grid = document.getElementById('bookGrid');
                const res = await fetch(\`/api/buku?search=\${encodeURIComponent(e.target.value)}\`);
                grid.innerHTML = await res.text();
            }, 300);
        };
    </script>
</body></html>`);
});

// --- ADMIN MODE (REMAINTAINED) ---
app.get('/login', (req, res) => {
    res.send('<body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f4f4f4;font-family:sans-serif;margin:0"><form action="/login" method="POST" style="background:#fff;padding:40px;border-radius:30px;width:90%;max-width:400px;box-shadow:0 15px 35px rgba(0,0,0,0.1)"><h2>ADMIN LOGIN</h2><input type="password" name="pw" placeholder="Password" autofocus style="width:100%;padding:18px;margin-bottom:20px;border-radius:15px;border:1px solid #ddd;outline:none"><button style="width:100%;padding:18px;background:#000;color:#fff;border:none;border-radius:15px;font-weight:800;cursor:pointer">MASUK</button></form></body>');
});

app.post('/login', (req, res) => {
    if(req.body.pw === 'JESTRI0301209') { req.session.admin = true; res.redirect('/admin'); }
    else res.send('<script>alert("Salah!"); window.location="/login";</script>');
});

app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(\`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: sans-serif; background: #f8f9fa; padding: 15px; margin:0; }
        .card { background: #fff; padding: 20px; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); margin-bottom: 20px; }
        input, select { width: 100%; padding: 15px; margin-bottom: 12px; border-radius: 12px; border: 1px solid #eee; box-sizing: border-box; font-size: 1rem; }
        .btn { width: 100%; padding: 18px; background: #2e86de; color: #fff; border: none; border-radius: 15px; font-weight: 800; cursor: pointer; }
        #ld { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.9); z-index:999; justify-content:center; align-items:center; flex-direction:column; }
        #pvw { width: 80px; height: 110px; object-fit: cover; display: none; margin-bottom: 10px; border-radius: 10px; border:2px solid #2e86de; }
    </style>
    </head><body>
    <div id="ld"><i class="fa-solid fa-cloud-arrow-up fa-bounce" style="font-size:2rem;color:#2e86de"></i><p>Sedang Mengunggah...</p></div>
    <div style="padding:15px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <h2 style="margin:0">ADMIN MODE</h2>
            <a href="/" style="text-decoration:none;font-weight:800;color:#2e86de">LIHAT TOKO</a>
        </div>
        <div class="card">
            <form id="f">
                <input id="j" placeholder="Judul Buku" required>
                <input id="p" placeholder="Nama Penulis" required>
                <input id="h" type="number" step="any" placeholder="Harga (Contoh: 2500)" required>
                <div style="padding:10px; border:1px dashed #ccc; border-radius:10px; margin-bottom:12px">
                    <img id="pvw">
                    <input type="file" id="fi" accept="image/*" required style="border:none;padding:0">
                </div>
                <select id="g">
                    \${['Fiksi','Edukasi','Teknologi','Bisnis','Self Dev','Misteri','Komik','Sejarah'].map(x => \`<option>\${x}</option>\`).join('')}
                </select>
                <button type="submit" class="btn">POSTING BUKU</button>
            </form>
        </div>
        <h3>Katalog (\${b.length})</h3>
        \${b.map(x => \`<div style="background:#fff;padding:15px;border-radius:15px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;border:1px solid #eee">
            <div><b>\${x.judul}</b><br><small>Rp \${x.harga.toLocaleString('id-ID')}</small></div>
            <a href="/del/\${x._id}" style="color:red;text-decoration:none;font-weight:800" onclick="return confirm('Hapus?')">HAPUS</a>
        </div>\`).join('')}
    </div>
    <script>
        const fi = document.getElementById('fi');
        const pvw = document.getElementById('pvw');
        fi.onchange = () => { const [file] = fi.files; if(file) { pvw.src = URL.createObjectURL(file); pvw.style.display='block'; } };

        document.getElementById('f').onsubmit = async (e) => {
            e.preventDefault();
            document.getElementById('ld').style.display='flex';
            const formData = new FormData();
            formData.append('image', fi.files[0]);
            try {
                const img = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', { method: 'POST', body: formData });
                const resImg = await img.json();
                await fetch('/add-ajax', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        judul: document.getElementById('j').value, penulis: document.getElementById('p').value,
                        harga: document.getElementById('h').value, genre: document.getElementById('g').value,
                        gambar: resImg.data.url
                    })
                });
                window.location.reload();
            } catch (err) { alert('Gagal!'); document.getElementById('ld').style.display='none'; }
        };
    </script></body></html>\`);
});

app.post('/add-ajax', async (req, res) => { if(req.session.admin) { await new Buku(req.body).save(); res.sendStatus(200); } });
app.get('/del/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); } });

module.exports = app;

