import type { Metadata } from 'next';
import AdminDashboard from './dashboard';
export const metadata: Metadata = {
  title: 'UFDE Administration',
  robots: { index: false, follow: false },
};
export default function Page() {
  return <AdminDashboard />;
}
