'use client';
import Image from 'next/image';
import {useState} from 'react';
import {CalendarDays,Building2,Compass,ArrowRight} from 'lucide-react';
import type {Locale} from '@ufde/config';
import type {ProjectView,ProjectStatus} from '@ufde/types';
import {dictionary,localizedPath} from '@ufde/config/messages';
import {projectLabels,projectCategoryKeys,projectPeriod} from '@ufde/config/projects';
import {EmptyState,StatusBadge} from '@ufde/ui';
import {CategoryTabs} from './design-system/interactive';
export function ProjectStatusBadge({status,locale}:{status?:ProjectStatus;locale:Locale}){return <span className={'project-status status-'+(status||'pending').toLowerCase()}>{status?projectLabels[locale].statuses[status]:projectLabels[locale].pending}</span>}
export function ProjectGrid({projects,locale}:{projects:ProjectView[];locale:Locale}){
 const [category,setCategory]=useState('all'),l=projectLabels[locale],d=dictionary(locale);
 return <div className="project-browser"><CategoryTabs value={category} onValueChange={setCategory} label={l.title} items={[{value:'all',label:l.all},...projectCategoryKeys.map((value,i)=>({value,label:l.categories[i]}))].map(tab=>({...tab,content:<div className="project-grid">{projects.filter(p=>tab.value==='all'||p.details.category===tab.value).map(({record:r,details:p})=><article className="project-card" key={r.id}><div className="project-card-image">{r.image&&<Image src={r.image.url} alt={r.image.alt} fill sizes="(max-width:650px) 100vw, (max-width:1000px) 50vw, 33vw"/>}<ProjectStatusBadge status={p.status} locale={locale}/>{r.isDemo&&<span className="project-image-note">{l.photo}</span>}</div><div className="project-card-body">{r.isDemo&&<StatusBadge tone="demo">{d.demo}</StatusBadge>}<h2><a href={localizedPath(locale,'/projects/'+r.slug)}>{r.title}</a></h2><p>{r.summary}</p><dl className="project-card-metadata">{[[CalendarDays,l.period,projectPeriod(p,locale)],[Building2,l.institution,p.institutionType||l.pending],[Compass,l.area,p.strategicArea||l.pending]].map(([Icon,label,value],i)=>{const Glyph=Icon as typeof CalendarDays;return <div key={i}><dt><Glyph size={17} aria-hidden="true"/><span className="sr-only">{label as string}</span></dt><dd>{value as string}</dd></div>})}</dl><a className="project-learn" href={localizedPath(locale,'/projects/'+r.slug)}>{d.home.learn}<ArrowRight size={18}/></a></div></article>)}{!projects.some(p=>tab.value==='all'||p.details.category===tab.value)&&<EmptyState title={l.empty}/>}</div>}))}/></div>;
}
