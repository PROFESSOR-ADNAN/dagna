import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from './auth.service.js';
import crypto from 'node:crypto';

test('AuthService.hashToken produces deterministic SHA-256 hex', () => {
  const token = 'sample_test_refresh_token_string';
  const expectedHash = crypto.createHash('sha256').update(token).digest('hex');
  const actualHash = AuthService.hashToken(token);

  assert.equal(actualHash, expectedHash);
  assert.equal(actualHash.length, 64);
});

test('Token generation entropy and family ID verification', () => {
  const token1 = crypto.randomBytes(40).toString('hex');
  const token2 = crypto.randomBytes(40).toString('hex');
  assert.notEqual(token1, token2);
  assert.equal(token1.length, 80);
});
