const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS - allow all origins for now
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.get('/verify/:token', require('./controllers/authController').redirectToAngular);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;