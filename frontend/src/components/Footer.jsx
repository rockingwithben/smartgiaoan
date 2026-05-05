import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="max-w-xs">
            <div className="font-serif font-black text-xl text-gray-900 mb-2">
              Smart<span className="text-red-600">GiaoAn</span>
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">{t('tagline')}</p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm font-bold text-gray-500">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Product</p>
              <Link to="/dashboard" className="block hover:text-black transition-colors">{t('dashboard')}</Link>
              <Link to="/library" className="block hover:text-black transition-colors">Library</Link>
              <Link to="/levels" className="block hover:text-black transition-colors">Levels</Link>
              <Link to="/pricing" className="block hover:text-black transition-colors">Pricing</Link>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Company</p>
              <Link to="/about" className="block hover:text-black transition-colors">About</Link>
              <Link to="/contact" className="block hover:text-black transition-colors">Contact</Link>
              <Link to="/faq" className="block hover:text-black transition-colors">FAQ</Link>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Legal</p>
              <Link to="/privacy" className="block hover:text-black transition-colors">Privacy</Link>
              <Link to="/terms" className="block hover:text-black transition-colors">Terms</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-400 font-medium">
          <p>© {new Date().getFullYear()} SmartGiaoAn. All rights reserved.</p>
          <p>Made with love for teachers in Vietnam 🇻🇳</p>
        </div>
      </div>
    </footer>
  );
}
