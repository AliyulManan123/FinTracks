import prisma from '../prisma.js';
import dayjs from 'dayjs';
import validator from 'validator';

function parseSort(sort) {
  const [field = 'date', dir = 'desc'] = (sort || 'date.desc').split('.');
  const sortable = ['date', 'amount', 'type'];
  return { field: sortable.includes(field) ? field : 'date', dir: dir === 'asc' ? 'asc' : 'desc' };
}

function toDecimal(n) {
  if (typeof n === 'string') n = n.replace(/,/g, '');
  const num = Number(n);
  if (Number.isNaN(num)) throw new Error('Invalid amount');
  return num;
}

export default {
  async paginatedList(userId, { page = 1, pageSize = 10, category, type, sort, q }) {
    page = Number(page) || 1;
    pageSize = Math.min(100, Number(pageSize) || 10);
    const { field, dir } = parseSort(sort);

    const where = { userId };
    if (category) where['category'] = { name: { equals: category } };
    if (type) where['type'] = type;
    if (q) where['OR'] = [
      { description: { contains: q, mode: 'insensitive' } },
      { tags: { hasSome: q.split(' ').filter(Boolean) } }
    ];

    const [total, items] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: { category: true, subCategory: true, account: true },
        orderBy: { [field]: dir },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    return {
      page,
      pageSize,
      total,
      pages: Math.ceil(total / pageSize),
      items
    };
  },

  async getById(userId, id) {
    const tx = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true, subCategory: true, account: true }
    });
    if (!tx) throw new Error('Not found');
    return tx;
  },

  async create(userId, payload) {
    const {
      accountId,
      amount,
      type,
      description,
      date,
      categoryId,
      subCategoryId,
      tags
    } = payload;

    if (!['INCOME', 'EXPENSE', 'TRANSFER'].includes(type)) throw new Error('Invalid type');
    if (!accountId) throw new Error('Account required');
    const amt = toDecimal(amount);
    const when = date ? new Date(date) : new Date();
    const cleanTags = Array.isArray(tags)
      ? tags.map(t => (t || '').trim()).filter(Boolean)
      : (tags || '').split(',').map(t => t.trim()).filter(Boolean);

    const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) throw new Error('Account not found');

    const tx = await prisma.$transaction(async (db) => {
      const created = await db.transaction.create({
        data: {
          userId,
          accountId,
          amount: amt,
          type,
          description: (description || '').trim(),
          date: when,
          categoryId: categoryId || null,
          subCategoryId: subCategoryId || null,
          tags: cleanTags
        }
      });

      // Update account balance
      let delta = amt;
      if (type === 'EXPENSE') delta = -Math.abs(amt);
      if (type === 'INCOME') delta = Math.abs(amt);
      if (type === 'TRANSFER') delta = 0; // Simplified: single-account scope

      await db.account.update({
        where: { id: accountId },
        data: { balance: Number(account.balance) + delta }
      });

      return created;
    });

    return tx;
  },

  async update(userId, id, payload) {
    const tx = await this.getById(userId, id);

    const amt = payload.amount !== undefined ? toDecimal(payload.amount) : Number(tx.amount);
    const type = payload.type || tx.type;
    if (!['INCOME', 'EXPENSE', 'TRANSFER'].includes(type)) throw new Error('Invalid type');

    const accountId = payload.accountId || tx.accountId;
    const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!account) throw new Error('Account not found');

    // Rebalance: revert old, apply new
    await prisma.$transaction(async (db) => {
      // revert old
      let oldDelta = Number(tx.amount);
      if (tx.type === 'EXPENSE') oldDelta = -Math.abs(Number(tx.amount));
      if (tx.type === 'INCOME') oldDelta = Math.abs(Number(tx.amount));
      if (tx.type === 'TRANSFER') oldDelta = 0;
      await db.account.update({ where: { id: tx.accountId }, data: { balance: Number(account.balance) - oldDelta } });

      // apply new
      let newDelta = amt;
      if (type === 'EXPENSE') newDelta = -Math.abs(amt);
      if (type === 'INCOME') newDelta = Math.abs(amt);
      if (type === 'TRANSFER') newDelta = 0;
      await db.account.update({ where: { id: accountId }, data: { balance: Number(account.balance) + newDelta } });

      await db.transaction.update({
        where: { id },
        data: {
          accountId,
          amount: amt,
          type,
          description: (payload.description ?? tx.description) || '',
          date: payload.date ? new Date(payload.date) : tx.date,
          categoryId: payload.categoryId ?? tx.categoryId,
          subCategoryId: payload.subCategoryId ?? tx.subCategoryId,
          tags: Array.isArray(payload.tags)
            ? payload.tags
            : (payload.tags || '').split(',').map(t => t.trim()).filter(Boolean)
        }
      });
    });

    return this.getById(userId, id);
  },

  async remove(userId, id) {
    const tx = await this.getById(userId, id);

    await prisma.$transaction(async (db) => {
      // revert old
      const account = await db.account.findFirst({ where: { id: tx.accountId } });
      let delta = Number(tx.amount);
      if (tx.type === 'EXPENSE') delta = -Math.abs(Number(tx.amount));
      if (tx.type === 'INCOME') delta = Math.abs(Number(tx.amount));
      if (tx.type === 'TRANSFER') delta = 0;
      await db.account.update({ where: { id: tx.accountId }, data: { balance: Number(account.balance) - delta } });

      await db.transaction.delete({ where: { id } });
    });
  }
};
