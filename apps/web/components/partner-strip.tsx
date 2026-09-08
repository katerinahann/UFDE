'use client';
import Image from 'next/image';
import {Carousel,CarouselContent,CarouselItem,CarouselNext,CarouselPrevious} from '@/components/ui/carousel';
import {EmptyState,PartnerCard} from '@ufde/ui';
import type {Partner} from '@ufde/types';
import type {Locale} from '@ufde/config';
import {dictionary} from '@ufde/config/messages';
import {partnerNotes} from '@ufde/config/partners';
export function PartnerStrip({partners,locale,grid=false,label}:{partners:Partner[];locale:Locale;grid?:boolean;label?:string}){const d=dictionary(locale),h=d.home,visible=partners.filter(p=>p.published&&p.logo).sort((a,b)=>a.sortOrder-b.sortOrder);if(!visible.length)return <EmptyState title={d.empty}/>;
 const cards=visible.map(p=><PartnerCard key={p.id} title={p.name} description={p.description||undefined} href={p.website} linkLabel={h.learn} logo={p.logo?<Image src={p.logo.url} alt={p.logo.alt||p.name} width={180} height={90}/>:undefined}><p className="partner-country">{p.country}</p></PartnerCard>);
 return <><p className="partner-disclosure">{partnerNotes[locale]}</p>{grid?<div className="home-partner-grid">{cards}</div>:<Carousel className="home-partner-carousel" opts={{align:'start',loop:false}} aria-label={label||h.partners} tabIndex={0}><CarouselContent>{cards.map((card,i)=><CarouselItem className="home-partner-slide" key={visible[i].id}>{card}</CarouselItem>)}</CarouselContent>{visible.length>1&&<><CarouselPrevious className="home-partner-prev"/><CarouselNext className="home-partner-next"/></>}</Carousel>}</>}
