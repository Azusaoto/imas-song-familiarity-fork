import { NextResponse } from 'next/server';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.statusCode }
    );
  }

  // Log unexpected error details on the server
  console.error('[Unexpected System Error]:', error);

  const isProd = process.env.NODE_ENV === 'production';

  return NextResponse.json(
    {
      error: '伺服器發生未預期的錯誤，請稍後再試。',
      code: 'INTERNAL_SERVER_ERROR',
      ...(isProd ? {} : { details: error instanceof Error ? error.message : String(error) }),
    },
    { status: 500 }
  );
}
