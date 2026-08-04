import 'dotenv/config';
import { PrismaClient, CourseStatus } from '../generated/client/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * One-time content migration from the frontend's hardcoded
 * src/lib/courses/data.ts into the database. Kept as plain literals here
 * (rather than importing across the frontend/database workspace boundary)
 * since this is a point-in-time migration, not a live dependency.
 */

const FULL_DAY = '9:00 AM – 5:00 PM';
const VENUE = 'Cyber Range and Advanced Computing & Cybersecurity Lab, Tower 3, MIST';

const CONFIRMATION_NOTES = [
  'All classes and registration for a particular course are subject to confirmation. MIST Cyber Range (CACR) will send an acceptance email to participants at least one week prior to the commencement date.',
  'Registration will be considered complete upon payment of the course fee.',
  'The authority reserves the right to change or revise the evaluation criteria, course content, and fee.',
  'Each course has a limited number of seats. Interested participants may be rolled over to the next scheduled course if the seats for the nearest course are filled.',
];

const TRAINING_TEAM = [
  {
    role: 'Lead Instructor',
    qty: '5 (approx.)',
    responsibility:
      'Conduct lectures, supervise labs, evaluate trainees, prepare materials and assessments.',
  },
  {
    role: 'Lab Assistant',
    qty: '1',
    responsibility:
      'Lab setup, troubleshooting, monitoring machines and assisting trainees during hands-on sessions.',
  },
  {
    role: 'Program Coordinator',
    qty: '1',
    responsibility:
      'Schedule management, attendance, logistics, materials, communication with participants and stakeholders.',
  },
];

const TRAINING_TEAM_NOTES = [
  'Adjust module ordering or add extra lab days if trainees need more practical time.',
  'Reserve at least one full lab room per 10 trainees (recommended) with internet-isolated lab network.',
  'Prepare pre-course reading and a checklist for participants (required tools, accounts, VM images).',
];

const STANDARD_CERTIFICATE = {
  name: 'Certificate of Completion',
  description:
    'Participants will be issued a Certificate of Completion provided they have a minimum of 80% attendance and get at least 60% marks based on the following criteria.',
  criteria: [
    { label: 'MCQ Exam', weightPercent: 15 },
    { label: 'Lab Exam', weightPercent: 25 },
    { label: 'Cyber Range Exam', weightPercent: 60 },
  ],
};

const STAFF = {
  tba: {
    name: 'To Be Announced',
    title: 'Lead Instructors',
    credentials:
      'The instructor lineup for each cohort is confirmed with the course announcement — expect working practitioners holding certifications such as CISSP, CEH, OSCP and ISO 27001 LA.',
  },
  shahadat: {
    name: 'Mohammad Shahadat Hossain',
    title: 'Instructor',
    credentials: 'Principal Security Architect at Grameenphone Limited',
  },
  palash: {
    name: 'Md. Bahauddin Palash',
    title: 'Instructor',
    credentials: 'CISSP | C|CISO | ISO 27001 LA | CEH | RHCE | ISTQB | PRINCEII',
  },
};

function tbdOverview(level: string, duration: string) {
  return [
    { label: 'Venue', value: VENUE },
    { label: 'Level', value: level },
    { label: 'Duration', value: duration },
    {
      label: 'Complimentary Offer',
      value: 'Additional Hours Cyber Range Access for hands-on practice',
    },
    {
      label: 'Course Time',
      value: `${FULL_DAY} (Lunch & Prayer Time: 1:00–2:00 PM)`,
    },
    { label: 'Course Commencement', value: 'To be declared' },
    { label: 'Course Fee', value: 'To be announced' },
  ];
}

const courses = [
  {
    slug: 'soc-analysis-threat-hunting',
    title:
      'Certificate Course in Cyber Security Operation Center Analysis and Threat Hunting',
    shortDescription:
      'Blue-team operations on live range telemetry: SOC workflows, log and SIEM analysis, incident triage and proactive threat hunting.',
    status: CourseStatus.UPCOMING,
    startDateText: null,
    featured: true,
    displayOrder: 1,
    level: 'Intermediate',
    overview: tbdOverview('Intermediate', 'To be declared'),
    about: [
      'This certificate course focuses on the day-to-day reality of a Security Operations Center: monitoring, detecting, analyzing and responding to threats against enterprise infrastructure. Participants work with real telemetry on the isolated range network — not canned exercises.',
      'The program combines SOC analysis fundamentals with proactive threat hunting: building detections, triaging alerts, pivoting through logs, mapping adversary behavior to MITRE ATT&CK and hunting for intrusions that evade automated detection. Full curriculum, schedule and fees will be announced with the course commencement date.',
    ],
    takeaways: [
      'Operate confidently inside a SOC: monitoring, alert triage and escalation workflows',
      'Collect, normalize and analyze logs from endpoints, networks and applications in a SIEM',
      'Write and tune detection rules to reduce false positives',
      'Map observed adversary behavior to the MITRE ATT&CK framework',
      'Consume and apply cyber threat intelligence in daily operations',
      'Plan and execute hypothesis-driven threat hunts across enterprise telemetry',
      'Carry out structured incident triage, containment and reporting',
    ],
    audience: [
      'This course is intended for ICT professionals moving into blue-team roles — SOC analysts, incident responders, system and network administrators, and security team members responsible for monitoring and defending enterprise infrastructure.',
      'An aptitude test will be taken at the start of the course to assess the level of expertise of the trainees so that the training program may be tuned accordingly.',
    ],
    prerequisites: [
      'Basic networking knowledge (TCP/IP, routing, protocols)',
      'Familiarity with Windows & Linux operating systems',
      'Basic cybersecurity awareness',
    ],
    courseSchedule: [
      {
        week: 'Week 1',
        day: 'Day 1 (TBD)',
        time: FULL_DAY,
        coverage: 'SOC Fundamentals: roles, tiers, workflows and SIEM architecture',
      },
      {
        week: 'Week 1',
        day: 'Day 2 (TBD)',
        time: FULL_DAY,
        coverage:
          'Log Analysis: collection, normalization and analysis of endpoint, network and application logs',
      },
      {
        week: 'Week 2',
        day: 'Day 3 (TBD)',
        time: FULL_DAY,
        coverage:
          'Detection Engineering & Alert Triage: building, tuning and prioritizing detections',
      },
      {
        week: 'Week 2',
        day: 'Day 4 (TBD)',
        time: FULL_DAY,
        coverage:
          'Threat Intelligence & MITRE ATT&CK: applying CTI and adversary behavior mapping',
      },
      {
        week: 'Week 3',
        day: 'Day 5 (TBD)',
        time: FULL_DAY,
        coverage:
          'Threat Hunting Methodology: hypothesis-driven hunts across live range telemetry',
      },
      {
        week: 'Week 3',
        day: 'Day 6 (TBD)',
        time: FULL_DAY,
        coverage:
          'Incident Response: triage, containment, eradication and reporting workflows',
      },
      {
        week: 'Week 4',
        day: 'Day 7 (TBD)',
        time: FULL_DAY,
        coverage: 'Practical Lab: defend the range against a live attack campaign end-to-end',
      },
      {
        week: 'Week 4',
        day: 'Day 8 (TBD)',
        time: FULL_DAY,
        coverage: 'Final Assessment & Presentation: internal certification evaluation',
      },
    ],
    scheduleNotes: [
      'Tentative module plan — session dates, count and ordering will be finalized when the cohort is announced.',
      'Full-day sessions with breaks and lab time included.',
    ],
    trainingTeam: TRAINING_TEAM,
    trainingTeamNotes: TRAINING_TEAM_NOTES,
    certificate: STANDARD_CERTIFICATE,
    confirmationNotes: CONFIRMATION_NOTES,
    instructors: [STAFF.tba],
  },
  {
    slug: 'infosec-assessment-penetration-testing',
    title: 'Information Security Assessment and Penetration Testing',
    shortDescription:
      'Hands-on security assessment methodology: scoping, reconnaissance, exploitation and reporting against real infrastructure.',
    status: CourseStatus.OFFERED,
    durationHours: 40,
    durationText: '40 Hours (Fridays, full-day sessions)',
    scheduleText: 'Fridays',
    startDateText: null,
    displayOrder: 2,
    level: 'Intermediate',
    overview: tbdOverview('Intermediate', '40 Hours — Fridays, full-day sessions'),
    about: [
      'This course teaches the complete lifecycle of a professional security assessment: scoping and rules of engagement, reconnaissance, vulnerability discovery, controlled exploitation and clear, actionable reporting. Every phase is practiced hands-on against real targets on the isolated range network.',
      'Participants leave able to plan and execute a penetration test to a professional standard — and to translate technical findings into risk language that management and system owners can act on.',
    ],
    takeaways: [
      'Scope an engagement and define rules of engagement professionally',
      'Perform reconnaissance and OSINT against a target organization',
      'Run network scanning, enumeration and vulnerability assessment',
      'Exploit system and web-application vulnerabilities in a controlled manner',
      'Escalate privileges and move laterally within a compromised environment',
      'Assess findings by business risk, not just technical severity',
      'Write penetration test reports that drive remediation',
    ],
    audience: [
      'This course is intended for ICT and security professionals who need to assess the security posture of systems and networks — penetration testers, security engineers, auditors and administrators responsible for hardening infrastructure.',
      'An aptitude test will be taken at the start of the course to assess the level of expertise of the trainees so that the training program may be tuned accordingly.',
    ],
    prerequisites: [
      'Basic networking knowledge (TCP/IP, routing, protocols)',
      'Familiarity with Windows & Linux operating systems',
      'Basic cybersecurity awareness',
    ],
    courseSchedule: [
      {
        week: 'Week 1',
        day: 'Friday (TBD)',
        time: FULL_DAY,
        coverage: 'Assessment Methodology: scoping, rules of engagement, reconnaissance & OSINT',
      },
      {
        week: 'Week 2',
        day: 'Friday (TBD)',
        time: FULL_DAY,
        coverage:
          'Scanning & Enumeration: network mapping, service enumeration, vulnerability assessment',
      },
      {
        week: 'Week 3',
        day: 'Friday (TBD)',
        time: FULL_DAY,
        coverage: 'Exploitation: system and network exploitation, privilege escalation',
      },
      {
        week: 'Week 4',
        day: 'Friday (TBD)',
        time: FULL_DAY,
        coverage:
          'Web Application Testing: OWASP Top 10, injection, authentication and session flaws',
      },
      {
        week: 'Week 5',
        day: 'Friday (TBD)',
        time: FULL_DAY,
        coverage: 'Reporting & Final Assessment: findings, risk rating, report writing and evaluation',
      },
    ],
    scheduleNotes: [
      'Tentative module plan — dates will be finalized when the cohort is announced.',
      'Full-day Friday sessions with breaks and lab time included.',
    ],
    trainingTeam: TRAINING_TEAM,
    trainingTeamNotes: TRAINING_TEAM_NOTES,
    certificate: STANDARD_CERTIFICATE,
    confirmationNotes: CONFIRMATION_NOTES,
    instructors: [STAFF.tba],
  },
  {
    slug: 'ethical-hacking-countermeasures-vapt',
    title: 'Certificate Course in Ethical Hacking, Countermeasures & VAPT',
    shortDescription:
      'Offensive techniques and their countermeasures, with full vulnerability assessment and penetration testing engagements.',
    status: CourseStatus.OFFERED,
    durationHours: 60,
    durationText: '60 Hours',
    startDateText: null,
    displayOrder: 3,
    level: 'Intermediate',
    overview: tbdOverview('Intermediate', '60 Hours'),
    about: [
      'This certificate course pairs every offensive technique with its defensive countermeasure: participants learn how attacks against systems, networks and applications actually work — and then how to detect, block and remediate them. The program culminates in complete vulnerability assessment and penetration testing (VAPT) engagements on the range.',
      'The dual attack-and-defense perspective prepares participants both for offensive security roles and for hardening the infrastructure they are responsible for.',
    ],
    takeaways: [
      'Understand the phases and methodology of ethical hacking',
      'Perform footprinting, scanning, enumeration and vulnerability analysis',
      'Execute system, network and web-application attacks in a controlled lab',
      'Apply the corresponding countermeasures: hardening, detection and response',
      'Analyze malware behavior and defend against social engineering',
      'Conduct complete VAPT engagements and document findings professionally',
      'Understand security controls across hosts, networks and applications',
    ],
    audience: [
      'This course is intended as a comprehensive course for ICT professionals who want to understand offensive security and the corresponding defensive best practices, particularly in Financial, Banking and overall Digital Information Systems.',
      'An aptitude test will be taken at the start of the course to assess the level of expertise of the trainees so that the training program may be tuned accordingly.',
    ],
    prerequisites: [
      'Basic networking knowledge (TCP/IP, routing, protocols)',
      'Familiarity with Windows & Linux operating systems',
      'Basic cybersecurity awareness',
    ],
    courseSchedule: [
      {
        week: 'Week 1',
        day: 'Day 1 (TBD)',
        time: FULL_DAY,
        coverage: 'Introduction to Ethical Hacking, Footprinting & Reconnaissance',
      },
      {
        week: 'Week 1',
        day: 'Day 2 (TBD)',
        time: FULL_DAY,
        coverage: 'Scanning Networks, Enumeration & Vulnerability Analysis',
      },
      {
        week: 'Week 2',
        day: 'Day 3 (TBD)',
        time: FULL_DAY,
        coverage: 'System Hacking & Privilege Escalation — and countermeasures',
      },
      {
        week: 'Week 2',
        day: 'Day 4 (TBD)',
        time: FULL_DAY,
        coverage: 'Malware Threats, Sniffing & Social Engineering — and countermeasures',
      },
      {
        week: 'Week 3',
        day: 'Day 5 (TBD)',
        time: FULL_DAY,
        coverage: 'Web Server & Web Application Attacks, SQL Injection — and countermeasures',
      },
      {
        week: 'Week 3',
        day: 'Day 6 (TBD)',
        time: FULL_DAY,
        coverage: 'Wireless, Mobile & Cloud Attacks — and countermeasures',
      },
      {
        week: 'Week 4',
        day: 'Day 7 (TBD)',
        time: FULL_DAY,
        coverage: 'Full VAPT Engagement: assessment, exploitation and reporting on the range',
      },
      {
        week: 'Week 4',
        day: 'Day 8 (TBD)',
        time: FULL_DAY,
        coverage: 'Final Assessment & Presentation: internal certification evaluation',
      },
    ],
    scheduleNotes: [
      'Tentative module plan — dates will be finalized when the cohort is announced.',
      'Full-day sessions with breaks and lab time included.',
    ],
    trainingTeam: TRAINING_TEAM,
    trainingTeamNotes: TRAINING_TEAM_NOTES,
    certificate: STANDARD_CERTIFICATE,
    confirmationNotes: CONFIRMATION_NOTES,
    instructors: [STAFF.tba],
  },
  {
    slug: 'digital-forensic-investigation',
    title: 'Certificate Course in Digital Forensic Investigation',
    shortDescription:
      'Evidence acquisition, preservation and analysis across disk, memory and network artifacts — investigation to courtroom-ready report.',
    status: CourseStatus.OFFERED,
    durationHours: 40,
    durationText: '40 Hours',
    startDateText: null,
    displayOrder: 4,
    level: 'Intermediate',
    overview: tbdOverview('Intermediate', '40 Hours'),
    about: [
      'This certificate course covers the digital forensic process end-to-end: identifying, acquiring and preserving evidence without contaminating it, analyzing disk, memory, network and mobile artifacts, and documenting findings in a report that stands up to scrutiny.',
      'Participants practice on realistic compromise scenarios staged on the range — reconstructing what an attacker did, when, and how, while maintaining a defensible chain of custody throughout.',
    ],
    takeaways: [
      'Apply the digital forensic process: identification, acquisition, preservation, analysis, reporting',
      'Maintain chain of custody and evidence integrity throughout an investigation',
      'Acquire and analyze disk images and file-system artifacts',
      'Perform memory forensics to recover volatile evidence of intrusions',
      'Analyze network captures and logs to reconstruct attacker activity',
      'Examine email and mobile artifacts in an investigation context',
      'Produce clear, defensible investigation reports',
    ],
    audience: [
      'This course is intended for ICT, security, law-enforcement and audit professionals who need to investigate security incidents and digital crimes — incident responders, SOC analysts, investigators and compliance officers.',
      'An aptitude test will be taken at the start of the course to assess the level of expertise of the trainees so that the training program may be tuned accordingly.',
    ],
    prerequisites: [
      'Basic networking knowledge (TCP/IP, routing, protocols)',
      'Familiarity with Windows & Linux operating systems',
      'Basic cybersecurity awareness',
    ],
    courseSchedule: [
      {
        week: 'Week 1',
        day: 'Day 1 (TBD)',
        time: FULL_DAY,
        coverage: 'Forensic Fundamentals: process, legal considerations, chain of custody',
      },
      {
        week: 'Week 2',
        day: 'Day 2 (TBD)',
        time: FULL_DAY,
        coverage: 'Evidence Acquisition: disk imaging, write blocking, integrity verification',
      },
      {
        week: 'Week 3',
        day: 'Day 3 (TBD)',
        time: FULL_DAY,
        coverage: 'Disk & File-System Analysis: artifacts, timelines, deleted data recovery',
      },
      {
        week: 'Week 4',
        day: 'Day 4 (TBD)',
        time: FULL_DAY,
        coverage: 'Memory & Network Forensics: volatile evidence, packet and log analysis',
      },
      {
        week: 'Week 5',
        day: 'Day 5 (TBD)',
        time: FULL_DAY,
        coverage: 'Case Study & Final Assessment: full investigation, reporting and evaluation',
      },
    ],
    scheduleNotes: [
      'Tentative module plan — dates will be finalized when the cohort is announced.',
      'Full-day sessions with breaks and lab time included.',
    ],
    trainingTeam: TRAINING_TEAM,
    trainingTeamNotes: TRAINING_TEAM_NOTES,
    certificate: STANDARD_CERTIFICATE,
    confirmationNotes: CONFIRMATION_NOTES,
    instructors: [STAFF.tba],
  },
  {
    slug: 'information-systems-security-architecture',
    title: 'Certificate Course in Information Systems Security Architecture',
    shortDescription:
      'Designing secure enterprise systems: security models, defense in depth, network segmentation and architecture review.',
    status: CourseStatus.OFFERED,
    durationHours: 60,
    durationText: '60 Hours',
    startDateText: null,
    displayOrder: 5,
    level: 'Advanced',
    overview: tbdOverview('Advanced', '60 Hours'),
    about: [
      'This certificate course teaches participants to design security into systems rather than bolt it on: security models and architecture frameworks, defense in depth, network segmentation, identity and access architecture, cryptographic design and secure cloud/hybrid topologies.',
      'Working from real enterprise scenarios, participants produce and defend architecture designs, and learn to review existing architectures for structural weaknesses an attacker would exploit.',
    ],
    takeaways: [
      'Apply security architecture frameworks and security models to enterprise design',
      'Design layered defenses: segmentation, zoning and defense in depth',
      'Architect identity and access management, including privileged access',
      'Make sound cryptographic design decisions: PKI, TLS, key management',
      'Design secure cloud and hybrid topologies',
      'Apply Zero Trust principles to modern enterprise networks',
      'Review and critique an existing architecture for structural weaknesses',
    ],
    audience: [
      'This course is intended for experienced ICT professionals who design or approve systems — security architects, senior engineers, infrastructure leads and CISO-track professionals, particularly in Financial, Banking and overall Digital Information Systems.',
      'An aptitude test will be taken at the start of the course to assess the level of expertise of the trainees so that the training program may be tuned accordingly.',
    ],
    prerequisites: [
      'Solid networking knowledge (TCP/IP, routing, protocols)',
      'Experience with Windows & Linux systems administration',
      'Working knowledge of core security concepts and controls',
    ],
    courseSchedule: [
      {
        week: 'Week 1',
        day: 'Day 1 (TBD)',
        time: FULL_DAY,
        coverage: 'Security Architecture Principles: security models, frameworks, threat modeling',
      },
      {
        week: 'Week 1',
        day: 'Day 2 (TBD)',
        time: FULL_DAY,
        coverage: 'Enterprise Architecture: layering, zoning, defense in depth, segmentation',
      },
      {
        week: 'Week 2',
        day: 'Day 3 (TBD)',
        time: FULL_DAY,
        coverage: 'Network Security Design: perimeter, internal segmentation, monitoring points',
      },
      {
        week: 'Week 2',
        day: 'Day 4 (TBD)',
        time: FULL_DAY,
        coverage: 'Identity & Access Architecture: IAM, federation, privileged access management',
      },
      {
        week: 'Week 3',
        day: 'Day 5 (TBD)',
        time: FULL_DAY,
        coverage: 'Cryptographic Design: PKI, TLS, key management and data protection',
      },
      {
        week: 'Week 3',
        day: 'Day 6 (TBD)',
        time: FULL_DAY,
        coverage: 'Cloud & Hybrid Architecture: secure topologies and controls',
      },
      {
        week: 'Week 4',
        day: 'Day 7 (TBD)',
        time: FULL_DAY,
        coverage: 'Zero Trust: principles, roadmap and reference designs',
      },
      {
        week: 'Week 4',
        day: 'Day 8 (TBD)',
        time: FULL_DAY,
        coverage: 'Capstone Design Review & Final Assessment: present and defend an architecture',
      },
    ],
    scheduleNotes: [
      'Tentative module plan — dates will be finalized when the cohort is announced.',
      'Full-day sessions with breaks and lab time included.',
    ],
    trainingTeam: TRAINING_TEAM,
    trainingTeamNotes: TRAINING_TEAM_NOTES,
    certificate: STANDARD_CERTIFICATE,
    confirmationNotes: CONFIRMATION_NOTES,
    instructors: [STAFF.tba],
  },
  {
    slug: 'application-software-cloud-security',
    title: 'Certificate Course in Application Software and Cloud Security',
    shortDescription:
      'Securing modern software: application security practices, cloud workloads, IAM and container security.',
    status: CourseStatus.OFFERED,
    durationHours: 40,
    durationText: '40 Hours',
    startDateText: null,
    displayOrder: 6,
    level: 'Intermediate',
    overview: tbdOverview('Intermediate', '40 Hours'),
    about: [
      'This certificate course covers security across the modern software stack: secure development practices, the OWASP Top 10, API security, and the cloud platforms and containers that applications run on — including identity and access management, workload hardening and DevSecOps pipelines.',
      'Participants both attack and defend: exploiting vulnerable applications and misconfigured cloud environments on the range, then fixing and hardening them.',
    ],
    takeaways: [
      'Integrate security into the software development lifecycle',
      'Identify and remediate the OWASP Top 10 vulnerability classes',
      'Test and secure APIs and modern web applications',
      'Configure cloud IAM correctly and detect privilege-escalation paths',
      'Harden cloud workloads, storage and network configurations',
      'Secure containers and orchestration platforms',
      'Embed security checks into CI/CD (DevSecOps) pipelines',
    ],
    audience: [
      'This course is intended for developers, DevOps engineers, cloud administrators and security professionals responsible for the security of applications and the cloud infrastructure they run on.',
      'An aptitude test will be taken at the start of the course to assess the level of expertise of the trainees so that the training program may be tuned accordingly.',
    ],
    prerequisites: [
      'Basic programming or scripting experience',
      'Familiarity with web application concepts (HTTP, APIs, databases)',
      'Basic knowledge of at least one cloud platform is helpful',
    ],
    courseSchedule: [
      {
        week: 'Week 1',
        day: 'Day 1 (TBD)',
        time: FULL_DAY,
        coverage: 'Secure SDLC & OWASP Top 10: vulnerability classes and secure design',
      },
      {
        week: 'Week 2',
        day: 'Day 2 (TBD)',
        time: FULL_DAY,
        coverage: 'Application Attack & Defense: exploiting and fixing web and API vulnerabilities',
      },
      {
        week: 'Week 3',
        day: 'Day 3 (TBD)',
        time: FULL_DAY,
        coverage:
          'Cloud Security Fundamentals: IAM, storage, network controls and misconfigurations',
      },
      {
        week: 'Week 4',
        day: 'Day 4 (TBD)',
        time: FULL_DAY,
        coverage: 'Containers & DevSecOps: container hardening, orchestration security, CI/CD',
      },
      {
        week: 'Week 5',
        day: 'Day 5 (TBD)',
        time: FULL_DAY,
        coverage: 'Practical Lab & Final Assessment: end-to-end secure deployment and evaluation',
      },
    ],
    scheduleNotes: [
      'Tentative module plan — dates will be finalized when the cohort is announced.',
      'Full-day sessions with breaks and lab time included.',
    ],
    trainingTeam: TRAINING_TEAM,
    trainingTeamNotes: TRAINING_TEAM_NOTES,
    certificate: STANDARD_CERTIFICATE,
    confirmationNotes: CONFIRMATION_NOTES,
    instructors: [STAFF.tba],
  },
  {
    slug: 'information-systems-auditing',
    title: 'Certificate Course in Information Systems Auditing',
    shortDescription:
      'Auditing information systems for compliance and risk: controls, frameworks, evidence gathering and audit reporting.',
    status: CourseStatus.OFFERED,
    durationHours: 40,
    durationText: '40 Hours',
    startDateText: null,
    displayOrder: 7,
    level: 'Intermediate',
    overview: tbdOverview('Intermediate', '40 Hours'),
    about: [
      'This certificate course teaches the practice of information systems auditing: planning an audit around business risk, evaluating IT general and application controls, gathering and documenting evidence, and reporting findings that lead to real remediation.',
      'The course draws on established frameworks and standards (including COBIT and ISO 27001) and uses hands-on exercises against range-hosted systems, so participants audit real configurations — not just paperwork.',
    ],
    takeaways: [
      'Plan and scope an IS audit based on business risk',
      'Evaluate IT general controls: access, change, operations and continuity',
      'Test application controls and data integrity',
      'Apply frameworks and standards such as COBIT and ISO 27001 in audit work',
      'Gather, document and preserve audit evidence properly',
      'Assess third-party and outsourcing risk',
      'Write audit reports and follow up on remediation effectively',
    ],
    audience: [
      'This course is intended for internal and external auditors, compliance officers, risk managers and ICT professionals responsible for control assurance, particularly in Financial, Banking and overall Digital Information Systems.',
      'An aptitude test will be taken at the start of the course to assess the level of expertise of the trainees so that the training program may be tuned accordingly.',
    ],
    prerequisites: [
      'General understanding of IT infrastructure and operations',
      'Familiarity with basic security and control concepts',
      'Audit or compliance experience is helpful but not required',
    ],
    courseSchedule: [
      {
        week: 'Week 1',
        day: 'Day 1 (TBD)',
        time: FULL_DAY,
        coverage: 'IS Audit Fundamentals: standards, frameworks (COBIT, ISO 27001) and audit process',
      },
      {
        week: 'Week 2',
        day: 'Day 2 (TBD)',
        time: FULL_DAY,
        coverage: 'Audit Planning & Risk Assessment: scoping around business risk',
      },
      {
        week: 'Week 3',
        day: 'Day 3 (TBD)',
        time: FULL_DAY,
        coverage:
          'IT General Controls: access management, change management, operations, continuity',
      },
      {
        week: 'Week 4',
        day: 'Day 4 (TBD)',
        time: FULL_DAY,
        coverage:
          'Application & Infrastructure Audit: control testing and evidence gathering on live systems',
      },
      {
        week: 'Week 5',
        day: 'Day 5 (TBD)',
        time: FULL_DAY,
        coverage: 'Reporting & Final Assessment: audit report writing, case study and evaluation',
      },
    ],
    scheduleNotes: [
      'Tentative module plan — dates will be finalized when the cohort is announced.',
      'Full-day sessions with breaks and lab time included.',
    ],
    trainingTeam: TRAINING_TEAM,
    trainingTeamNotes: TRAINING_TEAM_NOTES,
    certificate: STANDARD_CERTIFICATE,
    confirmationNotes: CONFIRMATION_NOTES,
    instructors: [STAFF.tba],
  },
  {
    slug: 'certified-ethical-hacker-ceh-v12',
    title: 'Certified Ethical Hacker (CEH v12)',
    shortDescription:
      '12-day / 96-hour flagship cohort: hands-on exposure to real-world hacking tools, techniques and methodologies, preparing participants for the CEH knowledge and practical exams.',
    status: CourseStatus.COMPLETED,
    durationHours: 96,
    durationText: '12 Days (6 Weeks) every Friday & Saturday',
    startDateText: '5 December 2025 (tentative)',
    periodText: 'Dec 2025 – Jan 2026',
    feeText: 'BDT 45,000',
    displayOrder: 8,
    level: 'Intermediate',
    overview: [
      { label: 'Venue', value: VENUE },
      { label: 'Level', value: 'Intermediate' },
      { label: 'Duration', value: '12 Days (6 Weeks) every Friday & Saturday' },
      {
        label: 'Complimentary Offer',
        value: 'Additional Hours Cyber Range Access for hands-on practice',
      },
      {
        label: 'Course Time',
        value: `${FULL_DAY} (Lunch & Prayer Time: 1:00–2:00 PM)`,
      },
      { label: 'Course Commencement', value: '5 December 2025 (tentative)' },
      { label: 'Course Fee', value: 'BDT 45,000' },
    ],
    about: [
      'The CEH v12 training provides hands-on exposure to real-world hacking tools, techniques, and methodologies. It covers both knowledge and practical skills to prepare participants for ethical hacking and penetration testing in professional environments.',
      "The course aims to provide participants with a comprehensive understanding of the phases and methodologies of ethical hacking and penetration testing, enabling them to practically perform reconnaissance, scanning, enumeration, exploitation, and privilege escalation. It equips participants with the skills to identify and mitigate system, network, and web-based vulnerabilities effectively. Additionally, the course covers malware behavior analysis and security defense mechanisms to enhance participants' ability to protect and defend systems. Ultimately, the training prepares participants for the CEH (Certified Ethical Hacker) knowledge exam and, for those who opt, the CEH Practical exam.",
    ],
    takeaways: [
      'Know how to secure digital business channels',
      'Know about Footprinting, Sniffing, Spoofing, and Port Scanning',
      'Carry out Vulnerability Assessment, Security Research, and Analysis',
      'Identify threats and vulnerabilities',
      'Understand the concepts of System Hacking',
      'Conduct Penetration Testing',
      'Understand cybersecurity issues related to Web Applications, Database Systems, and Virtualized, Distributed, and Shared Computing',
      'Have an understanding of security measures including Host Security and Enterprise Security Integration',
    ],
    audience: [
      'This course is intended as a comprehensive course for ICT professionals who want to understand the best practices in cybersecurity, particularly in Financial, Banking and overall Digital Information Systems.',
      'An aptitude test will be taken at the start of the course to assess the level of expertise of the trainees so that the training program may be tuned accordingly.',
    ],
    prerequisites: [
      'Basic networking knowledge (TCP/IP, routing, protocols)',
      'Familiarity with Windows & Linux operating systems',
      'Basic cybersecurity awareness',
    ],
    courseSchedule: [
      {
        week: 'Week 1',
        day: 'Fri, Dec 5',
        time: '9 AM – 5 PM',
        coverage: 'Module 1 & 2: Introduction to Ethical Hacking, Footprinting & Reconnaissance',
      },
      {
        week: 'Week 1',
        day: 'Sat, Dec 6',
        time: '9 AM – 5 PM',
        coverage: 'Module 3 & 4: Scanning Networks, Enumeration',
      },
      {
        week: 'Week 2',
        day: 'Fri, Dec 12',
        time: '9 AM – 5 PM',
        coverage: 'Module 5 & 6: Vulnerability Analysis, System Hacking',
      },
      {
        week: 'Week 2',
        day: 'Sat, Dec 13',
        time: '9 AM – 5 PM',
        coverage: 'Module 7, 8 & 11: Malware Threats, Sniffing & Session Hijacking',
      },
      {
        week: 'Week 3',
        day: 'Fri, Dec 19',
        time: '9 AM – 5 PM',
        coverage: 'Module 9, 10 & 12: Social Engineering, DoS/DDoS, IDS/Firewall Evasion',
      },
      {
        week: 'Week 3',
        day: 'Sat, Dec 20',
        time: '9 AM – 5 PM',
        coverage: 'Module 13 & 14: Web Server & Web Application Hacking',
      },
      {
        week: 'Week 4',
        day: 'Fri, Dec 26',
        time: '9 AM – 5 PM',
        coverage: 'Module 15 & 16: SQL Injection, Wireless Network Hacking',
      },
      {
        week: 'Week 4',
        day: 'Sat, Dec 27',
        time: '9 AM – 5 PM',
        coverage: 'Module 17, 18 & 19: Mobile, IoT, and Cloud Hacking',
      },
      {
        week: 'Week 5',
        day: 'Fri, Jan 2',
        time: '9 AM – 5 PM',
        coverage: 'Module 20: Cryptography, Security Controls & Reporting',
      },
      {
        week: 'Week 5',
        day: 'Sat, Jan 3',
        time: '9 AM – 5 PM',
        coverage: 'Practical Lab: Attack–Defense Simulation (Hands-on exercises covering all modules)',
      },
      {
        week: 'Week 6',
        day: 'Fri, Jan 9',
        time: '9 AM – 5 PM',
        coverage: 'Case Study & Simulation: Real World Attacks Analysis',
      },
      {
        week: 'Week 6',
        day: 'Sat, Jan 10',
        time: '9 AM – 5 PM',
        coverage: 'Final Assessment & Presentation: Internal Certification Evaluation',
      },
    ],
    scheduleNotes: [
      'Full-day sessions (9:00 AM – 5:00 PM). Practical labs and final assessment included.',
      'Module numbers correspond to the course curriculum. Times are full-day sessions with breaks and lab time included.',
    ],
    trainingTeam: TRAINING_TEAM,
    trainingTeamNotes: TRAINING_TEAM_NOTES,
    certificate: STANDARD_CERTIFICATE,
    confirmationNotes: CONFIRMATION_NOTES,
    instructors: [STAFF.shahadat, STAFF.palash],
  },
];

async function main(): Promise<void> {
  for (const { instructors, ...courseData } of courses) {
    const course = await prisma.course.upsert({
      where: { slug: courseData.slug },
      update: courseData,
      create: courseData,
    });

    for (let i = 0; i < instructors.length; i += 1) {
      const staffDef = instructors[i];
      const existingStaff = await prisma.staffMember.findFirst({ where: { name: staffDef.name } });
      const staff = existingStaff
        ? await prisma.staffMember.update({ where: { id: existingStaff.id }, data: staffDef })
        : await prisma.staffMember.create({ data: staffDef });

      await prisma.courseInstructor.upsert({
        where: { courseId_staffId: { courseId: course.id, staffId: staff.id } },
        update: { displayOrder: i },
        create: { courseId: course.id, staffId: staff.id, displayOrder: i },
      });
    }
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
