/**
 * Export scheduler service for automated export generation and delivery
 */
import { ExportService } from './ExportService';
import { UserService } from './UserService';
import { TimeEntryService } from './TimeEntryService';
import { HabitService } from './HabitService';
import { ExportConfiguration } from '@/types/export';
import { createRouteHandlerClient } from '@/lib/supabase-server';

interface ScheduledExportJob {
  id: string;
  configId: string;
  userId: string;
  scheduledFor: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
}

export class ExportScheduler {
  private static jobs: Map<string, ScheduledExportJob> = new Map();
  private static isRunning = false;
  private static processingInterval: NodeJS.Timeout | null = null;

  /**
   * Start the export scheduler
   */
  static start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Export scheduler started');

    // Process jobs every minute
    this.processingInterval = setInterval(async () => {
      await this.processScheduledJobs();
    }, 60 * 1000);

    // Initial scheduling of all active configurations
    this.scheduleAllActiveConfigurations();
  }

  /**
   * Stop the export scheduler
   */
  static stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    console.log('Export scheduler stopped');
  }

  /**
   * Schedule a single export configuration
   */
  static async scheduleExportConfiguration(config: ExportConfiguration): Promise<void> {
    if (!config.is_active) return;

    const nextScheduledTime = this.calculateNextScheduledTime(config);
    const jobId = `${config.id}-${nextScheduledTime.getTime()}`;

    const job: ScheduledExportJob = {
      id: jobId,
      configId: config.id,
      userId: config.user_id,
      scheduledFor: nextScheduledTime,
      status: 'pending',
      attempts: 0
    };

    this.jobs.set(jobId, job);
    console.log(`Scheduled export job ${jobId} for ${nextScheduledTime.toISOString()}`);
  }

  /**
   * Remove scheduled jobs for a configuration
   */
  static removeScheduledJobs(configId: string): void {
    const jobsToRemove = Array.from(this.jobs.values())
      .filter(job => job.configId === configId);

    jobsToRemove.forEach(job => {
      this.jobs.delete(job.id);
    });

    console.log(`Removed ${jobsToRemove.length} scheduled jobs for config ${configId}`);
  }

  /**
   * Calculate the next scheduled time for a configuration
   */
  private static calculateNextScheduledTime(config: ExportConfiguration): Date {
    const now = new Date();
    const [hours, minutes] = config.schedule_time.split(':').map(Number);

    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    // If the scheduled time has already passed today, schedule for the appropriate next occurrence
    if (nextRun <= now) {
      switch (config.frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }
    }

    return nextRun;
  }

  /**
   * Schedule all active export configurations
   */
  private static async scheduleAllActiveConfigurations(): Promise<void> {
    try {
      // This would typically query all active export configurations from the database
      // For now, we'll use a placeholder implementation
      console.log('Scheduling all active export configurations...');

      // TODO: Implement database query to get all active configurations
      // const configs = await this.getAllActiveExportConfigurations();
      // for (const config of configs) {
      //   await this.scheduleExportConfiguration(config);
      // }
    } catch (error) {
      console.error('Error scheduling export configurations:', error);
    }
  }

  /**
   * Process all scheduled jobs that are due
   */
  private static async processScheduledJobs(): Promise<void> {
    const now = new Date();
    const dueJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'pending' && job.scheduledFor <= now);

    if (dueJobs.length === 0) return;

    console.log(`Processing ${dueJobs.length} due export jobs...`);

    for (const job of dueJobs) {
      await this.processJob(job);
    }
  }

  /**
   * Process a single export job
   */
  private static async processJob(job: ScheduledExportJob): Promise<void> {
    console.log(`Processing export job ${job.id}`);

    try {
      // Update job status
      job.status = 'processing';
      job.attempts++;
      job.lastAttempt = new Date();

      // Get the export configuration
      const config = await this.getExportConfiguration(job.configId);
      if (!config) {
        throw new Error(`Export configuration ${job.configId} not found`);
      }

      // Generate date range for export
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (config.date_range_days || 30));

      // Generate export data
      const exportData = await this.generateExportData(job.userId, startDate, endDate, config.format);

      // Generate export file
      let exportBuffer: Buffer;
      switch (config.format) {
        case 'csv':
          exportBuffer = await ExportService.generateCSV(exportData);
          break;
        case 'pdf':
          exportBuffer = await ExportService.generatePDF(exportData);
          break;
        case 'xlsx':
          exportBuffer = await ExportService.generateExcel(exportData);
          break;
        default:
          throw new Error(`Unsupported export format: ${config.format}`);
      }

      // Send export via email
      if (config.email_recipients && config.email_recipients.length > 0) {
        await this.sendExportEmail(config, exportBuffer, startDate, endDate);
      }

      // Mark job as completed
      job.status = 'completed';

      // Update last sent time in configuration
      await this.updateConfigurationLastSent(config.id, new Date());

      // Schedule next job
      const nextConfig = { ...config, last_sent_at: new Date().toISOString() };
      await this.scheduleExportConfiguration(nextConfig);

      console.log(`Export job ${job.id} completed successfully`);

    } catch (error) {
      console.error(`Export job ${job.id} failed:`, error);

      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';

      // Retry logic (max 3 attempts)
      if (job.attempts < 3) {
        // Schedule retry in 10 minutes
        const retryTime = new Date();
        retryTime.setMinutes(retryTime.getMinutes() + 10);
        job.scheduledFor = retryTime;
        job.status = 'pending';
        console.log(`Retrying export job ${job.id} in 10 minutes (attempt ${job.attempts + 1}/3)`);
      }
    }
  }

  /**
   * Generate export data for a user and date range
   */
  private static async generateExportData(userId: string, startDate: Date, endDate: Date, format: string): Promise<any> {
    const timeEntries = await TimeEntryService.getTimeEntriesForPeriod(userId, startDate.toISOString(), endDate.toISOString());

    // TODO: Get habits data if needed
    // const habitsData = await HabitService.getHabitsForPeriod(userId, startDate.toISOString(), endDate.toISOString());

    const exportData = {
      entries: timeEntries.data || [],
      summary: {
        total_entries: timeEntries.data?.length || 0,
        total_hours: (timeEntries.data || []).reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) / 60,
        total_breaks_minutes: (timeEntries.data || []).reduce((sum, entry) => sum + (entry.break_minutes || 0), 0),
        total_overtime_minutes: (timeEntries.data || []).reduce((sum, entry) => sum + (entry.overtime_minutes || 0), 0),
        average_hours_per_day: 0 // Calculate based on date range
      },
      user: {
        name: 'User', // Get from UserService
        email: 'user@example.com', // Get from UserService
        period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
      }
    };

    return exportData;
  }

  /**
   * Send export via email
   */
  private static async sendExportEmail(config: ExportConfiguration, exportBuffer: Buffer, startDate: Date, endDate: Date): Promise<void> {
    // TODO: Implement email sending functionality
    console.log(`Would send ${config.format} export to:`, config.email_recipients);
    console.log(`Export size: ${exportBuffer.length} bytes`);
    console.log(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);

    // Placeholder for actual email implementation
    // This would typically use a service like SendGrid, AWS SES, or similar
  }

  /**
   * Get export configuration by ID
   */
  private static async getExportConfiguration(configId: string): Promise<ExportConfiguration | null> {
    // TODO: Implement database query
    console.log(`Getting export configuration ${configId}`);
    return null; // Placeholder
  }

  /**
   * Update configuration's last sent time
   */
  private static async updateConfigurationLastSent(configId: string, lastSent: Date): Promise<void> {
    // TODO: Implement database update
    console.log(`Updating last sent time for config ${configId} to ${lastSent.toISOString()}`);
  }

  /**
   * Get job status for monitoring
   */
  static getJobStatus(): { pending: number; processing: number; completed: number; failed: number } {
    const jobs = Array.from(this.jobs.values());

    return {
      pending: jobs.filter(job => job.status === 'pending').length,
      processing: jobs.filter(job => job.status === 'processing').length,
      completed: jobs.filter(job => job.status === 'completed').length,
      failed: jobs.filter(job => job.status === 'failed').length
    };
  }

  /**
   * Get all jobs for debugging
   */
  static getAllJobs(): ScheduledExportJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Clear completed and failed jobs (cleanup)
   */
  static clearOldJobs(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = new Date();
    const jobsToRemove: string[] = [];

    this.jobs.forEach((job, jobId) => {
      if ((job.status === 'completed' || job.status === 'failed') && job.lastAttempt) {
        const age = now.getTime() - job.lastAttempt.getTime();
        if (age > maxAge) {
          jobsToRemove.push(jobId);
        }
      }
    });

    jobsToRemove.forEach(jobId => {
      this.jobs.delete(jobId);
    });

    if (jobsToRemove.length > 0) {
      console.log(`Cleaned up ${jobsToRemove.length} old export jobs`);
    }
  }
}

// Auto-start the scheduler in production
if (process.env.NODE_ENV === 'production') {
  ExportScheduler.start();
}

export default ExportScheduler;