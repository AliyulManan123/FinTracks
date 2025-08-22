import passport from 'passport';
import userService from '../services/userService.js';

export function renderLogin(req, res) {
  if (req.isAuthenticated && req.isAuthenticated()) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'Login' });
}

export function renderRegister(req, res) {
  if (req.isAuthenticated && req.isAuthenticated()) return res.redirect('/dashboard');
  res.render('auth/register', { title: 'Register' });
}

export function postLogin(req, res, next) {
  passport.authenticate('local', {
    failureRedirect: '/auth/login',
    failureFlash: false
  })(req, res, () => res.redirect('/dashboard'));
}

export async function postRegister(req, res) {
  try {
    await userService.register({
      email: req.body.email,
      name: req.body.name,
      password: req.body.password
    });
    // Auto-login after registration
    passport.authenticate('local', {
      failureRedirect: '/auth/login'
    })(req, res, () => res.redirect('/dashboard'));
  } catch (e) {
    console.error(e);
    res.status(400).render('auth/register', { title: 'Register', error: e.message });
  }
}

export function logout(req, res) {
  req.logout(err => {
    if (err) {
      console.error(err);
    }
    req.session.destroy(() => {
      res.clearCookie('af.sid');
      res.redirect('/auth/login');
    });
  });
}
