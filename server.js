const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- KONEKSI DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("✅ DB Connected")).catch(e => console.error(e));

// SCHEMA
const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, downloadLink: String });

const LIST_GENRE = ['Bisnis', 'Teknologi', 'Fiksi', 'Edukasi', 'Misteri', 'Komik', 'Sejarah'];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ name: 'jestri_v7', keys: ['JESTRI_MASTER_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. TAMPILAN PEMBELI (E-BOOK JESTRI) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;800&display=swap');
        body { font-family: 'Poppins', sans-serif; background: #F1F5F9; color: #0F172A; }
        .sidebar { transition: 0.3s transform ease-in-out; }
        .glass-header { background: rgba(11, 77, 116, 0.98); backdrop-filter: blur(10px); }
        .book-card { background: white; border-radius: 1.5rem; overflow: hidden; border: 1px solid #E2E8F0; }
    </style></head><body class="pb-20">

    <header class="glass-header sticky top-0 z-50 p-4 px-6 flex justify-between items-center text-white shadow-xl">
        <div class="flex items-center gap-4">
            <button onclick="togSidebar()" class="text-xl p-2"><i class="fa-solid fa-bars-staggered"></i></button>
            <h1 class="font-black text-xl tracking-tight">E-BOOK <span class="text-amber-400">JESTRI</span></h1>
        </div>
        <div class="bg-white/10 p-2 px-4 rounded-full cursor-pointer hover:bg-white/20" onclick="togCart()">
            <i class="fa-solid fa-cart-shopping text-amber-400"></i> <span id="cartCount" class="font-bold ml-1">0</span>
        </div>
    </header>

    <div id="overlay" onclick="togSidebar()" class="fixed inset-0 bg-black/50 z-[60] hidden"></div>
    <aside id="sidebar" class="sidebar fixed top-0 left-0 h-full w-72 bg-[#0F172A] z-[70] -translate-x-full p-6 text-white shadow-2xl">
        <div class="flex justify-between items-center mb-10 border-b border-white/10 pb-4">
            <span class="text-xl font-bold text-amber-400">KATEGORI</span>
            <i class="fa-solid fa-xmark text-2xl cursor-pointer" onclick="togSidebar()"></i>
        </div>
        <nav class="space-y-2">
            <button onclick="setGenre('Semua')" class="w-full text-left p-4 rounded-xl hover:bg-amber-500 transition font-semibold">Semua Koleksi</button>
            ${LIST_GENRE.map(g => `<button onclick="setGenre('${g}')" class="w-full text-left p-4 rounded-xl hover:bg-white/5 transition">${g}</button>`).join('')}
        </nav>
    </aside>

    <main class="max-w-6xl mx-auto p-5">
        <div class="bg-[#0B4D74] rounded-[2rem] p-8 text-white mb-8 flex justify-between items-center overflow-hidden relative shadow-lg">
            <div>
                <h2 class="text-2xl font-black mb-2 uppercase">Katalog Premium</h2>
                <p class="text-blue-200 text-sm italic">Dapatkan E-Book pilihan dalam format digital.</p>
            </div>
            <i class="fa-solid fa-book-open text-7xl opacity-20 rotate-12"></i>
        </div>

        <h3 id="viewTitle" class="text-lg font-bold mb-6 text-slate-400 uppercase tracking-widest">Memuat Katalog...</h3>
        <div id="grid" class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>
    </main>

    <div id="cartModal" class="fixed inset-0 z-[100] bg-black/80 hidden items-center justify-center p-4">
        <div class="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <h3 class="text-2xl font-black text-[#0B4D74] mb-4">Checkout</h3>
            <div id="cartList" class="space-y-3 mb-6 border-b pb-4 max-h-48 overflow-auto"></div>
            <div class="flex justify-between font-bold text-xl mb-6">
                <span>Total:</span> <span id="cartTotal" class="text-amber-500">Rp 0</span>
            </div>
            <div class="bg-slate-50 p-4 rounded-2xl mb-6 text-center border">
                <p class="text-[10px] font-black mb-2 uppercase">Transfer Dana: <span class="text-blue-600">0895327806441</span></p>
                <input type="file" id="inputBukti" class="hidden" onchange="document.getElementById('fileLabel').innerText='✅ Gambar Siap'">
                <label id="fileLabel" for="inputBukti" class="block bg-white border-2 border-dashed p-3 rounded-xl cursor-pointer text-xs font-bold text-slate-500">UPLOAD BUKTI TRANSFER</label>
            </div>
            <button onclick="orderNow()" id="btnOrder" class="w-full bg-[#0B4D74] text-white py-5 rounded-2xl font-black shadow-lg">KONFIRMASI PEMBAYARAN</button>
            <button onclick="togCart()" class="w-full mt-3 text-sm text-slate-400 font-bold">Batal</button>
        </div>
    </div>

    <script>
        let books = [], cart = [];

        async function init() {
            try {
                const r = await fetch('/api/buku-json');
                books = await r.json();
                render('Semua');
            } catch (e) { console.error("Gagal load buku", e); }
        }

        function togSidebar() {
            document.getElementById('sidebar').classList.toggle('-translate-x-full');
            document.getElementById('overlay').classList.toggle('hidden');
        }

        function setGenre(g) {
            render(g);
            togSidebar();
        }

        function render(g) {
            const grid = document.getElementById('grid');
            const title = document.getElementById('viewTitle');
            title.innerText = g === 'Semua' ? 'Semua Koleksi' : g;
            
            const filtered = g === 'Semua' ? books : books.filter(b => b.genre === g);
            
            grid.innerHTML = filtered.map(b => \`
                <div class="book-card shadow-sm flex flex-col h-full">
                    <img src="\${b.gambar}" class="w-full aspect-[3/4] object-cover bg-slate-200" alt="Cover">
                    <div class="p-4 flex flex-col flex-grow">
                        <h4 class="font-bold text-sm text-slate-800 line-clamp-2 mb-4">\${b.judul}</h4>
                        <div class="mt-auto flex justify-between items-center">
                            <span class="font-black text-[#0B4D74] text-sm">Rp \${b.harga.toLocaleString()}</span>
                            <button onclick="addToCart('\${b._id}')" class="w-10 h-10 bg-amber-500 text-white rounded-xl shadow-lg flex items-center justify-center"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                </div>\`).join('');
        }

        function addToCart(id) {
            const b = books.find(x => x._id === id);
            if(!cart.find(x => x._id === id)) {
                cart.push(b);
                document.getElementById('cartCount').innerText = cart.length;
            }
        }

        function togCart() {
            if(!cart.length) return alert("Pilih buku dulu!");
            const modal = document.getElementById('cartModal');
            modal.classList.toggle('hidden');
            modal.style.display = modal.classList.contains('hidden') ? 'none' : 'flex';
            
            document.getElementById('cartList').innerHTML = cart.map(x => \`<div class="flex justify-between text-xs font-bold"><span>\${x.judul}</span><span>Rp \${x.harga.toLocaleString()}</span></div>\`).join('');
            document.getElementById('cartTotal').innerText = 'Rp ' + cart.reduce((a,b) => a+b.harga, 0).toLocaleString();
        }

        async function orderNow() {
            const f = document.getElementById('inputBukti').files[0];
            if(!f) return alert("Upload bukti transfer!");
            const btn = document.getElementById('btnOrder');
            btn.disabled = true; btn.innerText = "SEDANG MENGIRIM...";

            const fd = new FormData();
            fd.append('file', f);
            fd.append('upload_preset', 'ml_default');
            
            try {
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd})).json();
                await fetch('/api/order', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ items: cart, total: cart.reduce((a,b) => a+b.harga, 0), bukti: up.secure_url })
                });
                alert("✅ Berhasil! Admin akan segera memverifikasi.");
                location.reload();
            } catch (e) { alert("Gagal kirim pesanan."); btn.disabled = false; }
        }

        init();
    </script></body></html>`);
});

// --- 2. TAMPILAN ADMIN (FIX BUKTI TF & APPROVE) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});

    res.send(`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></head>
    <body class="bg-slate-50 p-6">
        <div class="max-w-4xl mx-auto">
            <h1 class="text-3xl font-black mb-8 border-b pb-4">E-BOOK JESTRI <span class="text-blue-600">ADMIN</span></h1>

            <div class="bg-white p-8 rounded-[2rem] shadow-sm mb-10">
                <h3 class="font-bold mb-4">Input Katalog Baru</h3>
                <div class="grid grid-cols-2 gap-4">
                    <input id="j" placeholder="Judul" class="p-4 bg-slate-50 rounded-xl outline-none">
                    <input id="p" placeholder="Penulis" class="p-4 bg-slate-50 rounded-xl outline-none">
                    <input id="h" type="number" placeholder="Harga" class="p-4 bg-slate-50 rounded-xl outline-none">
                    <select id="g" class="p-4 bg-slate-50 rounded-xl outline-none">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
                </div>
                <input type="file" id="fileBuku" class="mt-4 block w-full text-xs">
                <button onclick="uploadBuku()" id="btnSave" class="w-full bg-slate-800 text-white py-4 rounded-xl mt-6 font-bold uppercase tracking-widest shadow-xl">Simpan Katalog</button>
            </div>

            <h3 class="font-bold mb-4 text-amber-600">Daftar Pesanan Masuk (${o.length})</h3>
            <div class="space-y-6">
                ${o.map(x => `
                <div class="bg-white p-6 rounded-[2rem] shadow-md border-2 border-slate-100">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p class="font-bold text-xs text-slate-400 mb-2">BUKTI TRANSFER PEMBELI:</p>
                            <img src="${x.bukti}" class="w-full rounded-xl border" style="max-height:300px; object-fit:contain; background:#f8fafc">
                        </div>
                        <div class="flex flex-col">
                            <h4 class="text-xl font-black text-blue-900 mb-2">Total: Rp ${x.total.toLocaleString()}</h4>
                            <p class="text-[10px] text-slate-400 mb-6 font-bold uppercase tracking-wider">Item: ${x.items.map(i=>i.judul).join(', ')}</p>
                            
                            <input id="media-${x._id}" placeholder="TEMPEL LINK MEDIAFIRE DI SINI" class="w-full p-4 border rounded-xl mb-4 text-xs font-bold bg-blue-50 border-blue-200 outline-none">
                            
                            <div class="flex gap-2">
                                <button onclick="approveOrder('${x._id}')" class="flex-grow bg-green-600 text-white py-4 rounded-xl font-black shadow-lg">APPROVE & KIRIM</button>
                                <button onclick="delOrder('${x._id}')" class="bg-red-500 text-white px-6 rounded-xl font-black">X</button>
                            </div>
                        </div>
                    </div>
                </div>`).join('') || '<p class="text-center py-10 text-slate-400">Belum ada pesanan.</p>'}
            </div>
        </div>

        <script>
            async function uploadBuku(){
                const f = document.getElementById('fileBuku').files[0]; if(!f) return alert("Pilih cover!");
                const btn = document.getElementById('btnSave'); btn.innerText = "SAVING..."; btn.disabled = true;
                const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
                try {
                    const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                    await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
                    location.reload();
                } catch(e) { alert("Error!"); btn.disabled = false; }
            }

            async function approveOrder(id){
                const link = document.getElementById('media-'+id).value;
                if(!link) return alert("Isi link MediaFire pembeli dulu!");
                await fetch('/admin/approve/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({downloadLink: link}) });
                alert("Order Berhasil Disetujui!");
                location.reload();
            }

            async function delOrder(id){ if(confirm('Hapus pesanan?')) { await fetch('/admin/del-order/'+id, {method:'DELETE'}); location.reload(); } }
        </script>
    </body></html>`);
});

// --- API & LOGIN (STABIL) ---
app.get('/login', (req, res) => { res.send(`<!DOCTYPE html><html><body style="background:#0F172A; display:flex; align-items:center; justify-content:center; height:100vh;"><form action="/login" method="POST" style="background:#1e293b; padding:40px; border-radius:20px; color:white; text-align:center;"><h2>ADMIN JESTRI</h2><input name="pw" type="password" placeholder="Passcode" style="padding:15px; border-radius:10px; border:none; margin-bottom:15px; text-align:center;"><br><button style="padding:15px 40px; border-radius:10px; border:none; background:#0ea5e9; color:white; font-weight:bold; cursor:pointer;">MASUK</button></form></body></html>`); });
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', downloadLink: req.body.downloadLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });

app.listen(process.env.PORT || 3000);

