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
app.use(cookieSession({ name: 'jestri_vFinal_Fix', keys: ['JESTRI_MASTER_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>JESTRI E-BOOK STORE</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #0f172a; color: #f8fafc; overflow-x: hidden; }
        
        .header { position: sticky; top: 0; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(10px); z-index: 1000; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); }
        
        /* SIDEBAR */
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #1e293b; z-index: 5000; transition: 0.4s; padding: 30px 20px; box-shadow: 10px 0 30px rgba(0,0,0,0.5); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 4000; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }

        .label-genre { font-size: 0.7rem; font-weight: 800; color: #38bdf8; margin: 25px 0 10px 0; display: block; text-transform: uppercase; letter-spacing: 2px; }
        .nav-link { display: block; padding: 12px; color: #cbd5e1; text-decoration: none; font-weight: 600; border-radius: 12px; margin-bottom: 5px; }
        .nav-link.active { background: #38bdf8; color: #0f172a; }

        /* SOSMED FIXED (PASTI MUNCUL) */
        .float-container { position: fixed; bottom: 25px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 9999; }
        .btn-sosmed { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.5rem; text-decoration: none; box-shadow: 0 8px 20px rgba(0,0,0,0.4); transition: 0.3s; }
        .wa { background: #22c55e; }
        .ig { background: linear-gradient(45deg, #f09433, #dc2743, #bc1888); }

        /* GRID */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 15px; }
        .card { background: #1e293b; border-radius: 18px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .info { padding: 12px; }
        .btn-add { width: 100%; padding: 10px; border-radius: 10px; border: none; background: #38bdf8; color: #0f172a; font-weight: 800; }

        /* CART MODAL */
        #cart-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .cart-box { background: #1e293b; width: 100%; max-width: 400px; border-radius: 25px; padding: 25px; border: 1px solid #38bdf8; }
    </style></head><body>

    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <a href="#" class="nav-link active" onclick="setG('Semua', this)">Semua Koleksi</a>
        <span class="label-genre">— GENRE</span>
        ${LIST_GENRE.map(g => `<a href="#" class="nav-link" onclick="setG('${g}', this)">${g}</a>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" style="display:block; margin-top:30px; padding:15px; background:#fbbf24; color:#000; text-align:center; border-radius:15px; font-weight:800; text-decoration:none;">DONASI ADMIN (DANA)</a>
    </div>

    <div class="header">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.4rem;"></i>
        <b style="letter-spacing:-1px;">JESTRI STORE</b>
        <div onclick="openCart()" style="position:relative;">
            <i class="fa-solid fa-cart-shopping" style="font-size:1.4rem; color:#38bdf8;"></i>
            <span id="cc" style="position:absolute; -8px; right:-8px; background:#ef4444; font-size:0.6rem; padding:2px 6px; border-radius:50%;">0</span>
        </div>
    </div>

    <div id="mainGrid" class="grid"></div>

    <div class="float-container">
        <a href="https://wa.me/6285189415489" class="btn-sosmed wa"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="btn-sosmed ig"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="cart-modal">
        <div class="cart-box">
            <h3>Keranjang Anda</h3>
            <div id="cart-list" style="margin-bottom:20px;"></div>
            <div style="border-top:1px solid #334155; padding-top:15px;">
                <p>Total: <b id="cart-total" style="color:#22c55e;">Rp 0</b></p>
                <div id="pay-input" style="display:none;">
                    <p style="font-size:0.7rem;">TF DANA: 0895327806441</p>
                    <input type="file" id="bukti-f" style="width:100%; margin-bottom:10px;">
                    <button class="btn-add" onclick="checkout()">BAYAR SEKARANG</button>
                </div>
                <button id="btn-lanjut" class="btn-add" onclick="document.getElementById('pay-input').style.display='block'; this.style.display='none'">CHECKOUT</button>
                <button onclick="document.getElementById('cart-modal').style.display='none'" style="width:100%; margin-top:10px; background:none; border:none; color:#94a3b8;">Batal</button>
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
            if(f.length===0){ grid.innerHTML = \`<div style="grid-column:1/-1; text-align:center; padding:100px 20px;">Genre \${g} Belum Tersedia</div>\`; return; }
            grid.innerHTML = f.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}">
                    <div class="info">
                        <div style="font-size:0.75rem; font-weight:700; height:2.4em; overflow:hidden;">\${x.judul}</div>
                        <div style="color:#22c55e; font-weight:800; margin-bottom:10px;">Rp \${Number(x.harga).toLocaleString('id-ID')}</div>
                        <button class="btn-add" onclick="add('\${x._id}')">BELI +</button>
                    </div>
                </div>\`).join('');
        }
        function setG(g, el){ document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active')); el.classList.add('active'); if(window.innerWidth<1000) tog(); render(g); }
        function add(id){ const b = books.find(x=>x._id===id); if(cart.some(i=>i._id===id)) return; cart.push(b); document.getElementById('cc').innerText = cart.length; alert('Masuk keranjang!'); }
        function openCart(){
            const list = document.getElementById('cart-list');
            list.innerHTML = cart.map((x,i)=>\`<div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span>\${x.judul}</span><i class="fa-solid fa-trash" onclick="delC(\${i})" style="color:#ef4444"></i></div>\`).join('');
            let t = cart.reduce((a,b)=>a+b.harga,0); document.getElementById('cart-total').innerText = 'Rp '+t.toLocaleString('id-ID');
            document.getElementById('cart-modal').style.display = 'flex';
        }
        function delC(i){ cart.splice(i,1); document.getElementById('cc').innerText = cart.length; openCart(); }
        async function checkout(){
            const f = document.getElementById('bukti-f').files[0]; if(!f) return alert('Pilih bukti!');
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();
            await fetch('/api/order-cart', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({items:cart, total:cart.reduce((a,b)=>a+b.harga,0), bukti:img.secure_url}) });
            alert('Sukses! Menunggu konfirmasi admin.'); location.reload();
        }
        load();
    </script></body></html>`);
});

// --- 2. DASHBOARD ADMIN (UI BALANCED & FIX) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.send(`<script>location.href='/login'</script>`);
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { background:#0b0f19; color:#fff; font-family:sans-serif; padding:15px; margin:0; }
        .container { max-width:600px; margin:auto; }
        .card { background:#161e2d; padding:20px; border-radius:20px; border:1px solid #2d3748; margin-bottom:20px; box-shadow:0 10px 30px rgba(0,0,0,0.3); }
        .form-group { margin-bottom:15px; }
        label { font-size:0.75rem; color:#94a3b8; font-weight:bold; }
        input, select { width:100%; padding:14px; margin-top:5px; background:#0b0f19; color:#fff; border:1px solid #2d3748; border-radius:12px; outline:none; box-sizing:border-box; }
        .btn-up { width:100%; padding:16px; background:#38bdf8; border:none; border-radius:12px; font-weight:bold; cursor:pointer; color:#000; }
        .book-list { display:flex; justify-content:space-between; align-items:center; background:#1e293b; padding:12px 18px; border-radius:12px; margin-bottom:8px; border:1px solid #334155; }
    </style></head><body>
    <div class="container">
        <h2 style="color:#38bdf8; text-align:center;">PANEL CONTROL JESTRI</h2>
        
        <div class="card">
            <h3 style="margin-top:0;"><i class="fa-solid fa-plus-circle"></i> Tambah Koleksi</h3>
            <div class="form-group"><label>JUDUL BUKU</label><input id="j"></div>
            <div class="form-group"><label>PENULIS</label><input id="p"></div>
            <div class="form-group"><label>HARGA</label><input id="h" type="number"></div>
            <div class="form-group"><label>GENRE</label><select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select></div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div class="form-group"><label>GAMBAR</label><input type="file" id="fi" style="padding:8px; font-size:0.6rem;"></div>
                <div class="form-group"><label>FILE PDF</label><input type="file" id="fp" style="padding:8px; font-size:0.6rem;"></div>
            </div>
            <button class="btn-up" onclick="up()">PUBLIKASIKAN E-BOOK</button>
        </div>

        <h3 style="color:#ef4444;">Daftar Katalog (${b.length})</h3>
        ${b.map(x => `<div class="book-list">
            <span style="font-size:0.85rem;">${x.judul}</span>
            <a href="/admin/del/${x._id}" style="color:#ef4444;" onclick="return confirm('Hapus buku ini?')"><i class="fa-solid fa-trash-can"></i></a>
        </div>`).join('')}
    </div>
    <script>
        async function up(){
            const fi=document.getElementById('fi').files[0]; const fp=document.getElementById('fp').files[0];
            if(!fi || !fp) return alert("File belum lengkap!");
            const btn=document.querySelector('.btn-up'); btn.innerText="Uploading..."; btn.disabled=true;
            const fdI=new FormData(); fdI.append('file',fi); fdI.append('upload_preset','ml_default');
            const dI=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fdI})).json();
            const fdP=new FormData(); fdP.append('file',fp); fdP.append('upload_preset','ml_default');
            const dP=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fdP})).json();
            await fetch('/admin/save-buku',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:document.getElementById('h').value, genre:document.getElementById('g').value, gambar:dI.secure_url, pdfUrl:dP.secure_url})});
            location.reload();
        }
    </script></body></html>`);
});

// --- 3. BACKEND ROUTES ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;} .box{background:#1e293b;padding:30px;border-radius:20px;text-align:center;width:300px;border:1px solid #334155;} input{width:100%;padding:12px;margin:15px 0;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#fff;text-align:center;box-sizing:border-box;} button{width:100%;padding:12px;background:#38bdf8;border:none;border-radius:8px;font-weight:bold;}</style></head><body><div class="box"><h2 style="color:#fff;">Admin Jestri</h2><form action="/login" method="POST"><input name="pw" type="password" required><button>LOG IN</button></form></div></body></html>`);
});
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save-buku', async (req, res) => { if(req.session.admin) await new Buku({ ...req.body, harga: Number(req.body.harga) }).save(); res.json({ok:true}); });
app.get('/admin/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order-cart', async (req, res) => { await new Order(req.body).save(); res.json({ok:true}); });

app.listen(process.env.PORT || 3000);

