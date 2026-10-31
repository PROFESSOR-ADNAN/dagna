import { z } from 'zod';
import { LANGUAGES, SCORING_MODES, ROLES, GROUP_ROLES, VERDICTS } from './constants.js';

export const RegisterSchema = z.object({
  email: z.string().email().max(255),
  handle: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/, {
    message: 'Handle must contain only letters, numbers, and underscores',
  }),
  displayName: z.string().min(1).max(64),
  password: z.string().min(8).max(128),
});

export const LoginSchema = z.object({
  emailOrHandle: z.string().min(1).max(255),
  password: z.string().min(1).max(128),
  totpCode: z.string().length(6).optional(),
});

export const SubmissionCreateSchema = z.object({
  problemId: z.string().min(1),
  language: z.enum([LANGUAGES.CPP, LANGUAGES.PYTHON, LANGUAGES.JAVA, LANGUAGES.JAVASCRIPT]),
  source: z.string().min(1).max(64 * 1024, { message: 'Source code exceeds 64 KB limit' }),
  contestId: z.string().optional(),
  clientSubmissionId: z.string().uuid(),
});

export const ContestCreateSchema = z.object({
  title: z.string().min(3).max(128),
  description: z.string().max(4096).default(''),
  visibility: z.enum(['public', 'group', 'unlisted']),
  groupId: z.string().optional(),
  mode: z.enum([SCORING_MODES.ICPC, SCORING_MODES.OI]),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  freezeAt: z.coerce.date().optional(),
  penaltyMinutes: z.number().int().min(0).max(60).default(20),
  rated: z.boolean().default(false),
  problemIds: z.array(z.string()).min(1),
  showVerdictsDuringContest: z.boolean().default(true),
}).refine((data) => data.endAt > data.startAt, {
  message: 'Contest endAt must be after startAt',
  path: ['endAt'],
});

export const ProblemCreateSchema = z.object({
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(128),
  visibility: z.enum(['draft', 'contest_only', 'public', 'archived']).default('draft'),
  tags: z.array(z.string()).default([]),
  difficulty: z.number().int().min(800).max(3500).default(1200),
  author: z.string().min(1).max(128),
  source: z.string().max(256).default('Original'),
  license: z.string().max(128).default('CC-BY-4.0'),
});

export const JobClaimSchema = z.object({
  nodeId: z.string().min(1),
  toolchainDigests: z.record(z.string()).default({}),
  calibrationScore: z.number().default(100),
});

export const JobHeartbeatSchema = z.object({
  nodeId: z.string().min(1),
  generation: z.number().int().positive(),
});

export const TestBatchResultSchema = z.object({
  testIndex: z.number().int().nonnegative(),
  verdict: z.enum([
    VERDICTS.AC,
    VERDICTS.WA,
    VERDICTS.TLE,
    VERDICTS.MLE,
    VERDICTS.RE,
    VERDICTS.OLE,
    VERDICTS.CE,
    VERDICTS.SE,
  ]),
  timeMs: z.number().int().nonnegative(),
  memoryKB: z.number().int().nonnegative(),
  checkerMessage: z.string().max(1024).default(''),
});

export const JobCompleteSchema = z.object({
  nodeId: z.string().min(1),
  generation: z.number().int().positive(),
  verdict: z.enum([
    VERDICTS.AC,
    VERDICTS.WA,
    VERDICTS.TLE,
    VERDICTS.MLE,
    VERDICTS.RE,
    VERDICTS.OLE,
    VERDICTS.CE,
    VERDICTS.SE,
  ]),
  score: z.number().int().nonnegative(),
  timeMs: z.number().int().nonnegative(),
  memoryKB: z.number().int().nonnegative(),
  compileOutput: z.string().max(4096).default(''),
  failedTest: z.number().int().optional(),
  testResults: z.array(TestBatchResultSchema),
});
