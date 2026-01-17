const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI);

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

const Order = mongoose.model('Order', { 
    items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({ name: 'jestri_vFinal', keys: ['JESTRI_MASTER'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #f8fafc; color: #1e293b; overflow-x: hidden; }
        
        /* HEADER & SEARCH */
        .header { position: sticky; top: 0; background: #0f172a; color: white; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; z-index: 1000; }
        .logo { font-weight: 800; color: #38bdf8; font-size: 1.1rem; }
        .search-container { background: #0f172a; padding: 0 15px 15px 15px; }
        .search-bar { width: 100%; padding: 12px; border-radius: 10px; border: none; background: #1e293b; color: white; outline: none; }

        /* SIDEBAR */
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: white; z-index: 5000; transition: 0.3s; padding: 25px; }
        .sidebar.active { left: 0; box-shadow: 10px 0 50px rgba(0,0,0,0.2); }
        .nav-item { padding: 12px; border-radius: 10px; margin-bottom: 5px; cursor: pointer; color: #64748b; font-weight: 600; }
        .nav-item.active { background: #38bdf8; color: white; }
        .donate-btn { display: block; background: #fbbf24; color: black; text-align: center; padding: 12px; border-radius: 10px; text-decoration: none; font-weight: 800; margin-top: 20px; }

        /* GRID */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px; }
        .card { background: white; border-radius: 15px; overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #f1f5f9; }
        .card-body { padding: 12px; }
        .card-title { font-size: 0.8rem; font-weight: 800; height: 2.5em; overflow: hidden; }
        .card-price { color: #10b981; font-weight: 800; margin-top: 5px; }
        .btn-add { width: 100%; padding: 10px; border: none; border-radius: 8px; background: #0f172a; color: white; font-weight: bold; margin-top: 10px; cursor: pointer; font-size: 0.75rem; }

        /* FLOAT */
        .float-box { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 4000; }
        .float-btn { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none; font-size: 1.5rem; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 4500; display: none; backdrop-filter: blur(2px); }
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; }
    </style></head><body>

    <div class="overlay" id="ov" onclick="tog()"></div>

    <div class="sidebar" id="sb">
        <h2 style="margin-bottom:20px;">Menu</h2>
        <div class="nav-item active" onclick="setG('Semua', this)">Semua Koleksi</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" class="donate-btn">DONASI ADMIN</a>
    </div>

    <div class="header">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.3rem;"></i>
        <div class="logo">E-BOOK JESTRI</div>
        <div onclick="openCart()" style="position:relative; cursor:pointer;"><i class="fa-solid fa-cart-shopping"></i><span id="cc" style="position:absolute; top:-8px; right:-10px; background:red; color:white; font-size:0.6rem; padding:2px 5px; border-radius:50%;">0</span></div>
    </div>

    <div class="search-container">
        <input type="text" id="sr" class="search-bar" placeholder="Cari judul atau penulis..." oninput="cari()">
    </div>

    <div id="mainGrid" class="grid"></div>

    <div class="float-box">
        <a href="https://wa.me/6285189415489" class="float-btn" style="background:#22c55e;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="float-btn" style="background:linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal"><div style="background:white; width:100%; max-width:350px; border-radius:20px; padding:25px;">
        <h3 style="margin-top:0;">Konfirmasi Pesanan</h3>
        <div id="cItems" style="margin-bottom:15px; font-size:0.85rem;"></div>
        <p><b>Total: </b><span id="cTotal" style="color:#10b981;"></span></p>
        <input type="file" id="fBukti" style="margin:15px 0; font-size:0.8rem; width:100%;">
        <button onclick="checkout()" style="width:100%; padding:15px; background:#10b981; color:white; border:none; border-radius:12px; font-weight:800;">KIRIM BUKTI BAYAR</button>
        <button onclick="location.reload()" style="width:100%; background:none; border:none; margin-top:10px; color:gray;">Batal</button>
    </div></div>

    <script>
        let allB = []; let cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').style.display = document.getElementById('sb').classList.contains('active') ? 'block' : 'none'; }
        
        async function load(){
            const r = await fetch('/api/buku-json?v=' + Date.now());
            allB = await r.json();
            render(allB);
        }

        function render(data){
            document.getElementById('mainGrid').innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" onerror="this.src='https://placehold.co/400x600?text=EBOOK+JESTRI'">
                    <div class="card-body">
                        <div class="card-title">\${x.judul}</div>
                        <div style="font-size:0.7rem; color:gray;">\${x.penulis}</div>
                        <div class="card-price">Rp \${new Intl.NumberFormat('id-ID').format(x.harga)}</div>
                        <button class="btn-add" onclick="add('\${x._id}')">BELI SEKARANG</button>
                    </div>
                </div>\`).join('');
        }

        function cari(){
            const k = document.getElementById('sr').value.toLowerCase();
            render(allB.filter(b => b.judul.toLowerCase().includes(k) || b.penulis.toLowerCase().includes(k)));
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
            alert("Buku masuk keranjang!");
        }

        function openCart(){
            if(cart.length === 0) return alert("Pilih buku dulu!");
            document.getElementById('cItems').innerHTML = cart.map(x => \`<div>• \${x.judul}</div>\`).join('');
            document.getElementById('cTotal').innerText = 'Rp ' + new Intl.NumberFormat('id-ID').format(cart.reduce((a,b)=>a+b.harga,0));
            document.getElementById('modal').style.display = 'flex';
        }

        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Pilih foto bukti!");
            const btn = document.querySelector('#modal button'); btn.disabled = true; btn.innerText = "Mengunggah...";
            
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();

            await fetch('/api/order', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: img.secure_url })
            });
            alert("Pesanan dikirim! Hubungi WA admin.");
            location.reload();
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (STABIL & ANTI-GESER) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; margin:0; height:100vh; display:flex; align-items:center; justify-content:center; font-family:sans-serif; overflow:hidden; position:fixed; width:100%;">
    <form action="/login" method="POST" style="background:white; padding:40px; border-radius:20px; width:280px; text-align:center;">
        <h2 style="margin-top:0; color:#0f172a;">JESTRI ADMIN</h2>
        <input name="pw" type="password" placeholder="Passcode" autofocus style="width:100%; padding:15px; margin:20px 0; border:1px solid #ddd; border-radius:10px; text-align:center;">
        <button style="width:100%; padding:15px; background:#38bdf8; color:white; border:none; border-radius:10px; font-weight:bold;">LOGIN</button>
    </form></body>`);
});

// --- 3. DASHBOARD ADMIN (LENGKAP) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body{font-family:sans-serif; background:#f1f5f9; padding:15px; margin:0;}
        .box{background:white; padding:20px; border-radius:15px; margin-bottom:15px; box-shadow:0 2px 5px rgba(0,0,0,0.05);}
        input, select{width:100%; padding:12px; margin:8px 0; border:1px solid #ddd; border-radius:10px; box-sizing:border-box;}
        .btn-post{width:100%; padding:15px; background:#0f172a; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;}
        .item{display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;}
    </style></head><body>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <h2>ADMIN JESTRI</h2>
        <a href="/" style="text-decoration:none; color:#38bdf8; font-weight:bold;">Lihat Toko</a>
    </div>
    <div class="box">
        <h3>Tambah Buku Baru</h3>
        <input id="j" placeholder="Judul Buku">
        <input id="p" placeholder="Nama Penulis">
        <input id="h" type="number" placeholder="Harga (Contoh: 3000)">
        <select id="g">${LIST_GENRE.map(x=>`<option>${x}</option>`).join('')}</select>
        <input type="file" id="fi">
        <button onclick="addB()" id="btnP" class="btn-post">PUBLISH BUKU</button>
    </div>
    <h3>Katalog Buku (${b.length})</h3>
    <div class="box">
        ${b.map(x => `<div class="item">
            <div>
                <div style="font-weight:bold;">${x.judul}</div>
                <div style="font-size:0.75rem; color:gray;">${x.penulis}</div>
            </div>
            <button onclick="delB('${x._id}')" style="background:none; border:none; color:red; cursor:pointer;"><i class="fa-solid fa-trash"></i> HAPUS</button>
        </div>`).join('')}
    </div>
    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih gambar!");
            const btn = document.getElementById('btnP'); btn.disabled = true; btn.innerText = "Mengunggah...";
            
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();

            await fetch('/admin/save', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ 
                    judul: document.getElementById('j').value, 
                    penulis: document.getElementById('p').value, 
                    harga: Number(document.getElementById('h').value), 
                    genre: document.getElementById('g').value, 
                    gambar: img.secure_url 
                })
            });
            location.reload();
        }
        async function delB(id){
            if(confirm('Hapus buku ini?')){
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

