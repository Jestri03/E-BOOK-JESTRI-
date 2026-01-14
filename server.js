const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONNECTION ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 })
    .then(() => console.log("Database Connected"))
    .catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

// --- MIDDLEWARE CONFIG ---
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({
    name: 'jestri_session_secure',
    keys: ['SECRET_JESTRI_CORE_101'],
    maxAge: 24 * 60 * 60 * 1000,
    secure: true, 
    sameSite: 'lax'
}));

// --- API KATALOG (OPTIMIZED FOR IMAGES) ---
app.get('/api/buku', async (req, res) => {
    try {
        let { genre, search } = req.query;
        let query = {};
        if (search) query.judul = { $regex: search, $options: 'i' };
        if (genre && genre !== 'Semua') query.genre = genre;
        const data = await Buku.find(query).sort({_id:-1}).lean();
        
        if (!data.length) return res.send('<div style="grid-column:1/3;text-align:center;padding:80px;opacity:0.5;">Belum ada buku.</div>');

        res.send(data.map(b => `
            <div class="card-p animate-in">
                <div class="img-p">
                    <img src="${b.gambar}" crossorigin="anonymous" onerror="this.src='https://placehold.co/400x600?text=Gambar+Error'">
                </div>
                <div class="info-p">
                    <span class="tag-p">${b.genre}</span>
                    <h3>${b.judul}</h3>
                    <div class="price-p">Rp ${b.harga.toLocaleString('id-ID')}</div>
                    <button class="buy-p" onclick="location.href='https://wa.me/6285189415489?text=Halo+Admin,+saya+mau+pesan+buku+${encodeURIComponent(b.judul)}'">BELI SEKARANG</button>
                </div>
            </div>`).join(''));
    } catch (e) { res.sendStatus(500); }
});

// --- MODE PEMBELI ---
app.get('/', async (req, res) => {
    const initial = await Buku.find().sort({_id:-1}).limit(12).lean();
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; overflow-x: hidden; }
        .nav { position: sticky; top: 0; background: rgba(255,255,255,0.9); backdrop-filter:blur(10px); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 100; border-bottom: 1px solid #f1f1f1; }
        .nav b { font-size: 1.1rem; font-weight: 800; }
        .sidebar { position: fixed; top: 0; left: -110%; width: 280px; height: 100%; background: #fff; z-index: 200; transition: 0.4s; padding: 30px 20px; }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); z-index: 150; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }
        .g-item { display: block; width: 100%; padding: 14px; margin-bottom: 6px; border-radius: 12px; border: none; background: none; text-align: left; font-weight: 700; color: #555; cursor: pointer; }
        .g-item.active { background: #000; color: #fff; }
        .container { max-width: 800px; margin: auto; padding: 15px; }
        .search-in { width: 100%; padding: 16px; border-radius: 15px; border: 1px solid #eee; background: #f8f8f8; margin-bottom: 20px; outline: none; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .card-p { background: #fff; border-radius: 15px; overflow: hidden; border: 1px solid #f1f1f1; }
        .img-p { width: 100%; aspect-ratio: 2/3; background: #f9f9f9; }
        .img-p img { width: 100%; height: 100%; object-fit: cover; }
        .info-p { padding: 12px; }
        .tag-p { font-size: 0.6rem; font-weight: 800; color: #3498db; text-transform: uppercase; }
        .info-p h3 { font-size: 0.85rem; margin: 4px 0; font-weight: 800; height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3; }
        .price-p { font-weight: 800; color: #2ecc71; margin-bottom: 10px; font-size: 0.95rem; }
        .buy-p { width: 100%; padding: 10px; border-radius: 10px; border: none; background: #111; color: #fff; font-weight: 800; cursor: pointer; }
        .social-fixed { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 100; }
        .s-link { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.3rem; box-shadow: 0 5px 15px rgba(0,0,0,0.1); text-decoration: none; }
    </style></head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h2 style="font-weight:800;">MENU</h2>
        <button class="g-item active" onclick="load('Semua', this)">Semua Koleksi</button>
        ${LIST_GENRE.map(g => `<button class="g-item" onclick="load('${g}', this)">${g}</button>`).join('')}
    </div>
    <div class="nav">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="cursor:pointer; font-size:1.2rem;"></i>
        <b>E-BOOK JESTRI</b>
        <a href="https://link.dana.id/qr/39bpg786" style="background:#2ed573; color:#fff; padding:8px 16px; border-radius:50px; text-decoration:none; font-size:0.75rem; font-weight:800;">DONATE</a>
    </div>
    <div class="container">
        <input type="text" class="search-in" oninput="cari(this.value)" placeholder="Cari judul buku...">
        <div class="grid" id="gt">
            ${initial.map(b => `
                <div class="card-p">
                    <div class="img-p"><img src="${b.gambar}" crossorigin="anonymous"></div>
                    <div class="info-p">
                        <span class="tag-p">${b.genre}</span>
                        <h3>${b.judul}</h3>
                        <div class="price-p">Rp ${b.harga.toLocaleString('id-ID')}</div>
                        <button class="buy-p" onclick="location.href='https://wa.me/6285189415489?text=Halo+Admin,+saya+mau+pesan+buku+${encodeURIComponent(b.judul)}'">BELI SEKARANG</button>
                    </div>
                </div>`).join('')}
        </div>
    </div>
    <div class="social-fixed">
        <a href="https://wa.me/6285189415489" class="s-link" style="background:#25d366"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="s-link" style="background:#e4405f"><i class="fa-brands fa-instagram"></i></a>
    </div>
    <script>
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(g, el){
            const grid = document.getElementById('gt');
            document.querySelectorAll('.g-item').forEach(b => b.classList.remove('active'));
            el.classList.add('active'); if(window.innerWidth < 768) tog();
            grid.style.opacity = '0.3';
            const res = await fetch('/api/buku?genre='+encodeURIComponent(g));
            grid.innerHTML = await res.text();
            grid.style.opacity = '1';
        }
        let t; function cari(v){ clearTimeout(t); t = setTimeout(async () => {
            const grid = document.getElementById('gt'); grid.style.opacity = '0.3';
            const res = await fetch('/api/buku?search='+encodeURIComponent(v));
            grid.innerHTML = await res.text(); grid.style.opacity = '1';
        }, 300); }
    </script></body></html>`);
});

// --- ADMIN LOGIN ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Login</title><style>body{margin:0;background:#0f172a;height:100vh;display:grid;place-items:center;font-family:sans-serif;color:#fff;}.box{width:90%;max-width:320px;padding:35px;background:rgba(255,255,255,0.05);border-radius:25px;text-align:center;border:1px solid rgba(255,255,255,0.1);}input{width:100%;padding:14px;margin:15px 0;border-radius:12px;border:none;background:rgba(255,255,255,0.1);color:#fff;text-align:center;box-sizing:border-box;}button{width:100%;padding:14px;border-radius:12px;border:none;background:#3b82f6;color:#fff;font-weight:800;cursor:pointer;}</style></head><body><div class="box"><h2>Admin Entry</h2><form action="/login" method="POST"><input type="password" name="pw" placeholder="Kunci Akses" required autofocus><button>MASUK</button></form></div></body></html>`);
});

app.post('/login', (req, res) => {
    if (req.body.pw === 'JESTRI0301209') { req.session.admin = true; res.redirect('/admin'); }
    else res.send("<script>alert('Gagal!'); window.location.href='/login';</script>");
});

// --- ADMIN DASHBOARD ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:sans-serif;background:#f8f9fa;margin:0;padding:20px;}.card{background:#fff;padding:25px;border-radius:20px;box-shadow:0 4px 20px rgba(0,0,0,0.05);max-width:500px;margin:auto;}input, select{width:100%;padding:14px;margin-bottom:12px;border-radius:12px;border:1px solid #ddd;box-sizing:border-box;}button{width:100%;padding:16px;background:#000;color:#fff;border:none;border-radius:12px;font-weight:bold;cursor:pointer;}.item{background:#fff;padding:12px;border-radius:12px;margin:10px auto;display:flex;justify-content:space-between;align-items:center;max-width:500px;border:1px solid #eee;}</style></head><body>
    <div style="max-width:500px;margin:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;"><h3>Panel Admin</h3><a href="/logout" style="color:red;text-decoration:none;font-weight:bold;">Logout</a></div>
        <div class="card">
            <form id="fa">
                <input id="j" placeholder="Judul Buku" required>
                <input id="p" placeholder="Penulis" required>
                <input id="h" placeholder="Harga (Contoh: 3000)" required>
                <input type="file" id="fi" required>
                <select id="g">${LIST_GENRE.map(g => `<option>${g}</option>`).join('')}</select>
                <button type="submit" id="btn">POSTING BUKU</button>
            </form>
        </div>
        <div style="margin-top:20px;">
            ${b.map(x => `<div class="item"><span>${x.judul}</span><a href="/del/${x._id}" style="color:red;text-decoration:none;font-weight:bold;">Hapus</a></div>`).join('')}
        </div>
    </div>
    <script>
        document.getElementById('fa').onsubmit = async (e) => {
            e.preventDefault(); const btn = document.getElementById('btn'); btn.disabled = true; btn.innerText = 'Uploading...';
            const cleanPrice = document.getElementById('h').value.replace(/\\D/g, '');
            const fd = new FormData(); fd.append('image', document.getElementById('fi').files[0]);
            try {
                const iR = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {method:'POST', body:fd});
                const iD = await iR.json();
                await fetch('/add-ajax', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ 
                    judul: document.getElementById('j').value, penulis: document.getElementById('p').value, harga: Number(cleanPrice), genre: document.getElementById('g').value, gambar: iD.data.url 
                }) });
                location.reload();
            } catch(e) { alert('Gagal!'); btn.disabled = false; btn.innerText = 'POSTING BUKU'; }
        };
    </script></body></html>`);
});

app.post('/add-ajax', async (req, res) => { if(req.session.admin) { await new Buku(req.body).save(); res.sendStatus(200); } });
app.get('/del/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); } });
app.get('/logout', (req, res) => { req.session = null; res.redirect('/'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("System Ready"));

