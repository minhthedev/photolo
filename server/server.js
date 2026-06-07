require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./config/db');

const albumRoutes = require('./routes/albumRoutes');
const imageRoutes = require('./routes/imageRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors(
    allowedOrigins?.length
      ? {
          origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
              return;
            }
            callback(new Error('Not allowed by CORS'));
          },
        }
      : {}
  )
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/images', imageRoutes);

if (isProduction) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const start = async () => {
  try {
    await initDb();
    console.log('Database initialized');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      if (isProduction) {
        console.log('Production mode: serving frontend from client/dist');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error.message || error);
    console.error(
      '\nKiểm tra DATABASE_URL trên Render (dùng connection string Pooler từ Neon, có sslmode=require).'
    );
    process.exit(1);
  }
};

start();
