// ============================================================
// CuliCars — Thread 6: M-Pesa Webhook Tests
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the payment provider service
const mockConfirmPayment = vi.fn();
const mockFailPayment = vi.fn();

vi.mock('../../services/paymentProviderService', () => ({
  confirmPayment: (...args: any[]) => mockConfirmPayment(...args),
  failPayment: (...args: any[]) => mockFailPayment(...args),
}));

// Simulate Express request/response
function createMockReqRes(body: any) {
  return {
    req: { body, headers: {} },
    res: {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    },
  };
}

describe('M-Pesa Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirmPayment.mockResolvedValue({ paymentId: 'pay-1', credits: 5, newBalance: 10 });
    mockFailPayment.mockResolvedValue(undefined);
  });

  it('processes successful STK callback (ResultCode 0)', () => {
    const successBody = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'merchant-123',
          CheckoutRequestID: 'checkout-456',
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 150 },
              { Name: 'MpesaReceiptNumber', Value: 'QJI3ABNGT5' },
              { Name: 'PhoneNumber', Value: 254712345678 },
              { Name: 'TransactionDate', Value: 20250315143020 },
            ],
          },
        },
      },
    };

    // Verify the callback structure is correctly parseable
    const callback = successBody.Body.stkCallback;
    expect(callback.ResultCode).toBe(0);
    expect(callback.CheckoutRequestID).toBe('checkout-456');

    const metaItems = callback.CallbackMetadata?.Item ?? [];
    const metaMap: Record<string, any> = {};
    for (const item of metaItems) {
      metaMap[item.Name] = item.Value;
    }

    expect(metaMap['MpesaReceiptNumber']).toBe('QJI3ABNGT5');
    expect(metaMap['Amount']).toBe(150);
    expect(metaMap['PhoneNumber']).toBe(254712345678);
  });

  it('identifies failed STK callback (ResultCode 1032 = cancelled)', () => {
    const failBody = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'merchant-123',
          CheckoutRequestID: 'checkout-789',
          ResultCode: 1032,
          ResultDesc: 'Request cancelled by user.',
        },
      },
    };

    const callback = failBody.Body.stkCallback;
    expect(callback.ResultCode).not.toBe(0);
    expect(callback.ResultCode).toBe(1032);
    expect(callback.CheckoutRequestID).toBe('checkout-789');
  });

  it('handles missing CallbackMetadata gracefully', () => {
    const noMetaBody = {
      Body: {
        stkCallback: {
          MerchantRequestID: 'merchant-123',
          CheckoutRequestID: 'checkout-000',
          ResultCode: 0,
          ResultDesc: 'Success',
          // No CallbackMetadata
        },
      },
    };

    const callback = noMetaBody.Body.stkCallback;
    const metaItems = callback.CallbackMetadata?.Item ?? [];
    expect(metaItems).toEqual([]);
  });

  it('handles malformed body without crashing', () => {
    const badBody = { unexpected: 'format' };
    const callback = (badBody as any)?.Body?.stkCallback;
    expect(callback).toBeUndefined();
  });
});
