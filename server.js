const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI);

const Buku = mongoose.model('Buku', { judul: String, harga: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String });

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({ name: 'jestri_session', keys: ['JESTRI_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #f8fafc; color: #1e293b; }
        .header { position: sticky; top: 0; background: #0f172a; color: white; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; z-index: 1000; }
        .logo { font-weight: 800; color: #38bdf8; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px; }
        .card { background: white; border-radius: 15px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #f1f5f9; }
        .card-body { padding: 12px; }
        .card-price { color: #10b981; font-weight: 800; margin-top: 5px; }
        .btn-buy { width: 100%; padding: 10px; border: none; border-radius: 8px; background: #0f172a; color: white; font-weight: bold; margin-top: 10px; cursor: pointer; }
        
        /* SIDEBAR */
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: white; z-index: 5000; transition: 0.3s; padding: 25px; box-shadow: 5px 0 20px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .nav-item { padding: 12px; border-radius: 8px; margin-bottom: 5px; cursor: pointer; color: #64748b; }
        .nav-item.active { background: #38bdf8; color: white; font-weight: bold; }
        
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 4500; display: none; backdrop-filter: blur(2px); }
        #toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #38bdf8; color: white; padding: 10px 20px; border-radius: 50px; font-weight: bold; display: none; z-index: 10000; }
    </style></head><body>

    <div id="toast">Berhasil ditambahkan!</div>
    <div class="overlay" id="ov" onclick="tog()"></div>

    <div class="sidebar" id="sb">
        <h2 style="color:#0f172a;">E-BOOK JESTRI</h2>
        <div class="nav-item active" onclick="setG('Semua', this)">Semua Koleksi</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
    </div>

    <div class="header">
        <i class="fa-solid fa-bars" onclick="tog()"></i>
        <div class="logo">E-BOOK JESTRI</div>
        <div onclick="openCart()" style="position:relative; cursor:pointer;"><i class="fa-solid fa-cart-shopping"></i><span id="cc" style="position:absolute; top:-8px; right:-10px; background:red; color:white; font-size:0.6rem; padding:2px 5px; border-radius:50%;">0</span></div>
    </div>

    <div id="mainGrid" class="grid"></div>

    <div style="position:fixed; bottom:20px; right:20px; display:flex; flex-direction:column; gap:10px; z-index:4000;">
        <a href="https://wa.me/6285189415489" style="background:#22c55e; color:white; width:45px; height:45px; border-radius:50%; display:flex; align-items:center; justify-content:center; text-decoration:none; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i class="fa-brands fa-whatsapp"></i></a>
    </div>

    <div id="modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:10000; display:none; align-items:center; justify-content:center; padding:20px;">
        <div style="background:white; width:100%; max-width:350px; border-radius:20px; padding:20px;">
            <h3 style="margin-top:0;">Checkout</h3>
            <div id="cItems"></div>
            <p><b>Total: </b><span id="cTotal"></span></p>
            <input type="file" id="fBukti" style="margin:10px 0; font-size:0.8rem;">
            <button onclick="checkout()" style="width:100%; padding:12px; background:#10b981; color:white; border:none; border-radius:10px; font-weight:bold;">KIRIM BUKTI</button>
            <button onclick="location.reload()" style="width:100%; background:none; border:none; margin-top:10px; color:gray;">Batal</button>
        </div>
    </div>

    <script>
        let allB = []; let cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').style.display = document.getElementById('sb').classList.contains('active') ? 'block' : 'none'; }
        
        async function load(){
            const r = await fetch('/api/buku-json');
            allB = await r.json();
            render(allB);
        }

        function render(data){
            document.getElementById('mainGrid').innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" loading="lazy">
                    <div class="card-body">
                        <div style="font-size:0.8rem; font-weight:bold; height:2.5em; overflow:hidden;">\${x.judul}</div>
                        <div class="card-price">Rp \${new Intl.NumberFormat('id-ID').format(x.harga)}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">AMBIL</button>
                    </div>
                </div>\`).join('');
        }

        function setG(g, el){
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            el.classList.add('active');
            render(g === 'Semua' ? allB : allB.filter(b => b.genre === g));
            tog();
        }

        function add(id){
            if(cart.some(i => i._id === id)) return;
            cart.push(allB.find(x => x._id === id));
            document.getElementById('cc').innerText = cart.length;
            document.getElementById('toast').style.display = 'block';
            setTimeout(() => document.getElementById('toast').style.display = 'none', 2000);
        }

        function openCart(){
            if(cart.length === 0) return alert("Kosong!");
            document.getElementById('cItems').innerHTML = cart.map(x => \`<div>\${x.judul}</div>\`).join('');
            document.getElementById('cTotal').innerText = 'Rp ' + new Intl.NumberFormat('id-ID').format(cart.reduce((a,b)=>a+b.harga,0));
            document.getElementById('modal').style.display = 'flex';
        }

        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Pilih bukti!");
            const btn = document.querySelector('#modal button'); btn.disabled = true; btn.innerText = "Sabar...";
            
            // DIRECT UPLOAD TO CLOUDINARY (No Timeout)
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();

            await fetch('/api/order', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: img.secure_url })
            });
            alert("Berhasil! Silakan hubungi admin WA.");
            location.reload();
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (STABIL) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; overflow:hidden;">
    <form action="/login" method="POST" style="background:white; padding:30px; border-radius:15px; width:280px; text-align:center;">
        <h2 style="margin-top:0;">ADMIN</h2>
        <input name="pw" type="password" placeholder="Sandi" autofocus style="width:100%; padding:12px; margin:15px 0; border:1px solid #ddd; border-radius:8px;">
        <button style="width:100%; padding:12px; background:#38bdf8; color:white; border:none; border-radius:8px; font-weight:bold;">MASUK</button>
    </form></body>`);
});

// --- 3. DASHBOARD ADMIN (OPTIMAL) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>body{font-family:sans-serif; background:#f1f5f9; padding:15px;} .box{background:white; padding:15px; border-radius:12px; margin-bottom:15px; shadow: 0 2px 5px rgba(0,0,0,0.1)}</style></head><body>
    <h3>ADMIN PANEL</h3>
    <div class="box">
        <input id="j" placeholder="Judul" style="width:100%; padding:10px; margin-bottom:10px;">
        <input id="h" type="number" placeholder="Harga" style="width:100%; padding:10px; margin-bottom:10px;">
        <select id="g" style="width:100%; padding:10px; margin-bottom:10px;">${LIST_GENRE.map(x=>`<option>${x}</option>`).join('')}</select>
        <input type="file" id="fi" style="margin-bottom:10px;">
        <button onclick="addB()" id="btnP" style="width:100%; padding:12px; background:#0f172a; color:white; border:none; border-radius:8px;">POSTING</button>
    </div>
    <h3>Katalog</h3>
    ${b.map(x => `<div class="box" style="display:flex; justify-content:space-between;"><span>${x.judul}</span><button onclick="delB('${x._id}')" style="color:red; border:none; background:none; font-weight:bold;">HAPUS</button></div>`).join('')}
    
    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih gambar!");
            document.getElementById('btnP').innerText = "Proses...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();
            await fetch('/admin/save', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ judul: document.getElementById('j').value, harga: Number(document.getElementById('h').value), genre: document.getElementById('g').value, gambar: img.secure_url })
            });
            location.reload();
        }
        async function delB(id){
            if(confirm('Hapus?')){
                await fetch('/admin/del/'+id, { method: 'DELETE' });
                location.reload();
            }
        }
    </script></body></html>`);
});

// --- API ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.delete('/admin/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.json({ok:true}); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1}).lean()));
app.post('/api/order', async (req, res) => { await new Order(req.body).save(); res.json({ok:true}); });

app.listen(process.env.PORT || 3000);

