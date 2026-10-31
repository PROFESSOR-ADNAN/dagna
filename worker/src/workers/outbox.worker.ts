import mongoose from 'mongoose';

// Minimal schema models for outbox and standings inside worker
const OutboxSchema = new mongoose.Schema({
  eventId: String,
  eventType: String,
  payload: mongoose.Schema.Types.Mixed,
  relayed: Boolean,
});
const Outbox = mongoose.models.Outbox || mongoose.model('Outbox', OutboxSchema);

export class OutboxRelayWorker {
  private isRunning = false;

  public async start(): Promise<void> {
    this.isRunning = true;
    console.log('[DAGNA-OUTBOX-RELAY] Starting transactional outbox consumer loop...');

    while (this.isRunning) {
      try {
        const pendingEvents = await Outbox.find({ relayed: false }).limit(20);

        for (const evt of pendingEvents) {
          await this.processEvent(evt);
          evt.relayed = true;
          await evt.save();
        }

        if (pendingEvents.length === 0) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (err: any) {
        console.error('[DAGNA-OUTBOX-RELAY] Error processing outbox events:', err.message);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  public stop(): void {
    this.isRunning = false;
  }

  private async processEvent(evt: any): Promise<void> {
    console.log(`[DAGNA-OUTBOX-RELAY] Dispatched event ${evt.eventId} (${evt.eventType})`);
  }
}
