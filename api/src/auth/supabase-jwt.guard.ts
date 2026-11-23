import { CanActivate, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { isUUID } from 'class-validator';
import type { TenantRequest } from '../common/request-context.js';

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  private jwks?: JWTVerifyGetKey;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? '';
    if (!token) throw new UnauthorizedException({ code: 'AUTH_REQUIRED', message: 'ورود معتبر لازم است.' });

    let supabaseUrl: URL;
    try {
      if (!process.env.SUPABASE_URL) throw new Error('missing');
      supabaseUrl = new URL(process.env.SUPABASE_URL);
      if (supabaseUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(supabaseUrl.hostname)) throw new Error('https required');
    } catch {
      throw new ServiceUnavailableException({ code: 'AUTH_NOT_CONFIGURED', message: 'سرویس احراز هویت برای API پیکربندی نشده است.' });
    }

    if (!this.jwks) {
      const jwksUrl = new URL('/auth/v1/.well-known/jwks.json', supabaseUrl);
      this.jwks = createRemoteJWKSet(jwksUrl);
    }
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: new URL('/auth/v1', supabaseUrl).toString().replace(/\/$/, ''),
        audience: 'authenticated',
        algorithms: ['ES256', 'RS256'],
      });
      if (typeof payload.sub !== 'string' || !isUUID(payload.sub)) throw new Error('invalid subject');
      request.actor = { userId: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException({ code: 'TOKEN_INVALID', message: 'نشست نامعتبر یا منقضی شده است.' });
    }
  }
}
