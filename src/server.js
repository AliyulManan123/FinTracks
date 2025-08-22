import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import passport from 'passport';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import './config/passport.js';
import { ensureAuthenticated } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import pageRoutes from './routes/pages.js';
import transactionRoutes from './routes/transactions.js';
import planningRoutes from './routes/planning.js';
import investmentRoutes from './routes/investments.js';
import debtRoutes from './routes/debts.js';
import reportRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';

import apiChartRoutes from './routes/api/charts.js';
import apiTransactionRoutes from './routes/api/transactions.js';
import apiReportRoutes from './routes/api/reports.js';

const app = express();
const prisma = new PrismaClient();
const PgSession = pgSession(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// Trust proxy (for secure cookies behind reverse proxies)
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net/npm/chart.js"
      ],
      "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'"]
    }
  }
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(cookieParser());

// Views
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

// Static
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Session store
app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'af.sid',
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// CSRF
app.use(csrf());

// Set locals for CSRF and user
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.currentUser = req.user || null;
  res.locals.baseUrl = process.env.BASE_URL || '';
  next();
});

// Routes - auth (public)
app.use('/auth', authRoutes);

// Routes - pages (protected)
app.use('/', ensureAuthenticated, pageRoutes);
app.use('/transactions', ensureAuthenticated, transactionRoutes);
app.use('/planning', ensureAuthenticated, planningRoutes);
app.use('/investments', ensureAuthenticated, investmentRoutes);
app.use('/debts', ensureAuthenticated, debtRoutes);
app.use('/reports', ensureAuthenticated, reportRoutes);
app.use('/settings', ensureAuthenticated, settingsRoutes);

// API routes (protected, data-only)
app.use('/api/charts', ensureAuthenticated, apiChartRoutes);
app.use('/api/transactions', ensureAuthenticated, apiTransactionRoutes);
app.use('/api/reports', ensureAuthenticated, apiReportRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('errors/403', { title: 'Invalid CSRF token' });
  }
  console.error(err);
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  res.status(500).render('errors/500', { title: 'Server Error', error: process.env.NODE_ENV === 'development' ? err.message : null });
});

app.listen(PORT, () => {
  console.log(`Apex Finance running at http://localhost:${PORT}`);
});

export default app;
