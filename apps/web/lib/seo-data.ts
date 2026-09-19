import type {ContentRecord,Publication,TeamProfile,ActivityDetails} from '@ufde/types';
export function absoluteUrl(value: string | undefined, origin: string): string | undefined {
  if (!value) return undefined;
  try { const u = new URL(value, origin); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : undefined; } catch { return undefined; }
}
export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
export function organizationSchema(origin:string, officialName:string, logo:string|undefined, socials:string[], legalName?:string) {
  return {'@type':'Organization','@id':origin+'/#organization',name:'UFDE',email:'institut.ufde@gmail.com',alternateName:officialName,...(legalName?{legalName}:{}),url:origin,logo:absoluteUrl(logo,origin),address:{'@type':'PostalAddress',streetAddress:'27, boulevard Saint-Martin',postalCode:'75003',addressLocality:'Paris',addressCountry:'FR'},sameAs:socials.map(u=>absoluteUrl(u,origin)).filter(Boolean)};
}
export function contentSchema(origin:string,url:string,item:ContentRecord,details?:ActivityDetails) {
  if(item.isDemo)return null;
  const base={name:item.title,description:item.summary,url,inLanguage:item.locale,image:absoluteUrl(item.image?.url,origin)};
  // Only dated activities with a supplied location qualify as Event descriptions.
  const date=details?.date||item.startDate;
  if(item.kind==='ACTIVITY'&&date&&Number.isFinite(Date.parse(date))&&details?.location)
    return {...base,'@type':'Event',startDate:date,...(item.endDate?{endDate:item.endDate}:{}),location:{'@type':'Place',name:details.location}};
  return {...base,'@type':item.kind==='ACTIVITY'?'Article':'CreativeWork',...(item.kind==='ACTIVITY'?{headline:item.title,datePublished:item.publishedAt||undefined}:{}),publisher:{'@id':origin+'/#organization'}};
}
export function publicationSchema(origin:string,url:string,p:Publication){
  if(p.isDemo||p.status!=='Published')return null;
  return {'@type':p.type==='Research Reports'?'Report':p.type==='Articles & Insights'?'Article':'CreativeWork',name:p.title,...(p.type==='Articles & Insights'?{headline:p.title}:{}),description:p.abstract||p.summary,url,image:absoluteUrl(p.coverImage?.url,origin),inLanguage:p.language,datePublished:p.publishedAt||undefined,author:p.authors.map(name=>({'@type':'Person',name})),publisher:{'@id':origin+'/#organization'},isbn:p.isbn||undefined,identifier:p.doi||undefined,citation:p.citation||undefined,...(absoluteUrl(p.pdfUrl,origin)?{encoding:{'@type':'MediaObject',contentUrl:absoluteUrl(p.pdfUrl,origin),encodingFormat:'application/pdf'}}:{})};
}
export function personSchema(origin:string,p:TeamProfile){return {'@type':'Person','@id':origin+'/team#'+encodeURIComponent(p.id),name:p.name,jobTitle:p.role,description:p.biography,image:absoluteUrl(p.photoUrl,origin),sameAs:[p.linkedin,p.instagram,p.orcid,p.googleScholar,p.institutionalProfile].map(u=>absoluteUrl(u,origin)).filter(Boolean)};}
