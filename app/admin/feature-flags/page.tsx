import { FeatureFlagManager } from '@/components/admin/FeatureFlagManager';

export default function FeatureFlagsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Feature Flag Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Control feature rollouts, manage pilot customers, and configure system-wide settings.
        </p>
      </div>
      <FeatureFlagManager />
    </div>
  );
}
