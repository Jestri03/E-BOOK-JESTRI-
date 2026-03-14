const express = require('express');
const mongoose = require('mongoose');
const app = express();

// --- 1. CONFIG & DB ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("💎 DATABASE CONNECTED")).catch(e => console.error(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, investasi: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, downloadLink: String });

const LIST_GENRE = ['Bisnis', 'Teknologi', 'Fiksi', 'Edukasi', 'Misteri', 'Komik', 'Sejarah'];
const ADMIN_PASS = 'JESTRI0301209';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- 2. THE FRONTEND ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI | Digital Literacy</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background: #0A0A0A; color: white; margin: 0; }
        .glass { background: rgba(10, 10, 10, 0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sidebar { transition: 0.5s transform ease; background: #0F0F11; }
        .book-card { background: #161618; border-radius: 20px; transition: 0.3s; border: 1px solid rgba(255,255,255,0.03); overflow: hidden; }
        .book-card:hover { transform: translateY(-5px); border-color: #007AFF; }
    </style></head><body>

    <nav class="glass sticky top-0 z-[100] p-5 px-8 flex justify-between items-center">
        <div class="flex items-center gap-6">
            <i class="fa-solid fa-bars-staggered text-xl cursor-pointer" onclick="togSide(true)"></i>
            <h1 class="text-xl font-black italic uppercase">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
        </div>
        <button onclick="togCart(true)" class="bg-blue-600/10 p-3 px-6 rounded-full border border-blue-500/20">
            <i class="fa-solid fa-bag-shopping text-blue-500"></i> <span id="cartCount" class="font-bold ml-2 text-xs">0</span>
        </button>
    </nav>

    <div id="ov" onclick="togSide(false)" class="fixed inset-0 bg-black/90 z-[110] hidden backdrop-blur-md"></div>
    <aside id="sb" class="sidebar fixed top-0 left-0 h-full w-80 z-[120] -translate-x-full p-10 flex flex-col">
        <div class="flex justify-between items-center mb-10">
            <span class="text-[10px] font-black tracking-widest text-gray-500">MENU</span>
            <i class="fa-solid fa-xmark cursor-pointer" onclick="togSide(false)"></i>
        </div>
        <div class="flex-grow space-y-2">
            <button onclick="setFilter('Semua')" class="w-full text-left p-4 rounded-xl bg-white/5 font-bold">Semua</button>
            ${LIST_GENRE.map(g => `<button onclick="setFilter('${g}')" class="w-full text-left p-4 rounded-xl text-gray-400 text-sm hover:text-white">${g}</button>`).join('')}
        </div>
        <div class="pt-10 border-t border-white/5 text-center">
            <div class="flex justify-center gap-6 mb-6 text-2xl">
                <a href="https://wa.me/6285189415489" class="text-gray-500 hover:text-green-500"><i class="fa-brands fa-whatsapp"></i></a>
                <a href="https://instagram.com/jesssstri" class="text-gray-500 hover:text-pink-500"><i class="fa-brands fa-instagram"></i></a>
            </div>
            <a href="https://saweria.co/jesssstri" class="block w-full p-4 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[10px] tracking-widest uppercase">Donate</a>
        </div>
    </aside>

    <main class="max-w-7xl mx-auto p-8 py-20">
        <header class="mb-16">
            <h2 id="vTitle" class="text-4xl font-black mb-2 tracking-tighter">Investasi Literasi Digital.</h2>
            <p class="text-gray-600 text-xs font-bold tracking-widest uppercase italic">The Elite Collection</p>
        </header>
        <div id="grid" class="grid grid-cols-2 lg:grid-cols-4 gap-6"></div>
    </main>

    <footer class="p-16 border-t border-white/5 text-center bg-[#0d0d0d]">
        <h1 class="text-xl font-black mb-6 italic uppercase tracking-tighter">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
        <div class="flex justify-center gap-8 mb-8 text-2xl text-gray-600">
            <a href="https://wa.me/6285189415489" class="hover:text-white"><i class="fa-brands fa-whatsapp"></i></a>
            <a href="https://instagram.com/jesssstri" class="hover:text-white"><i class="fa-brands fa-instagram"></i></a>
        </div>
        <p class="text-gray-700 text-[10px] font-bold tracking-widest uppercase mb-4">© 2026 E-BOOK JESTRI</p>
        <a href="https://saweria.co/jesssstri" class="text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 px-8 py-2 rounded-full">Support</a>
    </footer>

    <div id="md" class="fixed inset-0 z-[200] bg-black/95 hidden items-center justify-center p-4">
        <div class="bg-[#111] w-full max-w-lg rounded-[2.5rem] p-8 border border-white/5 max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-black mb-6 text-center italic">Checkout.</h3>
            <div id="cartList" class="space-y-3 mb-8 text-sm"></div>
            <div class="bg-white/5 p-6 rounded-3xl text-center mb-6">
                <img src="https://i.ibb.co.com/jP4fBvY8/Screenshot-20250304-104953-CIMB-OCTO.jpg" class="w-40 mx-auto rounded-lg mb-4">
                <p class="text-lg font-black tracking-tighter uppercase">DANA: 0895 3278 06441</p>
            </div>
            <div class="flex justify-between font-black text-xl mb-8 px-2">
                <span class="text-gray-600 uppercase text-xs">Total</span>
                <span id="cartTotal" class="text-blue-500">Rp 0</span>
            </div>
            <input type="file" id="fi" class="hidden" onchange="document.getElementById('ftxt').innerText='✅ Bukti Siap'">
            <label for="fi" class="block border border-dashed border-white/10 p-5 rounded-2xl text-center cursor-pointer mb-6 text-xs text-gray-500 font-bold uppercase">Upload Bukti Transfer</label>
            <button onclick="prosesBayar()" id="btnBayar" class="w-full bg-blue-600 py-5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">Konfirmasi</button>
            <button onclick="togCart(false)" class="w-full mt-4 text-gray-700 text-[10px] font-bold uppercase">Kembali</button>
        </div>
    </div>

    <script>
        let books = [], cart = [];
        async function init() {
            const r = await fetch('/core/books');
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
                    <div class="aspect-[3/4] bg-[#222] overflow-hidden"><img src="\${b.gambar}" crossorigin="anonymous" class="w-full h-full object-cover"></div>
                    <div class="p-4">
                        <p class="text-[8px] text-blue-500 font-black mb-1 uppercase">\${b.genre}</p>
                        <h4 class="font-bold text-[12px] h-8 line-clamp-2 mb-4">\${b.judul}</h4>
                        <div class="flex justify-between items-center pt-2 border-t border-white/5">
                            <span class="font-bold text-sm">Rp \${b.investasi.toLocaleString()}</span>
                            <button onclick="addCart('\${b._id}')" class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-blue-600 transition"><i class="fa-solid fa-plus text-[10px]"></i></button>
                        </div>
                    </div>
                </div>\`).join('');
        }
        function addCart(id) {
            const b = books.find(x => x._id === id);
            if(!cart.find(x => x._id === id)) { cart.push(b); document.getElementById('cartCount').innerText = cart.length; }
        }
        function togCart(st) {
            if(st && !cart.length) return alert("Pilih buku dulu.");
            document.getElementById('md').classList.toggle('hidden', !st);
            document.getElementById('md').style.display = st ? 'flex' : 'none';
            if(st) {
                document.getElementById('cartList').innerHTML = cart.map(x => \`<div class="flex justify-between font-bold"><span>\${x.judul}</span><span class="text-blue-500">Rp \${x.investasi.toLocaleString()}</span></div>\`).join('');
                document.getElementById('cartTotal').innerText = 'Rp ' + cart.reduce((a,b)=>a+b.investasi,0).toLocaleString();
            }
        }
        async function prosesBayar() {
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Pilih bukti.");
            const btn = document.getElementById('btnBayar'); btn.disabled = true; btn.innerText = "SENDING...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            try {
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                await fetch('/core/order', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.investasi,0), bukti: up.secure_url }) });
                alert("Sukses!"); location.reload();
            } catch(e) { alert("Error"); btn.disabled = false; }
        }
        init();
    </script></body></html>`);
});

// --- 3. THE ADMIN ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><body style="background:#0A0A0A; color:white; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
    <div style="text-align:center; background:#111; padding:40px; border-radius:30px; border:1px solid #222;">
        <h2 style="font-weight:900; margin-bottom:20px;">ACCESS</h2>
        <input id="pw" type="password" placeholder="Passcode" style="padding:15px; border-radius:10px; border:1px solid #333; background:#000; color:white; text-align:center; width:200px; margin-bottom:15px; outline:none;">
        <br><button onclick="login()" style="background:#007AFF; color:white; border:none; padding:15px 30px; border-radius:10px; font-weight:900; cursor:pointer;">UNLOCK</button>
    </div>
    <script>
        async function login(){
            const pw = document.getElementById('pw').value;
            const r = await fetch('/core/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pw}) });
            const res = await r.json();
            if(res.ok) { localStorage.setItem('jestri_key', 'VALID'); location.href='/admin'; }
            else { alert('Wrong Passcode'); }
        }
    </script></body></html>`);
});

app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head>
    <body class="bg-[#0A0A0A] text-white p-10">
        <script>if(localStorage.getItem('jestri_key') !== 'VALID') location.href='/login';</script>
        <div class="max-w-6xl mx-auto flex justify-between items-center mb-10">
            <h1 class="text-xl font-black italic">CONTROL CENTER</h1>
            <button onclick="localStorage.removeItem('jestri_key'); location.href='/login';" class="text-xs text-red-500">Logout</button>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div class="bg-[#111] p-6 rounded-3xl border border-white/5">
                <h3 class="text-xs font-black uppercase text-blue-500 mb-6">Tambah Buku</h3>
                <div class="space-y-3">
                    <input id="j" placeholder="Judul" class="w-full p-4 bg-black border border-white/10 rounded-xl text-sm outline-none">
                    <input id="h" type="number" placeholder="Harga" class="w-full p-4 bg-black border border-white/10 rounded-xl text-sm outline-none">
                    <select id="g" class="w-full p-4 bg-black border border-white/10 rounded-xl text-sm outline-none">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
                    <input type="file" id="cv" class="text-xs text-gray-500">
                    <button onclick="saveB()" id="sb" class="w-full bg-blue-600 py-4 rounded-xl font-black text-xs mt-4">Publish</button>
                </div>
            </div>
            <div id="olist" class="lg:col-span-2 space-y-4"></div>
        </div>
        <script>
            async function load(){
                const r = await fetch('/core/get-orders'); const o = await r.json();
                document.getElementById('olist').innerHTML = o.map(x => \`
                <div class="bg-[#111] p-6 rounded-3xl border border-white/5 flex gap-6">
                    <img src="\${x.bukti}" class="w-24 h-32 object-cover rounded-xl border border-white/10">
                    <div class="flex-grow">
                        <h4 class="text-lg font-black text-blue-500 italic">Rp \${x.total.toLocaleString()}</h4>
                        <p class="text-[10px] text-gray-400 mb-4 uppercase">\${x.items.map(i=>i.judul).join(' • ')}</p>
                        <div class="flex gap-2">
                            <input id="l-\${x._id}" placeholder="Link MediaFire" class="flex-grow p-2 bg-black border border-white/5 rounded text-[10px] outline-none">
                            <button onclick="acc('\${x._id}')" class="bg-blue-600 px-4 py-2 rounded font-black text-[10px]">Approve</button>
                        </div>
                    </div>
                </div>\`).join('') || '<p class="text-gray-700">Kosong</p>';
            }
            async function saveB(){
                const f = document.getElementById('cv').files[0]; if(!f) return alert("Pilih cover!");
                const btn = document.getElementById('sb'); btn.disabled = true; btn.innerText = "...";
                const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                await fetch('/core/save-buku',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, investasi:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
                location.reload();
            }
            async function acc(id){
                const link = document.getElementById('l-'+id).value;
                await fetch('/core/approve/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({link}) });
                alert("OK"); location.reload();
            }
            load();
        </script>
    </body></html>`);
});

// --- 4. SECURE CORE API ---
app.post('/core/auth', (req, res) => {
    res.json({ ok: req.body.pw === ADMIN_PASS });
});

app.get('/core/books', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/core/save-buku', async (req, res) => { await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/core/order', async (req, res) => { await new Order(req.body).save(); res.json({ok:true}); });
app.get('/core/get-orders', async (req, res) => res.json(await Order.find({status:'Pending'}).sort({_id:-1})));
app.post('/core/approve/:id', async (req, res) => { await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', downloadLink: req.body.link }); res.json({ok:true}); });

app.listen(process.env.PORT || 3000);

