import type {Metadata} from 'next';
import {institute,type Locale} from '@ufde/config';
import {localizedPath} from '@ufde/config/messages';
import {demoMode,getPageSEO,getSocialLinks,getGovernance,getWebsiteSettings,getContent,getActivityDetails,getPublication,getTeam,listContent,listPublications} from './content';
import {absoluteUrl,organizationSchema,contentSchema,publicationSchema,personSchema} from './seo-data';
const configuredOrigin=process.env.NEXT_PUBLIC_SITE_URL;
if(process.env.NEXT_PUBLIC_DEMO_MODE==='false'&&!configuredOrigin)throw new Error('NEXT_PUBLIC_SITE_URL is required for live SEO');
const originUrl=new URL(configuredOrigin||'http://localhost:3000');
if(originUrl.username||originUrl.password||!['http:','https:'].includes(originUrl.protocol)||(process.env.NEXT_PUBLIC_DEMO_MODE==='false'&&originUrl.protocol!=='https:'))throw new Error('Site URL must be a public HTTPS origin in live mode');
export const siteOrigin=originUrl.origin;
export const fallbackImage='/images/ufde-opengraph.png';
export async function metadataFor(locale:Locale,path:string,title:string,description:string,image?:string):Promise<Metadata> {
 const seo=await getPageSEO(path.replace(/^\//,'')||'home',locale);
 const english:Record<string,string>={'':'UFDE | Ukrainian-French Institute','/about':'About UFDE | Ukrainian-French Institute','/projects':'Projects | UFDE','/publications':'Publications | UFDE','/governance-transparency':'Governance & Transparency | UFDE'};
 title=seo?.title||(locale==='en'&&english[path])||(title.includes(' | ')?title:title+' | UFDE');description=seo?.description||description;
 image=absoluteUrl(seo?.image?.url||image,siteOrigin)||new URL(fallbackImage,siteOrigin).href;
 const canonical=absoluteUrl(seo?.canonicalUrl,siteOrigin)||new URL(localizedPath(locale,path),siteOrigin).href;
 const segments=path.split('/').filter(Boolean);
 const available=await Promise.all((['en','fr','uk'] as const).map(async l=>{
  if(segments.length===2&&['activities','projects','publications'].includes(segments[0])){
   const records=segments[0]==='publications'?await listPublications(l):await listContent(segments[0]==='activities'?'ACTIVITY':'PROJECT',l);
   if(!records.some(r=>r.slug===segments[1]))return null;
  }
  return [l,new URL(localizedPath(l,path),siteOrigin).href] as const;
 }));
 const languages:Record<string,string>=Object.fromEntries(available.filter((v):v is NonNullable<typeof v>=>v!==null));
 if(languages.en)languages['x-default']=languages.en;
 const images=[{url:image,alt:title,...(image.endsWith(fallbackImage)?{width:1200,height:630}:{})}];
 return {metadataBase:new URL(siteOrigin),title,description,alternates:{canonical,languages},robots:(demoMode||seo?.noIndex)?{index:false,follow:false}:{index:true,follow:true},openGraph:{type:'website',title,description,url:canonical,siteName:institute.acronym,locale:{en:'en_GB',fr:'fr_FR',uk:'uk_UA'}[locale],images},twitter:{card:'summary_large_image',title,description,images:[image]}};
}
export async function structuredPage(locale:Locale,path:string,title:string,description:string){
 const url=new URL(localizedPath(locale,path),siteOrigin).href;
 const graph:unknown[]=[{'@type':'WebPage','@id':url+'#webpage',name:title,description,inLanguage:locale,url,isPartOf:{'@id':siteOrigin+'/#website'}},{'@type':'WebSite','@id':siteOrigin+'/#website',name:'UFDE',url:siteOrigin,publisher:{'@id':siteOrigin+'/#organization'}}];
 if(!demoMode){
  const [socials,governance,settings]=await Promise.all([getSocialLinks(),getGovernance(locale),getWebsiteSettings(locale)]);
  graph.push(organizationSchema(siteOrigin,institute.name,settings.logo?.url||(institute.logo.supplied?institute.logo.dark:undefined),socials.map(s=>s.url),governance.legal.officialName||undefined));
  const [kind,slug]=path.slice(1).split('/');
  if(slug&&kind==='publications'){const p=await getPublication(slug,locale);if(p)graph.push(publicationSchema(siteOrigin,url,p));}
  else if(slug&&(kind==='activities'||kind==='projects')){const item=await getContent(slug,locale,kind==='activities'?'ACTIVITY':'PROJECT');if(item)graph.push(contentSchema(siteOrigin,url,item,kind==='activities'?await getActivityDetails(slug,locale):undefined));}
  if(path==='/team')graph.push(...(await getTeam(locale)).map(p=>personSchema(siteOrigin,p)));
 }
 return {'@context':'https://schema.org','@graph':graph.filter(Boolean)};
}
