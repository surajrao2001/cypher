import type { Metadata } from 'next';

import { CreateEventFlow } from '@/features/organize/CreateEventFlow';

export const metadata: Metadata = { title: 'Create' };

export default function OrganizeCreatePage() {
  return <CreateEventFlow />;
}
