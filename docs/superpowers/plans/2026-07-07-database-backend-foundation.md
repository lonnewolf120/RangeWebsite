# Database & Backend API Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `database/` and `backend/` workspaces: a Postgres schema (via Prisma) seeded with the 7 real MIST course offerings, and a tested Express REST API serving courses, enrollments, and JWT-protected admin CRUD.

**Architecture:** npm workspaces monorepo (`frontend/`, `backend/`, `database/`). `database/` owns the Prisma schema, migrations, and seed script, and exposes the generated Prisma Client as the `@rangewebsite/database` package. `backend/` is an Express 5 + TypeScript (ESM) API that depends on `@rangewebsite/database` for all persistence — no other package talks to Postgres directly.

**Tech Stack:** Node.js 22, TypeScript (strict, ESM/NodeNext), Express 5, Prisma 6 + PostgreSQL, zod, bcryptjs, jsonwebtoken, Vitest + supertest.

## Global Constraints

- This plan covers ONLY `database/` and `backend/`. `frontend/` (including the 3D hero) and Docker packaging are separate, later plans per `docs/superpowers/specs/2026-07-07-cyber-range-website-design.md` §2 and §10 — do not create `frontend/` files or `Dockerfile`s in this plan.
- All npm commands run from the repository root (`RangeWebsite/`) using `--workspace=<name>`, never by `cd`-ing into a subdirectory.
- No hardcoded credentials anywhere. `JWT_SECRET`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, `DATABASE_URL` are read from `.env` files that are gitignored, never committed.
- Passwords are bcrypt-hashed (cost factor 12), never stored or logged in plaintext.
- Both `database/.env` and `backend/.env` must use the *same* `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD` values — the admin user is seeded once via `database/`, and `backend/` tests log in against that same seeded user.
- CORS is restricted to the `CORS_ORIGIN` env var (default `http://localhost:3000`), never wide open.
- Every task's Vitest suite must pass before that task is committed.
- The local Postgres container used for development/testing is named `rangewebsite-test-db`; tasks check for it and start/migrate/seed it if absent, and leave it running for later tasks to reuse (do not `docker stop` it as part of a task).

---

### Task 1: Workspace scaffold

**Files:**
- Create: `package.json` (repo root)
- Create: `.gitignore` (repo root)
- Create: `.env.example` (repo root)
- Create: `frontend/package.json` (stub)
- Create: `backend/package.json` (stub)
- Create: `database/package.json` (stub)

**Interfaces:**
- Consumes: nothing (first task)
- Produces: npm workspaces `frontend`, `backend`, `database` resolvable from the repo root via `--workspace=<name>`

- [ ] **Step 1: Create the root `package.json`**

```json
{
  "name": "cyber-range-website",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "database"
  ]
}
```

- [ ] **Step 2: Create the root `.gitignore`**

```
node_modules/
.env
.env*.local
dist/
build/
.next/
database/generated/
*.log
```

- [ ] **Step 3: Create the root `.env.example`**

```
# Postgres connection string used by database/ and backend/
DATABASE_URL=postgresql://test:test@localhost:5434/rangewebsite_test

# Backend
PORT=4000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=change-me-to-a-random-64-char-string

# Seeded once into the AdminUser table by database/prisma/seed.ts
ADMIN_BOOTSTRAP_EMAIL=admin@cyberrange.test
ADMIN_BOOTSTRAP_PASSWORD=ChangeMe123!

# Frontend (used by later plans)
NEXT_PUBLIC_API_URL=http://localhost:4000
```

- [ ] **Step 4: Create stub `frontend/package.json`**

```json
{
  "name": "@rangewebsite/frontend",
  "version": "0.1.0",
  "private": true
}
```

- [ ] **Step 5: Create stub `backend/package.json`**

```json
{
  "name": "@rangewebsite/backend",
  "version": "0.1.0",
  "private": true
}
```

- [ ] **Step 6: Create stub `database/package.json`**

```json
{
  "name": "@rangewebsite/database",
  "version": "0.1.0",
  "private": true
}
```

- [ ] **Step 7: Verify the workspace resolves**

Run: `npm install`
Expected: completes with no errors, and `npm ls --workspaces --depth=0` lists `@rangewebsite/frontend`, `@rangewebsite/backend`, `@rangewebsite/database`.

- [ ] **Step 8: Commit**

```bash
git add package.json .gitignore .env.example frontend/package.json backend/package.json database/package.json
git commit -m "chore: scaffold npm workspaces for frontend, backend, database"
```

---

### Task 2: Database schema, migration, and seed data

**Files:**
- Modify: `database/package.json`
- Create: `database/tsconfig.json`
- Create: `database/prisma/schema.prisma`
- Create: `database/prisma/seed.ts`
- Create: `database/tests/seed.test.ts`
- Create: `database/.env` (gitignored, not committed)

**Interfaces:**
- Consumes: nothing new
- Produces: `@rangewebsite/database` package resolving (via its `main`/`types` fields) to a generated Prisma Client with models `Course`, `Enrollment`, `AdminUser` and enum `EnrollmentStatus` (`NEW | CONTACTED | ENROLLED | REJECTED`), once `npm run generate --workspace=database` has been run

- [ ] **Step 1: Replace `database/package.json`**

```json
{
  "name": "@rangewebsite/database",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "generated/client/index.js",
  "types": "generated/client/index.d.ts",
  "scripts": {
    "generate": "prisma generate",
    "migrate:dev": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "seed": "tsx prisma/seed.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "prisma": "^6.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0",
    "dotenv": "^16.4.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.10.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: completes with no errors.

- [ ] **Step 3: Create `database/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["prisma/**/*.ts", "tests/**/*.ts"]
}
```

- [ ] **Step 4: Create `database/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Course {
  id                   String       @id @default(uuid())
  slug                 String       @unique
  name                 String
  shortDescription     String
  description          String
  targetAudience       String
  durationLabel        String
  curriculumHighlights String[]
  fee                  String?
  featuredInHero       Boolean      @default(false)
  displayOrder         Int
  enrollments          Enrollment[]
  createdAt            DateTime     @default(now())
  updatedAt            DateTime     @updatedAt
}

model Enrollment {
  id        String           @id @default(uuid())
  course    Course?          @relation(fields: [courseId], references: [id])
  courseId  String?
  name      String
  email     String
  phone     String?
  message   String?
  status    EnrollmentStatus @default(NEW)
  createdAt DateTime         @default(now())
}

enum EnrollmentStatus {
  NEW
  CONTACTED
  ENROLLED
  REJECTED
}

model AdminUser {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}
```

- [ ] **Step 5: Create `database/.env` (local dev/test only — do not commit)**

```
DATABASE_URL="postgresql://test:test@localhost:5434/rangewebsite_test"
ADMIN_BOOTSTRAP_EMAIL="admin@cyberrange.test"
ADMIN_BOOTSTRAP_PASSWORD="ChangeMe123!"
```

- [ ] **Step 6: Start the local Postgres test container**

Run:
```bash
docker run --rm -d --name rangewebsite-test-db \
  -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=rangewebsite_test \
  -p 5434:5432 postgres:16-alpine
until docker exec rangewebsite-test-db pg_isready -U test > /dev/null 2>&1; do sleep 1; done
```
Expected: container starts, loop exits once Postgres reports ready.

- [ ] **Step 7: Create the initial migration**

Run: `npm run migrate:dev --workspace=database -- --name init`
Expected: output ends with "Your database is now in sync with your schema." and `database/prisma/migrations/<timestamp>_init/migration.sql` exists.

- [ ] **Step 8: Generate the Prisma Client**

Run: `npm run generate --workspace=database`
Expected: output confirms the client was generated to `database/generated/client`. That directory will contain its own `package.json` declaring `"type": "commonjs"` — Prisma emits this automatically so its CommonJS output stays correctly interoperable even though `database/package.json` itself is `"type": "module"`. Do not edit or delete the generated `package.json`.

- [ ] **Step 9: Create `database/prisma/seed.ts`**

```typescript
import 'dotenv/config';
import { PrismaClient } from '../generated/client/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const courses = [
  {
    slug: 'ceh-v12',
    name: 'Certified Ethical Hacker (CEH) v12',
    shortDescription:
      'Reconnaissance to exploitation: hands-on ethical hacking, malware analysis, and CEH certification prep.',
    description:
      'Intermediate-level, hands-on training in ethical hacking tools and methodologies -- reconnaissance, scanning, enumeration, exploitation, privilege escalation, vulnerability identification/mitigation, penetration testing, and malware analysis, preparing participants for the CEH certification exam.',
    targetAudience:
      'ICT professionals seeking cybersecurity expertise in financial, banking, and digital information systems; prerequisites are basic TCP/IP networking, Windows/Linux familiarity, and foundational cybersecurity awareness.',
    durationLabel: '12 days / 6 weeks (96 hours)',
    curriculumHighlights: [
      'Footprinting and reconnaissance',
      'Network scanning and enumeration',
      'Vulnerability analysis',
      'System hacking and privilege escalation',
      'Malware threats',
      'Social engineering',
      'DoS/DDoS attacks',
      'Web application hacking and SQL injection',
      'Wireless, mobile, IoT, and cloud security',
      'Cryptography',
      'Attack-defense simulations and final assessment',
    ],
    fee: 'BDT 45,000',
    featuredInHero: true,
    displayOrder: 1,
  },
  {
    slug: 'vapt',
    name: 'Ethical Hacking, Countermeasures & VAPT',
    shortDescription:
      'Vulnerability assessment and penetration testing across networks, web apps, and OSINT recon.',
    description:
      'Advanced training across 20 security domains, teaching the hacking techniques and tools used by both attackers and information security professionals.',
    targetAudience:
      'ICT professionals (particularly financial/banking), ethical hackers, system/network administrators, web managers, auditors, and security professionals responsible for network infrastructure integrity.',
    durationLabel: '60 hours',
    curriculumHighlights: [
      'Hacking and penetration testing methodologies',
      'Information discovery and vulnerability assessment',
      'Network and web application security testing',
      'Operating system vulnerabilities and privilege escalation',
      'OSINT and wireless security testing',
      'Common vulnerabilities: SQL injection, XSS, broken authentication/access control',
      'Practical labs and assessment reporting',
    ],
    fee: null,
    featuredInHero: true,
    displayOrder: 2,
  },
  {
    slug: 'threat-hunting',
    name: 'SOC Analysis and Threat Hunting',
    shortDescription:
      'SOC operations, incident response, and proactive threat hunting with live cyber range access.',
    description:
      'Equips ICT professionals with SOC management expertise and threat hunting capabilities -- security operations fundamentals, threat analysis, vulnerability assessment, incident response, and threat intelligence. Includes 15 hours of complimentary cyber range access.',
    targetAudience:
      'ICT professionals focused on SOC analysis and cyber threat hunting (an aptitude test assesses baseline expertise).',
    durationLabel: '40 hours / 8 weeks',
    curriculumHighlights: [
      'Day 1: SOC fundamentals and service identification',
      'Day 2: Attack methodology and cyber threats',
      'Day 3: Incident analysis, management, and logging',
      'Day 4: Vulnerability scan analysis and SIEM-based incident detection',
      'Day 5: Response strategies, threat intelligence, and enhanced detection capabilities',
    ],
    fee: 'BDT 20,000',
    featuredInHero: true,
    displayOrder: 3,
  },
  {
    slug: 'digital-forensics',
    name: 'Digital Forensic Investigation',
    shortDescription:
      'Evidence seizure, preservation, and forensic analysis for digital investigations.',
    description:
      'Practical training in digital forensics -- forensic principles, evidence continuity, and methodology -- from evidence seizure and data preservation through analysis, interpretation, and reporting.',
    targetAudience:
      'Cyber forensic and network investigators, IT security officers, law enforcement officials.',
    durationLabel: '40 hours / 5 days',
    curriculumHighlights: [
      'Digital forensics introduction and investigation guidelines',
      'Evidence identification and seizure',
      'File systems and data storage',
      'Metadata analysis',
      'Windows artifacts investigation',
      'Forensic analysis techniques',
      'Malicious software examination',
      'Network and memory analysis',
      'OS partitions and Linux imaging tools',
      'Reporting methodologies',
    ],
    fee: null,
    featuredInHero: false,
    displayOrder: 4,
  },
  {
    slug: 'infosec-architecture',
    name: 'Information Systems Security Architecture (CISSP Prep)',
    shortDescription:
      'CISSP preparation across all 8 domains of information security architecture.',
    description:
      'A CISSP preparation course covering globally recognized information security standards, CISSP exam content, test-taking techniques, and preparation materials.',
    targetAudience:
      'IT auditors, IT consultants, managers, security policy writers, privacy officers, information security officers, network administrators.',
    durationLabel: '40 hours',
    curriculumHighlights: [
      'Security & Risk Management',
      'Asset Security',
      'Security Engineering',
      'Communications & Network Security',
      'Identity & Access Management',
      'Security Assessment & Testing',
      'Security Operations',
      'Security in the Software Development Life Cycle',
    ],
    fee: null,
    featuredInHero: false,
    displayOrder: 5,
  },
  {
    slug: 'appsec-cloud',
    name: 'Application Software and Cloud Security',
    shortDescription:
      'Application and cloud security fundamentals, from secure SDLC to cloud infrastructure protection.',
    description:
      "Covers application and cloud security fundamentals delivered at MIST's Cyber Range and Advanced Computing Lab.",
    targetAudience:
      'Intermediate-level professionals seeking certification in security domains.',
    durationLabel: '40 hours',
    curriculumHighlights: [
      'Cloud concepts',
      'Software security requirements and implementation',
      'Secure testing and deployment practices',
      'Cloud data and infrastructure protection',
      'Legal and compliance considerations',
      'Secure software lifecycle and supply chain management',
      'Cloud security operations',
    ],
    fee: null,
    featuredInHero: false,
    displayOrder: 6,
  },
  {
    slug: 'infosec-auditing',
    name: 'Information Systems Auditing (CISA Prep)',
    shortDescription:
      'CISA exam preparation: auditing, governance, and protection of information assets.',
    description:
      "Prepares participants for ISACA's CISA exam, covering information systems audit knowledge sought after by auditing and IT professionals.",
    targetAudience:
      'Internal/external auditors, finance/CPA professionals, IT professionals and managers (CIO/CTO), systems/network/database administrators, software developers, information security professionals, risk management professionals.',
    durationLabel: '5 days / ~1.25 months',
    curriculumHighlights: [
      'The Process of Auditing Information Systems',
      'Governance and Management of IT',
      'Information Systems Acquisition, Development, and Implementation',
      'Information Systems Operations, Maintenance and Support',
      'Protection of Information Assets',
    ],
    fee: null,
    featuredInHero: false,
    displayOrder: 7,
  },
];

async function main(): Promise<void> {
  for (const course of courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: course,
      create: course,
    });
  }

  const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD must be set to seed the admin user');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash },
  });

  console.log(`Seeded ${courses.length} courses and admin user ${adminEmail}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 10: Run the seed script**

Run: `npm run seed --workspace=database`
Expected: prints `Seeded 7 courses and admin user admin@cyberrange.test`

- [ ] **Step 11: Create `database/tests/seed.test.ts`**

```typescript
import 'dotenv/config';
import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '../generated/client/index.js';

const prisma = new PrismaClient();

describe('database seed', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('seeds exactly 7 courses', async () => {
    const count = await prisma.course.count();
    expect(count).toBe(7);
  });

  it('marks exactly ceh-v12, vapt, and threat-hunting as featuredInHero, in that display order', async () => {
    const featured = await prisma.course.findMany({
      where: { featuredInHero: true },
      orderBy: { displayOrder: 'asc' },
    });
    expect(featured.map((c) => c.slug)).toEqual(['ceh-v12', 'vapt', 'threat-hunting']);
  });

  it('seeds exactly one admin user matching ADMIN_BOOTSTRAP_EMAIL', async () => {
    const count = await prisma.adminUser.count();
    expect(count).toBe(1);
    const admin = await prisma.adminUser.findUnique({
      where: { email: process.env.ADMIN_BOOTSTRAP_EMAIL },
    });
    expect(admin).not.toBeNull();
  });
});
```

- [ ] **Step 12: Run the tests**

Run: `npm run test --workspace=database`
Expected: 3 passed.

- [ ] **Step 13: Commit**

```bash
git add database/package.json database/tsconfig.json database/prisma database/tests .gitignore
git commit -m "feat(database): add Prisma schema, migration, and seed data for the course catalog"
```

Note: `database/.env` and `database/generated/` are intentionally not added — they're covered by `.gitignore`. Do not force-add them.

---

### Task 3: Backend scaffold and health check

**Files:**
- Modify: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/vitest.config.ts`
- Create: `backend/vitest.setup.ts`
- Create: `backend/.env` (gitignored, not committed)
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`
- Create: `backend/tests/health.test.ts`

**Interfaces:**
- Consumes: nothing from Task 2 yet (this task has no DB dependency)
- Produces: `createApp(): Express` exported from `backend/src/app.ts`, used by every later backend test via `import { createApp } from '../src/app.js'`

- [ ] **Step 1: Replace `backend/package.json`**

```json
{
  "name": "@rangewebsite/backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run"
  },
  "dependencies": {
    "express": "^5.0.0",
    "cors": "^2.8.5",
    "zod": "^3.24.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.4.0",
    "@rangewebsite/database": "*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "vitest": "^2.1.0",
    "supertest": "^7.0.0",
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/supertest": "^6.0.2",
    "@types/node": "^22.10.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: completes with no errors; `node_modules/@rangewebsite/database` resolves as a workspace symlink.

- [ ] **Step 3: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 4: Create `backend/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

- [ ] **Step 5: Create `backend/vitest.setup.ts`**

```typescript
import 'dotenv/config';
```

- [ ] **Step 6: Create `backend/.env` (local dev/test only — do not commit)**

```
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

- [ ] **Step 7: Create `backend/src/app.ts`**

```typescript
import express, { type Express } from 'express';
import cors from 'cors';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
```

- [ ] **Step 8: Create `backend/src/server.ts`**

```typescript
import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
```

- [ ] **Step 9: Create `backend/tests/health.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /health', () => {
  it('returns status ok', async () => {
    const app = createApp();
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 10: Run the tests**

Run: `npm run test --workspace=backend`
Expected: 1 passed.

- [ ] **Step 11: Commit**

```bash
git add backend/package.json backend/tsconfig.json backend/vitest.config.ts backend/vitest.setup.ts backend/src backend/tests
git commit -m "feat(backend): scaffold Express app with health check endpoint"
```

---

### Task 4: Course listing and detail endpoints

**Files:**
- Create: `backend/src/db.ts`
- Create: `backend/src/routes/courses.ts`
- Modify: `backend/src/app.ts`
- Modify: `backend/.env` (append `DATABASE_URL`)
- Create: `backend/tests/courses.test.ts`

**Interfaces:**
- Consumes: `@rangewebsite/database`'s `PrismaClient` (Task 2), `createApp` (Task 3)
- Produces: `prisma` singleton exported from `backend/src/db.ts`, imported by every later route file; `coursesRouter` mounted at `/api/courses`

- [ ] **Step 1: Ensure the local test database is running and seeded**

Run:
```bash
if ! docker inspect rangewebsite-test-db > /dev/null 2>&1; then
  docker run --rm -d --name rangewebsite-test-db \
    -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=rangewebsite_test \
    -p 5434:5432 postgres:16-alpine
  until docker exec rangewebsite-test-db pg_isready -U test > /dev/null 2>&1; do sleep 1; done
  npm run migrate:deploy --workspace=database
  npm run seed --workspace=database
fi
```
Expected: exits immediately if the container already exists; otherwise creates, migrates, and seeds it.

- [ ] **Step 2: Append `DATABASE_URL` to `backend/.env`**

```
DATABASE_URL="postgresql://test:test@localhost:5434/rangewebsite_test"
```

- [ ] **Step 3: Create `backend/src/db.ts`**

```typescript
import { PrismaClient } from '@rangewebsite/database';

export const prisma = new PrismaClient();
```

- [ ] **Step 4: Create `backend/src/routes/courses.ts`**

```typescript
import { Router } from 'express';
import { prisma } from '../db.js';

export const coursesRouter = Router();

coursesRouter.get('/', async (_req, res) => {
  const courses = await prisma.course.findMany({
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      shortDescription: true,
      durationLabel: true,
      featuredInHero: true,
      displayOrder: true,
    },
  });
  res.json(courses);
});

coursesRouter.get('/:slug', async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { slug: req.params.slug },
  });

  if (!course) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }

  res.json(course);
});
```

- [ ] **Step 5: Replace `backend/src/app.ts`**

```typescript
import express, { type Express } from 'express';
import cors from 'cors';
import { coursesRouter } from './routes/courses.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/courses', coursesRouter);

  return app;
}
```

- [ ] **Step 6: Create `backend/tests/courses.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('GET /api/courses', () => {
  it('returns all 7 courses sorted by displayOrder', async () => {
    const response = await request(app).get('/api/courses');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(7);
    expect(response.body[0].slug).toBe('ceh-v12');
  });

  it('marks exactly 3 courses as featuredInHero', async () => {
    const response = await request(app).get('/api/courses');
    const featured = response.body.filter((c: { featuredInHero: boolean }) => c.featuredInHero);
    expect(featured).toHaveLength(3);
  });
});

describe('GET /api/courses/:slug', () => {
  it('returns full course detail for a known slug', async () => {
    const response = await request(app).get('/api/courses/ceh-v12');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Certified Ethical Hacker (CEH) v12');
    expect(response.body.curriculumHighlights).toBeInstanceOf(Array);
  });

  it('returns 404 for an unknown slug', async () => {
    const response = await request(app).get('/api/courses/does-not-exist');
    expect(response.status).toBe(404);
  });
});
```

- [ ] **Step 7: Run the tests**

Run: `npm run test --workspace=backend`
Expected: 5 passed (1 from Task 3 + 4 new).

- [ ] **Step 8: Commit**

```bash
git add backend/src backend/tests
git commit -m "feat(backend): add course listing and detail endpoints"
```

---

### Task 5: Enrollment submission endpoint

**Files:**
- Create: `backend/src/routes/enrollments.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/tests/enrollments.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 4)
- Produces: `enrollmentsRouter` mounted at `/api/enrollments`

- [ ] **Step 1: Ensure the local test database is running and seeded**

Run the same guard block as Task 4, Step 1.

- [ ] **Step 2: Create `backend/src/routes/enrollments.ts`**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

export const enrollmentsRouter = Router();

const createEnrollmentSchema = z.object({
  courseId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  message: z.string().max(2000).optional(),
});

enrollmentsRouter.post('/', async (req, res) => {
  const parsed = createEnrollmentSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid enrollment data', details: parsed.error.flatten() });
    return;
  }

  const enrollment = await prisma.enrollment.create({ data: parsed.data });
  res.status(201).json({ id: enrollment.id, status: enrollment.status });
});
```

- [ ] **Step 3: Replace `backend/src/app.ts`**

```typescript
import express, { type Express } from 'express';
import cors from 'cors';
import { coursesRouter } from './routes/courses.js';
import { enrollmentsRouter } from './routes/enrollments.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/courses', coursesRouter);
  app.use('/api/enrollments', enrollmentsRouter);

  return app;
}
```

- [ ] **Step 4: Create `backend/tests/enrollments.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('POST /api/enrollments', () => {
  it('creates an enrollment with valid data', async () => {
    const response = await request(app)
      .post('/api/enrollments')
      .send({ name: 'Jane Doe', email: 'jane@example.com', message: 'Interested in CEH.' });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('NEW');
  });

  it('rejects an enrollment missing a required field', async () => {
    const response = await request(app).post('/api/enrollments').send({ name: 'No Email' });
    expect(response.status).toBe(400);
  });

  it('rejects an enrollment with an invalid email', async () => {
    const response = await request(app)
      .post('/api/enrollments')
      .send({ name: 'Bad Email', email: 'not-an-email' });
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 5: Run the tests**

Run: `npm run test --workspace=backend`
Expected: 8 passed (5 from Task 4 + 3 new).

- [ ] **Step 6: Commit**

```bash
git add backend/src backend/tests
git commit -m "feat(backend): add enrollment submission endpoint"
```

---

### Task 6: Admin login and JWT middleware

**Files:**
- Create: `backend/src/auth.ts`
- Create: `backend/src/routes/adminAuth.ts`
- Modify: `backend/src/app.ts`
- Modify: `backend/.env` (append `JWT_SECRET`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`)
- Create: `backend/tests/adminAuth.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 4), seeded `AdminUser` (Task 2)
- Produces: `signAdminToken(payload: { sub: string; email: string }): string` and `requireAdminAuth` Express middleware from `backend/src/auth.ts`, both imported by Tasks 7 and 8

- [ ] **Step 1: Ensure the local test database is running and seeded**

Run the same guard block as Task 4, Step 1.

- [ ] **Step 2: Append to `backend/.env`**

These values MUST match `database/.env`'s `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD` exactly, since the admin user was seeded using those values:

```
JWT_SECRET="a-local-development-secret-change-in-production"
ADMIN_BOOTSTRAP_EMAIL="admin@cyberrange.test"
ADMIN_BOOTSTRAP_PASSWORD="ChangeMe123!"
```

- [ ] **Step 3: Create `backend/src/auth.ts`**

```typescript
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export interface AdminTokenPayload {
  sub: string;
  email: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '8h' });
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    jwt.verify(token, getJwtSecret());
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

- [ ] **Step 4: Create `backend/src/routes/adminAuth.ts`**

```typescript
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db.js';
import { signAdminToken } from '../auth.js';

export const adminAuthRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

adminAuthRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid login data' });
    return;
  }

  const admin = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });

  if (!admin) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, admin.passwordHash);

  if (!passwordMatches) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signAdminToken({ sub: admin.id, email: admin.email });
  res.json({ token });
});
```

- [ ] **Step 5: Replace `backend/src/app.ts`**

```typescript
import express, { type Express } from 'express';
import cors from 'cors';
import { coursesRouter } from './routes/courses.js';
import { enrollmentsRouter } from './routes/enrollments.js';
import { adminAuthRouter } from './routes/adminAuth.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/courses', coursesRouter);
  app.use('/api/enrollments', enrollmentsRouter);
  app.use('/api/admin', adminAuthRouter);

  return app;
}
```

- [ ] **Step 6: Create `backend/tests/adminAuth.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('POST /api/admin/login', () => {
  it('returns a token for valid admin credentials', async () => {
    const response = await request(app).post('/api/admin/login').send({
      email: process.env.ADMIN_BOOTSTRAP_EMAIL,
      password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
    });
    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe('string');
  });

  it('rejects an unknown email', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send({ email: 'nobody@example.com', password: 'whatever' });
    expect(response.status).toBe(401);
  });

  it('rejects a wrong password', async () => {
    const response = await request(app)
      .post('/api/admin/login')
      .send({ email: process.env.ADMIN_BOOTSTRAP_EMAIL, password: 'wrong-password' });
    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 7: Run the tests**

Run: `npm run test --workspace=backend`
Expected: 11 passed (8 from Task 5 + 3 new).

- [ ] **Step 8: Commit**

```bash
git add backend/src backend/tests
git commit -m "feat(backend): add admin login with JWT issuance and verification middleware"
```

---

### Task 7: Admin course CRUD

**Files:**
- Create: `backend/src/routes/adminCourses.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/tests/adminCourses.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 4), `requireAdminAuth` (Task 6)
- Produces: `adminCoursesRouter` mounted at `/api/admin/courses`, protected by `requireAdminAuth`

- [ ] **Step 1: Ensure the local test database is running and seeded**

Run the same guard block as Task 4, Step 1.

- [ ] **Step 2: Create `backend/src/routes/adminCourses.ts`**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

export const adminCoursesRouter = Router();

const courseInputSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  targetAudience: z.string().min(1),
  durationLabel: z.string().min(1),
  curriculumHighlights: z.array(z.string()),
  fee: z.string().nullable().optional(),
  featuredInHero: z.boolean().optional(),
  displayOrder: z.number().int(),
});

adminCoursesRouter.get('/', async (_req, res) => {
  const courses = await prisma.course.findMany({ orderBy: { displayOrder: 'asc' } });
  res.json(courses);
});

adminCoursesRouter.post('/', async (req, res) => {
  const parsed = courseInputSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid course data', details: parsed.error.flatten() });
    return;
  }

  const course = await prisma.course.create({ data: parsed.data });
  res.status(201).json(course);
});

adminCoursesRouter.put('/:id', async (req, res) => {
  const parsed = courseInputSchema.partial().safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid course data', details: parsed.error.flatten() });
    return;
  }

  try {
    const course = await prisma.course.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(course);
  } catch {
    res.status(404).json({ error: 'Course not found' });
  }
});

adminCoursesRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Course not found' });
  }
});
```

- [ ] **Step 3: Replace `backend/src/app.ts`**

```typescript
import express, { type Express } from 'express';
import cors from 'cors';
import { coursesRouter } from './routes/courses.js';
import { enrollmentsRouter } from './routes/enrollments.js';
import { adminAuthRouter } from './routes/adminAuth.js';
import { adminCoursesRouter } from './routes/adminCourses.js';
import { requireAdminAuth } from './auth.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/courses', coursesRouter);
  app.use('/api/enrollments', enrollmentsRouter);
  app.use('/api/admin', adminAuthRouter);
  app.use('/api/admin/courses', requireAdminAuth, adminCoursesRouter);

  return app;
}
```

- [ ] **Step 4: Create `backend/tests/adminCourses.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

async function getAdminToken(): Promise<string> {
  const response = await request(app).post('/api/admin/login').send({
    email: process.env.ADMIN_BOOTSTRAP_EMAIL,
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
  });
  return response.body.token as string;
}

describe('/api/admin/courses', () => {
  it('rejects requests without a token', async () => {
    const response = await request(app).get('/api/admin/courses');
    expect(response.status).toBe(401);
  });

  it('creates, updates, and deletes a course', async () => {
    const token = await getAdminToken();

    const createResponse = await request(app)
      .post('/api/admin/courses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        slug: 'test-course',
        name: 'Test Course',
        shortDescription: 'A test course.',
        description: 'Full description.',
        targetAudience: 'Testers.',
        durationLabel: '1 day',
        curriculumHighlights: ['Module 1'],
        displayOrder: 99,
      });
    expect(createResponse.status).toBe(201);
    const courseId = createResponse.body.id as string;

    const updateResponse = await request(app)
      .put(`/api/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Test Course' });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Updated Test Course');

    const deleteResponse = await request(app)
      .delete(`/api/admin/courses/${courseId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(204);
  });
});
```

- [ ] **Step 5: Run the tests**

Run: `npm run test --workspace=backend`
Expected: 13 passed (11 from Task 6 + 2 new).

- [ ] **Step 6: Commit**

```bash
git add backend/src backend/tests
git commit -m "feat(backend): add JWT-protected admin course CRUD"
```

---

### Task 8: Admin enrollments inbox

**Files:**
- Create: `backend/src/routes/adminEnrollments.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/tests/adminEnrollments.test.ts`

**Interfaces:**
- Consumes: `prisma` (Task 4), `requireAdminAuth` (Task 6)
- Produces: `adminEnrollmentsRouter` mounted at `/api/admin/enrollments`, protected by `requireAdminAuth`

- [ ] **Step 1: Ensure the local test database is running and seeded**

Run the same guard block as Task 4, Step 1.

- [ ] **Step 2: Create `backend/src/routes/adminEnrollments.ts`**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';

export const adminEnrollmentsRouter = Router();

adminEnrollmentsRouter.get('/', async (_req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { course: { select: { name: true, slug: true } } },
  });
  res.json(enrollments);
});

const statusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'ENROLLED', 'REJECTED']),
});

adminEnrollmentsRouter.patch('/:id', async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  try {
    const enrollment = await prisma.enrollment.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });
    res.json(enrollment);
  } catch {
    res.status(404).json({ error: 'Enrollment not found' });
  }
});
```

- [ ] **Step 3: Replace `backend/src/app.ts`**

```typescript
import express, { type Express } from 'express';
import cors from 'cors';
import { coursesRouter } from './routes/courses.js';
import { enrollmentsRouter } from './routes/enrollments.js';
import { adminAuthRouter } from './routes/adminAuth.js';
import { adminCoursesRouter } from './routes/adminCourses.js';
import { adminEnrollmentsRouter } from './routes/adminEnrollments.js';
import { requireAdminAuth } from './auth.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/courses', coursesRouter);
  app.use('/api/enrollments', enrollmentsRouter);
  app.use('/api/admin', adminAuthRouter);
  app.use('/api/admin/courses', requireAdminAuth, adminCoursesRouter);
  app.use('/api/admin/enrollments', requireAdminAuth, adminEnrollmentsRouter);

  return app;
}
```

- [ ] **Step 4: Create `backend/tests/adminEnrollments.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

async function getAdminToken(): Promise<string> {
  const response = await request(app).post('/api/admin/login').send({
    email: process.env.ADMIN_BOOTSTRAP_EMAIL,
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
  });
  return response.body.token as string;
}

describe('/api/admin/enrollments', () => {
  it('rejects requests without a token', async () => {
    const response = await request(app).get('/api/admin/enrollments');
    expect(response.status).toBe(401);
  });

  it('lists enrollments and updates status', async () => {
    const createResponse = await request(app)
      .post('/api/enrollments')
      .send({ name: 'Status Test', email: 'status-test@example.com' });
    const enrollmentId = createResponse.body.id as string;

    const token = await getAdminToken();

    const listResponse = await request(app)
      .get('/api/admin/enrollments')
      .set('Authorization', `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    expect(
      (listResponse.body as Array<{ id: string }>).some((e) => e.id === enrollmentId)
    ).toBe(true);

    const patchResponse = await request(app)
      .patch(`/api/admin/enrollments/${enrollmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'CONTACTED' });
    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.status).toBe('CONTACTED');
  });
});
```

- [ ] **Step 5: Run the tests**

Run: `npm run test --workspace=backend`
Expected: 15 passed (13 from Task 7 + 2 new).

- [ ] **Step 6: Commit**

```bash
git add backend/src backend/tests
git commit -m "feat(backend): add JWT-protected admin enrollments inbox"
```

---

### Task 9: Centralized error handling and full-app smoke test

**Files:**
- Modify: `backend/src/app.ts`
- Create: `backend/tests/app.test.ts`

**Interfaces:**
- Consumes: all routers from Tasks 4-8
- Produces: final `createApp()` shape — a 404 handler for unknown routes and a catch-all error handler that logs and returns 500, both used implicitly by any future route added to the app

- [ ] **Step 1: Ensure the local test database is running and seeded**

Run the same guard block as Task 4, Step 1.

- [ ] **Step 2: Replace `backend/src/app.ts`**

```typescript
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { coursesRouter } from './routes/courses.js';
import { enrollmentsRouter } from './routes/enrollments.js';
import { adminAuthRouter } from './routes/adminAuth.js';
import { adminCoursesRouter } from './routes/adminCourses.js';
import { adminEnrollmentsRouter } from './routes/adminEnrollments.js';
import { requireAdminAuth } from './auth.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/courses', coursesRouter);
  app.use('/api/enrollments', enrollmentsRouter);
  app.use('/api/admin', adminAuthRouter);
  app.use('/api/admin/courses', requireAdminAuth, adminCoursesRouter);
  app.use('/api/admin/enrollments', requireAdminAuth, adminEnrollmentsRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
```

- [ ] **Step 3: Create `backend/tests/app.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('app-level behavior', () => {
  it('returns 404 JSON for an unknown route', async () => {
    const response = await request(app).get('/api/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });

  it('supports the full public flow: list courses, view detail, submit enrollment', async () => {
    const listResponse = await request(app).get('/api/courses');
    const firstSlug = listResponse.body[0].slug as string;

    const detailResponse = await request(app).get(`/api/courses/${firstSlug}`);
    expect(detailResponse.status).toBe(200);

    const enrollResponse = await request(app)
      .post('/api/enrollments')
      .send({ courseId: detailResponse.body.id, name: 'Smoke Test', email: 'smoke@example.com' });
    expect(enrollResponse.status).toBe(201);
  });
});
```

- [ ] **Step 4: Run the full backend test suite**

Run: `npm run test --workspace=backend`
Expected: 17 passed (15 from Task 8 + 2 new).

- [ ] **Step 5: Type-check the backend**

Run: `npx tsc --noEmit -p backend/tsconfig.json`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add backend/src backend/tests
git commit -m "feat(backend): add centralized error handling and full-flow smoke test"
```

---

## Plan Complete

At this point `database/` and `backend/` are fully functional: a seeded Postgres database with 7 real courses and one admin user, and a tested Express API (17 tests) covering public course/enrollment endpoints and JWT-protected admin CRUD. The `rangewebsite-test-db` container can be left running for the next plan (frontend) to develop against, or stopped with `docker stop rangewebsite-test-db` if not needed immediately — it is safe to recreate from scratch at any time by re-running Task 2's Step 6 followed by `migrate:deploy` and `seed`.

**Next plans** (written after this one is implemented, per the design spec's staged approach): frontend public site + 3D hero, admin UI, then Docker packaging for all three workspaces.
