import { syncService, type SyncDiff } from '../services/sync-service';
import { showToast } from '../utils/toast';

/** Format a (sorted) list of ISO dates for display, truncating long lists. */
function formatDates(dates: string[], max = 12): string {
  if (dates.length === 0) return '';
  const shown = dates.slice(0, max);
  const rest = dates.length - shown.length;
  return shown.join(', ') + (rest > 0 ? `, +${rest} more` : '');
}

function buildOverlay(): { overlay: HTMLElement; modal: HTMLElement; close: () => void } {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  const modal = document.createElement('div');
  modal.className = 'modal-content';
  modal.style.cssText = 'padding:22px 20px calc(22px + env(safe-area-inset-bottom, 0px))';
  overlay.appendChild(modal);
  const close = () => overlay.remove();
  return { overlay, modal, close };
}

function diffRow(count: number, label: string, dates: string[], color: string): HTMLElement {
  const row = document.createElement('div');
  row.style.cssText = 'margin:8px 0';
  const head = document.createElement('div');
  head.style.cssText = `font-size:0.875rem;font-weight:600;color:${color}`;
  head.textContent = `${count} ${label}`;
  row.appendChild(head);
  if (dates.length) {
    const list = document.createElement('div');
    list.style.cssText = 'font-size:0.75rem;color:var(--text-secondary);margin-top:2px;line-height:1.4';
    list.textContent = formatDates(dates);
    row.appendChild(list);
  }
  return row;
}

/**
 * "Check for differences" — fetches the server snapshot non-destructively,
 * compares it to local data, and shows a read-only summary with optional
 * resolve actions. onResolved is called after an upload/download so the
 * caller can re-render.
 */
export async function showSyncDiffModal(onResolved?: () => void): Promise<void> {
  const { overlay, modal, close } = buildOverlay();
  document.body.appendChild(overlay);

  const title = document.createElement('h2');
  title.style.cssText = 'font-family:var(--font-display);font-size:1.15rem;font-weight:700;margin-bottom:12px';
  title.textContent = 'Compare with Server';
  modal.appendChild(title);

  const status = document.createElement('p');
  status.style.cssText = 'font-size:0.875rem;color:var(--text-secondary)';
  status.textContent = 'Checking…';
  modal.appendChild(status);

  let diff: SyncDiff;
  try {
    diff = await syncService.diffWithServer();
  } catch (e) {
    status.textContent = (e as Error).message || 'Could not compare with the server.';
    const ok = document.createElement('button');
    ok.className = 'btn btn-secondary btn-block';
    ok.textContent = 'Close';
    ok.style.marginTop = '16px';
    ok.addEventListener('click', close);
    modal.appendChild(ok);
    return;
  }

  status.remove();

  const summary = document.createElement('div');
  if (diff.inSync) {
    const ok = document.createElement('p');
    ok.style.cssText = 'font-size:0.9rem;color:var(--text-primary);line-height:1.5';
    ok.textContent = `✓ In sync. This device and your account both have ${diff.localCount} entr${diff.localCount === 1 ? 'y' : 'ies'}.`;
    summary.appendChild(ok);
  } else if (!diff.hasServerData) {
    const p = document.createElement('p');
    p.style.cssText = 'font-size:0.9rem;line-height:1.5';
    p.textContent = `Your account has no backup yet. This device has ${diff.localCount} entr${diff.localCount === 1 ? 'y' : 'ies'} that aren’t backed up.`;
    summary.appendChild(p);
  } else {
    const intro = document.createElement('p');
    intro.style.cssText = 'font-size:0.875rem;color:var(--text-secondary);margin-bottom:4px';
    intro.textContent = `This device: ${diff.localCount} • Server: ${diff.serverCount}`;
    summary.appendChild(intro);
    if (diff.onlyLocal.length) summary.appendChild(diffRow(diff.onlyLocal.length, 'day(s) only on this device', diff.onlyLocal, '#E65100'));
    if (diff.changed.length) summary.appendChild(diffRow(diff.changed.length, 'day(s) with different values', diff.changed, '#E65100'));
    if (diff.onlyServer.length) summary.appendChild(diffRow(diff.onlyServer.length, 'day(s) only on the server', diff.onlyServer, 'var(--text-primary)'));
  }
  if (diff.serverUpdatedAt) {
    const upd = document.createElement('p');
    upd.style.cssText = 'font-size:0.72rem;color:var(--text-muted);margin-top:10px';
    upd.textContent = `Server last updated ${new Date(diff.serverUpdatedAt).toLocaleString()}`;
    summary.appendChild(upd);
  }
  modal.appendChild(summary);

  // Resolve actions when there are differences
  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:18px';

  const runAction = async (
    btn: HTMLButtonElement,
    fn: () => Promise<unknown>,
    successMsg: string,
  ) => {
    btn.disabled = true;
    btn.classList.add('btn-loading');
    try {
      await fn();
      showToast(successMsg, 'success');
      close();
      onResolved?.();
    } catch (e) {
      showToast((e as Error).message || 'Action failed', 'error');
      btn.disabled = false;
      btn.classList.remove('btn-loading');
    }
  };

  if (!diff.inSync) {
    if (diff.onlyLocal.length || diff.changed.length || !diff.hasServerData) {
      const upBtn = document.createElement('button');
      upBtn.className = 'btn btn-primary btn-block';
      upBtn.textContent = 'Upload this device → server';
      upBtn.addEventListener('click', () => runAction(upBtn, () => syncService.upload(), 'Uploaded this device’s data to the server'));
      actions.appendChild(upBtn);
    }
    if (diff.hasServerData && (diff.onlyServer.length || diff.changed.length || diff.onlyLocal.length)) {
      const downBtn = document.createElement('button');
      downBtn.className = 'btn btn-secondary btn-block';
      downBtn.textContent = 'Download server → this device';
      downBtn.addEventListener('click', () => {
        if (diff.onlyLocal.length || diff.changed.length) {
          if (!confirm('This replaces this device’s data with the server copy. Entries only on this device will be lost. Continue?')) return;
        }
        runAction(downBtn, () => syncService.download(), 'Downloaded the server copy to this device');
      });
      actions.appendChild(downBtn);
    }
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = diff.inSync ? 'btn btn-primary btn-block' : 'btn btn-secondary btn-block';
  closeBtn.textContent = diff.inSync ? 'Done' : 'Close';
  closeBtn.addEventListener('click', close);
  actions.appendChild(closeBtn);

  modal.appendChild(actions);
}

/**
 * Called right after a successful login. If pulling/finishing the sign-in
 * could discard local data, ask the user how to reconcile. Returns true if
 * the user is still signed in afterward, false if they cancelled.
 */
export async function reconcileAfterLogin(onLogout: () => Promise<void>): Promise<boolean> {
  let diff: SyncDiff;
  try {
    diff = await syncService.diffWithServer();
  } catch {
    // Couldn't reach/decrypt the server right now — leave local untouched;
    // the normal sync flow will reconcile later. Stay signed in.
    return true;
  }

  if (diff.inSync) return true;

  const riskLocalLoss = diff.onlyLocal.length > 0 || diff.changed.length > 0;
  const riskServerLoss = diff.onlyServer.length > 0 || diff.changed.length > 0;

  // Default to keeping/backing up this device's data (what a user signing in
  // almost always wants) whenever doing so won't erase data on the account.
  if (!diff.hasServerData || !riskServerLoss) {
    await syncService.upload().catch(() => {});
    return true;
  }
  // Server has data this device lacks, and local has nothing unique — pull it.
  if (!riskLocalLoss) {
    await syncService.download().catch(() => {});
    return true;
  }

  // Both sides have unique data — neither direction is safe. Make the user choose.
  return new Promise<boolean>((resolve) => {
    const { overlay, modal, close } = buildOverlay();
    document.body.appendChild(overlay);

    const title = document.createElement('h2');
    title.style.cssText = 'font-family:var(--font-display);font-size:1.15rem;font-weight:700;margin-bottom:10px';
    title.textContent = 'Unsynced data on this device';
    modal.appendChild(title);

    const body = document.createElement('p');
    body.style.cssText = 'font-size:0.875rem;line-height:1.5;color:var(--text-primary)';
    const parts: string[] = [];
    if (diff.onlyLocal.length) parts.push(`${diff.onlyLocal.length} day(s) of entries that aren’t in this account`);
    if (diff.changed.length) parts.push(`${diff.changed.length} day(s) that differ from the account`);
    body.textContent = `This device has ${parts.join(' and ')}. Using the account’s data would erase ${diff.changed.length || diff.onlyLocal.length ? 'them' : 'it'}. How do you want to continue?`;
    modal.appendChild(body);

    if (diff.serverUpdatedAt) {
      const upd = document.createElement('p');
      upd.style.cssText = 'font-size:0.72rem;color:var(--text-muted);margin-top:8px';
      upd.textContent = `Account last updated ${new Date(diff.serverUpdatedAt).toLocaleString()}`;
      modal.appendChild(upd);
    }

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:18px';

    const keepBtn = document.createElement('button');
    keepBtn.className = 'btn btn-primary btn-block';
    keepBtn.textContent = 'Keep this device’s data';
    const keepHint = document.createElement('p');
    keepHint.style.cssText = 'font-size:0.72rem;color:var(--text-secondary);margin:-4px 0 4px;padding:0 2px';
    keepHint.textContent = 'Uploads this device’s data to the account, replacing what’s stored there.';

    const useBtn = document.createElement('button');
    useBtn.className = 'btn btn-secondary btn-block';
    useBtn.textContent = 'Use the account’s data';
    const useHint = document.createElement('p');
    useHint.style.cssText = 'font-size:0.72rem;color:var(--text-secondary);margin:-4px 0 4px;padding:0 2px';
    useHint.textContent = 'Replaces this device’s data with the account copy.';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-block';
    cancelBtn.style.cssText = 'background:none;color:var(--text-secondary)';
    cancelBtn.textContent = 'Cancel sign-in';

    const busy = (b: HTMLButtonElement) => { b.disabled = true; b.classList.add('btn-loading'); };

    keepBtn.addEventListener('click', async () => {
      busy(keepBtn);
      try {
        await syncService.upload();
        showToast('Kept this device’s data and backed it up', 'success');
        close();
        resolve(true);
      } catch (e) {
        showToast((e as Error).message || 'Upload failed', 'error');
        keepBtn.disabled = false; keepBtn.classList.remove('btn-loading');
      }
    });

    useBtn.addEventListener('click', async () => {
      busy(useBtn);
      try {
        await syncService.download();
        showToast('Loaded the account’s data', 'success');
        close();
        resolve(true);
      } catch (e) {
        showToast((e as Error).message || 'Download failed', 'error');
        useBtn.disabled = false; useBtn.classList.remove('btn-loading');
      }
    });

    cancelBtn.addEventListener('click', async () => {
      busy(cancelBtn);
      await onLogout();
      close();
      resolve(false);
    });

    actions.appendChild(keepBtn);
    actions.appendChild(keepHint);
    actions.appendChild(useBtn);
    actions.appendChild(useHint);
    actions.appendChild(cancelBtn);
    modal.appendChild(actions);
  });
}
