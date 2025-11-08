import { EmailService } from './emailService.js';

class OutboxProcessorService {
  constructor() {
    this.emailService = new EmailService();
    this.intervalId = null;
    this.isProcessing = false;
    this.processInterval = 10000; // Process every 10 seconds
  }

  start() {
    if (this.intervalId) {
      console.log('⚠️  Outbox processor already running');
      return;
    }

    console.log('🚀 Starting outbox processor service...');
    console.log(`⏱️  Processing interval: ${this.processInterval / 1000} seconds`);

    // Process immediately on start
    this.processOutbox();

    // Then process at intervals
    this.intervalId = setInterval(() => {
      this.processOutbox();
    }, this.processInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Outbox processor stopped');
    }
  }

  async processOutbox() {
    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('⏭️  Skipping outbox processing (already running)');
      return;
    }

    this.isProcessing = true;

    try {
      const result = await this.emailService.processOutbox();
      
      if (result.processed > 0) {
        console.log(`📤 Processed ${result.processed} emails from outbox`);
        console.log(`✅ Sent: ${result.results.filter(r => r.success).length}`);
        console.log(`❌ Failed: ${result.results.filter(r => !r.success).length}`);
      }
    } catch (error) {
      console.error('❌ Error in outbox processor:', error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  setInterval(milliseconds) {
    this.processInterval = milliseconds;
    
    // Restart with new interval if already running
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }

  getStatus() {
    return {
      running: !!this.intervalId,
      processing: this.isProcessing,
      interval: this.processInterval
    };
  }
}

// Create singleton instance
export const outboxProcessor = new OutboxProcessorService();

// Auto-start on module load
outboxProcessor.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📪 Shutting down outbox processor...');
  outboxProcessor.stop();
});

process.on('SIGINT', () => {
  console.log('📪 Shutting down outbox processor...');
  outboxProcessor.stop();
  process.exit(0);
});
