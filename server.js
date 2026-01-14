const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// --- DATABASE (Optimasi Koneksi) ---
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority', {
    serverSelectionTimeoutMS: 5000,
}).catch(err => console.log("DB Offline"));

const Buku = mongoose.model('Buku', { 
    judul: String, penulis: String, harga: Number, gambar: String, genre: String 
});

// --- MIDDLEWARE RINGAN (Mencegah Vercel Timeout) ---
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieSession({ name: 'js_sess', keys: ['jestri-pro-key'], maxAge: 24 * 60 * 60 * 1000 }));

// --- API KATALOG (Ultra Fast) ---
app.get('/api/buku', async (req, res) => {
    try {
        const { genre, search } = req.query;
        let q = {};
        if (search) q.judul = { $regex: search, $options: 'i' };
        if (genre && genre !== 'Semua') q.genre = genre;
        
        const data = await Buku.find(q).sort({_id:-1}).lean();
        
        if (!data.length) {
            return res.send(`<div style="grid-column:1/3;text-align:center;padding:100px 20px;color:#ccc;font-weight:700">Buku ${genre || ''} belum tersedia</div>`);
        }

        res.send(data.map(b => {
            const waMsg = encodeURIComponent(`🛒 *ORDER E-BOOK JESTRI*\n\n📖 *JUDUL:* ${b.judul}\n✍️ *PENULIS:* ${b.penulis}\n💰 *HARGA:* Rp ${b.harga.toLocaleString('id-ID')}\n\nSaya ingin membeli ebook ini. Mohon info cara pembayaran.`);
            return `
            <div class="card-pro">
                <div class="img-box"><img src="${b.gambar}" loading="lazy"></div>
                <div class="card-info">
                    <span class="g-tag">${b.genre}</span>
                    <h3>${b.judul}</h3>
                    <p>${b.penulis}</p>
                    <div class="price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                    <button class="buy-btn" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">
                        <i class="fa-brands fa-whatsapp"></i> BELI SEKARANG
                    </button>
                </div>
            </div>`;
        }).join(''));
    } catch (e) { res.status(500).send("Error"); }
});

// --- UI ENGINE ---
app.get('/', async (req, res) => {
    const genres = ['Fiksi','Edukasi','Teknologi','Bisnis','Pelajaran','Misteri','Komik','Sejarah'];
    const initial = await Buku.find().sort({_id:-1}).limit(12).lean();
    
    res.send(`<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>JESTRI - Premium E-Book</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { max-width: 100%; overflow-x: hidden; touch-action: pan-y; font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; background: #fff; }
        
        /* NAVBAR */
        .header { background: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 99; border-bottom: 1px solid #f1f1f1; }
        .btn-dana { background: #2ed573; color: #fff; padding: 8px 15px; border-radius: 20px; font-weight: 800; font-size: 0.7rem; text-decoration: none; box-shadow: 0 5px 15px rgba(46,213,115,0.2); }

        /* SIDEBAR */
        .sidebar { position: fixed; top: 0; left: -110%; width: 280px; height: 100%; background: #fff; z-index: 101; transition: 0.3s; padding: 25px; box-shadow: 20px 0 50px rgba(0,0,0,0.1); }
        .sidebar.active { left: 0; }
        .overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); z-index: 100; display: none; backdrop-filter: blur(4px); }
        .overlay.active { display: block; }

        .g-item { display: block; width: 100%; padding: 14px; margin-bottom: 5px; border-radius: 12px; border: none; background: none; text-align: left; font-weight: 600; color: #555; cursor: pointer; }
        .g-item.active { background: #2e86de; color: #fff; }

        /* CONTENT */
        .container { max-width: 800px; margin: auto; padding: 15px; }
        .search-in { width: 100%; padding: 16px; border-radius: 15px; border: 1px solid #eee; background: #f9f9f9; margin-bottom: 20px; outline: none; font-size: 1rem; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }

        /* CARD PRO */
        .card-pro { background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid #f1f1f1; animation: fadeIn 0.4s ease forwards; }
        .img-box { width: 100%; aspect-ratio: 2/3; overflow: hidden; }
        .img-box img { width: 100%; height: 100%; object-fit: cover; }
        .card-info { padding: 12px; }
        .g-tag { font-size: 0.6rem; font-weight: 800; color: #2e86de; text-transform: uppercase; margin-bottom: 5px; display: block; }
        .card-info h3 { font-size: 0.85rem; margin: 0 0 5px; font-weight: 800; line-height: 1.3; height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .card-info p { font-size: 0.7rem; color: #888; margin: 0 0 10px; }
        .price { color: #2ed573; font-weight: 800; font-size: 0.95rem; margin-bottom: 12px; }
        .buy-btn { width: 100%; padding: 10px; border-radius: 10px; border: none; background: #000; color: #fff; font-weight: 800; font-size: 0.65rem; cursor: pointer; }

        .social { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 10px; z-index: 90; }
        .s-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; text-decoration: none; font-size: 1.3rem; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }

        #lb { position: fixed; top: 0; left: 0; height: 3px; background: #2e86de; width: 0; transition: 0.3s; z-index: 1000; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
    </head><body>
    <div id="lb"></div>
    <div class="overlay" id="ov" onclick="tog()"></div>
    <div class="sidebar" id="sb">
        <h2 style="font-weight: 800; margin-bottom: 25px;">JESTRI</h2>
        <button class="g-item active" onclick="load('Semua', this)">Semua Koleksi</button>
        ${genres.map(g => `<button class="g-item" onclick="load('${g}', this)">${g}</button>`).join('')}
    </div>

    <div class="header">
        <i class="fa-solid fa-bars-staggered" onclick="tog()" style="font-size: 1.3rem; cursor: pointer"></i>
        <b style="font-size: 1.1rem; letter-spacing: -0.5px">E-BOOK JESTRI</b>
        <a href="https://link.dana.id/qr/39bpg786" class="btn-dana">DONATE</a>
    </div>

    <div class="container">
        <input type="text" class="search-in" oninput="cari(this.value)" placeholder="Cari judul e-book...">
        <div class="grid" id="gt">
            ${initial.map(b => {
                const waMsg = encodeURIComponent(`🛒 *ORDER E-BOOK JESTRI*\n\n📖 *JUDUL:* ${b.judul}\n✍️ *PENULIS:* ${b.penulis}\n💰 *HARGA:* Rp ${b.harga.toLocaleString('id-ID')}\n\nSaya ingin membeli ebook ini. Mohon info cara pembayaran.`);
                return `
                <div class="card-pro">
                    <div class="img-box"><img src="${b.gambar}"></div>
                    <div class="card-info">
                        <span class="g-tag">${b.genre}</span>
                        <h3>${b.judul}</h3>
                        <p>${b.penulis}</p>
                        <div class="price">Rp ${b.harga.toLocaleString('id-ID')}</div>
                        <button class="buy-btn" onclick="location.href='https://wa.me/6285189415489?text=${waMsg}'">BELI SEKARANG</button>
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>

    <div class="social">
        <a href="https://wa.me/6285189415489" class="s-icon" style="background:#25d366"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="https://www.instagram.com/jesssstri" class="s-icon" style="background:#e4405f"><i class="fa-brands fa-instagram"></i></a>
        <a href="https://t.me/+62895327806441" class="s-icon" style="background:#0088cc"><i class="fa-brands fa-telegram"></i></a>
    </div>

    <script>
        const lb = document.getElementById('lb');
        const gt = document.getElementById('gt');
        function tog(){ document.getElementById('sb').classList.toggle('active'); document.getElementById('ov').classList.toggle('active'); }
        async function load(g, el){
            document.querySelectorAll('.g-item').forEach(b => b.classList.remove('active'));
            el.classList.add('active'); if(window.innerWidth < 768) tog();
            lb.style.width = '50%';
            const res = await fetch('/api/buku?genre='+encodeURIComponent(g));
            gt.innerHTML = await res.text();
            lb.style.width = '100%'; setTimeout(()=> lb.style.width='0', 300);
        }
        let t;
        function cari(v){
            clearTimeout(t);
            t = setTimeout(async ()=>{
                const res = await fetch('/api/buku?search='+encodeURIComponent(v));
                gt.innerHTML = await res.text();
            }, 300);
        }
    </script></body></html>`);
});

// --- ADMIN MODE ---
app.get('/admin', async (req, res) => {
    if(!req.session.admin) return res.send('<script>location.href="/login"</script>');
    const b = await Buku.find().sort({_id:-1}).lean();
    res.send(`<body style="font-family:sans-serif; background:#f4f4f4; padding:20px;">
        <h3>ADMIN PANEL</h3>
        <form id="f" style="background:#fff; padding:20px; border-radius:15px;">
            <input id="j" placeholder="Judul" style="width:100%; padding:12px; margin-bottom:10px;" required>
            <input id="p" placeholder="Penulis" style="width:100%; padding:12px; margin-bottom:10px;" required>
            <input id="h" placeholder="Harga (Contoh: 2.500)" style="width:100%; padding:12px; margin-bottom:10px;" required>
            <input type="file" id="fi" style="margin-bottom:10px;" required>
            <select id="g" style="width:100%; padding:12px; margin-bottom:10px;">
                <option>Fiksi</option><option>Edukasi</option><option>Teknologi</option>
                <option>Bisnis</option><option>Pelajaran</option><option>Misteri</option>
                <option>Komik</option><option>Sejarah</option>
            </select>
            <button style="width:100%; padding:15px; background:#2e86de; color:#fff; border:none; border-radius:10px; font-weight:800;">POSTING BUKU</button>
        </form>
        <div id="ld" style="display:none;">Uploading...</div>
        <div style="margin-top:20px;">
            ${b.map(x => `<div style="background:#fff; padding:10px; border-radius:10px; margin-bottom:5px; display:flex; justify-content:space-between;">
                <span>${x.judul}</span><a href="/del/${x._id}" style="color:red; text-decoration:none;">Hapus</a>
            </div>`).join('')}
        </div>
        <script>
            const hI = document.getElementById('h');
            hI.oninput = () => {
                let v = hI.value.replace(/\\D/g, "");
                hI.value = v.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
            };
            document.getElementById('f').onsubmit = async (e) => {
                e.preventDefault();
                document.getElementById('ld').style.display='block';
                const fd = new FormData();
                fd.append('image', document.getElementById('fi').files[0]);
                try {
                    const iR = await fetch('https://api.imgbb.com/1/upload?key=63af1a12f6f91a1816c9d61d5268d948', {method:'POST', body:fd});
                    const iD = await iR.json();
                    await fetch('/add-ajax', {
                        method:'POST',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({
                            judul: document.getElementById('j').value,
                            penulis: document.getElementById('p').value,
                            harga: Number(hI.value.replace(/\\./g, '')),
                            genre: document.getElementById('g').value,
                            gambar: iD.data.url
                        })
                    });
                    location.reload();
                } catch(err) { alert('Gagal'); }
            };
        </script>
    </body>`);
});

app.get('/login', (req, res) => res.send('<form action="/login" method="POST" style="padding:50px"><input type="password" name="pw"><button>Login</button></form>'));
app.post('/login', (req, res) => { if(req.body.pw === 'JESTRI0301209') { req.session.admin=true; res.redirect('/admin'); } else res.send('Salah'); });
app.post('/add-ajax', async (req, res) => { if(req.session.admin) { await new Buku(req.body).save(); res.sendStatus(200); } });
app.get('/del/:id', async (req, res) => { if(req.session.admin) { await Buku.findByIdAndDelete(req.params.id); res.redirect('/admin'); } });

module.exports = app;

