import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useI18n } from '../lib/i18n';

export default function NotFound() {
  const { lang } = useI18n();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-xl">
          <p className="overline text-terracotta">404</p>
          <h1 className="font-display text-6xl mt-4 leading-none">{lang === 'vi' ? 'Trang không tồn tại.' : 'This page is missing.'}</h1>
          <p className="mt-4 text-muted-foreground">{lang === 'vi' ? 'Có lẽ bạn đang tìm bảng điều khiển hoặc trang chủ.' : 'You\u2019re probably looking for the dashboard or the home page.'}</p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link to="/" className="btn-secondary" data-testid="404-home">Home</Link>
            <Link to="/dashboard" className="btn-primary" data-testid="404-dashboard">Dashboard</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
