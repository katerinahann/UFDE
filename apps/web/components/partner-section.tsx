import type {Locale} from '@ufde/config';
import type {Partner} from '@ufde/types';
import {Container,Section,SectionHeading} from '@ufde/ui';
import {getPartners,getPartnerLabel} from '@/lib/content';
import {PartnerStrip} from './partner-strip';
export async function PartnerSection({locale,partners,featured=false,grid=false}:{locale:Locale;partners?:Partner[];featured?:boolean;grid?:boolean}){const [all,label]=await Promise.all([partners?Promise.resolve(partners):getPartners(locale),getPartnerLabel(locale)]);const rows=featured?all.filter(p=>p.featured):all;if(!rows.length)return null;return <Section tone="soft"><Container><SectionHeading title={label} underline/><PartnerStrip partners={rows} locale={locale} label={label} grid={grid}/></Container></Section>}
