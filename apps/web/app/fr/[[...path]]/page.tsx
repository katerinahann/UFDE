import {renderRoute,routeMetadata,routeParams,type RouteProps} from '@/lib/routes';
export const dynamicParams = process.env.UFDE_STATIC_EXPORT === 'true' ? false : true;
export function generateStaticParams(){return routeParams('fr')}
export function generateMetadata(props:RouteProps){return routeMetadata('fr',props)}
export default function Page(props:RouteProps){return renderRoute('fr',props)}
