const express = require('express');
const mongoose = require('mongoose');
const app = express();

// --- 1. CORE CONFIG & DB ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("💎 JESTRI CORE: ACTIVE")).catch(e => console.error(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, investasi: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, downloadLink: String });

const LIST_GENRE = ['Bisnis', 'Teknologi', 'Fiksi', 'Edukasi', 'Misteri', 'Komik', 'Sejarah'];
const ADMIN_PASS = 'JESTRI0301209';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- 2. THE VISIONARY FRONTEND ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI | Digital Literacy Redefined</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap');
        :root { --rich-black: #0A0A0A; --elegant-blue: #007AFF; }
        body { font-family: 'Inter', sans-serif; background: var(--rich-black); color: white; margin: 0; scroll-behavior: smooth; }
        .glass { background: rgba(10, 10, 10, 0.85); backdrop-filter: blur(25px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sidebar { transition: 0.6s transform cubic-bezier(0.16, 1, 0.3, 1); background: #0F0F11; border-right: 1px solid rgba(255,255,255,0.05); }
        .book-card { background: #161618; border-radius: 24px; transition: 0.4s; overflow: hidden; border: 1px solid rgba(255,255,255,0.03); }
        .book-card:hover { transform: translateY(-8px); border-color: var(--elegant-blue); box-shadow: 0 15px 30px rgba(0,122,255,0.1); }
        .qris-box { background: white; padding: 12px; border-radius: 20px; display: inline-block; }
    </style></head><body>

    <nav class="glass sticky top-0 z-[100] p-5 px-8 flex justify-between items-center">
        <div class="flex items-center gap-6">
            <i class="fa-solid fa-bars-staggered text-xl cursor-pointer hover:text-blue-500 transition" onclick="togSide(true)"></i>
            <h1 class="text-xl font-black tracking-tighter uppercase italic">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
        </div>
        <button onclick="togCart(true)" class="bg-blue-600/10 p-3 px-6 rounded-full border border-blue-500/20 hover:bg-blue-600/20 transition">
            <i class="fa-solid fa-bag-shopping text-blue-500"></i> <span id="cartCount" class="font-black ml-2 text-xs">0</span>
        </button>
    </nav>

    <div id="ov" onclick="togSide(false)" class="fixed inset-0 bg-black/90 z-[110] hidden backdrop-blur-md"></div>
    <aside id="sb" class="sidebar fixed top-0 left-0 h-full w-80 z-[120] -translate-x-full p-10 flex flex-col">
        <div class="flex justify-between items-center mb-16">
            <span class="text-[10px] font-black tracking-[0.4em] text-gray-500 uppercase">Menu</span>
            <i class="fa-solid fa-xmark cursor-pointer hover:rotate-90 transition" onclick="togSide(false)"></i>
        </div>
        <div class="flex-grow space-y-4">
            <button onclick="setFilter('Semua')" class="w-full text-left p-4 rounded-2xl bg-white/5 font-bold hover:bg-blue-600 transition">Semua Koleksi</button>
            ${LIST_GENRE.map(g => `<button onclick="setFilter('${g}')" class="w-full text-left p-4 rounded-2xl hover:bg-white/5 transition text-gray-400 font-medium">${g}</button>`).join('')}
        </div>
        
        <div class="pt-10 border-t border-white/5">
            <div class="flex justify-center gap-6 mb-6 text-2xl">
                <a href="https://wa.me/6285189415489" class="text-gray-500 hover:text-green-500 transition"><i class="fa-brands fa-whatsapp"></i></a>
                <a href="https://instagram.com/jesssstri" class="text-gray-500 hover:text-pink-500 transition"><i class="fa-brands fa-instagram"></i></a>
            </div>
            <a href="https://saweria.co/jesssstri" class="block w-full p-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[10px] tracking-widest uppercase text-center hover:bg-amber-500 hover:text-white transition">Donate</a>
        </div>
    </aside>

    <main class="max-w-7xl mx-auto p-8 py-20 min-h-screen">
        <header class="mb-16">
            <h2 id="vTitle" class="text-3xl md:text-5xl font-black mb-4 tracking-tighter leading-tight">Investasi Literasi Digital.</h2>
            <p class="text-gray-500 uppercase text-[10px] tracking-[0.4em] font-black italic">Curated VIP Digital Collection</p>
        </header>

        <div id="grid" class="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div class="h-80 bg-white/5 rounded-3xl animate-pulse"></div>
            <div class="h-80 bg-white/5 rounded-3xl animate-pulse"></div>
        </div>
    </main>

    <footer class="p-20 border-t border-white/5 text-center bg-[#0d0d0d]">
        <h1 class="text-xl font-black mb-8 italic tracking-tighter uppercase">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
        <div class="flex justify-center gap-10 mb-10 text-2xl text-gray-600">
            <a href="https://wa.me/6285189415489" class="hover:text-white transition"><i class="fa-brands fa-whatsapp"></i></a>
            <a href="https://instagram.com/jesssstri" class="hover:text-white transition"><i class="fa-brands fa-instagram"></i></a>
        </div>
        <p class="text-gray-700 text-[10px] font-black tracking-[0.3em] uppercase mb-4 italic">© 2026 E-BOOK JESTRI. Perfection in Every Pixel.</p>
        <div class="flex justify-center">
            <a href="https://saweria.co/jesssstri" class="text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 px-8 py-2 rounded-full hover:bg-blue-500 hover:text-white transition">Donate Now</a>
        </div>
    </footer>

    <div id="md" class="fixed inset-0 z-[200] bg-black/95 hidden items-center justify-center p-4">
        <div class="bg-[#111] w-full max-w-lg rounded-[3rem] p-10 border border-white/5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 class="text-2xl font-black mb-8 italic text-center">Checkout Akses.</h3>
            <div id="cartList" class="space-y-4 mb-10 border-b border-white/5 pb-6"></div>
            
            <div class="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 text-center mb-8">
                <p class="text-[9px] font-black text-blue-500 mb-6 tracking-widest uppercase italic">Scan QRIS / DANA</p>
                <div class="qris-box mb-6"><img src="https://i.ibb.co.com/jP4fBvY8/Screenshot-20250304-104953-CIMB-OCTO.jpg" class="w-44 h-auto mx-auto" alt="QRIS"></div>
                <div class="text-lg font-black text-white tracking-tighter">0895 3278 06441</div>
            </div>

            <div class="flex justify-between font-black text-2xl mb-10">
                <span class="text-gray-600 font-bold uppercase text-sm self-center">Total</span>
                <span id="cartTotal" class="text-blue-500">Rp 0</span>
            </div>

            <input type="file" id="fi" class="hidden" onchange="document.getElementById('ftxt').innerText='✅ BUKTI SIAP'">
            <label for="fi" class="block border-2 border-dashed border-white/10 p-6 rounded-3xl text-center cursor-pointer hover:border-blue-500 mb-6 transition">
                <span id="ftxt" class="text-xs font-bold text-gray-500 uppercase tracking-widest">Upload Bukti Transfer</span>
            </label>

            <button onclick="prosesBayar()" id="btnBayar" class="w-full bg-blue-600 py-6 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl hover:bg-blue-500 active:scale-95 transition">Konfirmasi Sekarang</button>
            <button onclick="togCart(false)" class="w-full mt-6 text-gray-700 text-[10px] font-black uppercase tracking-widest">Batal</button>
        </div>
    </div>

    <script>
        let books = [], cart = [];
        async function init() {
            const r = await fetch('/api/buku-json');
            books = await r.json();
            render('Semua');
        }
        function togSide(st) {
            document.getElementById('sb').style.transform = st ? 'translateX(0)' : 'translateX(-100%)';
            document.getElementById('ov').classList.toggle('hidden', !st);
        }
        function setFilter(g) {
            document.getElementById('vTitle').innerText = g === 'Semua' ? 'Investasi Literasi Digital.' : g;
            render(g); togSide(false);
        }
        function render(g) {
            const grid = document.getElementById('grid');
            const data = g === 'Semua' ? books : books.filter(b => b.genre === g);
            grid.innerHTML = data.map(b => \`
                <div class="book-card group">
                    <div class="aspect-[3/4] bg-[#222] overflow-hidden">
                        <img src="\${b.gambar}" crossorigin="anonymous" class="w-full h-full object-cover group-hover:scale-110 transition duration-700" onerror="this.src='https://placehold.co/400x600/0A0A0A/FFF?text=E-BOOK+JESTRI'">
                    </div>
                    <div class="p-6">
                        <p class="text-[9px] text-blue-500 font-black mb-1 uppercase tracking-widest">\${b.genre}</p>
                        <h4 class="font-bold text-sm h-10 line-clamp-2 mb-4 leading-tight">\${b.judul}</h4>
                        <div class="flex justify-between items-center pt-4 border-t border-white/5">
                            <span class="font-black text-lg italic">Rp \${b.investasi.toLocaleString()}</span>
                            <button onclick="addCart('\${b._id}')" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-blue-600 transition"><i class="fa-solid fa-plus text-xs"></i></button>
                        </div>
                    </div>
                </div>\`).join('');
        }
        function addCart(id) {
            const b = books.find(x => x._id === id);
            if(!cart.find(x => x._id === id)) { cart.push(b); document.getElementById('cartCount').innerText = cart.length; }
        }
        function togCart(st) {
            if(st && !cart.length) return alert("Pilih literatur Anda.");
            const m = document.getElementById('md');
            m.classList.toggle('hidden', !st); m.style.display = st ? 'flex' : 'none';
            if(st) {
                document.getElementById('cartList').innerHTML = cart.map(x => \`<div class="flex justify-between font-bold text-xs uppercase tracking-tighter"><span>\${x.judul}</span><span class="text-blue-500">Rp \${x.investasi.toLocaleString()}</span></div>\`).join('');
                document.getElementById('cartTotal').innerText = 'Rp ' + cart.reduce((a,b)=>a+b.investasi,0).toLocaleString();
            }
        }
        async function prosesBayar() {
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Upload bukti transfer.");
            const btn = document.getElementById('btnBayar'); btn.disabled = true; btn.innerText = "MENGIRIM...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            try {
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                await fetch('/api/order', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.investasi,0), bukti: up.secure_url }) });
                alert("✅ Berhasil! Admin akan memverifikasi pesanan Anda segera.");
                location.reload();
            } catch(e) { alert("Error! Coba lagi."); btn.disabled = false; }
        }
        init();
    </script></body></html>`);
});

// --- 3. THE REVOLUTIONARY ADMIN (FIXED LOGIN POST) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><body style="background:#0A0A0A; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
    <div style="text-align:center; background:#111; padding:50px; border-radius:40px; border:1px solid #222; width:320px;">
        <h2 style="color:white; font-weight:900; letter-spacing:-1px; margin-bottom:30px; text-transform:uppercase;">Elite Access</h2>
        <input id="pw" type="password" placeholder="Passcode" onkeypress="if(event.key==='Enter') login()" style="padding:18px; border-radius:20px; border:1px solid #333; background:#000; color:white; width:100%; text-align:center; margin-bottom:20px; outline:none;">
        <button onclick="login()" style="background:#007AFF; color:white; border:none; padding:18px; border-radius:20px; font-weight:900; width:100%; cursor:pointer; text-transform:uppercase;">Unlock System</button>
    </div>
    <script>
        async function login(){
            const pw = document.getElementById('pw').value;
            // FIX: Menggunakan API POST /api/auth agar tidak Cannot POST /login
            const r = await fetch('/api/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pw}) });
            const res = await r.json();
            if(res.ok) { localStorage.setItem('jestri_token', res.token); location.href='/admin'; }
            else { alert('Passcode Salah'); }
        }
    </script></body></html>`);
});

app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></head>
    <body class="bg-[#0A0A0A] text-white p-10">
        <script>
            if(localStorage.getItem('jestri_token') !== 'TOKEN_2026_JESTRI') location.href='/login';
        </script>
        <div class="max-w-6xl mx-auto flex justify-between items-center mb-16">
            <h1 class="text-2xl font-black italic tracking-tighter uppercase">Elite <span class="text-blue-500">Command</span></h1>
            <div class="flex gap-4">
                <a href="/" class="text-xs font-bold text-gray-600 hover:text-white transition uppercase">Back to Site</a>
                <button onclick="localStorage.removeItem('jestri_token'); location.href='/login';" class="text-xs font-bold text-red-500 uppercase">Logout System</button>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div class="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 h-fit shadow-2xl">
                <h3 class="text-[10px] font-black uppercase text-blue-500 mb-8 tracking-widest italic underline">Tambah Koleksi</h3>
                <div class="space-y-4">
                    <input id="j" placeholder="Judul Buku" class="w-full p-4 bg-black border border-white/10 rounded-2xl text-sm outline-none focus:border-blue-500">
                    <input id="p" placeholder="Penulis" class="w-full p-4 bg-black border border-white/10 rounded-2xl text-sm outline-none focus:border-blue-500">
                    <input id="h" type="number" placeholder="Investasi (Rp)" class="w-full p-4 bg-black border border-white/10 rounded-2xl text-sm outline-none focus:border-blue-500">
                    <select id="g" class="w-full p-4 bg-black border border-white/10 rounded-2xl text-sm outline-none focus:border-blue-500">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
                    <div class="p-4 border-2 border-dashed border-white/10 rounded-2xl text-center"><input type="file" id="cv" class="text-[10px] text-gray-500"></div>
                    <button onclick="saveB()" id="sb" class="w-full bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-4 hover:bg-blue-500 transition">Publish</button>
                </div>
            </div>
            <div id="orderList" class="lg:col-span-2 space-y-8"></div>
        </div>
        <script>
            async function load(){
                const r = await fetch('/api/orders-all'); const o = await r.json();
                document.getElementById('orderList').innerHTML = o.map(x => \`
                <div class="bg-[#111] p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row gap-8 items-center">
                    <a href="\${x.bukti}" target="_blank" class="w-full md:w-52 h-72 block flex-shrink-0"><img src="\${x.bukti}" class="w-full h-full object-cover rounded-3xl border border-white/10 hover:opacity-80"></a>
                    <div class="flex-grow">
                        <h4 class="text-3xl font-black text-blue-500 mb-2 italic tracking-tighter">Rp \${x.total.toLocaleString()}</h4>
                        <p class="text-[11px] text-gray-500 font-bold uppercase mb-8 italic">\${x.items.map(i=>i.judul).join(' • ')}</p>
                        <input id="link-\${x._id}" placeholder="Tempel Link MediaFire Akses" class="w-full p-4 bg-black border border-blue-900 rounded-2xl text-xs mb-4 outline-none focus:border-blue-500">
                        <div class="flex gap-2">
                            <button onclick="acc('\${x._id}')" class="flex-grow bg-blue-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Kirim Akses</button>
                            <button onclick="delO('\${x._id}')" class="bg-red-900/10 text-red-500 px-6 rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white">Hapus</button>
                        </div>
                    </div>
                </div>\`).join('') || '<div class="py-20 text-center text-gray-700 italic font-black uppercase tracking-widest border-2 border-dashed border-white/5 rounded-[3rem]">Antrean Kosong</div>';
            }
            async function saveB(){
                const f = document.getElementById('cv').files[0]; if(!f) return alert("Pilih cover!");
                const btn = document.getElementById('sb'); btn.disabled = true; btn.innerText = "UP...";
                const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                await fetch('/api/admin/save-buku',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, investasi:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
                location.reload();
            }
            async function acc(id){
                const link = document.getElementById('link-'+id).value; if(!link) return alert("Link wajib!");
                await fetch('/api/admin/approve-order/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({link}) });
                alert("Berhasil!"); location.reload();
            }
            async function delO(id){ if(confirm('Hapus order?')){ await fetch('/api/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
            load();
        </script>
    </body></html>`);
});

// --- 4. BACKEND API (PURE JSON) ---
app.post('/api/auth', (req, res) => {
    if(req.body.pw === ADMIN_PASS) return res.json({ ok:true, token:'TOKEN_2026_JESTRI' });
    res.json({ ok:false });
});

app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/admin/save-buku', async (req, res) => { await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({ok:true}); });

app.get('/api/orders-all', async (req, res) => res.json(await Order.find({status: 'Pending'}).sort ({_id:-1})));

app.post('/api/admin/approve-order/:id', async (req, res) => { await Order.findB yIdAndUpdate(req.params.id, { status: 'Approved', downloadLink: req.body.link }); res.json({ok:true}); }); app.delete('/api/admin/del-order/:id', async (req, res) => { await Order.findBy IdAndDelete(req↓ ms.id); res.sendStatus (2 });

app.listen(process.env.PORT || 3000);
