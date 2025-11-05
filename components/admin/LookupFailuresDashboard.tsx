'use client';

import { useState, useEffect, useCallback } from 'react';

interface LookupFailureStats {
  totalFailures: number;
  byErrorType: Record<string, number>;
  byPlatform: Record<string, number>;
  topFailedQueries: Array<{ query: string; count: number }>;
  commonPatterns: string[];
}

interface DashboardData {
  stats: LookupFailureStats;
  period: string;
  domainId: string;
}

export default function LookupFailuresDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [domainId, setDomainId] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ days: days.toString() });
      if (domainId) params.append('domainId', domainId);

      const response = await fetch(`/api/admin/lookup-failures?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [days, domainId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats } = data;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Lookup Failure Dashboard
        </h1>

        {/* Filters */}
        <div className="flex gap-4">
          <div>
            <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-1">
              Time Period (Days)
            </label>
            <select
              id="days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          <div>
            <label htmlFor="domainId" className="block text-sm font-medium text-gray-700 mb-1">
              Domain ID (Optional)
            </label>
            <input
              id="domainId"
              type="text"
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
              placeholder="Filter by domain..."
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Total Failures */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Total Failures</h2>
        <p className="text-4xl font-bold text-red-600">{stats.totalFailures}</p>
        <p className="text-sm text-gray-600 mt-1">{data.period}</p>
      </div>

      {/* Common Patterns */}
      {stats.commonPatterns.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">⚠️</span>
            Patterns Detected
          </h2>
          <ul className="space-y-2">
            {stats.commonPatterns.map((pattern, idx) => (
              <li key={idx} className="text-yellow-800">• {pattern}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Types & Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Error Type */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">By Error Type</h2>
          <div className="space-y-3">
            {Object.entries(stats.byErrorType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const percentage = Math.round((count / stats.totalFailures) * 100);
                return (
                  <div key={type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{type}</span>
                      <span className="text-gray-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* By Platform */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">By Platform</h2>
          <div className="space-y-3">
            {Object.entries(stats.byPlatform)
              .sort((a, b) => b[1] - a[1])
              .map(([platform, count]) => {
                const percentage = Math.round((count / stats.totalFailures) * 100);
                return (
                  <div key={platform}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{platform}</span>
                      <span className="text-gray-600">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Top Failed Queries */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top 10 Failed Queries</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Query
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Failures
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.topFailedQueries.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    #{idx + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                    {item.query}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {item.count}x
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
