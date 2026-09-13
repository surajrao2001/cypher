import type { Metadata } from 'next';

import { CreateOrganizerForm } from '@/features/organize/CreateOrganizerForm';

export const metadata: Metadata = { title: 'New organizer profile' };

export default function NewOrganizerPage() {
  return <CreateOrganizerForm />;
}
