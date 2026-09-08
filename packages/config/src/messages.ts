import messages from './messages.json';
import type {Locale} from './index';
export const dictionary=(locale:Locale)=>messages[locale];
export type Dictionary=ReturnType<typeof dictionary>;
export const pageKeys=Object.keys(messages.en.pages) as (keyof typeof messages.en.pages)[];
export type PageKey=typeof pageKeys[number];
export function localizedPath(locale:Locale,path=''){return (locale==='en'?'':'/'+locale)+(path==='/'?'':path)||'/';}
