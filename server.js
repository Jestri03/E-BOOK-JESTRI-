const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000,
}).catch(() => console.log("System Secure"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

// --- SECURITY ---
app.use(express.urlencoded({ extended: false, limit: '500kb' }));
app.use(express.json({ limit: '500kb' }));
app.use(cookieSession({ 
    name: '__jestri_session',
    keys: ['SECURE-PRO-KEY'], 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true, secure: true, sameSite: 'strict'
}));

// --- API KATALOG (KEMBALI KE SETELAN NORMAL) ---
app.get('/api/buku', async (req, res) => {
    try {
        let { search } = req.query;
        let query = {};
        if (search) query.judul = { $regex: search.replace(/[\\$\\(\\)\\{\\}\\[\\]]/g, ''), $options: 'i' };
        
        const data = await Buku.find(query).sort({_id:-1}).limit(50).lean();
        if (!data.length) return res.send('<div style="grid-column:1/3;text-align:center;padding:50px;opacity:0.5">Buku tidak ditemukan</div>');

        res.send(data.map(b => {
            const waMsg = encodeURIComponent(`🛒 *ORDER E-BOOK*\n\n📖 *JUDUL:* ${b.judul}\n💰 *HARGA:* Rp ${b.harga.toLocaleString('id-ID')}`);
            return `
            <div class="product-card">
                <div class="img-container"><img src="${b.gambar}" loading="lazy"></div>
                <div class="product-info">
                    <span class="product-genre">${b.genre}</span>
                    <h3>${b.judul}</h3>
                    <div class="product-price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                    <button class="buy-button" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">BELI SEKARANG</button>
                </div>
            </div>`;
        }).join(''));
    } catch (e) { res.sendStatus(403); }
});

// --- MODE PEMBELI (100% CLEAN & NORMAL) ---
app.get('/', async (req, res) => {
    const initial = await Buku.find().sort({_id:-1}).limit(12).lean();
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>JESTRI STORE</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; color: #111; }
        
        /* NAVBAR POLOS */
        .navbar { position: sticky; top: 0; background: #fff; padding: 18px 20px; text-align: center; border-bottom: 1px solid #f2f2f2; z-index: 100; }
        .navbar b { font-size: 1.2rem; letter-spacing: -1px; font-weight: 800; }

        .content { max-width: 800px; margin: auto; padding: 15px; }
        .search-box { width: 100%; padding: 15px 20px; border-radius: 12px; border: 1px solid #eee; background: #f9f9f9; margin-bottom: 20px; font-size: 1rem; outline: none; }
        
        /* GRID SIMETRIS */
        .product-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* CARD STYLE ORIGINAL */
        .product-card { background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #f0f0f0; }
        .img-container { width: 100%; aspect-ratio: 2/3; background: #fcfcfc; }
        .img-container img { width: 100%; height: 100%; object-fit: cover; }
        .product-info { padding: 10px; }
        .product-genre { font-size: 0.6rem; color: #3498db; font-weight: 800; text-transform: uppercase; }
        .product-info h3 { font-size: 0.8rem; margin: 4px 0; font-weight: 800; line-height: 1.3; height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .product-price { color: #2ecc71; font-weight: 800; font-size: 0.9rem; margin-bottom: 8px; }
        .buy-button { width: 100%; padding: 10px; background: #000; color: #fff; border: none; border-radius: 8px; font-weight: 800; font-size: 0.7rem; cursor: pointer; }

        .wa-float { position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px; background: #25d366; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); text-decoration: none; z-index: 99; }
    </style>
    </head><body>
    <div class="navbar"><b>JESTRI STORE</b></div>
    <div class="content">
        <input type="text" class="search-box" oninput="cari(this.value)" placeholder="Cari e-book...">
        <div class="product-grid" id="gt">
            ${initial.map(b => {
                const waMsg = encodeURIComponent(`🛒 *ORDER E-BOOK*\n\n📖 *JUDUL:* ${b.judul}\n💰 *HARGA:* Rp ${b.harga.toLocaleString('id-ID')}`);
                return `<div class="product-card">
                    <div class="img-container"><img src="${b.gambar}"></div>
                    <div class="product-info">
                        <span class="product-genre">${b.genre}</span>
                        <h3>${b.judul}</h3>
                        <div class="product-price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                        <button class="buy-button" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">BELI SEKARANG</button>
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>
    <a href="https://wa.me/6285189415489" class="wa-float">
        <svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.66 20.15 9.3 19.81 8.1 19.14L7.81 18.97L4.68 19.79L5.51 16.75L5.32 16.45C4.56 15.23 4.16 13.82 4.16 12.38C4.16 7.84 7.85 4.15 12.39 4.15L12.05 3.67Z"/></svg>
    </a>
    <script>
        let t; function cari(v){ clearTimeout(t); t = setTimeout(async () => {
            const res = await fetch('/api/buku?search='+encodeURIComponent(v));
            document.getElementById('gt').innerHTML = await res.text();
        }, 300); }
    </script></body></html>`);
});

// --- ADMIN LOGIN (CENTERED & HIDDEN) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistem Verifikasi</title>
    <style>
        body { margin: 0; background: #0f172a; height: 100vh; display: grid; place-items: center; font-family: sans-serif; color: #fff; }
        .login-box { width: 90%; max-width: 320px; text-align: center; padding: 40px; background: rgba(255,255,255,0.03); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); }
        input { width: 100%; padding: 15px; margin: 20px 0; border-radius: 10px; border: none; background: rgba(255,255,255,0.1); color: #fff; text-align: center; box-sizing: border-box; }
        button { width: 100%; padding: 15px; border-radius: 10px; border: none; background: #3b82f6; color: #fff; font-weight: bold; cursor: pointer; }
    </style>
    </head><body>
    <div class="login-box">
        <h2 style="margin:0">Identity Required</h2>
        <form action="/login" method="POST">
            <input type="password" name="pw" placeholder="••••••••" required autofocus>
            <button type="submit">UNLOCK SYSTEM</button>
        </form>
    </div>
    </body></html>`);
});

app.post('/login', (req, res) => {
    if (req.body.pw === 'JESTRI0301209') {
        req.session.admin = true;
        res.redirect('/admin');
    } else {
        res.status(401).send("<script>alert('Akses Ditolak');window.location.href='/login';</script>");
    }
});

// --- ADMIN DASHBOARD (CLEAN & BALANCED) ---
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<body style="font-family:sans-serif; background:#f4f7f6; padding:20px; display:flex; justify-content:center;">
        <div style="width:100%; max-width:500px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h3 style="margin:0">Admin Console</h3>
                <a href="/logout" style="color:red; font-weight:bold; text-decoration:none">KELUAR</a>
            </div>
            <div style="background:#fff; padding:20px; border-radius:20px; border:1px solid #eee;">
                <form id="fAdd">
                    <input id="j" placeholder="Judul Buku" style="width:100%; padding:12px; margin-bottom:10px; border-radius:8px; border:1px solid #ddd;" required>
                    <input id="p" placeholder="Penulis" style="width:100%; padding:12px; margin-bottom:10px; border-radius:8px; border:1px solid #ddd;" required>
                    <input id="h" placeholder="Harga" style="width:100%; padding:12px; margin-bottom:10px; border-radius:8px; border:1px solid #ddd;" required>
                    <input type="file" id="fi" style="margin-bottom:15px;" required>
                    <select id="g" style="width:100%; padding:12px; margin-bottom:15px; border-radius:8px; border:1px solid #ddd;">
                        <option>Fiksi</option><option>Edukasi</option><option>Teknologi</option><option>Bisnis</option><option>Misteri</option>
                    </select>
                    <button style="width:100%; padding:15px; background:#000; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">POSTING SEKARANG</button>
                </form>
            </div>
            <div style="margin-top:20px;">
                ${b.map(x => `<div style="background:#fff; padding:12px; border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; border:1px solid #eee;">
                    <span style="font-size:0.9rem">${x.judul}</span>
                    <a href="/del/${x._id}" style="color:red; font-weight:bold; text-decoration:none">Hapus</a>
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

