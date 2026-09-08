'use client';
import Image from 'next/image';
import {useEffect,useState} from 'react';
import type {Locale} from '@ufde/config';
import type {ContentRecord} from '@ufde/types';
import {dictionary,localizedPath} from '@ufde/config/messages';
import {activityLabels,activityCategoryKeys,categoryKey,categoryLabel} from '@ufde/config/activities';
import {ActivityCard,EmptyState,StatusBadge} from '@ufde/ui';
import {CategoryTabs} from './design-system/interactive';
import {Carousel,CarouselContent,CarouselItem,CarouselPrevious,CarouselNext,type CarouselApi} from './ui/carousel';
export function ActivityCarousel({records,locale,filters=true}:{records:ContentRecord[];locale:Locale;filters?:boolean}){
 const l=activityLabels[locale];const [category,setCategory]=useState('all');
 const items=[{value:'all',label:l.all},...activityCategoryKeys.map((value,i)=>({value,label:l.categories[i]}))];
 return <div className="activity-browser">{filters?<CategoryTabs value={category} onValueChange={setCategory} label={l.category} items={items.map(item=>({...item,content:<ActivitySlides key={item.value} records={item.value==='all'?records:records.filter(r=>categoryKey(r.category)===item.value)} locale={locale}/>}))}/>:<ActivitySlides records={records} locale={locale}/>}</div>;
}
function ActivitySlides({records,locale}:{records:ContentRecord[];locale:Locale}){
 const l=activityLabels[locale],d=dictionary(locale),[api,setApi]=useState<CarouselApi>(),[selected,setSelected]=useState(0),[count,setCount]=useState(0);
 useEffect(()=>{if(!api)return;const update=()=>{setSelected(api.selectedScrollSnap());setCount(api.scrollSnapList().length)};update();api.on('select',update);api.on('reInit',update);return()=>{api.off('select',update);api.off('reInit',update)}},[api]);
 if(!records.length)return <EmptyState title={l.noResults}/>;
 return <Carousel setApi={setApi} opts={{align:'start',containScroll:'trimSnaps'}} aria-label={l.title} className="activity-carousel" tabIndex={0}><CarouselContent>{records.map(r=><CarouselItem key={r.id} className="activity-slide"><ActivityCard title={r.title} description={r.summary} href={localizedPath(locale,'/activities/'+r.slug)} linkLabel={d.home.read} media={r.image?<div className="activity-image"><Image src={r.image.url} alt={r.image.alt} fill sizes="(min-width:1400px) 23vw, (min-width:900px) 31vw, (min-width:600px) 46vw, 85vw"/>{r.isDemo&&<span>{l.photo}</span>}</div>:<div className="activity-image activity-image-empty"/>} meta={<>{r.isDemo&&<StatusBadge tone="demo">{d.demo}</StatusBadge>}<span>{categoryLabel(r.category,locale)}</span>{r.publishedAt?<time dateTime={r.publishedAt}>{new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(r.publishedAt))}</time>:<span>{l.pending}</span>}</>}/></CarouselItem>)}</CarouselContent>{count>1&&<><CarouselPrevious aria-label={l.previous}/><CarouselNext aria-label={l.next}/><div className="activity-dots">{Array.from({length:count},(_,i)=><button type="button" key={i} aria-label={`${l.page} ${i+1}`} aria-current={selected===i?'true':undefined} onClick={()=>api?.scrollTo(i)}><span/></button>)}</div></>}</Carousel>;
}
