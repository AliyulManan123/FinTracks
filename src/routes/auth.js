import { Router } from 'express';
import passport from 'passport';
import { renderLogin, renderRegister, postLogin, postRegister, logout } from '../controllers/authController.js';
import { ensureAuthenticated } from '../middleware/auth.js';

const router = Router();

// Local
router.get('/login', renderLogin);
router.post('/login', postLogin);
router.get('/register', renderRegister);
router.post('/register', postRegister);
router.post('/logout', ensureAuthenticated, logout);

// Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login' }),
  (req, res) => res.redirect('/dashboard')
);

// GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth/login' }),
  (req, res) => res.redirect('/dashboard')
);

export default router;
