const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const crypto = require('crypto'); 
const app = express();

const SECRET_KEY = 'JESTRI_MASTER_KEY_2026'; // Untuk enkripsi link PDF

// --- DATABASE SETUP ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).catch(err => console.log("Koneksi DB Gagal"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String, pdfUrl: String 
});

const Order = mongoose.model('Order', { 
    bukuId: String, judulBuku: String, metode: String, bukti: String, tgl: { type: Date, default: Date.now }
});

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'jestri_session', keys: ['JESTRI_V4'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API DATA ---
app.get('/api/buku-json', async (req, res) => {
    const data = await Buku.find().sort({_id:-1}).lean();
    res.json(data);
});

// --- 1. TAMPILAN KATALOG PEMBELI (OPTIMIZED) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="referrer" content="no-referrer">
    <title>E-BOOK JESTRI</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; outline: none; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fdfdfd; color: #1a1a1a; overflow-x: hidden; touch-action: pan-y; }
        .header { position: sticky; top: 0; background: rgba(255,255,255,0.9); backdrop-filter: blur(15px); z-index: 100; padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f0f0f0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 15px; max-width: 800px; margin: auto; }
        .card { background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid #f0f0f0; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
        .img-box { width: 100%; aspect-ratio: 3/4; background: #f5f5f5; }
        .img-box img { width: 100%; height: 100%; object-fit: cover; }
        .info { padding: 12px; }
        .price { font-weight: 800; color: #2ecc71; font-size: 0.95rem; margin-bottom: 10px; }
        .btn-buy { width: 100%; padding: 12px; border-radius: 12px; border: none; background: #000; color: #fff; font-weight: 800; font-size: 0.75rem; cursor: pointer; }
        
        /* Modal Checkout Sempurna */
        #modal { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: none; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(8px); }
        .checkout-box { background: #fff; width: 100%; max-width: 380px; border-radius: 30px; padding: 25px; position: relative; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .ewallet-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 20px 0; }
        .ew-item { border: 1px solid #eee; border-radius: 15px; padding: 12px 5px; text-align: center; cursor: pointer; font-size: 0.7rem; font-weight: 800; background: #f9f9f9; }
        .ew-item.active { border-color: #000; background: #000; color: #fff; }
    </style></head><body>

    <div class="header"><b style="font-size:1.2rem; letter-spacing:-1px;">E-BOOK JESTRI</b><i class="fa-solid fa-bag-shopping"></i></div>
    <div id="gt" class="grid"></div>

    <div id="modal">
        <div class="checkout-box" id="cb">
            <h3 id="m-judul" style="margin:0;">Judul</h3>
            <p id="m-harga" class="price">Rp 0</p>
            <div style="font-size:0.75rem; background:#fff4e6; padding:12px; border-radius:12px; border:1px solid #ffd8a8; margin:15px 0;">
                <b>CARA BAYAR:</b> Transfer ke nomor di bawah, lalu upload bukti transfer untuk dapatkan link download PDF.
            </div>
            <div class="ewallet-grid">
                <div class="ew-item" onclick="selEW('DANA', '0895327806441')">DANA</div>
                <div class="ew-item" onclick="selEW('OVO', '0895327806441')">OVO</div>
                <div class="ew-item" onclick="selEW('GoPay', '0895327806441')">GOPAY</div>
            </div>
            <div id="pay-detail" style="display:none; text-align:center; margin-bottom:20px;">
                <div style="font-size:0.9rem; margin-bottom:10px;">Kirim ke: <br><b style="font-size:1.1rem;" id="ew-num"></b></div>
                <input type="file" id="bukti" style="font-size:0.7rem; background:#eee; padding:10px; border-radius:8px; width:100%;">
            </div>
            <button id="btn-konfirm" onclick="proses()" style="width:100%; padding:16px; border-radius:15px; border:none; background:#000; color:#fff; font-weight:800; letter-spacing:1px;">KONFIRMASI BAYAR</button>
            <button onclick="closeMod()" style="width:100%; background:none; border:none; margin-top:15px; color:#999; font-size:0.8rem;">Nanti Saja</button>
        </div>
    </div>

    <script>
        let selId = ''; let selMet = '';
        async function load(){ const res = await fetch('/api/buku-json'); const b = await res.json(); render(b); }
        function render(data){
            document.getElementById('gt').innerHTML = data.map(x => \`
                <div class="card">
                    <div class="img-box"><img src="https://wsrv.nl/?url=\${x.gambar.replace(/^https?:\\/\\//,'')}&w=300&output=jpg"></div>
                    <div class="info">
                        <h3 style="font-size:0.8rem; margin:0 0 5px 0; height:2.4em; overflow:hidden;">\${x.judul}</h3>
                        <div class="price">Rp \${x.harga.toLocaleString('id-ID')}</div>
                        <button class="btn-buy" onclick="openMod('\${x._id}','\${x.judul}','\${x.harga}')">BELI SEKARANG</button>
                    </div>
                </div>\`).join('');
        }
        function openMod(id,j,h){ selId=id; document.getElementById('m-judul').innerText=j; document.getElementById('m-harga').innerText='Rp '+Number(h).toLocaleString('id-ID'); document.getElementById('modal').style.display='flex'; }
        function selEW(m,n){ selMet=m; document.querySelectorAll('.ew-item').forEach(e=>e.classList.remove('active')); event.currentTarget.classList.add('active'); document.getElementById('pay-detail').style.display='block'; document.getElementById('ew-num').innerText=n+' ('+m+')'; }
        async function proses(){
            const f = document.getElementById('bukti').files[0]; if(!selMet || !f) return alert('Pilih metode & upload bukti!');
            const btn = document.getElementById('btn-konfirm'); btn.innerText='Checking...'; btn.disabled=true;
            const fd = new FormData(); fd.append('image', f);
            const rI = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {method:'POST', body:fd});
            const iD = await rI.json();
            const res = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bukuId:selId, metode:selMet, bukti:iD.data.url}) });
            const result = await res.json();
            document.getElementById('cb').innerHTML = \`
                <div style="text-align:center; padding:20px 0;">
                    <i class="fa-solid fa-circle-check" style="font-size:4rem; color:#2ecc71; margin-bottom:15px;"></i>
                    <h2 style="margin:0;">Berhasil!</h2>
                    <p style="color:#666; font-size:0.85rem; margin:10px 0 25px;">Pembayaran diterima. Klik tombol di bawah untuk unduh e-book.</p>
                    <a href="/download/\${result.token}" style="display:block; padding:18px; background:#007bff; color:#fff; text-decoration:none; border-radius:15px; font-weight:800; box-shadow:0 10px 20px rgba(0,123,255,0.3);"><i class="fa-solid fa-download"></i> DOWNLOAD PDF</a>
                </div>\`;
        }
        function closeMod(){ document.getElementById('modal').style.display='none'; }
        load();
    </script></body></html>`);
});

// --- 2. LOGIN ADMIN (LOCKED & SYMMETRICAL) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        body { margin:0; height:100vh; display:flex; align-items:center; justify-content:center; background:#0f172a; font-family:sans-serif; overflow:hidden; position:fixed; width:100%; touch-action:none; }
        .card { background:#fff; padding:40px 30px; border-radius:30px; width:85%; max-width:320px; text-align:center; box-shadow:0 30px 60px rgba(0,0,0,0.4); }
        input { width:100%; padding:15px; border-radius:15px; border:1px solid #ddd; margin:20px 0; box-sizing:border-box; font-size:16px; text-align:center; outline:none; background:#f8fafc; }
        button { width:100%; padding:15px; border-radius:15px; border:none; background:#3b82f6; color:#fff; font-weight:800; cursor:pointer; }
    </style></head><body>
        <div class="card">
            <h2 style="margin:0; color:#1e293b; letter-spacing:-1px;">Admin Access</h2>
            <form action="/login" method="POST"><input name="pw" type="password" placeholder="Password" required autofocus><button type="submit">UNLOCK</button></form>
        </div>
    </body></html>`);
});

app.post('/login', (req, res) => {
    if (req.body.pw === 'JESTRI0301209') req.session.admin = true;
    res.redirect('/admin');
});

// --- 3. DASHBOARD ADMIN (OPTIMIZED FOR PDF & ORDERS) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find().sort({_id:-1}).limit(10);
    res.send(`<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <style>
        body { font-family:sans-serif; background:#f1f5f9; padding:20px; margin:0; }
        .box { background:#fff; padding:20px; border-radius:20px; margin-bottom:20px; border:1px solid #e2e8f0; }
        input, select { width:100%; padding:12px; margin-bottom:10px; border-radius:10px; border:1px solid #ddd; box-sizing:border-box; }
        button { width:100%; padding:15px; background:#000; color:#fff; border:none; border-radius:10px; font-weight:700; }
    </style></head><body>
        <div style="max-width:500px; margin:auto;">
            <div style="display:flex; justify-content:space-between; margin-bottom:20px;"><b>ADMIN JESTRI</b> <a href="/logout" style="color:red;">Logout</a></div>
            
            <div class="box">
                <h4 style="margin-top:0;">Tambah E-Book Baru</h4>
                <form action="/admin/add" method="POST">
                    <input name="judul" placeholder="Judul Buku" required>
                    <input name="penulis" placeholder="Penulis" required>
                    <input name="harga" placeholder="Harga (Angka Saja)" required>
                    <input name="gambar" placeholder="Link Gambar (ImgBB)" required>
                    <input name="pdfUrl" placeholder="Link PDF (Direct Download)" required>
                    <select name="genre">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
                    <button>SIMPAN BUKU</button>
                </form>
            </div>

            <div class="box">
                <h4 style="margin-top:0;">Pesanan Terbaru (Bukti Bayar)</h4>
                ${o.map(x => `<div style="font-size:0.8rem; border-bottom:1px solid #eee; padding:10px 0;">
                    ${x.judulBuku} (${x.metode}) <br> <a href="${x.bukti}" target="_blank" style="color:blue;">Lihat Bukti Transfer</a>
                </div>`).join('')}
            </div>
        </div>
    </body></html>`);
});

// --- LOGIC PENYEMPURNAAN ---
app.post('/admin/add', async (req, res) => {
    if(req.session.admin) {
        req.body.harga = Number(req.body.harga.replace(/[^0-9]/g, ''));
        await new Buku(req.body).save();
    }
    res.redirect('/admin');
});

app.post('/api/order', async (req, res) => {
    const buku = await Buku.findById(req.body.bukuId);
    const order = new Order({ ...req.body, judulBuku: buku.judul });
    await order.save();
    // Enkripsi Link PDF (Penyempurnaan Keamanan)
    const cipher = crypto.createCipher('aes-256-cbc', SECRET_KEY);
    let token = cipher.update(buku.pdfUrl, 'utf8', 'hex');
    token += cipher.final('hex');
    res.json({ success: true, token: token });
});

app.get('/download/:token', (req, res) => {
    try {
        const decipher = crypto.createDecipher('aes-256-cbc', SECRET_KEY);
        let url = decipher.update(req.params.token, 'hex', 'utf8');
        url += decipher.final('utf8');
        res.redirect(url); // Proses unduh otomatis
    } catch(e) { res.status(403).send("Link Expired"); }
});

app.get('/logout', (req, res) => { req.session = null; res.redirect('/login'); });

app.listen(process.env.PORT || 3000);

