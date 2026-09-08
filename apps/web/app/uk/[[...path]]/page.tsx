import {renderRoute,routeMetadata,routeParams,type RouteProps} from '@/lib/routes';
export const dynamicParams = process.env.UFDE_STATIC_EXPORT === 'true' ? false : true;
export function generateStaticParams(){return routeParams('uk')}
export function generateMetadata(props:RouteProps){return routeMetadata('uk',props)}
export default function Page(props:RouteProps){return renderRoute('uk',props)}
