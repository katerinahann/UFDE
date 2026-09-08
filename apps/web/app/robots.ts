import type {MetadataRoute} from 'next';
import {siteOrigin} from '@/lib/metadata';
import {demoMode} from '@/lib/content';
export const dynamic='force-static';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',...(demoMode?{disallow:'/'}:{allow:'/',disallow:['/admin','/api/admin']})},sitemap:siteOrigin+'/sitemap.xml'}}
