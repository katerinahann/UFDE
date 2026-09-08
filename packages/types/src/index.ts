export type ContentKind = 'ACTIVITY' | 'PROJECT' | 'PUBLICATION';
export interface ContentRecord { id: string; slug: string; kind: ContentKind; locale: string; title: string; summary: string; body: string; category: string; isDemo: boolean; publishedAt: string | null; image?: {url:string; alt:string} | null; status?:string|null; startDate?:string|null; endDate?:string|null; seoTitle?:string|null; seoDescription?:string|null; }

export interface PartnerRecord { id:string; name:string; logoUrl?:string; logoAlt?:string; href?:string; isDemo:boolean; }
export interface ActivityDetails {date?:string;location?:string;gallery:{url:string;alt:string;credit?:string}[];partners:PartnerRecord[];programmeUrl?:string;eventUrl?:string}
