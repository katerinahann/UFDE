import Image from 'next/image';
import type {Locale} from '@ufde/config';
import {dictionary,localizedPath} from '@ufde/config/messages';
import {teamHero,teamLabels} from '@ufde/config/team';
import {Container,Section,Breadcrumbs,Heading1,EmptyState} from '@ufde/ui';
import {getTeam} from '@/lib/content';
import {TeamBrowser} from './team-browser';
export async function Team({locale}:{locale:Locale}){const l=teamLabels[locale],d=dictionary(locale),result=await getTeam(locale).then(members=>({members,failed:false})).catch(()=>({members:[],failed:true}));return <div className="team-page"><section className="team-hero"><Image src={teamHero.url} alt={teamHero.alt} fill priority sizes="100vw"/><div className="team-hero-shade"/><Container><Breadcrumbs items={[{label:d.nav[0],href:localizedPath(locale,'')},{label:l.title}]}/><Heading1>{l.title}</Heading1><p>{l.subtitle}</p></Container></section><Section><Container>{result.failed?<EmptyState title={d.unavailable}/>:<TeamBrowser members={result.members} locale={locale}/>}</Container></Section><Container><p className="home-photo-credit">{l.imageNote} <a href={teamHero.source}>{teamHero.credit}</a> · <a href={teamHero.license}>CC BY 2.0</a> · {d.cropped}</p></Container></div>}
