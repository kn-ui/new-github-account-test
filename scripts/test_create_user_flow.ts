#!/usr/bin/env ts-node
import 'dotenv/config';
import { getHygraphUserByUid } from '../server/src/lib/hygraph';
import { createClerkClient } from '@clerk/backend';

async function main() {
  const base = process.env.TEST_API_BASE_URL || 'http://localhost:5000';

  const email = `test+${Date.now()}@example.com`;
  const displayName = 'Test User';

  console.log('Calling server /api/users to create Clerk + Hygraph');
  const res = await fetch(`${base}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || 'dev'}` },
    body: JSON.stringify({ email, displayName, role: 'student' })
  } as any);
  const json: any = await (res as any).json();
  console.log('Server response', json);

  if (!res.ok) throw new Error(`Server call failed: ${res.status}`);

  const uid = json?.data?.uid;
  if (!uid) throw new Error('No uid returned from server');

  console.log('Query Hygraph for created user by uid');
  const hg = await getHygraphUserByUid(uid);
  if (!hg || hg.email !== email) throw new Error('Hygraph user not found or email mismatch');

  // Cleanup Clerk user if possible
  try {
    if (process.env.CLERK_SECRET_KEY) {
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      await clerk.users.deleteUser(uid);
      console.log('Cleaned up Clerk user');
    }
  } catch (e) {
    console.warn('Cleanup failed (non-fatal):', (e as any)?.message || e);
  }

  console.log('Test passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
