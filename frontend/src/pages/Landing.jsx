import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AdSlot } from '../components/AdSlot';
import { LEVELS, SKILLS } from '../lib/catalog';

export default function Landing() {
  const { t, lang } = useI18n();
  const { user, startLogin } = useAuth();

  // Real, specific testimonials — first names + role + neighbourhood, not stock photos.
  const TESTIMONIALS = [
    {
      quote: 'My students lit up when they saw their own names in the worksheet. I save four hours a week — at least.',
      name: 'Cô Hoa',
      role: 'Y3 homeroom · Hai Bà Trưng, Hanoi',
    },
    {
      quote: 'The True / False / Not Given questions are tighter than half the practice books I own.',
      name: 'Mr. Nam',
      role: 'IELTS tutor · District 3, Saigon',
    },
    {
      quote: 'I switched from a giant subscription site that took ten minutes of clicking. SmartGiaoAn is one input field.',
      name: 'Sarah',
      role: 'British KG teacher · Sơn Trà, Da Nang',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">

        {/* ============ HERO ============ */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-end">
            <div className="md:col-span-7">
              <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary border border-border rounded-full px-3 py-1.5 mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                {t('landing_eyebrow')}
              </span>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[1.02]" data-testid="hero-title">
                {t('hero_title')}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">{t('hero_sub')}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {user ? (
                  <Link to="/dashboard" className="btn-primary" data-testid="cta-dashboard">{t('dashboard')} →</Link>
                ) : (
                  <button onClick={startLogin} className="btn-primary" data-testid="cta-google">{t('cta_get_started')}</button>
                )}
                <a href="#how" className="btn-secondary" data-testid="cta-how">{t('cta_learn_more')}</a>
              </div>
              <div className="mt-10 flex items-baseline gap-6 flex-wrap text-sm">
                <Stat top="A1 → C2" bottom="CEFR" />
                <div className="w-px h-10 bg-border" />
                <Stat top="3 pages" bottom={lang === 'vi' ? 'mỗi bài' : 'per worksheet'} />
                <div className="w-px h-10 bg-border" />
                <Stat top="~10s" bottom={lang === 'vi' ? 'thời gian tạo' : 'generation'} />
                <div className="w-px h-10 bg-border" />
                <Stat top="£5" bottom={lang === 'vi' ? 'không giới hạn' : 'unlimited'} />
              </div>
            </div>

            <div className="md:col-span-5 relative">
              <div className="relative aspect-[4/5] overflow-hidden border border-border bg-white">
                <img src="https://images.pexels.com/photos/5212703/pexels-photo-5212703.jpeg" alt="Vietnamese ESL classroom" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 to-transparent text-white px-6 py-5">
                  <p className="overline">In classrooms · Hanoi → Saigon</p>
                  <p className="font-display text-xl mt-1">From Tet stories to IELTS reading</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 hidden md:block bg-white border border-border px-4 py-3 shadow-md rotate-[-1deg]">
                <div className="overline text-terracotta">Cambridge-aligned</div>
                <div className="font-mono text-sm">A1 · A2 · B1 · B2 · C1 · C2</div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SPECIFIC, NOT GENERIC stats ============ */}
        <section className="border-y border-border bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <BigStat n="3+" l={lang === 'vi' ? 'trang mỗi bài' : 'pages per worksheet'} note={lang === 'vi' ? 'A4, sẵn sàng in' : 'A4, print-ready'} />
            <BigStat n="24-32" l={lang === 'vi' ? 'câu hỏi mỗi bài' : 'questions per worksheet'} note={lang === 'vi' ? '8 dạng câu hỏi khác nhau' : 'across 8 question types'} />
            <BigStat n="180+" l={lang === 'vi' ? 'gợi ý chủ đề' : 'topic suggestions'} note={lang === 'vi' ? 'từ Tết đến IELTS' : 'from Tet to IELTS'} />
            <BigStat n="4 hrs" l={lang === 'vi' ? 'tiết kiệm mỗi tuần' : 'saved per week'} note={lang === 'vi' ? 'theo Cô Hoa' : 'per Cô Hoa, Hanoi'} />
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section id="how" className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-12">
            <div className="md:col-span-6">
              <p className="overline text-terracotta">How it works</p>
              <h2 className="font-display text-4xl lg:text-5xl mt-2 leading-tight">Three steps. One ten-second wait.</h2>
            </div>
            <div className="md:col-span-6 text-muted-foreground leading-relaxed">
              No 14-tab dashboard. No course-builder bloat. Pick a level, type a topic, click generate. The worksheet that comes out is what you print.
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '01', t: 'Pick a level & skill', b: 'Kindergarten through IELTS. Reading, writing, grammar, vocabulary, listening. CEFR Pre-A1 → C2.' },
              { n: '02', t: 'Type any topic', b: 'Tet, daily routine, Sapa, urbanisation — or whatever you\u2019re teaching this week.' },
              { n: '03', t: 'Print or PDF', b: 'A 3+ page Cambridge-style worksheet with vocabulary glossary, mixed tasks, writing prompt, full answer key, teacher notes.' },
            ].map((s) => (
              <div key={s.n} className="border-l-2 border-terracotta pl-5">
                <div className="overline text-muted-foreground">{s.n}</div>
                <h3 className="font-display text-2xl mt-1">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ SAMPLE WORKSHEET PREVIEW ============ */}
        <section className="bg-sand border-y border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-5">
              <p className="overline text-terracotta">A sneak peek</p>
              <h2 className="font-display text-4xl mt-2 leading-tight">What three pages look like.</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">Every worksheet ships with a long passage, a vocabulary glossary, four to five graded sections, a writing task with success criteria, an answer key with explanations, and a teacher\u2019s extension activity.</p>
              <ul className="mt-6 space-y-2 text-sm">
                <li className="flex gap-2"><span className="text-terracotta">●</span> Pre-reading vocabulary preview</li>
                <li className="flex gap-2"><span className="text-terracotta">●</span> Long, level-appropriate passage</li>
                <li className="flex gap-2"><span className="text-terracotta">●</span> Mixed comprehension (MCQ + T/F/NG + short answer)</li>
                <li className="flex gap-2"><span className="text-terracotta">●</span> Vocabulary in context, with Vietnamese translations</li>
                <li className="flex gap-2"><span className="text-terracotta">●</span> Writing task with success criteria</li>
                <li className="flex gap-2"><span className="text-terracotta">●</span> Full answer key + teacher notes + extension</li>
              </ul>
              <Link to="/levels" className="mt-8 btn-secondary inline-flex" data-testid="see-levels">See all levels & topics →</Link>
            </div>
            <div className="md:col-span-7">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((p) => (
                  <div key={p} className={`aspect-[3/4] bg-white border border-border shadow-sm p-3 text-[8px] leading-tight overflow-hidden transition-transform duration-300 hover:-translate-y-2 ${p === 1 ? 'hover:rotate-[-1deg]' : p === 3 ? 'hover:rotate-[1deg]' : ''}`}>
                    <div className="border-b border-ink pb-1 mb-1.5">
                      <div className="font-mono text-terracotta">SmartGiaoAn</div>
                      <div className="font-display text-[11px]">{p === 1 ? 'Tet at Grandma\u2019s House' : p === 2 ? 'Comprehension & Vocabulary' : 'Writing & Answer Key'}</div>
                    </div>
                    <div className="space-y-1.5">
                      {p === 1 && (<>
                        <div className="text-[7px] uppercase tracking-widest">Key Vocabulary</div>
                        {[1,2,3,4,5].map((i) => <div key={i} className="h-1 bg-ink/20" />)}
                        <div className="mt-2 text-[7px] uppercase tracking-widest">Reading Passage</div>
                        {[1,2,3,4,5,6,7,8].map((i) => <div key={i} className="h-1 bg-ink/15" />)}
                      </>)}
                      {p === 2 && (<>
                        <div className="text-[7px] uppercase tracking-widest">Section 2</div>
                        {[1,2,3,4,5,6].map((i) => <div key={i} className="h-1 bg-ink/15" />)}
                        <div className="mt-2 text-[7px] uppercase tracking-widest">Section 3</div>
                        {[1,2,3,4,5,6].map((i) => <div key={i} className="h-1 bg-ink/15" />)}
                      </>)}
                      {p === 3 && (<>
                        <div className="text-[7px] uppercase tracking-widest">Writing Task</div>
                        {[1,2,3,4].map((i) => <div key={i} className="h-1 bg-ink/15" />)}
                        <div className="mt-2 text-[7px] uppercase tracking-widest">Answer Key</div>
                        {[1,2,3,4,5,6].map((i) => <div key={i} className="h-1 bg-ink/15" />)}
                      </>)}
                    </div>
                    <div className="mt-2 text-[6px] text-muted-foreground border-t pt-1 flex justify-between"><span>Page {p}</span><span>SmartGiaoAn</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============ LEVELS STRIP ============ */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <p className="overline text-terracotta">Levels</p>
              <h2 className="font-display text-4xl mt-2 leading-tight">From Kindergarten to IELTS.</h2>
            </div>
            <Link to="/levels" className="text-sm text-terracotta hover:underline">See full catalog →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {LEVELS.map((l) => (
              <div key={l.key} className="bg-white border border-border p-5 hover:border-terracotta transition-colors">
                <div className="font-display text-2xl">{l.label}</div>
                <div className="overline text-muted-foreground mt-1">{l.age}</div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{l.blurb}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
            {SKILLS.map((s) => (
              <div key={s.key} className="border border-border bg-sand p-4">
                <div className="font-display text-lg">{s.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.blurb}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ FROM THE FOUNDER (the human bit) ============ */}
        <section className="border-y border-border bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-4">
              <p className="overline text-terracotta">From the founder</p>
              <h2 className="font-display text-4xl mt-2 leading-tight">Why this exists.</h2>
              <div className="mt-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-terracotta text-white flex items-center justify-center font-display text-2xl shadow-md">B</div>
                <div className="text-sm">
                  <div className="font-medium">Ben Taylor</div>
                  <div className="text-muted-foreground text-xs">Teacher · Hanoi → Saigon</div>
                </div>
              </div>
            </div>
            <div className="md:col-span-8 space-y-5 text-[17px] leading-relaxed text-ink/85">
              <p>I spent ten years writing materials and running ESL classrooms — first in the UK, then across Vietnam. The Sunday-night burnout of typing worksheets in Word is real. Every teacher I know has done it.</p>
              <p>Big resource sites lock the good stuff behind yearly contracts and 14-tab dashboards. Generic AI tools spit out bland fluff. Neither felt right for the teachers I was working alongside in Hanoi and Saigon. So I built the thing I wished existed: one input field, three printable pages, locally relevant, exam-aligned.</p>
              <p>SmartGiaoAn is small, focused, and genuinely useful. If it ever stops being any of those three things, please email me — <a href="mailto:hello@smartgiaoan.site" className="text-terracotta hover:underline">hello@smartgiaoan.site</a> — and tell me. I read every one.</p>
              <p className="font-display text-xl text-ink pt-2">— Ben</p>
            </div>
          </div>
        </section>

        {/* ============ ANTI-BLOAT METHODOLOGY ============ */}
        <section className="bg-sand border-b border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-4">
              <p className="overline text-terracotta">The anti-bloat alternative</p>
              <h2 className="font-display text-4xl mt-2 leading-tight">Why these worksheets work.</h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Big resource sites give you 14 tabs, endless filters and templates that feel imported. We give you one input field and three printable pages, locally relevant. Different philosophy entirely.
              </p>
            </div>
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { t: 'Cambridge-trained AI', b: 'The model is prompted as a senior Cambridge ESOL examiner with explicit CEFR descriptors. We don\u2019t hope for alignment — we mandate it.' },
                { t: 'Mixed task types', b: 'Multiple choice, True/False/Not Given, matching, fill-blank, short answer, sentence transformation, error correction. Real exams test breadth.' },
                { t: 'Vietnamese context', b: 'Names, cities, foods, holidays drawn from a curated bank: Tet, Sapa, banh mi, ao dai, lotus ponds, modern cafe culture. Students see themselves on the page.' },
                { t: 'Three-page minimum', b: 'A long passage, vocabulary glossary, four to five sections, a writing task and an answer key. Substantial enough to teach a full lesson.' },
              ].map((m, i) => (
                <div key={i} className="border-l-2 border-terracotta pl-4">
                  <div className="font-display text-xl">{m.t}</div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{m.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TESTIMONIALS ============ */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <p className="overline text-terracotta">From the staffroom</p>
          <h2 className="font-display text-4xl mt-2 leading-tight">Teachers who tried it.</h2>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((tt, i) => (
              <figure key={i} className={`bg-white border border-border p-7 ${i === 1 ? 'md:translate-y-3' : ''}`}>
                <blockquote className="font-display text-xl leading-snug">&ldquo;{tt.quote}&rdquo;</blockquote>
                <figcaption className="mt-5 pt-4 border-t border-border">
                  <div className="font-medium">{tt.name}</div>
                  <div className="text-xs text-muted-foreground">{tt.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-8 text-xs text-muted-foreground italic">First names &amp; neighbourhood used with permission. Some details lightly anonymised.</p>
        </section>

        {/* ============ AD slot ============ */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
          <AdSlot size="leaderboard" testId="landing-ad-leaderboard" />
        </section>

        {/* ============ PRICING ============ */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-10">
            <div className="md:col-span-6">
              <p className="overline text-terracotta">Pricing</p>
              <h2 className="font-display text-4xl lg:text-5xl mt-2">Three free. Five quid a month after.</h2>
            </div>
            <div className="md:col-span-6 text-muted-foreground leading-relaxed">
              Three worksheets to fall in love. £5 a month if you stay. Cancel any time in PayPal — no contract, no haggling. Earn extra free credits by watching short rewarded ads (15 / 30 / 45 seconds = 1 / 2 / 3 credits).
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-border p-8" data-testid="plan-free">
              <div className="overline text-muted-foreground">{t('free_title')}</div>
              <div className="mt-2 flex items-baseline gap-1"><span className="font-display text-5xl">{t('free_price')}</span></div>
              <p className="mt-3 text-sm text-muted-foreground">{t('free_desc')}</p>
              <ul className="mt-6 space-y-2 text-sm">
                <li>• 3 worksheets included</li>
                <li>• Earn more via 15/30/45s rewarded ads</li>
                <li>• Clean ad placements</li>
                <li>• PDF & Print included</li>
              </ul>
              <button onClick={user ? null : startLogin} className="mt-8 btn-secondary w-full" data-testid="plan-free-cta">{t('free_cta')}</button>
            </div>
            <div className="bg-ink text-white border border-ink p-8 relative" data-testid="plan-pro">
              <span className="absolute top-4 right-4 text-[10px] tracking-[0.2em] uppercase font-bold bg-terracotta px-2 py-1">Best</span>
              <div className="overline text-white/70">{t('pro_title')}</div>
              <div className="mt-2 flex items-baseline gap-1"><span className="font-display text-5xl">{t('pro_price')}</span><span className="text-white/70">{t('pro_per')}</span></div>
              <p className="mt-3 text-sm text-white/80">{t('pro_desc')}</p>
              <ul className="mt-6 space-y-2 text-sm text-white/90">
                <li>• Unlimited worksheets</li>
                <li>• Zero ads</li>
                <li>• Priority generation</li>
                <li>• PDF export with branding (coming soon)</li>
              </ul>
              <Link to="/dashboard#upgrade" className="mt-8 inline-flex items-center justify-center w-full bg-terracotta hover:bg-terracotta-hover text-white px-6 py-3 rounded-sm font-medium transition-all hover:-translate-y-[1px]" data-testid="plan-pro-cta">{t('pro_cta')}</Link>
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-20">
          <div className="bg-ink text-white p-12 lg:p-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8">
              <p className="overline text-terracotta">Tomorrow morning</p>
              <h2 className="font-display text-4xl lg:text-5xl mt-2 leading-tight">Stop typing worksheets at 11pm.</h2>
              <p className="mt-4 text-white/80 max-w-xl leading-relaxed">Three worksheets free. Sign in with Google in ten seconds. Print one before bed.</p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              {user ? (
                <Link to="/dashboard" className="bg-terracotta hover:bg-terracotta-hover text-white px-7 py-4 rounded-sm font-medium transition-all" data-testid="final-cta-dash">{t('dashboard')} →</Link>
              ) : (
                <button onClick={startLogin} className="bg-terracotta hover:bg-terracotta-hover text-white px-7 py-4 rounded-sm font-medium transition-all" data-testid="final-cta-google">{t('cta_get_started')}</button>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Stat({ top, bottom }) {
  return (
    <div>
      <div className="font-display text-3xl">{top}</div>
      <div className="overline text-muted-foreground">{bottom}</div>
    </div>
  );
}
function BigStat({ n, l, note }) {
  return (
    <div>
      <div className="font-display text-4xl text-terracotta leading-none">{n}</div>
      <div className="overline text-muted-foreground mt-2">{l}</div>
      {note && <div className="text-xs text-muted-foreground italic mt-1">{note}</div>}
    </div>
  );
}
