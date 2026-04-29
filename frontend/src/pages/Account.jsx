import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';
import { useAuth } from '../lib/auth';

export default function Account() {
  const { lang, t } = useI18n();
  const { user, logout, startLogin } = useAuth();
  if (!user) {
    return (
      <PageShell eyebrow="Account" title={lang === 'vi' ? 'Đăng nhập để xem tài khoản' : 'Sign in to see your account'} intro={lang === 'vi' ? 'Đăng nhập Google để truy cập thông tin tài khoản.' : 'Sign in with Google to view your account details.'}>
        <button onClick={startLogin} className="btn-primary" data-testid="account-signin">{t('cta_get_started')}</button>
      </PageShell>
    );
  }
  const remaining = user.is_premium ? '∞' : Math.max(0, 3 + (user.bonus_credits || 0) - (user.free_used || 0));
  return (
    <PageShell eyebrow="Account" title={lang === 'vi' ? 'Tài khoản của bạn' : 'Your account'} intro={lang === 'vi' ? 'Quản lý gói, ngôn ngữ và phiên đăng nhập.' : 'Manage your plan, language and sessions.'}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6" data-testid="account-page">
        <div className="md:col-span-5 bg-white border border-border p-7">
          <p className="overline text-terracotta">{lang === 'vi' ? 'Hồ sơ' : 'Profile'}</p>
          <div className="mt-4 flex items-center gap-4">
            {user.picture && <img src={user.picture} alt="" className="w-14 h-14 rounded-full border border-border" />}
            <div>
              <div className="font-display text-2xl">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <button onClick={logout} className="mt-6 btn-secondary text-sm !py-2" data-testid="account-logout">{t('sign_out')}</button>
        </div>
        <div className="md:col-span-7 bg-white border border-border p-7">
          <p className="overline text-terracotta">{lang === 'vi' ? 'Gói' : 'Plan'}</p>
          <div className="mt-3 flex items-baseline gap-4">
            <div className="font-display text-4xl">{user.is_premium ? 'Premium' : (lang === 'vi' ? 'Miễn phí' : 'Free')}</div>
            {user.is_premium && <span className="overline text-terracotta border border-terracotta px-2 py-0.5">£5/mo</span>}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
            <Stat label={lang === 'vi' ? 'Đã dùng' : 'Used'} value={user.free_used ?? 0} />
            <Stat label={lang === 'vi' ? 'Bonus' : 'Bonus'} value={user.bonus_credits ?? 0} />
            <Stat label={lang === 'vi' ? 'Còn lại' : 'Remaining'} value={remaining} />
          </div>
          {!user.is_premium && (
            <Link to="/dashboard#upgrade" className="mt-6 btn-primary inline-block text-sm" data-testid="account-upgrade">{t('paywall_upgrade')} →</Link>
          )}
        </div>
      </div>
    </PageShell>
  );
}
function Stat({ label, value }) {
  return (
    <div className="border-l-2 border-terracotta pl-3">
      <div className="font-display text-3xl">{value}</div>
      <div className="overline text-muted-foreground">{label}</div>
    </div>
  );
}
