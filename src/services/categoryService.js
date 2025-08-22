import prisma from '../prisma.js';

export default {
  async listCategories(userId, includeSubs = false) {
    if (includeSubs) {
      return prisma.category.findMany({
        where: { userId },
        include: { subCategories: true },
        orderBy: { name: 'asc' }
      });
    }
    return prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });
  },

  async createCategory(userId, { name }) {
    name = (name || '').trim();
    if (!name) throw new Error('Name required');
    return prisma.category.create({ data: { userId, name } });
  },

  async createSubCategory(userId, { categoryId, name }) {
    name = (name || '').trim();
    if (!name) throw new Error('Name required');
    return prisma.subCategory.create({ data: { userId, categoryId, name } });
  },

  async deleteCategory(userId, categoryId) {
    const cat = await prisma.category.findFirst({ where: { id: categoryId, userId } });
    if (!cat) throw new Error('Not found');
    await prisma.category.delete({ where: { id: categoryId } });
  }
};
