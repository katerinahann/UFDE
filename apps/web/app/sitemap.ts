import type {MetadataRoute} from 'next';
import {routeParams} from '@/lib/routes';
import {localizedPath} from '@ufde/config/messages';
import {siteOrigin} from '@/lib/metadata';
import {demoMode,getPageSEO} from '@/lib/content';
// CMS-driven at each deployment: static hosting requires rebuilding on publication.
export const dynamic='force-static';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 if(demoMode)return [];
 const result:MetadataRoute.Sitemap=[];
 for(const locale of ['en','fr','uk'] as const)for(const {path} of await routeParams(locale)){
  const route=path.length?'/'+path.join('/'):'';
  const seo=await getPageSEO(path.join('/')||'home',locale);
  const url=new URL(localizedPath(locale,route),siteOrigin).href;
  if(seo?.noIndex||(seo?.canonicalUrl&&new URL(seo.canonicalUrl,siteOrigin).href!==url))continue;
  result.push({url});
 }
 return result;
}
