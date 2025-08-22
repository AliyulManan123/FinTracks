import reportService from '../../services/reportService.js';

export async function apiExport(req, res) {
  try {
    const userId = req.user.id;
    const { format = 'pdf', from, to } = req.query;
    const { buffer, filename, contentType } = await reportService.export(userId, { format, from, to });
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(buffer);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
}
