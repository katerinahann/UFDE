import type { ReactNode } from 'react';
export function Eyebrow({children}: {children:ReactNode}) { return <p className="eyebrow">{children}</p> }
export function DemoBadge({label='Demonstration content'}:{label?:string}) { return <span className="demo-badge">{label}</span> }
