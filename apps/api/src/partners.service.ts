import {mkdir,writeFile,unlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Injectable,BadRequestException,ServiceUnavailableException} from '@nestjs/common';
import {PrismaService} from './prisma.service';
import type {Partner} from '@ufde/types';
import type {PartnersDto} from './dto';
@Injectable()
export class PartnersService {
 constructor(private db:PrismaService){}
 async uploadLogo(buffer?:Buffer){if(!buffer||buffer.length>2097152)throw new BadRequestException('Upload a PNG, JPEG or WebP logo up to 2 MB');const extension=logoExtension(buffer);if(!extension)throw new BadRequestException('PNG, JPEG and WebP files only');const directory=process.env.PARTNER_LOGO_DIRECTORY,base=process.env.PARTNER_LOGO_PUBLIC_BASE_URL;if(!directory||!base)throw new ServiceUnavailableException('Logo upload storage is not configured');const publicBase=new URL(base);if(publicBase.protocol!=='https:'&&process.env.NODE_ENV==='production')throw new ServiceUnavailableException('Logo URL must use HTTPS');const filename=randomUUID()+'.'+extension;await mkdir(resolve(directory),{recursive:true});const path=join(resolve(directory),filename);await writeFile(path,buffer,{flag:'wx'});try{return await this.db.asset.create({data:{url:base.replace(/\/$/,'')+'/'+filename,alt:'Administrator-uploaded partner logo'}})}catch(e){await unlink(path);throw e;}}
 async all():Promise<Partner[]>{const setting=await this.db.siteSetting.findUnique({where:{key:'partners'}});return (Array.isArray(setting?.value)?setting.value:[]) as unknown as Partner[];}
 async published(){return (await this.all()).filter(p=>p.published===true&&p.logo?.url).sort((a,b)=>a.sortOrder-b.sortOrder||a.name.localeCompare(b.name));}
 async resolve(references:{id:string}[]=[]){const ids=new Set(references.map(p=>p.id));return (await this.published()).filter(p=>ids.has(p.id));}
 async save(dto:PartnersDto){if(new Set(dto.partners.map(p=>p.id)).size!==dto.partners.length||new Set(dto.partners.map(p=>p.slug)).size!==dto.partners.length)throw new BadRequestException('Partner ids and slugs must be unique');for(const p of dto.partners){if(p.published&&!p.logo)throw new BadRequestException('Published partners require an administrator-supplied logo');if(p.logo&&!await this.db.asset.findFirst({where:{url:p.logo.url}}))throw new BadRequestException('Register the uploaded logo in Assets before linking it');}const value=JSON.parse(JSON.stringify(dto.partners));return this.db.siteSetting.upsert({where:{key:'partners'},create:{key:'partners',value},update:{value}});}
}

export function logoExtension(buffer:Buffer){if(buffer.length<16)return null;if(buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png';if(buffer[0]===255&&buffer[1]===216&&buffer[2]===255)return 'jpg';if(buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP')return 'webp';return null;}
