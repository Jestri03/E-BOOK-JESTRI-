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
app.use(cookieSession({ name: 'jestri_vFinal_Ultra', keys: ['JESTRI_MASTER_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

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
        .nav-item { padding: 12px 15px; color: #cbd5e1; cursor: pointer; border-radius: 10px; margin-bottom: 5px; font-weight: 600; }
        .nav-item.active { background: #38bdf8; color: #0f172a; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 20px; }
        .card { background: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
        .btn-buy { width: 100%; padding: 12px; border: none; border-radius: 12px; background: #38bdf8; color: #0f172a; font-weight: 800; cursor: pointer; margin-top: 10px; }
        .sosmed { position: fixed; bottom: 25px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 4000; }
        .sos-btn { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; text-decoration: none; }
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px; }
        .box { background: #1e293b; width: 100%; max-width: 380px; border-radius: 25px; padding: 25px; border: 1px solid #38bdf8; }
    </style></head><body>

    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h2 style="color:#38bdf8;">E-BOOK JESTRI</h2>
        <div class="nav-item active" onclick="setG('Semua', this)">Semua Koleksi</div>
        <p style="font-size:0.65rem; color:#38bdf8; letter-spacing:2px; margin: 20px 0 10px 15px;">GENRE</p>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
    </div>

    <div class="header">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.4rem; color:#38bdf8;"></i>
        <b>E-BOOK JESTRI</b>
        <div onclick="openCart()" style="position:relative;"><i class="fa-solid fa-cart-shopping" style="color:#38bdf8; font-size:1.4rem;"></i><span id="cc" style="position:absolute; top:-8px; right:-10px; background:#ef4444; font-size:0.6rem; padding:2px 6px; border-radius:50%;">0</span></div>
    </div>

    <div id="mainGrid" class="grid"></div>

    <div class="sosmed">
        <a href="https://wa.me/6285189415489" class="sos-btn" style="background:#22c55e"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="sos-btn" style="background:radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%,#d6249f 60%,#285AEB 90%);"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal">
        <div class="box" id="mBox">
            <h3>Checkout</h3>
            <div id="cItems" style="margin-bottom:15px;"></div>
            <p>Total: <b id="cTotal" style="color:#22c55e;">Rp 0</b></p>
            <select id="selW" style="width:100%; padding:10px; border-radius:10px; margin-bottom:15px; background:#0f172a; color:white; border:1px solid #334155;">
                <option value="DANA">DANA (0895327806441)</option><option value="OVO">OVO</option><option value="GOPAY">GOPAY</option>
            </select>
            <div id="payArea" style="display:none;">
                <input type="file" id="fBukti" style="font-size:0.7rem; margin-bottom:10px;">
                <button class="btn-buy" onclick="checkout()">KONFIRMASI BAYAR</button>
            </div>
            <button id="btnN" class="btn-buy" onclick="document.getElementById('payArea').style.display='block'; this.style.display='none'" style="background:#22c55e;">LANJUT BAYAR</button>
            <button onclick="location.reload()" style="width:100%; background:none; border:none; color:#64748b; margin-top:10px;">Batal</button>
        </div>
    </div>

    <script>
        let books = []; let cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(){ const r = await fetch('/api/buku-json'); books = await r.json(); render('Semua'); }
        
        function render(g){
            const f = g === 'Semua' ? books : books.filter(b=>b.genre===g);
            const grid = document.getElementById('mainGrid');
            if(f.length === 0) {
                grid.innerHTML = \`<div style="grid-column:1/-1;text-align:center;padding:100px 20px;opacity:0.6;">E-book dengan genre \${g} belum tersedia</div>\`;
                return;
            }
            grid.innerHTML = f.map(x => \`
                <div class="card">
                    <img src="\${x.gambar}">
                    <div style="padding:15px;">
                        <div style="font-size:0.8rem; font-weight:800; height:2.4em; overflow:hidden;">\${x.judul}</div>
                        <div style="color:#22c55e; font-weight:800; margin-top:5px;">Rp \${Number(x.harga).toLocaleString('id-ID')}</div>
                        <button class="btn-buy" onclick="add('\${x._id}')">BELI</button>
                    </div>
                </div>\`).join('');
        }

        function setG(g, el){ 
            document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active')); 
            el.classList.add('active'); 
            if(window.innerWidth < 1000) tog();
            render(g); 
        }

        function add(id){ const b = books.find(x=>x._id===id); if(cart.some(i=>i._id===id)) return; cart.push(b); document.getElementById('cc').innerText = cart.length; alert("Masuk Keranjang!"); }
        function openCart(){
            document.getElementById('cItems').innerHTML = cart.map((x,i)=>\`<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>\${x.judul}</span><i class="fa-solid fa-trash" onclick="delC(\${i})" style="color:#ef4444"></i></div>\`).join('');
            document.getElementById('cTotal').innerText = 'Rp ' + cart.reduce((a,b)=>a+b.harga,0).toLocaleString('id-ID');
            document.getElementById('modal').style.display = 'flex';
        }
        function delC(i){ cart.splice(i,1); document.getElementById('cc').innerText=cart.length; openCart(); }

        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Pilih bukti!");
            const btn = document.querySelector('#payArea button'); btn.innerText = "Mengirim..."; btn.disabled = true;
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();
            const res = await fetch('/api/order', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: img.secure_url, wallet: document.getElementById('selW').value })
            });
            const order = await res.json();
            document.getElementById('mBox').innerHTML = \`<h3>Menunggu Admin</h3><p style="font-size:0.8rem;">Admin sedang mengecek pembayaran. Link download akan muncul otomatis di sini.</p><div id="dl-box" style="margin-top:20px; text-align:center;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>\`;
            const cek = setInterval(async () => {
                const rs = await fetch('/api/check/'+order.id); const st = await rs.json();
                if(st.status === 'Approved'){
                    clearInterval(cek);
                    document.getElementById('dl-box').innerHTML = \`<a href="\${st.pdfLink.replace('/upload/','/upload/fl_attachment/')}" download style="display:block; background:#10b981; color:white; padding:15px; border-radius:12px; text-decoration:none; font-weight:800;">DOWNLOAD E-BOOK SEKARANG</a>\`;
                } else if(st.status === 'Rejected'){
                    clearInterval(cek); document.getElementById('dl-box').innerHTML = '<p style="color:#ef4444;">Pembayaran Ditolak.</p>';
                }
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. DASHBOARD ADMIN (UI SEIMBANG & UPLOAD PDF SAAT ACC) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.send(`<script>location.href='/login'</script>`);
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { background:#0b0f19; color:#fff; font-family:sans-serif; padding:15px; margin:0; }
        .card { background:#161e2d; padding:20px; border-radius:20px; border:1px solid #2d3748; margin-bottom:20px; }
        input, select { width:100%; padding:14px; margin:10px 0; background:#0b0f19; color:#fff; border:1px solid #2d3748; border-radius:10px; box-sizing:border-box; }
        .btn { width:100%; padding:16px; border-radius:12px; border:none; font-weight:800; background:#38bdf8; cursor:pointer; }
        .grid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .order-card { background:#1e293b; padding:15px; border-radius:15px; margin-bottom:15px; border-left:4px solid #38bdf8; }
    </style></head><body>
    <div style="max-width:600px; margin:auto;">
        <h2 style="text-align:center; color:#38bdf8;">ADMIN PANEL JESTRI</h2>
        <div class="card">
            <h3>Tambah Katalog Baru</h3>
            <input id="j" placeholder="Judul Buku">
            <div class="grid-row">
                <input id="p" placeholder="Penulis">
                <input id="h" type="number" placeholder="Harga (Nominal)">
            </div>
            <select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select>
            <div class="grid-row">
                <label style="font-size:0.7rem;">Cover Gambar<input type="file" id="fi"></label>
            </div>
            <button class="btn" onclick="addB()">SIMPAN KE KATALOG</button>
        </div>

        <h3 style="color:#fbbf24;">Pesanan Masuk (${o.length})</h3>
        ${o.map(x => `<div class="order-card">
            <b>Rp ${x.total.toLocaleString('id-ID')} via ${x.wallet}</b><br>
            <p style="font-size:0.8rem;">Buku: ${x.items.map(i=>i.judul).join(', ')}</p>
            <a href="${x.bukti}" target="_blank" style="color:#38bdf8; font-size:0.8rem;">Lihat Bukti TF</a><br><br>
            
            <div id="acc-area-${x._id}">
                <label style="font-size:0.7rem; color:#10b981;">UPLOAD PDF UNTUK PEMBELI:</label>
                <input type="file" id="pdf-${x._id}">
                <div class="grid-row">
                    <button class="btn" style="background:#10b981; color:white;" onclick="acc('${x._id}')">SETUJU & KIRIM</button>
                    <button class="btn" style="background:#ef4444; color:white;" onclick="rej('${x._id}')">TOLAK</button>
                </div>
            </div>
        </div>`).join('')}
    </div>
    <script>
        async function addB(){
            const fi=document.getElementById('fi').files[0]; if(!fi) return alert("Pilih cover!");
            const btn=document.querySelector('.btn'); btn.innerText="Uploading...";
            const fdI=new FormData(); fdI.append('file',fi); fdI.append('upload_preset','ml_default');
            const dI=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fdI})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:dI.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f=document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Upload PDF-nya dulu!");
            const area = document.getElementById('acc-area-'+id); area.innerHTML = "Processing PDF...";
            const fd=new FormData(); fd.append('file',f); fd.append('upload_preset','ml_default');
            const up=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
        async function rej(id){ if(confirm('Tolak pesanan ini?')) { await fetch('/admin/reject/'+id); location.reload(); } }
    </script></body></html>`);
});

// --- 3. LOGIN & SYSTEM ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><body style="background:#0f172a; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif;">
    <div style="background:#1e293b; padding:40px; border-radius:25px; text-align:center; border:1px solid #334155; width:300px;">
        <h2 style="color:white; margin:0;">LOGIN ADMIN</h2>
        <form action="/login" method="POST"><input name="pw" type="password" style="width:100%; padding:15px; margin:20px 0; border-radius:12px; border:none; text-align:center;"><br><button style="width:100%; padding:15px; background:#38bdf8; border:none; border-radius:12px; font-weight:bold;">MASUK</button></form>
    </div></body></html>`);
});
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.get('/admin/reject/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Rejected' }); res.redirect('/admin'); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

