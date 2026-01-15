const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const crypto = require('crypto'); 
const app = express();

const SECRET_KEY = 'JESTRI_ULTIMATE_SECURE_2026';

// --- DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).catch(err => console.log("DB Error"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String, pdfUrl: String 
});

const Order = mongoose.model('Order', { 
    bukuId: String, judulBuku: String, metode: String, bukti: String, tgl: { type: Date, default: Date.now }
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'jestri_v5', keys: ['MASTER_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API ---
app.get('/api/buku-json', async (req, res) => {
    const data = await Buku.find().sort({_id:-1}).lean();
    res.json(data);
});

// --- TAMPILAN UTAMA (SEMUA FITUR KEMBALI) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="referrer" content="no-referrer">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; overflow-x: hidden; touch-action: pan-y; }
        
        /* Header & Sidebar */
        .header { position: sticky; top: 0; background: rgba(255,255,255,0.9); backdrop-filter: blur(15px); z-index: 100; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0; }
        .sidebar { position: fixed; top: 0; left: -100%; width: 280px; height: 100%; background: #fff; z-index: 200; transition: 0.4s; padding: 40px 25px; box-shadow: 20px 0 60px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 150; display: none; }
        .overlay.active { display: block; }
        
        /* Filter & Search */
        .g-item { display: block; width: 100%; padding: 14px; margin-bottom: 8px; border-radius: 12px; border: none; background: #f8f8f8; text-align: left; font-weight: 700; cursor: pointer; }
        .g-item.active { background: #000; color: #fff; }
        .search-container { padding: 15px 20px; max-width: 800px; margin: auto; }
        .search-bar { width: 100%; padding: 15px; border-radius: 12px; border: 1px solid #eee; background: #f9f9f9; font-size: 1rem; }
        
        /* Grid Produk */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 0 15px 100px; max-width: 800px; margin: auto; }
        .card { background: #fff; border-radius: 15px; border: 1px solid #f0f0f0; overflow: hidden; }
        .img-box { width: 100%; aspect-ratio: 3/4; background: #eee; }
        .img-box img { width: 100%; height: 100%; object-fit: cover; }
        .info { padding: 10px; }
        .price { font-weight: 800; color: #2ecc71; font-size: 0.9rem; margin-bottom: 8px; }
        .btn-buy { width: 100%; padding: 10px; border-radius: 10px; border: none; background: #000; color: #fff; font-weight: 800; font-size: 0.7rem; cursor: pointer; }

        /* Modal Checkout */
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(5px); }
        .checkout-box { background: #fff; width: 100%; max-width: 400px; border-radius: 25px; padding: 25px; animation: slide 0.3s ease; }
        @keyframes slide { from { transform: scale(0.9); } to { transform: scale(1); } }
        .ewallet-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 15px 0; }
        .ew-item { border: 1px solid #ddd; border-radius: 12px; padding: 10px 5px; text-align: center; cursor: pointer; font-size: 0.7rem; font-weight: 800; }
        .ew-item.active { border-color: #000; background: #000; color: #fff; }
    </style></head><body>

    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h2 style="font-weight:800;">MENU</h2>
        <button class="g-item active" onclick="setG('Semua', this)">Semua Koleksi</button>
        <span style="font-size:0.7rem; color:#ccc; margin:20px 0 10px 5px; display:block; font-weight:800;">GENRE</span>
        ${LIST_GENRE.map(g => `<button class="g-item" onclick="setG('${g}', this)">${g}</button>`).join('')}
    </div>

    <div class="header">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size:1.2rem; cursor:pointer;"></i>
        <b style="font-size:1.1rem;">E-BOOK JESTRI</b>
        <a href="https://link.dana.id/qr/39bpg786" style="background:#2ed573; color:#fff; padding:6px 12px; border-radius:50px; text-decoration:none; font-size:0.65rem; font-weight:800;">DONATE</a>
    </div>

    <div class="search-container">
        <input type="text" class="search-bar" id="sin" placeholder="Cari judul buku..." oninput="render()">
    </div>

    <div class="grid" id="gt"></div>

    <div id="modal">
        <div class="checkout-box" id="cb">
            <h3 id="m-judul" style="margin:0;">Judul</h3>
            <p id="m-harga" style="color:#2ecc71; font-weight:800; margin:5px 0 15px;">Rp 0</p>
            
            <div style="font-size:0.75rem; background:#fff9db; padding:10px; border-radius:10px; border:1px solid #ffe066; margin-bottom:15px;">
                Pilih E-Wallet, transfer ke <b>0895327806441</b>, lalu upload bukti untuk download PDF otomatis.
            </div>

            <div class="ewallet-grid">
                <div class="ew-item" onclick="selEW('DANA')">DANA</div>
                <div class="ew-item" onclick="selEW('OVO')">OVO</div>
                <div class="ew-item" onclick="selEW('GoPay')">GOPAY</div>
            </div>

            <div id="pay-area" style="display:none; margin-bottom:15px;">
                <input type="file" id="bukti" style="font-size:0.7rem; width:100%;">
                <button id="btn-p" onclick="proses()" style="width:100%; padding:15px; background:#000; color:#fff; border:none; border-radius:12px; font-weight:800; margin-top:10px;">KONFIRMASI & DOWNLOAD</button>
            </div>

            <hr style="border:0; border-top:1px solid #eee; margin:15px 0;">
            <p style="text-align:center; font-size:0.7rem; color:#999; margin-bottom:10px;">Atau beli manual via WhatsApp:</p>
            <button id="btn-wa" style="width:100%; padding:10px; background:#25d366; color:#fff; border:none; border-radius:10px; font-weight:800; font-size:0.7rem;"><i class="fa-brands fa-whatsapp"></i> BELI VIA WHATSAPP</button>
            
            <button onclick="closeMod()" style="width:100%; background:none; border:none; margin-top:10px; color:#ccc; font-size:0.8rem;">Tutup</button>
        </div>
    </div>

    <script>
        let allBuku = []; let curG = 'Semua'; let selId = ''; let selMet = '';
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(){ const res = await fetch('/api/buku-json'); allBuku = await res.json(); render(); }
        
        function setG(g, el){ 
            curG = g; 
            document.querySelectorAll('.g-item').forEach(b=>b.classList.remove('active')); 
            el.classList.add('active'); 
            if(window.innerWidth < 768) tog(); 
            render(); 
        }

        function render(){
            const q = document.getElementById('sin').value.toLowerCase();
            const f = allBuku.filter(b => (curG==='Semua'||b.genre===curG) && b.judul.toLowerCase().includes(q));
            document.getElementById('gt').innerHTML = f.map(x => \`
                <div class="card">
                    <div class="img-box"><img src="https://wsrv.nl/?url=\${x.gambar.replace(/^https?:\\/\\//,'')}&w=300"></div>
                    <div class="info">
                        <h3 style="font-size:0.75rem; margin:0 0 5px 0; height:2.4em; overflow:hidden;">\${x.judul}</h3>
                        <div class="price">Rp \${x.harga.toLocaleString('id-ID')}</div>
                        <button class="btn-buy" onclick="openMod('\${x._id}','\${x.judul}','\${x.harga}','\${x.penulis}')">BELI</button>
                    </div>
                </div>\`).join('');
        }

        function openMod(id, j, h, p){
            selId = id;
            document.getElementById('m-judul').innerText = j;
            document.getElementById('m-harga').innerText = 'Rp ' + Number(h).toLocaleString('id-ID');
            document.getElementById('modal').style.display = 'flex';
            
            // Link WA (Fitur lama dikembalikan)
            const waText = encodeURIComponent(\`🛒 *ORDER E-BOOK JESTRI*\\n\\n📖 *JUDUL:* \${j.toUpperCase()}\\n✍️ *PENULIS:* \${p.toUpperCase()}\\n💰 *HARGA:* Rp \${Number(h).toLocaleString('id-ID')}\\n\\nSaya ingin membeli ebook ini. Mohon info cara pembayaran\`);
            document.getElementById('btn-wa').onclick = () => window.open('https://wa.me/6285189415489?text=' + waText);
        }

        function selEW(m){ selMet=m; document.querySelectorAll('.ew-item').forEach(e=>e.classList.remove('active')); event.currentTarget.classList.add('active'); document.getElementById('pay-area').style.display='block'; }
        
        async function proses(){
            const file = document.getElementById('bukti').files[0]; if(!file) return alert('Upload bukti dulu!');
            const btn = document.getElementById('btn-p'); btn.innerText='Processing...'; btn.disabled=true;
            const fd = new FormData(); fd.append('image', file);
            const rI = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {method:'POST', body:fd});
            const iD = await rI.json();
            const res = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bukuId:selId, metode:selMet, bukti:iD.data.url}) });
            const result = await res.json();
            document.getElementById('cb').innerHTML = \`
                <div style="text-align:center;">
                    <i class="fa-solid fa-circle-check" style="font-size:3rem; color:#2ecc71;"></i>
                    <h2>Sukses!</h2>
                    <p style="font-size:0.8rem;">Silakan unduh file Anda:</p>
                    <a href="/download/\${result.token}" style="display:block; padding:15px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:12px; font-weight:800;">DOWNLOAD PDF</a>
                </div>\`;
        }
        function closeMod(){ document.getElementById('modal').style.display='none'; location.reload(); }
        load();
    </script></body></html>`);
});

// --- ADMIN & LOGIC (SUDAH DIOPTIMALKAN) ---
app.post('/api/order', async (req, res) => {
    const buku = await Buku.findById(req.body.bukuId);
    await new Order({ ...req.body, judulBuku: buku.judul }).save();
    const cipher = crypto.createCipher('aes-256-cbc', SECRET_KEY);
    let token = cipher.update(buku.pdfUrl, 'utf8', 'hex');
    token += cipher.final('hex');
    res.json({ token });
});

app.get('/download/:token', (req, res) => {
    try {
        const decipher = crypto.createDecipher('aes-256-cbc', SECRET_KEY);
        let url = decipher.update(req.params.token, 'hex', 'utf8');
        url += decipher.final('utf8');
        res.redirect(url);
    } catch(e) { res.status(403).send("Link expired"); }
});

app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><style>body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;font-family:sans-serif;position:fixed;width:100%;} .card{background:#fff;padding:35px;border-radius:25px;width:88%;max-width:320px;text-align:center;} input{width:100%;padding:14px;border-radius:12px;border:1px solid #ddd;margin:20px 0;box-sizing:border-box;font-size:16px;text-align:center;} button{width:100%;padding:14px;border-radius:12px;border:none;background:#3b82f6;color:#fff;font-weight:800;}</style></head><body><div class="card"><h2>Admin</h2><form action="/login" method="POST"><input name="pw" type="password" placeholder="Password" required><button>LOGIN</button></form></div></body></html>`);
});

app.post('/login', (req, res) => {
    if (req.body.pw === 'JESTRI0301209') req.session.admin = true;
    res.redirect('/admin');
});

app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find().sort({_id:-1}).limit(10);
    res.send(`<body style="font-family:sans-serif; background:#f1f5f9; padding:20px;"><div style="max-width:450px; margin:auto;">
        <h3>Tambah Buku</h3>
        <form action="/admin/add" method="POST" style="background:#fff; padding:20px; border-radius:15px; display:grid; gap:10px;">
            <input name="judul" placeholder="Judul" required>
            <input name="penulis" placeholder="Penulis" required>
            <input name="harga" placeholder="Harga" required>
            <input name="gambar" placeholder="Link Gambar" required>
            <input name="pdfUrl" placeholder="Link PDF Direct" required>
            <select name="genre">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
            <button style="padding:15px; background:#000; color:#fff; border-radius:10px;">Simpan</button>
        </form>
        <h3>Order Terbaru</h3>
        ${o.map(x => `<div style="background:#fff; padding:10px; margin-bottom:5px; border-radius:10px; font-size:0.8rem;">${x.judulBuku} - <a href="${x.bukti}" target="_blank">Cek Bukti</a></div>`).join('')}
    </div></body>`);
});

app.post('/admin/add', async (req, res) => {
    if(req.session.admin) {
        req.body.harga = Number(req.body.harga.replace(/[^0-9]/g, ''));
        await new Buku(req.body).save();
    }
    res.redirect('/admin');
});

app.listen(process.env.PORT || 3000);

