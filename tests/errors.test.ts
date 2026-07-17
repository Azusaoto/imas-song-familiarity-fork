import { expect, test, describe, afterAll } from 'vitest';
import { AppError, handleError } from '@/lib/errors';

describe('Error Utility', () => {
  const originalEnv = process.env.NODE_ENV;

  afterAll(() => {
    (process.env as Record<string, string>).NODE_ENV = originalEnv || '';
  });

  test('AppError returns formatted NextResponse for known errors', async () => {
    const error = new AppError('Known bad request', 400, 'BAD_REQUEST');
    const response = handleError(error);
    
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      error: 'Known bad request',
      code: 'BAD_REQUEST',
    });
  });

  test('AppError handles details correctly', async () => {
    const details = [{ path: ['field'], message: 'Invalid' }];
    const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
    const response = handleError(error);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
    });
  });

  test('Unexpected error returns generic message in production', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    const error = new Error('Database connection failed');
    const response = handleError(error);
    
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('伺服器發生未預期的錯誤，請稍後再試。');
    expect(body.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.details).toBeUndefined(); // details hidden in prod
  });

  test('Unexpected error returns details in non-production', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'development';
    const error = new Error('Database connection failed');
    const response = handleError(error);
    
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('伺服器發生未預期的錯誤，請稍後再試。');
    expect(body.details).toBe('Database connection failed'); // details shown in dev
  });
});
