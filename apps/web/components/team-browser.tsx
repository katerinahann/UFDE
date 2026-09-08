'use client';
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import {Mail,ExternalLink,UserRound,X} from 'lucide-react';
import type {Locale} from '@ufde/config';
import type {TeamProfile} from '@ufde/types';
import {teamLabels} from '@ufde/config/team';
import {EmptyState} from '@ufde/ui';
import {CategoryTabs} from './design-system/interactive';
import {Dialog,DialogContent,DialogTitle,DialogClose} from './ui/dialog';
export function TeamBrowser({members,locale}:{members:TeamProfile[];locale:Locale}){
 const l=teamLabels[locale],groups=[{value:'leadership',label:l.leadership},...(members.some(m=>m.category==='advisory')?[{value:'advisory',label:l.advisory}]:[])];
 const [category,setCategory]=useState('leadership');
 return <div className="team-browser"><CategoryTabs value={category} onValueChange={setCategory} label={l.title} items={groups.map(g=>({...g,content:<TeamRows key={g.value} members={members.filter(m=>m.category===g.value)} locale={locale}/>}))}/></div>;
}
function Portrait({member,locale}:{member:TeamProfile;locale:Locale}){return <div className="team-portrait">{member.photoUrl?<Image src={member.photoUrl} alt={member.photoAlt||member.name} fill sizes="(max-width:640px) 90vw, (max-width:900px) 45vw, 25vw"/>:<div className="team-portrait-empty"><UserRound size={40} strokeWidth={1}/><span>{teamLabels[locale].portrait}</span></div>}</div>}
function CardLinks({member,locale}:{member:TeamProfile;locale:Locale}){const l=teamLabels[locale];return <div className="team-card-links">{member.linkedin&&<a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} — LinkedIn`}><span className="team-linkedin" aria-hidden="true">in</span></a>}{member.institutionalProfile&&<a href={member.institutionalProfile} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} — ${l.institutional}`}><ExternalLink size={17}/></a>}{member.email&&<a href={'mailto:'+member.email} aria-label={`${member.name} — ${l.email}`}><Mail size={17}/></a>}</div>}
function Profile({member,locale,mobile=false}:{member:TeamProfile;locale:Locale;mobile?:boolean}){
 const l=teamLabels[locale],links=[['LinkedIn',member.linkedin],['ORCID',member.orcid],['Google Scholar',member.googleScholar],[l.institutional,member.institutionalProfile]];
 return <div className="team-profile-layout"><Portrait member={member} locale={locale}/><div>{!mobile&&<h2>{member.name}</h2>}<p className="team-role">{member.role}</p>{member.biography?member.biography.split(/\n\n/).map((p,i)=><p key={i}>{p}</p>):<p>{l.pending}</p>}{member.expertise.length>0&&<><h3>{l.expertise}</h3><ul className="team-expertise">{member.expertise.map(x=><li key={x}>{x}</li>)}</ul></>}{member.institutionRole&&<><h3>{l.institution}</h3><p>{member.institutionRole}</p></>}<h3>{l.contact}</h3>{member.email?<a href={'mailto:'+member.email}>{member.email}</a>:<p>{l.pending}</p>}{(links.some(([,url])=>url)||member.email)&&<><h3>{l.profiles}</h3><ul className="team-professional-links">{links.filter(([,url])=>url).map(([label,url])=><li key={label}><a href={url} target="_blank" rel="noopener noreferrer">{label}<ExternalLink size={15}/></a></li>)}{member.email&&<li><a href={'mailto:'+member.email}>{l.email}<Mail size={15}/></a></li>}</ul></>}</div></div>;
}
function TeamRows({members,locale}:{members:TeamProfile[];locale:Locale}){
 const l=teamLabels[locale],[selected,setSelected]=useState<string|null>(null),[columns,setColumns]=useState(5),[mobile,setMobile]=useState(false),panel=useRef<HTMLDivElement>(null),triggers=useRef(new Map<string,HTMLButtonElement>());
 useEffect(()=>{const update=()=>{const w=window.innerWidth;setMobile(w<640);setColumns(w>=1200?5:w>=900?3:w>=640?2:1)};update();window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update)},[]);
 useEffect(()=>{if(selected&&!mobile)panel.current?.focus({preventScroll:true})},[selected,mobile,columns]);
 const close=()=>{const id=selected;setSelected(null);requestAnimationFrame(()=>{if(id)triggers.current.get(id)?.focus()})};
 const active=members.find(m=>m.id===selected),rows=Array.from({length:Math.ceil(members.length/columns)},(_,i)=>members.slice(i*columns,(i+1)*columns));
 if(!members.length)return <EmptyState title={l.empty}/>;
 return <><div className="team-rows">{rows.map((row,i)=><div key={i} className="team-row-group"><div className="team-member-row">{row.map(m=><article className={'team-member-card'+(selected===m.id?' is-selected':'')} key={m.id}><button ref={node=>{if(node)triggers.current.set(m.id,node);else triggers.current.delete(m.id)}} type="button" className="team-profile-trigger" aria-label={`${l.open}: ${m.name}`} aria-expanded={selected===m.id} aria-controls={!mobile&&selected===m.id?'team-profile-'+m.id:undefined} aria-haspopup={mobile?'dialog':undefined} onClick={()=>selected===m.id?close():setSelected(m.id)}><Portrait member={m} locale={locale}/><span className="team-card-name">{m.name}</span><span className="team-card-role">{m.role}</span></button><CardLinks member={m} locale={locale}/></article>)}</div>{!mobile&&active&&row.some(m=>m.id===active.id)&&<div ref={panel} tabIndex={-1} role="region" aria-label={active.name} id={'team-profile-'+active.id} className="team-expanded"><button className="team-close" onClick={close} aria-label={l.close}><X size={20}/></button><Profile member={active} locale={locale}/></div>}</div>)}</div><Dialog open={mobile&&!!active} onOpenChange={open=>{if(!open)close()}}><DialogContent className="team-dialog" showCloseButton={false}>{active&&<><DialogTitle>{active.name}</DialogTitle><DialogClose className="team-close" aria-label={l.close}><X size={20}/></DialogClose><Profile member={active} locale={locale} mobile/></>}</DialogContent></Dialog></>;
}
