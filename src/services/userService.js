import bcrypt from 'bcryptjs';
import validator from 'validator';
import prisma from '../prisma.js';

function sanitizeString(s) {
  return (s || '').trim();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export default {
  async register({ email, name, password }) {
    email = sanitizeString(email).toLowerCase();
    name = sanitizeString(name);
    assert(validator.isEmail(email), 'Invalid email');
    assert(validator.isLength(name, { min: 2, max: 64 }), 'Name must be 2-64 chars');
    assert(validator.isLength(password || '', { min: 8 }), 'Password must be at least 8 chars');

    const exists = await prisma.user.findUnique({ where: { email } });
    assert(!exists, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, provider: 'local' }
    });

    // Create a default account and category set
    await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Cash',
        type: 'CASH',
        currency: 'IDR',
        balance: 0
      }
    });

    await prisma.category.create({
      data: { userId: user.id, name: 'Uncategorized' }
    });

    return user;
  },

  async updateProfile(userId, { name, avatarUrl }) {
    name = sanitizeString(name);
    assert(validator.isLength(name, { min: 2, max: 64 }), 'Invalid name');
    if (avatarUrl) assert(validator.isURL(avatarUrl, { require_protocol: true }), 'Invalid avatar URL');

    return prisma.user.update({
      where: { id: userId },
      data: { name, avatarUrl }
    });
  },

  async updatePassword(userId, { currentPassword, newPassword }) {
    assert(validator.isLength(newPassword || '', { min: 8 }), 'New password too short');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) throw new Error('Password change not available for OAuth users');
    const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
    assert(ok, 'Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
};
