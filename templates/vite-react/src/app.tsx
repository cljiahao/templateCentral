import { Providers } from '@/components/layout/providers';
import { AppRouter } from '@/router';

export function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
