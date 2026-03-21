import { CustomCard } from '@/components/widgets';
import { ENV } from '@/lib/constants/env';
import { PAGE_ROUTES } from '@/lib/constants/routes';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/use-auth';

export function LoginCard() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleDevLogin = () => {
    login({ id: 'dev', name: 'Dev User', email: 'dev@local' });
    navigate(PAGE_ROUTES.DASHBOARD);
  };

  return (
    <CustomCard
      header="Sign In"
      description="Choose a sign-in method to continue."
      className="w-full max-w-md shadow-lg"
    >
      <div className="flex flex-col gap-4">
        {/* Add your SSO / OAuth login button here */}
        {ENV.IS_DEV && (
          <button
            type="button"
            className="rounded-md border-2 bg-white px-4 py-3 text-sm text-gray-500 hover:bg-gray-100"
            onClick={handleDevLogin}
          >
            Dev login (bypass auth)
          </button>
        )}
      </div>
    </CustomCard>
  );
}
