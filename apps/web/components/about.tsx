import Image from 'next/image';
import {ShieldCheck,Handshake,Target,Globe2,Award,BookOpen,Network,Landmark,Scale,FileText,Eye,ArrowRight} from 'lucide-react';
import type {Locale} from '@ufde/config';
import {dictionary,localizedPath} from '@ufde/config/messages';
import {Container,Section,SectionHeading,StrategicAreaCard,PrimaryButton,Breadcrumbs} from '@ufde/ui';
import {getAboutProfile} from '@/lib/content';
import {areaIcons} from './home';
import {AboutPhotoCarousel} from './about-photo-carousel';
export async function About({locale}:{locale:Locale}){
 const d=dictionary(locale),a=d.about,profile=await getAboutProfile(),href=(p:string)=>localizedPath(locale,p);
 const values=[ShieldCheck,Handshake,Target,Globe2,Award],work=[BookOpen,Network,Target],governance=[Landmark,Scale,FileText,Eye];
 const facts=[profile.founded,profile.registeredOffice,profile.organisationType[locale],profile.geographicalFocus[locale]];
 return <div className="ufde-about"><section className="about-hero">{profile.photos[0]&&<Image src={profile.photos[0].url} alt={profile.photos[0].alt} fill priority sizes="100vw"/>}<div className="about-hero-shade"/><Container><Breadcrumbs items={[{label:d.nav[0],href:href('')},{label:a.title}]}/><p className="home-kicker">UKRAINE · FRANCE · EUROPE</p><h1>{a.title}</h1></Container></section>
 <Section><Container><div className="about-two-column about-mission"><div><SectionHeading title={a.missionTitle} underline/>{a.mission.map((p,i)=><p key={p} className={i===0?'about-lead':undefined}>{p}</p>)}</div><AboutPhotoCarousel photos={profile.photos} label={a.carousel} previous={a.previous} next={a.next} slide={a.slide}/></div></Container></Section>
 <Section tone="soft"><Container><div className="about-two-column"><div><SectionHeading title={a.whoTitle} underline/>{a.who.map(p=><p key={p}>{p}</p>)}</div><dl className="about-facts">{a.factLabels.map((label,i)=><div key={label}><dt>{label}</dt><dd>{facts[i]}</dd></div>)}</dl></div></Container></Section>
 <Section><Container><SectionHeading title={a.valuesTitle} underline/><div className="about-values">{a.values.map(([title,text],i)=>{const Icon=values[i];return <article key={title}><Icon aria-hidden="true"/><h3>{title}</h3><p>{text}</p></article>})}</div></Container></Section>
 <Section tone="soft"><Container><SectionHeading title={a.workTitle} underline/><div className="about-work">{a.work.map(([title,text],i)=>{const Icon=work[i];return <article key={title}><Icon aria-hidden="true"/><h3>{title}</h3><p>{text}</p></article>})}</div></Container></Section>
 <Section><Container><div className="about-governance"><SectionHeading title={a.governanceTitle} underline/><p>{a.governanceText}</p><div className="about-governance-grid">{a.governanceCards.map((title,i)=>{const Icon=governance[i];return <a key={title} href={href('/governance-transparency')}><Icon aria-hidden="true"/><h3>{title}</h3><ArrowRight size={18} aria-hidden="true"/></a>})}</div><PrimaryButton href={href('/governance-transparency')}>{a.governanceButton}<ArrowRight size={18}/></PrimaryButton></div></Container></Section>
 <Section tone="soft"><Container><SectionHeading title={d.home.strategic} underline/><div className="home-strategic-grid about-strategic">{d.areas.map(([title,description],i)=>{const Icon=areaIcons[i];return <StrategicAreaCard key={title} title={title} description={description} icon={<Icon/>} href={href('/strategic-areas')+'#area-'+(i+1)} linkLabel={d.home.learn}/>})}</div></Container></Section>
 <Container><div className="about-credits"><p>{a.imageNote}</p>{profile.photos.map(p=><p key={p.url}>{a.photoCredit}: <a href={p.source}>{p.alt} — {p.credit}</a> · <a href={p.licenseUrl}>{p.licenseLabel}</a> · {d.cropped}</p>)}</div></Container></div>;
}
