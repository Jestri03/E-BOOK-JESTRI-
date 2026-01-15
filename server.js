const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, pdfUrl: String, genre: String 
});

const Order = mongoose.model('Order', { 
    bukuId: String, judulBuku: String, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String 
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'jestri_vFinal', keys: ['JESTRI_KING_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (HOME) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; color: #1a1a1a; overflow-x: hidden; }
        .header { position: sticky; top: 0; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); z-index: 100; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0; }
        .sidebar { position: fixed; top: 0; left: -100%; width: 280px; height: 100%; background: #fff; z-index: 200; transition: 0.4s; padding: 40px 25px; box-shadow: 20px 0 60px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 150; display: none; }
        .overlay.active { display: block; }
        .g-item { display: block; width: 100%; padding: 14px; margin-bottom: 8px; border-radius: 12px; border: none; background: #f8f8f8; text-align: left; font-weight: 700; cursor: pointer; }
        .g-item.active { background: #000; color: #fff; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 15px 15px 100px; max-width: 800px; margin: auto; }
        .card { background: #fff; border-radius: 15px; border: 1px solid #f0f0f0; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .price { font-weight: 800; color: #2ecc71; font-size: 0.9rem; }
        .social-float { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 110; }
        .s-link { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.2rem; text-decoration: none; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .checkout-box { background: #fff; width: 100%; max-width: 350px; border-radius: 20px; padding: 25px; text-align: center; }
        .pay-opt { border: 1px solid #eee; border-radius: 12px; padding: 12px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 700; font-size: 0.85rem; }
    </style></head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h2 style="font-weight:800;">MENU</h2>
        <button class="g-item active" onclick="setG('Semua', this)">Semua Koleksi</button>
        ${LIST_GENRE.map(g => `<button class="g-item" onclick="setG('${g}', this)">${g}</button>`).join('')}
    </div>
    <div class="header"><i class="fa-solid fa-bars-staggered" onclick="tog()" style="cursor:pointer;"></i><b>E-BOOK JESTRI</b><i class="fa-solid fa-search"></i></div>
    <div class="grid" id="gt"></div>
    <div class="social-float">
        <a href="https://wa.me/6285189415489" class="s-link" style="background:#25d366;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="s-link" style="background:#e4405f;"><i class="fa-brands fa-instagram"></i></a>
    </div>
    <div id="modal">
        <div class="checkout-box" id="cb">
            <h3 id="m-judul" style="margin:0;"></h3>
            <p id="m-harga" class="price" style="margin-bottom:20px;"></p>
            <div class="pay-opt" onclick="openEw()"><i class="fa-solid fa-wallet" style="color:#3b82f6;"></i> E-Wallet (DANA/OVO/GOPAY)</div>
            <div class="pay-opt" id="wa-btn"><i class="fa-brands fa-whatsapp" style="color:#25d366;"></i> WhatsApp (Manual)</div>
            <div id="ew-area" style="display:none; margin-top:15px; border-top:1px solid #eee; padding-top:15px;">
                <p style="font-size:0.75rem;">Transfer: <b>0895327806441</b><br>Kirim Bukti TF:</p>
                <input type="file" id="bukti" style="font-size:0.7rem; margin-bottom:10px; width:100%;">
                <button id="btn-p" onclick="kirimBukti()" style="width:100%; padding:15px; background:#000; color:#fff; border-radius:12px; border:none; font-weight:800;">KIRIM BUKTI</button>
            </div>
            <button onclick="location.reload()" style="margin-top:10px; border:none; background:none; color:#ccc;">Batal</button>
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
            if(f.length === 0){ grid.innerHTML = \`<div style="grid-column:1/-1; text-align:center; padding:80px 20px; color:#999; font-weight:700;">Buku genre \${curG} belum ada</div>\`; return; }
            grid.innerHTML = f.map(x => \`<div class="card">
                <img src="\${x.gambar}">
                <div style="padding:10px;">
                    <h4 style="margin:0; font-size:0.75rem; height:2.4em; overflow:hidden;">\${x.judul}</h4>
                    <div class="price">Rp \${x.harga.toLocaleString('id-ID')}</div>
                    <button onclick="openMod('\${x._id}','\${x.judul}','\${x.harga}','\${x.penulis}')" style="width:100%; padding:10px; background:#000; color:#fff; border-radius:10px; border:none; margin-top:8px; font-weight:800; font-size:0.7rem;">BELI</button>
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
            const btn = document.getElementById('btn-p'); btn.innerText='Mengirim...'; btn.disabled=true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const rI = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const iD = await rI.json();
            const res = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bukuId:selId, bukti:iD.secure_url}) });
            const o = await res.json();
            document.getElementById('cb').innerHTML = \`<h3>Menunggu Persetujuan</h3><p style="font-size:0.8rem;">Admin akan mengecek bukti TF. Jika OK, link download muncul otomatis di sini.</p><div id="dl-area"></div>\`;
            setInterval(async () => {
                const rs = await fetch('/api/order-status/'+o.id); const s = await rs.json();
                if(s.status === 'Approved') document.getElementById('dl-area').innerHTML = \`<a href="\${s.pdfLink}" target="_blank" style="display:block; padding:15px; background:#2ecc71; color:#fff; text-decoration:none; border-radius:12px; font-weight:800; margin-top:20px;">DOWNLOAD PDF</a>\`;
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. DASHBOARD ADMIN (PREMIUM DARK) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * { box-sizing: border-box; }
        body { font-family: sans-serif; background: #0b0f19; color: #e2e8f0; margin: 0; padding: 15px; }
        .wrapper { max-width: 450px; margin: auto; }
        .glass-card { background: #161e2d; padding: 25px; border-radius: 20px; border: 1px solid #2d3748; margin-bottom: 20px; }
        h2 { color: #38bdf8; font-size: 1.1rem; margin-bottom: 20px; text-align: center; }
        .f-group { margin-bottom: 15px; }
        label { display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #2d3748; background: #0b0f19; color: #fff; font-size: 16px; outline: none; }
        .btn-up { width: 100%; padding: 15px; border-radius: 12px; border: none; background: #38bdf8; color: #000; font-weight: 800; cursor: pointer; }
        .list-box { background: #161e2d; padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid #38bdf8; }
        .loader { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:1000; flex-direction:column; align-items:center; justify-content:center; }
    </style></head><body>
    <div class="loader" id="ldr"><i class="fas fa-spinner fa-spin fa-3x" style="color:#38bdf8"></i><p id="ldrTxt" style="margin-top:15px;">Mengunggah...</p></div>
    <div class="wrapper">
        <h2>PANEL ADMIN JESTRI</h2>
        <div class="glass-card">
            <div class="f-group"><label>1. JUDUL BUKU</label><input id="j"></div>
            <div class="f-group"><label>2. NAMA PENULIS</label><input id="p"></div>
            <div class="f-group"><label>3. HARGA BUKU</label><input id="h" placeholder="2.500"></div>
            <div class="f-group"><label>4. GAMBAR (GALERI)</label><input type="file" id="fi" accept="image/*"></div>
            <div class="f-group"><label>5. FILE PDF (FILE HP)</label><input type="file" id="fp" accept=".pdf"></div>
            <div class="f-group"><label>GENRE</label><select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select></div>
            <button class="btn-up" onclick="up()">UPLOAD & SIMPAN</button>
        </div>
        <h3 style="color:#38bdf8; font-size:0.9rem;">Persetujuan Transfer (${o.length})</h3>
        ${o.map(x => `<div class="list-box">
            <div><small>${x.judulBuku}</small><br><a href="${x.bukti}" target="_blank" style="color:#38bdf8; font-size:0.7rem;">Cek Foto</a></div>
            <a href="/admin/approve/${x._id}" style="background:#2ecc71; color:#fff; padding:8px 12px; border-radius:8px; text-decoration:none; font-size:0.7rem; font-weight:bold;">SETUJUI</a>
        </div>`).join('')}
        <h3 style="color:#f87171; font-size:0.9rem; margin-top:20px;">Katalog Buku</h3>
        ${b.map(x => `<div class="list-box"><span>${x.judul}</span><a href="/admin/del/${x._id}" style="color:#f87171;"><i class="fa-solid fa-trash"></i></a></div>`).join('')}
    </div>
    <script>
        async function up(){
            const fi = document.getElementById('fi').files[0]; const fp = document.getElementById('fp').files[0];
            if(!fi || !fp) return alert("Pilih Gambar & PDF!");
            document.getElementById('ldr').style.display='flex';
            const fdI = new FormData(); fdI.append('file', fi); fdI.append('upload_preset', 'ml_default');
            const resI = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fdI});
            const dataI = await resI.json();
            document.getElementById('ldrTxt').innerText = "Unggah PDF Permanen...";
            const fdP = new FormData(); fdP.append('file', fp); fdP.append('upload_preset', 'ml_default');
            const resP = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload', {method:'POST', body:fdP});
            const dataP = await resP.json();
            await fetch('/admin/save-buku', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:document.getElementById('h').value, genre:document.getElementById('g').value, gambar:dataI.secure_url, pdfUrl:dataP.secure_url}) });
            location.reload();
        }
    </script></body></html>`);
});

// --- 3. LOGIC & API ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0b0f19; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif;"><div style="background:#161e2d; padding:40px; border-radius:30px; text-align:center; width:85%; max-width:320px; border:1px solid #2d3748;"><h2 style="color:#fff;">Admin</h2><form action="/login" method="POST"><input name="pw" type="password" placeholder="***" style="width:100%; padding:15px; margin:20px 0; border-radius:15px; border:1px solid #2d3748; background:#0b0f19; color:#fff; text-align:center;"><button style="width:100%; padding:15px; border-radius:15px; background:#38bdf8; border:none; font-weight:800;">MASUK</button></form></div></body>`);
});
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save-buku', async (req, res) => {
    if(!req.session.admin) return res.status(403).send("No");
    const cleanHarga = Number(req.body.harga.replace(/[^0-9]/g, ''));
    await new Buku({ ...req.body, harga: cleanHarga }).save();
    res.json({ success: true });
});
app.get('/admin/approve/:id', async (req, res) => {
    const o = await Order.findById(req.params.id); const b = await Buku.findById(o.bukuId);
    await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: b.pdfUrl });
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

