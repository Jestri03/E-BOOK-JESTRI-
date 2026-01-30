const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DB CONNECTION ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("DB OK")).catch(e => console.log(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ name: 'jestri_session', keys: ['JESTRI_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

// --- DASHBOARD ADMIN (VERSI FIX VERCEL) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});

    // Buat HTML List Buku & Order secara terpisah biar gak error di template literal
    let listBuku = b.map(x => `
        <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
            <span>${x.judul}</span>
            <button onclick="delB('${x._id}')" style="color:red; border:none; background:none; cursor:pointer;">HAPUS</button>
        </div>`).join('');

    let listOrder = o.map(x => `
        <div style="background:white; padding:15px; border-radius:15px; margin-bottom:15px; border-left:5px solid orange;">
            <b>Total: Rp ${x.total.toLocaleString()}</b><br>
            <a href="${x.bukti}" target="_blank" style="color:#38bdf8; display:block; margin:5px 0;">Lihat Bukti TF</a>
            <input type="file" id="pdf-${x._id}">
            <button onclick="acc('${x._id}')" style="width:100%; padding:10px; background:#10b981; color:white; border:none; border-radius:8px; margin-top:10px; font-weight:bold;">SETUJUI & KIRIM PDF</button>
            <button onclick="delO('${x._id}')" style="width:100%; padding:8px; background:#ef4444; color:white; border:none; border-radius:8px; margin-top:8px; font-weight:bold;">TOLAK PESANAN</button>
        </div>`).join('');

    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body{font-family:sans-serif; background:#f1f5f9; padding:15px;}
        .card{background:white; padding:20px; border-radius:18px; margin-bottom:20px;}
        input, select{width:100%; padding:12px; margin:8px 0; border:1px solid #ddd; border-radius:10px; box-sizing:border-box;}
    </style></head><body>
    <h2>ADMIN JESTRI</h2>
    
    <div class="card">
        <h3>Posting Buku</h3>
        <input id="j" placeholder="Judul"><input id="p" placeholder="Penulis"><input id="h" type="number" placeholder="Harga">
        <select id="g"><option>Fiksi</option><option>Edukasi</option><option>Teknologi</option></select>
        <input type="file" id="fi">
        <button onclick="addB()" id="btnS" style="width:100%; padding:15px; background:black; color:white; border-radius:10px; font-weight:bold;">POSTING SEKARANG</button>
    </div>

    <h3>Pesanan Masuk (${o.length})</h3>
    <div id="orderList">${listOrder}</div>

    <h3>Katalog Buku</h3>
    <div class="card">${listBuku}</div>

    <script>
        async function addB(){
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih cover!");
            const btn = document.getElementById('btnS'); btn.innerText = "Processing...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
            location.reload();
        }
        async function acc(id){
            const f = document.getElementById('pdf-'+id).files[0]; if(!f) return alert("Pilih PDF!");
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/raw/upload',{method:'POST',body:fd})).json();
            await fetch('/admin/approve/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pdfLink:up.secure_url})});
            location.reload();
        }
        async function delO(id){ if(confirm('Tolak?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
        async function delB(id){ if(confirm('Hapus?')){ await fetch('/admin/del-buku/'+id,{method:'DELETE'}); location.reload(); } }
    </script></body></html>`);
});

// --- API ---
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', pdfLink: req.body.pdfLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.json({ok:true}); });
app.delete('/admin/del-buku/:id', async (req, res) => { if(req.session.admin) await Buku.findByIdAndDelete(req.params.id); res.json({ok:true}); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

// Tambahkan route utama (Pembeli) di sini sesuai kode sebelumnya...

app.listen(3000);

