import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma.service';
import { dummyHash, verifyPassword } from './password';
export type AdminIdentity = {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  sessionId: string;
};
export type AdminRequest = Request & { admin: AdminIdentity };
export const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');
export const csrfFor = (token: string) => digest('ufde-csrf:' + token);
export function hasPermission(admin: AdminIdentity, permission: string) {
  return (
    admin.permissions.includes('*') || admin.permissions.includes(permission)
  );
}
export function requirePermission(admin: AdminIdentity, permission: string) {
  if (!hasPermission(admin, permission))
    throw new ForbiddenException('Your role does not allow this action');
}
@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {}
  private get production() {
    return this.config.get('NODE_ENV') === 'production';
  }
  private get cookieName() {
    return this.production ? '__Host-ufde_session' : 'ufde_session';
  }
  origin(req: Request) {
    const allowed = this.config.getOrThrow<string>('CORS_ORIGINS').split(',');
    if (
      typeof req.headers.origin !== 'string' ||
      !allowed.includes(req.headers.origin)
    )
      throw new ForbiddenException('Untrusted request origin');
  }
  token(req: Request) {
    const cookies = (req.headers.cookie || '').split(';').map((s) => s.trim());
    const matches = cookies.filter((c) => c.startsWith(this.cookieName + '='));
    if (matches.length !== 1) return '';
    const value = matches[0].slice(this.cookieName.length + 1);
    return /^[a-f0-9]{64}$/.test(value) ? value : '';
  }
  private cookie(res: Response, value: string, maxAge: number) {
    res.cookie(this.cookieName, value, {
      httpOnly: true,
      secure: this.production,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
    res.setHeader('Cache-Control', 'no-store');
  }
  async login(req: Request, res: Response, email: string, password: string) {
    this.origin(req);
    // Persistent, atomic buckets work across API instances; do not trust forwarded IP headers.
    const keys = [
      'ip:' + digest(req.socket.remoteAddress || 'unknown'),
      'account:' + digest(email),
    ];
    for (const key of keys) {
      const rows = await this.db.$queryRaw<
        Array<{ count: number }>
      >`INSERT INTO "AuthRateLimit" ("key","count","windowEndsAt","createdAt","updatedAt") VALUES (${key},1,now()+interval '15 minutes',now(),now()) ON CONFLICT ("key") DO UPDATE SET "count"=CASE WHEN "AuthRateLimit"."windowEndsAt"<now() THEN 1 ELSE "AuthRateLimit"."count"+1 END,"windowEndsAt"=CASE WHEN "AuthRateLimit"."windowEndsAt"<now() THEN now()+interval '15 minutes' ELSE "AuthRateLimit"."windowEndsAt" END,"updatedAt"=now() RETURNING "count"`;
      if (rows[0].count > (key.startsWith('ip:') ? 100 : 10))
        throw new HttpException(
          'Too many login attempts. Try again in 15 minutes.',
          429,
        );
    }
    const user = await this.db.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
    const valid = await verifyPassword(
      password,
      user?.passwordHash || dummyHash,
    );
    if (!valid || !user?.active || user.isDemo || !user.roles.length)
      throw new UnauthorizedException('Invalid email or password');
    const token = randomBytes(32).toString('hex');
    const old = this.token(req);
    await this.db.$transaction(async (tx) => {
      if (old)
        await tx.adminSession.deleteMany({ where: { tokenHash: digest(old) } });
      await tx.adminSession.create({
        data: {
          tokenHash: digest(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        },
      });
      await tx.adminAuditLog.create({
        data: { userId: user.id, action: 'login', module: 'auth' },
      });
    });
    this.cookie(res, token, 8 * 60 * 60 * 1000);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        permissions: [
          ...new Set(user.roles.flatMap((r) => r.role.permissions)),
        ],
      },
      csrf: csrfFor(token),
    };
  }
  async authenticate(req: Request) {
    const token = this.token(req);
    if (!token) throw new UnauthorizedException();
    const session = await this.db.adminSession.findUnique({
      where: { tokenHash: digest(token) },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });
    if (
      !session ||
      session.expiresAt.getTime() <= Date.now() ||
      session.lastSeenAt.getTime() < Date.now() - 30 * 60 * 1000 ||
      !session.user.active ||
      session.user.isDemo
    )
      throw new UnauthorizedException('Session expired. Sign in again.');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      this.origin(req);
      const actual = req.headers['x-csrf-token'];
      if (
        typeof actual !== 'string' ||
        actual.length !== 64 ||
        !timingSafeEqual(
          Buffer.from(digest(actual), 'hex'),
          Buffer.from(digest(csrfFor(token)), 'hex'),
        )
      )
        throw new ForbiddenException('Invalid CSRF token');
    }
    await this.db.adminSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    });
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      permissions: [
        ...new Set(session.user.roles.flatMap((r) => r.role.permissions)),
      ],
      sessionId: session.id,
    };
  }
  async logout(req: AdminRequest, res: Response) {
    await this.db.adminSession.deleteMany({
      where: { id: req.admin.sessionId },
    });
    this.cookie(res, '', 0);
    return { ok: true };
  }
}
