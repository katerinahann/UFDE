import {Controller,Get,Query,Param,NotFoundException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {ApiTags} from '@nestjs/swagger';
import {PrismaService} from './prisma.service';
import {ListQuery} from './dto';
@ApiTags('Published content')
@Controller()
export class ContentController {
 constructor(private readonly db:PrismaService,private readonly config:ConfigService){}
 @Get('content') async list(@Query() q:ListQuery){const rows=await this.db.content.findMany({where:{published:true,...(this.config.get('DEMO_MODE')==='true'?{}:{isDemo:false}),...(q.kind?{kind:q.kind}:{}),translations:{some:{locale:q.locale}}},include:{translations:{where:{locale:q.locale}},image:true},take:q.limit,skip:q.offset,orderBy:[{publishedAt:'desc'},{id:'asc'}]});return rows.map(({translations,...r})=>({...r,...translations[0],id:r.id}));}
 @Get('content/:slug') async detail(@Param('slug') slug:string,@Query() q:ListQuery){const row=await this.db.content.findFirst({where:{slug,published:true,...(this.config.get('DEMO_MODE')==='true'?{}:{isDemo:false})},include:{translations:{where:{locale:q.locale}},image:true}});if(!row || !row.translations[0])throw new NotFoundException();const {translations,...r}=row;return {...r,...translations[0],id:r.id};}
 @Get('pages/:slug') async page(@Param('slug') slug:string,@Query() q:ListQuery){const page=await this.db.page.findUnique({where:{slug_locale:{slug,locale:q.locale}}});if(!page?.approved)throw new NotFoundException();return page;}
 @Get('settings') async settings(){const setting=await this.db.siteSetting.findUnique({where:{key:'hero'}});return {hero:setting?.value??null};}
 @Get('team') async team(@Query() q:ListQuery){const rows=await this.db.teamMember.findMany({where:{published:true},orderBy:[{order:'asc'},{id:'asc'}],take:q.limit,skip:q.offset});return rows.map(r=>({...r,role:(r.role as Record<string,string>)[q.locale]||'',biography:(r.biography as Record<string,string>)[q.locale]||''}));}
}
