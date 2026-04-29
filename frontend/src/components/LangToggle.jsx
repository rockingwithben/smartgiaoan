import React from 'react';
import { useI18n } from '../lib/i18n';

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-2 text-xs font-mono" data-testid="lang-toggle">
      <button
        onClick={() => setLang('en')}
        className={`tracking-widest ${lang === 'en' ? 'text-ink font-bold' : 'text-muted-foreground hover:text-ink'}`}
        data-testid="lang-toggle-en"
      >EN</button>
      <span className="text-muted-foreground">/</span>
      <button
        onClick={() => setLang('vi')}
        className={`tracking-widest ${lang === 'vi' ? 'text-ink font-bold' : 'text-muted-foreground hover:text-ink'}`}
        data-testid="lang-toggle-vi"
      >VI</button>
    </div>
  );
}
