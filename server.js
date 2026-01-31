const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("✅ DB Connected")).catch(e => console.log(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String });

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Misteri','Komik','Sejarah'];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ name: 'jestri_ultra', keys: ['JESTRI_999'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. UI PEMBELI (PROFESIONAL & MODERN) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JESTRI STORE</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        :root { 
            --merah: #7f1d1d; --biru: #0ea5e9; --hijau: #064e3b; 
            --hitam: #1e293b; --putih: #f8fafc; --ungu: #4c1d95; 
        }
        * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { margin: 0; background: var(--putih); color: var(--hitam); }

        /* Header & Sidebar */
        header { background: var(--biru); padding: 15px 20px; color: white; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: var(--hitam); z-index: 5000; transition: 0.3s; padding: 25px; color: white; }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 4500; display: none; backdrop-filter: blur(4px); }
        
        /* Katalog */
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; padding: 15px; }
        .card { background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.05); display: flex; flex-direction: column; transition: 0.3s; border: 1px solid #eee; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .card-body { padding: 12px; }
        .card-title { font-weight: 700; font-size: 0.85rem; height: 2.4em; overflow: hidden; margin-bottom: 4px; }
        .card-author { font-size: 0.7rem; color: #64748b; margin-bottom: 8px; }
        .card-price { color: var(--hijau); font-weight: 800; font-size: 1rem; }
        .btn-buy { width: 100%; margin-top: 10px; padding: 10px; background: var(--biru); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }

        /* Floating Buttons */
        .social-float { position: fixed; bottom: 80px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 4000; }
        .s-btn { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none; font-size: 1.5rem; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        
        .floating-cart { position: fixed; bottom: 15px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 400px; background: var(--hitam); color: white; padding: 15px 25px; border-radius: 50px; display: none; justify-content: space-between; align-items: center; z-index: 4001; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }

        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: none; align-items: center; justify-content: center; padding: 20px; }
        .m-box { background: white; width: 100%; max-width: 400px; border-radius: 20px; padding: 25px; }
    </style></head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <aside class="sidebar" id="sb">
        <h2 style="color:var(--biru); margin-bottom:20px;">GENRE</h2>
        <div onclick="setG('Semua', this)" style="padding:12px; cursor:pointer;" class="active">Semua Koleksi</div>
        ${LIST_GENRE.map(g => `<div onclick="setG('${g}', this)" style="padding:12px; cursor:pointer;">${g}</div>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" style="display:block; background:var(--ungu); color:white; text-align:center; padding:15px; border-radius:12px; margin-top:30px; text-decoration:none; font-weight:800;">DONASI ADMIN</a>
    </aside>

    <header>
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="cursor:pointer;"></i>
        <div style="font-weight:900; font-size:1.2rem;">JESTRI STORE</div>
        <i class="fa-solid fa-magnifying-glass"></i>
    </header>

    <main class="grid" id="mainGrid"></main>

    <div class="social-float">
        <a href="https://wa.me/6285189415489" class="s-btn" style="background:#25D366;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="s-btn" style="background:var(--ungu);"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div class="floating-cart" id="fCart" onclick="openCheckout()">
        <span><i class="fa-solid fa-bag-shopping"></i> <span id="cCount">0</span> Item</span>
        <b id="cTotal">Rp 0</b>
    </div>

    <div id="modal" onclick="this.style.display='none'"><div class="m-box" id="mContent" onclick="event.stopPropagation()"></div></div>

    <script>
        let allB = [], cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').style.display = document.getElementById('sb').classList.contains('active') ? 'block' : 'none'; }
        async function load(){ const r = await fetch('/api/buku-json'); allB = await r.json(); render(allB); }
        function render(data){
            document.getElementById('mainGrid').innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}">
                    <div class="card-body">
                        <div class="card-title">\${x.judul}</div>
                        <div class="card-author">Oleh: \${x.penulis}</div>
                        <div class="card-price">Rp \${x.harga.toLocaleString()}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">TAMBAH</button>
                    </div>
                </div>\`).join('');
        }
        function add(id){
            const b = allB.find(x => x._id === id);
            if(!cart.find(x => x._id === id)) cart.push(b);
            document.getElementById('fCart').style.display = 'flex';
            document.getElementById('cCount').innerText = cart.length;
            document.getElementById('cTotal').innerText = 'Rp ' + cart.reduce((a,b)=>a+b.harga,0).toLocaleString();
        }
        function openCheckout(){
            document.getElementById('modal').style.display='flex';
            document.getElementById('mContent').innerHTML = \`<h3>Checkout</h3><div style="max-height:150px; overflow:auto;">\${cart.map(x=>\`<div>\${x.judul}</div>\`).join('')}</div><hr><input type="file" id="fBukti" style="width:100%; margin:15px 0;"><button onclick="pay()" id="btnP" style="width:100%; background:var(--hijau); color:white; border:none; padding:15px; border-radius:10px; font-weight:800;">KONFIRMASI BAYAR</button>\`;
        }
        async function pay(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Bukti transfer wajib!");
            const btn = document.getElementById('btnP'); btn.innerText = "Processing...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            const res = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({items:cart, total:cart.reduce((a,b)=>a+b.harga,0), bukti:up.secure_url}) });
            const d = await res.json();
            document.getElementById('mContent').innerHTML = "<h3>Sukses!</h3><p>Tunggu verifikasi admin di halaman ini...</p><div id='dl'>⌛</div>";
            setInterval(async () => { const rs = await fetch('/api/check/'+d.id); const st = await rs.json(); if(st.status === 'Approved') document.getElementById('dl').innerHTML = \`<a href="\${st.pdfLink}" download style="display:block; background:var(--biru); color:white; padding:15px; text-align:center; border-radius:10px; text-decoration:none; font-weight:bold;">DOWNLOAD PDF</a>\`; }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (TRANSPARAN MODERN) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; background: #1e293b; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
        .login { position: absolute; inset: 60px; display: flex; justify-content: center; align-items: center; flex-direction: column; border-radius: 10px; background: #00000033; color: #fff; z-index: 1000; box-shadow: inset 0 10px 20px #00000080; border-bottom: 2px solid #ffffff80; overflow: hidden; }
        input { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 12px; border-radius: 8px; color: white; text-align: center; margin-bottom: 15px; width: 70%; outline: none; }
        button { background: #0ea5e9; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; width: 70%; cursor: pointer; }
    </style></head><body>
    <form class="login" action="/login" method="POST">
        <h2 style="letter-spacing:2px; margin-bottom:20px;">ADMIN ACCESS</h2>
        <input name="pw" type="password" placeholder="Passcode">
        <button type="submit">ENTER</button>
    </form></body></html>`);
});

app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });

// --- 3. DASHBOARD ADMIN (PROFESIONAL & JELAS) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});

    const listO = o.map(x => `
        <div style="background:#f8fafc; padding:20px; border-radius:15px; margin-bottom:15px; border:1px solid #e2e8f0; border-left:10px solid #0ea5e9;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <b style="color:#064e3b; font-size:1.2rem;">Rp ${x.total.toLocaleString()}</b>
                <a href="${x.bukti}" target="_blank" style="background:#1e293b; color:white; padding:5px 12px; border-radius:5px; text-decoration:none; font-size:0.7rem;">LIHAT BUKTI</a>
            </div>
            <div style="background:#fff; padding:15px; border-radius:10px; border:1px dashed #cbd5e1;">
                <label style="font-size:0.7rem; font-weight:800; color:#64748b;">UPLOAD FILE PDF:</label>
                <input type="file" id="pdf-${x._id}" style="width:100%; margin-top:5px;">
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:15px;">
                <button onclick="acc('${x._id}')" style="padding:12px; background:#064e3b; color:white; border:none; border-radius:10px; font-weight:bold;">SETUJUI</button>
                <button onclick="delO('${x._id}')" style="padding:12px; background:#7f1d1d; color:white; border:none; border-radius:10px; font-weight:bold;">TOLAK</button>
            </div>
        </div>`).join('');

    const listB = b.map(x => `
        <div style="display:flex; align-items:center; gap:12px; padding:15px; border-bottom:1px solid #f1f5f9;">
            <img src="${x.gambar}" style="width:40px; height:50px; object-fit:cover; border-radius:6px;">
            <div style="flex-grow:1;"><div style="font-weight:700; font-size:0.9rem;">${x.judul}</div><div style="font-size:0.7rem; color:gray;">${x.penulis}</div></div>
            <button onclick="delB('${x._id}')" style="color:#7f1d1d; border:none; background:none; font-size:1.2rem;"><i class="fa-solid fa-trash-can"></i></button>
        </div>`).join('');

    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { font-family:sans-serif; background:#f1f5f9; margin:0; padding:20px; color:#1e293b; }
        .card { background:white; padding:25px; border-radius:20px; box-shadow:0 10px 25px rgba(0,0,0,0.05); margin-bottom:25px; }
        input, select { width:100%; padding:14px; margin-bottom:12px; border:1px solid #e2e8f0; border-radius:12px; box-sizing:border-box; }
        h3 { border-left:5px solid #0ea5e9; padding-left:12px; font-size:1.1rem; margin-top:30px; }
    </style></head><body>
    <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2>Jestri Manager</h2>
        <a href="/" style="color:#0ea5e9; font-weight:bold; text-decoration:none;">KE TOKO</a>
    </div>
    
    <div class="card">
        <h3 style="margin-top:0;">+ Tambah E-Book</h3>
        <input id="j" placeholder="Judul Buku">
        <input id="p" placeholder="Nama Penulis">
        <input id="h" type="number" placeholder="Harga Jual">
        <select id="g">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
        <input type="file" id="fi">
        <button onclick="addB()" id="btnS" style="width:100%; padding:16px; background:#1e293b; color:white; border:none; border-radius:12px; font-weight:800;">PUBLIKASIKAN</button>
    </div>

    <h3>Pesanan Masuk (${o.length})</h3>
    <div>${listO || '<p style="text-align:center; color:gray; padding:20px;">Belum ada pesanan</p>'}</div>

    <h3>Daftar Koleksi</h3>
    <div class="card" style="padding:0;">${listB}</div>

    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih cover!");
            const btn = document.getElementById('btnS'); btn.innerText = "UPLOADING..."; btn.disabled = true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f = document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Upload PDF-nya dulu!");
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
        async function delO(id){ if(confirm('Hapus order?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
        async function delB(id){ if(confirm('Hapus buku?')){ await fetch('/admin/del-buku/'+id,{method:'DELETE'}); location.reload(); } }
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

