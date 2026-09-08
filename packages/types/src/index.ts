export type ContentKind = 'ACTIVITY' | 'PROJECT' | 'PUBLICATION';
export interface ContentRecord { id: string; slug: string; kind: ContentKind; locale: string; title: string; summary: string; body: string; category: string; isDemo: boolean; publishedAt: string | null; image?: {url:string; alt:string} | null; status?:string|null; startDate?:string|null; endDate?:string|null; seoTitle?:string|null; seoDescription?:string|null; }

export interface PartnerRecord { id:string; name:string; logoUrl?:string; logoAlt?:string; href?:string; isDemo:boolean; }
export interface ActivityDetails {date?:string;location?:string;gallery:{url:string;alt:string;credit?:string}[];partners:PartnerRecord[];programmeUrl?:string;eventUrl?:string}
export type ProjectStatus='Ongoing'|'Upcoming'|'Completed'|'Planned';
export interface ProjectDetails {status?:ProjectStatus;category?:string;startDate?:string;endDate?:string;institutionType?:string;strategicArea?:string;lead?:string;countries:string[];partners:PartnerRecord[];background?:string;objectives:string[];activities:string[];outcomes:string[];resources:{title:string;url:string;format:'PDF'|'Link'}[];relatedActivitySlugs:string[];contactEmail?:string;featured:boolean}
export interface ProjectView {record:ContentRecord;details:ProjectDetails}
export type PublicationType='Scientific Journal'|'Research Reports'|'Policy Briefs'|'Working Papers'|'Articles & Insights';
export interface Publication {title:string;slug:string;type:PublicationType;coverImage?:{url:string;alt:string};summary:string;abstract:string;executiveSummary?:string;authors:string[];publishedAt?:string;year?:number;language:string;pdfUrl?:string;externalUrl?:string;doi?:string;isbn?:string;citation?:string;featured:boolean;status:'Published'|'Forthcoming'|'Draft';isDemo:boolean}
export interface TeamProfileDetails {category:'leadership'|'advisory';expertise:string[];institutionRole?:string;email?:string;linkedin?:string;orcid?:string;googleScholar?:string;institutionalProfile?:string}
export interface TeamProfile extends TeamProfileDetails {id:string;name:string;role:string;biography:string;photoUrl?:string;photoAlt?:string}
