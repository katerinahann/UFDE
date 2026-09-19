export const metadata = {robots:{index:false,follow:false}};
import {Root} from '@/components/root';
export default function Layout({children}:{children:React.ReactNode}){return <Root locale="en">{children}</Root>}
