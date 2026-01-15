const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DB CONNECTION ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 20000 }).catch(err => console.log("DB Offline"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'jestri_secure', keys: ['KEY_ULTIMATE'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API DATA (JSON ONLY UNTUK KECEPATAN TURBO) ---
app.get('/api/buku-json', async (req, res) => {
    try {
        const data = await Buku.find().sort({_id:-1}).lean();
        res.json(data);
    } catch (e) { res.status(500).json([]); }
});

// --- HALAMAN UTAMA (OPTIMIZED UI) ---
app.get('/', async (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; outline: none; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; color: #111; }
        
        /* Nav & Sidebar */
        .header { position: sticky; top: 0; background: rgba(255,255,255,0.8); backdrop-filter: blur(20px); z-index: 100; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0; }
        .header b { font-size: 1.2rem; font-weight: 800; letter-spacing: -1px; }
        .sidebar { position: fixed; top: 0; left: -100%; width: 300px; height: 100%; background: #fff; z-index: 200; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); padding: 40px 25px; box-shadow: 20px 0 60px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 150; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }

        /* Genre & Search */
        .g-item { display: block; width: 100%; padding: 14px 18px; margin-bottom: 10px; border-radius: 14px; border: none; background: #f5f5f5; text-align: left; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .g-item.active { background: #000; color: #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .search-container { padding: 20px; max-width: 800px; margin: auto; }
        .search-bar { width: 100%; padding: 18px 25px; border-radius: 20px; border: 1px solid #eee; background: #f9f9f9; font-size: 1rem; transition: 0.3s; }
        .search-bar:focus { border-color: #000; background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }

        /* Grid System */
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; padding: 0 20px 100px; max-width: 800px; margin: auto; }
        .card { background: #fff; border-radius: 22px; overflow: hidden; border: 1px solid #f0f0f0; transition: 0.3s; animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .img-box { width: 100%; aspect-ratio: 3/4; background: #f0f0f0; position: relative; overflow: hidden; }
        .img-box img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
        .info { padding: 15px; }
        .info .cat { font-size: 0.65rem; font-weight: 800; color: #3498db; text-transform: uppercase; margin-bottom: 5px; display: block; }
        .info h3 { font-size: 0.9rem; margin: 5px 0; font-weight: 700; height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3; }
        .price { font-weight: 800; color: #2ecc71; font-size: 1.1rem; margin-top: 5px; }
        .btn-buy { width: 100%; margin-top: 12px; padding: 12px; border-radius: 14px; border: none; background: #111; color: #fff; font-weight: 700; font-size: 0.75rem; cursor: pointer; }

        /* Floating Social */
        .social { position: fixed; bottom: 30px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 100; }
        .s-btn { width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.2); text-decoration: none; }
    </style></head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h2 style="font-weight:800; margin-bottom: 30px;">KATEGORI</h2>
        <button class="g-item active" onclick="setG('Semua', this)">Semua Koleksi</button>
        ${LIST_GENRE.map(g => `<button class="g-item" onclick="setG('${g}', this)">${g}</button>`).join('')}
    </div>
    <div class="header">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.4rem; cursor:pointer;"></i>
        <b>E-BOOK JESTRI</b>
        <a href="https://link.dana.id/qr/39bpg786" style="background:#2ed573; color:#fff; padding:10px 18px; border-radius:50px; text-decoration:none; font-size:0.75rem; font-weight:800;">DONATE</a>
    </div>
    <div class="search-container">
        <input type="text" class="search-bar" id="sin" placeholder="Cari judul atau penulis..." oninput="render()">
    </div>
    <div class="grid" id="gt"></div>
    <div class="social">
        <a href="https://wa.me/6285189415489" class="s-btn" style="background:#25d366"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="s-btn" style="background:#e4405f"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <script>
        let allBuku = []; let curG = 'Semua';
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        function setG(g, el){ 
            curG = g; document.querySelectorAll('.g-item').forEach(b=>b.classList.remove('active')); 
            el.classList.add('active'); tog(); render(); 
        }
        
        async function load(){
            const res = await fetch('/api/buku-json');
            allBuku = await res.json();
            render();
        }

        function render(){
            const query = document.getElementById('sin').value.toLowerCase();
            const filtered = allBuku.filter(b => {
                const mG = curG === 'Semua' || b.genre === curG;
                const mS = b.judul.toLowerCase().includes(query) || b.penulis.toLowerCase().includes(query);
                return mG && mS;
            });
            
            document.getElementById('gt').innerHTML = filtered.map(b => {
                // PROXY FIX: Tembus blokir ISP
                const img = b.gambar.replace(/^https?:\\/\\//, '');
                const proxImg = "https://wsrv.nl/?url=" + encodeURIComponent(img) + "&w=400&h=600&fit=cover&output=jpg";
                const wa = encodeURIComponent("🛒 *ORDER E-BOOK JESTRI*\\n\\n📖 *JUDUL:* "+b.judul+"\\n✍️ *PENULIS:* "+b.penulis+"\\n💰 *HARGA:* Rp "+b.harga.toLocaleString('id-ID')+"\\n\\nSaya ingin membeli ini, mohon info pembayarannya.");
                
                return \`
                <div class="card">
                    <div class="img-box"><img src="\${proxImg}" loading="lazy" onerror="this.src='https://placehold.co/400x600?text=Error+Gambar'"></div>
                    <div class="info">
                        <span class="cat">\${b.genre}</span>
                        <h3>\${b.judul}</h3>
                        <div class="price">Rp \${b.harga.toLocaleString('id-ID')}</div>
                        <button class="btn-buy" onclick="location.href='https://wa.me/6285189415489?text=\${wa}'">BELI SEKARANG</button>
                    </div>
                </div>\`;
            }).join('');
        }
        load();
    </script></body></html>`);
});

// --- ADMIN UI (FIX BERANTAKAN & SYMETRICAL) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.send(`
        <body style="display:grid;place-items:center;height:100vh;margin:0;background:#f0f2f5;font-family:sans-serif;">
            <form action="/login" method="POST" style="background:#fff;padding:40px;border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,0.1);width:90%;max-width:350px;text-align:center;">
                <h2 style="margin-bottom:30px;font-weight:800;">Admin Login</h2>
                <input name="pw" type="password" placeholder="Password" style="width:100%;padding:15px;margin-bottom:20px;border-radius:12px;border:1px solid #ddd;text-align:center;" required autofocus>
                <button style="width:100%;padding:15px;background:#000;color:#fff;border:none;border-radius:12px;font-weight:700;cursor:pointer;">LOG IN</button>
            </form>
        </body>
    `);
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`
    <body style="font-family:sans-serif;background:#f8f9fa;padding:20px;margin:0;">
        <div style="max-width:600px;margin:auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;">
                <h2 style="font-weight:800;margin:0;">Dashboard</h2>
                <a href="/logout" style="color:red;font-weight:700;text-decoration:none;">Logout</a>
            </div>
            
            <form id="fa" style="background:#fff;padding:25px;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,0.05);display:grid;gap:15px;margin-bottom:40px;">
                <input id="j" placeholder="Judul Buku" required style="padding:14px;border-radius:10px;border:1px solid #eee;">
                <input id="p" placeholder="Penulis" required style="padding:14px;border-radius:10px;border:1px solid #eee;">
                <input id="h" type="number" placeholder="Harga (Angka saja)" required style="padding:14px;border-radius:10px;border:1px solid #eee;">
                <select id="g" style="padding:14px;border-radius:10px;border:1px solid #eee;">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
                <div style="background:#f9f9f9;padding:15px;border-radius:10px;border:1px dashed #ccc;text-align:center;">
                    <input type="file" id="fi" accept="image/*" required>
                </div>
                <button id="btn" style="padding:16px;background:#000;color:#fff;border:none;border-radius:12px;font-weight:800;cursor:pointer;">POSTING BUKU SEKARANG</button>
            </form>

            <div id="list">
                ${b.map(x => `
                    <div style="background:#fff;padding:15px 20px;border-radius:15px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;border:1px solid #eee;">
                        <span style="font-weight:600;">${x.judul}</span>
                        <a href="/del/${x._id}" style="color:red;text-decoration:none;font-size:0.8rem;font-weight:800;">HAPUS</a>
                    </div>
                `).join('')}
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
                } catch(e) { alert('Gagal Upload!'); btn.disabled = false; }
            };
        </script>
    </body>`);
});

app.post('/login', (req, res) => { if(req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.get('/logout', (req, res) => { req.session = null; res.redirect('/admin'); });
app.post('/add-ajax', async (req, res) => { if(req.session.admin) { await new Buku(req.body).save(); res.sendStatus(200); } });
app.get('/del/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); } });

app.listen(process.env.PORT || 3000);

