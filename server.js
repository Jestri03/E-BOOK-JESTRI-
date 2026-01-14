onst express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONNECTION ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10
}).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieSession({ name: 'session', keys: ['jestri-key'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API PEMBELI (Otomatis & Cepat) ---
app.get('/api/buku', async (req, res) => {
    const { genre, search } = req.query;
    let query = {};
    if (search) query.judul = { $regex: search, $options: 'i' };
    if (genre && genre !== 'Semua') query.genre = genre;
    const data = await Buku.find(query).sort({_id:-1}).lean();
    
    if (data.length === 0) return res.send('<div style="grid-column:1/3;text-align:center;padding:100px 20px;color:#ccc">Buku tidak ditemukan</div>');

    res.send(data.map(b => `
        <div class="card" onclick="location.href='https://wa.me/6285189415489?text=Halo%20Admin,%20saya%20mau%20order%20buku:%20${encodeURIComponent(b.judul)}%20karya%20${encodeURIComponent(b.penulis)}'">
            <img src="${b.gambar}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
            <div class="card-info">
                <h3 style="font-size:0.85rem;margin:10px 0 2px;font-weight:700">${b.judul}</h3>
                <p style="font-size:0.75rem;color:#888;margin:-2px 0 5px 0">${b.penulis}</p>
                <div style="color:#2ed573;font-weight:800;font-size:0.9rem">Rp ${Number(b.harga).toLocaleString('id-ID')}</div>
            </div>
        </div>`).join(''));
});

// --- HALAMAN UTAMA PEMBELI ---
app.get('/', async (req, res) => {
    const genres = ['Fiksi','Edukasi','Teknologi','Bisnis','Self Dev','Misteri','Komik','Sejarah'];
    const initialData = await Buku.find().sort({_id:-1}).limit(12).lean();
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
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
        .card img { width: 100%; aspect-ratio: 2/3; object-fit: cover; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
        .social-float { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 12px; }
        .social-icon { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; font-size: 1.4rem; box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
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
    <div class="social-float">
        <a href="https://wa.me/6285189415489" class="social-icon" style="background:#25d366"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="social-icon" style="background:#e4405f"><i class="fa-brands fa-instagram"></i></a>
        <a href="https://t.me/+62895327806441" class="social-icon" style="background:#0088cc"><i class="fa-brands fa-telegram"></i></a>
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
});

// --- ADMIN DASHBOARD (OPTIMIZED WITH GALLERY UPLOAD) ---
app.get('/login', (req, res) => {
    res.send('<body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#f4f4f4;font-family:sans-serif;margin:0"><form action="/login" method="POST" style="background:#fff;padding:40px;border-radius:30px;width:90%;max-width:400px;box-shadow:0 15px 35px rgba(0,0,0,0.1)"><h2>ADMIN LOGIN</h2><input type="password" name="pw" placeholder="Password" autofocus style="width:100%;padding:18px;margin-bottom:20px;border-radius:15px;border:1px solid #ddd;outline:none"><button style="width:100%;padding:18px;background:#000;color:#fff;border:none;border-radius:15px;font-weight:800;cursor:pointer">MASUK</button></form></body>');
});

app.post('/login', (req, res) => {
    if(req.body.pw === 'JESTRI0301209') { req.session.admin = true; res.redirect('/admin'); }
    else res.send('<script>alert("Password Salah!"); window.location="/login";</script>');
});

app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { font-family: sans-serif; margin: 0; background: #f8f9fa; padding: 15px; }
        .form-card { background: #fff; padding: 25px; border-radius: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 30px; }
        input, select { width: 100%; padding: 16px; margin-bottom: 12px; border-radius: 12px; border: 1px solid #eee; font-size: 1rem; box-sizing: border-box; }
        .btn-add { width: 100%; padding: 18px; background: #2e86de; color: #fff; border: none; border-radius: 15px; font-weight: 800; cursor: pointer; }
        .loading-overlay { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.9); z-index:9999; justify-content:center; align-items:center; flex-direction:column; }
        #preview { width: 100px; height: 140px; object-fit: cover; border-radius: 15px; margin-bottom: 10px; display: none; border: 3px solid #2e86de; }
    </style>
    </head>
    <body>
        <div class="loading-overlay" id="loader">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:3rem;color:#2e86de"></i>
            <p style="font-weight:800;margin-top:15px">Sedang Memproses Buku...</p>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
            <h2>ADMIN MODE</h2>
            <a href="/" style="text-decoration:none; color:#2e86de; font-weight:700">LIHAT TOKO</a>
        </div>

        <div class="form-card">
            <form id="addForm">
                <input id="judul" placeholder="Judul Buku" required>
                <input id="penulis" placeholder="Nama Penulis" required>
                <input id="harga" step="any" type="number" placeholder="Harga (Contoh: 2500)" required>
                
                <div style="background:#f9f9f9; padding:15px; border-radius:15px; margin-bottom:12px; border:1px dashed #ccc">
                    <label style="display:block; font-size:0.8rem; margin-bottom:8px; font-weight:700">UPLOAD COVER (GALERI):</label>
                    <img id="preview">
                    <input type="file" id="fileInput" accept="image/*" required style="border:none; padding:0; background:none">
                </div>

                <select id="genre">
                    ${['Fiksi','Edukasi','Teknologi','Bisnis','Self Dev','Misteri','Komik','Sejarah'].map(g => `<option>${g}</option>`).join('')}
                </select>
                <button type="submit" class="btn-add">PUBLIKASIKAN BUKU</button>
            </form>
        </div>

        <h3>Katalog (${b.length} Buku)</h3>
        ${b.map(x => `
            <div style="background:#fff; padding:15px; border-radius:18px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border:1px solid #eee">
                <div><b>${x.judul}</b><br><small style="color:#999">${x.penulis} • Rp ${x.harga.toLocaleString('id-ID')}</small></div>
                <a href="/del/${x._id}" style="color:#ff4757; text-decoration:none; font-weight:800" onclick="return confirm('Hapus?')">HAPUS</a>
            </div>`).join('')}

        <script>
            const fileInput = document.getElementById('fileInput');
            const preview = document.getElementById('preview');
            const loader = document.getElementById('loader');

            fileInput.onchange = () => {
                const [file] = fileInput.files;
                if (file) { preview.src = URL.createObjectURL(file); preview.style.display = 'block'; }
            };

            document.getElementById('addForm').onsubmit = async (e) => {
                e.preventDefault();
                loader.style.display = 'flex';

                try {
                    // 1. Upload ke ImgBB dengan API Key lo
                    const formData = new FormData();
                    formData.append('image', fileInput.files[0]);
                    
                    const imgRes = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {
                        method: 'POST',
                        body: formData
                    });
                    const imgData = await imgRes.json();
                    
                    if(!imgData.success) throw new Error('Gagal upload gambar');

                    // 2. Simpan ke database
                    const res = await fetch('/add-ajax', {
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

                    if(res.ok) window.location.reload();
                } catch (err) {
                    alert('Error: ' + err.message);
                    loader.style.display = 'none';
                }
            };
        </script>
    </body></html>`);
});

app.post('/add-ajax', async (req, res) => {
    if(req.session.admin) {
        let { judul, penulis, harga, gambar, genre } = req.body;
        // Pembersihan harga dari input teks (jika ada titik/koma)
        let cleanHarga = Number(harga.toString().replace(/[^0-9.]/g, ''));
        await new Buku({ judul, penulis, harga: cleanHarga, gambar, genre }).save();
        res.sendStatus(200);
    } else res.sendStatus(403);
});

app.get('/del/:id', async (req, res) => {
    if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); }
    else res.redirect('/login');
});

module.exports = app;

