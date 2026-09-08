import {getStrategicAreas} from './content';
import Link from 'next/link';
import Image from 'next/image';
import {notFound} from 'next/navigation';
import {ArrowRight,ArrowLeft,FileText,Mail,MapPin,Phone,Users,BookOpen} from 'lucide-react';
import {institute,type Locale} from '@ufde/config';
import {dictionary,pageKeys,localizedPath,type PageKey} from '@ufde/config/messages';
import type {ContentKind,ContentRecord} from '@ufde/types';
import {DemoBadge,Eyebrow} from '@ufde/ui';
import {Header,Footer,PreviewNotice} from '@/components/site-shell';
import {PartnerStrip} from '@/components/partner-strip';
import {getPartners,getPartnerLabel,getAboutProfile} from './content';
import {strategicAreas,strategicAreaSlugs} from '@ufde/config/strategic-areas';
import {StrategicAreas} from '@/components/strategic-areas';
import {Activities} from '@/components/activities';
import {activityLabels} from '@ufde/config/activities';
import {Projects} from '@/components/projects';
import {projectLabels} from '@ufde/config/projects';
import {Publications} from '@/components/publications';
import {publicationLabels} from '@ufde/config/publications';
import {listPublications,getPublication} from './content';
import {Team} from '@/components/team';
import {teamLabels,teamHero} from '@ufde/config/team';
import {Governance} from '@/components/governance';
import {governanceLabels} from '@ufde/config/governance';
import {Contact} from '@/components/contact';
import {contactLabels} from '@ufde/config/contact';
import {About} from '@/components/about';
import {Home} from '@/components/home';
import {EnquiryForm} from '@/components/forms';
import {listContent,getContent,getPage,getTeam,demoMode,safeImage} from './content';
import {metadataFor,structuredPage} from './metadata';
export type RouteProps={params:Promise<{path?:string[]}>};
const kinds:Record<string,ContentKind>={activities:'ACTIVITY',projects:'PROJECT',publications:'PUBLICATION'};
export async function routeParams(locale:Locale){const paths:{path:string[]}[]=[{path:[]},...pageKeys.map(key=>({path:[key]})),...(await getStrategicAreas(locale)).map(({slug})=>({path:['strategic-areas',slug]}))];for(const [name,kind] of Object.entries(kinds)){const records=kind==='PUBLICATION'?await listPublications(locale):await listContent(kind,locale);for(const r of records)paths.push({path:[name,r.slug]});}return paths;}
export async function routeMetadata(locale:Locale,props:RouteProps){const {path=[]}=await props.params;const d=dictionary(locale);if(!path.length)return metadataFor(locale,'',d.fullName,d.home.description,institute.hero.src);if(path[0]==='publications'&&path.length<=2){const p=path[1]?await getPublication(path[1],locale):null;if(path[1]&&!p)notFound();return metadataFor(locale,'/'+path.join('/'),p?.title||publicationLabels[locale].title,p?.summary||publicationLabels[locale].subtitle,p?.coverImage?.url||'/images/sorbonne.webp');}if(path.length===2&&kinds[path[0]]){const item=await getContent(path[1],locale,kinds[path[0]]);if(!item||item.kind!==kinds[path[0]])notFound();return metadataFor(locale,'/'+path.join('/'),item.seoTitle||item.title,item.seoDescription||item.summary,item.image?.url);}
if(path.length===1&&path[0]==='governance-transparency')return metadataFor(locale,'/governance-transparency',governanceLabels[locale].title,governanceLabels[locale].subtitle,'/images/institut.webp');
if(path.length===1&&path[0]==='partners')return metadataFor(locale,'/partners',await getPartnerLabel(locale),d.pages.partners[2]);
if(path.length===1&&path[0]==='contact')return metadataFor(locale,'/contact',contactLabels[locale].title,contactLabels[locale].subtitle,institute.hero.src);
if(path.length===1&&path[0]==='team')return metadataFor(locale,'/team',teamLabels[locale].title,teamLabels[locale].subtitle,teamHero.url);
if(path.length===1&&path[0]==='projects')return metadataFor(locale,'/projects',projectLabels[locale].title,projectLabels[locale].subtitle,'/images/institut.webp');
if(path.length===1&&path[0]==='activities')return metadataFor(locale,'/activities',activityLabels[locale].title,activityLabels[locale].subtitle,institute.hero.src);
if(path[0]==='strategic-areas'&&path.length<=2){const area=path[1]?(await getStrategicAreas(locale)).find(a=>a.slug===path[1]):undefined;if(path[1]&&!area)notFound();return metadataFor(locale,'/'+path.join('/'),area?.title||d.home.strategic,area?.description||d.pages['strategic-areas'][2]);}
if(path.length===1&&path[0]==='about'){const profile=await getAboutProfile();return metadataFor(locale,'/about',d.about.title,d.about.mission[0],profile.photos[0]?.url);}
if(path.length!==1||!pageKeys.includes(path[0] as PageKey))notFound();const blocks=await getPage(path[0] as PageKey,locale);return metadataFor(locale,'/'+path[0],blocks[0],blocks[2],institute.hero.src);}
export async function renderRoute(locale:Locale,props:RouteProps){const {path=[]}=await props.params;const d=dictionary(locale);const key=path[0] as PageKey;const href=(s:string)=>localizedPath(locale,s);const fullPath=path.length?'/'+path.join('/'):'';let content:React.ReactNode,title=d.fullName,description=d.home.description;
if(!path.length)content=<Home locale={locale}/>;
else if(key==='governance-transparency'&&path.length===1){title=governanceLabels[locale].title;description=governanceLabels[locale].subtitle;content=<Governance locale={locale}/>;}
else if(key==='partners'&&path.length===1){title=await getPartnerLabel(locale);description=d.pages.partners[2];content=<><section className="page-heading"><div className="container"><h1>{title}</h1></div></section><section className="container section"><PartnerStrip partners={await getPartners(locale)} locale={locale} label={title} grid/></section></>;}
else if(key==='contact'&&path.length===1){title=contactLabels[locale].title;description=contactLabels[locale].subtitle;content=<Contact locale={locale}/>;}
else if(key==='team'&&path.length===1){title=teamLabels[locale].title;description=teamLabels[locale].subtitle;content=<Team locale={locale}/>;}
else if(key==='publications'&&path.length<=2){const item=path[1]?await getPublication(path[1],locale):null;if(path[1]&&!item)notFound();title=item?.title||publicationLabels[locale].title;description=item?.summary||publicationLabels[locale].subtitle;content=<Publications locale={locale} item={item||undefined}/>;}
else if(key==='projects'&&path.length<=2){const item=path[1]?await getContent(path[1],locale,kinds[path[0]]):undefined;if(path[1]&&(!item||item.kind!=='PROJECT'))notFound();title=item?.title||projectLabels[locale].title;description=item?.summary||projectLabels[locale].subtitle;content=<Projects locale={locale} item={item||undefined}/>;}
else if(key==='activities'&&path.length<=2){const item=path[1]?await getContent(path[1],locale,kinds[path[0]]):undefined;if(path[1]&&(!item||item.kind!=='ACTIVITY'))notFound();title=item?.title||activityLabels[locale].title;description=item?.summary||activityLabels[locale].subtitle;content=<Activities locale={locale} item={item||undefined}/>;}
else if(key==='strategic-areas'&&path.length<=2){const area=path[1]?(await getStrategicAreas(locale)).find(a=>a.slug===path[1]):undefined;if(path[1]&&!area)notFound();title=area?.title||d.home.strategic;description=area?.description||d.pages['strategic-areas'][2];content=<StrategicAreas locale={locale} slug={path[1]}/>;}
else if(path.length===1&&key==='about'){title=d.about.title;description=d.about.mission[0];content=<About locale={locale}/>;}
else if(path.length===2&&kinds[key]){const item=await getContent(path[1],locale,kinds[path[0]]);if(!item||item.kind!==kinds[key])notFound();title=item.title;description=item.summary;content=<><div className="page-heading"><div className="container"><Link className="breadcrumb" href={href('/'+key)}><ArrowLeft size={15}/>{d.pages[key][0]}</Link>{item.isDemo&&<DemoBadge label={d.demo}/>}<h1>{item.title}</h1><p>{item.summary}</p></div></div><article className="container section article"><div className="article-meta"><span>{item.category}</span>{item.publishedAt&&<time dateTime={item.publishedAt}>{new Intl.DateTimeFormat(locale,{dateStyle:'long'}).format(new Date(item.publishedAt))}</time>}</div>{item.image&&safeImage(item.image.url)&&<Image className="article-image" src={safeImage(item.image.url)!} alt={item.image.alt} width={1200} height={675} sizes="(max-width:800px) 100vw, 800px"/>}{item.body.split(/\n\n/).map((paragraph,i)=><p key={i}>{paragraph}</p>)}<Link className="text-link" href={href('/'+key)}><ArrowLeft size={17}/>{d.back}</Link></article></>;}
else {if(path.length!==1||!pageKeys.includes(key))notFound();const blocks=await getPage(key,locale);title=blocks[0];description=blocks[2];let body:React.ReactNode;
if(kinds[key]){let records:ContentRecord[]=[];let failed=false;try{records=await listContent(kinds[key],locale)}catch{failed=true}body=<div className="content-list">{records.length?records.map(r=><Link href={href('/'+key+'/'+r.slug)} className="publication-card" key={r.id}><div className="publication-art"><span>{key==='publications'?<BookOpen size={42} strokeWidth={1}/>:<FileText size={42} strokeWidth={1}/>}</span><small>UFDE / {d.pages[key][0]}</small></div><div className="publication-body">{r.isDemo&&<DemoBadge label={d.demo}/>}<p className="category">{r.category}</p><h2>{r.title}</h2><p>{r.summary}</p><span className="text-link">{d.read}<ArrowRight size={17}/></span></div></Link>):<div className="empty-state"><FileText size={32}/><h2>{failed?d.unavailable:d.empty}</h2></div>}</div>;}
else if(key==='contact')body=<div className="contact-layout"><aside><Eyebrow>{blocks[3]}</Eyebrow><h2>UFDE</h2><p>{d.fullName}</p><div className="contact-details"><p><MapPin size={20}/>{institute.location}</p><a href={'mailto:'+institute.email}><Mail size={20}/>{institute.email}</a><a href={'tel:'+institute.phone.replaceAll(' ','')}><Phone size={20}/>{institute.phone}</a></div></aside><section><h2>{blocks[4]}</h2><EnquiryForm locale={locale} d={d.form} demo={demoMode}/></section></div>;

else body=<div className="prose-layout"><aside><Eyebrow>{d.overview}</Eyebrow>{['about','strategic-areas','governance-transparency'].map(k=><Link className={k===key?'selected':''} key={k} href={href('/'+k)}>{d.pages[k as PageKey][0]}<ArrowRight size={15}/></Link>)}</aside><article><h2>{blocks[3]}</h2><p>{blocks[4]}</p>{key==='about'?<><Link className="text-link" href={href('/strategic-areas')}>{blocks[5]}<ArrowRight size={17}/></Link><div className="about-location"><MapPin size={28}/><h3>{institute.location}</h3><p>{d.fullName}</p></div></>:<a className="text-link" href={'mailto:'+institute.email}>{institute.email}<ArrowRight size={17}/></a>}</article></div>;
content=<><section className="page-heading"><div className="container"><Link className="breadcrumb" href={href('')}>{d.nav[0]} <span>/</span> {blocks[0]}</Link><Eyebrow>{blocks[0]}</Eyebrow><h1>{blocks[1]}</h1><p>{blocks[2]}</p></div></section><section className="container section">{body}</section></>;
}
return <><Header locale={locale} path={fullPath}/><main id="main">{content}</main><PreviewNotice locale={locale}/><Footer locale={locale}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredPage(locale,fullPath,title,description)).replace(/</g,'\u003c')}}/></>;
}
