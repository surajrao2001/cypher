import { PageLoading } from '@/features/shell/AsyncState';

export default function TicketsLoading() {
  return <PageLoading variant="list" className="px-4 py-8 md:px-8" label="Loading tickets" />;
}
