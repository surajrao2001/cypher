import type { Metadata } from 'next';

import { OrganizeHome } from '@/features/organize/OrganizeHome';

export const metadata: Metadata = { title: 'Your Events' };

export default function OrganizePage() {
  return <OrganizeHome />;
}
