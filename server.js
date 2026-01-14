const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DB CONNECTION (Optimized) ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 10000,
}).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

// Setting Limit agar tidak Error 413 atau Function Failed
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieSession({ name: 'session', keys: ['jestri-key'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API PEMBELI ---
app.get('/api/buku', async (req, res) => {
    try {
        const { genre, search } = req.query;
        let query = {};
        if (search) query.judul = { $regex: search, $options: 'i' };
        if (genre && genre !== 'Semua') query.genre = genre;
        const data = await Buku.find(query).sort({_id:-1}).lean();
        
        if (!data || data.length === 0) return res.send('<div style="grid-column:1/3;text-align:center;padding:50px;color:#ccc">Buku tidak ditemukan</div>');

        res.send(data.map(b => `
            <div class="card" onclick="location.href='https://wa.me/6285189415489?text=Order%20${encodeURIComponent(b.judul)}'">
                <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
                <div style="padding:10px">
                    <h3 style="font-size:0.85rem;margin:5px 0;font-weight:700">${b.judul}</h3>
                    <p style="font-size:0.75rem;color:#888;margin:0">${b.penulis}</p>
                    <div style="color:#2ed573;font-weight:800;font-size:0.9rem">Rp ${Number(b.harga).toLocaleString('id-ID')}</div>
                </div>
            </div>`).join(''));
    } catch (err) { res.status(500).send("Server Error"); }
});

// --- HALAMAN UTAMA ---
app.get('/', async (req, res) => {
    try {
        const genres = ['Fiksi','Edukasi','Teknologi','Bisnis','Self Dev','Misteri','Komik','Sejarah'];
        const initialData = await Buku.find().sort({_id:-1}).limit(10).lean();
        res.send(`<!DOCTYPE html><html><head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
        <title>E-BOOK JESTRI</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; }
            .navbar { background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 999; border-bottom: 1px solid #f1f1f1; }
            .sidebar { position: fixed; top: 0; left: -105%; width: 280px; height: 100%; background: #fff; z-index: 1001; transition: 0.25s; padding: 30px 20px; box-shadow: 20px 0 50px rgba(0,0,0,0.1); }
            .sidebar.active { left: 0; }
            .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1000; display: none; backdrop-filter: blur(4px); }
            .overlay.active { display: block; }
            .genre-item { display: block; padding: 14px 15px; border-radius: 12px; color: #57606f; margin-bottom: 5px; font-weight: 600; cursor: pointer; }
            .genre-item.active { background: #f1f2f6; color: #000; font-weight: 800; border-left: 4px solid #2e86de; }
            .container { max-width: 800px; margin: auto; padding: 20px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .card { background: #fff; border-radius: 20px; overflow: hidden; }
            .card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
        </style>
        </head><body>
        <div class="overlay" id="overlay" onclick="toggleMenu()"></div>
        <div class="sidebar" id="sidebar">
            <h2 style="margin-bottom:30px">E-BOOK JESTRI</h2>
            <div class="genre-item active" onclick="loadC('Semua', this)">Semua Buku</div>
            ${genres.map(g => `<div class="genre-item" onclick="loadC('${g}', this)">${g}</div>`).join('')}
        </div>
        <nav class="navbar">
            <i class="fa-solid fa-bars-staggered" onclick="toggleMenu()" style="font-size:1.4rem; cursor:pointer"></i>
            <div style="font-weight:800">E-BOOK JESTRI</div>
            <button onclick="location.href='https://link.dana.id/qr/39bpg786'" style="background:#2ed573;color:#fff;border:none;padding:8px 15px;border-radius:20px;font-weight:800;font-size:0.7rem">DONATE</button>
        </nav>
        <div class="container">
            <input type="text" id="s" style="width:100%;padding:16px;border-radius:18px;border:1px solid #eee;background:#f5f6fa;margin-bottom:20px" placeholder="Cari buku...">
            <div class="grid" id="bookGrid">
                ${initialData.map(b => `<div class="card" onclick="location.href='https://wa.me/6285189415489?text=Order%20${encodeURIComponent(b.judul)}'"><img src="${b.gambar}"><div style="padding:10px"><h3>${b.judul}</h3><p style="font-size:0.75rem;color:#888">${b.penulis}</p><div style="color:#2ed573;font-weight:800">Rp ${b.harga.toLocaleString('id-ID')}</div></div></div>`).join('')}
            </div>
        </div>
        <script>
            function toggleMenu() { document.getElementById('sidebar').classList.toggle('active'); document.getElementById('overlay').classList.toggle('active'); }
            async function loadC(g, el) {
                document.querySelectorAll('.genre-item').forEach(i => i.classList.remove('active')); el.classList.add('active');
                if(window.innerWidth < 768) toggleMenu();
                const res = await fetch(\`/api/buku?genre=\${encodeURIComponent(g)}\`);
                document.getElementById('bookGrid').innerHTML = await res.text();
            }
            document.getElementById('s').oninput = async (e) => {
                const res = await fetch(\`/api/buku?search=\${encodeURIComponent(e.target.value)}\`);
                document.getElementById('bookGrid').innerHTML = await res.text();
            };
        </script></body></html>`);
    } catch (e) { res.send("Error"); }
});

// --- ADMIN MODE ---
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.send('<script>window.location="/login"</script>');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: sans-serif; background: #f8f9fa; padding: 15px; margin:0; }
        .card { background: #fff; padding: 20px; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.05); margin-bottom: 20px; }
        input, select { width: 100%; padding: 15px; margin-bottom: 12px; border-radius: 12px; border: 1px solid #eee; box-sizing: border-box; font-size: 1rem; }
        .btn { width: 100%; padding: 18px; background: #2e86de; color: #fff; border: none; border-radius: 15px; font-weight: 800; cursor: pointer; }
        .loading { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.9); z-index:999; justify-content:center; align-items:center; flex-direction:column; }
        #pvw { width: 80px; height: 110px; object-fit: cover; display: none; margin-bottom: 10px; border-radius: 10px; }
    </style>
    </head><body>
    <div id="ld" class="loading"><i class="fa-solid fa-sync fa-spin" style="font-size:2rem"></i><p>Memproses...</p></div>
    <div style="padding:15px">
        <h2>ADMIN JESTRI</h2>
        <div class="card">
            <form id="f">
                <input id="j" placeholder="Judul" required>
                <input id="p" placeholder="Penulis" required>
                <input id="h" type="number" placeholder="Harga (Contoh: 2500)" required>
                <img id="pvw">
                <input type="file" id="fi" accept="image/*" required>
                <select id="g">
                    ${['Fiksi','Edukasi','Teknologi','Bisnis','Self Dev','Misteri','Komik','Sejarah'].map(x => `<option>${x}</option>`).join('')}
                </select>
                <button type="submit" class="btn">POSTING SEKARANG</button>
            </form>
        </div>
        ${b.map(x => `<div style="background:#fff;padding:15px;border-radius:15px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
            <div><b>${x.judul}</b><br><small>Rp ${x.harga.toLocaleString()}</small></div>
            <a href="/del/${x._id}" style="color:red;text-decoration:none;font-weight:800">HAPUS</a>
        </div>`).join('')}
    </div>
    <script>
        const fi = document.getElementById('fi');
        const pvw = document.getElementById('pvw');
        fi.onchange = () => { const [file] = fi.files; if(file) { pvw.src = URL.createObjectURL(file); pvw.style.display='block'; } };

        document.getElementById('f').onsubmit = async (e) => {
            e.preventDefault();
            document.getElementById('ld').style.display='flex';
            const formData = new FormData();
            formData.append('image', fi.files[0]);
            
            try {
                // Upload ke ImgBB
                const img = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {
                    method: 'POST', body: formData
                });
                const resImg = await img.json();

                // Simpan ke DB
                await fetch('/add-ajax', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        judul: document.getElementById('j').value,
                        penulis: document.getElementById('p').value,
                        harga: document.getElementById('h').value,
                        genre: document.getElementById('g').value,
                        gambar: resImg.data.url
                    })
                });
                window.location.reload();
            } catch (err) { alert('Gagal!'); document.getElementById('ld').style.display='none'; }
        };
    </script></body></html>`);
});

app.get('/login', (req, res) => res.send('<body><form action="/login" method="POST" style="padding:50px"><input type="password" name="pw" placeholder="Password"><button>Login</button></form></body>'));
app.post('/login', (req, res) => { if(req.body.pw === 'JESTRI0301209') { req.session.admin=true; res.redirect('/admin'); } else res.send('Salah!'); });
app.post('/add-ajax', async (req, res) => { if(req.session.admin) { await new Buku(req.body).save(); res.sendStatus(200); } });
app.get('/del/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); } });

module.exports = app;

