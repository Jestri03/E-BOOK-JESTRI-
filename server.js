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
    items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, wallet: String, pdfLink: String
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'jestri_vFinal_Pro', keys: ['JESTRI_SECURE_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #0f172a; color: #f8fafc; overflow-x: hidden; }
        
        .header { position: sticky; top: 0; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(10px); z-index: 1000; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #1e293b; z-index: 5000; transition: 0.4s; padding: 25px; box-shadow: 10px 0 50px rgba(0,0,0,0.5); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 4500; display: none; }
        .overlay.active { display: block; }
        
        .search-container { padding: 10px 15px; background: #0f172a; }
        .search-bar { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #334155; background: #1e293b; color: white; outline: none; }
        
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 15px; }
        .card { background: #1e293b; border-radius: 15px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; background: #0b0f19; }
        
        .btn-buy { width: 100%; padding: 10px; border: none; border-radius: 10px; background: #38bdf8; color: #0f172a; font-weight: 800; cursor: pointer; margin-top: 8px; font-size: 0.75rem; }
        
        /* TOAST NOTIFIKASI */
        #toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #38bdf8; color: #0f172a; padding: 12px 25px; border-radius: 50px; font-weight: 800; font-size: 0.85rem; z-index: 10000; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5); animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { bottom: -50px; opacity: 0; } to { bottom: 80px; opacity: 1; } }

        .sosmed { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 4000; }
        .sos-btn { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none; font-size: 1.3rem; }

        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .box { background: #1e293b; width: 100%; max-width: 380px; border-radius: 25px; padding: 25px; border: 1px solid #38bdf8; }
    </style></head><body>

    <div id="toast">Berhasil ditambahkan!</div>
    <div class="overlay" id="ov" onclick="tog()"></div>
    
    <div class="sidebar" id="sb">
        <h2 style="color:#38bdf8;">JESTRI E-BOOK</h2>
        <div class="nav-item" onclick="setG('Semua', this)">Semua Koleksi</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
    </div>

    <div class="header">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="color:#38bdf8; font-size:1.3rem;"></i>
        <b style="letter-spacing:1px;">JESTRI STORE</b>
        <div onclick="openCart()" style="position:relative;"><i class="fa-solid fa-cart-shopping" style="color:#38bdf8;"></i><span id="cc" style="position:absolute; top:-10px; right:-10px; background:#ef4444; font-size:0.6rem; padding:2px 6px; border-radius:50%;">0</span></div>
    </div>

    <div class="search-container">
        <input type="text" id="srch" class="search-bar" placeholder="Cari judul buku..." oninput="findB()">
    </div>

    <div id="mainGrid" class="grid"></div>

    <div class="sosmed">
        <a href="https://wa.me/6285189415489" class="sos-btn" style="background:#22c55e;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="sos-btn" style="background:linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal"><div class="box" id="mBox">
        <h3 style="margin-top:0;">Checkout</h3>
        <div id="cItems" style="font-size:0.8rem; margin-bottom:15px; max-height:150px; overflow-y:auto;"></div>
        <div style="display:flex; justify-content:space-between; font-weight:800; border-top:1px solid #334155; padding-top:10px;">
            <span>Total:</span><span id="cTotal" style="color:#22c55e;">Rp 0</span>
        </div>
        <select id="selW" style="width:100%; padding:12px; border-radius:10px; margin:15px 0; background:#0f172a; color:white; border:1px solid #334155;">
            <option value="DANA">DANA (0895327806441)</option>
            <option value="OVO">OVO (0895327806441)</option>
            <option value="GOPAY">GOPAY (0895327806441)</option>
        </select>
        <input type="file" id="fBukti" style="font-size:0.75rem; margin-bottom:15px; width:100%;">
        <button class="btn-buy" onclick="checkout()" style="background:#22c55e; color:white; height:45px; font-size:0.9rem;">KONFIRMASI BAYAR</button>
        <button onclick="location.reload()" style="width:100%; background:none; border:none; color:#64748b; margin-top:15px;">Batal</button>
    </div></div>

    <script>
        let books = []; let cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(){ const r = await fetch('/api/buku-json?v='+Date.now()); books = await r.json(); render(books); }
        
        function render(data){
            const grid = document.getElementById('mainGrid');
            grid.innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" loading="lazy" onerror="this.src='https://placehold.co/400x600?text=Gambar+Buku'">
                    <div style="padding:10px;">
                        <div style="font-size:0.7rem; font-weight:800; height:2.4em; overflow:hidden;">\${x.judul}</div>
                        <div style="color:#22c55e; font-weight:800; margin-top:5px; font-size:0.85rem;">Rp \${new Intl.NumberFormat('id-ID').format(x.harga)}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">AMBIL BUKU</button>
                    </div>
                </div>\`).join('');
        }

        function findB(){
            const k = document.getElementById('srch').value.toLowerCase();
            render(books.filter(b => b.judul.toLowerCase().includes(k)));
        }

        function setG(g, el){
            const filtered = g === 'Semua' ? books : books.filter(b => b.genre === g);
            render(filtered); tog();
        }

        function showToast() {
            const t = document.getElementById('toast');
            t.style.display = 'block';
            setTimeout(() => { t.style.display = 'none'; }, 2000);
        }

        function add(id){
            const b = books.find(x=>x._id===id);
            if(cart.some(i=>i._id===id)) return;
            cart.push(b);
            document.getElementById('cc').innerText = cart.length;
            showToast(); // PENGGANTI ALERT
        }

        function openCart(){
            if(cart.length === 0) return alert("Keranjang kosong");
            document.getElementById('cItems').innerHTML = cart.map((x,i)=>\`<div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span>\${x.judul}</span><i class="fa-solid fa-trash" onclick="delC(\${i})" style="color:#ef4444"></i></div>\`).join('');
            document.getElementById('cTotal').innerText = 'Rp ' + new Intl.NumberFormat('id-ID').format(cart.reduce((a,b)=>a+b.harga,0));
            document.getElementById('modal').style.display = 'flex';
        }

        function delC(i){ cart.splice(i,1); document.getElementById('cc').innerText=cart.length; if(cart.length===0) location.reload(); else openCart(); }

        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Pilih bukti!");
            const btn = document.querySelector('#mBox .btn-buy'); btn.innerText = "Processing..."; btn.disabled = true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();
            const res = await fetch('/api/order', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: img.secure_url, wallet: document.getElementById('selW').value })
            });
            const order = await res.json();
            document.getElementById('mBox').innerHTML = \`<h3>Berhasil!</h3><p style="font-size:0.8rem;">Pesanan dikirim ke admin. Link download akan muncul otomatis.</p><div id="dl-box" style="margin-top:20px; text-align:center;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>\`;
            const cek = setInterval(async () => {
                const rs = await fetch('/api/check/'+order.id); const st = await rs.json();
                if(st.status === 'Approved'){
                    clearInterval(cek);
                    document.getElementById('dl-box').innerHTML = \`<a href="\${st.pdfLink.replace('/upload/','/upload/fl_attachment/')}" download style="display:block; background:#10b981; color:white; padding:15px; border-radius:12px; text-decoration:none; font-weight:800;">DOWNLOAD PDF</a>\`;
                }
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- BACKEND ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.send(`<form action="/login" method="POST" style="background:#0f172a; height:100vh; display:flex; align-items:center; justify-content:center;"><input name="pw" type="password" placeholder="Pass" autofocus style="padding:15px; border-radius:10px;"></form>`);
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{background:#0b0f19;color:#fff;font-family:sans-serif;padding:20px}input,select{width:100%;padding:12px;margin:5px 0;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:8px;box-sizing:border-box}</style></head><body>
    <h3>ADMIN PANEL</h3>
    <div style="background:#161e2d; padding:15px; border-radius:15px;">
        <input id="j" placeholder="Judul"><input id="p" placeholder="Penulis"><input id="h" type="number" placeholder="Harga murni (cth: 2800)"><select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select><input type="file" id="fi"><button onclick="addB()" style="width:100%;padding:15px;margin-top:10px;background:#38bdf8;border:none;border-radius:10px;font-weight:bold">POSTING</button>
    </div>
    <h4>Orders (${o.length})</h4>
    ${o.map(x=>`<div style="background:#1e293b;padding:15px;border-radius:10px;margin-bottom:10px">Rp \${new Intl.NumberFormat('id-ID').format(x.total)}<br><a href="\${x.bukti}" target="_blank" style="color:#38bdf8">Bukti TF</a><input type="file" id="pdf-\${x._id}"><button onclick="acc('\${x._id}')" style="background:#22c55e;border:none;padding:10px;width:100%;margin-top:5px;border-radius:5px;color:white">APPROVE</button></div>`).join('')}
    <h4>Katalog</h4>
    ${b.map(x=>`<div style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #334155"><span>\${x.judul}</span><a href="/admin/del/\${x._id}" style="color:red">Hapus</a></div>`).join('')}
    <script>
        async function addB(){
            const fi=document.getElementById('fi').files[0]; if(!fi) return alert("Pilih cover!");
            const fdI=new FormData(); fdI.append('file',fi); fdI.append('upload_preset','ml_default');
            const dI=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fdI})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:dI.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f=document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Upload PDF!");
            const fd=new FormData(); fd.append('file',f); fd.append('upload_preset','ml_default');
            const up=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
    </script></body></html>`);
});

app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.get('/admin/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

