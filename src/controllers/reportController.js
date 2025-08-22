import reportService from '../services/reportService.js';

export async function renderReports(req, res) {
  try {
    const userId = req.user.id;
    const overview = await reportService.overview(userId);
    res.render('reports/index', {
      title: 'Reports',
      overview
    });
  } catch (e) {
    console.error(e);
    res.status(500).render('errors/500', { title: 'Server Error' });
  }
}

export async function exportReport(req, res) {
  try {
    const userId = req.user.id;
    const { format = 'pdf', from, to } = req.query;
    const { buffer, filename, contentType } = await reportService.export(userId, { format, from, to });
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(buffer);
  } catch (e) {
    console.error(e);
    res.status(400).render('reports/index', { title: 'Reports', error: e.message, overview: null });
  }
}
