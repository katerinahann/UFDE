import 'reflect-metadata';
import {NestFactory} from '@nestjs/core';
import {ValidationPipe,Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {SwaggerModule,DocumentBuilder} from '@nestjs/swagger';
import {json,urlencoded,static as serveStatic} from 'express';
import {resolve} from 'node:path';
import helmet from 'helmet';
import {AppModule} from './app.module';
async function bootstrap(){const app=await NestFactory.create(AppModule,{bodyParser:false,logger:['error','warn','log']});const config=app.get(ConfigService);app.use(helmet());if(config.get<string>('PARTNER_LOGO_DIRECTORY'))app.use('/media/partner-logos',(_req:import('express').Request,res:import('express').Response,next:import('express').NextFunction)=>{res.setHeader('Cross-Origin-Resource-Policy','cross-origin');next();},serveStatic(resolve(config.getOrThrow<string>('PARTNER_LOGO_DIRECTORY')),{dotfiles:'deny',index:false,fallthrough:false}));app.use((req:import('express').Request,_res:import('express').Response,next:import('express').NextFunction)=>{if(req.url==='/api/contact')req.url='/v1/contact';next();});app.use(json({limit:'128kb'}));app.use(urlencoded({extended:false,limit:'128kb'}));app.enableCors({origin:config.getOrThrow<string>('CORS_ORIGINS').split(','),methods:['GET','POST','PUT','DELETE'],allowedHeaders:['Content-Type','Authorization'],credentials:false});app.setGlobalPrefix('v1');app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true,validationError:{target:false,value:false}}));app.enableShutdownHooks();
if(config.get('ENABLE_SWAGGER')==='true'){const spec=SwaggerModule.createDocument(app,new DocumentBuilder().setTitle('UFDE Content API').setDescription('Public content and validated submissions; bearer-protected editorial endpoints.').setVersion('1.0').addBearerAuth().build());SwaggerModule.setup('docs',app,spec);}
await app.listen(config.get<number>('PORT')||4000,'0.0.0.0');}
bootstrap().catch(()=>{Logger.error('API startup failed. Check environment and database connectivity.');process.exit(1)});
