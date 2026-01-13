const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'jestri-secret',
    resave: false,
    saveUninitialized: true
}));

// Proteksi Dashboard
const checkAuth = (req, res, next) => {
    if (req.session.isAdmin) return next();
    res.redirect('/login-admin');
};

app.get('/', (req, res) => {
    res.render('index', { books: [] }); // Tampilan depan tidak berubah
});

app.get('/login-admin', (req, res) => {
    res.render('admin', { mode: 'login' });
});

app.post('/login-admin', (req, res) => {
    if (req.body.password === 'jestri123') {
        req.session.isAdmin = true;
        return res.redirect('/admin-dashboard');
    }
    res.send('<script>alert("Password Salah!"); window.location="/login-admin";</script>');
});

app.get('/admin-dashboard', checkAuth, (req, res) => {
    res.render('admin', { mode: 'dashboard' });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login-admin');
});

app.listen(PORT, () => console.log('Admin Panel Ready'));
module.exports = app;

