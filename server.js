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
app.use(cookieSession({ name: 'jestri_luxury_v1', keys: ['GOLD_KEY_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (LUXURY INTERFACE) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI | Premium Library</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Marcellus&family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        
        :root { --gold: #d4af37; --dark: #050a14; --card-bg: rgba(255, 255, 255, 0.03); }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: var(--dark); color: #e2e8f0; overflow-x: hidden; }
        
        /* HEADER MEWAH */
        .header { position: sticky; top: 0; background: rgba(5, 10, 20, 0.8); backdrop-filter: blur(20px); z-index: 1000; padding: 18px 25px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(212, 175, 55, 0.2); }
        .logo { font-family: 'Marcellus', serif; color: var(--gold); font-size: 1.4rem; letter-spacing: 2px; font-weight: bold; }

        /* SEARCH BAR LUXE */
        .search-box { padding: 15px 25px; }
        .search-bar { width: 100%; padding: 14px 20px; border-radius: 15px; border: 1px solid rgba(212, 175, 55, 0.3); background: rgba(255,255,255,0.05); color: white; outline: none; transition: 0.3s; }
        .search-bar:focus { border-color: var(--gold); box-shadow: 0 0 15px rgba(212, 175, 55, 0.1); }

        /* SIDEBAR & NAV */
        .sidebar { position: fixed; top: 0; left: -300px; width: 300px; height: 100%; background: #080f1d; z-index: 5000; transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1); padding: 30px; border-right: 1px solid var(--gold); }
        .sidebar.active { left: 0; }
        .nav-item { padding: 15px; color: #94a3b8; cursor: pointer; border-radius: 12px; margin-bottom: 8px; font-size: 0.9rem; transition: 0.3s; border-left: 0 solid var(--gold); }
        .nav-item:hover, .nav-item.active { background: rgba(212, 175, 55, 0.1); color: var(--gold); border-left: 4px solid var(--gold); padding-left: 20px; }

        /* GRID BUKU */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 20px; }
        .card { background: var(--card-bg); border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); transition: 0.4s; position: relative; }
        .card:hover { transform: translateY(-10px); border-color: var(--gold); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .card-body { padding: 15px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); }
        .price { color: var(--gold); font-weight: 800; font-size: 1rem; margin: 8px 0; }
        .btn-buy { width: 100%; padding: 12px; border: 1px solid var(--gold); border-radius: 12px; background: transparent; color: var(--gold); font-weight: bold; cursor: pointer; transition: 0.3s; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1px; }
        .btn-buy:hover { background: var(--gold); color: black; }

        /* FLOATING TOAST */
        #toast { position: fixed; top: 20px; right: -300px; background: var(--gold); color: black; padding: 15px 30px; border-radius: 15px; font-weight: bold; z-index: 9999; transition: 0.5s; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }

        .donate-btn { display: block; background: var(--gold); color: black; text-align: center; padding: 15px; border-radius: 12px; text-decoration: none; font-weight: 900; margin-top: 40px; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 4500; display: none; backdrop-filter: blur(5px); }
        
        .cart-badge { background: var(--gold); color: black; font-size: 0.7rem; padding: 2px 7px; border-radius: 50%; position: absolute; top: -10px; right: -10px; font-weight: 900; }
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .modal-box { background: #0f172a; width: 100%; max-width: 400px; border-radius: 30px; padding: 30px; border: 1px solid var(--gold); }
    </style></head><body>

    <div id="toast">Added to Collection</div>
    <div class="overlay" id="ov" onclick="tog()"></div>

    <div class="sidebar" id="sb">
        <div class="logo" style="margin-bottom:40px;">E-BOOK JESTRI</div>
        <div class="nav-item active" onclick="setG('Semua', this)">All Collections</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" class="donate-btn">SUPPORT ADMIN</a>
    </div>

    <div class="header">
        <i class="fa-solid fa-align-left" onclick="tog()" style="font-size:1.5rem; color:var(--gold);"></i>
        <div class="logo">E-BOOK JESTRI</div>
        <div onclick="openCart()" style="position:relative; cursor:pointer;">
            <i class="fa-solid fa-crown" style="color:var(--gold); font-size:1.4rem;"></i>
            <span id="cc" class="cart-badge">0</span>
        </div>
    </div>

    <div class="search-box">
        <input type="text" id="src" class="search-bar" placeholder="Search premium titles..." oninput="findB()">
    </div>

    <div id="mainGrid" class="grid"></div>

    <div id="modal"><div class="modal-box" id="mBox">
        <h3 style="color:var(--gold); margin-top:0; font-family:'Marcellus';">Your Collection</h3>
        <div id="cItems" style="margin-bottom:20px; max-height:200px; overflow-y:auto;"></div>
        <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(212,175,55,0.2); padding-top:15px; font-weight:800;">
            <span>Total Value</span><span id="cTotal" style="color:var(--gold);">Rp 0</span>
        </div>
        <select id="selW" style="width:100%; padding:14px; border-radius:12px; margin:20px 0; background:#050a14; color:white; border:1px solid var(--gold);">
            <option value="DANA">DANA (0895327806441)</option>
            <option value="OVO">OVO (0895327806441)</option>
            <option value="GOPAY">GOPAY (0895327806441)</option>
        </select>
        <input type="file" id="fBukti" style="font-size:0.8rem; margin-bottom:20px; color:#94a3b8;">
        <button class="btn-buy" onclick="checkout()" style="background:var(--gold); color:black; height:50px;">BUY NOW</button>
        <button onclick="location.reload()" style="width:100%; background:none; border:none; color:#64748b; margin-top:15px; cursor:pointer;">Cancel</button>
    </div></div>

    <script>
        let books = []; let cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        
        async function load(){ 
            const r = await fetch('/api/buku-json?v='+Date.now()); 
            books = await r.json(); 
            render(books); 
        }

        function render(data){
            const grid = document.getElementById('mainGrid');
            if(data.length === 0){ grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:50px; opacity:0.5;">No items found.</p>'; return; }
            grid.innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" loading="lazy" onerror="this.src='https://placehold.co/400x600/050a14/d4af37?text=PREMIUM+EBOOK'">
                    <div class="card-body">
                        <div style="font-size:0.75rem; font-weight:bold; height:2.5em; overflow:hidden;">\${x.judul}</div>
                        <div class="price">Rp \${new Intl.NumberFormat('id-ID').format(x.harga)}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">Get Book</button>
                    </div>
                </div>\`).join('');
        }

        function findB(){
            const k = document.getElementById('src').value.toLowerCase();
            render(books.filter(b => b.judul.toLowerCase().includes(k) || b.penulis.toLowerCase().includes(k)));
        }

        function setG(g, el){
            document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
            el.classList.add('active');
            render(g === 'Semua' ? books : books.filter(b => b.genre === g));
            if(window.innerWidth < 1000) tog();
        }

        function showToast(){
            const t = document.getElementById('toast');
            t.style.right = '20px';
            setTimeout(() => { t.style.right = '-300px'; }, 2500);
        }

        function add(id){
            const b = books.find(x=>x._id===id);
            if(cart.some(i=>i._id===id)) return;
            cart.push(b);
            document.getElementById('cc').innerText = cart.length;
            showToast();
        }

        function openCart(){
            if(cart.length === 0) return alert("Your cart is empty");
            document.getElementById('cItems').innerHTML = cart.map((x,i)=>\`<div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:0.85rem;"><span>\${x.judul}</span><i class="fa-solid fa-xmark" onclick="delC(\${i})" style="color:#ef4444; cursor:pointer;"></i></div>\`).join('');
            document.getElementById('cTotal').innerText = 'Rp ' + new Intl.NumberFormat('id-ID').format(cart.reduce((a,b)=>a+b.harga,0));
            document.getElementById('modal').style.display = 'flex';
        }

        function delC(i){ cart.splice(i,1); document.getElementById('cc').innerText=cart.length; if(cart.length===0) location.reload(); else openCart(); }

        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Upload payment proof");
            const btn = document.querySelector('#mBox .btn-buy'); btn.innerText = "AUTHENTICATING..."; btn.disabled = true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();
            const res = await fetch('/api/order', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: img.secure_url, wallet: document.getElementById('selW').value })
            });
            const order = await res.json();
            document.getElementById('mBox').innerHTML = \`<h3 style="color:var(--gold);">Order Received</h3><p style="font-size:0.8rem; color:#94a3b8;">Our curators are verifying your payment. Your download link will appear below shortly.</p><div id="dl-box" style="margin-top:30px; text-align:center;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--gold);"></i></div>\`;
            const cek = setInterval(async () => {
                const rs = await fetch('/api/check/'+order.id); const st = await rs.json();
                if(st.status === 'Approved'){
                    clearInterval(cek);
                    document.getElementById('dl-box').innerHTML = \`<a href="\${st.pdfLink.replace('/upload/','/upload/fl_attachment/')}" download style="display:block; background:var(--gold); color:black; padding:18px; border-radius:15px; text-decoration:none; font-weight:900;">DOWNLOAD PDF NOW</a>\`;
                }
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. ADMIN PANEL (MODERN LUXURY) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#050a14; color:white; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; margin:0;">
    <form action="/login" method="POST" style="background:#0f172a; padding:40px; border-radius:30px; border:1px solid #d4af37; text-align:center; width:320px;">
        <h2 style="color:#d4af37; font-family:serif; letter-spacing:2px;">ADMIN ACCESS</h2>
        <input name="pw" type="password" placeholder="Passcode" autofocus style="width:100%; padding:15px; margin:25px 0; border-radius:10px; border:1px solid #334155; background:#050a14; color:white; text-align:center;">
        <button style="width:100%; padding:15px; background:#d4af37; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">AUTHORIZE</button>
    </form></body>`);
});

app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body{background:#050a14;color:#fff;font-family:sans-serif;padding:20px}
        .card{background:#0f172a;padding:25px;border-radius:20px;border:1px solid rgba(212,175,55,0.2);margin-bottom:20px}
        input,select{width:100%;padding:14px;margin:8px 0;background:#050a14;color:#fff;border:1px solid #334155;border-radius:10px;box-sizing:border-box}
        .btn-act{background:#d4af37;color:black;border:none;padding:15px;width:100%;border-radius:12px;font-weight:bold;margin-top:10px;cursor:pointer}
    </style></head><body>
    <h2 style="color:#d4af37; text-align:center;">E-BOOK JESTRI ADMIN</h2>
    <div class="card">
        <h4>Add New Collection</h4>
        <input id="j" placeholder="Book Title">
        <input id="p" placeholder="Author Name">
        <input id="h" type="number" placeholder="Price (Numbers only: e.g. 2500)">
        <select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select>
        <input type="file" id="fi">
        <button class="btn-act" onclick="addB()">PUBLISH ITEM</button>
    </div>

    <h4>Pending Requests (${o.length})</h4>
    ${o.map(x=>`<div class="card">
        <b>Rp \${new Intl.NumberFormat('id-ID').format(x.total)} (\${x.wallet})</b><br>
        <a href="\${x.bukti}" target="_blank" style="color:#d4af37">View Receipt</a>
        <input type="file" id="pdf-\${x._id}" style="margin-top:10px;">
        <button onclick="acc('\${x._id}')" class="btn-act" style="background:#22c55e; color:white;">APPROVE & UPLOAD</button>
    </div>`).join('')}

    <h4>Inventory Management</h4>
    ${b.map(x=>`<div style="display:flex;justify-content:space-between;padding:15px;border-bottom:1px solid #1e293b">
        <span>\${x.judul}</span>
        <button onclick="delB('\${x._id}')" style="background:none;border:none;color:#ef4444;cursor:pointer"><i class="fa-solid fa-trash"></i></button>
    </div>`).join('')}

    <script>
        async function addB(){
            const fi=document.getElementById('fi').files[0]; if(!fi) return alert("Select cover!");
            const fdI=new FormData(); fdI.append('file',fi); fdI.append('upload_preset','ml_default');
            const dI=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fdI})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:dI.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f=document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Select PDF!");
            const fd=new FormData(); fd.append('file',f); fd.append('upload_preset','ml_default');
            const up=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
        async function delB(id){ if(confirm('Hapus buku dari katalog?')){ await fetch('/admin/del/'+id); location.reload(); } }
    </script></body></html>`);
});

// --- API ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.get('/admin/del/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.json({ok:true}); } });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

