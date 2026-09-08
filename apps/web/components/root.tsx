import {Inter} from 'next/font/google';
import type {Locale} from '@ufde/config';
import '../app/globals.css';
import '../../../packages/ui/src/tokens.css';
const inter=Inter({subsets:['latin','cyrillic'],variable:'--font-inter',display:'swap'});
export function Root({children,locale}:{children:React.ReactNode;locale:Locale}){return <html lang={locale}><body className={inter.variable}>{children}</body></html>}

import './home.css';

import './about.css';

import './strategic-areas.css';

import './activities.css';

import './projects.css';
