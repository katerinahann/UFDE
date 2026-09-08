'use client';
import Image from 'next/image';
import {useEffect,useState} from 'react';
import type {AboutPhoto} from '@ufde/config/about';
import {Carousel,CarouselContent,CarouselItem,CarouselPrevious,CarouselNext,type CarouselApi} from './ui/carousel';
export function AboutPhotoCarousel({photos,label,previous,next,slide}:{photos:AboutPhoto[];label:string;previous:string;next:string;slide:string}){
 const [api,setApi]=useState<CarouselApi>(),[selected,setSelected]=useState(0);
 useEffect(()=>{if(!api)return;const update=()=>setSelected(api.selectedScrollSnap());update();api.on('select',update);api.on('reInit',update);return()=>{api.off('select',update);api.off('reInit',update)}},[api]);
 return <Carousel setApi={setApi} opts={{loop:true}} className="about-carousel" aria-label={label}><CarouselContent>{photos.map((photo,i)=><CarouselItem key={photo.url} aria-label={`${slide} ${i+1} / ${photos.length}`}><div className="about-slide"><Image src={photo.url} alt={photo.alt} fill sizes="(max-width:800px) 100vw, 50vw"/></div></CarouselItem>)}</CarouselContent>{photos.length>1&&<><CarouselPrevious aria-label={previous}/><CarouselNext aria-label={next}/><div className="about-dots">{photos.map((p,i)=><button type="button" key={p.url} aria-label={`${slide} ${i+1}`} aria-current={selected===i?'true':undefined} onClick={()=>api?.scrollTo(i)}><span/></button>)}</div></>}</Carousel>;
}
