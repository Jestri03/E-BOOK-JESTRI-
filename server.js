const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 })
    .then(() => console.log("DB Online"))
    .catch(err => console.log("DB Offline"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

// --- OPTIMASI SESSION UNTUK VERCEL ---
app.set('trust proxy', 1); // Wajib untuk hosting seperti Vercel
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({
    name: 'jestri_auth',
    keys: ['SECRET_JESTRI_KEY_99'],
    maxAge: 24 * 60 * 60 * 1000,
    secure: true, // Karena Vercel pakai HTTPS
    sameSite: 'lax'
}));

// --- API DATA (UNTUK PEMBELI) ---
app.get('/api/buku', async (req, res) => {
    try {
        let { genre, search } = req.query;
        let query = {};
        if (search) query.judul = { $regex: search, $options: 'i' };
        if (genre && genre !== 'Semua') query.genre = genre;
        const data = await Buku.find(query).sort({_id:-1}).lean();
        if (!data.length) return res.send('<div style="grid-column:1/3;text-align:center;padding:50px;opacity:0.5">Buku belum tersedia</div>');
        res.send(data.map(b => `
            <div class="card-p">
                <div class="img-p"><img src="${b.gambar}"></div>
                <div class="info-p">
                    <span class="tag-p">${b.genre}</span>
                    <h3>${b.judul}</h3>
                    <div class="price-p">Rp ${b.harga.toLocaleString('id-ID')}</div>
                    <button class="buy-p" onclick="location.href='https://wa.me/6285189415489?text=Halo Admin, saya mau pesan buku ${b.judul}'">BELI SEKARANG</button>
                </div>
            </div>`).join(''));
    } catch (e) { res.sendStatus(500); }
});

// --- HALAMAN PEMBELI ---
app.get('/', async (req, res) => {
    const initial = await Buku.find().sort({_id:-1}).limit(12).lean();
    res.send(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; }
        .nav { position: sticky; top: 0; background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; z-index: 100; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 15px; }
        .card-p { border: 1px solid #eee; border-radius: 15px; overflow: hidden; }
        .img-p img { width: 100%; aspect-ratio: 2/3; object-fit: cover; }
        .info-p { padding: 10px; }
        .info-p h3 { font-size: 0.8rem; margin: 5px 0; height: 2.6em; overflow: hidden; }
        .price-p { color: #2ecc71; font-weight: 800; }
        .buy-p { width: 100%; padding: 8px; background: #000; color: #fff; border: none; border-radius: 8px; margin-top: 10px; font-weight: 700; cursor: pointer; }
        .social-fixed { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; }
        .s-link { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
    </style></head><body>
    <div class="nav"><b>E-BOOK JESTRI</b> <a href="https://link.dana.id/qr/39bpg786" style="background:#2ed573; color:#fff; padding:8px 15px; border-radius:50px; font-size:0.7rem; text-decoration:none; font-weight:800;">DONATE</a></div>
    <div class="grid">${initial.map(b => `<div class="card-p"><div class="img-p"><img src="${b.gambar}"></div><div class="info-p"><h3>${b.judul}</h3><div class="price-p">Rp ${b.harga.toLocaleString('id-ID')}</div><button class="buy-p">BELI SEKARANG</button></div></div>`).join('')}</div>
    <div class="social-fixed">
        <a href="https://wa.me/6285189415489" class="s-link" style="background:#25d366"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="s-link" style="background:#e4405f"><i class="fa-brands fa-instagram"></i></a>
        <a href="https://t.me/+62895327806441" class="s-link" style="background:#0088cc"><i class="fa-brands fa-telegram"></i></a>
    </div></body></html>`);
});

// --- ADMIN & LOGIN (FIXED) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{margin:0;background:#0f172a;height:100vh;display:grid;place-items:center;font-family:sans-serif;color:#fff;}.box{width:90%;max-width:320px;padding:30px;background:rgba(255,255,255,0.05);border-radius:20px;text-align:center;border:1px solid rgba(255,255,255,0.1);}input{width:100%;padding:12px;margin:15px 0;border-radius:8px;border:none;background:rgba(255,255,255,0.1);color:#fff;text-align:center;box-sizing:border-box;}button{width:100%;padding:12px;border-radius:8px;border:none;background:#3b82f6;color:#fff;font-weight:bold;cursor:pointer;}</style></head><body><div class="box"><h2>Admin Entry</h2><form action="/login" method="POST"><input type="password" name="pw" placeholder="Kunci Akses" required autofocus><button>MASUK</button></form></div></body></html>`);
});

app.post('/login', (req, res) => {
    if (req.body.pw === 'JESTRI0301209') {
        req.session.admin = true;
        res.redirect('/admin');
    } else {
        res.send("<script>alert('Akses Ditolak!'); window.location.href='/login';</script>");
    }
});

app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:sans-serif;background:#f8f9fa;margin:0;padding:15px;}.card{background:#fff;padding:20px;border-radius:15px;box-shadow:0 4px 6px rgba(0,0,0,0.05);margin-bottom:20px;}input, select{width:100%;padding:12px;margin-bottom:10px;border-radius:8px;border:1px solid #ddd;box-sizing:border-box;}button{width:100%;padding:14px;background:#000;color:#fff;border:none;border-radius:8px;font-weight:bold;cursor:pointer;}.item{background:#fff;padding:10px;border-radius:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;border:1px solid #eee;}</style></head><body>
    <div style="max-width:500px;margin:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;"><h3>Admin Panel</h3><a href="/logout" style="color:red;text-decoration:none;font-weight:bold;">Logout</a></div>
        <div class="card">
            <form id="fa">
                <input id="j" placeholder="Judul Buku" required>
                <input id="p" placeholder="Penulis" required>
                <input id="h" type="number" placeholder="Harga" required>
                <input type="file" id="fi" required>
                <select id="g"><option>Fiksi</option><option>Edukasi</option><option>Teknologi</option><option>Bisnis</option></select>
                <button type="submit" id="btn">POSTING BUKU</button>
            </form>
        </div>
        <div>${b.map(x => `<div class="item"><span>${x.judul}</span><a href="/del/${x._id}" style="color:red;text-decoration:none;">Hapus</a></div>`).join('')}</div>
    </div>
    <script>
        document.getElementById('fa').onsubmit = async (e) => {
            e.preventDefault(); const btn = document.getElementById('btn'); btn.disabled = true; btn.innerText = 'Uploading...';
            const fd = new FormData(); fd.append('image', document.getElementById('fi').files[0]);
            try {
                const iR = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {method:'POST', body:fd});
                const iD = await iR.json();
                await fetch('/add-ajax', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ judul: document.getElementById('j').value, penulis: document.getElementById('p').value, harga: Number(document.getElementById('h').value), genre: document.getElementById('g').value, gambar: iD.data.url }) });
                location.reload();
            } catch(e) { alert('Gagal Upload!'); btn.disabled = false; btn.innerText = 'POSTING BUKU'; }
        };
    </script></body></html>`);
});

app.post('/add-ajax', async (req, res) => { if(req.session.admin) { await new Buku(req.body).save(); res.sendStatus(200); } });
app.get('/del/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); } });
app.get('/logout', (req, res) => { req.session = null; res.redirect('/'); });

module.exports = app;

