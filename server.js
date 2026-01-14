const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const helmet = require('helmet'); // Keamanan tambahan
const compression = require('compression'); // Mempercepat loading 2x lipat
const app = express();

// --- INFRASTRUKTUR DATABASE ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000,
}).catch(err => console.log("Koneksi DB Gagal"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

// --- MIDDLEWARE LEVEL PRO ---
app.use(compression()); // Kompres data sebelum dikirim ke browser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieSession({ name: 'jestri_session', keys: ['secret-key-pro'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API ENGINE (SUPER FAST & SECURE) ---
app.get('/api/buku', async (req, res) => {
    try {
        const { genre, search } = req.query;
        let q = {};
        if (search) q.judul = { $regex: search, $options: 'i' };
        if (genre && genre !== 'Semua') q.genre = genre;
        
        const data = await Buku.find(q).sort({_id:-1}).lean();
        
        if (!data.length) {
            return res.send(`<div class="empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <p>Buku ${genre || ''} belum tersedia saat ini</p>
            </div>`);
        }

        res.send(data.map(b => {
            const waMsg = encodeURIComponent(`🛒 *ORDER E-BOOK JESTRI*\n\n📖 *JUDUL:* ${b.judul}\n✍️ *PENULIS:* ${b.penulis}\n💰 *HARGA:* Rp ${b.harga.toLocaleString('id-ID')}\n\nSaya ingin membeli ebook ini. Mohon info cara pembayaran.`);
            return `
            <div class="card-pro">
                <div class="badge">${b.genre}</div>
                <div class="img-container">
                    <img src="${b.gambar}" alt="${b.judul}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=Cover+Not+Found'">
                </div>
                <div class="card-info">
                    <h3>${b.judul}</h3>
                    <p>Oleh: ${b.penulis}</p>
                    <div class="price-tag">Rp ${b.harga.toLocaleString('id-ID')}</div>
                    <button class="buy-now" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">
                        <i class="fa-brands fa-whatsapp"></i> BELI SEKARANG
                    </button>
                </div>
            </div>`;
        }).join(''));
    } catch (e) { res.status(500).send("API Error"); }
});

// --- FRONT-END ENGINE (PREMIUM INTERFACE) ---
app.get('/', async (req, res) => {
    const genres = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];
    const initial = await Buku.find().sort({_id:-1}).limit(12).lean();
    
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>JESTRI - Premium E-Book Store</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        
        :root { --p: #2e86de; --s: #2ed573; --dark: #121212; --light: #f8f9fa; }
        
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        html, body { 
            max-width: 100%; overflow-x: hidden; touch-action: pan-y; 
            font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: var(--light); 
        }

        /* HEADER PREMIUM */
        .header { 
            background: rgba(255,255,255,0.8); backdrop-filter: blur(15px);
            padding: 15px 20px; display: flex; justify-content: space-between; 
            align-items: center; position: sticky; top: 0; z-index: 999; 
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        
        /* SIDEBAR PRO */
        .sidebar { 
            position: fixed; top: 0; left: -110%; width: 300px; height: 100%; 
            background: #fff; z-index: 1001; transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
            padding: 30px 25px; box-shadow: 20px 0 50px rgba(0,0,0,0.1); 
        }
        .sidebar.active { left: 0; }
        .overlay { 
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.3); z-index: 1000; display: none; backdrop-filter: blur(4px); 
        }
        .overlay.active { display: block; }

        .genre-list { margin-top: 30px; }
        .g-item { 
            padding: 14px 20px; border-radius: 14px; cursor: pointer; color: #555; 
            font-weight: 600; margin-bottom: 8px; transition: 0.3s; display: block; width: 100%; text-align: left; border: none; background: none;
        }
        .g-item.active { background: var(--p); color: #fff; box-shadow: 0 10px 20px rgba(46,134,222,0.3); }

        /* GRID SYSTEM */
        .main-container { max-width: 900px; margin: auto; padding: 20px; }
        .search-wrapper { position: relative; margin-bottom: 30px; }
        .search-bar { 
            width: 100%; padding: 18px 25px; border-radius: 20px; border: 1px solid #eee;
            background: #fff; font-size: 1rem; outline: none; box-shadow: 0 5px 20px rgba(0,0,0,0.02);
            transition: 0.3s;
        }
        .search-bar:focus { border-color: var(--p); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }

        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        
        /* CARD PROFESSIONAL */
        .card-pro { 
            background: #fff; border-radius: 24px; overflow: hidden; position: relative;
            transition: 0.3s; border: 1px solid #f0f0f0; animation: up 0.5s ease;
        }
        .badge { 
            position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6); 
            color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; z-index: 2;
            backdrop-filter: blur(5px); font-weight: 700;
        }
        .img-container { width: 100%; aspect-ratio: 2/3; overflow: hidden; }
        .img-container img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
        .card-pro:hover img { transform: scale(1.05); }
        .card-info { padding: 15px; }
        .card-info h3 { font-size: 0.9rem; margin: 0 0 5px; font-weight: 800; color: var(--dark); line-height: 1.3; height: 2.6em; overflow: hidden; }
        .card-info p { font-size: 0.75rem; color: #888; margin-bottom: 12px; }
        .price-tag { font-size: 1rem; font-weight: 800; color: var(--s); margin-bottom: 15px; }
        .buy-now { 
            width: 100%; padding: 12px; border-radius: 12px; border: none; 
            background: var(--dark); color: #fff; font-weight: 800; font-size: 0.7rem;
            cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .buy-now:active { transform: scale(0.95); }

        /* FLOATING SOCIAL & ELEMENTS */
        .social-dock { position: fixed; bottom: 25px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 998; }
        .s-link { 
            width: 50px; height: 50px; border-radius: 18px; display: flex; align-items: center; 
            justify-content: center; color: #fff; text-decoration: none; font-size: 1.4rem; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.15); transition: 0.3s;
        }
        .s-link:active { transform: translateY(-5px); }

        .btn-dana { 
            background: var(--s); color: #fff; padding: 10px 20px; border-radius: 15px; 
            font-weight: 800; font-size: 0.75rem; text-decoration: none; 
            box-shadow: 0 8px 20px rgba(46,213,115,0.3);
        }

        .empty-state { grid-column: 1/3; text-align: center; padding: 60px 0; color: #ccc; }
        .empty-state i { font-size: 3rem; margin-bottom: 20px; opacity: 0.3; }

        #progress-bar { position: fixed; top: 0; left: 0; height: 4px; background: var(--p); width: 0; transition: 0.3s; z-index: 2000; border-radius: 0 2px 2px 0; }

        @keyframes up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        @media (max-width: 480px) {
            .grid { gap: 12px; }
            .card-info { padding: 12px; }
        }
    </style>
    </head><body>
    <div id="progress-bar"></div>
    <div class="overlay" id="overlay" onclick="toggleNav()"></div>
    
    <div class="sidebar" id="sidebar">
        <h2 style="font-weight: 800; font-size: 1.5rem; color: var(--p)">JESTRI PRO</h2>
        <div class="genre-list">
            <button class="g-item active" onclick="fetchData('Semua', this)">Semua Koleksi</button>
            ${genres.map(g => `<button class="g-item" onclick="fetchData('${g}', this)">${g}</button>`).join('')}
        </div>
        <div style="position: absolute; bottom: 30px; left: 25px; font-size: 0.7rem; color: #ccc;">
            &copy; 2024 JESTRI OFFICIAL STORE
        </div>
    </div>

    <nav class="header">
        <i class="fa-solid fa-bars-staggered" onclick="toggleNav()" style="font-size: 1.4rem; cursor: pointer"></i>
        <span style="font-weight: 800; font-size: 1.2rem; letter-spacing: -0.5px">JESTRI</span>
        <a href="https://link.dana.id/qr/39bpg786" class="btn-dana">DONATE</a>
    </nav>

    <div class="main-container">
        <div class="search-wrapper">
            <input type="text" class="search-bar" oninput="searchData(this.value)" placeholder="Cari judul e-book premium...">
        </div>
        
        <div class="grid" id="book-grid">
            ${initial.map(b => {
                const waMsg = encodeURIComponent(`🛒 *ORDER E-BOOK JESTRI*\n\n📖 *JUDUL:* ${b.judul}\n✍️ *PENULIS:* ${b.penulis}\n💰 *HARGA:* Rp ${b.harga.toLocaleString('id-ID')}\n\nSaya ingin membeli ebook ini. Mohon info cara pembayaran.`);
                return `
                <div class="card-pro">
                    <div class="badge">${b.genre}</div>
                    <div class="img-container"><img src="${b.gambar}"></div>
                    <div class="card-info">
                        <h3>${b.judul}</h3>
                        <p>Oleh: ${b.penulis}</p>
                        <div class="price-tag">Rp ${b.harga.toLocaleString('id-ID')}</div>
                        <button class="buy-now" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">
                            <i class="fa-brands fa-whatsapp"></i> BELI SEKARANG
                        </button>
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>

    <div class="social-dock">
        <a href="https://wa.me/6285189415489" class="s-link" style="background: #25d366"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="s-link" style="background: #e4405f"><i class="fa-brands fa-instagram"></i></a>
        <a href="https://t.me/+62895327806441" class="s-link" style="background: #0088cc"><i class="fa-brands fa-telegram"></i></a>
    </div>

    <script>
        const pg = document.getElementById('progress-bar');
        const grid = document.getElementById('book-grid');
        const cache = {};

        function toggleNav() {
            document.getElementById('sidebar').classList.toggle('active');
            document.getElementById('overlay').classList.toggle('active');
        }

        async function fetchData(g, el) {
            if(el) {
                document.querySelectorAll('.g-item').forEach(b => b.classList.remove('active'));
                el.classList.add('active');
            }
            if(window.innerWidth < 768) toggleNav();
            
            if(cache[g]) {
                grid.innerHTML = cache[g];
                return;
            }

            pg.style.width = '40%';
            const res = await fetch('/api/buku?genre=' + encodeURIComponent(g));
            const html = await res.text();
            cache[g] = html;
            grid.innerHTML = html;
            pg.style.width = '100%';
            setTimeout(() => pg.style.width = '0', 300);
        }

        let debounce;
        function searchData(v) {
            clearTimeout(debounce);
            debounce = setTimeout(async () => {
                pg.style.width = '50%';
                const res = await fetch('/api/buku?search=' + encodeURIComponent(v));
                grid.innerHTML = await res.text();
                pg.style.width = '100%';
                setTimeout(() => pg.style.width = '0', 300);
            }, 400);
        }
    </script></body></html>`);
});

// --- ADMIN PRO SYSTEM ---
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.send('<script>location.href="/login"</script>');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f0f2f5; padding: 20px; margin: 0; }
        .box { background: #fff; padding: 30px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        input, select { width: 100%; padding: 15px; margin-bottom: 15px; border-radius: 12px; border: 1px solid #ddd; font-size: 1rem; }
        .btn { width: 100%; padding: 18px; background: #2e86de; color: #fff; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; }
        #loader { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.9); z-index: 9999; justify-content: center; align-items: center; flex-direction: column; }
    </style>
    </head><body>
    <div id="loader"><i class="fa-solid fa-circle-notch fa-spin" style="font-size: 3rem; color: #2e86de"></i><p>Sistem Sedang Memproses...</p></div>
    <div style="max-width: 600px; margin: auto;">
        <h2 style="font-weight: 800">CONSOLE ADMIN</h2>
        <div class="box">
            <form id="adminForm">
                <input id="j" placeholder="Judul Buku" required>
                <input id="p" placeholder="Penulis" required>
                <input id="h" placeholder="Harga (Contoh: 2.500)" required>
                <input type="file" id="fi" accept="image/*" required>
                <select id="g">
                    ${['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'].map(x => `<option>${x}</option>`).join('')}
                </select>
                <button class="btn">PUBLISH KE WEBSITE</button>
            </form>
        </div>
        <h3 style="margin-top: 30px">Katalog Saat Ini (${b.length})</h3>
        ${b.map(x => `<div style="background:#fff; padding:15px; margin-bottom:10px; border-radius:15px; display:flex; justify-content:space-between; align-items:center; border: 1px solid #eee">
            <div><b style="font-size:0.9rem">${x.judul}</b><br><small style="color:#2ed573">Rp ${x.harga.toLocaleString()}</small></div>
            <a href="/del/${x._id}" style="color:red; text-decoration:none; font-weight:800; font-size:0.8rem">HAPUS</a>
        </div>`).join('')}
    </div>
    <script>
        const hInp = document.getElementById('h');
        hInp.oninput = () => {
            let v = hInp.value.replace(/\\D/g, "");
            hInp.value = v.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
        };

        document.getElementById('adminForm').onsubmit = async (e) => {
            e.preventDefault();
            document.getElementById('loader').style.display = 'flex';
            const formData = new FormData();
            formData.append('image', document.getElementById('fi').files[0]);
            
            try {
                const imgRes = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', { method: 'POST', body: formData });
                const imgData = await imgRes.json();
                
                await fetch('/add-ajax', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        judul: document.getElementById('j').value,
                        penulis: document.getElementById('p').value,
                        harga: Number(hInp.value.replace(/\\./g, '')),
                        genre: document.getElementById('g').value,
                        gambar: imgData.data.url
                    })
                });
                location.reload();
            } catch (err) { alert('Sistem Sibuk, Coba Lagi!'); document.getElementById('loader').style.display = 'none'; }
        };
    </script></body></html>`);
});

// --- AUTH & CORE ---
app.get('/login', (req, res) => res.send('<body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#f0f2f5"><form action="/login" method="POST" style="background:#fff;padding:40px;border-radius:24px;box-shadow:0 10px 30px rgba(0,0,0,0.05)"><h2>Console Login</h2><input type="password" name="pw" style="padding:15px;border-radius:12px;border:1px solid #ddd;width:100%;box-sizing:border-box" autofocus><button style="width:100%;margin-top:15px;padding:15px;background:#2e86de;color:#fff;border:none;border-radius:12px;font-weight:800">LOGIN</button></form></body>'));
app.post('/login', (req, res) => { if(req.body.pw === 'JESTRI0301209') { req.session.admin=true; res.redirect('/admin'); } else res.send('Unauthorized'); });
app.post('/add-ajax', async (req, res) => { if(req.session.admin) { await new Buku(req.body).save(); res.sendStatus(200); } });
app.get('/del/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); } });

module.exports = app;

