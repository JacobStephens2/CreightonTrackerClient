const E2E_KEY_STORAGE = 'e2eKey';

let _cachedKey: CryptoKey | null = null;

export const cryptoService = {
  async deriveAndStoreKey(password: string, saltBase64: string): Promise<void> {
    const salt = base64ToBuffer(saltBase64);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey'],
    );

    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 600_000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true, // extractable so we can persist to localStorage
      ['encrypt', 'decrypt'],
    );

    // Export and persist key
    const rawKey = await crypto.subtle.exportKey('raw', key);
    localStorage.setItem(E2E_KEY_STORAGE, bufferToBase64(new Uint8Array(rawKey)));
    _cachedKey = key;
  },

  async getKey(): Promise<CryptoKey | null> {
    if (_cachedKey) return _cachedKey;

    const stored = localStorage.getItem(E2E_KEY_STORAGE);
    if (!stored) return null;

    try {
      const rawKey = base64ToBuffer(stored);
      _cachedKey = await crypto.subtle.importKey(
        'raw',
        rawKey.buffer as ArrayBuffer,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
      );
      return _cachedKey;
    } catch {
      localStorage.removeItem(E2E_KEY_STORAGE);
      return null;
    }
  },

  clearKey(): void {
    _cachedKey = null;
    localStorage.removeItem(E2E_KEY_STORAGE);
  },

  async encrypt(plaintext: string): Promise<string> {
    const key = await this.getKey();
    if (!key) throw new Error('No encryption key available');

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

    // AES-GCM appends the 16-byte auth tag to the ciphertext
    const cipherArray = new Uint8Array(cipherBuffer);
    const ciphertext = cipherArray.slice(0, -16);
    const tag = cipherArray.slice(-16);

    return `${bufferToBase64(iv)}:${bufferToBase64(tag)}:${bufferToBase64(ciphertext)}`;
  },

  async decrypt(encoded: string): Promise<string> {
    const key = await this.getKey();
    if (!key) throw new Error('No encryption key available');

    const parts = encoded.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted data format');

    const iv = base64ToBuffer(parts[0]);
    const tag = base64ToBuffer(parts[1]);
    const ciphertext = base64ToBuffer(parts[2]);

    // Reconstruct the buffer AES-GCM expects: ciphertext + tag
    const combined = new Uint8Array(ciphertext.length + tag.length);
    combined.set(ciphertext);
    combined.set(tag, ciphertext.length);

    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      combined.buffer as ArrayBuffer,
    );
    return new TextDecoder().decode(plainBuffer);
  },

  hasKey(): boolean {
    return !!_cachedKey || !!localStorage.getItem(E2E_KEY_STORAGE);
  },
};

function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
