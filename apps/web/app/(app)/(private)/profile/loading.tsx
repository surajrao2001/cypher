import { PageLoading } from '@/features/shell/AsyncState';

export default function ProfileLoading() {
  return <PageLoading variant="profile" className="px-4 py-8 md:px-8" label="Loading profile" />;
}
