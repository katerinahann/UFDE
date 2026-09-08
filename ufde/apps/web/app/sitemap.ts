import type {MetadataRoute} from 'next';
import {routeParams} from '@/lib/routes';
import {localizedPath} from '@ufde/config/messages';
import {siteOrigin} from '@/lib/metadata';
export const dynamic='force-static';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const result:MetadataRoute.Sitemap=[];for(const locale of ['en','fr','uk'] as const){for(const {path} of await routeParams(locale)){result.push({url:new URL(localizedPath(locale,path.length?'/'+path.join('/') : ''),siteOrigin).toString()})}}return result;}
