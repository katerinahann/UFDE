"use client";
import Link from 'next/link';
import {useState} from 'react';
import {ChevronDown,Menu,X} from 'lucide-react';
import {type Locale} from '@ufde/config';
import {type Dictionary,localizedPath} from '@ufde/config/messages';
import {Sheet,SheetTrigger,SheetContent,SheetTitle,SheetClose} from '@/components/ui/sheet';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem} from '@/components/ui/dropdown-menu';
import {navPaths} from '@/lib/navigation';
type NavProps={locale:Locale;path:string;d:Dictionary};
export function LanguageSwitcher({locale,path}:{locale:Locale;path:string}){return <DropdownMenu><DropdownMenuTrigger className="language language-button" aria-label="Language / Langue / Мова">{locale.toUpperCase()}<ChevronDown size={14}/></DropdownMenuTrigger><DropdownMenuContent className="language-menu" align="end">{(['en','fr','uk'] as const).map(l=><DropdownMenuItem key={l} render={<Link href={localizedPath(l,path)} hrefLang={l} lang={l}/>} aria-current={l===locale?'true':undefined}>{({en:'English',fr:'Français',uk:'Українська'})[l]}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>}
export function MobileNavigation({locale,path,d}:NavProps){const [open,setOpen]=useState(false);return <Sheet open={open} onOpenChange={setOpen}><SheetTrigger className="menu-trigger" aria-label={d.menu}><Menu size={24}/></SheetTrigger><SheetContent className="mobile-sheet" showCloseButton={false}><div className="mobile-sheet-top"><SheetTitle>{d.menu}</SheetTitle><SheetClose className="menu-trigger" aria-label={d.close}><X/></SheetClose></div><nav aria-label={d.menu}>{navPaths.map((h,i)=><Link key={h} onClick={()=>setOpen(false)} href={localizedPath(locale,h)} aria-current={h===path?'page':undefined}>{d.nav[i]}</Link>)}</nav></SheetContent></Sheet>}
export function Navigation({locale,path,d}:NavProps){const active=(h:string)=>h===''?path==='':path===h||path.startsWith(h+'/');return <><nav aria-label={d.menu}>{navPaths.map((h,i)=><Link key={h} href={localizedPath(locale,h)} aria-current={active(h)?'page':undefined}>{d.nav[i]}</Link>)}</nav><LanguageSwitcher locale={locale} path={path}/><div className="mobile-menu"><MobileNavigation locale={locale} path={path} d={d}/></div></>}
