import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { createApiApp } from '../app.ts';
import { Task } from '../models/Task.ts';
import { User } from '../models/User.ts';
import { signToken, verifyToken } from '../utils/jwt.ts';
import {
  escapeRegex,
  isValidEmail,
  isValidObjectId,
  isValidPriority,
  isValidStatus,
  parseOptionalDate,
} from '../utils/validators.ts';

function requestJson(
  server: http.Server,
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; data: Record<string, unknown>; raw: Buffer }> {
  return new Promise((resolve, reject) => {
    const address = server.address();
    if (!address || typeof address === 'string') {
      reject(new Error('Invalid test server address'));
      return;
    }

    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path,
        method,
        headers: {
          ...(payload
            ? {
                'Content-Type': 'application/json',
                'Content-Length': String(Buffer.byteLength(payload)),
              }
            : {}),
          ...headers,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => {
          const raw = Buffer.concat(chunks);
          let parsed: Record<string, unknown> = {};
          try {
            parsed = JSON.parse(raw.toString('utf8')) as Record<string, unknown>;
          } catch {
            // Binary or non-JSON response
          }
          resolve({ status: res.statusCode ?? 0, data: parsed, raw });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('Validators block NoSQL injection payloads and invalid formats', () => {
  assert.equal(isValidEmail('student@example.com'), true);
  assert.equal(isValidEmail({ $gt: '' }), false);
  assert.equal(isValidEmail('invalid-email'), false);

  assert.equal(isValidPriority('High'), true);
  assert.equal(isValidPriority('Urgent'), false);
  assert.equal(isValidStatus('In Progress'), true);
  assert.equal(isValidStatus({ $ne: null }), false);

  assert.equal(isValidObjectId('507f1f77bcf86cd799439011'), true);
  assert.equal(isValidObjectId('not-an-object-id'), false);

  const validDate = parseOptionalDate('2026-12-01T23:59:00.000Z');
  assert.equal(validDate.valid, true);
  const badDate = parseOptionalDate('not-a-date');
  assert.equal(badDate.valid, false);

  assert.equal(escapeRegex('a+b(c)?'), 'a\\+b\\(c\\)\\?');
});

test('Mongoose User and Task schemas enforce required fields and enums', () => {
  const invalidUser = new User({ name: 'A', email: 'bad-email', password: '123' });
  const userErr = invalidUser.validateSync();
  assert.ok(userErr?.errors.name);
  assert.ok(userErr?.errors.email);
  assert.ok(userErr?.errors.password);

  const validUser = new User({
    name: 'Alex Morgan',
    email: 'alex@example.com',
    password: 'password123',
  });
  assert.equal(validUser.validateSync(), undefined);

  const invalidTask = new Task({
    user: new mongoose.Types.ObjectId(),
    title: '',
    priority: 'Critical',
    status: 'Archived',
  });
  const taskErr = invalidTask.validateSync();
  assert.ok(taskErr?.errors.title);
  assert.ok(taskErr?.errors.priority);
  assert.ok(taskErr?.errors.status);

  const validTask = new Task({
    user: new mongoose.Types.ObjectId(),
    title: 'Complete internship documentation',
    priority: 'High',
    status: 'Pending',
    category: 'Work',
  });
  assert.equal(validTask.validateSync(), undefined);
});

test('JWT signing and bcrypt password hashing work correctly', async () => {
  const token = signToken('507f1f77bcf86cd799439011');
  const decoded = verifyToken(token);
  assert.equal(decoded.id, '507f1f77bcf86cd799439011');

  const hash = await bcrypt.hash('SecretPass123', 10);
  assert.notEqual(hash, 'SecretPass123');
  assert.equal(await bcrypt.compare('SecretPass123', hash), true);
  assert.equal(await bcrypt.compare('WrongPassword', hash), false);
});

test('Express API endpoints respond cleanly for health, auth guards, and ZIP export', async () => {
  const app = createApiApp({ enableCors: false, mountApi404: true });
  const server = app.listen(0);

  try {
    const health = await requestJson(server, 'GET', '/api/health');
    assert.equal(health.status, 200);
    assert.equal(health.data.success, true);
    assert.equal(health.data.service, 'Taskora API');

    const unknownRoute = await requestJson(server, 'GET', '/api/does-not-exist');
    assert.equal(unknownRoute.status, 404);
    assert.equal(unknownRoute.data.success, false);

    // Protected route without DB or token returns 503 (if DB disconnected) or 401
    const tasksNoAuth = await requestJson(server, 'GET', '/api/tasks');
    assert.ok(tasksNoAuth.status === 401 || tasksNoAuth.status === 503);

    // Export ZIP endpoint returns a valid PK zip archive
    const zipRes = await requestJson(server, 'GET', '/api/export-zip');
    assert.equal(zipRes.status, 200);
    assert.equal(zipRes.raw.subarray(0, 2).toString('utf8'), 'PK');
    assert.ok(zipRes.raw.length > 5000, 'Exported ZIP should contain project files');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
