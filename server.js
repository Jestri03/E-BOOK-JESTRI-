const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- KONEKSI DATABASE (Percepat Timeout) ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000,
}).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.json({ limit: '5mb' }));
app.use(cookieSession({ name: 'session', keys: ['jestri-key'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API KATALOG (Optimasi Pesan Kosong) ---
app.get('/api/buku', async (req, res) => {
    try {
        const { genre, search } = req.query;
        let q = {};
        if (search) q.judul = { $regex: search, $options: 'i' };
        if (genre && genre !== 'Semua') q.genre = genre;
        
        const data = await Buku.find(q).sort({_id:-1}).lean();
        
        if (!data.length) {
            const pesan = search ? `Pencarian "${search}" tidak ditemukan` : `Buku ${genre} belum tersedia`;
            return res.send(`<div style="grid-column:1/3;text-align:center;padding:100px 20px;color:#ccc;font-weight:700">
                <i class="fa-solid fa- ghost" style="font-size:3rem;display:block;margin-bottom:15px;opacity:0.2"></i>
                ${pesan}
            </div>`);
        }

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
    const initial = await Buku.find().sort({_id:-1}).limit(12).lean();
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; color:#333; }
        .nav { background:#fff; padding:15px 20px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:99; border-bottom:1px solid #f1f1f1; }
        .sidebar { position:fixed; top:0; left:-105%; width:280px; height:100%; background:#fff; z-index:101; transition:0.3s cubic-bezier(0.4, 0, 0.2, 1); padding:20px; box-shadow:0 0 30px rgba(0,0,0,0.1); }
        .sidebar.active { left:0; }
        .overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); z-index:100; display:none; backdrop-filter:blur(3px); }
        .overlay.active { display:block; }
        .genre-btn { display:block; padding:12px 15px; margin-bottom:5px; border-radius:12px; cursor:pointer; color:#555; font-weight:600; transition:0.2s; }
        .genre-btn.active { background:#f0f7ff; color:#2e86de; border-left:4px solid #2e86de; font-weight:800; }
        .container { max-width:800px; margin:auto; padding:15px; }
        .grid { display:grid; grid-template-columns:1fr 1fr; gap:15px; transition: 0.2s; }
        .card { background:#fff; border-radius:15px; overflow:hidden; animation: fadeIn 0.3s ease; }
        .card img { width:100%; aspect-ratio:2/3; object-fit:cover; border-radius:15px; box-shadow:0 5px 15px rgba(0,0,0,0.05); }
        .social { position:fixed; bottom:20px; right:20px; display:flex; flex-direction:column; gap:10px; z-index:90; }
        .icon { width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; text-decoration:none; font-size:1.5rem; box-shadow:0 5px 15px rgba(0,0,0,0.2); }
        .btn-donate { background:#2ed573; color:#fff; border:none; padding:8px 15px; border-radius:20px; font-weight:800; font-size:0.75rem; text-decoration:none; display:inline-block; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        #loading-bar { position:fixed; top:0; left:0; height:3px; background:#2e86de; width:0; transition:0.3s; z-index:1000; }
    </style>
    </head><body>
    <div id="loading-bar"></div>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h2 style="margin-bottom:25px; letter-spacing:-1px">E-BOOK JESTRI</h2>
        <div class="genre-btn active" onclick="load('Semua', this)">Semua Koleksi</div>
        <p style="font-size:0.65rem; color:#ccc; font-weight:800; margin:20px 0 10px 10px">KATEGORI BUKU</p>
        ${genres.map(g => `<div class="genre-btn" onclick="load('${g}', this)">${g}</div>`).join('')}
    </div>
    <div class="nav">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.4rem"></i>
        <b style="font-size:1.1rem">E-BOOK JESTRI</b>
        <a href="https://link.dana.id/qr/39bpg786" class="btn-donate">DONATE</a>
    </div>
    <div class="container">
        <input type="text" oninput="cari(this.value)" style="width:100%; padding:16px; border-radius:18px; border:1px solid #f1f1f1; background:#f9f9f9; margin-bottom:20px; outline:none" placeholder="Cari judul buku...">
        <div class="grid" id="gt">
            ${initial.map(b => `<div class="card" onclick="location.href='https://wa.me/6285189415489?text=Order%20${encodeURIComponent(b.judul)}'"><img src="${b.gambar}"><div style="padding:10px"><h3>${b.judul}</h3><p style="font-size:0.75rem;color:#888">${b.penulis}</p><div style="color:#2ed573;font-weight:800">Rp ${b.harga.toLocaleString('id-ID')}</div></div></div>`).join('')}
        </div>
    </div>
    <div class="social">
        <a href="https://wa.me/6285189415489" class="icon" style="background:#25d366"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="icon" style="background:#e4405f"><i class="fa-brands fa-instagram"></i></a>
        <a href="https://t.me/+62895327806441" class="icon" style="background:#0088cc"><i class="fa-brands fa-telegram"></i></a>
    </div>
    <script>
        const lb = document.getElementById('loading-bar');
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        
        async function load(g, el){
            lb.style.width = '30%';
            document.querySelectorAll('.genre-btn').forEach(b=>b.classList.remove('active')); el.classList.add('active');
            if(window.innerWidth < 768) tog();
            const res = await fetch('/api/buku?genre='+encodeURIComponent(g));
            lb.style.width = '70%';
            document.getElementById('gt').innerHTML = await res.text();
            lb.style.width = '100%';
            setTimeout(() => lb.style.width = '0', 300);
        }

        let t;
        function cari(v){
            clearTimeout(t);
            t = setTimeout(async () => {
                lb.style.width = '50%';
                const res = await fetch('/api/buku?search='+encodeURIComponent(v));
                document.getElementById('gt').innerHTML = await res.text();
                lb.style.width = '100%';
                setTimeout(() => lb.style.width = '0', 300);
            }, 300);
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
        body { font-family:sans-serif; background:#f8f9fa; padding:15px; }
        .box { background:#fff; padding:20px; border-radius:20px; margin-bottom:20px; box-shadow:0 10px 20px rgba(0,0,0,0.05); }
        input, select { width:100%; padding:14px; margin-bottom:12px; border-radius:10px; border:1px solid #eee; box-sizing:border-box; }
        .btn { width:100%; padding:16px; background:#2e86de; color:#fff; border:none; border-radius:12px; font-weight:800; cursor:pointer; }
        #ld { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.9); z-index:999; justify-content:center; align-items:center; flex-direction:column; }
    </style>
    </head><body>
    <div id="ld"><i class="fa-solid fa-cloud-arrow-up fa-bounce" style="font-size:2.5rem; color:#2e86de"></i><p style="font-weight:800; margin-top:15px">Mengunggah ke Galeri...</p></div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
        <h2 style="margin:0">ADMIN PANEL</h2>
        <a href="/" style="text-decoration:none; font-weight:800; color:#2e86de">Web Utama</a>
    </div>
    <div class="box">
        <form id="formAdd">
            <input id="judul" placeholder="Judul Buku" required>
            <input id="penulis" placeholder="Penulis" required>
            <input id="harga" type="number" placeholder="Harga (Contoh: 2500)" required>
            <div style="border:2px dashed #ddd; padding:15px; border-radius:10px; margin-bottom:12px; text-align:center">
                <input type="file" id="fileInp" accept="image/*" required style="border:none; margin:0">
            </div>
            <select id="genre">
                ${['Fiksi','Edukasi','Teknologi','Bisnis','Self Dev','Misteri','Komik','Sejarah'].map(x => `<option>${x}</option>`).join('')}
            </select>
            <button class="btn">PUBLIKASIKAN SEKARANG</button>
        </form>
    </div>
    <h3 style="margin-left:5px">Daftar Buku (${b.length})</h3>
    ${b.map(x => `<div style="background:#fff;padding:15px;margin-bottom:10px;border-radius:15px;display:flex;justify-content:space-between;align-items:center; border:1px solid #eee">
        <div><b>${x.judul}</b><br><small style="color:#888">Rp ${x.harga.toLocaleString()}</small></div>
        <a href="/del/${x._id}" style="color:#ff4757; text-decoration:none; font-weight:800" onclick="return confirm('Hapus buku ini?')">Hapus</a>
    </div>`).join('')}
    <script>
        document.getElementById('formAdd').onsubmit = async (e) => {
            e.preventDefault();
            document.getElementById('ld').style.display='flex';
            const formData = new FormData();
            formData.append('image', document.getElementById('fileInp').files[0]);
            try {
                const imgRes = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', { method: 'POST', body: formData });
                const imgData = await imgRes.json();
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
            } catch (err) { alert('Gagal!'); document.getElementById('ld').style.display='none'; }
        };
    </script></body></html>`);
});

app.get('/login', (req, res) => res.send('<body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f4f4f4"><form action="/login" method="POST" style="background:#fff;padding:30px;border-radius:20px;box-shadow:0 10px 20px rgba(0,0,0,0.1)"><h3>Admin Login</h3><input type="password" name="pw" style="padding:10px;border-radius:5px;border:1px solid #ddd;width:100%;box-sizing:border-box"><button style="width:100%;margin-top:10px;padding:10px;background:#000;color:#fff;border:none;border-radius:5px">Login</button></form></body>'));
app.post('/login', (req, res) => { if(req.body.pw === 'JESTRI0301209') { req.session.admin=true; res.redirect('/admin'); } else res.send('Salah'); });
app.post('/add-ajax', async (req, res) => { if(req.session.admin) { await new Buku(req.body).save(); res.sendStatus(200); } });
app.get('/del/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); } });

module.exports = app;

