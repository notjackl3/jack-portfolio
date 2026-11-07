// Moderation for the napkin note. Anyone visiting the site can write on it;
// this is how you read what they wrote and put it back.
//
//   npm run goals                 what the napkin says right now
//   npm run goals -- log          every save kept, newest first
//   npm run goals -- restore <n>  put version <n> from the log back
//   npm run goals -- revert       back to src/v5/notes.js
//
// Needs GOALS_ADMIN_SECRET (the same value as the Vercel env var) in .env or
// the environment, and talks to production unless GOALS_URL says otherwise:
//
//   GOALS_URL=http://localhost:5181/api/goals npm run goals
//
// The original is in git, so none of this is destructive.

import { readFile } from 'node:fs/promises';
import { note } from '../src/v5/notes.js';

const ENDPOINT = process.env.GOALS_URL || 'https://www.jack-le.com/api/goals';

const secret = await (async () => {
  if (process.env.GOALS_ADMIN_SECRET) return process.env.GOALS_ADMIN_SECRET;
  try {
    const env = await readFile(new URL('../.env', import.meta.url), 'utf8');
    return env.match(/^GOALS_ADMIN_SECRET=(.*)$/m)?.[1]?.trim() || '';
  } catch {
    return '';
  }
})();

const get = async (withLog = false) => {
  // The edge cache keys on the URL alone — it does not vary on the secret
  // header — so an admin GET can be handed the short public response a
  // visitor warmed seconds earlier, which carries no `history` at all and
  // makes the log read as empty. The handler never runs to say otherwise.
  // Asking for a URL nobody else has is the only way past it from here.
  const url = withLog
    ? `${ENDPOINT}${ENDPOINT.includes('?') ? '&' : '?'}_=${Date.now()}`
    : ENDPOINT;
  const r = await fetch(url, {
    cache: 'no-store',
    // The log is only returned to the secret, so asking for it is still a
    // read — reading what people wrote never writes anything itself.
    headers: withLog && secret ? { 'x-goals-secret': secret } : {},
  });
  if (!r.ok) throw new Error(`GET ${ENDPOINT} → ${r.status}`);
  return r.json();
};

// The dev middleware in vite.config.js has no secret to check, so running
// against localhost needs none. Production does.
const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(ENDPOINT);

const needSecret = () => {
  if (local || secret) return;
  console.error(
    'GOALS_ADMIN_SECRET is not set.\n' +
      '  Put it in .env, or export it, matching the value in the Vercel project.\n' +
      '  To work against the dev server instead:\n' +
      '    GOALS_URL=http://localhost:3000/api/goals npm run goals -- <command>'
  );
  process.exit(1);
};

const post = async (payload) => {
  needSecret();
  const r = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goals-secret': secret },
    body: JSON.stringify(payload),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `POST → ${r.status}`);
  return d;
};

const show = (body) => body.split('\n').map((l) => `  │ ${l}`).join('\n');

const [cmd = 'show', ...rest] = process.argv.slice(2);

if (cmd === 'show') {
  const d = await get();
  const live = d.body || note.body;
  console.log(show(live));
  console.log(
    d.body
      ? `\nlast written ${new Date(d.at).toLocaleString()}`
      : '\nnobody has written on it — this is src/v5/notes.js'
  );
} else if (cmd === 'log') {
  needSecret();
  const history = (await get(true)).history || [];
  if (!history.length) {
    console.log('nothing saved yet');
  } else {
    history.forEach((h, i) => {
      const when = new Date(h.at).toISOString().slice(0, 16).replace('T', ' ');
      console.log(`\n[${i}] ${when}`);
      console.log(show(h.body ?? '(reverted)'));
    });
  }
} else if (cmd === 'restore') {
  const n = Number(rest[0]);
  if (!Number.isInteger(n)) {
    console.error('which version? `npm run goals -- log` lists them by number');
    process.exit(1);
  }
  needSecret();
  const version = ((await get(true)).history || [])[n];
  if (!version?.body) {
    console.error(`no version [${n}] in the log`);
    process.exit(1);
  }
  await post({ body: version.body });
  console.log(`restored [${n}]:\n${show(version.body)}`);
} else if (cmd === 'revert') {
  await post({ clear: true });
  console.log(`reverted to src/v5/notes.js:\n${show(note.body)}`);
} else {
  console.error(
    `unknown command: ${cmd}\n\n` +
      '  npm run goals\n  npm run goals -- log\n  npm run goals -- restore <n>\n  npm run goals -- revert'
  );
  process.exit(1);
}

// Anything that got this far and threw is a bad endpoint, a refused write or
// a network that isn't there. None of those are worth a stack trace.
process.on('unhandledRejection', (err) => {
  console.error(String(err?.message || err));
  process.exit(1);
});
