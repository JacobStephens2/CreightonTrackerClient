export const shareService = {
  async getStatus(): Promise<{ active: boolean; token?: string; url?: string; createdAt?: string; expiresAt?: string }> {
    const res = await fetch('/api/share/status');
    if (!res.ok) throw new Error('Failed to check share status');
    return res.json();
  },

  async generate(): Promise<{ token: string; url: string; hasData: boolean; expiresAt: string }> {
    const res = await fetch('/api/share/generate', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate share link');
    return res.json();
  },

  async revoke(): Promise<void> {
    const res = await fetch('/api/share/revoke', { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to revoke share link');
  },
};
