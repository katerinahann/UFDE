import type {ReactNode,HTMLAttributes,ButtonHTMLAttributes,AnchorHTMLAttributes} from 'react';
type Block=HTMLAttributes<HTMLElement> & {children?:ReactNode};
const cls=(...v:(string|undefined)[])=>v.filter(Boolean).join(' ');
export function Container({children,className,...p}:Block){return <div {...p} className={cls('uf-container',className)}>{children}</div>}
export function Section({children,className,tone='white',...p}:Block & {tone?:'white'|'soft'|'navy'}){return <section {...p} className={cls('uf-section','uf-tone-'+tone,className)}>{children}</section>}
type TextProps=Block & {as?:'h1'|'h2'|'h3'|'p'|'span'};
function textStyle(defaultTag:'h1'|'h2'|'h3'|'p',style:string){return function Text({as:Tag=defaultTag,children,className,...p}:TextProps){return <Tag {...p} className={cls(style,className)}>{children}</Tag>}}
export const Heading1=textStyle('h1','uf-h1');
export const Heading2=textStyle('h2','uf-h2');
export const Heading3=textStyle('h3','uf-h3');
export const Lead=textStyle('p','uf-lead');
export const Body=textStyle('p','uf-body');
export const Caption=textStyle('p','uf-caption');
export function Eyebrow({children,className,...p}:Block){return <p {...p} className={cls('eyebrow uf-eyebrow',className)}>{children}</p>}
export function DemoBadge({label='Demonstration content'}:{label?:string}){return <StatusBadge tone="demo">{label}</StatusBadge>}
export type ButtonProps=({href:string;disabled?:never}&AnchorHTMLAttributes<HTMLAnchorElement>)|({href?:never}&ButtonHTMLAttributes<HTMLButtonElement>);
function buttonStyle(variant:string){return function Button(p:ButtonProps){if(p.href!==undefined){const {className,children,...props}=p as AnchorHTMLAttributes<HTMLAnchorElement>;return <a {...props} className={cls('uf-button',variant,className)}>{children}</a>}const {className,children,type='button',...props}=p as ButtonHTMLAttributes<HTMLButtonElement>;return <button {...props} type={type} className={cls('uf-button',variant,className)}>{children}</button>}}
export const PrimaryButton=buttonStyle('uf-button-primary');
export const SecondaryButton=buttonStyle('uf-button-secondary');
export const OutlineButton=buttonStyle('uf-button-outline');
export function TextLink({children,className,...p}:AnchorHTMLAttributes<HTMLAnchorElement>){return <a {...p} className={cls('uf-text-link',className)}>{children}<span aria-hidden="true">↗</span></a>}
export type BreadcrumbItem={label:string;href?:string};
export function Breadcrumbs({items,label='Breadcrumb'}:{items:BreadcrumbItem[];label?:string}){return <nav aria-label={label} className="uf-breadcrumbs"><ol>{items.map((item,i)=><li key={i}>{i>0&&<span aria-hidden="true">/</span>}{item.href&&i!==items.length-1?<a href={item.href}>{item.label}</a>:<span aria-current={i===items.length-1?'page':undefined}>{item.label}</span>}</li>)}</ol></nav>}
export function SectionHeading({title,eyebrow,description,action,underline=false}:{title:string;eyebrow?:string;description?:string;action?:ReactNode;underline?:boolean}){return <div className="uf-section-heading"><div>{eyebrow&&<Eyebrow>{eyebrow}</Eyebrow>}<Heading2 className={underline?'uf-gold-line':''}>{title}</Heading2>{description&&<Body>{description}</Body>}</div>{action}</div>}
export function PageHeader({title,eyebrow,description,breadcrumbs,actions}:{title:string;eyebrow?:string;description?:string;breadcrumbs?:BreadcrumbItem[];actions?:ReactNode}){return <div className="uf-page-header"><Container>{breadcrumbs&&<Breadcrumbs items={breadcrumbs}/>} {eyebrow&&<Eyebrow>{eyebrow}</Eyebrow>}<Heading1>{title}</Heading1>{description&&<Lead>{description}</Lead>}{actions&&<div className="uf-actions">{actions}</div>}</Container></div>}
export function Hero({title,eyebrow,description,media,actions,caption,headingAs='h1'}:{title:ReactNode;eyebrow?:string;description?:string;media?:ReactNode;actions?:ReactNode;caption?:string;headingAs?:'h1'|'h2'}){return <section className="uf-hero">{media&&<div className="uf-hero-media">{media}</div>}<Container>{eyebrow&&<Eyebrow>{eyebrow}</Eyebrow>}<Heading1 as={headingAs}>{title}</Heading1>{description&&<Lead>{description}</Lead>}<div className="uf-actions">{actions}</div>{caption&&<Caption>{caption}</Caption>}</Container></section>}
export function StatusBadge({children,tone='neutral'}:{children:ReactNode;tone?:'neutral'|'active'|'draft'|'demo'}){return <span className={'uf-badge uf-badge-'+tone}>{children}</span>}
export type CardProps={title:string;description?:string;href?:string;linkLabel?:string;icon?:ReactNode;media?:ReactNode;meta?:ReactNode;children?:ReactNode;className?:string};
export function InstitutionalCard({title,description,href,linkLabel='Read more',icon,media,meta,children,className}:CardProps){return <article className={cls('uf-card',className)}>{media&&<div className="uf-card-media">{media}</div>}<div className="uf-card-content">{icon&&<div className="uf-card-icon" aria-hidden="true">{icon}</div>}{meta&&<div className="uf-card-meta">{meta}</div>}<Heading3>{href?<a href={href}>{title}</a>:title}</Heading3>{description&&<Body>{description}</Body>}{children}{href&&<TextLink href={href}>{linkLabel}</TextLink>}</div></article>}
export function StrategicAreaCard(p:CardProps){return <InstitutionalCard {...p} className={cls('uf-strategic-card',p.className)}/>}
export function ActivityCard({date,location,...p}:CardProps&{date?:string;location?:string}){return <InstitutionalCard {...p} meta={<>{p.meta}{date&&<time dateTime={date}>{date}</time>}{location&&<span>{location}</span>}</>}/>}
export function ProjectCard({status,...p}:CardProps&{status?:string}){return <InstitutionalCard {...p} meta={<>{p.meta}{status&&<StatusBadge>{status}</StatusBadge>}</>}/>}
export function PublicationCard({format='Publication',...p}:CardProps&{format?:string}){return <InstitutionalCard {...p} meta={<>{p.meta}<span>{format}</span></>}/>}
export function TeamCard({role,...p}:CardProps&{role:string}){return <InstitutionalCard {...p} meta={role}/>}
export function DocumentCard({format='PDF',size,...p}:CardProps&{format?:string;size?:string}){return <InstitutionalCard {...p} meta={<span>{format}{size?' · '+size:''}</span>}/>}
export function PartnerCard({logo,...p}:CardProps&{logo?:ReactNode}){return <InstitutionalCard {...p} media={logo} className={cls('uf-partner-card',p.className)}/>}
export function EmptyState({title,description,icon,action}:{title:string;description?:string;icon?:ReactNode;action?:ReactNode}){return <div className="uf-empty">{icon&&<div aria-hidden="true">{icon}</div>}<Heading3>{title}</Heading3>{description&&<Body>{description}</Body>}{action}</div>}
export function PDFDownload({href,label='Download PDF',size,unavailableLabel='PDF awaiting publication'}:{href?:string;label?:string;size?:string;unavailableLabel?:string}){return href?<a className="uf-download" href={href} download><span aria-hidden="true">↓</span>{label}<Caption as="span">PDF{size?' · '+size:''}</Caption></a>:<span className="uf-download uf-unavailable" aria-disabled="true">{unavailableLabel}</span>}
export function MemberProfile({name,role,biography,photo,links}:{name:string;role:string;biography:string;photo?:ReactNode;links?:ReactNode}){return <article className="uf-member">{photo&&<div className="uf-member-photo">{photo}</div>}<div><Heading2>{name}</Heading2><Eyebrow>{role}</Eyebrow><Body>{biography}</Body>{links}</div></article>}
export type MetadataItem={label:string;value:ReactNode};
function Metadata({items}:{items:MetadataItem[]}){return <dl className="uf-metadata">{items.map((i,n)=><div key={n}><dt>{i.label}</dt><dd>{i.value}</dd></div>)}</dl>}
export function ProjectMetadata(p:{items:MetadataItem[]}){return <Metadata {...p}/>}
export function PublicationMetadata(p:{items:MetadataItem[]}){return <Metadata {...p}/>}
export function SocialLinks({links,label='Social channels',emptyLabel='Verified social channels will appear here.'}:{links:{label:string;href:string;icon?:ReactNode}[];label?:string;emptyLabel?:string}){return links.length?<nav aria-label={label} className="uf-social">{links.map(l=><a key={l.href} href={l.href} aria-label={l.label} rel="noopener noreferrer" target="_blank">{l.icon}<span>{l.label}</span></a>)}</nav>:<Caption>{emptyLabel}</Caption>}
