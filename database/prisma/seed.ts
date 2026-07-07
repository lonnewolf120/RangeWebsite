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
