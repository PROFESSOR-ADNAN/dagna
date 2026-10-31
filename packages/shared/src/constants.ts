export const PROTOCOL_VERSION = 'DAGNA-PROTOCOL-v1';

export const VERDICTS = {
  AC: 'AC',   // Accepted
  WA: 'WA',   // Wrong Answer
  TLE: 'TLE', // Time Limit Exceeded
  MLE: 'MLE', // Memory Limit Exceeded
  RE: 'RE',   // Runtime Error
  OLE: 'OLE', // Output Limit Exceeded
  CE: 'CE',   // Compile Error
  SE: 'SE',   // System Error
} as const;

export type Verdict = typeof VERDICTS[keyof typeof VERDICTS];

export const SUBMISSION_STATES = {
  QUEUED: 'queued',
  LEASED: 'leased',
  COMPILING: 'compiling',
  RUNNING: 'running',
  JUDGED: 'judged',
  ERROR: 'error',
} as const;

export type SubmissionState = typeof SUBMISSION_STATES[keyof typeof SUBMISSION_STATES];

export const CONTEST_STATES = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  RUNNING: 'running',
  ENDED: 'ended',
  FINALIZED: 'finalized',
} as const;

export type ContestState = typeof CONTEST_STATES[keyof typeof CONTEST_STATES];

export const SCORING_MODES = {
  ICPC: 'icpc',
  OI: 'oi',
} as const;

export type ScoringMode = typeof SCORING_MODES[keyof typeof SCORING_MODES];

export const ROLES = {
  USER: 'user',
  SETTER: 'setter',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const GROUP_ROLES = {
  OWNER: 'owner',
  COORDINATOR: 'coordinator',
  MEMBER: 'member',
} as const;

export type GroupRole = typeof GROUP_ROLES[keyof typeof GROUP_ROLES];

export const LANGUAGES = {
  CPP: 'cpp',
  PYTHON: 'python',
  JAVA: 'java',
  JAVASCRIPT: 'javascript',
} as const;

export type SupportedLanguage = typeof LANGUAGES[keyof typeof LANGUAGES];

export interface LanguageConfig {
  id: SupportedLanguage;
  name: string;
  sourceFile: string;
  compileCmd?: string[];
  runCmd: string[];
  timeFactor: number;
  memoryAllowanceMB: number;
  pidsLimit: number;
}

export const LANGUAGE_REGISTRY: Record<SupportedLanguage, LanguageConfig> = {
  cpp: {
    id: 'cpp',
    name: 'GNU C++20 (GCC 13.3+)',
    sourceFile: 'solution.cpp',
    compileCmd: ['/usr/bin/g++', '-O2', '-std=c++20', '-static', 'solution.cpp', '-o', 'solution'],
    runCmd: ['./solution'],
    timeFactor: 1.0,
    memoryAllowanceMB: 0,
    pidsLimit: 32,
  },
  python: {
    id: 'python',
    name: 'Python 3.12',
    sourceFile: 'solution.py',
    runCmd: ['/usr/bin/python3', '-S', '-B', 'solution.py'],
    timeFactor: 2.5,
    memoryAllowanceMB: 32,
    pidsLimit: 32,
  },
  java: {
    id: 'java',
    name: 'Java (OpenJDK 21 LTS)',
    sourceFile: 'Solution.java',
    compileCmd: ['/usr/bin/javac', 'Solution.java'],
    runCmd: ['/usr/bin/java', '-XX:+UseSerialGC', '-Xms32m', '-XX:ActiveProcessorCount=1', 'Solution'],
    timeFactor: 2.0,
    memoryAllowanceMB: 64,
    pidsLimit: 64,
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript (Node.js 22 LTS)',
    sourceFile: 'solution.js',
    runCmd: ['/usr/bin/node', '--max-old-space-size=256', 'solution.js'],
    timeFactor: 2.0,
    memoryAllowanceMB: 48,
    pidsLimit: 48,
  },
};

export const DEFAULT_LIMITS = {
  MAX_SOURCE_SIZE_BYTES: 64 * 1024,      // 64 KB
  MAX_OUTPUT_BYTES: 16 * 1024 * 1024,    // 16 MB max stdout
  MAX_STDERR_CAPTURED_BYTES: 4 * 1024,   // 4 KB stored
  DEFAULT_TIME_LIMIT_MS: 1000,           // 1.0 s
  DEFAULT_MEMORY_LIMIT_MB: 256,          // 256 MB
  LEASE_DURATION_SECONDS: 30,
  HEARTBEAT_INTERVAL_SECONDS: 10,
  MAX_JOB_ATTEMPTS: 3,
};
