import React from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { LEVELS, CEFR_DESCRIPTORS, SKILLS, TOPIC_BANK } from '../lib/catalog';

export default function Levels() {
  return (
    <PageShell
      eyebrow="Catalog"
      title="Every level. Every skill. One worksheet generator."
      intro="From three-year-olds tracing their first letters to IELTS candidates wrestling with True / False / Not Given. Browse the full catalog below — pick a combination, click Generate."
    >
      {/* Levels grid */}
      <section>
        <p className="overline text-terracotta">Student levels</p>
        <h2 className="font-display text-3xl mt-2">Pick the room you teach in.</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          {LEVELS.map((l) => (
            <div key={l.key} className="bg-white border border-border p-7 hover:-translate-y-[1px] transition-transform" data-testid={`level-${l.key}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-2xl">{l.label}</h3>
                <span className="overline text-muted-foreground">{l.age}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{l.blurb}</p>
              <div className="mt-4 flex gap-2 flex-wrap">
                {l.cefr_range.map((c) => (
                  <span key={c} className="overline border border-terracotta text-terracotta px-2 py-1">{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CEFR table */}
      <section className="mt-20">
        <p className="overline text-terracotta">CEFR descriptors</p>
        <h2 className="font-display text-3xl mt-2">A1 → C2 — what students can actually do.</h2>
        <div className="mt-8 border-y border-border divide-y divide-border">
          {Object.entries(CEFR_DESCRIPTORS).map(([k, v]) => (
            <div key={k} className="py-5 grid grid-cols-12 gap-4 items-baseline">
              <div className="col-span-2 font-display text-3xl text-terracotta">{k}</div>
              <div className="col-span-3 overline">{v.name}</div>
              <div className="col-span-7 text-sm text-muted-foreground">{v.can_do}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="mt-20">
        <p className="overline text-terracotta">Skills</p>
        <h2 className="font-display text-3xl mt-2">Five focus modes.</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          {SKILLS.map((s) => (
            <div key={s.key} className="bg-white border border-border p-5" data-testid={`skill-${s.key}`}>
              <div className="font-display text-2xl">{s.label}</div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{s.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Topic bank */}
      <section className="mt-20">
        <p className="overline text-terracotta">Topic ideas</p>
        <h2 className="font-display text-3xl mt-2">A starting point — or write your own.</h2>
        <p className="mt-3 text-muted-foreground max-w-2xl">Steal from this list, or type any topic in the dashboard. Worksheets are generated with Vietnamese names, places and culture by default.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {TOPIC_BANK.map((g) => (
            <div key={g.group}>
              <p className="overline mb-3">{g.group}</p>
              <ul className="space-y-2">
                {g.items.map((it, i) => (
                  <li key={i} className="border-l-2 border-terracotta pl-3 text-sm">{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-20 bg-ink text-white p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="overline text-terracotta">Ready?</p>
          <h3 className="font-display text-3xl mt-1">Generate your first worksheet.</h3>
        </div>
        <Link to="/dashboard" className="bg-terracotta hover:bg-terracotta-hover text-white px-6 py-3 rounded-sm font-medium transition-all hover:-translate-y-[1px]" data-testid="levels-cta">Open dashboard →</Link>
      </div>
    </PageShell>
  );
}
