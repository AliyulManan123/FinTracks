import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (e) {
    done(e, null);
  }
});

passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return done(null, false, { message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return done(null, false, { message: 'Invalid credentials' });
      return done(null, user);
    } catch (e) {
      return done(e);
    }
  }
));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const existing = await prisma.user.findUnique({ where: { providerId: profile.id } });
      if (existing) return done(null, existing);
      const email = profile.emails?.[0]?.value || `${profile.id}@google.local`;
      const user = await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name: profile.displayName || 'Google User',
          avatarUrl: profile.photos?.[0]?.value,
          provider: 'google',
          providerId: profile.id
        },
        update: {
          provider: 'google',
          providerId: profile.id,
          avatarUrl: profile.photos?.[0]?.value
        }
      });
      return done(null, user);
    } catch (e) {
      return done(e, null);
    }
  }));
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const existing = await prisma.user.findUnique({ where: { providerId: profile.id } });
      if (existing) return done(null, existing);
      const email = profile.emails?.find(e => e.verified)?.value || `${profile.username}@github.local`;
      const user = await prisma.user.upsert({
        where: { email },
        create: {
          email,
          name: profile.displayName || profile.username || 'GitHub User',
          avatarUrl: profile.photos?.[0]?.value,
          provider: 'github',
          providerId: profile.id
        },
        update: {
          provider: 'github',
          providerId: profile.id,
          avatarUrl: profile.photos?.[0]?.value
        }
      });
      return done(null, user);
    } catch (e) {
      return done(e, null);
    }
  }));
}

export default passport;
