import {renderRoute,routeMetadata,routeParams,type RouteProps} from '@/lib/routes';
export function generateStaticParams(){return routeParams('en')}
export function generateMetadata(props:RouteProps){return routeMetadata('en',props)}
export default function Page(props:RouteProps){return renderRoute('en',props)}
