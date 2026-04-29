import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { Navbar } from '../components/Navbar';
import { AdSlot } from '../components/AdSlot';

export default function Landing() {
  const { t, lang } = useI18n();
  const { user, startLogin } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* HERO - Tetris grid */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-end">
            <div className="md:col-span-7 md:col-start-1">
              <p className="overline text-terracotta mb-6">{t('landing_eyebrow')}</p>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[1.02]" data-testid="hero-title">
                {t('hero_title')}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">{t('hero_sub')}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {user ? (
                  <Link to="/dashboard" className="btn-primary" data-testid="cta-dashboard">
                    {t('dashboard')} →
                  </Link>
                ) : (
                  <button onClick={startLogin} className="btn-primary" data-testid="cta-google">
                    {t('cta_get_started')}
                  </button>
                )}
                <a href="#how" className="btn-secondary" data-testid="cta-how">{t('cta_learn_more')}</a>
              </div>
              <div className="mt-10 flex items-baseline gap-6 text-sm">
                <div>
                  <div className="font-display text-3xl">A1 → C2</div>
                  <div className="overline text-muted-foreground">CEFR</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <div className="font-display text-3xl">{lang === 'vi' ? '~10s' : '~10s'}</div>
                  <div className="overline text-muted-foreground">{lang === 'vi' ? 'mỗi bài' : 'per worksheet'}</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <div className="font-display text-3xl">£5</div>
                  <div className="overline text-muted-foreground">{lang === 'vi' ? 'không giới hạn' : 'unlimited'}</div>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 md:col-start-8 relative">
              <div className="relative aspect-[4/5] overflow-hidden border border-border bg-white">
                <img
                  src="https://images.pexels.com/photos/5212703/pexels-photo-5212703.jpeg"
                  alt="Vietnamese ESL classroom"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white px-6 py-5">
                  <p className="overline">In classrooms · Hanoi → Saigon</p>
                  <p className="font-display text-xl mt-1">From Tet stories to IELTS reading</p>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 hidden md:block bg-white border border-border px-4 py-3 shadow-md">
                <div className="overline text-terracotta">Cambridge-aligned</div>
                <div className="font-mono text-sm">A1 · A2 · B1 · B2 · C1 · C2</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="how" className="border-y border-border bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: t('feat1_title'), body: t('feat1_body'), num: '01' },
              { title: t('feat2_title'), body: t('feat2_body'), num: '02' },
              { title: t('feat3_title'), body: t('feat3_body'), num: '03' },
            ].map((f) => (
              <div key={f.num} className="border-l-2 border-terracotta pl-5">
                <div className="overline text-muted-foreground">{f.num}</div>
                <h3 className="font-display text-2xl mt-1">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Inline ad placeholder */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
          <AdSlot size="leaderboard" testId="landing-ad-leaderboard" />
        </section>

        {/* Pricing */}
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-10">
            <div className="md:col-span-6">
              <p className="overline text-terracotta">Pricing</p>
              <h2 className="font-display text-4xl lg:text-5xl mt-2">{t('pricing_title')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-border p-8" data-testid="plan-free">
              <div className="overline text-muted-foreground">{t('free_title')}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-5xl">{t('free_price')}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{t('free_desc')}</p>
              <ul className="mt-6 space-y-2 text-sm">
                <li>• 3 worksheets included</li>
                <li>• Earn more via 15/30/45s rewarded ads</li>
                <li>• Clean ad placements</li>
              </ul>
              <button onClick={user ? null : startLogin} className="mt-8 btn-secondary w-full" data-testid="plan-free-cta">
                {t('free_cta')}
              </button>
            </div>
            <div className="bg-ink text-white border border-ink p-8 relative" data-testid="plan-pro">
              <span className="absolute top-4 right-4 text-[10px] tracking-[0.2em] uppercase font-bold bg-terracotta px-2 py-1">Best</span>
              <div className="overline text-white/70">{t('pro_title')}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-5xl">{t('pro_price')}</span>
                <span className="text-white/70">{t('pro_per')}</span>
              </div>
              <p className="mt-3 text-sm text-white/80">{t('pro_desc')}</p>
              <ul className="mt-6 space-y-2 text-sm text-white/90">
                <li>• Unlimited worksheets</li>
                <li>• Zero ads</li>
                <li>• Priority generation</li>
                <li>• PDF export with branding</li>
              </ul>
              <Link to="/dashboard#upgrade" className="mt-8 inline-flex items-center justify-center w-full bg-terracotta hover:bg-terracotta-hover text-white px-6 py-3 rounded-sm font-medium transition-all hover:-translate-y-[1px]" data-testid="plan-pro-cta">
                {t('pro_cta')}
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm text-muted-foreground">
            <div className="font-display text-lg">SmartGiao<span className="text-terracotta">An</span></div>
            <div>© {new Date().getFullYear()} · Made for Vietnam ESL teachers</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
