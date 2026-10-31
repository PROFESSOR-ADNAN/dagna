import Dexie, { type Table } from 'dexie';

export interface CodeDraft {
  problemId: string;
  language: string;
  code: string;
  updatedAt: number;
}

export interface QueuedSubmission {
  clientSubmissionId: string;
  problemId: string;
  language: string;
  source: string;
  contestId?: string;
  queuedAt: number;
  status: 'pending' | 'sent' | 'failed';
}

export class DagnaDexieDB extends Dexie {
  drafts!: Table<CodeDraft, [string, string]>;
  submissionQueue!: Table<QueuedSubmission, string>;

  constructor() {
    super('DagnaOfflineDB');
    this.version(1).stores({
      drafts: '[problemId+language], updatedAt',
      submissionQueue: 'clientSubmissionId, status, queuedAt',
    });
  }
}

export const offlineDB = new DagnaDexieDB();
