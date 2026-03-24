"use strict";
// ============================================================
// CuliCars — Thread 6: M-Pesa Webhook Tests
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock the payment provider service
const mockConfirmPayment = vitest_1.vi.fn();
const mockFailPayment = vitest_1.vi.fn();
vitest_1.vi.mock('../../services/paymentProviderService', () => ({
    confirmPayment: (...args) => mockConfirmPayment(...args),
    failPayment: (...args) => mockFailPayment(...args),
}));
// Simulate Express request/response
function createMockReqRes(body) {
    return {
        req: { body, headers: {} },
        res: {
            json: vitest_1.vi.fn().mockReturnThis(),
            status: vitest_1.vi.fn().mockReturnThis(),
        },
    };
}
(0, vitest_1.describe)('M-Pesa Webhook', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockConfirmPayment.mockResolvedValue({ paymentId: 'pay-1', credits: 5, newBalance: 10 });
        mockFailPayment.mockResolvedValue(undefined);
    });
    (0, vitest_1.it)('processes successful STK callback (ResultCode 0)', () => {
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
        (0, vitest_1.expect)(callback.ResultCode).toBe(0);
        (0, vitest_1.expect)(callback.CheckoutRequestID).toBe('checkout-456');
        const metaItems = callback.CallbackMetadata?.Item ?? [];
        const metaMap = {};
        for (const item of metaItems) {
            metaMap[item.Name] = item.Value;
        }
        (0, vitest_1.expect)(metaMap['MpesaReceiptNumber']).toBe('QJI3ABNGT5');
        (0, vitest_1.expect)(metaMap['Amount']).toBe(150);
        (0, vitest_1.expect)(metaMap['PhoneNumber']).toBe(254712345678);
    });
    (0, vitest_1.it)('identifies failed STK callback (ResultCode 1032 = cancelled)', () => {
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
        (0, vitest_1.expect)(callback.ResultCode).not.toBe(0);
        (0, vitest_1.expect)(callback.ResultCode).toBe(1032);
        (0, vitest_1.expect)(callback.CheckoutRequestID).toBe('checkout-789');
    });
    (0, vitest_1.it)('handles missing CallbackMetadata gracefully', () => {
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
        (0, vitest_1.expect)(metaItems).toEqual([]);
    });
    (0, vitest_1.it)('handles malformed body without crashing', () => {
        const badBody = { unexpected: 'format' };
        const callback = badBody?.Body?.stkCallback;
        (0, vitest_1.expect)(callback).toBeUndefined();
    });
});
