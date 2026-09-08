import {dictionary} from './messages';
import type {Locale} from './index';
// Stable identifiers keep incoming links and future CMS/detail pages independent of titles.
export const strategicAreaSlugs=['scientific-research','education-training','digital-transformation-ai','international-partnerships','public-policy-development','culture-creative-industries'] as const;
export function strategicAreas(locale:Locale){return dictionary(locale).areas.map(([title,description,body],index)=>({slug:strategicAreaSlugs[index],title,description,body,index}));}
