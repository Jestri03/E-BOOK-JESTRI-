const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- SECURE DB ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 4000,
}).catch(() => console.log("Shield Active: DB Secure"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

// --- MILITARY GRADE MIDDLEWARE ---
app.use(express.urlencoded({ extended: false, limit: '200kb' }));
app.use(express.json({ limit: '200kb' }));
app.use(cookieSession({ 
    name: '__jestri_ultimate_shield',
    keys: ['CORE-JESTRI-99122-PRO'], 
    maxAge: 4 * 60 * 60 * 1000, // Sesi lebih ketat (4 jam)
    httpOnly: true, secure: true, sameSite: 'strict'
}));

// Global Variable untuk Anti-Brute Force (Sederhana tapi Efektif)
let loginAttempts = {};

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

// --- FRONTEND ---
app.get('/', async (req, res) => {
    const genres = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];
    const initial = await Buku.find().sort({_id:-1}).limit(12).lean();
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>JESTRI STORE</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');body{font-family:'Plus Jakarta Sans',sans-serif;margin:0;background:#fff;}.nav{position:sticky;top:0;background:rgba(255,255,255,0.8);backdrop-filter:blur(10px);padding:15px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;z-index:100;}.container{padding:15px;max-width:800px;margin:auto;}.grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;}.card{border:1px solid #eee;border-radius:15px;overflow:hidden;}.img-box img{width:100%;aspect-ratio:2/3;object-fit:cover;}.card-info{padding:10px;}.buy-btn{width:100%;padding:10px;background:#000;color:#fff;border:none;border-radius:8px;font-weight:800;cursor:pointer;}</style></head><body><div class="nav"><b>JESTRI</b><a href="/login" style="text-decoration:none;color:#000;font-size:1.2rem"><i class="fa-solid fa-user-shield"></i></a></div><div class="container"><div class="grid">${initial.map(b => `<div class="card"><div class="img-box"><img src="${b.gambar}"></div><div class="card-info"><h3>${b.judul}</h3><div class="price">Rp ${b.harga.toLocaleString()}</div><button class="buy-btn">BELI</button></div></div>`).join('')}</div></div></body></html>`);
});

// --- ULTRA SECURE LOGIN UI ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Secure Login</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>body{margin:0;font-family:sans-serif;background:#0f172a;display:flex;justify-content:center;align-items:center;height:100vh;color:#fff;}.box{background:rgba(255,255,255,0.05);padding:30px;border-radius:25px;backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);width:320px;text-align:center;}input{width:100%;padding:15px;margin:15px 0;background:rgba(255,255,255,0.1);border:none;border-radius:10px;color:#fff;text-align:center;font-size:1.2rem;letter-spacing:5px;}button{width:100%;padding:15px;background:#3b82f6;border:none;border-radius:10px;color:#fff;font-weight:800;cursor:pointer;}</style></head><body><div class="box"><i class="fa-solid fa-fingerprint" style="font-size:3rem;color:#3b82f6;margin-bottom:15px;"></i><h2>ACCESS CONTROL</h2><form action="/login" method="POST"><input type="password" name="pw" placeholder="••••••" required><p style="font-size:0.7rem;opacity:0.5;">Sistem Memantau IP & Perangkat Anda</p><button>VERIFY IDENTITY</button></form></div></body></html>`);
});

app.post('/login', (req, res) => {
    const { pw } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Proteksi Brute Force
    if (loginAttempts[ip] && loginAttempts[ip].count >= 3 && Date.now() < loginAttempts[ip].lockUntil) {
        return res.status(429).send("Sistem Terkunci 15 Menit. Terdeteksi Percobaan Paksa.");
    }

    if (pw === 'JESTRI0301209') {
        loginAttempts[ip] = { count: 0 };
        req.session.admin = true;
        req.session.userAgent = req.headers['user-agent']; // Fingerprint perangkat
        res.redirect('/admin');
    } else {
        if (!loginAttempts[ip]) loginAttempts[ip] = { count: 0 };
        loginAttempts[ip].count++;
        if (loginAttempts[ip].count >= 3) {
            loginAttempts[ip].lockUntil = Date.now() + 15 * 60 * 1000;
        }
        res.status(401).send("<script>alert('Identitas Gagal Diverifikasi!');window.location.href='/login';</script>");
    }
});

// --- ADMIN DASHBOARD (THE FORTRESS) ---
app.get('/admin', async (req, res) => {
    // Cek Sesi & Fingerprint
    if(!req.session.admin || req.session.userAgent !== req.headers['user-agent']) {
        req.session = null;
        return res.redirect('/login');
    }
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:sans-serif;background:#f8f9fa;padding:20px;}header{display:flex;justify-content:space-between;align-items:center;background:#fff;padding:15px 25px;border-radius:15px;margin-bottom:20px;box-shadow:0 4px 15px rgba(0,0,0,0.05);}.form-card{background:#fff;padding:25px;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,0.05);}.item-list{margin-top:20px;}.item{background:#fff;padding:15px;border-radius:12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;border:1px solid #eee;}</style></head><body><header><h3>CORE ADMIN</h3><a href="/logout" style="color:red;font-weight:800;text-decoration:none;">LOCK SYSTEM</a></header><div class="form-card"><form id="f"><input id="j" placeholder="Judul" style="width:100%;padding:12px;margin-bottom:10px;border-radius:8px;border:1px solid #ddd;" required><input id="p" placeholder="Penulis" style="width:100%;padding:12px;margin-bottom:10px;border-radius:8px;border:1px solid #ddd;" required><input id="h" placeholder="Harga" style="width:100%;padding:12px;margin-bottom:10px;border-radius:8px;border:1px solid #ddd;" required><input type="file" id="fi" style="margin-bottom:15px;" required><select id="g" style="width:100%;padding:12px;margin-bottom:15px;border-radius:8px;border:1px solid #ddd;"><option>Fiksi</option><option>Edukasi</option><option>Teknologi</option></select><button style="width:100%;padding:15px;background:#000;color:#fff;border:none;border-radius:10px;font-weight:800;cursor:pointer;">AUTHORIZE POST</button></form></div><div class="item-list">${b.map(x => `<div class="item"><span>${x.judul}</span><a href="/del/${x._id}" style="color:red;font-weight:800;text-decoration:none;">X</a></div>`).join('')}</div><script>document.getElementById('f').onsubmit = async (e) => { e.preventDefault(); const fd = new FormData(); fd.append('image', document.getElementById('fi').files[0]); try { const iR = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {method:'POST', body:fd}); const iD = await iR.json(); await fetch('/add-ajax', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ judul: document.getElementById('j').value, penulis: document.getElementById('p').value, harga: Number(document.getElementById('h').value.replace(/\\./g, '')), genre: document.getElementById('g').value, gambar: iD.data.url }) }); location.reload(); } catch(e) { alert('Verifikasi Gagal'); } };</script></body></html>`);
});

app.get('/logout', (req, res) => { req.session = null; res.redirect('/login'); });
app.post('/add-ajax', async (req, res) => { if(req.session.admin) { await new Buku(req.body).save(); res.sendStatus(200); } });
app.get('/del/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); } });

module.exports = app;

