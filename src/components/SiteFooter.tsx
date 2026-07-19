import Link from "next/link";

import Newsletter from "@/components/Newsletter";

/**
 * Site footer: contact info, quick links, programs, newsletter signup.
 * Contact details are placeholders — confirm real email/phone before launch.
 */
export default function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-zinc-900 bg-zinc-950/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-4">
        {/* Brand + contact */}
        <div className="md:col-span-1">
          <p className="font-mono text-sm font-bold tracking-[0.25em] text-zinc-100">
            CYBER<span className="text-emerald-400">RANGE</span>
          </p>
          <address className="mt-4 space-y-2 text-sm not-italic leading-relaxed text-zinc-500">
            <p>
              Cyber Range &amp; Advanced Computing and Cybersecurity Lab
              <br />
              Tower 3, MIST
              <br />
              Mirpur Cantonment, Dhaka
            </p>
            <p>
              <a
                href="mailto:cyberrange@mist.ac.bd"
                className="transition-colors hover:text-emerald-400"
              >
                cyberrange@mist.ac.bd
              </a>
            </p>
            <p>+880 2-XXXX-XXXX</p>
          </address>
        </div>

        {/* Quick links */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Explore
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
            <li>
              <Link href="/courses" className="hover:text-emerald-400">
                All Courses
              </Link>
            </li>
            <li>
              <Link
                href="/courses#completed"
                className="hover:text-emerald-400"
              >
                Past Cohorts
              </Link>
            </li>
            <li>
              <Link href="/#testimonials" className="hover:text-emerald-400">
                Testimonials
              </Link>
            </li>
            <li>
              <Link href="/#facility" className="hover:text-emerald-400">
                The Facility
              </Link>
            </li>
          </ul>
        </div>

        {/* Programs */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Programs
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
            <li>CEH v13 — Certified Ethical Hacker</li>
            <li>SAPT — Security Assessment &amp; PT</li>
            <li>OSCP Preparation</li>
            <li>Network Security</li>
            <li>Cloud Security</li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Stay in the loop
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-500">
            Batch announcements, seat openings and new course tracks. No spam.
          </p>
          <div className="mt-4">
            <Newsletter />
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-6 text-xs text-zinc-600 md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} MIST Cyber Range (CACR). All rights
            reserved.
          </p>
          <p className="font-mono tracking-wider">
            Registration confirmed upon payment · Limited seats per cohort
          </p>
        </div>
      </div>
    </footer>
  );
}
