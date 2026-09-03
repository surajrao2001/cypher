import type { Metadata } from 'next';

import { OrganizeHome } from '@/features/organize/OrganizeHome';

export const metadata: Metadata = { title: 'Organize' };

export default function OrganizePage() {
  return <OrganizeHome />;
}
