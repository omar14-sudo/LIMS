// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://cdn.jsdelivr.net/npm/chart.js"
      ],
      styleSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
        "'unsafe-inline'"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      connectSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://cdnjs.cloudflare.com"
      ]
    },
  },
}));
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const testsRoutes = require('./routes/tests');    
const samplesRoutes = require('./routes/samples');

const reportsRoutes = require('./routes/reports');
const notificationsRoutes = require('./routes/notifications');
const backupRoutes = require('./routes/backup');


app.use('/api/auth', authRoutes);
app.use('/api/tests', testsRoutes);  
app.use('/api/samples', samplesRoutes);

app.use('/api/users', usersRoutes); 

app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/partials', express.static(path.join(__dirname, '../public/partials')));
app.use(express.static(path.join(__dirname, '../public')));
// Start server



app.listen(PORT, () => {
  console.log(`✅ السيرفر شغال على http://localhost:${PORT}`);
});