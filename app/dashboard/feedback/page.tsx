import FeedbackDashboard from '@/components/dashboard/FeedbackDashboard';

export default function FeedbackPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          User Feedback
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Customer satisfaction ratings, feedback submissions, and NPS scores.
        </p>
      </div>
      <FeedbackDashboard />
    </div>
  );
}
