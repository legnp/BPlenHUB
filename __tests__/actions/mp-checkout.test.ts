import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPreferenceAction } from '@/actions/mp-checkout';
import { requireAuth } from '@/lib/auth-guards';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/lib/rate-limit';

vi.mock('@/lib/auth-guards', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  RATE_LIMITS: { CHECKOUT: { windowSeconds: 8 } }
}));

vi.mock('@/lib/firebase-admin', () => {
  const mockDoc = vi.fn().mockReturnValue({
    id: 'mock-id',
    set: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue({ exists: false }),
  });

  const mockCollection = vi.fn().mockReturnValue({
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn(),
    doc: mockDoc,
  });

  return {
    getAdminDb: vi.fn().mockReturnValue({
      collection: mockCollection,
    }),
    default: {
      firestore: {
        FieldValue: {
          serverTimestamp: vi.fn().mockReturnValue('mock-timestamp'),
        },
      },
    },
  };
});

vi.mock('mercadopago', () => {
  return {
    MercadoPagoConfig: vi.fn(),
    Preference: vi.fn().mockImplementation(function PreferenceMock() {
      return {
      create: vi.fn().mockResolvedValue({ id: 'mock-pref-id' }),
      };
    }),
  };
});

vi.mock('@/env', () => ({
  clientEnv: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: 'mock-key',
  },
  serverEnv: {
    MERCADOPAGO_ACCESS_TOKEN: 'mock-token',
  },
}));

describe('Mercado Pago Checkout Actions 💳', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
  });

  it('should create a preference successfully', async () => {
    const mockSession = { uid: 'user-123', email: 'test@bplen.com' };
    vi.mocked(requireAuth).mockResolvedValue(mockSession as any);

    const mockProduct = {
      id: 'prod-1',
      slug: 'test-service',
      title: 'Test Service',
      price: 100,
      sheet: { description: 'test' }
    };

    const db = getAdminDb();
    const productCol = db.collection('products');
    vi.mocked(productCol.get).mockResolvedValue({
      empty: false,
      docs: [{ data: () => mockProduct, id: 'prod-1' }],
    } as any);

    const result = await createPreferenceAction('test-service', 'token');

    expect(result.success).toBe(true);
    expect(result.preferenceId).toBe('mock-pref-id');
  });

  it('should return error if product not found', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ uid: '123' } as any);
    
    const db = getAdminDb();
    const productCol = db.collection('products');
    vi.mocked(productCol.get).mockResolvedValue({ empty: true } as any);

    const result = await createPreferenceAction('invalid', 'token');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Serviço não encontrado.');
  });
});
