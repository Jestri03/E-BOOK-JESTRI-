const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE CONFIG ---
const MONGO_URI = 'mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI).then(() => console.log("🚀 Platform Ready")).catch(e => console.log(e));

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String, genre: String, rating: {type: Number, default: 5.0} });
const Order = mongoose.model('Order', { items: Array, total: Number, bukti: String, status: { type: String, default: 'Pending' }, pdfLink: String, date: { type: Date, default: Date.now } });

const LIST_GENRE = ['Fiksi','Edukasi','Teknologi','Bisnis','Misteri','Komik','Sejarah'];

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieSession({ name: 'jestri_pro', keys: ['ULTRA_SECURE_KEY'], maxAge: 24 * 60 * 60 * 1000 }));

// --- 1. FRONTEND PEMBELI (PROFESSIONAL UI) ---
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jestri Store | Platform E-Book Premium</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
        :root { --primary: #0B4D74; --secondary: #F59E0B; --bg: #F8FAFC; }
        body { font-family: 'Inter', sans-serif; background-color: var(--bg); color: #0F172A; }
        h1, h2, h3 { font-family: 'Poppins', sans-serif; }
        .glass-header { background: rgba(11, 77, 116, 0.95); backdrop-filter: blur(10px); }
        .card-shadow { transition: all 0.3s ease; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
        .card-shadow:hover { transform: translateY(-5px); box-shadow: 0 20px 30px -10px rgba(0,0,0,0.1); }
        .sidebar-transition { transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .active-genre { background: var(--secondary) !important; color: white !important; font-weight: 700; }
        .loading-skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; }
        @keyframes skeleton-loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    </style></head><body class="pb-24">

    <div id="overlay" onclick="toggleMenu()" class="fixed inset-0 bg-black/60 z-[4500] hidden backdrop-blur-sm"></div>
    <aside id="sidebar" class="fixed top-0 left-0 h-full w-72 bg-[#0F172A] z-[5000] sidebar-transition -translate-x-full p-6 text-white">
        <div class="flex justify-between items-center mb-10">
            <span class="text-2xl font-extrabold text-[#0ea5e9]">JESTRI</span>
            <i class="fa-solid fa-xmark text-2xl cursor-pointer" onclick="toggleMenu()"></i>
        </div>
        <p class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Kategori E-Book</p>
        <div class="space-y-2">
            <div onclick="setGenre('Semua', this)" class="genre-item active-genre p-3 rounded-xl cursor-pointer hover:bg-white/10 transition">Semua Koleksi</div>
            ${LIST_GENRE.map(g => `<div onclick="setGenre('${g}', this)" class="genre-item p-3 rounded-xl cursor-pointer hover:bg-white/10 transition">${g}</div>`).join('')}
        </div>
        <div class="mt-10 pt-10 border-t border-white/10">
            <a href="https://link.dana.id/qr/0895327806441" class="block w-full bg-[#4c1d95] p-4 rounded-2xl text-center font-bold shadow-lg shadow-purple-900/20">
                <i class="fa-solid fa-heart mr-2"></i>Donasi Admin
            </a>
        </div>
    </aside>

    <header class="glass-header sticky top-0 z-40 text-white p-4 shadow-lg">
        <div class="max-w-6xl mx-auto flex justify-between items-center">
            <div class="flex items-center gap-4">
                <i class="fa-solid fa-bars-staggered text-xl cursor-pointer" onclick="toggleMenu()"></i>
                <h1 class="text-xl font-extrabold tracking-tighter">JESTRI<span class="text-amber-400">.ID</span></h1>
            </div>
            <div class="flex items-center gap-5">
                <i class="fa-solid fa-magnifying-glass text-lg opacity-80"></i>
                <div class="relative cursor-pointer" onclick="openCheckout()">
                    <i class="fa-solid fa-bag-shopping text-xl"></i>
                    <span id="cartCount" class="absolute -top-2 -right-2 bg-amber-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#0B4D74]">0</span>
                </div>
            </div>
        </div>
    </header>

    <section class="p-5 max-w-6xl mx-auto">
        <div class="bg-gradient-to-br from-[#0B4D74] to-[#1e293b] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
            <div class="relative z-10">
                <span class="bg-amber-500/20 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">E-Book Eksklusif</span>
                <h2 class="text-3xl font-bold mt-4 mb-2 leading-tight">Bangun Perpustakaan Digitalmu</h2>
                <p class="text-blue-100/70 text-sm max-w-[250px]">Dapatkan akses e-book premium dalam hitungan detik. Cepat, Mudah, Aman.</p>
            </div>
            <i class="fa-solid fa-book-open absolute -right-4 -bottom-4 text-9xl text-white/5 rotate-12"></i>
        </div>
    </section>

    <main class="max-w-6xl mx-auto px-5">
        <div class="flex justify-between items-center mb-6">
            <h3 id="currentGenreName" class="font-extrabold text-xl text-slate-800">Semua Koleksi</h3>
            <span class="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Baru Rilis</span>
        </div>
        
        <div id="bookGrid" class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            </div>
    </main>

    <div class="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        <a href="https://wa.me/6285189415489" class="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-xl text-2xl active:scale-90 transition"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://instagram.com/jesssstri" class="w-14 h-14 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-xl text-2xl active:scale-90 transition"><i class="fa-brands fa-instagram"></i></a>
    </div>

    <div id="socialProof" class="fixed bottom-24 left-6 bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 z-40 translate-y-40 transition-all duration-500 overflow-hidden max-w-[280px]">
        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><i class="fa-solid fa-cart-arrow-down"></i></div>
        <div>
            <p class="text-[10px] text-gray-500 leading-none">Seseorang baru saja membeli</p>
            <p id="proofBookName" class="text-[11px] font-bold truncate w-40">E-Book Produktivitas</p>
        </div>
    </div>

    <div id="checkoutModal" class="fixed inset-0 z-[6000] bg-black/80 hidden items-end md:items-center justify-center p-4">
        <div class="bg-white w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 animate-slide-up relative">
            <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden"></div>
            <h3 class="text-2xl font-extrabold mb-1">Konfirmasi Pesanan</h3>
            <p class="text-gray-500 text-sm mb-6">Pastikan pilihanmu sudah benar.</p>
            
            <div id="cartList" class="max-h-60 overflow-y-auto space-y-4 mb-6 pr-2"></div>
            
            <div class="flex justify-between items-center py-4 border-t border-slate-100 mb-6">
                <span class="font-bold text-slate-500">Total Pembayaran</span>
                <span id="cartTotalPrice" class="text-2xl font-black text-blue-900">Rp 0</span>
            </div>

            <div class="bg-blue-50 p-4 rounded-2xl mb-6">
                <p class="text-[10px] font-bold text-blue-600 uppercase mb-2">Metode Pembayaran</p>
                <div class="flex items-center gap-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/QRIS_logo.svg/1200px-QRIS_logo.svg.png" class="h-5">
                    <span class="text-xs font-bold text-slate-700">QRIS / E-Wallet / Transfer Bank</span>
                </div>
                <input type="file" id="proofUpload" class="hidden" onchange="handleFileChange()">
                <label for="proofUpload" id="fileLabel" class="mt-4 flex items-center justify-center gap-2 border-2 border-dashed border-blue-200 p-4 rounded-xl text-blue-700 text-xs font-bold cursor-pointer hover:bg-blue-100 transition">
                    <i class="fa-solid fa-cloud-arrow-up text-lg"></i> UPLOAD BUKTI TRANSFER
                </label>
            </div>

            <button onclick="processOrder()" id="btnSubmit" class="w-full bg-[#0B4D74] text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition disabled:opacity-50">PROSES SEKARANG</button>
        </div>
    </div>

    <script>
        let books = [], cart = [];
        const proofNames = ["Dika", "Santi", "Budi", "Lina", "Anas", "Rizky", "Putri"];

        async function init() {
            const res = await fetch('/api/buku-json');
            books = await res.json();
            renderBooks(books);
            startSocialProof();
        }

        function toggleMenu() {
            const sb = document.getElementById('sidebar');
            const ov = document.getElementById('overlay');
            sb.classList.toggle('-translate-x-full');
            ov.classList.toggle('hidden');
        }

        function renderBooks(data) {
            const grid = document.getElementById('bookGrid');
            if(!data.length) { grid.innerHTML = '<p class="col-span-2 text-center py-20 text-gray-400">Belum ada koleksi.</p>'; return; }
            grid.innerHTML = data.map(b => `
                <div class="card-shadow bg-white rounded-[1.5rem] overflow-hidden flex flex-col">
                    <div class="relative group">
                        <img src="${b.gambar}" class="w-full aspect-[3/4] object-cover" loading="lazy">
                        <div class="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                            <i class="fa-solid fa-star text-amber-500 text-[10px]"></i>
                            <span class="text-[10px] font-black">5.0</span>
                        </div>
                    </div>
                    <div class="p-4 flex flex-grow flex-col">
                        <h4 class="font-bold text-sm text-slate-800 line-clamp-2 leading-tight h-10 mb-1">${b.judul}</h4>
                        <p class="text-[10px] text-slate-400 font-medium mb-3 truncate">By ${b.penulis}</p>
                        <div class="mt-auto flex items-center justify-between">
                            <span class="font-black text-blue-900 text-sm">Rp ${b.harga.toLocaleString()}</span>
                            <button onclick="addToCart('${b._id}')" class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition active:scale-90">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function setGenre(g, el) {
            document.querySelectorAll('.genre-item').forEach(i => i.classList.remove('active-genre'));
            el.classList.add('active-genre');
            document.getElementById('currentGenreName').innerText = g;
            renderBooks(g === 'Semua' ? books : books.filter(b => b.genre === g));
            toggleMenu();
        }

        function addToCart(id) {
            const b = books.find(x => x._id === id);
            if(!cart.find(x => x._id === id)) {
                cart.push(b);
                document.getElementById('cartCount').innerText = cart.length;
                // Toast Feedback
                const btn = event.currentTarget;
                btn.innerHTML = '<i class="fa-solid fa-check"></i>';
                setTimeout(() => btn.innerHTML = '<i class="fa-solid fa-plus"></i>', 1000);
            }
        }

        function openCheckout() {
            if(!cart.length) return alert("Keranjang kosong!");
            const modal = document.getElementById('checkoutModal');
            const list = document.getElementById('cartList');
            modal.style.display = 'flex';
            list.innerHTML = cart.map(x => `
                <div class="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl">
                    <img src="${x.gambar}" class="w-12 h-16 rounded-lg object-cover shadow-sm">
                    <div class="flex-grow">
                        <p class="text-xs font-bold text-slate-800 truncate w-40">${x.judul}</p>
                        <p class="text-[10px] text-blue-600 font-black">Rp ${x.harga.toLocaleString()}</p>
                    </div>
                    <i class="fa-solid fa-trash-can text-red-400 p-2 cursor-pointer" onclick="removeFromCart('${x._id}')"></i>
                </div>
            `).join('');
            document.getElementById('cartTotalPrice').innerText = 'Rp ' + cart.reduce((a,b)=>a+b.harga,0).toLocaleString();
        }

        function removeFromCart(id) {
            cart = cart.filter(x => x._id !== id);
            document.getElementById('cartCount').innerText = cart.length;
            if(!cart.length) document.getElementById('checkoutModal').style.display = 'none';
            else openCheckout();
        }

        function handleFileChange() {
            const label = document.getElementById('fileLabel');
            label.innerHTML = '<i class="fa-solid fa-circle-check text-green-500"></i> BUKTI TERPILIH';
            label.classList.add('bg-green-50', 'border-green-200', 'text-green-700');
        }

        async function processOrder() {
            const file = document.getElementById('proofUpload').files[0];
            if(!file) return alert("Upload bukti bayar!");
            const btn = document.getElementById('btnSubmit');
            btn.disabled = true; btn.innerText = "MENGIRIM...";

            const fd = new FormData();
            fd.append('file', file);
            fd.append('upload_preset', 'ml_default');
            
            const up = await (await fetch('https://api.cloudinary.com/v1_1/dxtp7vsqy/image/upload',{method:'POST',body:fd})).json();
            const res = await fetch('/api/order', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ items: cart, total: cart.reduce((a,b)=>a+b.harga,0), bukti: up.secure_url })
            });
            const data = await res.json();
            
            document.getElementById('mContent').innerHTML = \`
                <div class="text-center py-10">
                    <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <h3 class="text-2xl font-black mb-2">Order Terkirim!</h3>
                    <p class="text-gray-500 text-sm mb-8">Admin akan memvalidasi pembayaranmu. Link download akan muncul otomatis di bawah ini.</p>
                    <div id="waitBox" class="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200">
                        <div class="flex items-center justify-center gap-3 mb-4">
                            <div class="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Menunggu Konfirmasi...</span>
                        </div>
                    </div>
                </div>\`;

            const timer = setInterval(async () => {
                const rs = await fetch('/api/check/'+data.id);
                const st = await rs.json();
                if(st.status === 'Approved') {
                    clearInterval(timer);
                    document.getElementById('waitBox').innerHTML = \`
                        <a href="\${st.pdfLink}" download class="block w-full bg-green-600 text-white p-5 rounded-2xl font-black shadow-xl shadow-green-900/20 flex items-center justify-center gap-3">
                            <i class="fa-solid fa-cloud-arrow-down text-xl"></i> DOWNLOAD E-BOOK PDF
                        </a>\`;
                }
            }, 4000);
        }

        function startSocialProof() {
            const proof = document.getElementById('socialProof');
            setInterval(() => {
                const randomName = proofNames[Math.floor(Math.random()*proofNames.length)];
                const randomBook = books.length ? books[Math.floor(Math.random()*books.length)].judul : "Premium E-Book";
                document.getElementById('proofBookName').innerText = randomBook;
                proof.classList.remove('translate-y-40');
                setTimeout(() => proof.classList.add('translate-y-40'), 5000);
            }, 15000);
        }

        init();
    </script>
    <style> @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } } .animate-slide-up { animation: slide-up 0.4s ease-out; } </style>
    </body></html>`);
});

// --- 2. ADMIN LOGIN (STYLE GAMBAR REQUEST) ---
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin:0; background:#1e293b; height:100vh; display:flex; align-items:center; justify-content:center; font-family:sans-serif; }
        .login { position:absolute; inset:60px; display:flex; justify-content:center; align-items:center; flex-direction:column; border-radius:10px; background:#00000033; color:#fff; z-index:1000; box-shadow:inset 0 10px 20px #00000080; border-bottom:2px solid #ffffff80; overflow:hidden; }
        input { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); padding:12px; border-radius:8px; color:white; text-align:center; margin-bottom:15px; outline:none; width:70%; }
        button { background:#0ea5e9; color:white; border:none; padding:12px 30px; border-radius:8px; font-weight:bold; cursor:pointer; width:70%; }
    </style></head><body>
    <form class="login" action="/login" method="POST">
        <h2 style="letter-spacing:2px; margin-bottom:20px;">ADMIN PANEL</h2>
        <input name="pw" type="password" placeholder="Passcode">
        <button type="submit">ENTER</button>
    </form></body></html>`);
});

app.post('/login', (req, res) => { if (req.body.pw === 'JESTRI0301209') req.session.admin = true; res.redirect('/admin'); });

// --- 3. ADMIN DASHBOARD (CLEAN & PRO) ---
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const b = await Buku.find().sort({_id:-1});
    const o = await Order.find({status:'Pending'});
    
    const listO = o.map(x => `
        <div style="background:white; padding:20px; border-radius:20px; margin-bottom:15px; border-left:10px solid #0ea5e9; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content
