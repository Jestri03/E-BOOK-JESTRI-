const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- 1. CORE SYSTEM & DATABASE ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("💎 JESTRI SYSTEM: ONLINE")).catch(e => console.error(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, investasi: Number, gambar: String, genre: String });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, downloadLink: String, date: { type: Date, default: Date.now } });

const LIST_GENRE = ['Bisnis', 'Teknologi', 'Fiksi', 'Edukasi', 'Misteri', 'Komik', 'Sejarah'];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// FIX LOGIN: Menggunakan pengaturan session yang lebih kompatibel
app.use(cookieSession({
    name: 'session_jestri',
    keys: ['SECRET_2026_KEY'],
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
}));

// --- 2. FRONTEND: E-BOOK JESTRI (ULTRA-PREMIUM) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id" class="scroll-smooth"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-BOOK JESTRI | Digital Literacy, Redefined</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap');
        :root { --rich-black: #0A0A0A; --elegant-blue: #007AFF; }
        body { font-family: 'Inter', sans-serif; background: var(--rich-black); color: white; margin: 0; }
        .glass { background: rgba(10, 10, 10, 0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sidebar { transition: 0.5s transform cubic-bezier(0.16, 1, 0.3, 1); background: #0F0F11; border-right: 1px solid rgba(255,255,255,0.05); }
        .book-card { background: #161618; border-radius: 20px; transition: 0.4s; border: 1px solid rgba(255,255,255,0.03); }
        .book-card:hover { transform: translateY(-10px); border-color: var(--elegant-blue); box-shadow: 0 20px 40px rgba(0,122,255,0.1); }
        .qris-frame { background: white; padding: 12px; border-radius: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(255,255,255,0.05); }
    </style></head><body>

    <nav class="glass sticky top-0 z-[100] p-5 px-8 flex justify-between items-center">
        <div class="flex items-center gap-6">
            <i class="fa-solid fa-bars-staggered text-xl cursor-pointer hover:text-blue-500 transition" onclick="togSide(true)"></i>
            <h1 class="text-xl font-black tracking-tighter uppercase italic">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
        </div>
        <button onclick="togCart(true)" class="bg-blue-600/10 p-3 px-6 rounded-full border border-blue-500/20 hover:bg-blue-600/20 transition group">
            <i class="fa-solid fa-bag-shopping text-blue-500 group-hover:scale-110 transition"></i> <span id="cartCount" class="font-black ml-2 text-xs">0</span>
        </button>
    </nav>

    <div id="ov" onclick="togSide(false)" class="fixed inset-0 bg-black/90 z-[110] hidden backdrop-blur-md"></div>
    <aside id="sb" class="sidebar fixed top-0 left-0 h-full w-80 z-[120] -translate-x-full p-10 flex flex-col">
        <div class="flex justify-between items-center mb-16">
            <span class="text-[10px] font-black tracking-[0.4em] text-gray-500 uppercase">Navigasi</span>
            <i class="fa-solid fa-xmark cursor-pointer hover:rotate-90 transition" onclick="togSide(false)"></i>
        </div>
        <div class="flex-grow space-y-3">
            <button onclick="setFilter('Semua')" class="w-full text-left p-4 rounded-2xl bg-white/5 font-bold hover:bg-blue-600 transition">Semua Koleksi</button>
            ${LIST_GENRE.map(g => `<button onclick="setFilter('${g}')" class="w-full text-left p-4 rounded-2xl border border-transparent hover:bg-white/5 transition text-gray-400 hover:text-white font-medium">${g}</button>`).join('')}
        </div>
        
        <div class="pt-8 border-t border-white/5">
            <div class="flex gap-5 mb-6 justify-center">
                <a href="https://wa.me/6285189415489" class="text-gray-500 hover:text-green-500 transition text-2xl"><i class="fa-brands fa-whatsapp"></i></a>
                <a href="https://instagram.com/jesssstri" class="text-gray-500 hover:text-pink-500 transition text-2xl"><i class="fa-brands fa-instagram"></i></a>
            </div>
            <a href="https://saweria.co/jesssstri" class="block w-full text-center p-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white transition">Dukung Kami (Donate)</a>
        </div>
    </aside>

    <main class="max-w-7xl mx-auto p-8 py-20">
        <header class="mb-20 text-center md:text-left">
            <h2 id="vTitle" class="text-5xl md:text-6xl font-black mb-4 tracking-tighter">Literasi Digital <span class="text-blue-500 italic">Premium.</span></h2>
            <p class="text-gray-500 uppercase text-[10px] tracking-[0.5em] font-black">E-Book Jestri VIP Collection 2026</p>
        </header>

        <div id="grid" class="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            <div class="h-80 bg-white/5 rounded-[2rem] animate-pulse"></div>
            <div class="h-80 bg-white/5 rounded-[2rem] animate-pulse"></div>
            <div class="h-80 bg-white/5 rounded-[2rem] animate-pulse"></div>
            <div class="h-80 bg-white/5 rounded-[2rem] animate-pulse"></div>
        </div>
    </main>

    <footer class="p-20 text-center border-t border-white/5">
        <h1 class="text-2xl font-black italic mb-8">E-BOOK <span class="text-blue-500">JESTRI</span></h1>
        <div class="flex justify-center gap-8 mb-10 text-2xl text-gray-600">
             <a href="https://wa.me/6285189415489" class="hover:text-white transition"><i class="fa-brands fa-whatsapp"></i></a>
             <a href="https://instagram.com/jesssstri" class="hover:text-white transition"><i class="fa-brands fa-instagram"></i></a>
        </div>
        <p class="text-gray-600 text-[10px] font-bold tracking-[0.3em] uppercase mb-4">© 2026 E-BOOK JESTRI. All Rights Reserved.</p>
        <a href="https://saweria.co/jesssstri" class="text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/30 px-6 py-2 rounded-full hover:bg-blue-500 hover:text-white transition">Donate</a>
    </footer>

    <div id="md" class="fixed inset-0 z-[200] bg-black/95 hidden items-center justify-center p-4 backdrop-blur-xl">
        <div class="bg-[#111] w-full max-w-lg rounded-[3rem] p-10 border border-white/5 shadow-2xl max-h-[90vh] overflow-y-auto relative">
            <h3 class="text-2xl font-black mb-8 italic">Penyelesaian Investasi.</h3>
            <div id="cartList" class="space-y-4 mb-10 border-b border-white/5 pb-8"></div>
            
            <div class="text-center mb-10 bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                <p class="text-[9px] font-black text-blue-500 mb-6 tracking-[0.3em] uppercase">Scan QRIS Untuk Akses</p>
                <div class="qris-frame mb-6">
                    <img src="https://i.ibb.co.com/jP4fBvY8/Screenshot-20250304-104953-CIMB-OCTO.jpg" class="w-48 h-auto" alt="QRIS">
                </div>
                <div class="text-[10px] font-bold text-gray-500 tracking-widest uppercase">E-Wallet: DANA / OVO</div>
                <div class="text-lg font-black text-white mt-1">0895 3278 06441</div>
            </div>

            <div class="flex justify-between font-black text-2xl mb-10">
                <span class="text-gray-600">Total</span>
                <span id="cartTotal" class="text-blue-500">Rp 0</span>
            </div>

            <input type="file" id="fi" class="hidden" onchange="document.getElementById('ftxt').innerText='✅ BUKTI SIAP DIKIRIM'">
            <label for="fi" class="block border-2 border-dashed border-white/10 p-6 rounded-3xl text-center cursor-pointer hover:border-blue-500 mb-6 transition">
                <span id="ftxt" class="text-xs font-bold text-gray-400 uppercase tracking-widest">Klik Untuk Upload Bukti Transfer</span>
            </label>

            <button onclick="prosesBayar()" id="btnBayar" class="w-full bg-blue-600 py-6 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl hover:bg-blue-500 hover:scale-[1.02] transition active:scale-95">KONFIRMASI INVESTASI</button>
            <button onclick="togCart(false)" class="w-full mt-6 text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">Kembali</button>
        </div>
    </div>

    <script>
        let books = [], cart = [];
        async function load() {
            const r = await fetch('/api/buku-json');
            books = await r.json();
            render('Semua');
        }
        function togSide(st) {
            document.getElementById('sb').style.transform = st ? 'translateX(0)' : 'translateX(-100%)';
            document.getElementById('ov').classList.toggle('hidden', !st);
        }
        function setFilter(g) {
            document.getElementById('vTitle').innerText = g === 'Semua' ? 'Literasi Digital Premium.' : g;
            render(g); togSide(false);
        }
        function render(g) {
            const grid = document.getElementById('grid');
            const data = g === 'Semua' ? books : books.filter(b => b.genre === g);
            grid.innerHTML = data.map(b => \`
                <div class="book-card group">
                    <div class="aspect-[3/4] overflow-hidden bg-[#222]">
                        <img src="\${b.gambar}" crossorigin="anonymous" class="w-full h-full object-cover group-hover:scale-110 transition duration-700" onerror="this.src='https://placehold.co/400x600/0A0A0A/FFF?text=E-BOOK+JESTRI'">
                    </div>
                    <div class="p-6">
                        <p class="text-[9px] text-blue-500 font-black uppercase tracking-widest mb-1">\${b.genre}</p>
                        <h4 class="font-bold text-sm h-10 line-clamp-2 mb-4 leading-tight">\${b.judul}</h4>
                        <div class="flex justify-between items-center pt-4 border-t border-white/5">
                            <span class="font-black text-lg italic tracking-tighter">Rp \${b.investasi.toLocaleString()}</span>
                            <button onclick="addCart('\${b._id}')" class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-blue-600 transition"><i class="fa-solid fa-plus text-xs"></i></button>
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
            m.classList.toggle('hidden', !st); m.style.display = st ? 'flex' : 'none';
            if(st) {
                document.getElementById('cartList').innerHTML = cart.map(x => \`<div class="flex justify-between font-bold text-[11px] uppercase tracking-tighter"><span>\${x.judul}</span><span class="text-blue-500">Rp \${x.investasi.toLocaleString()}</span></div>\`).join('');
                document.getElementById('cartTotal').innerText = 'Rp ' + cart.reduce((a,b)=>a+b.investasi,0).toLocaleString();
            }
        }
        async function prosesBayar() {
            const f = document.getElementById('fi').files[0]; if(!f) return alert("Bukti transfer wajib diupload.");
            const btn = document.getElementById('btnBayar'); btn.disabled = true; btn.innerText = "SEDANG MENGIRIM...";
            const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
            try {
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                await fetch('/api/order', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.investasi,0), bukti: up.secure_url })
                });
                alert("✅ Sukses! Tim JESTRI akan mengirimkan akses melalui WhatsApp Anda segera.");
                location.reload();
            } catch(e) { alert("Sistem sibuk, coba beberapa saat lagi."); btn.disabled = false; }
        }
        load();
    </script></body></html>`);
});

// --- 3. ADMIN: THE CONTROL CENTER (HIGH SECURITY) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.send(`<script>location.href='/login';</script>`);
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    res.send(`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></head>
    <body class="bg-[#0A0A0A] text-white p-10 font-sans">
        <div class="max-w-6xl mx-auto flex justify-between items-center mb-16">
            <h1 class="text-2xl font-black italic italic uppercase tracking-tighter">Command <span class="text-blue-500">Center</span></h1>
            <div class="flex gap-6 items-center">
                <a href="/" class="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition">Visit Website</a>
                <a href="/logout" class="text-xs font-bold uppercase text-red-500 border border-red-500/20 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition">Logout</a>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div class="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 h-fit">
                <h3 class="text-[10px] font-black uppercase text-blue-500 mb-8 tracking-[0.3em]">Publish New Catalog</h3>
                <div class="space-y-4">
                    <input id="j" placeholder="Judul Buku" class="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none text-sm focus:border-blue-500 transition">
                    <input id="p" placeholder="Penulis" class="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none text-sm focus:border-blue-500 transition">
                    <input id="h" type="number" placeholder="Nominal Investasi" class="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none text-sm focus:border-blue-500 transition">
                    <select id="g" class="w-full p-4 bg-black border border-white/10 rounded-2xl outline-none text-sm">${LIST_GENRE.map(g=>`<option>${g}</option>`).join('')}</select>
                    <div class="p-4 border-2 border-dashed border-white/10 rounded-2xl text-center">
                        <input type="file" id="cv" class="text-[10px] text-gray-500">
                    </div>
                    <button onclick="saveB()" id="sbtn" class="w-full bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl mt-4 hover:bg-blue-500 transition">Publish Now</button>
                </div>
            </div>
            <div class="lg:col-span-2 space-y-8">
                <h3 class="text-[10px] font-black uppercase text-blue-500 mb-6 tracking-[0.3em]">Pending Verification (${o.length})</h3>
                ${o.map(x => `
                <div class="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row gap-8 items-start">
                    <a href="${x.bukti}" target="_blank" class="block w-full md:w-52 h-72 flex-shrink-0"><img src="${x.bukti}" class="w-full h-full object-cover rounded-3xl border border-white/10 hover:opacity-80 transition"></a>
                    <div class="flex-grow">
                        <h4 class="text-3xl font-black text-blue-500 mb-2 italic tracking-tighter">Rp ${x.total.toLocaleString()}</h4>
                        <p class="text-[11px] text-gray-400 font-bold uppercase mb-8 leading-relaxed">${x.items.map(i=>i.judul).join(' • ')}</p>
                        <div class="bg-black p-2 rounded-2xl border border-white/5 mb-4">
                            <input id="link-${x._id}" placeholder="Paste MediaFire / Drive Link" class="w-full p-4 bg-transparent outline-none text-xs">
                        </div>
                        <div class="flex gap-3">
                            <button onclick="acc('${x._id}')" class="flex-grow bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition">Approve & Send Access</button>
                            <button onclick="delO('${x._id}')" class="bg-red-900/10 text-red-500 px-8 rounded-2xl font-black text-xs hover:bg-red-600 hover:text-white transition">X</button>
                        </div>
                    </div>
                </div>`).join('') || '<div class="text-center py-20 border-2 border-dashed border-white/5 rounded-[3rem] text-gray-600 font-bold italic uppercase tracking-widest">No pending orders.</div>'}
            </div>
        </div>
        <script>
            async function saveB(){
                const f = document.getElementById('cv').files[0]; if(!f) return alert("Pilih cover!");
                const btn = document.getElementById('sbtn'); btn.disabled = true; btn.innerText = "UPDATING...";
                const fd = new FormData(); fd.append('file', f); fd.append('upload_preset', 'ml_default');
                const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
                await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({judul:document.getElementById('j').value, penulis:document.getElementById('p').value, investasi:Number(document.getElementById('h').value), genre:document.getElementById('g').value, gambar:up.secure_url})});
                location.reload();
            }
            async function acc(id){
                const link = document.getElementById('link-'+id).value; if(!link) return alert("Link akses wajib diisi!");
                await fetch('/admin/approve/'+id, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({downloadLink: link}) });
                alert("Order Approved!"); location.reload();
            }
            async function delO(id){ if(confirm('Tolak dan hapus pesanan ini?')){ await fetch('/admin/del-order/'+id,{method:'DELETE'}); location.reload(); } }
        </script>
    </body></html>`);
});

// --- 4. LOGIN & SYSTEM ROUTES ---
app.get('/login', (req, res) => { 
    res.send(`<!DOCTYPE html><html><body style="background:#0A0A0A; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
    <form action="/login" method="POST" style="text-align:center; background:#111; p:40px; border-radius:30px; border:1px solid #222; width:300px;">
        <h2 style="color:white; font-weight:900; margin-bottom:30px; letter-spacing:-1px;">ELITE ACCESS</h2>
        <input name="pw" type="password" placeholder="Passcode" style="padding:15px; border-radius:15px; border:1px solid #333; background:#000; color:white; width:100%; text-align:center; margin-bottom:15px; outline:none;">
        < br><button style="background:#007AFF; color:white; border:none; padding:15px 30px; border-radius:15px; font-weight:900; width:100%; cursor:pointer;">UNLOCK</button>
    </form></body></html>`); 
});

app.post('/login', (req, res) => { 
    if (req.body.pw === 'JESTRI0301209') {
        req.session.admin = true;
        res.redirect('/admin'); 
    } else {
        res.send("<script>alert('Invalid Passcode'); location.href='/login';</script>");
    }
});

app.get('/logout', (req, res) => { req.session = null; res.redirect('/'); });

// API Endpoint (Hanya untuk Admin)
app.post('/admin/save', async (req, res) => { if(req.session.admin) await new Buku(req.body).save(); res.json({ok:true}); });
app.post('/admin/approve/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndUpdate(req.params.id, { status: 'Approved', downloadLink: req.body.downloadLink }); res.json({ok:true}); });
app.delete('/admin/del-order/:id', async (req, res) => { if(req.session.admin) await Order.findByIdAndDelete(req.params.id); res.sendStatus(200); });

// API Public
app.get('/api/buku-json', async (req, res) => res.json(await Buku.find().sort({_id:-1})));
app.post('/api/order', async (req, res) => { const o = new Order(req.body); await o.save(); res.json({id:o._id}); });

app.listen(process.env.PORT || 3000);        
