const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONNECTION ---
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
app.use(cookieSession({ name: 'jestri_vPro', keys: ['JESTRI_MASTER_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (HOME) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fdfdfd; color: #1a1a1a; }
        .header { position: sticky; top: 0; background: #fff; z-index: 100; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0; }
        .sidebar { position: fixed; top: 0; left: -100%; width: 280px; height: 100%; background: #fff; z-index: 200; transition: 0.4s; padding: 40px 25px; box-shadow: 20px 0 60px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 150; display: none; }
        .overlay.active { display: block; }
        .g-item { display: block; width: 100%; padding: 14px; margin-bottom: 8px; border-radius: 12px; border: none; background: #f8f8f8; text-align: left; font-weight: 700; cursor: pointer; }
        .g-item.active { background: #000; color: #fff; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 15px 15px 100px; max-width: 800px; margin: auto; }
        .card { background: #fff; border-radius: 18px; border: 1px solid #eee; overflow: hidden; transition: 0.3s; position: relative; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; background: #f0f0f0; }
        .info { padding: 12px; }
        .price { font-weight: 800; color: #2ecc71; font-size: 0.9rem; margin: 4px 0; }
        .btn-buy { width: 100%; padding: 10px; border-radius: 10px; border: none; background: #000; color: #fff; font-weight: 800; font-size: 0.75rem; cursor: pointer; }
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .checkout-box { background: #fff; width: 100%; max-width: 350px; border-radius: 25px; padding: 25px; text-align: center; }
        .pay-opt { border: 1.5px solid #eee; border-radius: 15px; padding: 14px; margin-bottom: 12px; display: flex; align-items: center; gap: 12px; cursor: pointer; font-weight: 700; font-size: 0.85rem; }
    </style></head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h2 style="font-weight:800; margin-bottom:30px;">KATEGORI</h2>
        <button class="g-item active" onclick="setG('Semua', this)">Semua Koleksi</button>
        ${LIST_GENRE.map(g => `<button class="g-item" onclick="setG('${g}', this)">${g}</button>`).join('')}
    </div>
    <div class="header"><i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.4rem;"></i><b>E-BOOK JESTRI</b><i class="fa-solid fa-search"></i></div>
    <div class="grid" id="gt"></div>
    
    <div id="modal">
        <div class="checkout-box" id="cb">
            <h3 id="m-judul" style="margin:0 0 5px 0;"></h3>
            <p id="m-harga" class="price" style="margin-bottom:20px;"></p>
            <div class="pay-opt" onclick="openEw()"><i class="fa-solid fa-wallet" style="color:#3b82f6;"></i> E-Wallet (Otomatis)</div>
            <div class="pay-opt" id="wa-btn"><i class="fa-brands fa-whatsapp" style="color:#25d366;"></i> WhatsApp (Manual)</div>
            <div id="ew-area" style="display:none; margin-top:15px; border-top:1px solid #eee; padding-top:15px;">
                <p style="font-size:0.75rem; color:#666;">Transfer Ke: <b>0895327806441</b><br>Upload Bukti TF:</p>
                <input type="file" id="bukti" style="font-size:0.7rem; margin-bottom:10px; width:100%;">
                <button id="btn-p" onclick="kirimBukti()" style="width:100%; padding:15px; background:#000; color:#fff; border-radius:12px; border:none; font-weight:800;">KONFIRMASI BAYAR</button>
            </div>
            <button onclick="location.reload()" style="margin-top:15px; border:none; background:none; color:#ccc;">Batal</button>
        </div>
    </div>

    <script>
        let allBuku = []; let curG = 'Semua'; let selId = '';
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(){ const r = await fetch('/api/buku-json'); allBuku = await r.json(); render(); }
        function setG(g, el){ curG = g; document.querySelectorAll('.g-item').forEach(b=>b.classList.remove('active')); el.classList.add('active'); if(window.innerWidth < 768) tog(); render(); }
        function render(){
            const f = allBuku.filter(b => curG==='Semua' || b.genre===curG);
            const grid = document.getElementById('gt');
            if(f.length === 0){ grid.innerHTML = \`<div style="grid-column:1/-1; text-align:center; padding:100px 20px; color:#ccc; font-weight:800;">Koleksi Belum Tersedia</div>\`; return; }
            grid.innerHTML = f.map(x => \`<div class="card">
                <img src="\${x.gambar}" loading="lazy">
                <div class="info">
                    <h4 style="margin:0; font-size:0.75rem; height:2.4em; overflow:hidden; font-weight:700;">\${x.judul}</h4>
                    <div class="price">Rp \${Number(x.harga).toLocaleString('id-ID')}</div>
                    <button class="btn-buy" onclick="openMod('\${x._id}','\${x.judul}','\${x.harga}','\${x.penulis}')">BELI SEKARANG</button>
                </div>
            </div>\`).join('');
        }
        function openMod(id,j,h,p){
            selId=id; document.getElementById('m-judul').innerText=j; 
            document.getElementById('m-harga').innerText='Rp '+Number(h).toLocaleString('id-ID');
            document.getElementById('modal').style.display='flex';
            const waTxt = encodeURIComponent(\`*ORDER E-BOOK JESTRI*\\n\\n📖 *JUDUL:* \${j.toUpperCase()}\\n✍️ *PENULIS:* \${p.toUpperCase()}\\n💰 *HARGA:* Rp \${Number(h).toLocaleString('id-ID')}\\n\\nSaya ingin membeli ebook ini. Mohon info cara pembayaran\`);
            document.getElementById('wa-btn').onclick = () => window.open('https://wa.me/6285189415489?text='+waTxt);
        }
        function openEw(){ document.getElementById('ew-area').style.display='block'; }
        async function kirimBukti(){
            const f = document.getElementById('bukti').files[0]; if(!f) return alert('Pilih foto bukti!');
            const btn = document.getElementById('btn-p'); btn.innerText='Mengunggah...'; btn.disabled=true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const rI = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const iD = await rI.json();
            const res = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bukuId:selId, bukti:iD.secure_url}) });
            const o = await res.json();
            document.getElementById('cb').innerHTML = \`<h3>Menunggu Validasi</h3><p style="font-size:0.8rem; color:#666;">Admin sedang mengecek transferan kamu. Mohon jangan tutup halaman ini.</p><div id="dl-area"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:#000; margin-top:10px;"></i></div>\`;
            setInterval(async () => {
                const rs = await fetch('/api/order-status/'+o.id); const s = await rs.json();
                if(s.status === 'Approved') document.getElementById('dl-area').innerHTML = \`<a href="\${s.pdfLink}" target="_blank" style="display:block; padding:18px; background:#2ecc71; color:#fff; text-decoration:none; border-radius:15px; font-weight:800; margin-top:20px; box-shadow: 0 10px 20px rgba(46,204,113,0.3);">DOWNLOAD PDF <i class="fa-solid fa-download"></i></a>\`;
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. TAMPILAN ADMIN (FIXED CENTERED & PRO FEATURES) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * { box-sizing: border-box; }
        body { font-family: sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 15px; }
        .wrapper { max-width: 450px; margin: auto; }
        .card-admin { background: #1e293b; padding: 25px; border-radius: 20px; border: 1px solid #334155; margin-bottom: 20px; }
        label { display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 14px; border-radius: 12px; border: 1px solid #334155; background: #0f172a; color: #fff; font-size: 16px; margin-bottom: 15px; outline: none; }
        .btn-up { width: 100%; padding: 16px; border-radius: 14px; border: none; background: #38bdf8; color: #000; font-weight: 800; cursor: pointer; }
        .order-card { background: #1e293b; padding: 15px; border-radius: 15px; margin-bottom: 10px; border: 1px solid #334155; }
        .order-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
        .btn-acc { background: #10b981; color:#fff; padding:10px; border-radius:8px; text-decoration:none; text-align:center; font-size:0.75rem; font-weight:bold; }
        .btn-rej { background: #ef4444; color:#fff; padding:10px; border-radius:8px; text-decoration:none; text-align:center; font-size:0.75rem; font-weight:bold; }
        #loader { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:1000; flex-direction:column; align-items:center; justify-content:center; }
    </style></head><body>
    <div id="loader"><i class="fas fa-spinner fa-spin fa-3x" style="color:#38bdf8"></i><p id="l-txt" style="margin-top:15px;">Proses Data...</p></div>
    <div class="wrapper">
        <h2 style="color:#38bdf8; text-align:center;">JESTRI CONTROL</h2>
        <div class="card-admin">
            <h3>Tambah Buku</h3>
            <div id="form-buku">
                <label>1. JUDUL BUKU</label><input id="j">
                <label>2. NAMA PENULIS</label><input id="p">
                <label>3. HARGA (ANGKA)</label><input id="h" placeholder="Contoh: 5000">
                <label>4. GAMBAR (GALERI)</label><input type="file" id="fi" accept="image/*">
                <label>5. FILE PDF (FILE HP)</label><input type="file" id="fp" accept=".pdf">
                <label>PILIH GENRE</label><select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select>
                <button class="btn-up" onclick="uploadBuku()">SIMPAN BUKU</button>
            </div>
        </div>
        <h3 style="color:#38bdf8;">Persetujuan Transfer (${o.length})</h3>
        ${o.map(x => `<div class="order-card">
            <div style="font-size:0.85rem;"><b>${x.judulBuku}</b></div>
            <a href="${x.bukti}" target="_blank" style="color:#38bdf8; font-size:0.75rem;">Lihat Bukti TF</a>
            <div class="order-btns">
                <a href="/admin/approve/${x._id}" class="btn-acc">SETUJUI</a>
                <a href="/admin/reject/${x._id}" class="btn-rej">TOLAK</a>
            </div>
        </div>`).join('')}
        <h3 style="color:#f87171;">Katalog</h3>
        ${b.map(x => `<div class="order-card" style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.8rem;">${x.judul}</span>
            <a href="/admin/del/${x._id}" style="color:#f87171;"><i class="fa-solid fa-trash"></i></a>
        </div>`).join('')}
    </div>
    <script>
        async function uploadBuku(){
            const fi = document.getElementById('fi').files[0]; const fp = document.getElementById('fp').files[0];
            if(!fi || !fp) return alert("Pilih Gambar & PDF!");
            document.getElementById('loader').style.display='flex';
            const fdI = new FormData(); fdI.append('file', fi); fdI.append('upload_preset', 'ml_default');
            const resI = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fdI});
            const dataI = await resI.json();
            document.getElementById('l-txt').innerText = "Mengamankan PDF...";
            const fdP = new FormData(); fdP.append('file', fp); fdP.append('upload_preset', 'ml_default');
            const resP = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload', {method:'POST', body:fdP});
            const dataP = await resP.json();
            await fetch('/admin/save-buku', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:document.getElementById('h').value, genre:document.getElementById('g').value, gambar:dataI.secure_url, pdfUrl:dataP.secure_url}) });
            location.reload();
        }
    </script></body></html>`);
});

// --- 3. LOGIN PAGE (FIXED CENTERING) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
        body { background:#0f172a; margin:0; height:100vh; display:flex; align-items:center; justify-content:center; font-family:sans-serif; }
        .box { background:#1e293b; padding:40px; border-radius:30px; text-align:center; width:85%; max-width:320px; border:1px solid #334155; }
        input { width:100%; padding:15px; margin:20px 0; border-radius:15px; border:1px solid #334155; background:#0f172a; color:#fff; text-align:center; box-sizing:border-box; font-size:18px; }
        button { width:100%; padding:15px; border-radius:15px; background:#38bdf8; border:none; font-weight:800; cursor:pointer; }
    </style></head><body><div class="box"><h2 style="color:#fff; margin:0;">Admin Jestri</h2><form action="/login" method="POST"><input name="pw" type="password" placeholder="***" required autofocus><button>MASUK</button></form></div></body></html>`);
});

// --- 4. BACKEND LOGIC (FIXED PDF URL) ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save-buku', async (req, res) => {
    if(!req.session.admin) return res.status(403).send("No");
    const { judul, penulis, harga, gambar, pdfUrl, genre } = req.body;
    await new Buku({ judul, penulis, harga: Number(harga), gambar, pdfUrl, genre }).save();
    res.json({ success: true });
});
app.get('/admin/approve/:id', async (req, res) => {
    if(!req.session.admin) return res.redirect('/login');
    const o = await Order.findById(req.params.id); 
    const b = await Buku.findById(o.bukuId);
    // Kita simpan Link PDF asli ke dalam database Order yang sudah diapprove
    await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: b.pdfUrl });
    res.redirect('/admin');
});
app.get('/admin/reject/:id', async (req, res) => {
    if(req.session.admin) await Order.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
});
app.get('/admin/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });
app.get('/api/buku-json', async (req, res) => { res.json(await Buku.find().sort({_id:-1})); });
app.post('/api/order', async (req, res) => {
    const b = await Buku.findById(req.body.bukuId);
    const o = new Order({ bukuId: req.body.bukuId, judulBuku: b.judul, bukti: req.body.bukti });
    await o.save(); res.json({ id: o._id });
});
app.get('/api/order-status/:id', async (req, res) => { res.json(await Order.findById(req.params.id)); });

app.listen(process.env.PORT || 3000);

