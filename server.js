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

// --- SECURITY MIDDLEWARE ---
app.use(express.urlencoded({ extended: false, limit: '500kb' }));
app.use(express.json({ limit: '500kb' }));
app.use(cookieSession({ 
    name: '__jestri_secure_session',
    keys: ['PROTECT-KEY-99'], 
    maxAge: 12 * 60 * 60 * 1000,
    httpOnly: true, secure: true, sameSite: 'strict'
}));

// --- API KATALOG (MODE PEMBELI) ---
app.get('/api/buku', async (req, res) => {
    try {
        let { genre, search } = req.query;
        let query = {};
        const clean = (s) => typeof s === 'string' ? s.replace(/[\\$\\(\\)\\{\\}\\[\\]]/g, '') : '';
        if (search) query.judul = { $regex: clean(search), $options: 'i' };
        if (genre && genre !== 'Semua') query.genre = clean(genre);
        
        const data = await Buku.find(query).sort({_id:-1}).limit(50).lean();
        if (!data.length) return res.send('<div style="grid-column:1/3;text-align:center;padding:50px;opacity:0.5">Buku tidak tersedia</div>');

        res.send(data.map(b => {
            const waMsg = encodeURIComponent(`🛒 *ORDER E-BOOK JESTRI*\n\n📖 *JUDUL:* ${b.judul}\n💰 *HARGA:* Rp ${b.harga.toLocaleString('id-ID')}\n\nMohon info pembayarannya.`);
            return `
            <div class="card-pembeli">
                <div class="img-box"><img src="${b.gambar}" loading="lazy"></div>
                <div class="info-box">
                    <span class="genre">${b.genre}</span>
                    <h3>${b.judul}</h3>
                    <div class="price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                    <button class="btn-buy" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">BELI SEKARANG</button>
                </div>
            </div>`;
        }).join(''));
    } catch (e) { res.sendStatus(403); }
});

// --- TAMPILAN PEMBELI (ORIGINAL STYLE) ---
app.get('/', async (req, res) => {
    const genres = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];
    const initial = await Buku.find().sort({_id:-1}).limit(12).lean();
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>JESTRI STORE</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; overflow-x: hidden; }
        
        /* NAVBAR */
        .header { position: sticky; top: 0; background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 100; border-bottom: 1px solid #f1f1f1; }
        .logo { font-weight: 800; font-size: 1.1rem; letter-spacing: -0.5px; }

        /* GRID PEMBELI */
        .container { max-width: 800px; margin: auto; padding: 15px; }
        .search-bar { width: 100%; padding: 16px; border-radius: 15px; border: 1px solid #eee; background: #f9f9f9; margin-bottom: 20px; font-size: 1rem; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* CARD PEMBELI (ORIGINAL REVIVED) */
        .card-pembeli { background: #fff; border-radius: 15px; overflow: hidden; border: 1px solid #eee; }
        .img-box { width: 100%; aspect-ratio: 2/3; background: #f9f9f9; }
        .img-box img { width: 100%; height: 100%; object-fit: cover; }
        .info-box { padding: 10px; }
        .genre { font-size: 0.6rem; color: #2e86de; font-weight: 800; text-transform: uppercase; }
        .info-box h3 { font-size: 0.8rem; margin: 5px 0; font-weight: 800; height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3; }
        .price { color: #2ed573; font-weight: 800; font-size: 0.9rem; margin-bottom: 10px; }
        .btn-buy { width: 100%; padding: 8px; background: #000; color: #fff; border: none; border-radius: 8px; font-weight: 800; font-size: 0.65rem; cursor: pointer; }

        .social-float { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 99; }
        .s-btn { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    </style>
    </head><body>
    <div class="header">
        <b class="logo">JESTRI</b>
        <a href="/login" style="color:#000; font-size:1.2rem"><i class="fa-solid fa-user-lock"></i></a>
    </div>
    <div class="container">
        <input type="text" class="search-bar" oninput="cari(this.value)" placeholder="Cari buku...">
        <div class="grid" id="gt">
            ${initial.map(b => {
                const waMsg = encodeURIComponent(`🛒 *ORDER E-BOOK JESTRI*\n\n📖 *JUDUL:* ${b.judul}\n💰 *HARGA:* Rp ${b.harga.toLocaleString('id-ID')}`);
                return `<div class="card-pembeli">
                    <div class="img-box"><img src="${b.gambar}"></div>
                    <div class="info-box">
                        <span class="genre">${b.genre}</span>
                        <h3>${b.judul}</h3>
                        <div class="price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                        <button class="btn-buy" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">BELI SEKARANG</button>
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>
    <div class="social-float">
        <a href="https://wa.me/6285189415489" class="s-btn" style="background:#25d366"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="s-btn" style="background:#e4405f"><i class="fa-brands fa-instagram"></i></a>
    </div>
    <script>
        let t; function cari(v){ clearTimeout(t); t = setTimeout(async () => {
            const res = await fetch('/api/buku?search='+encodeURIComponent(v));
            document.getElementById('gt').innerHTML = await res.text();
        }, 300); }
    </script></body></html>`);
});

// --- ADMIN LOGIN (SEIMBANG & CENTERED) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { margin: 0; padding: 0; font-family: sans-serif; height: 100vh; display: grid; place-items: center; background: #0f172a; color: #fff; }
        .login-card { width: 90%; max-width: 350px; padding: 40px 30px; background: rgba(255,255,255,0.05); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); border-radius: 25px; text-align: center; }
        .icon { font-size: 3rem; color: #3b82f6; margin-bottom: 20px; }
        input { width: 100%; padding: 15px; margin: 15px 0; border-radius: 12px; border: none; background: rgba(255,255,255,0.1); color: #fff; text-align: center; box-sizing: border-box; font-size: 1.1rem; }
        button { width: 100%; padding: 15px; border-radius: 12px; border: none; background: #3b82f6; color: #fff; font-weight: 800; cursor: pointer; transition: 0.3s; }
        button:hover { background: #2563eb; }
    </style>
    </head><body>
    <div class="login-card">
        <div class="icon"><i class="fa-solid fa-fingerprint"></i></div>
        <h2 style="margin:0 0 10px">Secure Access</h2>
        <form action="/login" method="POST">
            <input type="password" name="pw" placeholder="Kunci Akses" required autofocus>
            <button type="submit">VERIFIKASI</button>
        </form>
        <a href="/" style="display:block; margin-top:20px; color:rgba(255,255,255,0.4); text-decoration:none; font-size:0.8rem">Kembali</a>
    </div>
    </body></html>`);
});

app.post('/login', (req, res) => {
    if (req.body.pw === 'JESTRI0301209') {
        req.session.admin = true;
        res.redirect('/admin');
    } else {
        res.status(401).send("<script>alert('Salah!');window.location.href='/login';</script>");
    }
});

// --- ADMIN DASHBOARD (CLEAN & BALANCED) ---
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<body style="font-family:sans-serif; background:#f4f7f6; padding:20px; display:flex; justify-content:center;">
        <div style="width:100%; max-width:500px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0">Admin Control</h3>
                <a href="/logout" style="color:red; font-weight:800; text-decoration:none">LOGOUT</a>
            </div>
            <div style="background:#fff; padding:20px; border-radius:20px; box-shadow:0 5px 15px rgba(0,0,0,0.05);">
                <form id="fAdd">
                    <input id="j" placeholder="Judul" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid #ddd;" required>
                    <input id="p" placeholder="Penulis" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid #ddd;" required>
                    <input id="h" placeholder="Harga" style="width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid #ddd;" required>
                    <input type="file" id="fi" style="margin-bottom:15px;" required>
                    <select id="g" style="width:100%; padding:12px; margin-bottom:15px; border-radius:10px; border:1px solid #ddd;">
                        <option>Fiksi</option><option>Edukasi</option><option>Teknologi</option>
                    </select>
                    <button style="width:100%; padding:15px; background:#000; color:#fff; border:none; border-radius:10px; font-weight:800; cursor:pointer;">POSTING BUKU</button>
                </form>
            </div>
            <div style="margin-top:20px;">
                ${b.map(x => `<div style="background:#fff; padding:15px; border-radius:12px; margin-bottom:8px; display:flex; justify-content:space-between; border:1px solid #eee;">
                    <span style="font-size:0.9rem">${x.judul}</span>
                    <a href="/del/${x._id}" style="color:red; font-weight:800; text-decoration:none">X</a>
                </div>`).join('')}
            </div>
        </div>
        <script>
            document.getElementById('fAdd').onsubmit = async (e) => {
                e.preventDefault();
                const fd = new FormData();
                fd.append('image', document.getElementById('fi').files[0]);
                const iR = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {method:'POST', body:fd});
                const iD = await iR.json();
                await fetch('/add-ajax', {
                    method:'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({
                        judul: document.getElementById('j').value,
                        penulis: document.getElementById('p').value,
                        harga: Number(document.getElementById('h').value.replace(/\\./g, '')),
                        genre: document.getElementById('g').value,
                        gambar: iD.data.url
                    })
                });
                location.reload();
            };
        </script>
    </body>`);
});

app.get('/logout', (req, res) => { req.session = null; res.redirect('/login'); });
app.post('/add-ajax', async (req, res) => { if(req.session.admin) { await new Buku(req.body).save(); res.sendStatus(200); } });
app.get('/del/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); } });

module.exports = app;

