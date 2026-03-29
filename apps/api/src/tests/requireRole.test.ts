// apps/api/src/tests/requireRole.test.ts
import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '../middleware/requireRole';
import type { Request, Response, NextFunction } from 'express';

function mockReq(role?: string): Partial<Request> {
  return {
    user: role ? { id: 'test-id', email: 'test@test.com', role: role as any } : undefined,
  };
}

function mockRes(): Partial<Response> {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('requireRole middleware', () => {
  it('calls next() when user has the required role', () => {
    const req = mockReq('admin');
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireRole('admin')(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() when user has one of multiple allowed roles', () => {
    const req = mockReq('employee');
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireRole('admin', 'employee')(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 403 when user role is not allowed', () => {
    const req = mockReq('user');
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireRole('admin')(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'FORBIDDEN' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when no user is attached to request', () => {
    const req = mockReq(); // no user
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireRole('admin')(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'UNAUTHORIZED' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('employee cannot pass admin-only guard', () => {
    const req = mockReq('employee');
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireRole('admin')(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('dealer is allowed when dealer role specified', () => {
    const req = mockReq('dealer');
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireRole('admin', 'dealer')(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('user cannot pass employee-or-admin guard', () => {
    const req = mockReq('user');
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireRole('admin', 'employee')(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
