import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import {
  AuthService,
  AdminRequest,
  requirePermission,
} from './admin/auth.service';
// Legacy editorial endpoints now require a full administrator session too.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    req.admin = await this.auth.authenticate(req);
    requirePermission(req.admin, '*');
    ctx.switchToHttp().getResponse().setHeader('Cache-Control', 'no-store');
    return true;
  }
}
