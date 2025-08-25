const cors = require('cors');

const corsOptions = {
    origin: [
        'http://localhost:4200', 
        'http://127.0.0.1:4200'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = cors(corsOptions);