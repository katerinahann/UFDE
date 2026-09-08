import {renderRoute,routeMetadata,routeParams,type RouteProps} from '@/lib/routes';
export function generateStaticParams(){return routeParams('uk')}
export function generateMetadata(props:RouteProps){return routeMetadata('uk',props)}
export default function Page(props:RouteProps){return renderRoute('uk',props)}
