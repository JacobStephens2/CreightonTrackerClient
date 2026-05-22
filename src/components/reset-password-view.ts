import { authService } from '../services/auth-service';
import { router } from '../router';

export function renderResetPasswordView(container: HTMLElement, token: string): void {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'max-width:400px;margin:40px auto';

  const card = document.createElement('div');
  card.className = 'card';

  const heading = document.createElement('div');
  heading.className = 'section-label';
  heading.style.marginTop = '0';
  heading.textContent = 'Set New Password';
  card.appendChild(heading);

  const form = document.createElement('div');
  form.style.cssText = 'display:flex;flex-direction:column;gap:8px';

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.placeholder = 'New password (min 8 characters)';
  passwordInput.autocomplete = 'new-password';
  form.appendChild(passwordInput);

  const confirmInput = document.createElement('input');
  confirmInput.type = 'password';
  confirmInput.placeholder = 'Confirm new password';
  confirmInput.autocomplete = 'new-password';
  form.appendChild(confirmInput);

  const errorMsg = document.createElement('p');
  errorMsg.style.cssText = 'font-size:0.8125rem;color:#d32f2f;margin:0;display:none';
  form.appendChild(errorMsg);

  const successMsg = document.createElement('p');
  successMsg.style.cssText = 'font-size:0.8125rem;color:var(--accent);margin:0;display:none';
  form.appendChild(successMsg);

  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary btn-block';
  submitBtn.textContent = 'Reset Password';
  submitBtn.addEventListener('click', async () => {
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';

    if (passwordInput.value.length < 8) {
      errorMsg.textContent = 'Password must be at least 8 characters';
      errorMsg.style.display = 'block';
      return;
    }
    if (passwordInput.value !== confirmInput.value) {
      errorMsg.textContent = 'Passwords do not match';
      errorMsg.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Resetting...';
    try {
      await authService.resetPassword(token, passwordInput.value);
      successMsg.textContent = 'Password reset successfully! Redirecting...';
      successMsg.style.display = 'block';
      setTimeout(() => router.navigate('/settings'), 1500);
    } catch (e) {
      errorMsg.textContent = (e as Error).message;
      errorMsg.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Reset Password';
    }
  });
  form.appendChild(submitBtn);

  card.appendChild(form);
  wrapper.appendChild(card);
  container.appendChild(wrapper);
}
