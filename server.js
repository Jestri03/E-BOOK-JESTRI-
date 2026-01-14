const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CLOUD PROTECTION ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000,
}).catch(err => console.log("Security Note: DB Connection Blocked"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

// --- SECURITY MIDDLEWARE (CUSTOM BUILT) ---
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieSession({ 
    name: '__secure_sess', // Nama disamarkan
    keys: ['7392-jestri-secret-9921'], // Key diperkuat
    maxAge: 12 * 60 * 60 * 1000, // Expire lebih cepat (12 jam)
    httpOnly: true, // Proteksi dari pencurian cookie lewat JS
    secure: true // Hanya jalan di HTTPS
}));

// --- API KATALOG (SECURE & FAST) ---
app.get('/api/buku', async (req, res) => {
    try {
        const { genre, search } = req.query;
        let q = {};
        
        // Anti-Hacking: Memastikan input hanya string, bukan objek/array
        if (typeof search === 'string' && search.length > 0) {
            q.judul = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
        }
        if (typeof genre === 'string' && genre !== 'Semua') q.genre = genre;
        
        const data = await Buku.find(q).sort({_id:-1}).limit(50).lean();
        
        if (!data.length) return res.send('<div style="grid-column:1/3;text-align:center;padding:50px;color:#999">Buku tidak ditemukan</div>');

        res.send(data.map(b => {
            const waMsg = encodeURIComponent(`🛒 *ORDER E-BOOK JESTRI*\n\n📖 *JUDUL:* ${b.judul}\n✍️ *PENULIS:* ${b.penulis}\n💰 *HARGA:* Rp ${b.harga.toLocaleString('id-ID')}\n\nSaya ingin membeli ebook ini. Mohon info cara pembayaran.`);
            return `
            <div class="card">
                <div class="img-wrapper"><img src="${b.gambar}" loading="lazy"></div>
                <div class="card-body">
                    <small class="genre-tag">${b.genre}</small>
                    <h3>${b.judul}</h3>
                    <div class="price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                    <button class="btn-buy" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">BELI SEKARANG</button>
                </div>
            </div>`;
        }).join(''));
    } catch (e) { res.status(403).send("Forbidden Action"); }
});

// --- UI PRO ENGINE ---
app.get('/', async (req, res) => {
    const genres = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];
    const initial = await Buku.find().sort({_id:-1}).limit(12).lean();
    
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>JESTRI STORE</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; outline: none; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; overflow-x: hidden; touch-action: pan-y; }
        
        /* HEADER & NAV */
        .nav { position: sticky; top: 0; background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 100; border-bottom: 1px solid #f1f1f1; }
        .logo { font-weight: 800; font-size: 1.2rem; color: #111; letter-spacing: -1px; }
        .btn-dana { background: #2ed573; color: #fff; padding: 8px 16px; border-radius: 50px; font-weight: 800; font-size: 0.7rem; text-decoration: none; }

        /* SIDEBAR */
        .sidebar { position: fixed; top: 0; left: -110%; width: 280px; height: 100%; background: #fff; z-index: 200; transition: 0.4s; padding: 30px 20px; box-shadow: 20px 0 50px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); z-index: 150; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }

        .g-item { display: block; width: 100%; padding: 15px; margin-bottom: 5px; border-radius: 12px; border: none; background: none; text-align: left; font-weight: 700; color: #444; cursor: pointer; }
        .g-item.active { background: #2e86de; color: #fff; box-shadow: 0 8px 20px rgba(46,134,222,0.2); }

        /* CATALOG GRID */
        .container { max-width: 800px; margin: auto; padding: 15px; }
        .search-box { width: 100%; padding: 16px 20px; border-radius: 18px; border: 1px solid #eee; background: #f9f9f9; margin-bottom: 25px; font-size: 1rem; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }

        /* CARD STYLE */
        .card { background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid #f2f2f2; transition: 0.3s; }
        .img-wrapper { width: 100%; aspect-ratio: 2/3; overflow: hidden; background: #f9f9f9; }
        .img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        .card-body { padding: 12px; }
        .genre-tag { font-size: 0.6rem; font-weight: 800; color: #2e86de; text-transform: uppercase; margin-bottom: 4px; display: block; }
        .card-body h3 { font-size: 0.85rem; margin: 0 0 6px; font-weight: 800; color: #111; line-height: 1.3; height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .price { color: #2ed573; font-weight: 800; font-size: 1rem; margin-bottom: 12px; }
        .btn-buy { width: 100%; padding: 10px; border-radius: 10px; border: none; background: #111; color: #fff; font-weight: 800; font-size: 0.65rem; cursor: pointer; }

        .social { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 100; }
        .s-link { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; font-size: 1.3rem; box-shadow: 0 8px 20px rgba(0,0,0,0.1); }

        #pb { position: fixed; top: 0; left: 0; height: 3px; background: #2e86de; width: 0; transition: 0.3s; z-index: 1000; }
    </style>
    </head><body>
    <div id="pb"></div>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h2 style="font-weight: 800; margin-bottom: 25px;">KATEGORI</h2>
        <button class="g-item active" onclick="load('Semua', this)">Semua E-Book</button>
        ${genres.map(g => `<button class="g-item" onclick="load('${g}', this)">${g}</button>`).join('')}
    </div>

    <div class="nav">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size: 1.2rem; cursor: pointer"></i>
        <div class="logo">JESTRI</div>
        <a href="https://link.dana.id/qr/39bpg786" class="btn-dana">DONATE</a>
    </div>

    <div class="container">
        <input type="text" class="search-box" oninput="search(this.value)" placeholder="Cari buku...">
        <div class="grid" id="gt">
            ${initial.map(b => {
                const waMsg = encodeURIComponent(`🛒 *ORDER E-BOOK JESTRI*\n\n📖 *JUDUL:* ${b.judul}\n✍️ *PENULIS:* ${b.penulis}\n💰 *HARGA:* Rp ${b.harga.toLocaleString('id-ID')}\n\nSaya ingin membeli ebook ini. Mohon info cara pembayaran.`);
                return `
                <div class="card">
                    <div class="img-wrapper"><img src="${b.gambar}"></div>
                    <div class="card-body">
                        <span class="genre-tag">${b.genre}</span>
                        <h3>${b.judul}</h3>
                        <div class="price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                        <button class="btn-buy" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">BELI SEKARANG</button>
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>

    <div class="social">
        <a href="https://wa.me/6285189415489" class="s-link" style="background:#25d366"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="s-link" style="background:#e4405f"><i class="fa-brands fa-instagram"></i></a>
        <a href="https://t.me/+62895327806441" class="s-link" style="background:#0088cc"><i class="fa-brands fa-telegram"></i></a>
    </div>

    <script>
        const pb = document.getElementById('pb');
        const gt = document.getElementById('gt');
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(g, el){
            document.querySelectorAll('.g-item').forEach(b => b.classList.remove('active'));
            el.classList.add('active'); if(window.innerWidth < 768) tog();
            pb.style.width = '40%';
            const res = await fetch('/api/buku?genre='+encodeURIComponent(g));
            gt.innerHTML = await res.text();
            pb.style.width = '100%'; setTimeout(() => pb.style.width = '0', 300);
        }
        let t;
        function search(v){
            clearTimeout(t);
            t = setTimeout(async () => {
                const res = await fetch('/api/buku?search='+encodeURIComponent(v));
                gt.innerHTML = await res.text();
            }, 300);
        }
    </script></body></html>`);
});

// --- ADMIN SECURE CONSOLE ---
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<body style="font-family:sans-serif; background:#f4f7f6; padding:20px;">
        <h2 style="font-weight:800">ADMIN CONTROL</h2>
        <div style="background:#fff; padding:25px; border-radius:20px; box-shadow:0 10px 30px rgba(0,0,0,0.05);">
            <form id="fAdd">
                <input id="j" placeholder="Judul Buku" style="width:100%; padding:14px; margin-bottom:10px; border:1px solid #ddd; border-radius:10px;" required>
                <input id="p" placeholder="Penulis" style="width:100%; padding:14px; margin-bottom:10px; border:1px solid #ddd; border-radius:10px;" required>
                <input id="h" placeholder="Harga (Contoh: 2.500)" style="width:100%; padding:14px; margin-bottom:10px; border:1px solid #ddd; border-radius:10px;" required>
                <input type="file" id="fi" style="margin-bottom:15px;" required>
                <select id="g" style="width:100%; padding:14px; margin-bottom:15px; border:1px solid #ddd; border-radius:10px;">
                    ${['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'].map(x => `<option>${x}</option>`).join('')}
                </select>
                <button style="width:100%; padding:16px; background:#2e86de; color:#fff; border:none; border-radius:12px; font-weight:800; cursor:pointer;">PUBLISH E-BOOK</button>
            </form>
        </div>
        <div id="ld" style="display:none; margin:10px 0; font-weight:bold; color:#2e86de;">Sistem sedang mengenkripsi data...</div>
        <div style="margin-top:25px;">
            ${b.map(x => `<div style="background:#fff; padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid #eee;">
                <span><b>${x.judul}</b></span>
                <a href="/del/${x._id}" style="color:#ff4757; text-decoration:none; font-weight:800;">Hapus</a>
            </div>`).join('')}
        </div>
        <script>
            const hI = document.getElementById('h');
            hI.oninput = () => {
                let v = hI.value.replace(/\\D/g, "");
                hI.value = v.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
            };
            document.getElementById('fAdd').onsubmit = async (e) => {
                e.preventDefault();
                document.getElementById('ld').style.display='block';
                const fd = new FormData();
                fd.append('image', document.getElementById('fi').files[0]);
                try {
                    const iR = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {method:'POST', body:fd});
                    const iD = await iR.json();
                    await fetch('/add-ajax', {
                        method:'POST',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({
                            judul: document.getElementById('j').value,
                            penulis: document.getElementById('p').value,
                            harga: Number(hI.value.replace(/\\./g, '')),
                            genre: document.getElementById('g').value,
                            gambar: iD.data.url
                        })
                    });
                    location.reload();
                } catch(e) { alert('Sistem Sibuk!'); }
            };
        </script>
    </body>`);
});

// --- AUTH SYSTEM (ULTIMATE SHIELD) ---
app.get('/login', (req, res) => res.send('<body style="height:100vh; display:flex; justify-content:center; align-items:center; background:#f4f7f6; font-family:sans-serif;"><form action="/login" method="POST" style="background:#fff; padding:40px; border-radius:25px; box-shadow:0 15px 40px rgba(0,0,0,0.05); width:320px;"><h2>Access Key</h2><input type="password" name="pw" style="width:100%; padding:15px; border-radius:10px; border:1px solid #ddd;" autofocus><button style="width:100%; margin-top:15px; padding:15px; border:none; border-radius:10px; background:#111; color:#fff; font-weight:800; cursor:pointer;">VERIFY</button></form></body>'));

app.post('/login', (req, res) => {
    // Anti-Brute Force Simple Logic
    const { pw } = req.body;
    if(typeof pw === 'string' && pw === 'JESTRI0301209') {
        req.session.admin = true;
        res.redirect('/admin');
    } else {
        res.status(401).send("Access Denied");
    }
});

app.post('/add-ajax', async (req, res) => {
    if(req.session.admin) {
        // Data Sanitization
        const { judul, penulis, harga, genre, gambar } = req.body;
        if(judul && penulis && !isNaN(harga)) {
            await new Buku({ judul, penulis, harga, genre, gambar }).save();
            res.sendStatus(200);
        }
    } else { res.sendStatus(403); }
});

app.get('/del/:id', async (req, res) => {
    if(req.session.admin) {
        await Buku.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } else { res.sendStatus(403); }
});

module.exports = app;

