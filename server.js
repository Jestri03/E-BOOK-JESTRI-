const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const app = express();

// KONEKSI DATABASE
mongoose.connect('mongodb+srv://JESTRI:JESTRI0301209@cluster0.tprp2r7.mongodb.net/ebook_jestri?retryWrites=true&w=majority');

const Buku = mongoose.model('Buku', { judul: String, penulis: String, harga: Number, gambar: String });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({ name: 'session', keys: ['jestri-mewah'], maxAge: 24 * 60 * 60 * 1000 }));

// CSS PREMIUM (DITANAM LANGSUNG BIAR GAK HANCUR)
const style = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
    :root { --gold: #f39c12; --dark: #0d0d0d; --card: #1a1a1a; --text: #ffffff; }
    body { font-family: 'Poppins', sans-serif; background: var(--dark); color: var(--text); margin: 0; padding: 0; }
    .container { max-width: 1200px; margin: auto; padding: 20px; }
    
    header { text-align: center; padding: 60px 20px; background: linear-gradient(to bottom, #1a1a1a, #0d0d0d); }
    header h1 { font-size: 3em; color: var(--gold); margin: 0; text-transform: uppercase; letter-spacing: 5px; text-shadow: 0 0 15px rgba(243, 156, 18, 0.4); }
    header p { color: #888; letter-spacing: 2px; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 35px; padding: 40px 0; }
    .card { background: var(--card); border-radius: 25px; overflow: hidden; transition: 0.5s; border: 1px solid #333; position: relative; }
    .card:hover { transform: translateY(-15px); border-color: var(--gold); box-shadow: 0 20px 40px rgba(0,0,0,0.7); }
    .card img { width: 100%; height: 420px; object-fit: cover; transition: 0.6s; }
    .card:hover img { transform: scale(1.08); }
    
    .info { padding: 25px; text-align: center; background: linear-gradient(to top, #111 80%, transparent); }
    .info h3 { margin: 10px 0; font-size: 1.4em; color: var(--gold); }
    .info p { color: #aaa; font-size: 0.9em; margin-bottom: 20px; }
    .price { font-size: 1.7em; color: #2ecc71; font-weight: 700; margin-bottom: 25px; display: block; }
    
    .btn-wa { display: block; background: var(--gold); color: white; text-decoration: none; padding: 15px; border-radius: 15px; font-weight: bold; font-size: 1.1em; transition: 0.3s; box-shadow: 0 5px 15px rgba(243, 156, 18, 0.2); }
    .btn-wa:hover { background: #e67e22; transform: scale(1.05); box-shadow: 0 8px 20px rgba(243, 156, 18, 0.4); }

    /* ADMIN STYLE */
    .admin-form { background: var(--card); padding: 40px; border-radius: 25px; max-width: 500px; margin: 50px auto; border: 1px solid #333; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    input { width: 100%; padding: 15px; margin: 12px 0; border-radius: 12px; border: 1px solid #333; background: #222; color: white; font-size: 1em; box-sizing: border-box; }
    .btn-save { width: 100%; padding: 15px; background: var(--gold); border: none; color: white; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 1.1em; margin-top: 10px; }
    
    table { width: 100%; margin-top: 50px; border-collapse: collapse; background: var(--card); border-radius: 20px; overflow: hidden; }
    th, td { padding: 20px; text-align: left; border-bottom: 1px solid #222; }
    th { background: #222; color: var(--gold); font-size: 0.9em; text-transform: uppercase; }
    .del { color: #ff4757; text-decoration: none; font-weight: bold; padding: 8px 15px; border: 1px solid #ff4757; border-radius: 8px; transition: 0.3s; }
    .del:hover { background: #ff4757; color: white; }
</style>
`;

// ROUTE PEMBELI
app.get('/', async (req, res) => {
    const data = await Buku.find() || [];
    let items = data.map(b => `
        <div class="card">
            <img src="${b.gambar}" onerror="this.src='https://via.placeholder.com/400x600?text=Cover+Buku'">
            <div class="info">
                <h3>${b.judul}</h3>
                <p>Karya Terbaik ${b.penulis}</p>
                <span class="price">Rp ${b.harga.toLocaleString('id-ID')}</span>
                <a href="https://wa.me/628123456789?text=Halo, saya ingin order buku ${b.judul}" class="btn-wa">AMBIL SEKARANG</a>
            </div>
        </div>`).join('');

    res.send(`<!DOCTYPE html><html><head><title>JESTRI STORE</title>${style}</head><body>
        <header>
            <h1>JESTRI E-BOOK STORE</h1>
            <p>Premium Collection for Your Knowledge</p>
        </header>
        <div class="container">
            <div class="grid">${items || '<p style="text-align:center; grid-column:1/-1;">Katalog sedang dipersiapkan...</p>'}</div>
        </div>
    </body></html>`);
});

// ROUTE LOGIN
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head>${style}</head><body>
        <div class="admin-form">
            <h2 style="text-align:center; color:var(--gold); letter-spacing:2px;">🔐 ADMIN ACCESS</h2>
            <form action="/admin-dashboard" method="POST">
                <input type="password" name="password" placeholder="Password Rahasia" required>
                <button class="btn-save">UNLOCK PANEL</button>
            </form>
        </div>
    </body></html>`);
});

app.post('/admin-dashboard', (req, res) => {
    if (req.body.password === 'JESTRI0301209') { req.session.admin = true; res.redirect('/jestri-control'); }
    else { res.send("<script>alert('Password Salah!'); window.location='/login';</script>"); }
});

// ROUTE DASHBOARD ADMIN
app.get('/jest

