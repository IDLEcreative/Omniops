/**
 * Operation Tabs Component
 *
 * Displays execution steps, configuration, and results in a tabbed interface.
 */

'use client';

import { Operation } from '@/hooks/useOperations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

interface OperationTabsProps {
  operation: Operation;
}

export function OperationTabs({ operation }: OperationTabsProps) {
  const steps = operation.metadata?.steps || [];

  return (
    <Tabs defaultValue="steps" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="steps">Execution Steps</TabsTrigger>
        <TabsTrigger value="config">Configuration</TabsTrigger>
        <TabsTrigger value="result">Result</TabsTrigger>
      </TabsList>

      <TabsContent value="steps" className="space-y-3 mt-4">
        {steps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="mx-auto h-8 w-8 mb-2" />
            <p>No execution steps recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : step.status === 'failed' ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{step.step}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(step.timestamp), 'HH:mm:ss')}
                  </p>
                  {step.details && (
                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                      {JSON.stringify(step.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="config" className="mt-4">
        <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto">
          {JSON.stringify(operation.metadata?.config || {}, null, 2)}
        </pre>
      </TabsContent>

      <TabsContent value="result" className="mt-4">
        {operation.status === 'completed' && operation.result ? (
          <div className="space-y-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-900 mb-2">
                Operation Completed Successfully
              </p>
              {operation.result.credentials && (
                <div className="space-y-2">
                  <p className="text-sm text-green-800">
                    Credentials generated and stored securely
                  </p>
                </div>
              )}
            </div>
            <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(operation.result, null, 2)}
            </pre>
          </div>
        ) : operation.status === 'failed' && operation.error_message ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-medium text-red-900 mb-2">Operation Failed</p>
            <p className="text-sm text-red-800">{operation.error_message}</p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
            <p>No result available yet</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
