const express = require('express');
const mongoose = require('mongoose');
const app = express();

// --- 1. CORE SYSTEM & DB ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("💎 JESTRI CORE: ONLINE")).catch(e => console.error(e));

const Buku = mongoose.model('Buku', { judul: String, investasi: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, downloadLink: String });

const LIST_GENRE = ['Bisnis', 'Teknologi', 'Fiksi', 'Edukasi', 'Misteri', 'Komik', 'Sejarah', 'Self-Dev', 'Finance'];
const ADMIN_PASS = 'JESTRI0301209';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- 2. THE VISIONARY FRONTEND ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI | Digital Literacy</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background: #0A0A0A; color: white; margin: 0; overflow-x: hidden; }
        .glass { background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        
        /* SIDEBAR FIXED SCROLL & ISOLATION */
        .sidebar { 
            transition: 0.5s transform cubic-bezier(0.16, 1, 0.3, 1); 
            background: #0F0F11; 
            overflow-y: auto; 
            -webkit-overflow-scrolling: touch; /* Smooth iOS scroll */
            scrollbar-width: none;
        }
        .sidebar::-webkit-scrollbar { display: none; }
        
        .book-card { background: #161618; border-radius: 24px; transition: 0.4s; border: 1px solid rgba(255,255,255,0.03); overflow: hidden; }
        .book-card:hover { transform: translateY(-5px); border-color: #007AFF; box-shadow: 0 15px 30px rgba(0,122,255,0.15); }
        
        /* LOCK BACKGROUND SCROLL */
        .no-scroll { overflow: hidden !important; }
    </style></head><body>

    <nav class="glass sticky top-0 z-[100] p-4 md:p-5 px-6 md:px-10 flex justify-between items-center">
        <div class="flex items-center gap-5">
            <i class="fa-solid fa-bars-staggered text-xl cursor-pointer hover:text-blue-500 transition" onclick="togSide(true)"></i>
            <h1 class="text-lg md:text-xl font-black italic uppercase tracking-tighter">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
        </div>
        <button onclick="togCart(true)" class="bg-blue-600/10 p-2.5 px-5 md:px-7 rounded-full border border-blue-500/20 hover:bg-blue-600/20 transition">
            <i class="fa-solid fa-bag-shopping text-blue-500 text-sm"></i> <span id="cartCount" class="font-bold ml-2 text-xs">0</span>
        </button>
    </nav>

    <div id="ov" onclick="togSide(false)" class="fixed inset-0 bg-black/90 z-[110] hidden backdrop-blur-md"></div>
    <aside id="sb" class="sidebar fixed top-0 left-0 h-full w-[85%] md:w-80 z-[120] -translate-x-full p-8 md:p-10 flex flex-col">
        <div class="flex justify-between items-center mb-10">
            <span class="text-[9px] font-black tracking-[0.3em] text-gray-500 uppercase">Kategori</span>
            <i class="fa-solid fa-xmark text-lg cursor-pointer" onclick="togSide(false)"></i>
        </div>
        
        <div class="flex-grow space-y-2">
            <button onclick="setFilter('Semua')" class="w-full text-left p-4 rounded-2xl bg-white/5 font-bold hover:bg-blue-600 transition">Semua Koleksi</button>
            ${LIST_GENRE.map(g => `<button onclick="setFilter('${g}')" class="w-full text-left p-4 rounded-2xl text-gray-400 text-sm hover:text-white transition hover:bg-white/5 italic">${g}</button>`).join('')}
        </div>
        
        <div class="pt-10 mt-10 border-t border-white/5 text-center">
            <div class="flex justify-center gap-7 mb-6 text-2xl">
                <a href="https://wa.me/6285189415489" class="text-gray-500 hover:text-green-500 transition"><i class="fa-brands fa-whatsapp"></i></a>
                <a href="https://instagram.com/jesssstri" class="text-gray-500 hover:text-pink-500 transition"><i class="fa-brands fa-instagram"></i></a>
            </div>
            <a href="https://saweria.co/jesssstri" class="block w-full p-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[10px] tracking-widest uppercase hover:bg-amber-500 hover:text-white transition">Donate Now</a>
        </div>
    </aside>

    <main class="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-20 min-h-screen">
        <header class="mb-12 md:mb-16">
            <h2 id="vTitle" class="text-3xl md:text-5xl lg:text-6xl font-black mb-3 tracking-tighter leading-[1.1]">Investasi Literasi Digital.</h2>
            <p class="text-gray-600 text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase italic">Premium Digital Assets</p>
        </header>

        <div id="grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            <div class="h-64 md:h-80 bg-white/5 rounded-[2rem] animate-pulse"></div>
            <div class="h-64 md:h-80 bg-white/5 rounded-[2rem] animate-pulse"></div>
        </div>
    </main>

    <footer class="p-12 md:p-20 border-t border-white/5 text-center bg-[#0d0d0d]">
        <h1 class="text-xl font-black mb-8 italic uppercase tracking-tighter">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
        <div class="flex justify-center gap-10 mb-10 text-2xl text-gray-600">
            <a href="https://wa.me/6285189415489" class="hover:text-white transition"><i class="fa-brands fa-whatsapp"></i></a>
            <a href="https://instagram.com/jesssstri" class="hover:text-white transition"><i class="fa-brands fa-instagram"></i></a>
        </div>
        <p class="text-gray-700 text-[9px] font-black tracking-widest uppercase mb-4 italic">© 2026 E-BOOK JESTRI. All Rights Reserved.</p>
        <div class="flex justify-center">
            <a href="https://saweria.co/jesssstri" class="text-blue-500 text-[9px] font-black uppercase tracking-widest border border-blue-500/20 px-8 py-2 rounded-full hover:bg-blue-500 hover:text-white transition">Support Project</a>
        </div>
    </footer>

    <div id="md" class="fixed inset-0 z-[200] bg-black/95 hidden items-center justify-center p-4">
        <div class="bg-[#111] w-full max-w-lg rounded-[2.5rem] p-8 border border-white/5 max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-black mb-8 text-center italic tracking-tight uppercase">Checkout Akses.</h3>
            <div id="cartList" class="space-y-4 mb-8"></div>
            
            <div class="bg-white/5 p-7 rounded-[2rem] border border-white/5 text-center mb-8">
                <img src="https://i.ibb.co.com/jP4fBvY8/Screenshot-20250304-104953-CIMB-OCTO.jpg" class="w-44 mx-auto rounded-2xl mb-5 shadow-2xl">
                <p class="text-lg font-black tracking-tighter text-blue-500 uppercase">DANA: 0895 3278 06441</p>
            </div>

            <div class="flex justify-between font-black text-2xl mb-8 px-2 items-center">
                <span class="text-gray-600 uppercase text-[10px] tracking-widest">Total</span>
                <span id="cartTotal" class="text-blue-500 italic">Rp 0</span>
            </div>

            <input type="file" id="fi" class="hidden" onchange="document.getElementById('ftxt').innerText='✅ BUKTI SIAP'">
            <label for="fi" class="block border-2 border-dashed border-white/10 p-5 rounded-2xl text-center cursor-pointer mb-6 text-[10px] text-gray-500 font-black uppercase hover:border-blue-500 transition tracking-widest">Upload Bukti Transfer</label>
            
            <button onclick="prosesBayar()" id="btnBayar" class="w-full bg-blue-600 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-500 active:scale-95 transition">Konfirmasi</button>
            <button onclick="togCart(false)" class="w-full mt-6 text-gray-700 text-[10px] font-black uppercase tracking-widest">Batalkan</button>
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
            // LOCK BODY SCROLL: Prevent background scroll when sidebar is open
            document.body.classList.toggle('no-scroll', st);
        }
        function setFilter(g) {
            document.getElementById('vTitle').innerText = g === 'Semua' ? 'Investasi Literasi Digital.' : g;
            render(g); togSide(false);
        }
        function render(g) {
            const grid = document.getElementById('grid');
            const data = g === 'Semua' ? books : books.filter(b => b.genre === g);
            grid.innerHTML = data.map(b => \`
                <div class="book-card">
                    <div class="aspect-[3/4] bg-[#1e1e20] overflow-hidden">
                        <img src="\${b.gambar}" crossorigin="anonymous" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/400x600/161618/FFF?text=EBOOK+JESTRI'">
                    </div>
                    <div class="p-5">
                        <p class="text-[8px] text-blue-500 font-black mb-1.5 uppercase tracking-widest">\${b.genre}</p>
                        <h4 class="font-bold text-[13px] h-10 line-clamp-2 mb-4 leading-tight">\${b.judul}</h4>
                        <div class="flex justify-between items-center pt-3 border-t border-white/5">
                            <span class="font-black text-[15px] italic">Rp \${b.investasi.toLocaleString()}</span>
                            <button onclick="addCart('\${b._id}')" class="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-blue-600 transition shadow-lg"><i class="fa-solid fa-plus text-[10px]"></i></button>
                        </div>
                    </div>
                </div>\`).join('');
        }
        function addCart(id) {
            const b = books.find(x => x._id === id);
            if(!cart.find(x => x._id === id)) { 
                cart.push(b); 
                document.getElementById('cartCount').innerText = cart.length;
            }
        }
        function togCart(st) {
            if(st && !cart.length) return alert("Pilih literatur Anda.");
            const m = document.getElementById('md');
            m.classList.toggle('hidden', !st);
            m.style.display = st ? 'flex' : 'none';
            document.body.classList.toggle('no-scroll', st);
            if(st) {
                document.getElementById('cartList').innerHTML = cart.map(x => \`<div class="flex justify-between font-bold text-xs uppercase tracking-tighter"><span>\${x.judul}</span><span class="text-blue-500">Rp \${x.investasi.toLocaleString()}</span></div>\`).join('');
                document.getElementById('cartTotal').innerText = 'Rp ' + cart.reduce((a,b)=>a+b.investasi,0).toLocaleString();
            }
        }
        async function prosesBayar() {
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Upload bukti.");
            const btn = document.getElementById('btnBayar'); btn.disabled = true; btn.innerText = "SEDANG DIPROSES...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            try {
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                await fetch('/core/order', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.investasi,0), bukti: up.secure_url }) });
                alert("✅ Investasi Berhasil Dikirim!"); location.reload();
            } catch(e) { alert("Error Server!"); btn.disabled = false; btn.innerText = "KONFIRMASI"; }
        }
        init();
    </script></body></html>`);
});

// --- 3. THE REVOLUTIONARY ADMIN (LOCAL STORAGE AUTH) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><body style="background:#0A0A0A; color:white; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
    <div style="text-align:center; background:#111; padding:50px; border-radius:40px; border:1px solid #222; width:320px; box-shadow: 0 30px 60px rgba(0,0,0,0.5);">
        <h2 style="font-weight:900; margin-bottom:30px; text-transform:uppercase; letter-spacing:4px; font-size:14px; color:#555;">Elite Access</h2>
        <input id="pw" type="password" placeholder="Passcode" onkeypress="if(event.key==='Enter') login()" style="padding:18px; border-radius:20px; border:1px solid #333; background:#000; color:white; text-align:center; width:100%; margin-bottom:20px; outline:none; font-weight:bold; font-size:18px;">
        <button onclick="login()" style="background:#007AFF; color:white; border:none; padding:18px; border-radius:20px; font-weight:900; cursor:pointer; width:100%; text-transform:uppercase; letter-spacing:1px; font-size:12px; transition:0.3s;">Unlock System</button>
    </div>
    <script>
        async function login(){
            const pw = document.getElementById('pw').value;
            const r = await fetch('/core/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pw}) });
            const res = await r.json();
            if(res.ok) { localStorage.setItem('jestri_key', 'AUTHORIZED'); location.href='/admin'; }
            else { alert('Access Denied'); }
        }
    </script></body></html>`);
});

app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head>
    <body class="bg-[#0A0A0A] text-white p-6 md:p-10">
        <script>if(localStorage.getItem('jestri_key') !== 'AUTHORIZED') location.href='/login';</script>
        <div class="max-w-6xl mx-auto flex justify-between items-center mb-10 border-b border-white/5 pb-8">
            <h1 class="text-xl font-black italic uppercase tracking-tight">System <span class="text-blue-500">Command</span></h1>
            <button onclick="localStorage.removeItem('jestri_key'); location.href='/login';" class="text-[10px] font-black text-red-500 uppercase tracking-widest border border-red-500/20 px-5 py-2 rounded-full hover:bg-red-500 hover:text-white transition">Logout</button>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div class="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 h-fit shadow-2xl">
                <h3 class="text-[10px] font-black uppercase text-blue-500 mb-8 tracking-widest italic">Add Digital Asset</h3>
                <div class="space-y-4">
                    <input id="j" placeholder="Asset Title" class="w-full p-4 bg-black border border-white/10 rounded-2xl text-sm outline-none focus:border-blue-500 transition">
                    <input id="h" type="number" placeholder="Investment Price" class="w-full p-4 bg-black border border-white/10 rounded-2xl text-sm outline-none focus:border-blue-500 transition">
                    <select id="g" class="w-full p-4 bg-black border border-white/10 rounded-2xl text-sm outline-none">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
                    <input type="file" id="cv" class="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-600/10 file:text-blue-500">
                    <button onclick="saveB()" id="sb" class="w-full bg-blue-600 py-4 rounded-2xl font-black text-[10px] mt-6 hover:bg-blue-500 transition uppercase tracking-widest">Publish Asset</button>
                </div>
            </div>
            <div id="olist" class="lg:col-span-2 space-y-6"></div>
        </div>
        <script>
            async function load(){
                const r = await fetch('/core/get-orders'); const o = await r.json();
                document.getElementById('olist').innerHTML = o.map(x => \`
                <div class="bg-[#111] p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row gap-8 items-center group">
                    <img src="\${x.bukti}" class="w-full md:w-40 h-56 object-cover rounded-3xl border border-white/10 shadow-2xl group-hover:scale-105 transition duration-500 cursor-pointer" onclick="window.open('\${x.bukti}')">
                    <div class="flex-grow">
                        <h4 class="text-2xl font-black text-blue-500 italic tracking-tighter mb-1">Rp \${x.total.toLocaleString()}</h4>
                        <p class="text-[10px] text-gray-500 mb-8 uppercase tracking-[0.2em] font-bold italic">\${x.items.map(i=>i.judul).join(' • ')}</p>
                        <div class="flex gap-3">
                            <input id="l-\${x._id}" placeholder="MediaFire Link" class="flex-grow p-4 bg-black border border-blue-900/40 rounded-2xl text-xs outline-none focus:border-blue-500">
                            <button onclick="acc('\${x._id}')" class="bg-blue-600 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition">Verify</button>
                        </div>
                    </div>
                </div>\`).join('') || '<div class="py-24 text-center text-gray-800 font-black uppercase tracking-[0.5em] italic border-2 border-dashed border-white/5 rounded-[3rem]">No Orders Yet</div>';
            }
            async function saveB(){
                const f = document.getElementById('cv').files[0]; if(!f) return alert("Pilih cover!");
                const btn = document.getElementById('sb'); btn.disabled = true; btn.innerText = "UPLOADING...";
                const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                await fetch('/core/save-buku',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, investasi:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
                location.reload();
            }
            async function acc(id){
                const link = document.getElementById('l-'+id).value; if(!link) return alert("Link wajib!");
                await fetch('/core/approve/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({link}) });
                alert("Order Verified!"); location.reload();
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
