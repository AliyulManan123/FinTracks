(async function () {
  try {
    const res = await fetch('/api/charts/expense-breakdown');
    const data = await res.json();

    const ctx = document.getElementById('expenseDonut').getContext('2d');
    const colors = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#22d3ee','#84cc16'];
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.values,
          backgroundColor: data.labels.map((_, i) => colors[i % colors.length]),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  } catch (e) {
    console.error('Failed to render chart', e);
  }
})();
