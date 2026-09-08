import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import type { Response, Request } from 'express';
import { AuthService, AdminRequest, csrfFor } from './auth.service';
class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @IsString() @MinLength(1) @MaxLength(256) password!: string;
}
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    req.admin = await this.auth.authenticate(req);
    ctx
      .switchToHttp()
      .getResponse<Response>()
      .setHeader('Cache-Control', 'no-store');
    return true;
  }
}
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: LoginDto,
  ) {
    return this.auth.login(req, res, body.email, body.password);
  }
  @Get('me') @UseGuards(SessionGuard) me(@Req() req: AdminRequest) {
    const { sessionId, ...user } = req.admin;
    return { user, csrf: csrfFor(this.auth.token(req)) };
  }
  @Post('logout') @UseGuards(SessionGuard) logout(
    @Req() req: AdminRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.logout(req, res);
  }
}
