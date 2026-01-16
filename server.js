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
app.use(cookieSession({ name: 'jestri_id_v2', keys: ['JESTRI_STABLE'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #f1f5f9; color: #1e293b; }
        
        /* HEADER */
        .header { position: sticky; top: 0; background: #0f172a; color: white; z-index: 1000; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { font-weight: 800; font-size: 1.1rem; letter-spacing: 1px; color: #38bdf8; }

        /* AREA PUTIH UNTUK BUKU */
        .content-area { background: #ffffff; min-height: 100vh; border-radius: 30px 30px 0 0; margin-top: -20px; position: relative; z-index: 5; padding-top: 25px; }

        /* SIDEBAR */
        .sidebar { position: fixed; top: 0; left: -280px; width: 280px; height: 100%; background: #1e293b; z-index: 5000; transition: 0.4s; padding: 25px; color: white; }
        .sidebar.active { left: 0; }
        .nav-item { padding: 12px 15px; border-radius: 10px; margin-bottom: 5px; cursor: pointer; color: #cbd5e1; }
        .nav-item.active { background: #38bdf8; color: #0f172a; font-weight: 800; }

        /* GRID BUKU */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 0 15px 100px 15px; }
        .card { background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
        .card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; }
        .card-info { padding: 12px; }
        .card-title { font-size: 0.8rem; font-weight: 800; height: 2.5em; overflow: hidden; color: #0f172a; }
        .card-price { color: #10b981; font-weight: 800; margin: 5px 0; font-size: 0.95rem; }
        .btn-add { width: 100%; padding: 10px; border: none; border-radius: 10px; background: #0f172a; color: white; font-weight: 800; font-size: 0.7rem; cursor: pointer; }

        /* SOSMED */
        .sosmed-float { position: fixed; bottom: 25px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 4000; }
        .sos-icon { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; box-shadow: 0 5px 15px rgba(0,0,0,0.2); text-decoration: none; }

        #toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #0f172a; color: white; padding: 12px 25px; border-radius: 50px; font-weight: bold; display: none; z-index: 10000; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 4500; display: none; }
    </style></head><body>

    <div id="toast">Berhasil ditambah!</div>
    <div class="overlay" id="ov" onclick="tog()"></div>

    <div class="sidebar" id="sb">
        <h2 style="color:#38bdf8;">E-BOOK JESTRI</h2>
        <div class="nav-item active" onclick="setG('Semua', this)">Semua Koleksi</div>
        ${LIST_GENRE.map(g => `<div class="nav-item" onclick="setG('${g}', this)">${g}</div>`).join('')}
        <a href="https://link.dana.id/qr/0895327806441" style="display:block; margin-top:30px; background:#fbbf24; color:black; padding:15px; border-radius:12px; text-align:center; font-weight:bold; text-decoration:none;">DONASI ADMIN</a>
    </div>

    <div class="header">
        <i class="fa-solid fa-bars" onclick="tog()"></i>
        <div class="logo">E-BOOK JESTRI</div>
        <div onclick="openCart()" style="position:relative;"><i class="fa-solid fa-cart-shopping"></i><span id="cc" style="position:absolute; top:-8px; right:-10px; background:#ef4444; color:white; font-size:0.6rem; padding:2px 5px; border-radius:50%;">0</span></div>
    </div>

    <div style="padding:15px; background:#0f172a;">
        <input type="text" id="sr" placeholder="Cari judul e-book..." oninput="cari()" style="width:100%; padding:12px; border-radius:10px; border:none; outline:none;">
    </div>

    <div class="content-area">
        <div id="mainGrid" class="grid"></div>
    </div>

    <div class="sosmed-float">
        <a href="https://wa.me/6285189415489" class="sos-icon" style="background:#22c55e;"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="sos-icon" style="background:#e1306c;"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="modal" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:10000; display:none; align-items:center; justify-content:center; padding:20px;">
        <div style="background:white; width:100%; max-width:350px; border-radius:20px; padding:25px; color:#1e293b;">
            <h3 style="margin-top:0;">Konfirmasi Bayar</h3>
            <div id="cItems" style="font-size:0.8rem; margin-bottom:15px;"></div>
            <p style="font-weight:800;">Total: <span id="cTotal" style="color:#10b981;">Rp 0</span></p>
            <select id="wlt" style="width:100%; padding:10px; margin-bottom:10px; border-radius:8px; border:1px solid #ddd;">
                <option value="DANA">DANA (0895327806441)</option>
                <option value="OVO">OVO (0895327806441)</option>
                <option value="GOPAY">GOPAY (0895327806441)</option>
            </select>
            <input type="file" id="fBukti" style="font-size:0.8rem; margin-bottom:15px;">
            <button onclick="checkout()" style="width:100%; padding:15px; background:#10b981; color:white; border:none; border-radius:10px; font-weight:bold;">KIRIM BUKTI</button>
            <button onclick="location.reload()" style="width:100%; background:none; border:none; margin-top:10px; color:#64748b;">Batal</button>
        </div>
    </div>

    <script>
        let allB = []; let cart = [];
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(){ 
            const r = await fetch('/api/buku-json?v='+Date.now()); 
            allB = await r.json(); 
            render(allB); 
        }

        function render(data){
            const g = document.getElementById('mainGrid');
            if(data.length === 0){ g.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:50px;">Buku tidak ditemukan.</p>'; return; }
            g.innerHTML = data.map(x => \`
                <div class="card">
                    <img src="\${x.gambar.replace('http://','https://')}" onerror="this.src='https://placehold.co/400x600?text=Ebook+Jestri'">
                    <div class="card-info">
                        <div class="card-title">\${x.judul}</div>
                        <div class="card-price">Rp \${new Intl.NumberFormat('id-ID').format(x.harga)}</div>
                        <button class="btn-add" onclick="add('\${x._id}')">AMBIL BUKU</button>
                    </div>
                </div>\`).join('');
        }

        function cari(){
            const k = document.getElementById('sr').value.toLowerCase();
            render(allB.filter(b => b.judul.toLowerCase().includes(k)));
        }

        function setG(g, el){
            document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
            el.classList.add('active');
            render(g === 'Semua' ? allB : allB.filter(b => b.genre === g));
            if(window.innerWidth < 1000) tog();
        }

        function add(id){
            if(cart.some(i=>i._id===id)) return;
            cart.push(allB.find(x=>x._id===id));
            document.getElementById('cc').innerText = cart.length;
            const t = document.getElementById('toast'); t.style.display='block';
            setTimeout(()=>t.style.display='none', 2000);
        }

        function openCart(){
            if(cart.length === 0) return alert("Keranjang kosong!");
            document.getElementById('cItems').innerHTML = cart.map((x,i)=>\`<div style="display:flex;justify-content:space-between;margin-bottom:5px;">\${x.judul} <span onclick="cart.splice(\${i},1);openCart()" style="color:red">X</span></div>\`).join('');
            document.getElementById('cTotal').innerText = 'Rp ' + new Intl.NumberFormat('id-ID').format(cart.reduce((a,b)=>a+b.harga,0));
            document.getElementById('modal').style.display = 'flex';
        }

        async function checkout(){
            const f = document.getElementById('fBukti').files[0]; if(!f) return alert("Upload bukti!");
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd});
            const img = await up.json();
            const res = await fetch('/api/order', {
                method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: img.secure_url, wallet: document.getElementById('wlt').value })
            });
            const order = await res.json();
            document.getElementById('modal').innerHTML = '<div style="background:white;padding:30px;border-radius:20px;text-align:center;"><h3>Berhasil!</h3><p>Sedang diverifikasi admin...</p><div id="dl-box">⏳</div></div>';
            const cek = setInterval(async () => {
                const rs = await fetch('/api/check/'+order.id); const st = await rs.json();
                if(st.status === 'Approved'){
                    clearInterval(cek);
                    document.getElementById('dl-box').innerHTML = \`<a href="\${st.pdfLink.replace('/upload/','/upload/fl_attachment/')}" download style="display:block;background:#0f172a;color:white;padding:15px;border-radius:10px;text-decoration:none;font-weight:bold;margin-top:10px;">DOWNLOAD E-BOOK</a>\`;
                }
            }, 3000);
        }
        load();
    </script></body></html>`);
});

// --- 2. ADMIN PANEL (STABIL & INDONESIA) ---
app.get('/login', (req, res) => {
    res.send(`<body style="background:#0f172a; margin:0; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
    <form action="/login" method="POST" style="background:white; padding:40px; border-radius:20px; width:300px; text-align:center;">
        <h2 style="margin-top:0;">LOGIN ADMIN</h2>
        <input name="pw" type="password" placeholder="Kata Sandi" autofocus style="width:100%; padding:15px; margin:20px 0; border:1px solid #ddd; border-radius:10px; text-align:center;">
        <button style="width:100%; padding:15px; background:#0f172a; color:white; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">MASUK</button>
    </form></body>`);
});

app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>body{font-family:sans-serif;background:#f1f5f9;padding:20px} .box{background:white;padding:20px;border-radius:15px;margin-bottom:20px;box-shadow:0 2px 5px rgba(0,0,0,0.1)} input,select{width:100%;padding:12px;margin:5px 0;box-sizing:border-box;border:1px solid #ddd;border-radius:8px}</style></head><body>
    <h2>E-BOOK JESTRI ADMIN</h2>
    <div class="box">
        <h3>Tambah Buku</h3>
        <input id="j" placeholder="Judul Buku"><input id="p" placeholder="Penulis"><input id="h" type="number" placeholder="Harga (Contoh: 2800)"><select id="g">${LIST_GENRE.map(gx=>`<option>${gx}</option>`).join('')}</select><input type="file" id="fi"><button onclick="addB()" style="width:100%;padding:15px;background:#0f172a;color:white;border:none;border-radius:10px;margin-top:10px;font-weight:bold">SIMPAN BUKU</button>
    </div>
    <h3>Pesanan (${o.length})</h3>
    ${o.map(x=>`<div class="box"><b>Rp \${new Intl.NumberFormat('id-ID').format(x.total)} (\${x.wallet})</b><br><a href="\${x.bukti}" target="_blank">Lihat Bukti</a><br><input type="file" id="pdf-\${x._id}" style="margin-top:10px;"><button onclick="acc('\${x._id}')" style="background:#10b981;color:white;border:none;padding:10px;width:100%;border-radius:8px;margin-top:5px;font-weight:bold">SETUJUI & KIRIM PDF</button></div>`).join('')}
    <h3>Katalog Buku</h3>
    ${b.map(x=>`<div class="box" style="display:flex;justify-content:space-between;align-items:center;"><span>\${x.judul}</span><button onclick="delB('\${x._id}')" style="color:red;border:none;background:none;font-weight:bold;cursor:pointer">HAPUS</button></div>`).join('')}
    <script>
        async function addB(){
            const fi=document.getElementById('fi').files[0]; if(!fi) return alert("Pilih cover!");
            const fdI=new FormData(); fdI.append('file',fi); fdI.append('upload_preset','ml_default');
            const dI=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fdI})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:dI.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f=document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Pilih file PDF!");
            const fd=new FormData(); fd.append('file',f); fd.append('upload_preset','ml_default');
            const up=await(await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
        async function delB(id){ if(confirm('Hapus buku ini?')){ await fetch('/admin/del/'+id, {method:'DELETE'}); location.reload(); } }
    </script></body></html>`);
});

// --- API ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.delete('/admin/del/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

