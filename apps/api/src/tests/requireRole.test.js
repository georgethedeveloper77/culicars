"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/tests/requireRole.test.ts
const vitest_1 = require("vitest");
const requireRole_1 = require("../middleware/requireRole");
function mockReq(role) {
    return {
        user: role ? { id: 'test-id', email: 'test@test.com', role: role } : undefined,
    };
}
function mockRes() {
    const res = {};
    res.status = vitest_1.vi.fn().mockReturnValue(res);
    res.json = vitest_1.vi.fn().mockReturnValue(res);
    return res;
}
(0, vitest_1.describe)('requireRole middleware', () => {
    (0, vitest_1.it)('calls next() when user has the required role', () => {
        const req = mockReq('admin');
        const res = mockRes();
        const next = vitest_1.vi.fn();
        (0, requireRole_1.requireRole)('admin')(req, res, next);
        (0, vitest_1.expect)(next).toHaveBeenCalledOnce();
        (0, vitest_1.expect)(res.status).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('calls next() when user has one of multiple allowed roles', () => {
        const req = mockReq('employee');
        const res = mockRes();
        const next = vitest_1.vi.fn();
        (0, requireRole_1.requireRole)('admin', 'employee')(req, res, next);
        (0, vitest_1.expect)(next).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('returns 403 when user role is not allowed', () => {
        const req = mockReq('user');
        const res = mockRes();
        const next = vitest_1.vi.fn();
        (0, requireRole_1.requireRole)('admin')(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(403);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ error: 'FORBIDDEN' }));
        (0, vitest_1.expect)(next).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('returns 401 when no user is attached to request', () => {
        const req = mockReq(); // no user
        const res = mockRes();
        const next = vitest_1.vi.fn();
        (0, requireRole_1.requireRole)('admin')(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(401);
        (0, vitest_1.expect)(res.json).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ error: 'UNAUTHORIZED' }));
        (0, vitest_1.expect)(next).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('employee cannot pass admin-only guard', () => {
        const req = mockReq('employee');
        const res = mockRes();
        const next = vitest_1.vi.fn();
        (0, requireRole_1.requireRole)('admin')(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(403);
        (0, vitest_1.expect)(next).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('dealer is allowed when dealer role specified', () => {
        const req = mockReq('dealer');
        const res = mockRes();
        const next = vitest_1.vi.fn();
        (0, requireRole_1.requireRole)('admin', 'dealer')(req, res, next);
        (0, vitest_1.expect)(next).toHaveBeenCalledOnce();
    });
    (0, vitest_1.it)('user cannot pass employee-or-admin guard', () => {
        const req = mockReq('user');
        const res = mockRes();
        const next = vitest_1.vi.fn();
        (0, requireRole_1.requireRole)('admin', 'employee')(req, res, next);
        (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(403);
    });
});
