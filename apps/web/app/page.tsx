import { routes } from '@cypher/contracts';
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect(routes.discover);
}
