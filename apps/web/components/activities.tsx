import Image from 'next/image';
import {getPartnerLabel} from '@/lib/content';
import type {Locale} from '@ufde/config';
import type {ContentRecord} from '@ufde/types';
import {dictionary,localizedPath} from '@ufde/config/messages';
import {activityLabels,categoryLabel} from '@ufde/config/activities';
import {Container,Section,Breadcrumbs,Heading1,SectionHeading,StatusBadge,PDFDownload,OutlineButton,EmptyState} from '@ufde/ui';
import {getHero,listContent,getActivityDetails,safeImage} from '@/lib/content';
import {ActivityCarousel} from './activity-carousel';
import {PartnerStrip} from './partner-strip';
function sanitize(records:ContentRecord[]){return records.map(r=>({...r,image:r.image&&safeImage(r.image.url)?r.image:null}));}
export async function Activities({locale,item}:{locale:Locale;item?:ContentRecord}){
 const partnerTitle=await getPartnerLabel(locale);
 const l=activityLabels[locale],d=dictionary(locale),href=(p:string)=>localizedPath(locale,p),hero=await getHero();
 const result=await listContent('ACTIVITY',locale).then(rows=>({rows:sanitize(rows),failed:false})).catch(()=>({rows:[],failed:true}));
 const details=item?await getActivityDetails(item.slug,locale):null;
 const photo=item?.image&&safeImage(item.image.url)?item.image:{url:hero.src,alt:hero.alt};
 const related=result.rows.filter(r=>r.id!==item?.id).sort((a,b)=>Number(b.category===item?.category)-Number(a.category===item?.category)).slice(0,6);
 return <div className="activities-page"><section className="activities-hero"><Image src={photo.url} alt={photo.alt} fill priority sizes="100vw"/><div className="activities-shade"/><Container><Breadcrumbs items={[{label:d.nav[0],href:href('')},{label:l.title,...(item?{href:href('/activities')}:{})},...(item?[{label:item.title}]:[])]}/>{item?.isDemo&&<StatusBadge tone="demo">{l.demo}</StatusBadge>}<Heading1>{item?.title||l.title}</Heading1><p>{item?.summary||l.subtitle}</p></Container></section>
 {!item?<Section><Container className="activities-wide">{result.failed?<EmptyState title={d.unavailable}/>:<ActivityCarousel records={result.rows} locale={locale}/>}</Container></Section>:<><Section><Container><dl className="activity-facts">{[[l.date,details?.date||item.publishedAt?new Intl.DateTimeFormat(locale,{dateStyle:'long',timeZone:'UTC'}).format(new Date(details?.date||item.publishedAt!)):l.pending],[l.location,details?.location||l.pending],[l.category,categoryLabel(item.category,locale)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><article className="activity-body">{item.body.split(/\n\n/).map((p,i)=><p key={i}>{p}</p>)}<div className="uf-actions">{details?.programmeUrl&&<PDFDownload href={details.programmeUrl} label={l.programme}/>} {details?.eventUrl&&<OutlineButton href={details.eventUrl} target="_blank" rel="noopener noreferrer">{l.register}</OutlineButton>}</div></article></Container></Section><Section tone="soft"><Container><SectionHeading title={l.gallery} underline/>{details?.gallery.length?<div className="activity-gallery">{details.gallery.filter(p=>safeImage(p.url)).map(p=><figure key={p.url}><Image src={p.url} alt={p.alt} width={900} height={600}/>{p.credit&&<figcaption>{p.credit}</figcaption>}</figure>)}</div>:<EmptyState title={l.noPhotos}/>}</Container></Section><Section><Container><SectionHeading title={partnerTitle} underline/>{details?.partners.length?<PartnerStrip partners={details.partners} locale={locale} grid label={partnerTitle}/>:<EmptyState title={l.noPartners}/>}</Container></Section><Section tone="soft"><Container className="activities-wide"><SectionHeading title={l.related} underline/>{result.failed?<EmptyState title={d.unavailable}/>:<ActivityCarousel records={related} locale={locale} filters={false}/>}</Container></Section></>}
 {photo.url===hero.src&&<Container><p className="home-photo-credit">{d.photo}: <a href={hero.source}>{hero.credit}</a> · <a href={hero.license}>CC BY-SA 2.0</a> · {d.cropped}</p></Container>}</div>;
}
