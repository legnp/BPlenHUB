import { describe, it, expect, vi } from 'vitest';
import { requireAuth, requireAdmin } from '@/lib/auth-guards';
import { getServerSession } from '@/lib/server-session';

// Mocking the server-session module
vi.mock('@/lib/server-session', () => ({
  getServerSession: vi.fn(),
}));

describe('Auth Guards 🛡️', () => {
  describe('requireAuth', () => {
    it('should return session if authenticated', async () => {
      const mockSession = { uid: '123', email: 'test@bplen.com', isAdmin: false, matricula: null };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const result = await requireAuth('valid-token');
      expect(result).toEqual(mockSession);
    });

    it('should throw error if NOT authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      await expect(requireAuth('invalid-token')).rejects.toThrow('Sessão inválida ou expirada. Autentique-se novamente.');
    });
  });

  describe('requireAdmin', () => {
    it('should return session if user is admin', async () => {
      const mockSession = { uid: '123', email: 'admin@bplen.com', isAdmin: true, matricula: null };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const result = await requireAdmin('admin-token');
      expect(result).toEqual(mockSession);
    });

    it('should throw error if user is NOT admin', async () => {
      const mockSession = { uid: '123', email: 'user@bplen.com', isAdmin: false, matricula: null };
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      await expect(requireAdmin('user-token')).rejects.toThrow('Você não tem permissão para realizar esta operação.');
    });

    it('should throw auth error if session is null', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      await expect(requireAdmin('no-token')).rejects.toThrow('Sessão inválida ou expirada. Autentique-se novamente.');
    });
  });
});
