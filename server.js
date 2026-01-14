const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 4000,
}).catch(() => console.log("Security Active"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

// --- MIDDLEWARE ---
app.use(express.urlencoded({ extended: false, limit: '200kb' }));
app.use(express.json({ limit: '200kb' }));
app.use(cookieSession({ 
    name: '__jestri_auth_secure',
    keys: ['CORE-JESTRI-99122-PRO'], 
    maxAge: 4 * 60 * 60 * 1000,
    httpOnly: true, secure: true, sameSite: 'strict'
}));

// --- API KATALOG ---
app.get('/api/buku', async (req, res) => {
    try {
        let { genre, search } = req.query;
        let query = {};
        const clean = (s) => typeof s === 'string' ? s.replace(/[\\$\\(\\)\\{\\}\\[\\]]/g, '') : '';
        if (search) query.judul = { $regex: clean(search), $options: 'i' };
        if (genre && genre !== 'Semua') query.genre = clean(genre);
        const data = await Buku.find(query).sort({_id:-1}).limit(40).lean();
        res.send(data.map(b => {
            const waMsg = encodeURIComponent(`🛒 ORDER JESTRI: ${b.judul}`);
            return `<div class="card"><div class="img-box"><img src="${b.gambar}"></div><div class="card-info"><span class="tag">${b.genre}</span><h3>${b.judul}</h3><div class="price">Rp ${b.harga.toLocaleString('id-ID')}</div><button class="buy-btn" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">BELI</button></div></div>`;
        }).join(''));
    } catch (e) { res.sendStatus(403); }
});

// --- FRONTEND USER ---
app.get('/', async (req, res) => {
    const genres = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];
    const initial = await Buku.find().sort({_id:-1}).limit(12).lean();
    res.send(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>JESTRI STORE</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');body{font-family:'Plus Jakarta Sans',sans-serif;margin:0;background:#fff;}.nav{position:sticky;top:0;background:rgba(255,255,255,0.8);backdrop-filter:blur(10px);padding:15px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;z-index:100;}.container{padding:15px;max-width:800px;margin:auto;}.grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;}.card{border:1px solid #eee;border-radius:15px;overflow:hidden;}.img-box img{width:100%;aspect-ratio:2/3;object-fit:cover;}.card-info{padding:10px;}.buy-btn{width:100%;padding:10px;background:#000;color:#fff;border:none;border-radius:8px;font-weight:800;cursor:pointer;}</style></head><body><div class="nav"><b style="font-size:1.2rem;letter-spacing:-1px">JESTRI</b><a href="/login" style="text-decoration:none;color:#000;font-size:1.3rem"><i class="fa-solid fa-user-shield"></i></a></div><div class="container"><div class="grid">${initial.map(b => `<div class="card"><div class="img-box"><img src="${b.gambar}"></div><div class="card-info"><h3>${b.judul}</h3><div class="price">Rp ${b.harga.toLocaleString('id-ID')}</div><button class="buy-btn">BELI</button></div></div>`).join('')}</div></div></body></html>`);
});

// --- MODERN & PERFECTLY BALANCED LOGIN ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Login | JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        
        body { 
            margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; 
            display: grid; place-items: center; /* Kunci Keseimbangan */
            min-height: 100vh; 
            background: radial-gradient(circle at top left, #1e293b, #0f172a); 
            overflow: hidden; color: #fff;
        }

        /* Background Animasi */
        body::before {
            content: ""; position: absolute; width: 300px; height: 300px;
            background: #3b82f6; filter: blur(120px); border-radius: 50%;
            top: 10%; right: 10%; opacity: 0.2; z-index: -1;
        }

        .login-card {
            width: 90%; max-width: 380px; padding: 40px 30px;
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 35px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            text-align: center; box-sizing: border-box;
            animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .icon-shield {
            width: 75px; height: 75px; background: linear-gradient(135deg, #3b82f6, #2563eb);
            border-radius: 22px; display: grid; place-items: center;
            margin: 0 auto 25px; font-size: 2.2rem;
            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
        }

        h1 { font-size: 1.6rem; font-weight: 800; margin: 0 0 10px; letter-spacing: -0.5px; }
        p { font-size: 0.85rem; opacity: 0.5; margin-bottom: 35px; line-height: 1.5; }

        .input-box { position: relative; margin-bottom: 25px; }
        .input-box i { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); }
        
        input {
            width: 100%; padding: 16px 15px 16px 50px;
            background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 18px; color: #fff; font-size: 1rem;
            box-sizing: border-box; transition: 0.3s;
        }

        input:focus {
            background: rgba(255, 255, 255, 0.08); border-color: #3b82f6;
            outline: none; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }

        .btn-verify {
            width: 100%; padding: 18px; background: #3b82f6; border: none;
            border-radius: 18px; color: #fff; font-weight: 800; font-size: 1rem;
            cursor: pointer; transition: 0.3s; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2);
        }

        .btn-verify:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 15px 25px rgba(59, 130, 246, 0.3); }
        .btn-verify:active { transform: translateY(0); }

        .footer-text { display: block; margin-top: 30px; font-size: 0.75rem; color: rgba(255,255,255,0.3); text-decoration: none; }
    </style>
    </head><body>
        <div class="login-card">
            <div class="icon-shield"><i class="fa-solid fa-user-lock"></i></div>
            <h1>Admin Entry</h1>
            <p>Masukkan kunci verifikasi untuk mengakses panel kontrol utama.</p>
            <form action="/login" method="POST">
                <div class="input-box">
                    <i class="fa-solid fa-key"></i>
                    <input type="password" name="pw" placeholder="Kunci Akses" required autofocus>
                </div>
                <button type="submit" class="btn-verify">VERIFIKASI SISTEM</button>
            </form>
            <a href="/" class="footer-text"><i class="fa-solid fa-arrow-left"></i> Kembali ke Katalog</a>
        </div>
    </body></html>`);
});

// --- AUTH LOGIC ---
app.post('/login', (req, res) => {
    const { pw } = req.body;
    if (pw === 'JESTRI0301209') {
        req.session.admin = true;
        res.redirect('/admin');
    } else {
        res.status(401).send("<script>alert('Akses Ditolak!');window.location.href='/login';</script>");
    }
});

// --- ADMIN DASHBOARD ---
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<body style="font-family:sans-serif;background:#f4f7f6;padding:20px;display:flex;justify-content:center;">
        <div style="width:100%;max-width:500px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                <h2 style="margin:0">Admin Panel</h2>
                <a href="/logout" style="color:red;font-weight:bold;text-decoration:none">LOGOUT</a>
            </div>
            <div style="background:#fff;padding:20px;border-radius:20px;box-shadow:0 10px 20px rgba(0,0,0,0.05);">
                <form id="fAdd">
                    <input id="j" placeholder="Judul" style="width:100%;padding:12px;margin-bottom:10px;border-radius:10px;border:1px solid #ddd;" required>
                    <input id="p" placeholder="Penulis" style="width:100%;padding:12px;margin-bottom:10px;border-radius:10px;border:1px solid #ddd;" required>
                    <input id="h" placeholder="Harga" style="width:100%;padding:12px;margin-bottom:10px;border-radius:10px;border:1px solid #ddd;" required>
                    <input type="file" id="fi" style="margin-bottom:15px;" required>
                    <select id="g" style="width:100%;padding:12px;margin-bottom:15px;border-radius:10px;border:1px solid #ddd;">
                        <option>Fiksi</option><option>Edukasi</option><option>Teknologi</option>
                    </select>
                    <button style="width:100%;padding:15px;background:#000;color:#fff;border:none;border-radius:10px;font-weight:bold;cursor:pointer;">TAMBAH BUKU</button>
                </form>
            </div>
            <div style="margin-top:20px;">
                ${b.map(x => `<div style="background:#fff;padding:15px;border-radius:15px;margin-bottom:10px;display:flex;justify-content:space-between;border:1px solid #eee;">
                    <span>${x.judul}</span><a href="/del/${x._id}" style="color:red;font-weight:bold;text-decoration:none">Hapus</a>
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

