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
app.use(cookieSession({ name: 'jestri_vFinal_Fix', keys: ['JESTRI_SECURE_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (FIX DOWNLOAD OTOMATIS) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; color: #1a1a1a; }
        .header { position: sticky; top: 0; background: #fff; z-index: 100; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 15px 15px 100px; max-width: 800px; margin: auto; }
        .card { background: #fff; border-radius: 15px; border: 1px solid #f0f0f0; overflow: hidden; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; background:#f9f9f9; }
        .price { font-weight: 800; color: #2ecc71; font-size: 0.9rem; }
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .checkout-box { background: #fff; width: 100%; max-width: 350px; border-radius: 20px; padding: 25px; text-align: center; }
        .btn-p { width: 100%; padding: 15px; background: #000; color: #fff; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; }
    </style></head><body>
    <div class="header"><b>E-BOOK JESTRI</b><i class="fa-solid fa-shopping-bag"></i></div>
    <div class="grid" id="gt"></div>
    <div id="modal">
        <div class="checkout-box" id="cb">
            <h3 id="m-judul"></h3>
            <p id="m-harga" class="price"></p>
            <div id="ew-area" style="text-align:left; border-top:1px solid #eee; padding-top:15px;">
                <p style="font-size:0.75rem;">Transfer Ke: <b>0895327806441</b></p>
                <input type="file" id="bukti" style="width:100%; margin-bottom:15px;">
                <button id="btn-pay" class="btn-p" onclick="kirimBukti()">KIRIM BUKTI</button>
            </div>
            <button onclick="location.reload()" style="margin-top:10px; border:none; background:none; color:#ccc;">Batal</button>
        </div>
    </div>
    <script>
        let allBuku = []; let selId = '';
        async function load(){ const r = await fetch('/api/buku-json'); allBuku = await r.json(); render(); }
        function render(){
            document.getElementById('gt').innerHTML = allBuku.map(x => \`<div class="card">
                <img src="\${x.gambar}">
                <div style="padding:10px;">
                    <h4 style="margin:0; font-size:0.75rem; height:2.4em; overflow:hidden;">\${x.judul}</h4>
                    <div class="price">Rp \${Number(x.harga).toLocaleString('id-ID')}</div>
                    <button onclick="openMod('\${x._id}','\${x.judul}','\${x.harga}')" style="width:100%; padding:8px; background:#000; color:#fff; border-radius:8px; border:none; margin-top:8px; font-weight:800;">BELI</button>
                </div>
            </div>\`).join('');
        }
        function openMod(id,j,h){ selId=id; document.getElementById('m-judul').innerText=j; document.getElementById('m-harga').innerText='Rp '+Number(h).toLocaleString('id-ID'); document.getElementById('modal').style.display='flex'; }
        async function kirimBukti(){
            const f = document.getElementById('bukti').files[0]; if(!f) return alert('Pilih bukti!');
            document.getElementById('btn-pay').innerText = "Mengunggah...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const rI = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const iD = await rI.json();
            const res = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bukuId:selId, bukti:iD.secure_url}) });
            const o = await res.json();
            document.getElementById('cb').innerHTML = \`<h3>Sedang Dicek...</h3><p style="font-size:0.8rem;">Mohon tunggu, jangan tutup halaman. Tombol download muncul otomatis.</p><div id="dl-area"></div>\`;
            setInterval(async () => {
                const rs = await fetch('/api/order-status/'+o.id); const s = await rs.json();
                if(s.status === 'Approved') {
                    // MODIFIKASI URL AGAR DOWNLOAD OTOMATIS
                    const finalLink = s.pdfLink.replace('/upload/', '/upload/fl_attachment/');
                    document.getElementById('dl-area').innerHTML = \`<a href="\${finalLink}" download style="display:block; padding:15px; background:#2ecc71; color:#fff; text-decoration:none; border-radius:12px; font-weight:800; margin-top:20px;">SIMPAN PDF KE HP <i class="fa-solid fa-download"></i></a>\`;
                }
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. ADMIN LOGIN (FIXED NO BERGESER) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        body { background:#0f172a; margin:0; height:100vh; display:flex; align-items:center; justify-content:center; font-family:sans-serif; overflow:hidden; }
        .box { background:#1e293b; padding:30px; border-radius:24px; text-align:center; width:300px; border:1px solid #334155; box-shadow:0 20px 50px rgba(0,0,0,0.3); }
        input { width:100%; padding:14px; margin:20px 0; border-radius:12px; border:1px solid #334155; background:#0f172a; color:#fff; text-align:center; font-size:16px; outline:none; box-sizing:border-box; }
        button { width:100%; padding:14px; border-radius:12px; background:#38bdf8; border:none; font-weight:800; cursor:pointer; }
    </style></head><body><div class="box">
        <h2 style="color:#fff; margin:0;">Admin Jestri</h2>
        <form action="/login" method="POST">
            <input name="pw" type="password" placeholder="Password" required>
            <button type="submit">LOGIN</button>
        </form>
    </div></body></html>`);
});

// --- 3. DASHBOARD ADMIN (WITH APPROVE/REJECT) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * { box-sizing: border-box; }
        body { font-family: sans-serif; background: #0b0f19; color: #fff; padding: 15px; margin: 0; }
        .container { max-width: 450px; margin: auto; }
        .card { background: #161e2d; padding: 20px; border-radius: 20px; margin-bottom: 20px; border: 1px solid #2d3748; }
        input, select { width: 100%; padding: 12px; margin: 8px 0 15px; border-radius: 10px; border: 1px solid #2d3748; background: #0b0f19; color: #fff; }
        .btn { width: 100%; padding: 15px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; }
        .btn-up { background: #38bdf8; color: #000; }
        .item { background: #161e2d; padding: 15px; border-radius: 15px; margin-bottom: 10px; border: 1px solid #2d3748; }
        .btn-acc { background: #10b981; color:#fff; padding:8px 12px; border-radius:8px; text-decoration:none; font-size:0.7rem; font-weight:bold; }
        .btn-rej { background: #ef4444; color:#fff; padding:8px 12px; border-radius:8px; text-decoration:none; font-size:0.7rem; font-weight:bold; }
    </style></head><body>
    <div class="container">
        <h2>PANEL ADMIN</h2>
        <div class="card">
            <label>1. Judul</label><input id="j">
            <label>2. Penulis</label><input id="p">
            <label>3. Harga</label><input id="h">
            <label>4. Gambar Buku</label><input type="file" id="fi">
            <label>5. File PDF</label><input type="file" id="fp">
            <label>Genre</label><select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select>
            <button class="btn btn-up" onclick="upload()">SIMPAN BUKU</button>
        </div>
        <h3>Persetujuan Transfer</h3>
        ${o.map(x => `<div class="item">
            <b>${x.judulBuku}</b><br><a href="${x.bukti}" target="_blank" style="color:#38bdf8; font-size:0.7rem;">Cek Bukti</a>
            <div style="margin-top:10px; display:flex; gap:10px;">
                <a href="/admin/approve/${x._id}" class="btn-acc">SETUJUI</a>
                <a href="/admin/reject/${x._id}" class="btn-rej">TOLAK</a>
            </div>
        </div>`).join('')}
    </div>
    <script>
        async function upload(){
            const fi = document.getElementById('fi').files[0]; const fp = document.getElementById('fp').files[0];
            if(!fi || !fp) return alert("Pilih file!");
            const fdI = new FormData(); fdI.append('file', fi); fdI.append('upload_preset', 'ml_default');
            const resI = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fdI});
            const dataI = await resI.json();
            const fdP = new FormData(); fdP.append('file', fp); fdP.append('upload_preset', 'ml_default');
            const resP = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload', {method:'POST', body:fdP});
            const dataP = await resP.json();
            await fetch('/admin/save-buku', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:document.getElementById('h').value, genre:document.getElementById('g').value, gambar:dataI.secure_url, pdfUrl:dataP.secure_url}) });
            location.reload();
        }
    </script></body></html>`);
});

// --- 4. BACKEND PROCESS ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save-buku', async (req, res) => {
    if(!req.session.admin) return res.status(403).send("No");
    await new Buku({ ...req.body, harga: Number(req.body.harga) }).save();
    res.json({ success: true });
});
app.get('/admin/approve/:id', async (req, res) => {
    const o = await Order.findById(req.params.id); const b = await Buku.findById(o.bukuId);
    await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: b.pdfUrl });
    res.redirect('/admin');
});
app.get('/admin/reject/:id', async (req, res) => {
    await Order.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
});
app.get('/api/buku-json', async (req, res) => { res.json(await Buku.find().sort({_id:-1})); });
app.post('/api/order', async (req, res) => {
    const b = await Buku.findById(req.body.bukuId);
    const o = new Order({ bukuId: req.body.bukuId, judulBuku: b.judul, bukti: req.body.bukti });
    await o.save(); res.json({ id: o._id });
});
app.get('/api/order-status/:id', async (req, res) => { res.json(await Order.findById(req.params.id)); });

app.listen(process.env.PORT || 3000);

