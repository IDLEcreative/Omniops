/**
 * Database Operations for Autonomous Agents
 * @module lib/autonomous/core/database-operations
 */

import { createServerClient } from '@/lib/supabase/server';
import { verifyConsent } from '../security/consent-manager';

export class DatabaseOperations {
  private supabase: ReturnType<typeof createServerClient>;

  constructor() {
    this.supabase = createServerClient();
  }

  async verifyConsent(organizationId: string, service: string, operation: string): Promise<void> {
    const verification = await verifyConsent(organizationId, service, operation);

    if (!verification.hasConsent) {
      throw new Error(`Consent required: ${verification.reason}`);
    }
  }

  async updateOperationStatus(
    operationId: string,
    status: 'in_progress' | 'completed' | 'failed',
    result?: { success: boolean; data?: any; error?: string }
  ): Promise<void> {
    const updates: any = { status };

    if (status === 'in_progress') {
      updates.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
      updates.result = result;
    }

    await this.supabase
      .from('autonomous_operations')
      .update(updates)
      .eq('id', operationId);
  }

  async updateOperationSteps(operationId: string, totalSteps: number): Promise<void> {
    await this.supabase
      .from('autonomous_operations')
      .update({ total_steps: totalSteps })
      .eq('id', operationId);
  }

  async updateCurrentStep(operationId: string, stepNumber: number): Promise<void> {
    await this.supabase
      .from('autonomous_operations')
      .update({ current_step: stepNumber })
      .eq('id', operationId);
  }

  async uploadScreenshot(
    operationId: string,
    screenshotBase64: string,
    stepNumber: number
  ): Promise<string> {
    try {
      const buffer = Buffer.from(screenshotBase64, 'base64');
      const fileName = `${operationId}/step-${stepNumber}.png`;

      const { data, error } = await this.supabase
        .storage
        .from('autonomous-screenshots')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) {
        console.error('[DatabaseOperations] Screenshot upload error:', error);
        return '';
      }

      const { data: publicUrlData } = this.supabase
        .storage
        .from('autonomous-screenshots')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('[DatabaseOperations] Screenshot upload error:', error);
      return '';
    }
  }
}
