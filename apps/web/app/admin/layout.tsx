import { Root } from '@/components/root';
import './admin.css';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Root locale="en">{children}</Root>;
}
