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
    items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'jestri_vCart', keys: ['JESTRI_ULTIMATE'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (SISTEM KERANJANG & PREMIUM DESIGN) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>JESTRI PREMIUM STORE</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #0f172a; color: #f8fafc; overflow-x: hidden; }
        
        /* HEADER PREMIUM */
        .header { position: sticky; top: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); z-index: 1000; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .cart-icon { position: relative; cursor: pointer; }
        #cart-count { position: absolute; -10px; right: -10px; background: #ef4444; color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 50%; font-weight: 800; }

        /* SIDEBAR NAV */
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #1e293b; z-index: 2000; transition: 0.4s; padding: 30px 20px; }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1500; display: none; }
        .overlay.active { display: block; }
        
        .label-genre { font-size: 0.9rem; font-weight: 800; color: #38bdf8; margin: 25px 0 10px 0; display: block; text-transform: uppercase; border-left: 4px solid #38bdf8; padding-left: 10px; }
        .nav-link { display: block; padding: 12px; color: #cbd5e1; text-decoration: none; font-weight: 600; border-radius: 10px; margin-bottom: 5px; }
        .nav-link.active { background: #38bdf8; color: #0f172a; }

        /* DONATE BUTTON */
        .btn-donate { display: block; margin-top: 30px; padding: 15px; background: #fbbf24; color: #000; text-align: center; border-radius: 15px; font-weight: 800; text-decoration: none; font-size: 0.8rem; }

        /* GRID BUKU */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px; }
        .card { background: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .info { padding: 12px; }
        .price { color: #22c55e; font-weight: 800; margin: 5px 0; }
        .btn-add { width: 100%; padding: 10px; border-radius: 10px; border: none; background: #38bdf8; color: #0f172a; font-weight: 800; cursor: pointer; }

        /* MODAL KERANJANG */
        #cart-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 3000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .cart-box { background: #1e293b; width: 100%; max-width: 400px; border-radius: 25px; padding: 25px; max-height: 80vh; overflow-y: auto; }
        .cart-item { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; }
    </style></head><body>

    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <a href="#" class="nav-link active" onclick="setG('Semua', this)">Semua Koleksi</a>
        <span class="label-genre">Daftar Genre</span>
        ${LIST_GENRE.map(g => `<a href="#" class="nav-link" onclick="setG('${g}', this)">${g}</a>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" class="btn-donate"><i class="fa-solid fa-heart"></i> DONATE KE ADMIN</a>
    </div>

    <div class="header">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.4rem;"></i>
        <b>JESTRI STORE</b>
        <div class="cart-icon" onclick="openCart()">
            <i class="fa-solid fa-shopping-basket" style="font-size:1.4rem;"></i>
            <span id="cart-count">0</span>
        </div>
    </div>

    <div id="mainGrid" class="grid"></div>

    <div id="cart-modal">
        <div class="cart-box">
            <h3>Keranjang Belanja</h3>
            <div id="cart-list"></div>
            <div style="margin-top:20px; border-top:2px solid #38bdf8; padding-top:15px;">
                <div style="display:flex; justify-content:space-between; font-weight:800;">
                    <span>TOTAL:</span><span id="cart-total">Rp 0</span>
                </div>
                <div id="pay-area" style="display:none; margin-top:20px;">
                    <p style="font-size:0.7rem; color:#94a3b8;">Transfer ke DANA: <b>0895327806441</b></p>
                    <input type="file" id="bukti-cart" style="font-size:0.8rem; margin-bottom:10px;">
                    <button class="btn-add" onclick="checkout()">CHECKOUT SEKARANG</button>
                </div>
                <button id="btn-show-pay" class="btn-add" style="margin-top:15px; background:#22c55e;" onclick="showPay()">LANJUT PEMBAYARAN</button>
                <button onclick="document.getElementById('cart-modal').style.display='none'" style="width:100%; margin-top:10px; background:none; border:none; color:#94a3b8;">Kembali</button>
            </div>
        </div>
    </div>

    <script>
        let books = []; let cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(){ const r = await fetch('/api/buku-json'); books = await r.json(); render('Semua'); }
        
        function render(g){
            const f = g === 'Semua' ? books : books.filter(b => b.genre === g);
            const grid = document.getElementById('mainGrid');
            if(f.length===0){ grid.innerHTML = \`<div style="grid-column:1/-1; text-align:center; padding:100px 20px;">Genre \${g} Belum Ada</div>\`; return; }
            grid.innerHTML = f.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}">
                    <div class="info">
                        <div style="font-size:0.75rem; font-weight:700; height:2.4em; overflow:hidden;">\${x.judul}</div>
                        <div class="price">Rp \${Number(x.harga).toLocaleString('id-ID')}</div>
                        <button class="btn-add" onclick="addToCart('\${x._id}')">TAMBAH +</button>
                    </div>
                </div>\`).join('');
        }

        function setG(g, el){ document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active')); el.classList.add('active'); if(window.innerWidth<1000) tog(); render(g); }

        function addToCart(id){
            const b = books.find(x => x._id === id);
            if(cart.some(i => i._id === id)) return alert("Buku sudah ada di keranjang!");
            cart.push(b);
            document.getElementById('cart-count').innerText = cart.length;
            alert("Berhasil ditambah ke keranjang!");
        }

        function openCart(){
            const list = document.getElementById('cart-list');
            if(cart.length === 0){ list.innerHTML = "<p>Keranjang kosong.</p>"; }
            else {
                list.innerHTML = cart.map((x, i) => \`<div class="cart-item">
                    <span>\${x.judul}</span>
                    <b>Rp \${Number(x.harga).toLocaleString('id-ID')}</b>
                    <i class="fa-solid fa-trash" style="color:#ef4444" onclick="removeCart(\${i})"></i>
                </div>\`).join('');
            }
            let total = cart.reduce((a, b) => a + b.harga, 0);
            document.getElementById('cart-total').innerText = 'Rp ' + total.toLocaleString('id-ID');
            document.getElementById('cart-modal').style.display = 'flex';
        }

        function removeCart(i){ cart.splice(i, 1); document.getElementById('cart-count').innerText = cart.length; openCart(); }
        function showPay(){ if(cart.length===0) return; document.getElementById('pay-area').style.display='block'; document.getElementById('btn-show-pay').style.display='none'; }

        async function checkout(){
            const f = document.getElementById('bukti-cart').files[0]; if(!f) return alert("Upload bukti!");
            const btn = document.querySelector('#pay-area button'); btn.innerText = "Mengirim..."; btn.disabled = true;
            
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();

            await fetch('/api/order-cart', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: img.secure_url })
            });
            alert("Pesanan terkirim! Admin akan memproses buku kamu.");
            location.reload();
        }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (ANTI-GESER) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        body { background:#0f172a; margin:0; height:100vh; display:flex; align-items:center; justify-content:center; }
        .box { background:#1e293b; padding:40px; border-radius:30px; text-align:center; width:300px; border:1px solid #334155; }
        input { width:100%; padding:15px; margin:20px 0; border-radius:12px; background:#0f172a; color:#fff; border:1px solid #334155; text-align:center; outline:none; }
        button { width:100%; padding:15px; border-radius:12px; background:#38bdf8; border:none; font-weight:800; }
    </style></head><body><div class="box">
        <h2 style="color:#fff;">Admin Login</h2>
        <form action="/login" method="POST"><input name="pw" type="password" required><button>MASUK</button></form>
    </div></body></html>`);
});

// --- 3. DASHBOARD ADMIN (WITH DELETE FUNCTION) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { background:#0b0f19; color:#fff; font-family:sans-serif; padding:15px; }
        .card { background:#161e2d; padding:20px; border-radius:20px; border:1px solid #2d3748; margin-bottom:20px; }
        input, select { width:100%; padding:12px; margin:10px 0; background:#0b0f19; color:#fff; border:1px solid #2d3748; border-radius:10px; }
        .btn { width:100%; padding:15px; border-radius:12px; border:none; font-weight:800; cursor:pointer; background:#38bdf8; }
        .list-item { background:#161e2d; padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid #2d3748; }
    </style></head><body>
    <div style="max-width:500px; margin:auto;">
        <h2>ADMIN JESTRI</h2>
        <div class="card">
            <h3>Tambah Buku Baru</h3>
            <input id="j" placeholder="Judul">
            <input id="p" placeholder="Penulis">
            <input id="h" placeholder="Harga">
            <label>Gambar:</label><input type="file" id="fi">
            <label>PDF:</label><input type="file" id="fp">
            <select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select>
            <button class="btn" onclick="up()">SIMPAN BUKU</button>
        </div>

        <h3>Daftar Buku (Hapus Disini)</h3>
        ${b.map(x => `<div class="list-item">
            <span>${x.judul}</span>
            <a href="/admin/del/${x._id}" style="color:#ef4444;" onclick="return confirm('Hapus buku ini?')"><i class="fa-solid fa-trash"></i></a>
        </div>`).join('')}

        <h3>Orderan Masuk (${o.length})</h3>
        ${o.map(x => `<div class="card">
            <b>Total: Rp ${x.total.toLocaleString('id-ID')}</b><br>
            <small>${x.items.map(i=>i.judul).join(', ')}</small><br>
            <a href="${x.bukti}" target="_blank" style="color:#38bdf8;">Lihat Bukti</a><br>
            <a href="/admin/approve-cart/${x._id}" style="color:#22c55e;">Selesaikan & Kirim PDF</a>
        </div>`).join('')}
    </div>
    <script>
        async function up(){
            const fi = document.getElementById('fi').files[0]; const fp = document.getElementById('fp').files[0];
            const btn = document.querySelector('.btn'); btn.innerText = "Processing..."; btn.disabled = true;
            const fdI = new FormData(); fdI.append('file', fi); fdI.append('upload_preset', 'ml_default');
            const rI = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fdI});
            const dI = await rI.json();
            const fdP = new FormData(); fdP.append('file', fp); fdP.append('upload_preset', 'ml_default');
            const rP = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload', {method:'POST', body:fdP});
            const dP = await rP.json();
            await fetch('/admin/save-buku', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:document.getElementById('h').value, genre:document.getElementById('g').value, gambar:dI.secure_url, pdfUrl:dP.secure_url}) });
            location.reload();
        }
    </script></body></html>`);
});

// --- 4. BACKEND LOGIC ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save-buku', async (req, res) => {
    if(req.session.admin) await new Buku({ ...req.body, harga: Number(req.body.harga) }).save();
    res.json({ success: true });
});
app.get('/admin/del/:id', async (req, res) => {
    if(req.session.admin) await Buku.findByIdAndDelete(req.params.id);
    res.redirect('/admin');
});
app.post('/api/order-cart', async (req, res) => {
    const o = new Order({ items: req.body.items, total: req.body.total, bukti: req.body.bukti });
    await o.save(); res.json({ success: true });
});
app.get('/api/buku-json', async (req, res) => { res.json(await Buku.find().sort({_id:-1})); });

app.listen(process.env.PORT || 3000);

