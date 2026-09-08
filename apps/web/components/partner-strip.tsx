"use client";
import Image from 'next/image';
import {Building2} from 'lucide-react';
import {Carousel,CarouselContent,CarouselItem,CarouselNext,CarouselPrevious} from '@/components/ui/carousel';
import {EmptyState,PartnerCard} from '@ufde/ui';
import type {PartnerRecord} from '@ufde/types';
import type {Locale} from '@ufde/config';
import {dictionary} from '@ufde/config/messages';
export function PartnerStrip({partners,locale,grid=false}:{partners:PartnerRecord[];locale:Locale;grid?:boolean}){const d=dictionary(locale),h=d.home;if(!partners.length)return <EmptyState title={d.empty} description={h.partnersNotice}/>;
 const cards=partners.map(p=><PartnerCard key={p.id} title={p.isDemo?h.partnerPlaceholder:p.name} description={p.isDemo?h.partnerDemo:undefined} href={p.href&&/^https:\/\//.test(p.href)?p.href:undefined} linkLabel={h.learn} logo={p.logoUrl&&p.logoUrl.startsWith('/images/')?<Image src={p.logoUrl} alt={p.logoAlt||p.name} width={180} height={90}/>:<Building2 size={36} strokeWidth={1} aria-hidden="true"/>}/>);
 return <>{partners.some(p=>p.isDemo)&&<p className="home-demo-note">{h.partnersNotice}</p>}{grid?<div className="home-partner-grid">{cards}</div>:<Carousel className="home-partner-carousel" opts={{align:'start',loop:false}} aria-label={h.partners} tabIndex={0}><CarouselContent>{cards.map((card,i)=><CarouselItem className="home-partner-slide" key={partners[i].id}>{card}</CarouselItem>)}</CarouselContent><CarouselPrevious className="home-partner-prev"/><CarouselNext className="home-partner-next"/></Carousel>}</>}
