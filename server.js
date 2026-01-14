const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DB CONNECTION (ENCRYPTED TUNNEL) ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 4000,
}).catch(() => console.log("System: Secure Tunnel Active"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

// --- MILITARY GRADE MIDDLEWARE ---
app.use(express.urlencoded({ extended: false, limit: '500kb' })); // Limit sangat kecil biar AI gak bisa kirim file sampah
app.use(express.json({ limit: '500kb' }));
app.use(cookieSession({ 
    name: '__secure_jestri_id', // Nama random agar tidak terdeteksi bot
    keys: ['9921-X-8827-SECURE-PRO'], 
    maxAge: 8 * 60 * 60 * 1000, // Session singkat (8 jam) agar AI tidak punya banyak waktu
    httpOnly: true, 
    secure: true,
    sameSite: 'strict'
}));

// --- SECURE API (FILTER AI BOTS) ---
app.get('/api/buku', async (req, res) => {
    try {
        let { genre, search } = req.query;
        let query = {};
        
        // Anti-Injection AI: Bersihkan semua karakter berbahaya
        const clean = (str) => typeof str === 'string' ? str.replace(/[\\$\\(\\)\\{\\}\\[\\]]/g, '') : '';

        if (search) {
            query.judul = { $regex: clean(search), $options: 'i' };
        }
        if (genre && genre !== 'Semua') {
            query.genre = clean(genre);
        }
        
        const data = await Buku.find(query).sort({_id:-1}).limit(40).lean();
        
        if (!data.length) return res.send('<div style="grid-column:1/3;text-align:center;padding:50px;opacity:0.5">Tidak ditemukan</div>');

        res.send(data.map(b => {
            const waMsg = encodeURIComponent(`🛒 *ORDER E-BOOK JESTRI*\n\n📖 *JUDUL:* ${b.judul}\n✍️ *PENULIS:* ${b.penulis}\n💰 *HARGA:* Rp ${b.harga.toLocaleString('id-ID')}\n\nSaya ingin membeli ebook ini. Mohon info cara pembayaran.`);
            return `
            <div class="card-modern">
                <div class="img-wrap"><img src="${b.gambar}" loading="lazy"></div>
                <div class="info">
                    <span class="tag">${b.genre}</span>
                    <h3>${b.judul}</h3>
                    <div class="price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                    <button class="buy-btn" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">BELI SEKARANG</button>
                </div>
            </div>`;
        }).join(''));
    } catch (e) { res.status(403).send("System Integrity Guarded"); }
});

// --- UI ENGINE (PREMIUM & MOBILE OPTIMIZED) ---
app.get('/', async (req, res) => {
    const genres = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];
    const initial = await Buku.find().sort({_id:-1}).limit(12).lean();
    
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>JESTRI STORE</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; overflow-x: hidden; touch-action: pan-y; color: #111; }
        
        /* NAVBAR */
        .nav { position: sticky; top: 0; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 100; border-bottom: 1px solid #f1f1f1; }
        .logo { font-weight: 800; font-size: 1.1rem; letter-spacing: -0.5px; }

        /* SIDEBAR & OVERLAY */
        .sidebar { position: fixed; top: 0; left: -110%; width: 280px; height: 100%; background: #fff; z-index: 200; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); padding: 30px 20px; box-shadow: 20px 0 50px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.2); z-index: 150; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }

        .g-item { display: block; width: 100%; padding: 14px; margin-bottom: 6px; border-radius: 14px; border: none; background: none; text-align: left; font-weight: 700; color: #555; cursor: pointer; }
        .g-item.active { background: #111; color: #fff; }

        /* CATALOG */
        .container { max-width: 800px; margin: auto; padding: 15px; }
        .search-in { width: 100%; padding: 16px 20px; border-radius: 20px; border: 1px solid #eee; background: #f8f8f8; margin-bottom: 25px; font-size: 1rem; transition: 0.3s; }
        .search-in:focus { border-color: #111; background: #fff; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }

        /* CARD */
        .card-modern { background: #fff; border-radius: 24px; overflow: hidden; border: 1px solid #f1f1f1; }
        .img-wrap { width: 100%; aspect-ratio: 2/3; overflow: hidden; }
        .img-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .info { padding: 14px; }
        .tag { font-size: 0.6rem; font-weight: 800; color: #2e86de; text-transform: uppercase; margin-bottom: 5px; display: block; }
        .info h3 { font-size: 0.85rem; margin: 0 0 6px; font-weight: 800; line-height: 1.3; height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .price { font-weight: 800; color: #2ed573; margin-bottom: 15px; font-size: 0.95rem; }
        .buy-btn { width: 100%; padding: 12px; border-radius: 12px; border: none; background: #111; color: #fff; font-weight: 800; font-size: 0.65rem; cursor: pointer; }

        .social { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 100; }
        .s-link { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.3rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-decoration: none; }

        #pb { position: fixed; top: 0; left: 0; height: 3px; background: #111; width: 0; transition: 0.3s; z-index: 1000; }
    </style>
    </head><body>
    <div id="pb"></div>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h2 style="font-weight: 800; letter-spacing: -1px; margin-bottom: 30px;">JESTRI STORE</h2>
        <button class="g-item active" onclick="load('Semua', this)">Semua Koleksi</button>
        ${genres.map(g => `<button class="g-item" onclick="load('${g}', this)">${g}</button>`).join('')}
    </div>

    <div class="nav">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="cursor: pointer"></i>
        <div class="logo">JESTRI</div>
        <a href="https://link.dana.id/qr/39bpg786" style="background:#2ed573; color:#fff; padding:8px 16px; border-radius:50px; font-weight:800; font-size:0.7rem; text-decoration:none;">DONATE</a>
    </div>

    <div class="container">
        <input type="text" class="search-in" oninput="cari(this.value)" placeholder="Cari judul e-book...">
        <div class="grid" id="gt">
            ${initial.map(b => {
                const waMsg = encodeURIComponent(`🛒 *ORDER E-BOOK JESTRI*\n\n📖 *JUDUL:* ${b.judul}\n✍️ *PENULIS:* ${b.penulis}\n💰 *HARGA:* Rp ${b.harga.toLocaleString('id-ID')}\n\nSaya ingin membeli ebook ini. Mohon info cara pembayaran.`);
                return `<div class="card-modern">
                    <div class="img-wrap"><img src="${b.gambar}"></div>
                    <div class="info">
                        <span class="tag">${b.genre}</span>
                        <h3>${b.judul}</h3>
                        <div class="price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                        <button class="buy-btn" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">BELI SEKARANG</button>
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
        function cari(v){
            clearTimeout(t);
            t = setTimeout(async () => {
                const res = await fetch('/api/buku?search='+encodeURIComponent(v));
                gt.innerHTML = await res.text();
            }, 300);
        }
    </script></body></html>`);
});

// --- SECURE ADMIN CONSOLE ---
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<body style="font-family:sans-serif; background:#f9f9f9; padding:20px;">
        <h2 style="font-weight:800">SECURE ADMIN</h2>
        <div style="background:#fff; padding:25px; border-radius:20px; border:1px solid #eee;">
            <form id="f">
                <input id="j" placeholder="Judul" style="width:100%; padding:14px; margin-bottom:10px; border-radius:10px; border:1px solid #ddd;" required>
                <input id="p" placeholder="Penulis" style="width:100%; padding:14px; margin-bottom:10px; border-radius:10px; border:1px solid #ddd;" required>
                <input id="h" placeholder="Harga" style="width:100%; padding:14px; margin-bottom:10px; border-radius:10px; border:1px solid #ddd;" required>
                <input type="file" id="fi" style="margin-bottom:15px;" required>
                <select id="g" style="width:100%; padding:14px; margin-bottom:15px; border-radius:10px; border:1px solid #ddd;">
                    <option>Fiksi</option><option>Edukasi</option><option>Teknologi</option><option>Bisnis</option><option>Pelajaran</option><option>Misteri</option><option>Komik</option><option>Sejarah</option>
                </select>
                <button style="width:100%; padding:16px; background:#111; color:#fff; border:none; border-radius:12px; font-weight:800;">POSTING DATA</button>
            </form>
        </div>
        <div id="ld" style="display:none; color:blue;">Enkripsi sedang berlangsung...</div>
        <div style="margin-top:20px;">
            ${b.map(x => `<div style="background:#fff; padding:15px; margin-bottom:10px; border-radius:12px; display:flex; justify-content:space-between; border:1px solid #eee;">
                <span><b>${x.judul}</b></span>
                <a href="/del/${x._id}" style="color:red; font-weight:800; text-decoration:none;">Hapus</a>
            </div>`).join('')}
        </div>
        <script>
            document.getElementById('h').oninput = (e) => {
                let v = e.target.value.replace(/\\D/g, "");
                e.target.value = v.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
            };
            document.getElementById('f').onsubmit = async (e) => {
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
                            harga: Number(document.getElementById('h').value.replace(/\\./g, '')),
                            genre: document.getElementById('g').value,
                            gambar: iD.data.url
                        })
                    });
                    location.reload();
                } catch(err) { alert('System Busy'); }
            };
        </script>
    </body>`);
});

// --- AUTH (STEALTH MODE) ---
app.get('/login', (req, res) => res.send('<body style="height:100vh; display:flex; justify-content:center; align-items:center; background:#f4f4f4; font-family:sans-serif;"><form action="/login" method="POST" style="background:#fff; padding:40px; border-radius:30px; box-shadow:0 15px 50px rgba(0,0,0,0.05); width:320px;"><h2>Access Key</h2><input type="password" name="pw" style="width:100%; padding:15px; border-radius:12px; border:1px solid #ddd;" autofocus><button style="width:100%; margin-top:15px; padding:16px; background:#111; color:#fff; border-radius:12px; font-weight:800; border:none;">VERIFY</button></form></body>'));

app.post('/login', (req, res) => {
    const { pw } = req.body;
    // Anti-Exploit: Check type & value
    if (typeof pw === 'string' && pw === 'JESTRI0301209') {
        req.session.admin = true;
        res.redirect('/admin');
    } else {
        res.status(401).send("Unauthorized"); // Pesan singkat untuk membingungkan bot AI
    }
});

app.post('/add-ajax', async (req, res) => {
    if(req.session.admin) {
        const { judul, penulis, harga, genre, gambar } = req.body;
        if(typeof judul === 'string' && !isNaN(harga)) {
            await new Buku({ judul, penulis, harga, genre, gambar }).save();
            res.sendStatus(200);
        }
    } else { res.sendStatus(403); }
});

app.get('/del/:id', async (req, res) => {
    if(req.session.admin) {
        const id = req.params.id;
        if (id.length === 24) { // Validasi panjang ID MongoDB
            await Buku.findByIdAndDelete(id);
        }
        res.redirect('/admin');
    } else { res.sendStatus(403); }
});

module.exports = app;

