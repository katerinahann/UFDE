import 'dotenv/config';
import {PrismaClient} from '../src/generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';

// Explicit opt-in. Never seed public content, real people, legal records or partnerships.
if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEMO_SEED !== 'true' || !process.env.DATABASE_URL) {
  throw new Error('DEMO seed requires DATABASE_URL and ALLOW_DEMO_SEED=true outside production');
}
const db = new PrismaClient({adapter: new PrismaPg({connectionString: process.env.DATABASE_URL})});
const locales = ['EN', 'FR', 'UK'] as const;
const labels = {EN: 'DEMO — development placeholder', FR: 'DÉMO — exemple de développement', UK: 'ДЕМО — приклад для розробки'};
const text = locales.map(locale => ({locale, title: labels[locale], summary: labels[locale]}));
async function main() {
  await db.$transaction(async tx => {
    const role = await tx.role.upsert({where:{slug:'demo-preview'}, update:{}, create:{slug:'demo-preview', name:'DEMO preview only', permissions:['content:preview']}});
    await tx.user.upsert({where:{email:'demo.editor@example.invalid'}, update:{}, create:{slug:'demo-editor', email:'demo.editor@example.invalid', name:'DEMO editor (inactive)', active:false, isDemo:true, roles:{create:{roleId:role.id}}}});
    await tx.siteSettings.upsert({where:{id:'site'},update:{},create:{id:'site',siteName:'DEMO UFDE development workspace',isDemo:true}});
    const area = await tx.strategicArea.upsert({where:{slug:'demo-area'},update:{},create:{slug:'demo-area',isDemo:true,published:false,translations:{create:text}}});
    const categories = locales.map(locale=>({locale,name:labels[locale]}));
    const activityCategory = await tx.activityCategory.upsert({where:{slug:'demo-activity-category'},update:{},create:{slug:'demo-activity-category',isDemo:true,translations:{create:categories}}});
    const projectCategory = await tx.projectCategory.upsert({where:{slug:'demo-project-category'},update:{},create:{slug:'demo-project-category',isDemo:true,translations:{create:categories}}});
    const media = await tx.media.upsert({where:{slug:'demo-illustration'},update:{},create:{slug:'demo-illustration',url:'/images/paris.webp',filename:'paris.webp',mimeType:'image/webp',visibility:'PRIVATE',isDemo:true,translations:{create:locales.map(locale=>({locale,altText:labels[locale]}))}}});
    await tx.activity.upsert({where:{slug:'demo-activity'},update:{},create:{slug:'demo-activity',isDemo:true,published:false,categoryId:activityCategory.id,strategicAreaId:area.id,coverId:media.id,translations:{create:text.map(t=>({...t,body:t.summary}))},images:{create:{mediaId:media.id}}}});
    await tx.project.upsert({where:{slug:'demo-project'},update:{},create:{slug:'demo-project',isDemo:true,published:false,status:'PLANNED',categoryId:projectCategory.id,strategicAreaId:area.id,coverId:media.id,translations:{create:text}}});
    const author = await tx.publicationAuthor.upsert({where:{slug:'demo-author'},update:{},create:{slug:'demo-author',name:'DEMO author placeholder',isDemo:true}});
    await tx.publication.upsert({where:{slug:'demo-publication'},update:{},create:{slug:'demo-publication',type:'WORKING_PAPER',status:'DRAFT',isDemo:true,published:false,translations:{create:text.map(t=>({...t,abstract:t.summary}))},authors:{create:{authorId:author.id}}}});
    const expertise = await tx.expertise.upsert({where:{slug:'demo-expertise'},update:{},create:{slug:'demo-expertise',isDemo:true,translations:{create:categories}}});
    await tx.teamMember.upsert({where:{slug:'demo-member'},update:{},create:{slug:'demo-member',name:'DEMO person placeholder',isDemo:true,published:false,translations:{create:locales.map(locale=>({locale,role:labels[locale],biography:labels[locale]}))},expertise:{create:{expertiseId:expertise.id}}}});
    // Unpublished layout placeholders: intentionally no logos, affiliations or files.
    await tx.partner.upsert({where:{slug:'demo-partner-placeholder'},update:{},create:{slug:'demo-partner-placeholder',name:'DEMO partner layout placeholder — no partnership',isDemo:true,published:false,translations:{create:locales.map(locale=>({locale,description:labels[locale]}))}}});
    await tx.document.upsert({where:{slug:'demo-document-placeholder'},update:{},create:{slug:'demo-document-placeholder',type:'DEMO_LAYOUT',status:'DRAFT',isDemo:true,public:false,published:false,translations:{create:text.map(({locale,title,summary})=>({locale,title,description:summary}))}}});
    for (const locale of locales) await tx.pageSEO.upsert({where:{slug_locale:{slug:'demo-preview',locale}},update:{},create:{slug:'demo-preview',locale,title:labels[locale],noIndex:true}});
    // No subscribers, contact messages or partnership joins: these require actual actions/approval.
  });
  console.info('Unpublished DEMO fixtures seeded. Existing records were not overwritten.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>db.$disconnect());
