# Cyber Range Website — Design Spec

**Date**: 2026-07-07
**Status**: Approved, ready for implementation planning

## 1. Overview & Scope

A standalone, self-hosted web application for the MIST Cyber Range training program:

- A public marketing site whose centerpiece is a scroll-driven 3D black-hole hero
  section (React Three Fiber), featuring 3 spotlighted courses in an orbiting-card
  layout, plus a full course catalog.
- A backend API serving course content from a database, and accepting enrollment /
  contact submissions.
- An admin UI (course CRUD + enrollment inbox) behind authentication.
- Full Docker packaging so the whole stack runs with one `docker compose up`.

This is a new, standalone project — a fresh git repository at `RangeWebsite/`,
independent of the large `Projects` monorepo it lives inside (that repo hosts
unrelated Cyber Range platform components — Red/Blue/Green/White team portals — and
this website is not part of that internal platform).

## 2. Repository Layout

npm workspaces (lightweight monorepo — not Turborepo/Nx; three packages doesn't
justify that tooling):

```
RangeWebsite/
  frontend/           Next.js 15 (App Router, TypeScript, Tailwind v4, React Three Fiber)
  backend/            Express + TypeScript API
  database/           Prisma schema, migrations, seed script
  docker-compose.yml  Orchestrates postgres + migrate + backend + frontend
  .env.example        Documents required environment variables
  package.json        Workspace root
  docs/
```

## 3. Data Model (`database/`)

Prisma schema (`database/prisma/schema.prisma`), PostgreSQL:

```prisma
model Course {
  id                  String   @id @default(uuid())
  slug                String   @unique
  name                String
  shortDescription    String
  description         String
  targetAudience      String
  durationLabel       String
  curriculumHighlights String[]
  fee                 String?
  featuredInHero      Boolean  @default(false)
  displayOrder        Int
  enrollments         Enrollment[]
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model Enrollment {
  id        String   @id @default(uuid())
  course    Course?  @relation(fields: [courseId], references: [id])
  courseId  String?
  name      String
  email     String
  phone     String?
  message   String?
  status    EnrollmentStatus @default(NEW)
  createdAt DateTime @default(now())
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

`database/prisma/seed.ts` seeds:
- All 7 real courses (content below), with CEH v12 / VAPT / Threat Hunting marked
  `featuredInHero: true`.
- One bootstrap `AdminUser`, credentials read from `ADMIN_BOOTSTRAP_EMAIL` /
  `ADMIN_BOOTSTRAP_PASSWORD` env vars (never hardcoded), password bcrypt-hashed at
  seed time.

`backend/` consumes the Prisma client generated from `database/prisma/schema.prisma`
(via npm workspace dependency) rather than owning its own schema — `database/` is
the single source of truth for the schema, migrations, and seed data.

## 4. Course Content (seed data, sourced from the live MIST course pages)

| # | Slug | Name | Duration | Featured | Fee |
|---|------|------|----------|----------|-----|
| 1 | `ceh-v12` | Certified Ethical Hacker (CEH) v12 | 12 days / 6 weeks (96 hrs) | ✅ | BDT 45,000 |
| 2 | `vapt` | Ethical Hacking, Countermeasures & VAPT | 60 hours | ✅ | — |
| 3 | `threat-hunting` | SOC Analysis and Threat Hunting | 40 hrs / 8 weeks | ✅ | BDT 20,000 |
| 4 | `digital-forensics` | Digital Forensic Investigation | 40 hrs / 5 days | | — |
| 5 | `infosec-architecture` | Information Systems Security Architecture (CISSP prep) | 40 hours | | — |
| 6 | `appsec-cloud` | Application Software and Cloud Security | 40 hours | | — |
| 7 | `infosec-auditing` | Information Systems Auditing (CISA prep) | 5 days / ~1.25 months | | — |

Full content per course (used for `description`, `targetAudience`,
`curriculumHighlights`):

**1. CEH v12** — *shortDescription*: "Reconnaissance to exploitation: hands-on
ethical hacking, malware analysis, and CEH certification prep."
*Description*: Intermediate-level, hands-on training in ethical hacking tools and
methodologies — reconnaissance, scanning, enumeration, exploitation, privilege
escalation, vulnerability identification/mitigation, penetration testing, and
malware analysis, preparing participants for the CEH certification exam.
*Target audience*: ICT professionals seeking cybersecurity expertise in financial,
banking, and digital information systems; prerequisites are basic TCP/IP
networking, Windows/Linux familiarity, and foundational cybersecurity awareness.
*Curriculum*: 20 modules — footprinting, network scanning, vulnerability analysis,
system hacking, malware threats, social engineering, DoS/DDoS attacks, web
application hacking, SQL injection, wireless/mobile/IoT/cloud security, and
cryptography — concluding with attack-defense simulations, case studies, and a
final assessment.

**2. VAPT** — *shortDescription*: "Vulnerability assessment and penetration
testing across networks, web apps, and OSINT recon."
*Description*: Advanced training across 20 security domains, teaching the hacking
techniques and tools used by both attackers and information security
professionals.
*Target audience*: ICT professionals (particularly financial/banking), ethical
hackers, system/network administrators, web managers, auditors, and security
professionals responsible for network infrastructure integrity.
*Curriculum*: Hacking and penetration testing methodologies; information discovery
and vulnerability assessment; network and web application security testing;
operating system vulnerabilities and privilege escalation; OSINT and wireless
security testing; common vulnerabilities (SQL injection, XSS, broken
authentication/access control); practical labs and assessment reporting.

**3. Threat Hunting** — *shortDescription*: "SOC operations, incident response,
and proactive threat hunting with live cyber range access."
*Description*: Equips ICT professionals with SOC management expertise and threat
hunting capabilities — security operations fundamentals, threat analysis,
vulnerability assessment, incident response, and threat intelligence. Includes 15
hours of complimentary cyber range access.
*Target audience*: ICT professionals focused on SOC analysis and cyber threat
hunting (an aptitude test assesses baseline expertise).
*Curriculum*: Day 1 SOC fundamentals and service identification; Day 2 attack
methodology and cyber threats; Day 3 incident analysis, management, and logging;
Day 4 vulnerability scan analysis and SIEM-based incident detection; Day 5
response strategies, threat intelligence, and enhanced detection capabilities.

**4. Digital Forensics** — *shortDescription*: "Evidence seizure, preservation,
and forensic analysis for digital investigations."
*Description*: Practical training in digital forensics — forensic principles,
evidence continuity, and methodology — from evidence seizure and data
preservation through analysis, interpretation, and reporting.
*Target audience*: Cyber forensic and network investigators, IT security
officers, law enforcement officials.
*Curriculum*: Digital forensics introduction, investigation guidelines, evidence
identification and seizure, file systems and data storage, metadata analysis,
Windows artifacts investigation, forensic analysis techniques, malicious software
examination, network analysis, memory analysis, OS partitions, Linux imaging
tools, and reporting methodologies.

**5. InfoSys Security Architecture** — *shortDescription*: "CISSP preparation
across all 8 domains of information security architecture."
*Description*: A CISSP preparation course covering globally recognized
information security standards, CISSP exam content, test-taking techniques, and
preparation materials.
*Target audience*: IT auditors, IT consultants, managers, security policy
writers, privacy officers, information security officers, network
administrators.
*Curriculum (8 CISSP domains)*: Security & Risk Management; Asset Security;
Security Engineering; Communications & Network Security; Identity & Access
Management; Security Assessment & Testing; Security Operations; Security in the
Software Development Life Cycle.

**6. AppSec / Cloud Security** — *shortDescription*: "Application and cloud
security fundamentals, from secure SDLC to cloud infrastructure protection."
*Description*: Covers application and cloud security fundamentals delivered at
MIST's Cyber Range and Advanced Computing Lab.
*Target audience*: Intermediate-level professionals seeking certification in
security domains.
*Curriculum*: 13 key areas including cloud concepts, software security
requirements and implementation, secure testing and deployment practices, cloud
data and infrastructure protection, legal/compliance considerations, secure
software lifecycle and supply chain management, and cloud security operations.

**7. InfoSys Auditing** — *shortDescription*: "CISA exam preparation: auditing,
governance, and protection of information assets."
*Description*: Prepares participants for ISACA's CISA exam, covering information
systems audit knowledge sought after by auditing and IT professionals.
*Target audience*: Internal/external auditors, finance/CPA professionals, IT
professionals and managers (CIO/CTO), systems/network/database administrators,
software developers, information security professionals, risk management
professionals.
*Curriculum*: 1) The Process of Auditing Information Systems; 2) Governance and
Management of IT; 3) Information Systems Acquisition, Development, and
Implementation; 4) Information Systems Operations, Maintenance and Support; 5)
Protection of Information Assets.

All 7 courses share the same certification model (80% attendance + 50% minimum
evaluation score across MCQ/lab exams/assignments/presentations/cyber range
exams) — stored per-course in `curriculumHighlights`/`description` rather than as
a separate field, since it's descriptive content, not queried data.

## 5. Backend API (`backend/`)

Express + TypeScript, Prisma client, zod for request validation, CORS restricted
to the frontend's origin.

**Public routes**
- `GET /api/courses` — list (id, slug, name, shortDescription, durationLabel,
  featuredInHero, displayOrder), sorted by `displayOrder`
- `GET /api/courses/:slug` — full detail
- `POST /api/enrollments` — `{ courseId?, name, email, phone?, message? }` →
  creates an `Enrollment` record (`status: NEW`)

**Admin routes** (JWT-protected via middleware; token issued on login, verified
on every admin request)
- `POST /api/admin/login` — `{ email, password }` → `{ token }` (bcrypt compare,
  JWT signed with `JWT_SECRET`)
- `GET/POST /api/admin/courses`, `PUT/DELETE /api/admin/courses/:id` — full CRUD
- `GET /api/admin/enrollments`, `PATCH /api/admin/enrollments/:id` — list +
  status update

Passwords are bcrypt-hashed (never stored/logged in plaintext). JWT secret and
admin bootstrap credentials come from environment variables, never committed.

## 6. Frontend (`frontend/`)

### 6.1 Public site
- `/` — the black-hole hero (server-fetches the 3 `featuredInHero` courses from
  the API and passes them as props into the client-side R3F scene), followed by a
  "view all courses" section in normal document flow.
- `/courses` — full catalog, server-rendered from `GET /api/courses`.
- `/courses/[slug]` — course detail page, server-rendered from
  `GET /api/courses/:slug`, includes an enrollment form (`POST /api/enrollments`).

### 6.2 Black-hole hero component architecture

Unchanged from the original hero-only design — `BlackHoleScene.tsx` is a thin
orchestrator composing focused sub-components:

```
frontend/src/components/three/
  BlackHoleScene.tsx        Canvas + ScrollControls + capability/reduced-motion branching
  scene/EventHorizon.tsx    Black core sphere (unlit, pure black)
  scene/AccretionDisk.tsx   Particle ring, orange→cyan gradient shader, rotation
  scene/Starfield.tsx       Dim drei <Stars> wrapper
  scene/LensingPlane.tsx    Optional distortion shader — deferred, see §10
  scene/ScrollCameraRig.tsx Reads useScroll(), damps camera dolly + disk-speed factor
  scene/CourseOrbit.tsx     Positions CourseCard group on the circle from hero-course props
  scene/CourseCard.tsx      Single glassmorphic <Html> card, damped fade/scale
  scene/StaticFallback.tsx  2D gradient+grid fallback (reduced motion / <4 cores)
```

Visuals: pure-black unlit core; orange→cyan gradient accretion disk; dim,
slow-drifting starfield; Bloom stronger near the core. `ScrollControls
pages={4}` drives camera dolly-in and disk-speed increase via
`MathUtils.damp` (never a direct snap from `scroll.offset`). Cards orbit at a
different radius/Y than the particle disk, counter-rotate to stay legible, and
fade/scale in between scroll 0.4–1.0. `dpr` capped at `[1, 2]`, antialiasing on.

Fallbacks: `prefers-reduced-motion` → static camera/disk/cards, no animation.
`navigator.hardwareConcurrency < 4` → skip the Canvas entirely, render
`StaticFallback` (same 3 courses as a plain CSS grid).

Integration: `frontend/src/app/page.tsx` loads `BlackHoleScene` via
`next/dynamic({ ssr: false })` with a dark pulsing "Initializing…" fallback. The
hero section reserves `4 × 100vh` of scroll distance; the "view all courses"
section that follows sits in normal document flow.

### 6.3 Admin UI
- `/admin/login` — email/password form → `POST /api/admin/login`, stores the JWT
  in an httpOnly cookie (set via a Next.js route handler that proxies the login
  call, so the token never touches client-side JS).
- `/admin/courses` — table of courses with create/edit/delete forms (calls the
  admin CRUD API).
- `/admin/enrollments` — inbox of submissions with status updates.
- Next.js middleware protects all `/admin/*` routes except `/admin/login` by
  checking for the auth cookie and redirecting unauthenticated requests to
  login.

## 7. Docker & Deployment

- `frontend/Dockerfile` — multi-stage build, Next.js `output: 'standalone'` for
  a minimal production image.
- `backend/Dockerfile` — multi-stage build, `tsc` compile → run compiled JS on
  plain `node`.
- Root `docker-compose.yml`:
  - `postgres` (official `postgres:16-alpine`, named volume for persistence)
  - `migrate` — one-shot service running `prisma migrate deploy && prisma db
    seed` against `database/`, exits after completion
  - `backend` — depends on `migrate` completing successfully
  - `frontend` — depends on `backend`
  - All services share a Docker network; secrets flow from a root `.env` (not
    committed — `.env.example` documents required keys: `DATABASE_URL`,
    `JWT_SECRET`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`,
    `NEXT_PUBLIC_API_URL`, `CORS_ORIGIN`).
- Target deployment: self-hosted (VPS or on-prem), `docker compose up -d` is the
  entire deployment procedure.

## 8. Testing Strategy

The R3F hero is visual/animation code where conventional unit tests verify very
little (shader math, camera easing curves). For `frontend/src/components/three/`:
automated gates are `tsc --noEmit`, `next lint`, `next build`; verification is
manual — each implementer runs the dev server and visually confirms the specific
behavior their task added, documented in their task report rather than asserted
in a test file. This is a deliberate, stated exception to normal TDD practice for
this one area of the codebase.

Everywhere else — backend auth, CRUD, validation, enrollment creation; frontend
admin forms and course listing/detail pages — is conventional business logic and
gets real automated tests:
- `backend/`: Vitest + supertest, covering course CRUD, admin auth
  (success/failure/expired-token), enrollment creation, and input validation
  rejection paths.
- `frontend/` (non-3D): React Testing Library for the admin login form, course
  CRUD forms, and the enrollment form — at minimum, submit-success and
  validation-error paths.

## 9. Security Considerations

- No hardcoded credentials anywhere — admin bootstrap and JWT secret are
  environment-only, `.env` is gitignored.
- Passwords bcrypt-hashed, never logged.
- CORS restricted to the known frontend origin (configurable via `CORS_ORIGIN`).
- Admin JWT delivered via httpOnly cookie, not accessible to client-side JS.
- All write endpoints (`POST /api/enrollments`, all `/api/admin/*`) validate
  input with zod before touching the database.

## 10. Open Decisions / Deferred Work

- **Gravitational lensing shader** (`LensingPlane.tsx`): deferred as a stretch
  task, not part of the initial build. The original hero spec explicitly allows
  skipping it if complex; shipping the core visual (glow + disk + starfield)
  correctly first is lower-risk. Can be added later without touching
  camera/scroll logic.
- **Tailwind v4** used (current `create-next-app` default) rather than v3.
- Whether more than the 7 known courses exist on the live MIST site is
  unconfirmed — the site returned HTTP 503 when checked for a full course index.
  The 7 courses given are treated as the complete catalog for this build; adding
  more later is just a seed-data change, not a schema change.

## 11. Out of Scope

- Payment processing for course fees.
- Public user accounts / student login (only admin auth exists).
- Multi-language support.
- Anything from the internal Cyber Range operational platform (Red/Blue/Green/
  White portals) described in the parent monorepo's `CLAUDE.md` — this project is
  an independent public-facing site.
