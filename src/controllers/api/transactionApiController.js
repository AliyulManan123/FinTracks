import transactionService from '../../services/transactionService.js';

export async function apiCreateTransaction(req, res) {
  try {
    const userId = req.user.id;
    const created = await transactionService.create(userId, req.body);
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
}

export async function apiUpdateTransaction(req, res) {
  try {
    const userId = req.user.id;
    const updated = await transactionService.update(userId, req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
}

export async function apiDeleteTransaction(req, res) {
  try {
    const userId = req.user.id;
    await transactionService.remove(userId, req.params.id);
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
}

export async function apiGetTransaction(req, res) {
  try {
    const userId = req.user.id;
    const tx = await transactionService.getById(userId, req.params.id);
    res.json(tx);
  } catch (e) {
    console.error(e);
    res.status(404).json({ error: 'Not found' });
  }
}
