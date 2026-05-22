import './styles/global.css';
import './styles/stamps.css';
import './styles/chart.css';
import { renderSharedChartView } from './components/shared-chart-view';

async function main(): Promise<void> {
  const app = document.getElementById('app')!;

  // Extract token from URL path: /shared/<token>
  const pathParts = window.location.pathname.split('/');
  const token = pathParts[pathParts.length - 1];

  if (!token) {
    app.innerHTML = '<div class="empty-state"><h2>Invalid Link</h2><p>This share link is not valid.</p></div>';
    return;
  }

  // Show loading state
  app.innerHTML = '<div class="empty-state"><p>Loading chart...</p></div>';

  try {
    const res = await fetch(`/api/share/view/${token}`);
    if (!res.ok) {
      const data = await res.json();
      app.innerHTML = `<div class="empty-state"><h2>Not Available</h2><p>${data.error || 'This share link is invalid or has been revoked.'}</p></div>`;
      return;
    }

    const data = await res.json();
    app.innerHTML = '';
    renderSharedChartView(app, data);
  } catch {
    app.innerHTML = '<div class="empty-state"><h2>Error</h2><p>Failed to load the shared chart. Please try again later.</p></div>';
  }
}

main();
