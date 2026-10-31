import mongoose from 'mongoose';

const JudgeJobSchema = new mongoose.Schema({
  state: String,
  attempt: Number,
  leaseExpiresAt: Date,
  leaseOwner: String,
});
const JudgeJob = mongoose.models.JudgeJob || mongoose.model('JudgeJob', JudgeJobSchema);

const ContestSchema = new mongoose.Schema({
  state: String,
  startAt: Date,
  endAt: Date,
});
const Contest = mongoose.models.Contest || mongoose.model('Contest', ContestSchema);

export class DagnaScheduler {
  private isRunning = false;

  public async start(): Promise<void> {
    this.isRunning = true;
    console.log('[DAGNA-SCHEDULER] Starting periodic watchdog tasks (contests, lease sweep)...');

    while (this.isRunning) {
      try {
        await this.sweepExpiredLeases();
        await this.advanceContestStates();
      } catch (err: any) {
        console.error('[DAGNA-SCHEDULER] Watchdog sweep error:', err.message);
      }
      await new Promise((r) => setTimeout(r, 5000)); // Every 5s
    }
  }

  public stop(): void {
    this.isRunning = false;
  }

  private async sweepExpiredLeases(): Promise<void> {
    const now = new Date();
    // 1. Expire jobs that exceeded attempt ceiling
    await JudgeJob.updateMany(
      {
        state: 'leased',
        leaseExpiresAt: { $lt: now },
        attempt: { $gte: 3 },
      },
      {
        $set: { state: 'failed' },
      }
    );

    // 2. Return expired leases to queue
    const requeued = await JudgeJob.updateMany(
      {
        state: 'leased',
        leaseExpiresAt: { $lt: now },
        attempt: { $lt: 3 },
      },
      {
        $set: { state: 'queued' },
        $inc: { attempt: 1 },
        $unset: { leaseOwner: 1, leaseExpiresAt: 1 },
      }
    );

    if (requeued.modifiedCount > 0) {
      console.warn(`[DAGNA-SCHEDULER] Requeued ${requeued.modifiedCount} expired leased judge jobs`);
    }
  }

  private async advanceContestStates(): Promise<void> {
    const now = new Date();

    // Promote scheduled contests to running
    await Contest.updateMany(
      {
        state: 'scheduled',
        startAt: { $lte: now },
      },
      {
        $set: { state: 'running' },
      }
    );

    // Promote running contests to ended
    await Contest.updateMany(
      {
        state: 'running',
        endAt: { $lte: now },
      },
      {
        $set: { state: 'ended' },
      }
    );
  }
}
