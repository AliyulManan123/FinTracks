import userService from '../services/userService.js';
import categoryService from '../services/categoryService.js';

export async function renderSettings(req, res) {
  try {
    const userId = req.user.id;
    const categories = await categoryService.listCategories(userId, true);
    res.render('settings/index', {
      title: 'Settings',
      user: req.user,
      categories
    });
  } catch (e) {
    console.error(e);
    res.status(500).render('errors/500', { title: 'Server Error' });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    await userService.updateProfile(userId, { name: req.body.name, avatarUrl: req.body.avatarUrl });
    res.redirect('/settings');
  } catch (e) {
    console.error(e);
    res.status(400).render('settings/index', { title: 'Settings', error: e.message, user: req.user });
  }
}

export async function updateSecurity(req, res) {
  try {
    const userId = req.user.id;
    await userService.updatePassword(userId, { currentPassword: req.body.currentPassword, newPassword: req.body.newPassword });
    res.redirect('/settings');
  } catch (e) {
    console.error(e);
    res.status(400).render('settings/index', { title: 'Settings', error: e.message, user: req.user });
  }
}

export async function manageCategories(req, res) {
  try {
    const userId = req.user.id;
    const action = req.body.action;
    if (action === 'create') {
      await categoryService.createCategory(userId, { name: req.body.name });
    } else if (action === 'createSub') {
      await categoryService.createSubCategory(userId, { categoryId: req.body.categoryId, name: req.body.name });
    } else if (action === 'delete') {
      await categoryService.deleteCategory(userId, req.body.categoryId);
    }
    res.redirect('/settings');
  } catch (e) {
    console.error(e);
    res.status(400).redirect('/settings');
  }
}
