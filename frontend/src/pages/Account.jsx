import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useI18n } from '../lib/i18n';
import { PageShell } from '../components/PageShell';
import { useAuth } from '../lib/auth';
import { exportAccount, deleteAccount } from '../lib/api';

export default function Account() {
  const { lang, t } = useI18n();
  const { user, logout, startLogin } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) {
    return (
      <PageShell eyebrow="Account" title={lang === 'vi' ? 'Đăng nhập để xem tài khoản' : 'Sign in to see your account'} intro={lang === 'vi' ? 'Đăng nhập Google để truy cập thông tin tài khoản.' : 'Sign in with Google to view your account details.'}>
        <button onClick={startLogin} className="btn-primary" data-testid="account-signin">{t('cta_get_started')}</button>
      </PageShell>
    );
  }

  const onExport = async () => {
    try {
      setExporting(true);
      const data = await exportAccount();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartgiaoan_account_${user.user_id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(lang === 'vi' ? 'Đã tải xuống dữ liệu' : 'Your data has been downloaded');
    } catch {
      toast.error(lang === 'vi' ? 'Không thể xuất dữ liệu' : 'Could not export data');
    } finally {
      setExporting(false);
    }
  };

  const onDelete = async () => {
    try {
      setDeleting(true);
      await deleteAccount();
      toast.success(lang === 'vi' ? 'Tài khoản đã bị xoá' : 'Account deleted');
      setTimeout(() => { window.location.href = '/'; }, 800);
    } catch {
      toast.error(lang === 'vi' ? 'Không thể xoá tài khoản' : 'Could not delete account');
      setDeleting(false);
    }
  };

  const remaining = user.is_premium ? '∞' : Math.max(0, 3 + (user.bonus_credits || 0) - (user.free_used || 0));

  return (
    <PageShell eyebrow="Account" title={lang === 'vi' ? 'Tài khoản của bạn' : 'Your account'} intro={lang === 'vi' ? 'Quản lý gói, dữ liệu và phiên đăng nhập.' : 'Manage your plan, data and sessions.'}>
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

        {/* Data & Privacy */}
        <div className="md:col-span-12 bg-white border border-border p-7">
          <p className="overline text-terracotta">{lang === 'vi' ? 'Dữ liệu & Quyền riêng tư' : 'Data & Privacy'}</p>
          <h3 className="font-display text-2xl mt-2">{lang === 'vi' ? 'Bạn quản lý dữ liệu của mình.' : 'You\u2019re in charge of your data.'}</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{lang === 'vi' ? 'Tải xuống tất cả dữ liệu bạn đã tạo, hoặc xoá tài khoản vĩnh viễn. Việc xoá sẽ xoá toàn bộ bài tập, lịch sử và phiên đăng nhập.' : 'Download everything you\u2019ve created, or permanently delete your account. Deletion removes all your worksheets, history and sessions.'}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={onExport} disabled={exporting} className="btn-secondary text-sm !py-2" data-testid="account-export">
              {exporting ? '…' : (lang === 'vi' ? 'Tải dữ liệu (JSON)' : 'Export my data (JSON)')}
            </button>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="text-sm text-destructive hover:underline" data-testid="account-delete-init">
                {lang === 'vi' ? 'Xoá tài khoản…' : 'Delete my account…'}
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-sm border border-destructive/40 px-3 py-2 bg-destructive/10">
                <span>{lang === 'vi' ? 'Bạn chắc chắn? Không thể khôi phục.' : 'Sure? This cannot be undone.'}</span>
                <button onClick={onDelete} disabled={deleting} className="bg-destructive text-destructive-foreground px-3 py-1 rounded-sm text-xs font-medium" data-testid="account-delete-confirm">
                  {deleting ? '…' : (lang === 'vi' ? 'Xoá vĩnh viễn' : 'Delete permanently')}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs underline" data-testid="account-delete-cancel">
                  {lang === 'vi' ? 'Huỷ' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
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
