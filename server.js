const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI);

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, pdfUrl: String, genre: String 
});

const Order = mongoose.model('Order', { 
    bukuId: String, judulBuku: String, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String 
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'jestri_final', keys: ['JESTRI_SECURE_77'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API UNTUK SIMPAN DATA KE DB ---
app.post('/admin/save-buku', async (req, res) => {
    if(!req.session.admin) return res.status(403).send("Forbidden");
    const { judul, penulis, harga, gambar, pdfUrl, genre } = req.body;
    const cleanHarga = Number(harga.replace(/[^0-9]/g, ''));
    await new Buku({ judul, penulis, harga: cleanHarga, gambar, pdfUrl, genre }).save();
    res.json({ success: true });
});

// --- DASHBOARD ADMIN (TAMPILAN MEWAH & ANTI-GOYANG) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 15px; }
        .container { max-width: 450px; margin: auto; }
        .glass-card { background: #1e293b; padding: 25px; border-radius: 20px; border: 1px solid #334155; margin-bottom: 20px; }
        h2 { color: #38bdf8; font-size: 1.2rem; margin-bottom: 20px; text-align: center; }
        .f-group { margin-bottom: 15px; }
        label { display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 5px; }
        input, select { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #334155; background: #0f172a; color: #fff; font-size: 16px; outline: none; }
        .btn-upload { width: 100%; padding: 15px; border-radius: 12px; border: none; background: #38bdf8; color: #000; font-weight: 800; cursor: pointer; margin-top: 10px; }
        .list-box { background: #1e293b; padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
        .loading-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:1000; flex-direction:column; align-items:center; justify-content:center; }
    </style></head><body>
    <div class="loading-overlay" id="loader">
        <i class="fas fa-spinner fa-spin fa-3x" style="color:#38bdf8"></i>
        <p style="margin-top:15px;" id="loadText">Sedang Mengunggah E-Book...</p>
    </div>
    <div class="container">
        <h2>PANEL ADMIN JESTRI</h2>
        <div class="glass-card">
            <div class="f-group"><label>1. Judul Buku</label><input id="judul"></div>
            <div class="f-group"><label>2. Nama Penulis</label><input id="penulis"></div>
            <div class="f-group"><label>3. Harga Buku</label><input id="harga" placeholder="Contoh: 2.500"></div>
            <div class="f-group"><label>4. Gambar Buku (Galeri)</label><input type="file" id="f-img" accept="image/*"></div>
            <div class="f-group"><label>5. File PDF E-Book (Permanen)</label><input type="file" id="f-pdf" accept=".pdf"></div>
            <div class="f-group"><label>Genre</label><select id="genre">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select></div>
            <button class="btn-upload" onclick="prosesUpload()">UPLOAD & SIMPAN</button>
        </div>

        <h3 style="color:#38bdf8; font-size:1rem;">Persetujuan Transfer (${o.length})</h3>
        ${o.map(x => `<div class="list-box">
            <div><small>${x.judulBuku}</small><br><a href="${x.bukti}" target="_blank" style="color:#38bdf8; font-size:0.7rem;">Cek Foto</a></div>
            <a href="/admin/approve/${x._id}" style="background:#2ecc71; color:#fff; padding:8px 12px; border-radius:8px; text-decoration:none; font-size:0.7rem; font-weight:bold;">SETUJUI</a>
        </div>`).join('')}

        <h3 style="color:#f87171; font-size:1rem; margin-top:20px;">Katalog Buku</h3>
        ${b.map(x => `<div class="list-box">
            <span style="font-size:0.8rem;">${x.judul}</span>
            <a href="/admin/del/${x._id}" style="color:#f87171; text-decoration:none;"><i class="fa-solid fa-trash"></i></a>
        </div>`).join('')}
    </div>

    <script>
        async function prosesUpload() {
            const fImg = document.getElementById('f-img').files[0];
            const fPdf = document.getElementById('f-pdf').files[0];
            if(!fImg || !fPdf) return alert("Pilih file Gambar dan PDF dulu!");

            document.getElementById('loader').style.display = 'flex';
            
            try {
                // 1. Upload Gambar ke Cloudinary
                const fdImg = new FormData();
                fdImg.append('file', fImg);
                fdImg.append('upload_preset', 'ml_default'); // Preset Cloudinary
                const resImg = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', { method:'POST', body:fdImg });
                const dataImg = await resImg.json();

                // 2. Upload PDF ke Cloudinary (Metode Raw)
                document.getElementById('loadText').innerText = "Mengunggah PDF ke Penyimpanan Permanen...";
                const fdPdf = new FormData();
                fdPdf.append('file', fPdf);
                fdPdf.append('upload_preset', 'ml_default');
                const resPdf = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload', { method:'POST', body:fdPdf });
                const dataPdf = await resPdf.json();

                // 3. Simpan ke Database kita
                await fetch('/admin/save-buku', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        judul: document.getElementById('judul').value,
                        penulis: document.getElementById('penulis').value,
                        harga: document.getElementById('harga').value,
                        genre: document.getElementById('genre').value,
                        gambar: dataImg.secure_url,
                        pdfUrl: dataPdf.secure_url
                    })
                });

                location.reload();
            } catch (err) {
                alert("Gagal Upload: " + err.message);
                document.getElementById('loader').style.display = 'none';
            }
        }
    </script>
    </body></html>`);
});

// --- LOGIN & DASHBOARD LOGIC ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
        body { background:#0f172a; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif; }
        .login-box { background:#1e293b; padding:40px; border-radius:25px; text-align:center; width:85%; max-width:320px; border:1px solid #334155; }
        input { width:100%; padding:15px; margin:20px 0; border-radius:12px; border:1px solid #334155; background:#0f172a; color:#fff; text-align:center; font-size:18px; }
        button { width:100%; padding:15px; border-radius:12px; border:none; background:#38bdf8; color:#000; font-weight:800; font-size:16px; cursor:pointer; }
    </style></head><body>
    <div class="login-box">
        <h2 style="color:#fff; margin:0;">Admin Access</h2>
        <form action="/login" method="POST">
            <input name="pw" type="password" placeholder="Password" required autofocus>
            <button>MASUK KE PANEL</button>
        </form>
    </div></body></html>`);
});

app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.get('/admin/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });
app.get('/admin/approve/:id', async (req, res) => {
    const o = await Order.findById(req.params.id);
    const b = await Buku.findById(o.bukuId);
    await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: b.pdfUrl });
    res.redirect('/admin');
});

// --- API UNTUK PEMBELI ---
app.post('/api/order', async (req, res) => {
    const b = await Buku.findById(req.body.bukuId);
    const o = new Order({ bukuId: req.body.bukuId, judulBuku: b.judul, bukti: req.body.bukti });
    await o.save();
    res.json({ id: o._id });
});

app.get('/api/order-status/:id', async (req, res) => {
    const o = await Order.findById(req.params.id);
    res.json(o);
});

app.get('/api/buku-json', async (req, res) => {
    const data = await Buku.find().sort({_id:-1}).lean();
    res.json(data);
});

app.listen(process.env.PORT || 3000);

