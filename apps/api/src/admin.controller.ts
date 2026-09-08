import {Controller,Get,Post,Put,Delete,Body,Param,Query,UseGuards,BadRequestException,NotFoundException} from '@nestjs/common';
import {ApiBearerAuth,ApiTags} from '@nestjs/swagger';
import {PrismaService} from './prisma.service';
import {AdminGuard} from './admin.guard';
import {ContentDto,AssetDto,PageDto,TeamDto,ListQuery,PartnersDto} from './dto';
@ApiTags('Editorial administration') @ApiBearerAuth() @UseGuards(AdminGuard) @Controller('admin')
export class AdminController {
 constructor(private readonly db:PrismaService){}
 @Get('content') list(@Query() q:ListQuery){return this.db.content.findMany({include:{translations:true,image:true},take:q.limit,skip:q.offset,orderBy:{updatedAt:'desc'}})}
 @Put('content/:slug') async save(@Param('slug') slug:string,@Body() dto:ContentDto){if(slug!==dto.slug)throw new BadRequestException('Slug mismatch');if(new Set(dto.translations.map(t=>t.locale)).size!==dto.translations.length)throw new BadRequestException('Duplicate locale');if(dto.published&&!dto.isDemo&&!dto.publishedAt)throw new BadRequestException('Published content needs a publication date');const {translations,publishedAt,...data}=dto;return this.db.$transaction(async tx=>{const item=await tx.content.upsert({where:{slug},create:{...data,publishedAt:publishedAt?new Date(publishedAt):null},update:{...data,publishedAt:publishedAt?new Date(publishedAt):null}});await tx.contentTranslation.deleteMany({where:{contentId:item.id}});await tx.contentTranslation.createMany({data:translations.map(t=>({...t,contentId:item.id}))});return item;});}
 @Delete('content/:id') async remove(@Param('id') id:string){await this.db.content.delete({where:{id}});return {deleted:true}}
 @Post('assets') asset(@Body() dto:AssetDto){return this.db.asset.create({data:dto})}
 @Get('assets') assets(@Query() q:ListQuery){return this.db.asset.findMany({take:q.limit,skip:q.offset,orderBy:{createdAt:'desc'}})}
 @Put('settings/hero/:assetId') async hero(@Param('assetId') id:string){const asset=await this.db.asset.findUnique({where:{id}});if(!asset)throw new NotFoundException();return this.db.siteSetting.upsert({where:{key:'hero'},create:{key:'hero',value:asset},update:{value:asset}})}
 @Put('pages/:slug') page(@Param('slug') slug:string,@Body() dto:PageDto){if(slug!==dto.slug)throw new BadRequestException('Slug mismatch');return this.db.page.upsert({where:{slug_locale:{slug,locale:dto.locale}},create:dto,update:dto})}
 @Put('settings/partners') partners(@Body() dto:PartnersDto){return this.db.siteSetting.upsert({where:{key:'partners'},create:{key:'partners',value:JSON.parse(JSON.stringify(dto.partners))},update:{value:JSON.parse(JSON.stringify(dto.partners))}})}
 @Get('pages') pages(@Query() q:ListQuery){return this.db.page.findMany({take:q.limit,skip:q.offset,orderBy:{updatedAt:'desc'}})}
 @Post('team') team(@Body() dto:TeamDto){this.validateTeam(dto);return this.db.teamMember.create({data:dto})}
 @Put('team/:id') updateTeam(@Param('id') id:string,@Body() dto:TeamDto){this.validateTeam(dto);return this.db.teamMember.update({where:{id},data:dto})}
 @Delete('team/:id') async removeTeam(@Param('id') id:string){await this.db.teamMember.delete({where:{id}});return {deleted:true}}
 @Get('contacts') contacts(@Query() q:ListQuery){return this.db.contactSubmission.findMany({take:q.limit,skip:q.offset,orderBy:{createdAt:'desc'}})}
 @Delete('contacts/:id') async deleteContact(@Param('id') id:string){await this.db.contactSubmission.delete({where:{id}});return {deleted:true}}
 @Get('subscribers') subscribers(@Query() q:ListQuery){return this.db.subscriber.findMany({take:q.limit,skip:q.offset,orderBy:{createdAt:'desc'}})}
 @Delete('subscribers/:id') async unsubscribe(@Param('id') id:string){await this.db.subscriber.delete({where:{id}});return {deleted:true}}
 private validateTeam(dto:TeamDto){for(const obj of [dto.role,dto.biography])if(Object.keys(obj).some(k=>!['en','fr','uk'].includes(k))||Object.values(obj).some(v=>typeof v!=='string'||v.length>10000))throw new BadRequestException('Invalid localized text');if(dto.photoUrl&&!dto.photoAlt)throw new BadRequestException('Photo alt text required');}
}
