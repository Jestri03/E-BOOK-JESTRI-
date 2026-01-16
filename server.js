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
    items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, wallet: String
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'jestri_vFinal_Real', keys: ['JESTRI_2026_PRO'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (BRANDING E-BOOK JESTRI) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #0f172a; color: #f8fafc; overflow-x: hidden; }
        
        /* HEADER */
        .header { position: sticky; top: 0; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(15px); z-index: 1000; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .logo { font-weight: 800; font-size: 1.1rem; letter-spacing: 1px; color: #fff; text-transform: uppercase; }

        /* SIDEBAR */
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #1e293b; z-index: 5000; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); padding: 30px 20px; border-right: 1px solid rgba(56, 189, 248, 0.2); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 4000; display: none; backdrop-filter: blur(5px); }
        .overlay.active { display: block; }

        .label-genre { font-size: 0.65rem; font-weight: 800; color: #38bdf8; margin: 30px 0 10px 0; display: block; text-transform: uppercase; letter-spacing: 3px; opacity: 0.8; }
        .nav-link { display: block; padding: 12px 15px; color: #cbd5e1; text-decoration: none; font-weight: 600; border-radius: 12px; margin-bottom: 8px; transition: 0.3s; }
        .nav-link.active { background: #38bdf8; color: #0f172a; box-shadow: 0 4px 15px rgba(56,189,248,0.3); }

        /* SOSMED - SELALU DI ATAS */
        .sosmed-float { position: fixed; bottom: 30px; right: 20px; display: flex; flex-direction: column; gap: 15px; z-index: 9999; }
        .sos-btn { width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.6rem; text-decoration: none; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.1); }

        /* GRID BUKU */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px; max-width: 1000px; margin: auto; }
        .card { background: #1e293b; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); transition: 0.3s; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .card-body { padding: 15px; }
        .card-price { color: #22c55e; font-weight: 800; font-size: 1rem; margin-top: 5px; }

        /* CART MODAL & E-WALLET */
        #cart-modal { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.95); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .cart-box { background: #1e293b; width: 100%; max-width: 400px; border-radius: 30px; padding: 30px; border: 1px solid rgba(56, 189, 248, 0.3); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .wallet-options { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 20px 0; }
        .wallet-card { background: #0f172a; padding: 10px; border-radius: 12px; text-align: center; font-size: 0.7rem; font-weight: 800; border: 1px solid #334155; cursor: pointer; }
        .wallet-card.active { border-color: #38bdf8; background: rgba(56, 189, 248, 0.1); color: #38bdf8; }

        .btn-main { width: 100%; padding: 16px; border-radius: 15px; border: none; background: #38bdf8; color: #0f172a; font-weight: 800; font-size: 0.9rem; cursor: pointer; }
    </style></head><body>

    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <div style="font-weight:900; color:#fff; font-size:1.2rem; margin-bottom:20px;">E-BOOK JESTRI</div>
        <a href="#" class="nav-link active" onclick="setG('Semua', this)">Semua Koleksi</a>
        <span class="label-genre">MENU GENRE</span>
        ${LIST_GENRE.map(g => `<a href="#" class="nav-link" onclick="setG('${g}', this)">${g}</a>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" style="display:block; margin-top:40px; padding:18px; background:#fbbf24; color:#000; text-align:center; border-radius:15px; font-weight:900; text-decoration:none; font-size:0.8rem;">DONASI ADMIN (DANA)</a>
    </div>

    <div class="header">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.4rem; color:#38bdf8;"></i>
        <div class="logo">E-BOOK JESTRI</div>
        <div onclick="openCart()" style="position:relative;">
            <i class="fa-solid fa-cart-arrow-down" style="font-size:1.4rem; color:#38bdf8;"></i>
            <span id="cc" style="position:absolute; top:-10px; right:-10px; background:#ef4444; color:#fff; font-size:0.6rem; padding:3px 7px; border-radius:50%; font-weight:900;">0</span>
        </div>
    </div>

    <div id="mainGrid" class="grid"></div>

    <div class="sosmed-float">
        <a href="https://wa.me/6285189415489" class="sos-btn" style="background:#22c55e;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="sos-btn" style="background:linear-gradient(45deg, #f09433, #dc2743, #bc1888);"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="cart-modal">
        <div class="cart-box">
            <h3 style="margin-top:0;">Konfirmasi Pesanan</h3>
            <div id="cart-items" style="max-height:150px; overflow-y:auto; margin-bottom:15px;"></div>
            <p style="margin:0;">Total: <b id="cart-total" style="color:#22c55e; font-size:1.2rem;">Rp 0</b></p>
            
            <span class="label-genre" style="margin-top:20px;">PILIH METODE E-WALLET</span>
            <div class="wallet-options">
                <div class="wallet-card" onclick="selW('DANA', this)">DANA</div>
                <div class="wallet-card" onclick="selW('OVO', this)">OVO</div>
                <div class="wallet-card" onclick="selW('GOPAY', this)">GOPAY</div>
            </div>

            <div id="checkout-form" style="display:none;">
                <p style="font-size:0.7rem; color:#94a3b8;">Kirim ke nomor: <b>0895327806441</b></p>
                <input type="file" id="bukti-file" style="width:100%; margin-bottom:15px; font-size:0.8rem;">
                <button class="btn-main" onclick="checkout()">SELESAIKAN PEMBAYARAN</button>
            </div>
            
            <button id="btn-next" class="btn-main" style="background:#22c55e; margin-top:10px;" onclick="showForm()">LANJUT KE PEMBAYARAN</button>
            <button onclick="document.getElementById('cart-modal').style.display='none'" style="width:100%; background:none; border:none; color:#64748b; margin-top:15px; font-weight:700;">BATAL</button>
        </div>
    </div>

    <script>
        let books = []; let cart = []; let selectedWallet = '';
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(){ const r = await fetch('/api/buku-json'); books = await r.json(); render('Semua'); }
        
        function render(g){
            const f = g === 'Semua' ? books : books.filter(b => b.genre === g);
            const grid = document.getElementById('mainGrid');
            if(f.length===0){ grid.innerHTML = \`<div style="grid-column:1/-1; text-align:center; padding:100px 20px; opacity:0.5;">E-Book genre \${g} belum tersedia.</div>\`; return; }
            grid.innerHTML = f.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}">
                    <div class="card-body">
                        <div style="font-size:0.8rem; font-weight:700; height:2.4em; overflow:hidden;">\${x.judul}</div>
                        <div class="card-price">Rp \${Number(x.harga).toLocaleString('id-ID')}</div>
                        <button class="btn-main" style="padding:10px; margin-top:10px; font-size:0.7rem;" onclick="addCart('\${x._id}')">MASUKKAN KERANJANG</button>
                    </div>
                </div>\`).join('');
        }

        function setG(g, el){ document.querySelectorAll('.nav-link').forEach(n=>n.classList.remove('active')); el.classList.add('active'); if(window.innerWidth<1000) tog(); render(g); }
        function addCart(id){ const b = books.find(x=>x._id===id); if(cart.some(i=>i._id===id)) return alert("Sudah ada!"); cart.push(b); document.getElementById('cc').innerText = cart.length; alert("Berhasil ditambah!"); }
        
        function openCart(){
            const list = document.getElementById('cart-items');
            list.innerHTML = cart.map((x,i)=>\`<div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:0.85rem;"><span>\${x.judul}</span><i class="fa-solid fa-trash" style="color:#ef4444" onclick="remove(\${i})"></i></div>\`).join('');
            let total = cart.reduce((a,b)=>a+b.harga,0);
            document.getElementById('cart-total').innerText = 'Rp ' + total.toLocaleString('id-ID');
            document.getElementById('cart-modal').style.display = 'flex';
        }

        function remove(i){ cart.splice(i,1); document.getElementById('cc').innerText = cart.length; openCart(); }
        function selW(w, el){ selectedWallet = w; document.querySelectorAll('.wallet-card').forEach(c=>c.classList.remove('active')); el.classList.add('active'); }
        function showForm(){ if(cart.length===0 || !selectedWallet) return alert("Pilih buku & metode e-wallet!"); document.getElementById('checkout-form').style.display='block'; document.getElementById('btn-next').style.display='none'; }

        async function checkout(){
            const file = document.getElementById('bukti-file').files[0]; if(!file) return alert("Upload bukti transfer!");
            const btn = document.querySelector('#checkout-form button'); btn.innerText = "Mengirim..."; btn.disabled = true;
            
            const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();

            await fetch('/api/order-cart', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: img.secure_url, wallet: selectedWallet })
            });
            alert("Berhasil! Silahkan hubungi WA admin untuk percepat proses.");
            location.reload();
        }
        load();
    </script></body></html>`);
});

// --- 2. DASHBOARD ADMIN (UI SEIMBANG & BRANDING) ---
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
        .card { background:#161e2d; padding:25px; border-radius:24px; border:1px solid #2d3748; margin-bottom:20px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        input, select { width:100%; padding:14px; margin-top:5px; background:#0b0f19; color:#fff; border:1px solid #2d3748; border-radius:12px; outline:none; box-sizing:border-box; font-size:0.9rem; }
        .btn-up { width:100%; padding:16px; background:#38bdf8; border:none; border-radius:15px; font-weight:900; color:#000; margin-top:15px; }
        .book-item { background:#1e293b; padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; border:1px solid #334155; }
    </style></head><body>
    <div class="container">
        <h2 style="color:#38bdf8; text-align:center;">ADMIN E-BOOK JESTRI</h2>
        
        <div class="card">
            <h3 style="margin-top:0;">Input Buku Baru</h3>
            <div style="margin-bottom:15px;"><label style="font-size:0.7rem; color:#94a3b8;">JUDUL LENGKAP</label><input id="j"></div>
            <div class="form-row">
                <div><label style="font-size:0.7rem; color:#94a3b8;">PENULIS</label><input id="p"></div>
                <div><label style="font-size:0.7rem; color:#94a3b8;">HARGA (RP)</label><input id="h" type="number"></div>
            </div>
            <div style="margin-top:15px;"><label style="font-size:0.7rem; color:#94a3b8;">GENRE</label><select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select></div>
            <div class="form-row" style="margin-top:15px;">
                <div><label style="font-size:0.7rem; color:#94a3b8;">COVER (IMG)</label><input type="file" id="fi"></div>
                <div><label style="font-size:0.7rem; color:#94a3b8;">FILE E-BOOK</label><input type="file" id="fp"></div>
            </div>
            <button class="btn-up" onclick="up()">POSTING BUKU SEKARANG</button>
        </div>

        <h3>Katalog Buku (${b.length})</h3>
        ${b.map(x => `<div class="book-item">
            <span>${x.judul}</span>
            <a href="/admin/del/${x._id}" style="color:#ef4444;" onclick="return confirm('Hapus?')"><i class="fa-solid fa-trash-can"></i></a>
        </div>`).join('')}
    </div>
    <script>
        async function up(){
            const fi=document.getElementById('fi').files[0]; const fp=document.getElementById('fp').files[0];
            if(!fi || !fp) return alert("Lengkapi file!");
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

// --- 3. LOGIN & API ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{background:#0f172a;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;} .box{background:#1e293b;padding:30px;border-radius:24px;text-align:center;width:300px;border:1px solid #334155;} input{width:100%;padding:14px;margin:20px 0;border-radius:12px;border:1px solid #334155;background:#0f172a;color:#fff;text-align:center;box-sizing:border-box;} button{width:100%;padding:14px;background:#38bdf8;border:none;border-radius:12px;font-weight:900;}</style></head><body><div class="box"><h2 style="color:#fff;">ADMIN ACCESS</h2><form action="/login" method="POST"><input name="pw" type="password" required><button>MASUK</button></form></div></body></html>`);
});
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save-buku', async (req, res) => { if(req.session.admin) await new Buku({ ...req.body, harga: Number(req.body.harga) }).save(); res.json({ok:true}); });
app.get('/admin/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order-cart', async (req, res) => { await new Order(req.body).save(); res.json({ok:true}); });

app.listen(process.env.PORT || 3000);

