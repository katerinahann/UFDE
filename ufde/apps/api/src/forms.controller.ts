import {Controller,Post,Body,HttpCode} from '@nestjs/common';
import {Throttle} from '@nestjs/throttler';
import {ApiTags,ApiResponse} from '@nestjs/swagger';
import {PrismaService} from './prisma.service';
import {ContactDto,NewsletterDto} from './dto';
@ApiTags('Enquiries and subscriptions')
@Controller()
export class FormsController {
 constructor(private readonly db:PrismaService){}
 @Post('contact') @Throttle({default:{limit:5,ttl:60000}}) @ApiResponse({status:201,description:'Enquiry recorded; no email delivery is implied.'})
 async contact(@Body() dto:ContactDto){const {consent,website,...data}=dto;const row=await this.db.contactSubmission.create({data:{...data,consentVersion:'2026-09-v1'}});return {status:'received',reference:row.id};}
 @Post('newsletter') @HttpCode(202) @Throttle({default:{limit:3,ttl:60000}})
 async subscribe(@Body() dto:NewsletterDto){await this.db.subscriber.upsert({where:{email:dto.email},create:{email:dto.email,locale:dto.locale,consentVersion:'2026-09-v1'},update:{}});return {status:'received'};}
}
