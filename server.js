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
    items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, wallet: String, links: Array
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'jestri_vFinal_PRO', keys: ['JESTRI_SECURE_2026'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (E-BOOK JESTRI) ---
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
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #1e293b; z-index: 5000; transition: 0.4s; padding: 30px 20px; box-shadow: 10px 0 50px rgba(0,0,0,0.5); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 4000; display: none; }
        .overlay.active { display: block; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 15px; }
        .card { background: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; background: #0b0f19; }
        .btn-main { width: 100%; padding: 12px; border-radius: 12px; border: none; background: #38bdf8; color: #0f172a; font-weight: 800; cursor: pointer; }
        .sosmed { position: fixed; bottom: 25px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 9999; }
        .sos-btn { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.4rem; text-decoration: none; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        #cart-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .box { background: #1e293b; width: 100%; max-width: 400px; border-radius: 25px; padding: 25px; border: 1px solid #38bdf8; }
        .w-card { background: #0f172a; padding: 10px; border-radius: 10px; text-align: center; font-size: 0.7rem; font-weight: 800; border: 1px solid #334155; cursor: pointer; }
        .w-card.active { border-color: #38bdf8; color: #38bdf8; }
    </style></head><body>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h3 style="color:#38bdf8;">E-BOOK JESTRI</h3>
        <a href="#" style="color:#fff; text-decoration:none; font-weight:800;" onclick="render('Semua')">Semua Koleksi</a>
        <p style="font-size:0.6rem; color:#38bdf8; margin-top:20px; letter-spacing:2px;">GENRE</p>
        ${LIST_GENRE.map(g => `<div onclick="setG('${g}', this)" style="padding:10px 0; cursor:pointer; color:#cbd5e1;">${g}</div>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" style="display:block; margin-top:30px; padding:15px; background:#fbbf24; color:#000; text-align:center; border-radius:12px; font-weight:900; text-decoration:none;">DONATE ADMIN</a>
    </div>
    <div class="header">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.4rem;"></i>
        <b style="font-size:1.1rem;">E-BOOK JESTRI</b>
        <div onclick="openCart()" style="position:relative;"><i class="fa-solid fa-cart-shopping" style="color:#38bdf8; font-size:1.3rem;"></i><span id="cc" style="position:absolute; -10px; right:-10px; background:#ef4444; font-size:0.6rem; padding:2px 6px; border-radius:50%;">0</span></div>
    </div>
    <div id="mainGrid" class="grid"></div>
    <div class="sosmed">
        <a href="https://wa.me/6285189415489" class="sos-btn" style="background:#22c55e"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="sos-btn" style="background:radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%,#d6249f 60%,#285AEB 90%);"><i class="fa-brands fa-instagram"></i></a>
    </div>
    <div id="cart-modal"><div class="box" id="mBox">
        <h3>Keranjang</h3>
        <div id="cItems"></div>
        <p>Total: <b id="cTotal" style="color:#22c55e;">Rp 0</b></p>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin:15px 0;">
            <div class="w-card" onclick="selW('DANA',this)">DANA</div>
            <div class="w-card" onclick="selW('OVO',this)">OVO</div>
            <div class="w-card" onclick="selW('GOPAY',this)">GOPAY</div>
        </div>
        <div id="payArea" style="display:none;">
            <p style="font-size:0.7rem; color:#94a3b8;">TF ke 0895327806441</p>
            <input type="file" id="fBukti" style="font-size:0.7rem; margin-bottom:10px;">
            <button class="btn-main" onclick="checkout()">KONFIRMASI BAYAR</button>
        </div>
        <button id="btnNext" class="btn-main" onclick="showPay()" style="background:#22c55e;">CHECKOUT</button>
        <button onclick="document.getElementById('cart-modal').style.display='none'" style="width:100%; background:none; border:none; color:#64748b; margin-top:10px;">Batal</button>
    </div></div>
    <script>
        let books = []; let cart = []; let wallet = '';
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(){ const r = await fetch('/api/buku-json'); books = await r.json(); render('Semua'); }
        function render(g){
            const f = g === 'Semua' ? books : books.filter(b=>b.genre===g);
            const grid = document.getElementById('mainGrid');
            if(f.length===0){ grid.innerHTML = \`<div style="grid-column:1/-1; text-align:center; padding:100px 20px;">Genre \${g} Belum Tersedia</div>\`; return; }
            grid.innerHTML = f.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}" onerror="this.src='https://placehold.co/300x400?text=No+Cover'">
                    <div style="padding:12px;">
                        <div style="font-size:0.75rem; font-weight:800; height:2.4em; overflow:hidden;">\${x.judul}</div>
                        <div style="color:#22c55e; font-weight:800; margin:10px 0;">Rp \${Number(x.harga).toLocaleString('id-ID')}</div>
                        <button class="btn-main" style="font-size:0.7rem; padding:8px;" onclick="add('\${x._id}')">AMBIL BUKU</button>
                    </div>
                </div>\`).join('');
        }
        function setG(g){ if(window.innerWidth<1000) tog(); render(g); }
        function add(id){ const b = books.find(x=>x._id===id); if(cart.some(i=>i._id===id)) return; cart.push(b); document.getElementById('cc').innerText = cart.length; alert("Masuk Keranjang!"); }
        function openCart(){
            document.getElementById('cItems').innerHTML = cart.map((x,i)=>\`<div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.8rem;"><span>\${x.judul}</span><i class="fa-solid fa-trash" style="color:#ef4444" onclick="delC(\${i})"></i></div>\`).join('');
            document.getElementById('cTotal').innerText = 'Rp ' + cart.reduce((a,b)=>a+b.harga,0).toLocaleString('id-ID');
            document.getElementById('cart-modal').style.display='flex';
        }
        function delC(i){ cart.splice(i,1); document.getElementById('cc').innerText=cart.length; openCart(); }
        function selW(w,el){ wallet=w; document.querySelectorAll('.w-card').forEach(c=>c.classList.remove('active')); el.classList.add('active'); }
        function showPay(){ if(cart.length===0 || !wallet) return alert("Pilih buku & wallet!"); document.getElementById('payArea').style.display='block'; document.getElementById('btnNext').style.display='none'; }
        async function checkout(){
            const file = document.getElementById('fBukti').files[0]; if(!file) return alert("Upload Bukti!");
            const btn = document.querySelector('#payArea button'); btn.innerText = "Mengirim..."; btn.disabled=true;
            const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();
            const res = await fetch('/api/order-cart', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: img.secure_url, wallet: wallet })
            });
            const order = await res.json();
            document.getElementById('mBox').innerHTML = \`<h3>Menunggu Approval</h3><p style="font-size:0.8rem;">Admin sedang memvalidasi transfer Anda. <b>Jangan tutup halaman ini</b> agar tombol download muncul.</p><div id="dl-area" style="margin-top:20px; text-align:center;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>\`;
            const interval = setInterval(async () => {
                const check = await fetch('/api/check-order/'+order.id);
                const stat = await check.json();
                if(stat.status === 'Approved'){
                    clearInterval(interval);
                    document.getElementById('dl-area').innerHTML = stat.links.map(l => \`<a href="\${l.url.replace('/upload/','/upload/fl_attachment/')}" download style="display:block; background:#10b981; color:#fff; padding:15px; border-radius:12px; margin-bottom:10px; text-decoration:none; font-weight:800;">DOWNLOAD: \${l.judul}</a>\`).join('');
                }
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. DASHBOARD ADMIN (KONFIRMASI PEMBAYARAN & DOWNLOAD FIX) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { background:#0b0f19; color:#fff; font-family:sans-serif; padding:15px; }
        .card { background:#161e2d; padding:20px; border-radius:20px; border:1px solid #2d3748; margin-bottom:20px; }
        input, select { width:100%; padding:12px; margin:10px 0; background:#0b0f19; color:#fff; border:1px solid #2d3748; border-radius:10px; }
        .btn { width:100%; padding:15px; border-radius:12px; border:none; font-weight:800; background:#38bdf8; color:#000; }
        .order-card { background:#1e293b; padding:15px; border-radius:15px; border-left:5px solid #22c55e; margin-bottom:15px; }
        .btn-approve { background:#22c55e; color:#fff; padding:10px 20px; border-radius:10px; text-decoration:none; display:inline-block; font-weight:bold; }
    </style></head><body>
    <div style="max-width:600px; margin:auto;">
        <h2 style="color:#38bdf8; text-align:center;">ADMIN E-BOOK JESTRI</h2>
        <div class="card">
            <h3>Upload Buku</h3>
            <input id="j" placeholder="Judul Buku">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <input id="p" placeholder="Penulis">
                <input id="h" type="number" placeholder="Harga">
            </div>
            <select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <label>Cover (Img)<input type="file" id="fi"></label>
                <label>E-Book (Pdf)<input type="file" id="fp"></label>
            </div>
            <button class="btn" onclick="up()">PUBLISH BUKU</button>
        </div>

        <h3 style="color:#fbbf24;">Menunggu Persetujuan (${o.length})</h3>
        ${o.map(x => `<div class="order-card">
            <b>Total: Rp ${x.total.toLocaleString('id-ID')} (${x.wallet})</b><br>
            <p style="font-size:0.8rem; color:#cbd5e1;">Item: ${x.items.map(i=>i.judul).join(', ')}</p>
            <a href="${x.bukti}" target="_blank" style="color:#38bdf8; font-size:0.8rem;">LIHAT BUKTI TRANSFER</a><br><br>
            <a href="/admin/approve-order/${x._id}" class="btn-approve">APPROVE (KIRIM PDF)</a>
        </div>`).join('')}

        <h3>Daftar Koleksi</h3>
        ${b.map(x => `<div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #334155;">
            <span>${x.judul}</span>
            <a href="/admin/del/${x._id}" style="color:#ef4444;"><i class="fa-solid fa-trash"></i></a>
        </div>`).join('')}
    </div>
    <script>
        async function up(){
            const fi=document.getElementById('fi').files[0]; const fp=document.getElementById('fp').files[0];
            const btn=document.querySelector('.btn'); btn.innerText="Uploading...";
            const fdI=new FormData(); fdI.append('file',fi); fdI.append('upload_preset','ml_default');
            const dI=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fdI})).json();
            const fdP=new FormData(); fdP.append('file',fp); fdP.append('upload_preset','ml_default');
            const dP=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fdP})).json();
            await fetch('/admin/save-buku',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:document.getElementById('h').value, genre:document.getElementById('g').value, gambar:dI.secure_url, pdfUrl:dP.secure_url})});
            location.reload();
        }
    </script></body></html>`);
});

// --- 3. BACKEND SYSTEM (LOGIC FIX) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><body style="background:#0f172a; color:#fff; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;">
    <form action="/login" method="POST" style="background:#1e293b; padding:30px; border-radius:20px; text-align:center;">
        <h2>ADMIN JESTRI</h2><input name="pw" type="password" style="padding:10px; border-radius:10px; border:none; margin:10px 0;"><br><button style="padding:10px 20px; background:#38bdf8; border:none; border-radius:10px; font-weight:bold;">LOGIN</button>
    </form></body></html>`);
});
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save-buku', async (req, res) => { if(req.session.admin) await new Buku({ ...req.body, harga: Number(req.body.harga) }).save(); res.json({ok:true}); });
app.get('/admin/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); });

// APPROVAL LOGIC
app.get('/admin/approve-order/:id', async (req, res) => {
    if(!req.session.admin) return res.send("No Access");
    const order = await Order.findById(req.params.id);
    const links = [];
    for(let item of order.items){
        const b = await Buku.findById(item._id);
        if(b) links.push({ judul: b.judul, url: b.pdfUrl });
    }
    await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', links: links });
    res.redirect('/admin');
});

app.post('/api/order-cart', async (req, res) => {
    const o = new Order(req.body); await o.save();
    res.json({ id: o._id });
});
app.get('/api/check-order/:id', async (req, res) => {
    const o = await Order.findById(req.params.id);
    res.json(o);
});
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));

app.listen(process.env.PORT || 3000);

