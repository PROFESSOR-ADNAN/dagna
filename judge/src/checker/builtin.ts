import { VERDICTS, Verdict } from '@dagna/shared';

export interface CheckerResult {
  verdict: Verdict;
  message: string;
}

export class BuiltinCheckers {
  static checkExact(participantOutput: string, juryAnswer: string): CheckerResult {
    if (participantOutput === juryAnswer) {
      return { verdict: VERDICTS.AC, message: 'OK: Exact byte-for-byte match' };
    }
    return { verdict: VERDICTS.WA, message: 'WA: Output does not match jury answer' };
  }

  static checkLines(participantOutput: string, juryAnswer: string): CheckerResult {
    const pLines = participantOutput.replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd());
    const jLines = juryAnswer.replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd());

    // Trim trailing empty lines
    while (pLines.length > 0 && pLines[pLines.length - 1] === '') pLines.pop();
    while (jLines.length > 0 && jLines[jLines.length - 1] === '') jLines.pop();

    if (pLines.length !== jLines.length) {
      return {
        verdict: VERDICTS.WA,
        message: `WA: Line count mismatch. Expected ${jLines.length} lines, got ${pLines.length} lines.`,
      };
    }

    for (let i = 0; i < pLines.length; i++) {
      if (pLines[i] !== jLines[i]) {
        return {
          verdict: VERDICTS.WA,
          message: `WA: Difference on line ${i + 1}. Expected: "${jLines[i]}", Got: "${pLines[i]}"`,
        };
      }
    }

    return { verdict: VERDICTS.AC, message: 'OK: All lines matched' };
  }

  static checkTokens(participantOutput: string, juryAnswer: string): CheckerResult {
    const pTokens = participantOutput.trim().split(/\s+/).filter(Boolean);
    const jTokens = juryAnswer.trim().split(/\s+/).filter(Boolean);

    if (pTokens.length !== jTokens.length) {
      return {
        verdict: VERDICTS.WA,
        message: `WA: Token count mismatch. Expected ${jTokens.length} tokens, got ${pTokens.length} tokens.`,
      };
    }

    for (let i = 0; i < pTokens.length; i++) {
      if (pTokens[i] !== jTokens[i]) {
        return {
          verdict: VERDICTS.WA,
          message: `WA: Token ${i + 1} mismatch. Expected "${jTokens[i]}", got "${pTokens[i]}"`,
        };
      }
    }

    return { verdict: VERDICTS.AC, message: 'OK: All tokens matched' };
  }

  static checkFloat(participantOutput: string, juryAnswer: string, epsilon = 1e-6): CheckerResult {
    const pTokens = participantOutput.trim().split(/\s+/).filter(Boolean);
    const jTokens = juryAnswer.trim().split(/\s+/).filter(Boolean);

    if (pTokens.length !== jTokens.length) {
      return {
        verdict: VERDICTS.WA,
        message: `WA: Token count mismatch in float comparison`,
      };
    }

    for (let i = 0; i < pTokens.length; i++) {
      const pVal = Number(pTokens[i]);
      const jVal = Number(jTokens[i]);

      if (isNaN(pVal) || !isFinite(pVal)) {
        return { verdict: VERDICTS.WA, message: `WA: Participant output contains NaN or Infinity at token ${i + 1}` };
      }

      if (isNaN(jVal) || !isFinite(jVal)) {
        return { verdict: VERDICTS.SE, message: `SE: Jury answer contains invalid float representation at token ${i + 1}` };
      }

      const diff = Math.abs(pVal - jVal);
      const relativeDiff = diff / Math.max(1.0, Math.abs(jVal));

      if (diff > epsilon && relativeDiff > epsilon) {
        return {
          verdict: VERDICTS.WA,
          message: `WA: Float token ${i + 1} error exceeded tolerance. Expected ${jVal}, got ${pVal} (diff: ${diff})`,
        };
      }
    }

    return { verdict: VERDICTS.AC, message: 'OK: Floats within epsilon tolerance' };
  }
}
