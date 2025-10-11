#!/usr/bin/env ts-node
import 'dotenv/config';
import fetch from 'node-fetch';
import { createClerkClient } from '@clerk/backend';

async function main() {
  const base = process.env.TEST_API_BASE_URL || 'http://localhost:5000';
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

  const email = `test+${Date.now()}@example.com`;
  const displayName = 'Test User';

  console.log('Creating Clerk user', email);
  const clerkUser = await clerk.users.createUser({
    emailAddress: [email],
    firstName: 'Test',
    lastName: 'User',
    skipPasswordChecks: true,
    skipPasswordRequirement: true,
  });

  console.log('Calling server /api/users to create record');
  const res = await fetch(`${base}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.TEST_BEARER_TOKEN || ''}` },
    body: JSON.stringify({ email, displayName, role: 'student' })
  });
  const json = await res.json();
  console.log('Server response', json);

  if (!res.ok) throw new Error(`Server call failed: ${res.status}`);

  console.log('OK. Clean up Clerk user');
  await clerk.users.deleteUser(clerkUser.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
