import 'server-only';
import {cache} from 'react';
import {institute,type Locale} from '@ufde/config';
import {demoRecords} from '@ufde/config/demo';
import {dictionary,type PageKey} from '@ufde/config/messages';
import type {ContentRecord,ContentKind} from '@ufde/types';
export const demoMode=process.env.NEXT_PUBLIC_DEMO_MODE!=='false';
const api=process.env.API_INTERNAL_URL||process.env.NEXT_PUBLIC_API_URL;
async function request(path:string){if(!api)throw new Error('Content API is not configured');const r=await fetch(api+path,{next:{revalidate:60},signal:AbortSignal.timeout(6000)});if(r.status===404)return null;if(!r.ok)throw new Error('Content is unavailable');return r.json();}
export const listContent=cache(async(kind:ContentKind,locale:Locale):Promise<ContentRecord[]>=>{if(demoMode)return demoRecords.filter(r=>r.kind===kind&&r.locale===locale);const rows:ContentRecord[]=[];for(let offset=0;offset<10000;offset+=100){const batch=await request('/content?kind='+kind+'&locale='+locale+'&limit=100&offset='+offset);rows.push(...batch);if(batch.length<100)break;}return rows;});
export const getContent=cache(async(slug:string,locale:Locale):Promise<ContentRecord|null>=>demoMode?demoRecords.find(r=>r.slug===slug&&r.locale===locale)||null:request('/content/'+encodeURIComponent(slug)+'?locale='+locale));
export const getPage=cache(async(key:PageKey,locale:Locale):Promise<string[]>=>{const fallback=dictionary(locale).pages[key];if(demoMode)return fallback;const page=await request('/pages/'+key+'?locale='+locale);return Array.isArray(page?.blocks)?page.blocks:fallback;});
export const getTeam=cache(async(locale:Locale):Promise<{id:string;name:string;role:string;biography:string;photoUrl?:string;photoAlt?:string}[]>=>demoMode?[]:request('/team?locale='+locale+'&limit=100'));
export function safeImage(url:string){if(/^\/images\/[a-zA-Z0-9/_\-.]+$/.test(url))return url;try{const u=new URL(url);const hosts=(process.env.NEXT_PUBLIC_IMAGE_HOSTS||'').split(',');if(u.protocol==='https:'&&hosts.includes(u.hostname))return url;}catch{}return null;}
export const getHero=cache(async()=>{const fallback={...institute.hero,src:String(institute.hero.src),alt:String(institute.hero.alt)};if(demoMode)return fallback;const settings=await request('/settings');const hero=settings?.hero;if(hero&&safeImage(hero.url))return {...fallback,src:hero.url,alt:hero.alt,credit:hero.credit||'',source:hero.url,license:hero.licenseUrl||''};return fallback;});

export const getPartners=cache(async():Promise<import('@ufde/types').PartnerRecord[]>=>{if(demoMode){const {demoPartners}=await import('@ufde/config/partners');return demoPartners;}const settings=await request('/settings');return Array.isArray(settings?.partners)?settings.partners.filter((p:import('@ufde/types').PartnerRecord)=>p && typeof p.name==='string' && typeof p.id==='string' && !p.isDemo).map((p:import('@ufde/types').PartnerRecord)=>({id:p.id,name:p.name,isDemo:false,logoUrl:typeof p.logoUrl==='string'?safeImage(p.logoUrl)||undefined:undefined,logoAlt:typeof p.logoAlt==='string'?p.logoAlt:p.name,href:typeof p.href==='string'&&p.href.startsWith('https://')?p.href:undefined})):[];});

export const getAboutProfile=cache(async():Promise<import('@ufde/config/about').AboutProfile>=>{const {aboutProfile}=await import('@ufde/config/about');if(demoMode)return aboutProfile;const settings=await request('/settings');const profile:import('@ufde/config/about').AboutProfile=settings?.aboutProfile || aboutProfile;const photos=profile.photos.filter(p=>safeImage(p.url));return {...profile,photos:photos.length?photos:aboutProfile.photos};});

export const getActivityDetails=cache(async(slug:string,locale:Locale):Promise<import('@ufde/types').ActivityDetails>=>{const empty={gallery:[],partners:[]};if(demoMode)return empty;return await request('/activity-details/'+encodeURIComponent(slug)+'?locale='+locale)||empty;});
