const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).catch(err => console.log("DB Offline"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'jestri_ultra_safe', keys: ['SECURE_99'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API DATA ---
app.get('/api/buku-json', async (req, res) => {
    try {
        const data = await Buku.find().sort({_id:-1}).lean();
        res.json(data);
    } catch (e) { res.status(500).json([]); }
});

// --- HALAMAN UTAMA PEMBELI ---
app.get('/', async (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; overflow-x: hidden; }
        .header { position: sticky; top: 0; background: rgba(255,255,255,0.9); backdrop-filter: blur(15px); z-index: 100; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0; }
        .sidebar { position: fixed; top: 0; left: -100%; width: 280px; height: 100%; background: #fff; z-index: 200; transition: 0.4s; padding: 40px 25px; box-shadow: 20px 0 60px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 150; display: none; }
        .overlay.active { display: block; }
        .label-genre { font-size: 0.7rem; color: #ccc; margin: 25px 0 10px 5px; font-weight: 800; display: block; }
        .g-item { display: block; width: 100%; padding: 14px; margin-bottom: 8px; border-radius: 12px; border: none; background: #f8f8f8; text-align: left; font-weight: 700; cursor: pointer; }
        .g-item.active { background: #000; color: #fff; }
        .search-container { padding: 15px 20px; max-width: 800px; margin: auto; }
        .search-bar { width: 100%; padding: 15px; border-radius: 12px; border: 1px solid #eee; background: #f9f9f9; font-size: 1rem; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 0 15px 100px; max-width: 800px; margin: auto; }
        .card { background: #fff; border-radius: 15px; border: 1px solid #f0f0f0; overflow: hidden; }
        .img-box { width: 100%; aspect-ratio: 3/4; background: #eee; }
        .img-box img { width: 100%; height: 100%; object-fit: cover; }
        .info { padding: 10px; }
        .price { font-weight: 800; color: #2ecc71; font-size: 0.9rem; }
        .btn-buy { width: 100%; margin-top: 8px; padding: 10px; border-radius: 10px; border: none; background: #000; color: #fff; font-weight: 800; font-size: 0.7rem; }
        .social-float { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 110; }
        .s-link { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.4rem; text-decoration: none; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
    </style></head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h2 style="font-weight:800;">MENU</h2>
        <button class="g-item active" onclick="setG('Semua', this)">Semua Koleksi</button>
        <span class="label-genre">(GENRE)</span>
        ${LIST_GENRE.map(g => `<button class="g-item" onclick="setG('${g}', this)">${g}</button>`).join('')}
    </div>
    <div class="header"><i class="fa-solid fa-bars-staggered" onclick="tog()"></i><b>E-BOOK JESTRI</b><a href="https://link.dana.id/qr/39bpg786" style="background:#2ed573; color:#fff; padding:8px 15px; border-radius:50px; text-decoration:none; font-size:0.7rem; font-weight:800;">DONATE</a></div>
    <div class="search-container"><input type="text" class="search-bar" id="sin" placeholder="Cari buku..." oninput="render()"></div>
    <div class="grid" id="gt"></div>
    <div class="social-float">
        <a href="https://wa.me/6285189415489" class="s-link" style="background:#25d366;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="s-link" style="background:#e4405f;"><i class="fa-brands fa-instagram"></i></a>
    </div>
    <script>
        let allBuku = []; let curG = 'Semua';
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        function setG(g, el){ curG = g; document.querySelectorAll('.g-item').forEach(b=>b.classList.remove('active')); el.classList.add('active'); if(window.innerWidth < 768) tog(); render(); }
        async function load(){ const res = await fetch('/api/buku-json'); allBuku = await res.json(); render(); }
        function render(){
            const query = document.getElementById('sin').value.toLowerCase();
            const filtered = allBuku.filter(b => (curG==='Semua'||b.genre===curG) && b.judul.toLowerCase().includes(query));
            const grid = document.getElementById('gt');
            if(filtered.length === 0){ grid.innerHTML = \`<div style="grid-column:1/-1; text-align:center; padding:50px; color:#999;">(\${curG.toLowerCase()} belum ada)</div>\`; return; }
            grid.innerHTML = filtered.map(b => {
                const img = "https://wsrv.nl/?url=" + b.gambar.replace(/^https?:\\/\\//, '') + "&w=400&output=jpg";
                const wa = encodeURIComponent("🛒 *ORDER E-BOOK JESTRI*\\n\\n📖 *JUDUL:* "+b.judul+"\\n💰 *HARGA:* Rp "+b.harga.toLocaleString('id-ID'));
                return \`<div class="card">
                    <div class="img-box"><img src="\${img}" loading="lazy" referrerpolicy="no-referrer"></div>
                    <div class="info">
                        <h3 style="font-size:0.8rem; height:2.4em; overflow:hidden; margin:0 0 5px 0;">\${b.judul}</h3>
                        <div class="price">Rp \${b.harga.toLocaleString('id-ID')}</div>
                        <button class="btn-buy" onclick="location.href='https://wa.me/6285189415489?text=\${wa}'">BELI</button>
                    </div>
                </div>\`;
            }).join('');
        }
        load();
    </script></body></html>`);
});

// --- LOGIN ADMIN (CENTERED, FIXED, NO-SCROLL) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        body { margin:0; height:100vh; display:flex; align-items:center; justify-content:center; background:#0f172a; font-family:sans-serif; overflow:hidden; position:fixed; width:100%; }
        .card { background:#fff; padding:35px; border-radius:25px; width:88%; max-width:320px; text-align:center; box-shadow:0 20px 50px rgba(0,0,0,0.3); }
        input { width:100%; padding:14px; border-radius:12px; border:1px solid #ddd; margin:20px 0; box-sizing:border-box; font-size:1rem; text-align:center; outline:none; }
        button { width:100%; padding:14px; border-radius:12px; border:none; background:#3b82f6; color:#fff; font-weight:800; cursor:pointer; }
    </style></head><body>
        <div class="card">
            <h2 style="margin:0; color:#1e293b;">Admin Login</h2>
            <form action="/login" method="POST">
                <input name="pw" type="password" placeholder="Password" required autofocus>
                <button type="submit">LOGIN</button>
            </form>
        </div>
    </body></html>`);
});

app.post('/login', (req, res) => {
    if (req.body.pw === 'JESTRI0301209') req.session.admin = true;
    res.redirect('/admin');
});

// --- DASHBOARD ADMIN (SIMETRIS) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<body style="font-family:sans-serif; background:#f1f5f9; padding:20px; margin:0;">
        <div style="max-width:450px; margin:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0;">Dashboard</h3><a href="/logout" style="color:red; text-decoration:none; font-weight:700;">Logout</a>
            </div>
            <form id="fa" style="background:#fff; padding:20px; border-radius:20px; display:grid; gap:12px; box-shadow:0 4px 6px rgba(0,0,0,0.05); border:1px solid #e2e8f0;">
                <input id="j" placeholder="Judul Buku" required style="padding:12px; border-radius:10px; border:1px solid #ddd; outline:none;">
                <input id="p" placeholder="Penulis" required style="padding:12px; border-radius:10px; border:1px solid #ddd; outline:none;">
                <input id="h" type="number" placeholder="Harga" required style="padding:12px; border-radius:10px; border:1px solid #ddd; outline:none;">
                <select id="g" style="padding:12px; border-radius:10px; border:1px solid #ddd; outline:none;">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
                <input type="file" id="fi" required style="font-size:0.8rem;">
                <button id="btn" style="padding:15px; background:#000; color:#fff; border:none; border-radius:10px; font-weight:700; cursor:pointer;">UPLOAD</button>
            </form>
            <div style="margin-top:25px;">
                ${b.map(x => `<div style="background:#fff; padding:15px; border-radius:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid #e2e8f0;"><span style="font-size:0.9rem; font-weight:600;">${x.judul}</span><a href="/del/${x._id}" style="color:red; text-decoration:none; font-weight:800; font-size:0.75rem;">Hapus</a></div>`).join('')}
            </div>
        </div>
        <script>
            document.getElementById('fa').onsubmit = async (e) => {
                e.preventDefault(); const btn = document.getElementById('btn'); btn.disabled = true; btn.innerText = 'Uploading...';
                const fd = new FormData(); fd.append('image', document.getElementById('fi').files[0]);
                try {
                    const iR = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {method:'POST', body:fd});
                    const iD = await iR.json();
                    await fetch('/add-ajax', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ 
                        judul: document.getElementById('j').value, penulis: document.getElementById('p').value, harga: Number(document.getElementById('h').value), genre: document.getElementById('g').value, gambar: iD.data.url 
                    }) });
                    location.reload();
                } catch(e) { alert('Gagal!'); btn.disabled = false; btn.innerText = 'UPLOAD'; }
            };
        </script></body>`);
});

app.post('/add-ajax', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.sendStatus(200); });
app.get('/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });
app.get('/logout', (req, res) => { req.session = null; res.redirect('/admin'); });

app.listen(process.env.PORT || 3000);

