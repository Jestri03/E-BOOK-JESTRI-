const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONNECTION ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000,
}).catch(() => console.log("Shield Active"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

// --- SECURITY ---
app.use(express.urlencoded({ extended: false, limit: '200kb' }));
app.use(express.json({ limit: '200kb' }));
app.use(cookieSession({ 
    name: '__jestri_secure',
    keys: ['CORE-JESTRI-99'], 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true, secure: true, sameSite: 'strict'
}));

// --- API KATALOG (MODE PEMBELI - TIDAK BERUBAH) ---
app.get('/api/buku', async (req, res) => {
    try {
        let { genre, search } = req.query;
        let query = {};
        const clean = (s) => typeof s === 'string' ? s.replace(/[\\$\\(\\)\\{\\}\\[\\]]/g, '') : '';
        if (search) query.judul = { $regex: clean(search), $options: 'i' };
        if (genre && genre !== 'Semua') query.genre = clean(genre);
        
        const data = await Buku.find(query).sort({_id:-1}).limit(40).lean().select('-__v');
        if (!data.length) {
            const msg = genre && genre !== 'Semua' ? `Buku ${genre} belum ada` : 'Buku tidak ditemukan';
            return res.send(`<div style="grid-column:1/3;text-align:center;padding:80px 20px;opacity:0.5;font-weight:700;">${msg}</div>`);
        }
        res.send(data.map(b => {
            const waMsg = encodeURIComponent(`🛒 *ORDER E-BOOK JESTRI*\n\n📖 *JUDUL:* ${b.judul}\n💰 *HARGA:* Rp ${b.harga.toLocaleString('id-ID')}`);
            return `<div class="card-p animate-in"><div class="img-p"><img src="${b.gambar}" loading="lazy"></div><div class="info-p"><span class="tag-p">${b.genre}</span><h3>${b.judul}</h3><div class="price-p">Rp ${b.harga.toLocaleString('id-ID')}</div><button class="buy-p" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">BELI SEKARANG</button></div></div>`;
        }).join(''));
    } catch (e) { res.sendStatus(500); }
});

// --- FRONTEND PEMBELI (TETAP SEMPURNA) ---
app.get('/', async (req, res) => {
    const genres = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];
    const initial = await Buku.find().sort({_id:-1}).limit(12).lean();
    res.send(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><title>E-BOOK JESTRI</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}body{font-family:'Plus Jakarta Sans',sans-serif;margin:0;background:#fff;overflow-x:hidden;}.nav{position:sticky;top:0;background:rgba(255,255,255,0.9);backdrop-filter:blur(10px);padding:15px 20px;display:flex;justify-content:space-between;align-items:center;z-index:100;border-bottom:1px solid #f1f1f1;}.nav b{font-size:1.1rem;font-weight:800;letter-spacing:-0.5px;}.sidebar{position:fixed;top:0;left:-110%;width:280px;height:100%;background:#fff;z-index:200;transition:0.4s cubic-bezier(0.4,0,0.2,1);padding:30px 20px;box-shadow:20px 0 50px rgba(0,0,0,0.1);}.sidebar.active{left:0;}.overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.2);z-index:150;display:none;backdrop-filter:blur(4px);}.overlay.active{display:block;}.g-item{display:block;width:100%;padding:14px;margin-bottom:6px;border-radius:12px;border:none;background:none;text-align:left;font-weight:700;cursor:pointer;color:#555;}.g-item.active{background:#000;color:#fff;}.container{max-width:800px;margin:auto;padding:15px;}.search-in{width:100%;padding:16px;border-radius:15px;border:1px solid #eee;background:#f8f8f8;margin-bottom:20px;font-size:1rem;outline:none;}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;min-height:200px;}.card-p{background:#fff;border-radius:15px;overflow:hidden;border:1px solid #f1f1f1;}.animate-in{animation:fadeIn 0.4s ease-out forwards;}@keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}.img-p{width:100%;aspect-ratio:2/3;background:#f9f9f9;}.img-p img{width:100%;height:100%;object-fit:cover;}.info-p{padding:10px;}.tag-p{font-size:0.6rem;font-weight:800;color:#3498db;text-transform:uppercase;}.info-p h3{font-size:0.8rem;margin:4px 0;font-weight:800;height:2.6em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.3;}.price-p{font-weight:800;color:#2ecc71;margin-bottom:10px;font-size:0.9rem;}.buy-p{width:100%;padding:10px;border-radius:8px;border:none;background:#111;color:#fff;font-weight:800;font-size:0.65rem;cursor:pointer;}#loader{display:none;text-align:center;padding:40px;}.spinner{width:30px;height:30px;border:4px solid #f3f3f3;border-top:4px solid #000;border-radius:50%;animation:spin 0.8s linear infinite;margin:auto;}@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}.social-fixed{position:fixed;bottom:20px;right:20px;display:flex;flex-direction:column;gap:10px;z-index:100;}.s-link{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.3rem;box-shadow:0 5px 15px rgba(0,0,0,0.1);text-decoration:none;}.donate-btn{background:#2ed573;color:#fff;padding:8px 16px;border-radius:50px;font-weight:800;font-size:0.7rem;text-decoration:none;}</style></head><body><div class="overlay" id="ov" onclick="tog()"></div><div class="sidebar" id="sb"><h2 style="font-weight:800;margin-bottom:30px;">MENU</h2><button class="g-item active" onclick="load('Semua', this)">Semua Koleksi</button>${genres.map(g => `<button class="g-item" onclick="load('${g}', this)">${g}</button>`).join('')}</div><div class="nav"><i class="fa-solid fa-bars-staggered" onclick="tog()" style="cursor:pointer;font-size:1.2rem;"></i><b>E-BOOK JESTRI</b><a href="https://link.dana.id/qr/39bpg786" class="donate-btn">DONATE</a></div><div class="container"><input type="text" class="search-in" oninput="cari(this.value)" placeholder="Cari judul buku..."><div id="loader"><div class="spinner"></div></div><div class="grid" id="gt">${initial.map(b => `<div class="card-p animate-in"><div class="img-p"><img src="${b.gambar}"></div><div class="info-p"><span class="tag-p">${b.genre}</span><h3>${b.judul}</h3><div class="price-p">Rp ${b.harga.toLocaleString('id-ID')}</div><button class="buy-p">BELI SEKARANG</button></div></div>`).join('')}</div></div><div class="social-fixed"><a href="https://wa.me/6285189415489" class="s-link" style="background:#25d366"><i class="fa-brands fa-whatsapp"></i></a><a href="https://www.instagram.com/jesssstri" class="s-link" style="background:#e4405f"><i class="fa-brands fa-instagram"></i></a><a href="https://t.me/+62895327806441" class="s-link" style="background:#0088cc"><i class="fa-brands fa-telegram"></i></a></div><script>function tog(){document.getElementById('sb').classList.toggle('active');document.getElementById('ov').classList.toggle('active');}async function load(g, el){const grid=document.getElementById('gt');const loader=document.getElementById('loader');document.querySelectorAll('.g-item').forEach(b=>b.classList.remove('active'));el.classList.add('active');if(window.innerWidth<768)tog();grid.style.opacity='0.3';loader.style.display='block';try{const res=await fetch('/api/buku?genre='+encodeURIComponent(g));grid.innerHTML=await res.text();}finally{grid.style.opacity='1';loader.style.display='none';}}let t;function cari(v){clearTimeout(t);t=setTimeout(async()=>{const grid=document.getElementById('gt');grid.style.opacity='0.3';const res=await fetch('/api/buku?search='+encodeURIComponent(v));grid.innerHTML=await res.text();grid.style.opacity='1';},300);}</script></body></html>`);
});

// --- LOGIN (BALANCED) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Verify Access</title><style>body{margin:0;background:#0f172a;height:100vh;display:grid;place-items:center;font-family:sans-serif;color:#fff;}.box{width:90%;max-width:320px;padding:40px;background:rgba(255,255,255,0.05);border-radius:25px;border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(10px);text-align:center;}input{width:100%;padding:15px;margin:20px 0;border-radius:12px;border:none;background:rgba(255,255,255,0.1);color:#fff;text-align:center;box-sizing:border-box;}button{width:100%;padding:15px;border-radius:12px;border:none;background:#3b82f6;color:#fff;font-weight:800;cursor:pointer;}</style></head><body><div class="box"><h2>Admin Entry</h2><form action="/login" method="POST"><input type="password" name="pw" placeholder="Kunci Akses" required autofocus><button>MASUK</button></form></div></body></html>`);
});

app.post('/login', (req, res) => {
    if (req.body.pw === 'JESTRI0301209') { req.session.admin = true; res.redirect('/admin'); }
    else res.status(401).send("<script>alert('Gagal!');window.location.href='/login';</script>");
});

// --- ADMIN DASHBOARD (OPTIMIZED TOTAL) ---
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Dashboard Admin</title><style>body{font-family:sans-serif;background:#f0f2f5;margin:0;padding:20px;display:flex;justify-content:center;} .wrap{width:100%;max-width:600px;} .head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;} .card{background:#fff;padding:25px;border-radius:20px;box-shadow:0 10px 25px rgba(0,0,0,0.05);border:1px solid #eef0f2;margin-bottom:20px;} input, select{width:100%;padding:14px;margin-bottom:12px;border-radius:12px;border:1px solid #ddd;font-size:1rem;box-sizing:border-box;} button.post{width:100%;padding:16px;background:#000;color:#fff;border:none;border-radius:12px;font-weight:800;cursor:pointer;transition:0.3s;} button.post:disabled{background:#ccc;} .item{background:#fff;padding:15px;border-radius:15px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;border:1px solid #eee;} .del{color:#ff4757;text-decoration:none;font-weight:bold;padding:8px 12px;background:#fff2f2;border-radius:8px;}</style></head><body>
    <div class="wrap">
        <div class="head"><h3>ADMIN CONSOLE <span style="background:#000;color:#fff;padding:2px 8px;border-radius:5px;font-size:0.7rem;">${b.length} BUKU</span></h3><a href="/logout" style="color:red;font-weight:bold;text-decoration:none;">LOGOUT</a></div>
        <div class="card">
            <form id="f">
                <input id="j" placeholder="Judul Buku" required>
                <input id="p" placeholder="Nama Penulis" required>
                <input id="h" type="number" placeholder="Harga (Contoh: 50000)" required>
                <select id="g"><option>Fiksi</option><option>Edukasi</option><option>Teknologi</option><option>Bisnis</option><option>Misteri</option><option>Sejarah</option></select>
                <label style="display:block;margin-bottom:10px;font-size:0.8rem;color:#666;">Pilih Gambar Sampul:</label>
                <input type="file" id="fi" accept="image/*" required>
                <button type="submit" id="btn" class="post">POSTING SEKARANG</button>
            </form>
        </div>
        <div id="list">${b.map(x => `<div class="item"><div><b style="font-size:0.9rem;">${x.judul}</b><br><small style="color:#888;">${x.genre}</small></div><a href="#" onclick="del('${x._id}')" class="del">HAPUS</a></div>`).join('')}</div>
    </div>
    <script>
        async function del(id){ if(confirm('Hapus buku ini secara permanen?')){ window.location.href='/del/'+id; } }
        document.getElementById('f').onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn');
            btn.disabled = true; btn.innerText = 'SEDANG UPLOAD...';
            const fd = new FormData(); fd.append('image', document.getElementById('fi').files[0]);
            try {
                const iR = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {method:'POST', body:fd});
                const iD = await iR.json();
                await fetch('/add-ajax', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ judul: document.getElementById('j').value, penulis: document.getElementById('p').value, harga: Number(document.getElementById('h').value), genre: document.getElementById('g').value, gambar: iD.data.url }) });
                location.reload();
            } catch(e) { alert('Terjadi kesalahan!'); btn.disabled = false; btn.innerText = 'POSTING SEKARANG'; }
        };
    </script></body></html>`);
});

app.get('/logout', (req, res) => { req.session = null; res.redirect('/login'); });
app.post('/add-ajax', async (req, res) => { if(req.session.admin) { await new Buku(req.body).save(); res.sendStatus(200); } });
app.get('/del/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); } });

module.exports = app;

