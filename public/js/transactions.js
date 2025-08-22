const modal = document.getElementById('modal');
const btnOpenAdd = document.getElementById('btnOpenAdd');
const btnCancel = document.getElementById('btnCancel');
const txForm = document.getElementById('txForm');
const title = document.getElementById('modalTitle');

function openModal() { modal.classList.remove('hidden'); modal.classList.add('flex'); }
function closeModal() { modal.classList.add('hidden'); modal.classList.remove('flex'); }

btnOpenAdd.addEventListener('click', () => {
  title.textContent = 'Add Transaction';
  txForm.reset();
  openModal();
});

btnCancel.addEventListener('click', closeModal);

document.querySelectorAll('.btnEdit').forEach(btn => {
  btn.addEventListener('click', async () => {
    const id = btn.dataset.id;
    const res = await fetch(`/api/transactions/${id}`);
    const t = await res.json();
    title.textContent = 'Edit Transaction';
    txForm.elements['id'].value = t.id;
    txForm.elements['accountId'].value = t.accountId;
    txForm.elements['type'].value = t.type;
    txForm.elements['amount'].value = t.amount;
    txForm.elements['date'].value = t.date.slice(0,10);
    txForm.elements['categoryId'].value = t.categoryId || '';
    txForm.elements['subCategoryId'].value = t.subCategoryId || '';
    txForm.elements['description'].value = t.description || '';
    txForm.elements['tags'].value = (t.tags || []).join(', ');
    openModal();
  });
});

document.querySelectorAll('.btnDelete').forEach(btn => {
  btn.addEventListener('click', async () => {
    if (!confirm('Delete this transaction?')) return;
    const id = btn.dataset.id;
    const token = txForm.elements['_csrf'].value;
    const res = await fetch(`/api/transactions/${id}?_csrf=${encodeURIComponent(token)}`, { method: 'DELETE' });
    if (res.status === 204) location.reload();
    else alert('Failed to delete');
  });
});

txForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(txForm);
  const body = Object.fromEntries(formData.entries());
  const isEdit = Boolean(body.id);
  const token = body._csrf;
  const payload = {
    accountId: body.accountId,
    type: body.type,
    amount: body.amount,
    date: body.date,
    categoryId: body.categoryId || null,
    subCategoryId: body.subCategoryId || null,
    description: body.description,
    tags: body.tags
  };

  const url = isEdit ? `/api/transactions/${body.id}?_csrf=${encodeURIComponent(token)}` : `/api/transactions?_csrf=${encodeURIComponent(token)}`;
  const method = isEdit ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeModal();
    location.reload();
  } else {
    const { error } = await res.json();
    alert(error || 'Failed to save');
  }
});
