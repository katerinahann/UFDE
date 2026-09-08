'use client';
import Image from 'next/image';
import {BookOpen,ArrowRight} from 'lucide-react';
import {useState} from 'react';
import type {Locale} from '@ufde/config';
import type {Publication} from '@ufde/types';
import {localizedPath} from '@ufde/config/messages';
import {publicationTypes,publicationLabels} from '@ufde/config/publications';
import {EmptyState} from '@ufde/ui';
import {CategoryTabs} from './design-system/interactive';
export function PublicationCover({item,locale,priority=false}:{item:Publication;locale:Locale;priority?:boolean}){return <div className="publication-cover">{item.coverImage?<Image src={item.coverImage.url} alt={item.coverImage.alt} fill priority={priority} sizes="(max-width:650px) 100vw, (max-width:1000px) 50vw, 25vw"/>:<div className="publication-cover-empty"><BookOpen size={42} strokeWidth={1}/><span>{publicationLabels[locale].cover}</span></div>}</div>}
export function PublicationGrid({items,locale,filters=true}:{items:Publication[];locale:Locale;filters?:boolean}){
 const l=publicationLabels[locale],[type,setType]=useState('all'),visibleTypes=publicationTypes.filter((t,i)=>i<3||items.some(p=>p.type===t));
 const grid=(rows:Publication[])=>rows.length?<div className="publications-grid">{rows.map(p=>{const detail=localizedPath(locale,'/publications/'+p.slug),journal=p.type==='Scientific Journal',pdf=!!p.pdfUrl&&!journal;return <article className="publication-tile" key={p.slug}><a href={detail} aria-label={p.title}><PublicationCover item={p} locale={locale}/></a><div className="publication-tile-body"><p className="publication-type">{l.types[publicationTypes.indexOf(p.type)]}</p><h2><a href={detail}>{p.title}</a></h2><p className="publication-summary">{p.summary}</p><p className="publication-authors">{p.authors.join(', ')||l.pending}</p><p className="publication-date">{p.publishedAt?new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(p.publishedAt)):p.year||l.pending}</p><a className="uf-button uf-button-outline publication-action" href={journal?(p.externalUrl||detail):pdf?p.pdfUrl:detail} {...(pdf?{download:true}:{})}>{journal?l.journal:pdf?l.pdf:l.read}<ArrowRight size={16}/></a></div></article>})}</div>:<EmptyState title={items.length?l.categoryEmpty:l.empty}/>;
 return <div className="publication-browser">{filters?<CategoryTabs value={type} onValueChange={setType} label={l.type} items={[{value:'all',label:l.all},...visibleTypes.map(t=>({value:t,label:l.types[publicationTypes.indexOf(t)]}))].map(t=>({...t,content:grid(items.filter(p=>t.value==='all'||p.type===t.value))}))}/>:grid(items)}</div>;
}
