const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- KONEKSI DATABASE ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 10000
}).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieSession({ name: 'session', keys: ['jestri-key'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API KATALOG ---
app.get('/api/buku', async (req, res) => {
    try {
        const { genre, search } = req.query;
        let q = {};
        if (search) q.judul = { $regex: search, $options: 'i' };
        if (genre && genre !== 'Semua') q.genre = genre;
        
        const data = await Buku.find(q).sort({_id:-1}).lean();
        if (!data.length) return res.send('<div style="grid-column:1/3;text-align:center;padding:50px;color:#ccc">Buku tidak ditemukan</div>');

        res.send(data.map(b => `
            <div class="card" onclick="location.href='https://wa.me/6285189415489?text=Order%20${encodeURIComponent(b.judul)}'">
                <img src="${b.gambar}" loading="lazy">
                <div style="padding:10px">
                    <h3 style="font-size:0.85rem;margin:5px 0;font-weight:700">${b.judul}</h3>
                    <p style="font-size:0.75rem;color:#888;margin:0">${b.penulis}</p>
                    <div style="color:#2ed573;font-weight:800;font-size:0.9rem;margin-top:5px">Rp ${b.harga.toLocaleString('id-ID')}</div>
                </div>
            </div>`).join(''));
    } catch (e) { res.status(500).send("Error"); }
});

// --- TAMPILAN UTAMA ---
app.get('/', async (req, res) => {
    const genres = ['Fiksi','Edukasi','Teknologi','Bisnis','Self Dev','Misteri','Komik','Sejarah'];
    const initial = await Buku.find().sort({_id:-1}).limit(10).lean();
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; }
        .nav { background:#fff; padding:15px 20px; display:flex; justify-content:space-between; position:sticky; top:0; z-index:99; border-bottom:1px solid #eee; }
        .sidebar { position:fixed; top:0; left:-105%; width:280px; height:100%; background:#fff; z-index:101; transition:0.3s; padding:20px; box-shadow:0 0 20px rgba(0,0,0,0.1); }
        .sidebar.active { left:0; }
        .overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); z-index:100; display:none; }
        .overlay.active { display:block; }
        .genre-btn { display:block; padding:12px; margin-bottom:5px; border-radius:10px; cursor:pointer; color:#555; font-weight:600; }
        .genre-btn.active { background:#f0f7ff; color:#2e86de; border-left:4px solid #2e86de; }
        .container { max-width:800px; margin:auto; padding:15px; }
        .grid { display:grid; grid-template-columns:1fr 1fr; gap:15px; }
        .card { background:#fff; border-radius:15px; overflow:hidden; }
        .card img { width:100%; aspect-ratio:2/3; object-fit:cover; border-radius:15px; box-shadow:0 5px 15px rgba(0,0,0,0.05); }
        .social { position:fixed; bottom:20px; right:20px; display:flex; flex-direction:column; gap:10px; z-index:90; }
        .icon { width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; text-decoration:none; font-size:1.5rem; box-shadow:0 5px 15px rgba(0,0,0,0.2); }
    </style>
    </head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h3>KATALOG</h3>
        <div class="genre-btn active" onclick="load('Semua', this)">Semua</div>
        ${genres.map(g => `<div class="genre-btn" onclick="load('${g}', this)">${g}</div>`).join('')}
    </div>
    <div class="nav">
        <i class="fa-solid fa-bars" onclick="tog()" style="font-size:1.5rem"></i>
        <b style="font-size:1.2rem">E-BOOK JESTRI</b>
        <div style="width:24px"></div>
    </div>
    <div class="container">
        <input type="text" oninput="cari(this.value)" style="width:100%; padding:15px; border-radius:15px; border:1px solid #eee; background:#f9f9f9; margin-bottom:20px" placeholder="Cari judul...">
        <div class="grid" id="gt">
            ${initial.map(b => `<div class="card" onclick="location.href='https://wa.me/6285189415489?text=Order%20${encodeURIComponent(b.judul)}'"><img src="${b.gambar}"><div style="padding:10px"><h3>${b.judul}</h3><p>${b.penulis}</p><div style="color:#2ed573;font-weight:800">Rp ${b.harga.toLocaleString('id-ID')}</div></div></div>`).join('')}
        </div>
    </div>
    <div class="social">
        <a href="https://wa.me/6285189415489" class="icon" style="background:#25d366"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="icon" style="background:#e4405f"><i class="fa-brands fa-instagram"></i></a>
        <a href="https://t.me/+62895327806441" class="icon" style="background:#0088cc"><i class="fa-brands fa-telegram"></i></a>
    </div>
    <script>
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(g, el){
            document.querySelectorAll('.genre-btn').forEach(b=>b.classList.remove('active')); el.classList.add('active');
            if(window.innerWidth < 768) tog();
            const res = await fetch('/api/buku?genre='+encodeURIComponent(g));
            document.getElementById('gt').innerHTML = await res.text();
        }
        async function cari(v){
            const res = await fetch('/api/buku?search='+encodeURIComponent(v));
            document.getElementById('gt').innerHTML = await res.text();
        }
    </script></body></html>`);
});

// --- ADMIN MODE ---
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.send('<script>location.href="/login"</script>');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family:sans-serif; background:#f4f4f4; padding:15px; }
        .box { background:#fff; padding:20px; border-radius:15px; margin-bottom:20px; }
        input, select { width:100%; padding:12px; margin-bottom:10px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box; }
        .btn { width:100%; padding:15px; background:#2e86de; color:#fff; border:none; border-radius:10px; font-weight:800; }
        #loading { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.8); z-index:999; justify-content:center; align-items:center; flex-direction:column; }
    </style>
    </head><body>
    <div id="loading"><i class="fa-solid fa-sync fa-spin" style="font-size:2rem"></i><p>Memproses...</p></div>
    <h3>ADMIN MODE</h3>
    <div class="box">
        <form id="formAdd">
            <input id="judul" placeholder="Judul Buku" required>
            <input id="penulis" placeholder="Nama Penulis" required>
            <input id="harga" type="number" placeholder="Harga" required>
            <input type="file" id="fileInp" accept="image/*" required>
            <select id="genre">
                <option>Fiksi</option><option>Edukasi</option><option>Teknologi</option><option>Bisnis</option>
                <option>Self Dev</option><option>Misteri</option><option>Komik</option><option>Sejarah</option>
            </select>
            <button class="btn">PUBLIKASIKAN</button>
        </form>
    </div>
    ${b.map(x => `<div style="background:#fff;padding:10px;margin-bottom:5px;border-radius:10px;display:flex;justify-content:space-between">
        <div><b>${x.judul}</b></div>
        <a href="/del/${x._id}" style="color:red">Hapus</a>
    </div>`).join('')}
    <script>
        document.getElementById('formAdd').onsubmit = async (e) => {
            e.preventDefault();
            document.getElementById('loading').style.display='flex';
            const file = document.getElementById('fileInp').files[0];
            const formData = new FormData();
            formData.append('image', file);
            
            try {
                // Step 1: Upload langsung ke ImgBB dari Browser
                const imgRes = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {
                    method: 'POST', body: formData
                });
                const imgData = await imgRes.json();
                
                // Step 2: Kirim data ringan ke Vercel
                await fetch('/add-ajax', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        judul: document.getElementById('judul').value,
                        penulis: document.getElementById('penulis').value,
                        harga: document.getElementById('harga').value,
                        genre: document.getElementById('genre').value,
                        gambar: imgData.data.url
                    })
                });
                location.reload();
            } catch (err) { alert('Gagal!'); document.getElementById('loading').style.display='none'; }
        };
    </script></body></html>`);
});

app.get('/login', (req, res) => res.send('<form action="/login" method="POST" style="padding:50px"><input type="password" name="pw"><button>OK</button></form>'));
app.post('/login', (req, res) => { if(req.body.pw === 'JESTRI0301209') { req.session.admin=true; res.redirect('/admin'); } else res.send('Salah'); });
app.post('/add-ajax', async (req, res) => { if(req.session.admin) { await new Buku(req.body).save(); res.sendStatus(200); } });
app.get('/del/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); } });

module.exports = app;

