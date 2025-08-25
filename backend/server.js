const express = require('express');
require('dotenv').config();

const corsMiddleware = require('./middleware/corsMiddleware');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api', authRoutes);  // API routes only

// Direct redirect route (מחוץ ל-API)
app.get('/verify/:token', require('./controllers/authController').redirectToAngular);

// הפעלת השרת
app.listen(PORT, () => {
    console.log(`🚀 השרת רץ על http://localhost:${PORT}`);
    console.log('🔗 API Endpoints:');
    console.log('   POST /api/send-link');
    console.log('   GET  /api/verify/:token');
    console.log('   GET  /verify/:token (redirect)');
    console.log('---');
});

module.exports = app;