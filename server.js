const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONNECTION ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("✅ DB Connected")).catch(e => console.log(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String });

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Misteri','Komik','Sejarah'];

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieSession({ name: 'jestri_final', keys: ['JESTRI_STRICT_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (WARNA SESUAI REQUEST SEBELUMNYA) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JESTRI STORE</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        :root { --merah-gelap: #7f1d1d; --biru-terang: #0ea5e9; --hijau-gelap: #064e3b; --hitam-terang: #1e293b; --putih-terang: #f8fafc; --ungu-gelap: #4c1d95; }
        * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { margin: 0; background: var(--putih-terang); }
        header { background: var(--biru-terang); padding: 15px 20px; color: white; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 15px; }
        .card { background: white; border-radius: 12px; overflow: hidden; border: 2px solid #e2e8f0; display: flex; flex-direction: column; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .card-body { padding: 10px; }
        .btn-buy { width: 100%; padding: 10px; background: var(--biru-terang); color: white; border: none; border-radius: 8px; font-weight: 800; }
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: var(--hitam-terang); z-index: 5000; transition: 0.3s; padding: 25px; color: white; }
        .sidebar.active { left: 0; }
        .nav-item { padding: 12px 15px; margin-bottom: 8px; border-radius: 10px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); }
        .nav-item.active { background: var(--biru-terang); }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 4500; display: none; }
    </style></head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <aside class="sidebar" id="sb">
        <h2 style="color:var(--biru-terang);">GENRE</h2>
        <div class="nav-item active" onclick="setG('Semua', this)">Semua Koleksi</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" style="background:var(--ungu-gelap); padding:15px; border-radius:12px; text-align:center; color:white; text-decoration:none; display:block; margin-top:20px; font-weight:800;">DONASI ADMIN</a>
    </aside>
    <header>
        <i class="fa-solid fa-bars" onclick="tog()" style="font-size:1.5rem; cursor:pointer;"></i>
        <div style="font-weight:900;">JESTRI STORE</div>
        <div onclick="openCart()" style="position:relative; cursor:pointer;"><i class="fa-solid fa-cart-shopping"></i><span id="cc" style="position:absolute; top:-8px; right:-10px; background:var(--merah-gelap); padding:2px 6px; border-radius:50%; font-size:0.6rem;">0</span></div>
    </header>
    <main class="grid" id="mainGrid"></main>
    <script>
        let allB = [], cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').style.display = document.getElementById('sb').classList.contains('active') ? 'block' : 'none'; }
        async function load(){ const r = await fetch('/api/buku-json'); allB = await r.json(); render(allB); }
        function render(data){
            document.getElementById('mainGrid').innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}">
                    <div class="card-body">
                        <div style="font-weight:800; font-size:0.85rem;">\${x.judul}</div>
                        <div style="font-size:0.7rem; color:gray;">Oleh: \${x.penulis}</div>
                        <div style="color:var(--hijau-gelap); font-weight:800; margin:5px 0;">Rp \${x.harga.toLocaleString()}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">BELI</button>
                    </div>
                </div>\`).join('');
        }
        function add(id){ const b = allB.find(x => x._id === id); if(!cart.find(x => x._id === id)) cart.push(b); document.getElementById('cc').innerText = cart.length; }
        function openCart(){
            if(!cart.length) return alert("Kosong!");
            let total = cart.reduce((a,b)=>a+b.harga,0);
            const proof = confirm("Total: Rp " + total.toLocaleString() + ". Lanjut bayar?");
            if(proof) {
                const f = document.createElement('input'); f.type='file'; f.onchange = async () => {
                    const fd = new FormData(); fd.append('file', f.files[0]); fd.append('upload_preset', 'ml_default');
                    const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                    await fetch('/api/order', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ items: cart, total: total, bukti: up.secure_url }) });
                    alert("Pesanan dikirim! Cek berkala."); location.reload();
                }; f.click();
            }
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (SESUAI REQUEST CSS GAMBAR) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; background: #1e293b; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
        .login { 
            position: absolute; 
            inset: 60px; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            flex-direction: column; 
            border-radius: 10px; 
            background: #00000033; 
            color: #fff; 
            z-index: 1000; 
            box-shadow: inset 0 10px 20px #00000080; 
            border-bottom: 2px solid #ffffff80; 
            transition: 0.5s; 
            overflow: hidden; 
        }
        input { 
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); 
            padding: 12px; border-radius: 8px; color: white; text-align: center; margin-bottom: 15px; outline: none; width: 70%;
        }
        button { 
            background: #0ea5e9; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 70%;
        }
    </style></head><body>
    <form class="login" action="/login" method="POST">
        <h2 style="letter-spacing:2px; margin-bottom:20px;">ADMIN</h2>
        <input name="pw" type="password" placeholder="Passcode">
        <button type="submit">ENTER</button>
    </form></body></html>`);
});

app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });

// --- 3. DASHBOARD ADMIN (FIXED & PRESISI) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});

    // Perbaikan syntax agar tidak muncul teks kodenya di layar
    const listO = o.map(x => `
        <div style="background:white; padding:15px; border-radius:15px; margin-bottom:12px; border:2px solid #e2e8f0; border-left:8px solid #0ea5e9;">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <b style="color:#064e3b;">Rp ${x.total.toLocaleString()}</b>
                <a href="${x.bukti}" target="_blank" style="color:#0ea5e9; font-size:0.8rem; font-weight:700;">BUKTI BAYAR</a>
            </div>
            <input type="file" id="pdf-${x._id}" style="font-size:0.7rem; width:100%; margin-bottom:8px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                <button onclick="acc('${x._id}')" style="padding:10px; background:#064e3b; color:white; border:none; border-radius:8px; font-weight:bold;">SETUJU</button>
                <button onclick="delO('${x._id}')" style="padding:10px; background:#7f1d1d; color:white; border:none; border-radius:8px; font-weight:bold;">TOLAK</button>
            </div>
        </div>`).join('');

    const listB = b.map(x => `
        <div style="display:flex; align-items:center; gap:10px; padding:10px; background:white; border-bottom:2px solid #f1f5f9;">
            <img src="${x.gambar}" style="width:35px; height:45px; object-fit:cover; border-radius:4px;">
            <div style="flex-grow:1;"><div style="font-weight:700; font-size:0.8rem;">${x.judul}</div></div>
            <button onclick="delB('${x._id}')" style="color:#7f1d1d; border:none; background:none; font-size:1.2rem;"><i class="fa-solid fa-trash"></i></button>
        </div>`).join('');

    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { font-family:sans-serif; background:#f1f5f9; margin:0; padding:20px; }
        .box { background:white; padding:20px; border-radius:18px; border:2px solid #e2e8f0; margin-bottom:20px; }
        input { width:100%; padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; }
        button { cursor:pointer; }
    </style></head><body>
    <h2>Panel Admin</h2>
    <div class="box">
        <h3>Posting Buku Baru</h3>
        <input id="j" placeholder="Judul Buku"><input id="p" placeholder="Penulis"><input id="h" type="number" placeholder="Harga">
        <select id="g" style="width:100%; padding:10px; margin-bottom:10px;">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
        <input type="file" id="fi">
        <button onclick="addB()" id="btnS" style="width:100%; padding:15px; background:#1e293b; color:white; border-radius:10px; font-weight:bold;">POSTING</button>
    </div>
    <h3>Pesanan Masuk (${o.length})</h3>
    <div>${listO || '<p>Tidak ada pesanan</p>'}</div>
    <h3>Katalog Buku</h3>
    <div class="box" style="padding:0;">${listB}</div>
    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih cover!");
            const btn = document.getElementById('btnS'); btn.innerText = "...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f = document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Pilih PDF!");
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
        async function delO(id){ if(confirm('Hapus?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
        async function delB(id){ if(confirm('Hapus?')){ await fetch('/admin/del-buku/'+id,{method:'DELETE'}); location.reload(); } }
    </script></body></html>`);
});

// --- API ---
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

