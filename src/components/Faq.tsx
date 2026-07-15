"use client";

import { useState } from "react";

/**
 * FAQ content. Registration/seat policies are general; course-specific
 * answers are explicitly scoped to the course they belong to (CEH).
 */
const FAQS = [
  {
    q: "Who is the CEH training for?",
    a: "The CEH program targets ICT professionals who want to master cybersecurity best practices — particularly in financial, banking and digital information systems. An aptitude test at the start tunes the program to the cohort's level. Other courses state their own intended audience.",
  },
  {
    q: "What are the prerequisites for CEH?",
    a: "Basic networking knowledge (TCP/IP, routing, protocols), familiarity with Windows and Linux operating systems, and general cybersecurity awareness. Pre-course reading and a tooling checklist are provided before commencement. Prerequisites vary by course.",
  },
  {
    q: "How is registration confirmed?",
    a: "All classes and registration are subject to confirmation. An acceptance email is sent at least one week before the commencement date, and registration is complete upon payment of the course fee.",
  },
  {
    q: "What happens if seats are full?",
    a: "Each course has a limited number of seats. Interested participants may be rolled over to the next scheduled cohort if the nearest one is filled.",
  },
  {
    q: "Do I get range access outside class hours?",
    a: "Flagship cohorts such as CEH include complimentary additional hours of Cyber Range access for hands-on practice beyond the scheduled sessions. Check each course listing for its included range hours.",
  },
  {
    q: "How is the CEH certificate earned?",
    a: "The CEH Certificate of Completion requires a minimum of 80% attendance and at least 60% marks across the MCQ exam (15%), lab exam (25%) and Cyber Range exam (60%). Evaluation criteria differ per course.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-zinc-900 border-y border-zinc-900">
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors hover:text-emerald-400"
            >
              <span
                className={`text-sm font-medium md:text-base ${
                  isOpen ? "text-emerald-400" : "text-zinc-200"
                }`}
              >
                {item.q}
              </span>
              <span
                className={`shrink-0 font-mono text-emerald-500 transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            {/* grid-rows 0fr -> 1fr animates height without measuring it */}
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="pb-5 pr-10 text-sm leading-relaxed text-zinc-500">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
