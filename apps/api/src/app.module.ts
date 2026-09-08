import {Module,Controller,Get,ServiceUnavailableException} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {APP_GUARD} from '@nestjs/core';
import {ThrottlerModule,ThrottlerGuard} from '@nestjs/throttler';
import {PrismaService} from './prisma.service';
import {ContentController} from './content.controller';
import {ContactMailService} from './contact-mail.service';
import {PartnersService} from './partners.service';
import {FormsController} from './forms.controller';
import {AdminController} from './admin.controller';
import {AdminGuard} from './admin.guard';
import {validateEnvironment} from './environment';
@Controller('health') class HealthController {constructor(private readonly db:PrismaService){} @Get() async health(){try{await this.db.$queryRaw`SELECT 1`;return {status:'ok'}}catch{throw new ServiceUnavailableException('Database unavailable')}}}
@Module({imports:[ConfigModule.forRoot({isGlobal:true,validate:validateEnvironment}),ThrottlerModule.forRoot([{name:'default',ttl:60000,limit:120}])],controllers:[HealthController,ContentController,FormsController,AdminController],providers:[PrismaService,PartnersService,ContactMailService,AdminGuard,{provide:APP_GUARD,useClass:ThrottlerGuard}]}) export class AppModule {}
