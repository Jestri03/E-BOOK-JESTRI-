const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONNECTION ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("✅ DB OK")).catch(e => console.log(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String });

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Misteri','Komik','Sejarah'];

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieSession({ name: 'jestri_final_v1', keys: ['JESTRI_UX_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (FIX: CANNOT GET /) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>JESTRI STORE</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        :root { --p: #38bdf8; --d: #0f172a; --bg: #f8fafc; --success: #10b981; }
        * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { margin: 0; background: var(--bg); color: var(--d); }
        header { background: var(--d); padding: 15px 20px; position: sticky; top: 0; z-index: 1000; display: flex; align-items: center; justify-content: space-between; }
        .logo { font-weight: 800; color: var(--p); font-size: 1.2rem; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 15px; }
        .card { background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #eee; }
        .card-body { padding: 10px; }
        .btn-buy { width: 100%; padding: 10px; background: var(--d); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.8rem; }
        
        /* Sidebar */
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: white; z-index: 5000; transition: 0.3s; padding: 25px; box-shadow: 10px 0 30px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 4500; display: none; backdrop-filter: blur(4px); }
        .nav-link { padding: 12px 15px; border-radius: 10px; cursor: pointer; color: #475569; font-weight: 600; margin-bottom: 5px; }
        .nav-link.active { background: var(--p); color: white; }

        /* Floating Sosmed */
        .sosmed { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 4000; }
        .btn-sos { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none; font-size: 1.4rem; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
    </style></head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <aside class="sidebar" id="sb">
        <h2 style="margin:0 0 20px;">GENRE</h2>
        <div class="nav-link active" onclick="setG('Semua', this)">Semua Koleksi</div>
        ${LIST_GENRE.map(g => `<div class="nav-link" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <hr><a href="https://link.dana.id/qr/0895327806441" class="nav-link" style="background:#fbbf24; color:black; text-align:center;"><b>DONASI ADMIN</b></a>
    </aside>
    <header>
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="color:white; cursor:pointer;"></i>
        <div class="logo">JESTRI STORE</div>
        <div onclick="openCart()" style="position:relative; color:white; cursor:pointer;"><i class="fa-solid fa-shopping-bag"></i><span id="cc" style="position:absolute; top:-5px; right:-8px; background:red; font-size:0.6rem; padding:2px 5px; border-radius:50%;">0</span></div>
    </header>
    <main class="grid" id="mainGrid"></main>
    <div class="sosmed">
        <a href="https://wa.me/6285189415489" class="btn-sos" style="background:#22c55e;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="btn-sos" style="background:#cc2366;"><i class="fa-brands fa-instagram"></i></a>
    </div>
    <div id="modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:10000; display:none; align-items:center; justify-content:center; padding:20px;">
        <div id="mContent" style="background:white; width:100%; max-width:380px; border-radius:20px; padding:25px;"></div>
    </div>
    <script>
        let allB = [], cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').style.display = document.getElementById('sb').classList.contains('active') ? 'block' : 'none'; }
        async function load(){ const r = await fetch('/api/buku-json'); allB = await r.json(); render(allB); }
        function render(data){
            document.getElementById('mainGrid').innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" crossorigin="anonymous">
                    <div class="card-body">
                        <div style="font-size:0.8rem; font-weight:700; height:2.5em; overflow:hidden;">\${x.judul}</div>
                        <div style="color:var(--success); font-weight:800; margin:5px 0 10px;">Rp \${x.harga.toLocaleString()}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">BELI</button>
                    </div>
                </div>\`).join('');
        }
        function setG(g, el){ document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active')); el.classList.add('active'); render(g === 'Semua' ? allB : allB.filter(b => b.genre === g)); tog(); }
        function add(id){ const b = allB.find(x => x._id === id); if(!cart.find(x => x._id === id)) cart.push(b); document.getElementById('cc').innerText = cart.length; }
        function openCart(){
            if(!cart.length) return alert("Kosong!");
            document.getElementById('modal').style.display='flex';
            document.getElementById('mContent').innerHTML = \`<h3>Checkout</h3>\${cart.map(x=>\`<div>• \${x.judul}</div>\`).join('')}<p>Total: <b>Rp \${cart.reduce((a,b)=>a+b.harga,0).toLocaleString()}</b></p><input type="file" id="fBukti" style="margin:10px 0;"><button onclick="checkout()" id="btnC" style="width:100%; padding:15px; background:var(--success); color:white; border:none; border-radius:10px; font-weight:bold;">KIRIM BUKTI</button><button onclick="location.reload()" style="width:100%; background:none; border:none; color:gray; margin-top:10px;">Batal</button>\`;
        }
        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Pilih file!");
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            const res = await fetch('/api/order', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: up.secure_url }) });
            const data = await res.json();
            document.getElementById('mContent').innerHTML = "<h3>Berhasil!</h3><p>Admin sedang cek...</p><div id='dl'>⏳</div>";
            setInterval(async () => { const rs = await fetch('/api/check/'+data.id); const st = await rs.json(); if(st.status === 'Approved') document.getElementById('dl').innerHTML = \`<a href="\${st.pdfLink}" download style="display:block; background:var(--d); color:white; padding:15px; text-align:center; border-radius:10px; text-decoration:none; font-weight:bold; margin-top:15px;">DOWNLOAD PDF</a>\`; }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif;">
    <form action="/login" method="POST" style="background:white; padding:35px; border-radius:24px; width:320px; text-align:center; box-shadow:0 20px 40px rgba(0,0,0,0.2);">
        <h2 style="margin:0 0 10px; color:#0f172a;">Admin Panel</h2>
        <p style="color:#64748b; font-size:0.85rem; margin-bottom:25px;">Hanya pemilik toko yang bisa masuk</p>
        <input name="pw" type="password" placeholder="Passcode" autofocus style="width:100%; padding:14px; margin-bottom:15px; border:2px solid #e2e8f0; border-radius:12px; text-align:center; font-size:1.1rem; outline:none;">
        <button style="width:100%; padding:14px; background:#38bdf8; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">MASUK</button>
    </form></body>`);
});

app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });

// --- 3. DASHBOARD ADMIN (PRESISI & RAPI) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});

    const listO = o.map(x => `<div style="background:white; padding:15px; border-radius:16px; margin-bottom:12px; border:1px solid #e2e8f0; border-left:5px solid #fbbf24;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px;"><b>Rp ${x.total.toLocaleString()}</b> <a href="${x.bukti}" target="_blank" style="color:#38bdf8; font-size:0.8rem; text-decoration:none;">Cek Bukti <i class="fa-solid fa-external-link"></i></a></div>
        <input type="file" id="pdf-${x._id}" style="width:100%; font-size:0.75rem; margin-bottom:10px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <button onclick="acc('${x._id}')" style="padding:10px; background:#10b981; color:white; border:none; border-radius:8px; font-weight:700;">SETUJU</button>
            <button onclick="delO('${x._id}')" style="padding:10px; background:#fee2e2; color:#ef4444; border:none; border-radius:8px; font-weight:700;">TOLAK</button>
        </div>
    </div>`).join('');

    const listB = b.map(x => `<div style="display:flex; align-items:center; gap:10px; padding:10px; background:white; border-radius:12px; border:1px solid #f1f5f9; margin-bottom:8px;">
        <img src="${x.gambar}" style="width:30px; height:40px; object-fit:cover; border-radius:4px;">
        <span style="flex-grow:1; font-size:0.85rem; font-weight:600;">${x.judul}</span>
        <button onclick="delB('${x._id}')" style="color:#ef4444; background:none; border:none;"><i class="fa-solid fa-trash"></i></button>
    </div>`).join('');

    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { font-family:'Plus Jakarta Sans',sans-serif; background:#f8fafc; padding:20px; margin:0; }
        .box { background:white; padding:20px; border-radius:20px; border:1px solid #e2e8f0; margin-bottom:20px; }
        input, select { width:100%; padding:12px; margin-bottom:10px; border:1px solid #e2e8f0; border-radius:10px; outline:none; font-size:0.9rem; }
    </style></head><body>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h2 style="margin:0;">Panel Admin</h2> <a href="/" style="text-decoration:none; color:gray;"><i class="fa-solid fa-eye"></i></a>
    </div>
    <div class="box">
        <h3 style="margin:0 0 15px; font-size:1rem;">Upload Buku</h3>
        <input id="j" placeholder="Judul Buku"><input id="h" type="number" placeholder="Harga Jual">
        <select id="g">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
        <input type="file" id="fi">
        <button onclick="addB()" id="btnS" style="width:100%; padding:15px; background:#0f172a; color:white; border:none; border-radius:12px; font-weight:800;">POSTING</button>
    </div>
    <h3 style="font-size:1rem; margin-bottom:10px;">Order Pending (${o.length})</h3>
    <div>${listO || '<p style="color:gray; font-size:0.8rem; text-align:center;">Kosong</p>'}</div>
    <h3 style="font-size:1rem; margin:20px 0 10px;">Katalog Buku (${b.length})</h3>
    <div style="margin-bottom:50px;">${listB}</div>
    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Cover!");
            const btn = document.getElementById('btnS'); btn.innerText = "...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f = document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Pilih PDF!");
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
        async function delO(id){ if(confirm('Tolak?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
        async function delB(id){ if(confirm('Hapus?')){ await fetch('/admin/del-buku/'+id,{method:'DELETE'}); location.reload(); } }
    </script></body></html>`);
});

// --- API ROUTES ---
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

