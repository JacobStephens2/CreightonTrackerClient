import { authService } from '../services/auth-service';
import { router } from '../router';

export function renderVerifyEmailView(container: HTMLElement, token: string): void {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'max-width:400px;margin:40px auto';

  const card = document.createElement('div');
  card.className = 'card';

  const heading = document.createElement('div');
  heading.className = 'section-label';
  heading.style.marginTop = '0';
  heading.textContent = 'Email Verification';
  card.appendChild(heading);

  const status = document.createElement('p');
  status.style.cssText = 'font-size:0.875rem;color:var(--text-secondary)';
  status.textContent = 'Verifying your email...';
  card.appendChild(status);

  wrapper.appendChild(card);
  container.appendChild(wrapper);

  // Auto-verify on load
  authService.verifyEmail(token).then(() => {
    status.style.color = 'var(--accent)';
    status.textContent = 'Email verified successfully! Redirecting...';
    setTimeout(() => router.navigate('/settings'), 1500);
  }).catch((e: Error) => {
    status.style.color = '#d32f2f';
    status.textContent = e.message;
  });
}
