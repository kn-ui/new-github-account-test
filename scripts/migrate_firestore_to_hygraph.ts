#!/usr/bin/env ts-node
/*
  Firestore → Hygraph migration script.
  - Reads Firestore collection (students/users)
  - Maps fields to Hygraph AppUser
  - Creates in Hygraph with rate limiting and resumability
*/

import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import pLimit from 'p-limit';
import admin from '../server/src/config/firebase';
import { firestore as fsdb } from '../server/src/config/firebase';
import { mapFirestoreUserToHygraph } from '../server/src/lib/mapping';
import { createHygraphUser, getHygraphUserByUid } from '../server/src/lib/hygraph';

interface Args {
  collection: string;
  batchSize: number;
  concurrency: number;
  dryRun: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string, def?: string) => {
    const idx = argv.findIndex((a) => a === `--${flag}` || a.startsWith(`--${flag}=`));
    if (idx === -1) return def;
    const arg = argv[idx];
    if (arg.includes('=')) return arg.split('=')[1];
    return argv[idx + 1] ?? def;
  };
  return {
    collection: get('collection', 'students')!,
    batchSize: parseInt(get('batchSize', '200')!, 10),
    concurrency: parseInt(get('concurrency', '3')!, 10),
    dryRun: (get('dryRun', 'false') || 'false') === 'true',
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = parseArgs();
  console.log('Migration starting with args:', args);

  if (!fsdb) {
    console.error('Firestore is not initialized. Check Firebase credentials.');
    process.exit(1);
  }

  const outPath = path.resolve(process.cwd(), 'migration-results.json');
  const results: Array<any> = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : [];

  const seenUids = new Set(results.filter(r => r.status === 'success').map(r => r.uid));

  const limit = pLimit(Math.max(1, Math.min(5, args.concurrency)));

  const colRef = fsdb.collection(args.collection);
  const snapshot = await colRef.get();
  const docs = snapshot.docs;

  let processed = 0;
  let created = 0;
  let failed = 0;
  let skipped = 0;

  await Promise.all(
    docs.map((doc, index) =>
      limit(async () => {
        const data = doc.data() as any;
        const uid = doc.id;
        if (seenUids.has(uid)) {
          skipped++;
          return;
        }

        try {
          // Skip if exists in Hygraph
          if (!args.dryRun) {
            const existing = await getHygraphUserByUid(uid);
            if (existing) {
              results.push({ index, uid, email: existing.email, status: 'skipped', reason: 'exists' });
              skipped++;
              processed++;
              return;
            }
          }

          const payload = mapFirestoreUserToHygraph({ id: uid, ...data });

          if (args.dryRun) {
            results.push({ index, uid, email: payload.email, status: 'dryRun' });
            processed++;
            return;
          }

          const createdUser = await createHygraphUser(payload);
          results.push({ index, uid: createdUser.uid, email: createdUser.email, status: 'success' });
          created++;
        } catch (err: any) {
          failed++;
          results.push({ index, uid, email: data?.email, status: 'failure', error: err?.message || String(err) });
        } finally {
          processed++;
          // Persist results incrementally for resumability
          fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
          await sleep(200); // basic backoff to respect rate limits
        }
      })
    )
  );

  const summary = { total: docs.length, processed, created, failed, skipped, output: outPath };
  console.log('Migration finished:', summary);
}

main().catch((e) => {
  console.error('Migration crashed:', e);
  process.exit(1);
});
