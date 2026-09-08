import {Controller,Post,Body,Req,HttpCode,HttpException} from '@nestjs/common';
import type {Request} from 'express';
import {ConfigService} from '@nestjs/config';
import {createHmac} from 'node:crypto';
import {Throttle,SkipThrottle} from '@nestjs/throttler';
import {ApiTags,ApiResponse} from '@nestjs/swagger';
import {PrismaService} from './prisma.service';
import {ContactDto,NewsletterDto} from './dto';
import {ContactMailService} from './contact-mail.service';
import {contactClientIp} from './contact-security';
@ApiTags('Enquiries and subscriptions') @Controller()
export class FormsController {
 constructor(private readonly db:PrismaService,private readonly config:ConfigService,private readonly mail:ContactMailService){}
 @Post('contact') @SkipThrottle() @ApiResponse({status:201,description:'Enquiry stored and notification queued.'})
 async contact(@Body() dto:ContactDto,@Req() req:Request){const {website,acknowledgement,...data}=dto;const secret=this.config.get<string>('CONTACT_RATE_SECRET')||this.config.get<string>('ADMIN_API_TOKEN')||'local-development-only';const hash=(s:string)=>createHmac('sha256',secret).update(s).digest('hex');const ip=contactClientIp(req,this.config.get('CONTACT_PROXY_SECRET'));const dedupe='contact-dedupe:'+hash(JSON.stringify(data));const now=Date.now();const reference=await this.db.$transaction(async tx=>{await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${dedupe}))`;const prior=(await tx.siteSetting.findUnique({where:{key:dedupe}}))?.value as {reference:string;at:number}|undefined;if(prior&&now-prior.at<600000)return prior.reference;
 for(const [key,ttl,limit] of [['contact-rate:'+hash('email:'+dto.email),3600000,3],['contact-rate:'+hash('ip:'+ip),60000,5]].sort((a,b)=>String(a[0]).localeCompare(String(b[0]))) as [string,number,number][]){await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;const current=(await tx.siteSetting.findUnique({where:{key}}))?.value as {count:number;at:number}|undefined;const value=current&&now-current.at<ttl?{...current,count:current.count+1}:{count:1,at:now};if(value.count>limit)throw new HttpException('Too many requests. Try again later.',429);await tx.siteSetting.upsert({where:{key},create:{key,value},update:{value}});}
 const row=await tx.contactSubmission.create({data:{...data,consentVersion:'privacy-notice-2026-09'}});for(const kind of ['notify',...(acknowledgement?['ack']:[])]){const key='contact-mail:'+row.id+':'+kind;await tx.siteSetting.create({data:{key,value:{reference:row.id,kind,state:'queued',attempts:0,nextAt:now,createdAt:now}}});}await tx.siteSetting.upsert({where:{key:dedupe},create:{key:dedupe,value:{reference:row.id,at:now}},update:{value:{reference:row.id,at:now}}});await tx.siteSetting.deleteMany({where:{OR:[{key:{startsWith:'contact-rate:'}},{key:{startsWith:'contact-dedupe:'}}],updatedAt:{lt:new Date(now-86400000)}}});return row.id;});void this.mail.processPending().catch(()=>{});return {status:'received',reference};}
 @Post('newsletter') @HttpCode(202) @Throttle({default:{limit:3,ttl:60000}})
 async subscribe(@Body() dto:NewsletterDto){await this.db.newsletterSubscriber.upsert({where:{email:dto.email},create:{email:dto.email,locale:dto.locale.toUpperCase() as 'EN'|'FR'|'UK',consentVersion:'2026-09-v1',consentedAt:new Date(),status:'PENDING'},update:{}});return {status:'received'};}
}
