const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONNECTION ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("✅ Database Aktif")).catch(e => console.error(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, downloadLink: String });

const LIST_GENRE = ['Bisnis', 'Teknologi', 'Fiksi', 'Edukasi', 'Misteri', 'Komik', 'Sejarah'];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ name: 'jestri_final', keys: ['KEY_JESTRI_99'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. FRONTEND PEMBELI (E-BOOK JESTRI) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI | Toko Buku Digital</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;800&display=swap');
        body { font-family: 'Poppins', sans-serif; background: #f4f7f6; }
        .sidebar { transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .glass-nav { background: rgba(11, 77, 116, 0.95); backdrop-filter: blur(8px); }
        .book-card { background: white; border-radius: 1.5rem; overflow: hidden; transition: 0.3s; border: 1px solid #edf2f7; }
        .book-card:hover { transform: translateY(-10px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
    </style></head><body class="pb-20">

    <header class="glass-nav sticky top-0 z-50 p-4 px-6 flex justify-between items-center text-white shadow-lg">
        <div class="flex items-center gap-4">
            <i class="fa-solid fa-bars-staggered text-xl cursor-pointer" onclick="toggleSidebar()"></i>
            <h1 class="font-black text-xl tracking-tight">E-BOOK <span class="text-amber-400">JESTRI</span></h1>
        </div>
        <div class="bg-white/20 p-2 px-4 rounded-full cursor-pointer hover:bg-white/30" onclick="showCart()">
            <i class="fa-solid fa-bag-shopping"></i> <span id="cartCount" class="font-bold ml-1">0</span>
        </div>
    </header>

    <div id="overlay" onclick="toggleSidebar()" class="fixed inset-0 bg-black/60 z-[60] hidden backdrop-blur-sm"></div>
    <aside id="sidebar" class="sidebar fixed top-0 left-0 h-full w-72 bg-[#0F172A] z-[70] -translate-x-full p-6 text-white">
        <div class="flex justify-between items-center mb-10">
            <span class="text-xl font-bold italic text-amber-400">KATEGORI</span>
            <i class="fa-solid fa-xmark text-2xl cursor-pointer" onclick="toggleSidebar()"></i>
        </div>
        <div class="space-y-3">
            <div onclick="filterGenre('Semua')" class="p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-amber-500 transition">Semua Koleksi</div>
            ${LIST_GENRE.map(g => `<div onclick="filterGenre('${g}')" class="p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-amber-500 transition">${g}</div>`).join('')}
        </div>
    </aside>

    <main class="max-w-6xl mx-auto p-5">
        <h2 id="viewTitle" class="text-2xl font-black text-slate-800 mb-6 border-l-4 border-amber-500 pl-4 uppercase tracking-tighter">Koleksi Terbaru</h2>
        <div id="bookGrid" class="grid grid-cols-2 md:grid-cols-4 gap-6">
            </div>
    </main>

    <div class="fixed bottom-6 right-6 flex flex-col gap-4 z-40">
        <a href="https://wa.me/6285189415489" class="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-xl text-2xl"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://instagram.com/jesssstri" class="w-14 h-14 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-xl text-2xl"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="cartModal" class="fixed inset-0 z-[100] bg-black/80 hidden items-center justify-center p-4">
        <div class="bg-white w-full max-w-md rounded-[2.5rem] p-8">
            <h3 class="text-2xl font-black text-[#0B4D74] mb-4">Ringkasan Belanja</h3>
            <div id="cartItems" class="space-y-3 mb-6 max-h-40 overflow-auto border-b pb-4"></div>
            <div class="flex justify-between font-black text-xl mb-6">
                <span>Total:</span> <span id="totalPrice" class="text-amber-500">Rp 0</span>
            </div>
            <div class="bg-blue-50 p-5 rounded-2xl mb-6">
                <p class="text-[10px] font-bold text-center mb-3">TRANSFER DANA: 0895327806441</p>
                <input type="file" id="fileBukti" class="hidden" onchange="document.getElementById('fileInfo').innerText='✅ Gambar Terpilih'">
                <label for="fileBukti" class="block bg-white border-2 border-dashed border-blue-200 p-4 rounded-xl text-center cursor-pointer hover:bg-blue-100 transition">
                    <span id="fileInfo" class="text-xs font-bold text-blue-600">KLIK UPLOAD BUKTI TF</span>
                </label>
            </div>
            <button onclick="prosesBayar()" id="btnBayar" class="w-full bg-[#0B4D74] text-white py-5 rounded-2xl font-black shadow-lg">KONFIRMASI SEKARANG</button>
        </div>
    </div>

    <script>
        let dataBuku = [], keranjang = [];

        async function init() {
            const r = await fetch('/api/buku-json');
            dataBuku = await r.json();
            renderBuku(dataBuku);
        }

        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('-translate-x-full');
            document.getElementById('overlay').classList.toggle('hidden');
        }

        function renderBuku(list) {
            const grid = document.getElementById('bookGrid');
            grid.innerHTML = list.map(b => \`
                <div class="book-card flex flex-col h-full shadow-sm">
                    <img src="\${b.gambar}" class="w-full aspect-[3/4] object-cover" loading="lazy">
                    <div class="p-4 flex flex-col flex-grow">
                        <h4 class="font-bold text-sm text-slate-800 line-clamp-2 h-10 mb-2">\${b.judul}</h4>
                        <div class="mt-auto flex justify-between items-center">
                            <span class="font-black text-blue-900 text-sm">Rp \${b.harga.toLocaleString()}</span>
                            <button onclick="tambahKeKeranjang('\${b._id}')" class="w-9 h-9 bg-amber-500 text-white rounded-xl shadow-lg flex items-center justify-center active:scale-90 transition"><i class="fa-solid fa-plus text-xs"></i></button>
                        </div>
                    </div>
                </div>\`).join('');
        }

        function filterGenre(g) {
            document.getElementById('viewTitle').innerText = g;
            renderBuku(g === 'Semua' ? dataBuku : dataBuku.filter(x => x.genre === g));
            toggleSidebar();
        }

        function tambahKeKeranjang(id) {
            const b = dataBuku.find(x => x._id === id);
            if(!keranjang.find(x => x._id === id)) keranjang.push(b);
            document.getElementById('cartCount').innerText = keranjang.length;
        }

        function showCart() {
            if(!keranjang.length) return alert("Pilih buku dulu!");
            document.getElementById('cartModal').style.display = 'flex';
            document.getElementById('cartItems').innerHTML = keranjang.map(x => \`<div class="flex justify-between text-xs font-bold"><span>\${x.judul}</span><span>Rp \${x.harga.toLocaleString()}</span></div>\`).join('');
            document.getElementById('totalPrice').innerText = 'Rp ' + keranjang.reduce((a,b) => a+b.harga, 0).toLocaleString();
        }

        async function prosesBayar() {
            const file = document.getElementById('fileBukti').files[0];
            if(!file) return alert("Upload bukti transfer!");
            const btn = document.getElementById('btnBayar');
            btn.disabled = true; btn.innerText = "MENGIRIM...";

            const fd = new FormData();
            fd.append('file', file);
            fd.append('upload_preset', 'ml_default');
            
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload', {method:'POST', body:fd})).json();
            
            await fetch('/api/order', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: keranjang, total: keranjang.reduce((a,b) => a+b.harga, 0), bukti: up.secure_url })
            });

            alert("✅ Pembayaran Berhasil! Tunggu persetujuan admin.");
            location.reload();
        }

        init();
    </script></body></html>`);
});

// --- 2. ADMIN DASHBOARD (DENGAN PREVIEW FOTO TF) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});

    res.send(`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></head>
    <body class="bg-slate-100 p-6">
        <div class="max-w-4xl mx-auto">
            <div class="flex justify-between items-center mb-8">
                <h1 class="text-2xl font-black text-slate-800 uppercase">Admin E-Book Jestri</h1>
                <a href="/" class="text-blue-600 font-bold">Tampilan Toko</a>
            </div>

            <div class="bg-white p-8 rounded-[2rem] shadow-sm mb-10 border border-slate-200">
                <h3 class="font-bold mb-4">Upload Produk Baru</h3>
                <div class="grid grid-cols-2 gap-4">
                    <input id="j" placeholder="Judul" class="p-4 bg-slate-50 rounded-xl outline-none border">
                    <input id="p" placeholder="Penulis" class="p-4 bg-slate-50 rounded-xl outline-none border">
                    <input id="h" type="number" placeholder="Harga" class="p-4 bg-slate-50 rounded-xl outline-none border">
                    <select id="g" class="p-4 bg-slate-50 rounded-xl outline-none border">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
                    <input type="file" id="fi" class="col-span-2">
                </div>
                <button onclick="addB()" id="btnS" class="w-full bg-slate-900 text-white py-4 rounded-xl mt-6 font-bold shadow-lg">TAMBAH PRODUK</button>
            </div>

            <h3 class="font-bold mb-4">Verifikasi Pembayaran (${o.length})</h3>
            <div class="space-y-6">
                ${o.map(x => `
                <div class="bg-white p-6 rounded-[2rem] border-l-8 border-amber-500 shadow-md">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p class="text-xs font-bold text-slate-400 mb-1 tracking-widest uppercase">Bukti Transfer:</p>
                            <img src="${x.bukti}" class="w-full rounded-2xl border-4 border-slate-100 shadow-inner" style="max-height: 300px; object-fit: contain; background: #eee;">
                        </div>
                        <div class="flex flex-col justify-between">
                            <div>
                                <h4 class="text-xl font-black text-blue-900 mb-2">Total: Rp ${x.total.toLocaleString()}</h4>
                                <p class="text-xs text-slate-500 mb-4 font-semibold italic">Item: ${x.items.map(i=>i.judul).join(', ')}</p>
                                <input id="link-${x._id}" placeholder="Tempel Link MediaFire/Download" class="w-full p-4 border rounded-xl mb-4 outline-none border-amber-300">
                            </div>
                            <div class="flex gap-2">
                                <button onclick="acc('${x._id}')" class="flex-grow bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg">SETUJUI</button>
                                <button onclick="delO('${x._id}')" class="bg-red-600 text-white px-6 rounded-xl font-bold">TOLAK</button>
                            </div>
                        </div>
                    </div>
                </div>`).join('') || '<p class="text-center py-10 text-slate-400 italic">Antrean sedang kosong...</p>'}
            </div>
        </div>

        <script>
            async function addB(){
                const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih cover!");
                const btn = document.getElementById('btnS'); btn.innerText = "PROSES..."; btn.disabled = true;
                const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, harga:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
                location.reload();
            }
            async function acc(id){
                const link = document.getElementById('link-'+id).value;
                if(!link) return alert("Link download wajib diisi!");
                await fetch('/admin/approve/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({downloadLink: link}) });
                alert("Berhasil disetujui!"); location.reload();
            }
            async function delO(id){ if(confirm('Tolak pesanan ini?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
        </script>
    </body></html>`);
});

// --- API & LOGIN (TETAP SAMA) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><body style="background:#0F172A; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; margin:0;"><form action="/login" method="POST" style="background:#1e293b; padding:40px; border-radius:20px; border:1px solid #334155; text-align:center; color:white;"><h2>ADMIN E-BOOK JESTRI</h2><input name="pw" type="password" placeholder="Passcode" style="padding:15px; border-radius:10px; border:none; width:200px; margin-bottom:15px; text-align:center;"><br><button style="padding:15px 40px; border-radius:10px; border:none; background:#0ea5e9; color:white; font-weight:bold; cursor:pointer;">MASUK</button></form></body></html>`);
});
app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', downloadLink: req.body.downloadLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.sendStatus(200); });
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });
app.get('/api/check/:id', async (req, res) => res.json(await Order.findById(req.params.id)));

app.listen(process.env.PORT || 3000);

