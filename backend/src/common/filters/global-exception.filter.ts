import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const { status, body } = this.mapException(exception);
    response.status(status).json(body);
  }

  private mapException(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          status: HttpStatus.BAD_REQUEST,
          body: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Unique constraint violation',
              details: exception.meta,
            },
          },
        };
      }

      if (exception.code === 'P2025') {
        return {
          status: HttpStatus.NOT_FOUND,
          body: {
            error: {
              code: 'NOT_FOUND',
              message: 'Resource not found',
            },
          },
        };
      }
    }

    if (exception instanceof HttpException) {
      return this.mapHttpException(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
    };
  }

  private mapHttpException(exception: HttpException): { status: number; body: ErrorBody } {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const responseObject =
      typeof exceptionResponse === 'string' ? { message: exceptionResponse } : (exceptionResponse as Record<string, unknown>);

    const directCode = typeof responseObject.code === 'string' ? responseObject.code : undefined;
    const directMessage = typeof responseObject.message === 'string' ? responseObject.message : exception.message;
    const directDetails = responseObject.details;

    if (directCode) {
      return {
        status,
        body: {
          error: {
            code: directCode,
            message: directMessage,
            ...(directDetails !== undefined ? { details: directDetails } : {}),
          },
        },
      };
    }

    if (exception instanceof BadRequestException) {
      return {
        status,
        body: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            ...(responseObject.message ? { details: responseObject.message } : {}),
          },
        },
      };
    }

    if (exception instanceof UnauthorizedException) {
      return {
        status,
        body: {
          error: {
            code: 'UNAUTHORIZED',
            message: directMessage || 'Unauthorized',
          },
        },
      };
    }

    if (exception instanceof ForbiddenException) {
      return {
        status,
        body: {
          error: {
            code: 'FORBIDDEN',
            message: directMessage || 'Forbidden',
          },
        },
      };
    }

    if (exception instanceof NotFoundException) {
      return {
        status,
        body: {
          error: {
            code: 'NOT_FOUND',
            message: directMessage || 'Not found',
          },
        },
      };
    }

    return {
      status,
      body: {
        error: {
          code: 'INTERNAL_ERROR',
          message: directMessage || 'Internal server error',
        },
      },
    };
  }
}
