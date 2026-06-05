import './styles/global.css';
import './styles/stamps.css';
import './styles/chart.css';
import './styles/form.css';
import { renderSharedChartView } from './components/shared-chart-view';
import { cryptoService } from './services/crypto-service';

function invalid(app: HTMLElement, title: string, msg: string): void {
  app.innerHTML = `<div class="empty-state"><h2>${title}</h2><p>${msg}</p></div>`;
}

async function main(): Promise<void> {
  const app = document.getElementById('app')!;

  // Token is in the path (/shared/<token>); the decryption key is in the
  // fragment (#<key>) and never reaches the server.
  const pathParts = window.location.pathname.split('/');
  const token = pathParts[pathParts.length - 1];
  const shareKey = window.location.hash.replace(/^#/, '');

  if (!token) {
    invalid(app, 'Invalid Link', 'This share link is not valid.');
    return;
  }
  if (!shareKey) {
    invalid(app, 'Incomplete Link', 'This link is missing its decryption key. Please ask for a fresh share link.');
    return;
  }

  app.innerHTML = '<div class="empty-state"><p>Loading chart...</p></div>';

  try {
    const res = await fetch(`/api/share/view/${token}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      invalid(app, 'Not Available', data.error || 'This share link is invalid or has been revoked.');
      return;
    }

    const payload = await res.json();
    if (!payload.shareData) {
      invalid(app, 'Not Available', 'No shared data yet. Ask the user to sync, then request a fresh link.');
      return;
    }

    let plaintext: string;
    try {
      plaintext = await cryptoService.decryptWithKey(payload.shareData, shareKey);
    } catch {
      invalid(app, 'Link No Longer Valid', 'This share link could not be decrypted. Please ask for a new one.');
      return;
    }

    const data = JSON.parse(plaintext);
    data.updatedAt = payload.updatedAt;
    app.innerHTML = '';
    renderSharedChartView(app, data);
  } catch {
    invalid(app, 'Error', 'Failed to load the shared chart. Please try again later.');
  }
}

main();
