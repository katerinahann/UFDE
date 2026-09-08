import type {Metadata} from 'next';
import {institute,type Locale} from '@ufde/config';
import {localizedPath} from '@ufde/config/messages';
import {demoMode,getPageSEO} from './content';
export const siteOrigin=process.env.NEXT_PUBLIC_SITE_URL||'https://ufde-institute.jazzy-coati-6980.chatgpt.site';
export async function metadataFor(locale:Locale,path:string,title:string,description:string,image?:string):Promise<Metadata> {
 const seo=await getPageSEO(path.replace(/^\//,'')||'home',locale);
 title=seo?.title||title;description=seo?.description||description;image=seo?.image?.url||image;
 const canonical=seo?.canonicalUrl||new URL(localizedPath(locale,path),siteOrigin).toString();
 const images=image?[{url:new URL(image,siteOrigin).toString(),alt:title}]:[];
 return {metadataBase:new URL(siteOrigin),title,description,alternates:{canonical,languages:{en:new URL(path||'/',siteOrigin).toString(),fr:new URL('/fr'+path,siteOrigin).toString(),uk:new URL('/uk'+path,siteOrigin).toString(),'x-default':new URL(path||'/',siteOrigin).toString()}},robots:(demoMode||seo?.noIndex)?{index:false,follow:false}:{index:true,follow:true},openGraph:{type:'website',title,description,url:canonical,siteName:institute.acronym,locale:{en:'en_GB',fr:'fr_FR',uk:'uk_UA'}[locale],images},twitter:{card:image?'summary_large_image':'summary',title,description,images:images.map(x=>x.url)}};
}
export function structuredPage(locale:Locale,path:string,title:string,description:string){return {'@context':'https://schema.org','@type':'WebPage',name:title,description,inLanguage:locale,url:new URL(localizedPath(locale,path),siteOrigin).toString(),isPartOf:{'@type':'WebSite',name:institute.acronym,url:siteOrigin}};}
