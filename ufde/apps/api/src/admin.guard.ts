import {CanActivate,ExecutionContext,Injectable,UnauthorizedException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {timingSafeEqual,createHash} from 'node:crypto';
@Injectable()
export class AdminGuard implements CanActivate {
 constructor(private readonly config:ConfigService){}
 canActivate(ctx:ExecutionContext){const expected=this.config.get<string>('ADMIN_API_TOKEN');const authorization=ctx.switchToHttp().getRequest().headers.authorization;const actual=typeof authorization==='string'&&authorization.startsWith('Bearer ')?authorization.slice(7):'';
 if(!expected || expected.length<48 || !actual || !timingSafeEqual(createHash('sha256').update(actual).digest(),createHash('sha256').update(expected).digest()))throw new UnauthorizedException();return true;}
}
