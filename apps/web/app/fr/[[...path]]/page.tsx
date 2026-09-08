import {renderRoute,routeMetadata,routeParams,type RouteProps} from '@/lib/routes';
export function generateStaticParams(){return routeParams('fr')}
export function generateMetadata(props:RouteProps){return routeMetadata('fr',props)}
export default function Page(props:RouteProps){return renderRoute('fr',props)}
