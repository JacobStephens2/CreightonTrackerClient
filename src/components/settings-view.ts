import { toPng } from 'html-to-image';
import { db } from '../db/database';
import { exportService } from '../services/export-service';
import { authService } from '../services/auth-service';
import { syncService } from '../services/sync-service';
import { shareService } from '../services/share-service';
import { feedbackService } from '../services/feedback-service';
import { showToast } from '../utils/toast';
import { applyTheme } from '../main';
import { renderChartView } from './chart-view';
import { today } from '../utils/date-utils';

let renderGeneration = 0;

export async function renderSettingsView(container: HTMLElement): Promise<void> {
  const thisRender = ++renderGeneration;
  container.innerHTML = '';

  const settings = (await db.settings.get(1)) ?? { id: 1, defaultView: 'chart' as const };
  if (thisRender !== renderGeneration) return;
  await authService.checkAuth();
  if (thisRender !== renderGeneration) return;

  const wrapper = document.createElement('div');

  // Account & Sync card
  const accountCard = document.createElement('div');
  accountCard.className = 'card';
  accountCard.innerHTML = '<div class="section-label" style="margin-top:0">Account & Sync</div>';

  if (authService.state.loggedIn) {
    const lastSync = syncService.getLastSyncTime();
    const lastSyncText = lastSync ? new Date(lastSync).toLocaleString() : 'Never';

    const info = document.createElement('div');
    info.style.cssText = 'margin-bottom:12px';

    const nameRow = document.createElement('div');
    nameRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = authService.state.firstName || '';
    nameInput.placeholder = 'First name';
    nameInput.style.cssText = 'font-size:0.875rem;flex:1;padding:4px 8px';
    nameInput.setAttribute('aria-label', 'First name');
    let nameTimeout: ReturnType<typeof setTimeout>;
    nameInput.addEventListener('input', () => {
      clearTimeout(nameTimeout);
      nameTimeout = setTimeout(async () => {
        if (nameInput.value.trim()) {
          await authService.updateName(nameInput.value.trim()).catch(() => showToast('Could not save name', 'error'));
        }
      }, 500);
    });
    nameRow.appendChild(nameInput);
    info.appendChild(nameRow);

    const emailP = document.createElement('p');
    emailP.style.cssText = 'font-size:0.8125rem;color:var(--text-secondary);margin:0';
    emailP.textContent = authService.state.email || '';
    info.appendChild(emailP);

    const syncP = document.createElement('p');
    syncP.style.cssText = 'font-size:0.8125rem;color:var(--text-secondary);margin:4px 0 0';
    syncP.textContent = `Last synced: ${lastSyncText}`;
    info.appendChild(syncP);

    accountCard.appendChild(info);

    // Email verification banner
    if (!authService.state.emailVerified) {
      const banner = document.createElement('div');
      banner.style.cssText = 'background:#FFF3E0;border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap';
      const bannerText = document.createElement('span');
      bannerText.style.cssText = 'font-size:0.8125rem;color:#E65100;flex:1';
      bannerText.textContent = 'Email not verified. Check your inbox for a verification link.';
      banner.appendChild(bannerText);
      const resendBtn = document.createElement('button');
      resendBtn.style.cssText = 'background:none;border:none;color:#E65100;font-size:0.8125rem;cursor:pointer;text-decoration:underline;font-family:inherit;padding:0;white-space:nowrap';
      resendBtn.textContent = 'Resend';
      resendBtn.addEventListener('click', async () => {
        resendBtn.textContent = 'Sending...';
        resendBtn.style.pointerEvents = 'none';
        try {
          await authService.resendVerification();
          resendBtn.textContent = 'Sent!';
        } catch {
          resendBtn.textContent = 'Failed. Try again.';
          resendBtn.style.pointerEvents = '';
        }
      });
      banner.appendChild(resendBtn);
      accountCard.appendChild(banner);
    }

    const syncBtns = document.createElement('div');
    syncBtns.style.cssText = 'display:flex;flex-direction:column;gap:8px';

    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'btn btn-secondary btn-block';
    uploadBtn.textContent = 'Upload to Server';
    uploadBtn.addEventListener('click', async () => {
      uploadBtn.disabled = true;
      uploadBtn.classList.add('btn-loading');
      try {
        await syncService.upload();
        showToast('Synced successfully', 'success');
        renderSettingsView(container);
      } catch (e) {
        showToast((e as Error).message, 'error');
        uploadBtn.disabled = false;
        uploadBtn.classList.remove('btn-loading');
      }
    });
    syncBtns.appendChild(uploadBtn);

    const uploadHint = document.createElement('p');
    uploadHint.style.cssText = 'font-size:0.75rem;color:var(--text-secondary);margin:-4px 0 4px;padding:0 4px';
    uploadHint.textContent = 'Saves this device\u2019s data to the server, replacing what\u2019s stored there.';
    syncBtns.appendChild(uploadHint);

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-secondary btn-block';
    downloadBtn.textContent = 'Download from Server';
    downloadBtn.addEventListener('click', async () => {
      if (!confirm('This will replace all local data with the server copy. Continue?')) return;
      downloadBtn.disabled = true;
      downloadBtn.classList.add('btn-loading');
      try {
        const result = await syncService.download();
        showToast(`Downloaded ${result.cycles} cycles and ${result.observations} observations`, 'success');
        renderSettingsView(container);
      } catch (e) {
        showToast((e as Error).message, 'error');
        downloadBtn.disabled = false;
        downloadBtn.classList.remove('btn-loading');
      }
    });
    syncBtns.appendChild(downloadBtn);

    const downloadHint = document.createElement('p');
    downloadHint.style.cssText = 'font-size:0.75rem;color:var(--text-secondary);margin:-4px 0 4px;padding:0 4px';
    downloadHint.textContent = 'Replaces this device\u2019s data with what\u2019s on the server.';
    syncBtns.appendChild(downloadHint);

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn btn-secondary btn-block';
    logoutBtn.textContent = 'Sign Out';
    logoutBtn.addEventListener('click', async () => {
      await authService.logout();
      renderSettingsView(container);
    });
    syncBtns.appendChild(logoutBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-block';
    deleteBtn.textContent = 'Delete Account';
    deleteBtn.addEventListener('click', () => showDeleteAccountModal(container));
    syncBtns.appendChild(deleteBtn);

    accountCard.appendChild(syncBtns);
  } else {
    const desc = document.createElement('p');
    desc.style.cssText = 'font-size:0.8125rem;color:var(--text-secondary);margin-bottom:12px';
    desc.textContent = 'Sign in to back up your data to the server and access it across devices. Your data always stays on your device too.';
    accountCard.appendChild(desc);

    const form = document.createElement('div');
    form.style.cssText = 'display:flex;flex-direction:column;gap:8px';

    let createAccountMode = false;

    const nameField = document.createElement('div');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'First name';
    nameInput.autocomplete = 'given-name';
    nameInput.setAttribute('aria-label', 'First name');
    nameField.appendChild(nameInput);

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Email';
    emailInput.autocomplete = 'email';
    emailInput.setAttribute('aria-label', 'Email');
    form.appendChild(emailInput);

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Password (min 8 characters)';
    passwordInput.autocomplete = 'current-password';
    passwordInput.setAttribute('aria-label', 'Password');
    form.appendChild(wrapPasswordToggle(passwordInput));

    const confirmField = document.createElement('div');
    const confirmInput = document.createElement('input');
    confirmInput.type = 'password';
    confirmInput.placeholder = 'Confirm password';
    confirmInput.autocomplete = 'new-password';
    confirmInput.setAttribute('aria-label', 'Confirm password');
    confirmField.appendChild(wrapPasswordToggle(confirmInput));

    const errorMsg = document.createElement('p');
    errorMsg.style.cssText = 'font-size:0.8125rem;color:#d32f2f;margin:0;display:none';
    form.appendChild(errorMsg);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px';

    const loginBtn = document.createElement('button');
    loginBtn.className = 'btn btn-primary';
    loginBtn.style.flex = '1';
    loginBtn.textContent = 'Sign In';
    loginBtn.addEventListener('click', async () => {
      createAccountMode = false;
      nameField.remove();
      confirmField.remove();
      errorMsg.style.display = 'none';
      errorMsg.style.color = '#d32f2f';
      loginBtn.disabled = true;
      loginBtn.classList.add('btn-loading');
      const emailValue = emailInput.value.trim();
      const passwordValue = passwordInput.value;
      if (!emailValue || !passwordValue) {
        errorMsg.textContent = 'Email and password are required';
        errorMsg.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.classList.remove('btn-loading');
        return;
      }
      try {
        await authService.login(emailValue.toLowerCase(), passwordValue);
        renderSettingsView(container);
      } catch (e) {
        errorMsg.textContent = (e as Error).message;
        errorMsg.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.classList.remove('btn-loading');
      }
    });
    btnRow.appendChild(loginBtn);

    const registerBtn = document.createElement('button');
    registerBtn.className = 'btn btn-secondary';
    registerBtn.style.flex = '1';
    registerBtn.textContent = 'Create Account';
    registerBtn.addEventListener('click', async () => {
      if (!createAccountMode) {
        createAccountMode = true;
        form.insertBefore(nameField, emailInput);
        passwordInput.insertAdjacentElement('afterend', confirmField);
        passwordInput.autocomplete = 'new-password';
        errorMsg.style.display = 'none';
        requestAnimationFrame(() => nameInput.focus());
        return;
      }

      errorMsg.style.display = 'none';
      errorMsg.style.color = '#d32f2f';
      if (!nameInput.value.trim()) {
        errorMsg.textContent = 'Enter your first name to create an account';
        errorMsg.style.display = 'block';
        return;
      }
      if (passwordInput.value !== confirmInput.value) {
        errorMsg.textContent = 'Passwords do not match';
        errorMsg.style.display = 'block';
        return;
      }
      registerBtn.disabled = true;
      registerBtn.classList.add('btn-loading');
      try {
        await authService.register(nameInput.value.trim(), emailInput.value, passwordInput.value);
        renderSettingsView(container);
      } catch (e) {
        errorMsg.textContent = (e as Error).message;
        errorMsg.style.display = 'block';
        registerBtn.disabled = false;
        registerBtn.classList.remove('btn-loading');
      }
    });
    btnRow.appendChild(registerBtn);

    form.appendChild(btnRow);

    // Forgot password link
    const forgotRow = document.createElement('div');
    forgotRow.style.cssText = 'text-align:center;margin-top:4px';

    const forgotLink = document.createElement('button');
    forgotLink.style.cssText = 'background:none;border:none;color:var(--accent);font-size:0.8125rem;cursor:pointer;padding:4px;font-family:inherit;text-decoration:underline';
    forgotLink.textContent = 'Forgot password?';
    forgotLink.addEventListener('click', async () => {
      const email = emailInput.value;
      if (!email) {
        errorMsg.textContent = 'Enter your email address first';
        errorMsg.style.display = 'block';
        return;
      }
      errorMsg.style.display = 'none';
      forgotLink.textContent = 'Sending...';
      forgotLink.style.pointerEvents = 'none';
      try {
        await authService.forgotPassword(email);
        errorMsg.style.color = 'var(--accent)';
        errorMsg.textContent = 'If an account exists with that email, a reset link has been sent.';
        errorMsg.style.display = 'block';
      } catch {
        errorMsg.style.color = '#d32f2f';
        errorMsg.textContent = 'Could not send reset email. Try again later.';
        errorMsg.style.display = 'block';
      }
      forgotLink.textContent = 'Forgot password?';
      forgotLink.style.pointerEvents = '';
    });
    forgotRow.appendChild(forgotLink);
    form.appendChild(forgotRow);

    accountCard.appendChild(form);
  }

  wrapper.appendChild(accountCard);

  // Provider Sharing card (only when logged in)
  if (authService.state.loggedIn) {
    const shareCard = document.createElement('div');
    shareCard.className = 'card';
    shareCard.innerHTML = '<div class="section-label" style="margin-top:0">Provider Sharing</div>';

    const shareContent = document.createElement('div');
    shareContent.style.cssText = 'display:flex;flex-direction:column;gap:8px';

    try {
      const status = await shareService.getStatus();
      if (thisRender !== renderGeneration) return;

      if (status.active) {
        const info = document.createElement('p');
        info.style.cssText = 'font-size:0.8125rem;color:var(--text-secondary);margin:0';
        info.textContent = 'Your provider can view your charts at this link. They will see your last synced data.';
        shareContent.appendChild(info);

        if (status.expiresAt) {
          const expiryInfo = document.createElement('p');
          expiryInfo.style.cssText = 'font-size:0.75rem;color:var(--text-secondary);margin:4px 0 0';
          expiryInfo.textContent = `Link expires: ${new Date(status.expiresAt).toLocaleDateString()}`;
          shareContent.appendChild(expiryInfo);
        }

        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.readOnly = true;
        urlInput.value = status.url!;
        urlInput.style.cssText = 'font-size:0.8125rem';
        shareContent.appendChild(urlInput);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-primary btn-block';
        copyBtn.textContent = 'Copy Link';
        copyBtn.addEventListener('click', async () => {
          await navigator.clipboard.writeText(status.url!);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy Link'; }, 2000);
        });
        shareContent.appendChild(copyBtn);

        const revokeBtn = document.createElement('button');
        revokeBtn.className = 'btn btn-danger btn-block';
        revokeBtn.textContent = 'Revoke Link';
        revokeBtn.addEventListener('click', async () => {
          if (!confirm('Revoke this share link? Your provider will no longer be able to view your charts.')) return;
          await shareService.revoke();
          renderSettingsView(container);
        });
        shareContent.appendChild(revokeBtn);
      } else {
        const desc = document.createElement('p');
        desc.style.cssText = 'font-size:0.8125rem;color:var(--text-secondary);margin:0';
        desc.textContent = 'Generate a link to share your charts with your FertilityCare Practitioner. They will see a read-only view of your synced data.';
        shareContent.appendChild(desc);

        const generateBtn = document.createElement('button');
        generateBtn.className = 'btn btn-primary btn-block';
        generateBtn.textContent = 'Generate Share Link';
        generateBtn.addEventListener('click', async () => {
          generateBtn.disabled = true;
          generateBtn.classList.add('btn-loading');
          try {
            await shareService.generate();
            renderSettingsView(container);
          } catch (e) {
            showToast((e as Error).message, 'error');
            generateBtn.disabled = false;
            generateBtn.classList.remove('btn-loading');
          }
        });
        shareContent.appendChild(generateBtn);
      }
    } catch {
      const err = document.createElement('p');
      err.style.cssText = 'font-size:0.8125rem;color:#d32f2f;margin:0';
      err.textContent = 'Could not load sharing status.';
      shareContent.appendChild(err);
    }

    shareCard.appendChild(shareContent);
    wrapper.appendChild(shareCard);
  }

  // Default view
  const viewCard = document.createElement('div');
  viewCard.className = 'card';
  viewCard.innerHTML = '<div class="section-label" style="margin-top:0">Default View</div>';
  const viewGroup = document.createElement('div');
  viewGroup.className = 'toggle-group';

  for (const view of ['chart', 'calendar'] as const) {
    const btn = document.createElement('button');
    btn.className = `toggle-btn ${settings.defaultView === view ? 'active' : ''}`;
    btn.textContent = view === 'chart' ? 'Chart' : 'Calendar';
    btn.addEventListener('click', async () => {
      await db.settings.put({ ...settings, defaultView: view });
      renderSettingsView(container);
    });
    viewGroup.appendChild(btn);
  }
  viewCard.appendChild(viewGroup);
  wrapper.appendChild(viewCard);

  // Theme
  const themeCard = document.createElement('div');
  themeCard.className = 'card';
  themeCard.innerHTML = '<div class="section-label" style="margin-top:0">Theme</div>';
  const themeGroup = document.createElement('div');
  themeGroup.className = 'toggle-group';

  const currentTheme = settings.theme ?? 'system';
  for (const theme of ['system', 'light', 'dark'] as const) {
    const btn = document.createElement('button');
    btn.className = `toggle-btn ${currentTheme === theme ? 'active' : ''}`;
    btn.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    btn.addEventListener('click', async () => {
      await db.settings.put({ ...settings, theme });
      applyTheme(theme);
      renderSettingsView(container);
    });
    themeGroup.appendChild(btn);
  }
  themeCard.appendChild(themeGroup);
  wrapper.appendChild(themeCard);

  // Infertile pattern / Base Infertile Pattern description
  const bipCard = document.createElement('div');
  bipCard.className = 'card';
  bipCard.innerHTML = `
    <div class="section-label" style="margin-top:0">Infertile pattern</div>
    <p style="font-size:0.8125rem;color:var(--text-secondary);margin-bottom:8px">
      Describe your stable, unchanging baseline pattern as identified with your FertilityCare Practitioner.
      (Also known as your Base Infertile Pattern, or BIP.)
    </p>
  `;
  const bipInput = document.createElement('textarea');
  bipInput.value = settings.bipDescription ?? '';
  bipInput.placeholder = 'e.g., Dry, nothing to see or touch';
  bipInput.addEventListener('change', async () => {
    await db.settings.put({ ...settings, bipDescription: bipInput.value || undefined });
  });
  bipCard.appendChild(bipInput);
  wrapper.appendChild(bipCard);

  // Export / Import
  const dataCard = document.createElement('div');
  dataCard.className = 'card';
  dataCard.innerHTML = '<div class="section-label" style="margin-top:0">Data Management</div>';

  const btnGroup = document.createElement('div');
  btnGroup.style.cssText = 'display:flex;flex-direction:column;gap:8px';

  // Save Chart Image — renders chart off-screen and exports as PNG.
  // Uses navigator.share() for Capacitor/WebView compatibility, falls
  // back to <a download> for browsers.
  const saveImageBtn = document.createElement('button');
  saveImageBtn.className = 'btn btn-secondary btn-block';
  saveImageBtn.textContent = 'Save Chart Image';
  saveImageBtn.addEventListener('click', async () => {
    saveImageBtn.disabled = true;
    saveImageBtn.classList.add('btn-loading');
    try {
      // Render chart into a hidden off-screen container
      const offscreen = document.createElement('div');
      offscreen.style.cssText = 'position:absolute;left:-9999px;top:0;width:2000px';
      document.body.appendChild(offscreen);
      await renderChartView(offscreen);
      const chartEl = offscreen.querySelector('.chart-container') as HTMLElement | null;
      if (!chartEl) throw new Error('No chart to export');

      const dataUrl = await toPng(chartEl, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      document.body.removeChild(offscreen);

      const filename = `creighton-chart-${today()}.png`;

      // Try Web Share API (works in Capacitor WebView and mobile browsers)
      if (navigator.share && navigator.canShare) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] });
          showToast('Chart shared', 'success');
          return;
        }
      }

      // Fallback: download via anchor tag (works in desktop browsers)
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      link.click();
      showToast('Chart image saved', 'success');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to export chart image', err);
        showToast('Could not save image', 'error');
      }
    } finally {
      saveImageBtn.disabled = false;
      saveImageBtn.classList.remove('btn-loading');
    }
  });
  btnGroup.appendChild(saveImageBtn);

  // Print Chart — navigates to chart view then triggers the browser print dialog
  const printBtn = document.createElement('button');
  printBtn.className = 'btn btn-secondary btn-block';
  printBtn.textContent = 'Print Chart';
  printBtn.addEventListener('click', () => {
    window.location.hash = '/chart';
    // Wait for chart to render before printing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  });
  btnGroup.appendChild(printBtn);

  // Export JSON
  const exportJsonBtn = document.createElement('button');
  exportJsonBtn.className = 'btn btn-secondary btn-block';
  exportJsonBtn.textContent = 'Export Data (JSON)';
  exportJsonBtn.addEventListener('click', async () => {
    const json = await exportService.exportJSON();
    exportService.downloadFile(json, `creighton-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  });
  btnGroup.appendChild(exportJsonBtn);

  // Export CSV
  const exportCsvBtn = document.createElement('button');
  exportCsvBtn.className = 'btn btn-secondary btn-block';
  exportCsvBtn.textContent = 'Export Chart (CSV)';
  exportCsvBtn.addEventListener('click', async () => {
    const csv = await exportService.exportCSV();
    exportService.downloadFile(csv, `creighton-chart-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  });
  btnGroup.appendChild(exportCsvBtn);

  const downloadHint = document.createElement('p');
  downloadHint.style.cssText = 'font-size:0.75rem;color:var(--text-secondary);margin:-4px 0 4px;padding:0 4px';
  downloadHint.textContent = 'Exported files save to your Downloads folder.';
  btnGroup.appendChild(downloadHint);

  // Import JSON
  const importBtn = document.createElement('button');
  importBtn.className = 'btn btn-secondary btn-block';
  importBtn.textContent = 'Import Data (JSON)';
  importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const result = await exportService.importJSON(text);
        alert(`Imported ${result.cycles} cycles and ${result.observations} observations.`);
        renderSettingsView(container);
      } catch (e) {
        alert(`Import failed: ${(e as Error).message}`);
      }
    });
    input.click();
  });
  btnGroup.appendChild(importBtn);

  // Clear all data
  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn btn-danger btn-block';
  clearBtn.textContent = 'Clear All Data';
  clearBtn.addEventListener('click', async () => {
    if (confirm('Are you sure? This will permanently delete all your observations and cycles.')) {
      await db.observations.clear();
      await db.cycles.clear();
      alert('All data cleared.');
      renderSettingsView(container);
    }
  });
  btnGroup.appendChild(clearBtn);

  // Show Sample Data (only if not signed in and no observations)
  const obsCount = await db.observations.count();
  if (!authService.state.loggedIn && obsCount === 0) {
    const sampleBtn = document.createElement('button');
    sampleBtn.className = 'btn btn-secondary btn-block';
    sampleBtn.textContent = 'Show Sample Data';
    sampleBtn.addEventListener('click', () => {
      localStorage.removeItem('sampleDismissed');
      window.location.hash = '/chart';
    });
    btnGroup.appendChild(sampleBtn);
  }

  dataCard.appendChild(btnGroup);
  wrapper.appendChild(dataCard);

  // Feedback / bug reports / feature requests
  const feedbackCard = document.createElement('div');
  feedbackCard.className = 'card';
  const feedbackEmail = 'jacob@stephens.page';
  feedbackCard.innerHTML = `
    <div class="section-label" style="margin-top:0">Feedback &amp; Bug Reports</div>
    <p style="font-size:0.8125rem;color:var(--text-secondary);line-height:1.55;margin:0 0 12px">
      Found a bug, have a feature request, or want to share thoughts? Send a message — I read every one.
    </p>
    <button id="feedback-open-btn" class="btn btn-primary btn-block">Send Feedback</button>
    <p style="font-size:0.75rem;color:var(--text-secondary);text-align:center;margin:10px 0 0">
      Or email <a href="mailto:${feedbackEmail}" style="color:var(--accent)">${feedbackEmail}</a> directly.
      <button id="feedback-copy-btn" type="button" aria-label="Copy email address"
              style="margin-left:6px;padding:2px 8px;font-size:0.72rem;border:1px solid var(--border-color);background:var(--surface-low);color:var(--text-secondary);border-radius:999px;cursor:pointer">Copy</button>
    </p>
  `;
  wrapper.appendChild(feedbackCard);

  feedbackCard.querySelector<HTMLButtonElement>('#feedback-open-btn')!.addEventListener('click', () => {
    showFeedbackModal();
  });

  feedbackCard.querySelector<HTMLButtonElement>('#feedback-copy-btn')!.addEventListener('click', async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    try {
      await navigator.clipboard.writeText(feedbackEmail);
      const original = btn.textContent;
      btn.textContent = 'Copied';
      showToast('Email address copied', 'success');
      setTimeout(() => { btn.textContent = original; }, 1500);
    } catch {
      showToast(`Copy failed — the address is ${feedbackEmail}`, 'error');
    }
  });

  // Learn More links
  const linksCard = document.createElement('div');
  linksCard.className = 'card';
  linksCard.innerHTML = `
    <div class="section-label" style="margin-top:0">Learn More</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <a href="#/guide" class="btn btn-secondary btn-block" style="text-decoration:none;text-align:center">CrMS System Guide</a>
      <a href="https://www.fertilitycare.org/" target="_blank" rel="noopener" class="btn btn-secondary btn-block" style="text-decoration:none;text-align:center">FertilityCare.org</a>
      <a href="https://saintpaulvi.com/" target="_blank" rel="noopener" class="btn btn-secondary btn-block" style="text-decoration:none;text-align:center">Saint Paul VI Institute</a>
      <a href="/acknowledgments" target="_blank" rel="noopener" class="btn btn-secondary btn-block" style="text-decoration:none;text-align:center">Acknowledgments</a>
      <a href="#/privacy" class="btn btn-secondary btn-block" style="text-decoration:none;text-align:center">Privacy Policy</a>
      <a href="#/terms" class="btn btn-secondary btn-block" style="text-decoration:none;text-align:center">Terms of Use</a>
      <a href="#/cookies" class="btn btn-secondary btn-block" style="text-decoration:none;text-align:center">Cookie Policy</a>
    </div>
  `;
  wrapper.appendChild(linksCard);

  // Disclaimer
  const disclaimer = document.createElement('div');
  disclaimer.className = 'disclaimer';
  disclaimer.innerHTML =
    'This app is a personal charting tool and is not a substitute for instruction from a certified FertilityCare Practitioner. ' +
    'The Creighton Model FertilityCare\u2122 System should be learned through proper instruction. ' +
    'To find an instructor in your area, visit <a href="https://www.fertilitycare.org/find-a-center/" target="_blank" rel="noopener" style="color:var(--accent)">FertilityCare.org</a>.<br><br>' +
    'All data is stored locally on your device. If you sign in, your data is end-to-end encrypted before being backed up to our server for cross-device access \u2014 no one else can read it, not even us.<br><br>' +
    'This app is an independent project and is not affiliated with, endorsed by, or sponsored by FertilityCare Centers of America, Creighton University, or the Saint Paul VI Institute. ' +
    'Creighton Model FertilityCare\u2122 System is a trademark of FertilityCare Centers of America. Used here for descriptive purposes only.';
  wrapper.appendChild(disclaimer);

  // Attribution
  const attribution = document.createElement('p');
  attribution.style.cssText = 'text-align:center;font-size:0.75rem;color:var(--text-secondary);margin-top:16px;line-height:1.6';
  attribution.innerHTML =
    'Built by <a href="https://stephens.page" target="_blank" rel="noopener" style="color:var(--accent)">Jacob Stephens</a>';
  wrapper.appendChild(attribution);

  // Version
  const version = document.createElement('p');
  version.style.cssText = 'text-align:center;font-size:0.75rem;color:var(--text-secondary);margin-top:8px';
  version.textContent = `Chart35 v${__APP_VERSION__}`;
  wrapper.appendChild(version);

  container.appendChild(wrapper);
}

/** In-app feedback form. POSTs to /api/feedback which emails the developer. */
function showFeedbackModal(): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Send Feedback');

  const modal = document.createElement('div');
  modal.className = 'modal-content';
  modal.style.padding = '24px 22px calc(24px + env(safe-area-inset-bottom, 0px))';

  const prefillName = authService.state.firstName ?? '';
  const prefillEmail = authService.state.email ?? '';
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <h2 style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;margin:0">Send Feedback</h2>
      <button id="feedback-close" class="obs-form-close" aria-label="Close">&times;</button>
    </div>
    <p style="font-size:0.8125rem;line-height:1.55;color:var(--text-secondary);margin:0 0 14px">
      Bug reports, feature requests, or anything else — your message goes straight to my inbox.
    </p>
    <label style="display:block;font-size:0.8125rem;font-weight:600;margin-bottom:4px">Name</label>
    <input id="feedback-name" type="text" autocomplete="name" maxlength="200"
           value="${escape(prefillName)}"
           style="width:100%;padding:10px 12px;font-size:1rem;margin-bottom:12px" />
    <label style="display:block;font-size:0.8125rem;font-weight:600;margin-bottom:4px">Email (optional, so I can reply)</label>
    <input id="feedback-email-input" type="email" autocomplete="email" maxlength="320"
           value="${escape(prefillEmail)}"
           style="width:100%;padding:10px 12px;font-size:1rem;margin-bottom:12px" />
    <label style="display:block;font-size:0.8125rem;font-weight:600;margin-bottom:4px">Message</label>
    <textarea id="feedback-message" rows="6" maxlength="8000"
              placeholder="What I was doing / what I expected / what happened — or any thoughts at all."
              style="width:100%;padding:10px 12px;font-size:0.95rem;font-family:inherit;resize:vertical;min-height:120px"></textarea>
    <p id="feedback-error" style="font-size:0.8125rem;color:var(--stamp-red);min-height:1.2em;margin:8px 0 4px"></p>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
      <button id="feedback-send" class="btn btn-primary btn-block">Send</button>
      <button id="feedback-cancel" class="btn btn-secondary btn-block">Cancel</button>
    </div>
  `;

  const nameInput = modal.querySelector<HTMLInputElement>('#feedback-name')!;
  const emailInput = modal.querySelector<HTMLInputElement>('#feedback-email-input')!;
  const msgInput = modal.querySelector<HTMLTextAreaElement>('#feedback-message')!;
  const errEl = modal.querySelector<HTMLParagraphElement>('#feedback-error')!;
  const sendBtn = modal.querySelector<HTMLButtonElement>('#feedback-send')!;
  const close = () => overlay.remove();

  modal.querySelector<HTMLButtonElement>('#feedback-close')!.addEventListener('click', close);
  modal.querySelector<HTMLButtonElement>('#feedback-cancel')!.addEventListener('click', close);

  sendBtn.addEventListener('click', async () => {
    errEl.textContent = '';
    const message = msgInput.value.trim();
    if (!message) {
      errEl.textContent = 'Please enter a message.';
      msgInput.focus();
      return;
    }
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';
    try {
      await feedbackService.send({
        message,
        name: nameInput.value.trim() || undefined,
        email: emailInput.value.trim() || undefined,
      });
      close();
      showToast('Feedback sent — thank you!', 'success');
    } catch (err) {
      errEl.textContent = err instanceof Error ? err.message : 'Could not send feedback';
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
    }
  });

  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  document.body.appendChild(overlay);
  requestAnimationFrame(() => msgInput.focus());
}

/** Two-step confirmation modal for permanently deleting the user's account. */
function showDeleteAccountModal(container: HTMLElement): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Delete Account');

  const modal = document.createElement('div');
  modal.className = 'modal-content';
  modal.style.padding = '24px 22px calc(24px + env(safe-area-inset-bottom, 0px))';

  modal.innerHTML = `
    <h2 style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;margin:0 0 10px">Delete Account</h2>
    <p style="font-size:0.875rem;line-height:1.6;color:var(--text-secondary);margin:0 0 10px">
      This permanently deletes your account on our server and all backed-up observations, cycles, settings, and provider share links. <strong>This cannot be undone.</strong>
    </p>
    <p style="font-size:0.875rem;line-height:1.6;color:var(--text-secondary);margin:0 0 14px">
      Your on-device data will also be cleared on this device. To keep a copy, export it first via Data Management.
    </p>
    <label style="display:block;font-size:0.8125rem;font-weight:600;margin-bottom:6px">Enter your password to confirm</label>
  `;

  const pwInput = document.createElement('input');
  pwInput.type = 'password';
  pwInput.autocomplete = 'current-password';
  pwInput.style.cssText = 'width:100%;padding:12px;font-size:1rem;margin-bottom:14px';
  modal.appendChild(wrapPasswordToggle(pwInput));

  const errEl = document.createElement('p');
  errEl.style.cssText = 'font-size:0.8125rem;color:var(--stamp-red);min-height:1.2em;margin:6px 0 12px';
  modal.appendChild(errEl);

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;flex-direction:column;gap:8px';

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-danger btn-block';
  confirmBtn.textContent = 'Permanently delete my account';
  confirmBtn.addEventListener('click', async () => {
    errEl.textContent = '';
    if (!pwInput.value) {
      errEl.textContent = 'Password is required';
      return;
    }
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting…';
    try {
      await authService.deleteAccount(pwInput.value);
      // Wipe local IndexedDB so the device matches the server (now empty).
      await db.transaction('rw', db.observations, db.cycles, db.settings, async () => {
        await db.observations.clear();
        await db.cycles.clear();
        await db.settings.clear();
      });
      overlay.remove();
      showToast('Account deleted', 'success');
      renderSettingsView(container);
    } catch (err) {
      errEl.textContent = err instanceof Error ? err.message : 'Account deletion failed';
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Permanently delete my account';
    }
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary btn-block';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => overlay.remove());

  actions.appendChild(confirmBtn);
  actions.appendChild(cancelBtn);
  modal.appendChild(actions);

  overlay.appendChild(modal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') overlay.remove();
  });
  document.body.appendChild(overlay);
  requestAnimationFrame(() => pwInput.focus());
}

const EYE_OPEN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_CLOSED = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

/** Wrap a password input in a container with a show/hide toggle button. */
function wrapPasswordToggle(input: HTMLInputElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.innerHTML = EYE_CLOSED;
  toggle.setAttribute('aria-label', 'Show password');
  toggle.style.cssText =
    'position:absolute;right:8px;top:50%;transform:translateY(-50%);' +
    'background:none;border:none;padding:4px;cursor:pointer;color:var(--text-secondary);' +
    'display:flex;align-items:center;justify-content:center';

  toggle.addEventListener('click', () => {
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    toggle.innerHTML = visible ? EYE_CLOSED : EYE_OPEN;
    toggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
    input.focus();
  });

  input.style.paddingRight = '36px';
  wrapper.appendChild(input);
  wrapper.appendChild(toggle);
  return wrapper;
}
