import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { CircuventSMTPServer } from './services/smtpServer.js';
import imapService from './services/imapService.js';
import emailRoutes from './routes/emails.js';
import userRoutes from './routes/users.js';
import emailRulesRoutes from './routes/emailRules.js';
import autoReplyRoutes from './routes/autoReply.js';
import templatesRoutes from './routes/templates.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'https://mail.htresearchlab.com'],
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Circuvent Mail Server'
  });
});

// API Routes
app.use('/api/emails', emailRoutes);
app.use('/api/users', userRoutes);
app.use('/api/email-rules', emailRulesRoutes);
app.use('/api/auto-reply', autoReplyRoutes);
app.use('/api/templates', templatesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 Circuvent Mail API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Start SMTP server
const smtpServer = new CircuventSMTPServer();
smtpServer.start(2525);

// Start IMAP email fetching (check every 2 minutes)
if (process.env.IMAP_HOST && process.env.IMAP_USER) {
  console.log('📡 Starting IMAP email sync...');
  imapService.startPeriodicFetch(2);
} else {
  console.log('⚠️ IMAP not configured, skipping email sync');
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  smtpServer.stop();
  imapService.stopPeriodicFetch();
  imapService.disconnect();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  smtpServer.stop();
  imapService.stopPeriodicFetch();
  imapService.disconnect();
  process.exit(0);
});

export default app;
