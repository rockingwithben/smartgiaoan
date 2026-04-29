import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export function PageShell({ eyebrow, title, intro, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-border bg-white">
          <div className="max-w-5xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
            {eyebrow && <p className="overline text-terracotta">{eyebrow}</p>}
            <h1 className="font-display text-5xl lg:text-6xl mt-3 leading-[1.05] tracking-tight">{title}</h1>
            {intro && <p className="mt-5 text-lg text-muted-foreground max-w-2xl leading-relaxed">{intro}</p>}
          </div>
        </section>
        <section className="max-w-5xl mx-auto px-6 lg:px-10 py-14 lg:py-20">
          {children}
        </section>
      </main>
      <Footer />
    </div>
  );
}
