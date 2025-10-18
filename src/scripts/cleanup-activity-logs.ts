/**
 * Script to clean up old activity logs (older than a week)
 * This can be run periodically or triggered by admin action
 */

import { activityLogService } from '@/lib/firestore';

export async function cleanupOldActivityLogs(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const deletedCount = await activityLogService.cleanupOldLogs();
    return {
      success: true,
      deletedCount
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// If running as standalone script
if (typeof window === 'undefined') {
  cleanupOldActivityLogs()
    .then(result => {
      if (result.success) {
        console.log(`Successfully deleted ${result.deletedCount} old activity log entries`);
      } else {
        console.error('Failed to cleanup activity logs:', result.error);
      }
    })
    .catch(error => {
      console.error('Script execution failed:', error);
    });
}