import PerformanceMonitoring from '@/components/dashboard/PerformanceMonitoring';

export default function PerformancePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Widget Performance Monitoring
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Real-time performance metrics, health scores, and system alerts for the chat widget.
        </p>
      </div>
      <PerformanceMonitoring />
    </div>
  );
}
