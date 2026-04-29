import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { LangToggle } from './LangToggle';

export function Footer() {
  const { lang } = useI18n();
  const labels = lang === 'vi'
    ? { product: 'Sản phẩm', features: 'Tính năng', pricing: 'Giá', dashboard: 'Bảng điều khiển',
        company: 'Công ty', about: 'Giới thiệu', contact: 'Liên hệ', faq: 'Câu hỏi thường gặp',
        legal: 'Pháp lý', privacy: 'Quyền riêng tư', terms: 'Điều khoản',
        rights: 'Mọi quyền được bảo lưu.' }
    : { product: 'Product', features: 'Features', pricing: 'Pricing', dashboard: 'Dashboard',
        company: 'Company', about: 'About', contact: 'Contact', faq: 'FAQ',
        legal: 'Legal', privacy: 'Privacy', terms: 'Terms',
        rights: 'All rights reserved.' };

  return (
    <footer className="border-t border-border bg-white" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="font-display text-2xl">SmartGiao<span className="text-terracotta">An</span></div>
          <p className="text-sm text-muted-foreground mt-3 max-w-xs">
            {lang === 'vi'
              ? 'Bài tập ESL chuẩn Cambridge, dành riêng cho giáo viên Việt Nam.'
              : 'Cambridge-aligned ESL worksheets, made for Vietnamese teachers.'}
          </p>
          <div className="mt-5"><LangToggle /></div>
        </div>
        <div>
          <p className="overline mb-4">{labels.product}</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/#how" className="hover:text-terracotta">{labels.features}</Link></li>
            <li><Link to="/pricing" className="hover:text-terracotta">{labels.pricing}</Link></li>
            <li><Link to="/dashboard" className="hover:text-terracotta">{labels.dashboard}</Link></li>
          </ul>
        </div>
        <div>
          <p className="overline mb-4">{labels.company}</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-terracotta">{labels.about}</Link></li>
            <li><Link to="/contact" className="hover:text-terracotta">{labels.contact}</Link></li>
            <li><Link to="/faq" className="hover:text-terracotta">{labels.faq}</Link></li>
          </ul>
        </div>
        <div>
          <p className="overline mb-4">{labels.legal}</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/privacy" className="hover:text-terracotta">{labels.privacy}</Link></li>
            <li><Link to="/terms" className="hover:text-terracotta">{labels.terms}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} SmartGiaoAn — {labels.rights}</span>
          <span className="font-mono tracking-widest">VN · ESL · CAMBRIDGE</span>
        </div>
      </div>
    </footer>
  );
}
