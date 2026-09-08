import 'dotenv/config';
import {PrismaClient} from '../src/generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import {aboutProfile} from '@ufde/config/about';
import {demoRecords} from '@ufde/config/demo';
import {dictionary,pageKeys} from '@ufde/config/messages';
if(process.env.NODE_ENV==='production'||process.env.ALLOW_DEMO_SEED!=='true')throw new Error('Demo seed requires ALLOW_DEMO_SEED=true outside production');
const db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
async function main(){await db.siteSetting.upsert({where:{key:"aboutProfile"},create:{key:"aboutProfile",value:JSON.parse(JSON.stringify(aboutProfile))},update:{}});for(const slug of new Set(demoRecords.map(r=>r.slug))){const records=demoRecords.filter(r=>r.slug===slug);if(await db.content.findUnique({where:{slug}}))continue;await db.content.create({data:{slug,kind:records[0].kind,isDemo:true,published:true,translations:{create:records.map(({locale,title,summary,body,category})=>({locale,title,summary,body,category}))}}});}for(const locale of ['en','fr','uk'] as const){for(const slug of pageKeys){await db.page.upsert({where:{slug_locale:{slug,locale}},create:{slug,locale,blocks:dictionary(locale).pages[slug],approved:false},update:{}})}}}
main().finally(()=>db.$disconnect());
