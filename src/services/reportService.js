import prisma from '../prisma.js';
import dayjs from 'dayjs';
import PDFDocument from 'pdfkit';
import { createObjectCsvStringifier } from 'csv-writer';

export default {
  async overview(userId) {
    const from = dayjs().startOf('month').toDate();
    const to = dayjs().endOf('month').toDate();

    const [income, expense] = await Promise.all([
      prisma.transaction.aggregate({ where: { userId, type: 'INCOME', date: { gte: from, lte: to } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { userId, type: 'EXPENSE', date: { gte: from, lte: to } }, _sum: { amount: true } })
    ]);

    return {
      from,
      to,
      income: Number(income._sum.amount || 0),
      expense: Number(expense._sum.amount || 0),
      savings: Number(income._sum.amount || 0) - Number(expense._sum.amount || 0)
    };
  },

  async export(userId, { format = 'pdf', from, to }) {
    const dateFrom = from ? new Date(from) : dayjs().startOf('month').toDate();
    const dateTo = to ? new Date(to) : dayjs().endOf('month').toDate();

    const txs = await prisma.transaction.findMany({
      where: { userId, date: { gte: dateFrom, lte: dateTo } },
      orderBy: { date: 'asc' },
      include: { category: true, account: true }
    });

    if (format === 'csv') {
      const csv = createObjectCsvStringifier({
        header: [
          { id: 'date', title: 'Date' },
          { id: 'account', title: 'Account' },
          { id: 'type', title: 'Type' },
          { id: 'category', title: 'Category' },
          { id: 'amount', title: 'Amount' },
          { id: 'description', title: 'Description' },
          { id: 'tags', title: 'Tags' }
        ]
      });
      const records = txs.map(t => ({
        date: t.date.toISOString(),
        account: t.account.name,
        type: t.type,
        category: t.category?.name || 'Uncategorized',
        amount: Number(t.amount).toFixed(2),
        description: t.description || '',
        tags: (t.tags || []).join('|')
      }));
      const header = csv.getHeaderString();
      const body = csv.stringifyRecords(records);
      const buffer = Buffer.from(header + body, 'utf8');
      return { buffer, filename: `apex-report-${dayjs(dateFrom).format('YYYYMMDD')}-${dayjs(dateTo).format('YYYYMMDD')}.csv`, contentType: 'text/csv' };
    }

    // PDF
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => {});

    doc.fontSize(18).text('Apex Finance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${dayjs(dateFrom).format('YYYY-MM-DD')} to ${dayjs(dateTo).format('YYYY-MM-DD')}`);
    doc.moveDown();

    txs.forEach(t => {
      doc.fontSize(10).text(
        `${dayjs(t.date).format('YYYY-MM-DD')} | ${t.account.name} | ${t.type} | ${(t.category?.name) || 'Uncategorized'} | ${Number(t.amount).toFixed(2)} | ${t.description || ''}`
      );
    });

    doc.end();
    const buffer = await new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    return { buffer, filename: `apex-report-${dayjs(dateFrom).format('YYYYMMDD')}-${dayjs(dateTo).format('YYYYMMDD')}.pdf`, contentType: 'application/pdf' };
  }
};
