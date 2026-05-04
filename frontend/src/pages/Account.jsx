import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { exportAccount, deleteAccount } from '../lib/api';
import { toast } from 'sonner';

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportAccount();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartgiaoan-export-${user.user_id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (e) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      await logout();
      toast.success('Account deleted');
      navigate('/');
    } catch (e) {
      toast.error('Delete failed');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Data & Privacy</h1>
      <p className="text-gray-500 mb-8">
        You're in charge of your data. Download everything you've created, or permanently delete your account.
      </p>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Export Data</h3>
        <p className="text-sm text-gray-500 mb-4">
          Download a JSON file with all your worksheets and profile data.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
        >
          <Download size={18} />
          {exporting ? 'Exporting...' : 'Download My Data'}
        </button>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
          <AlertTriangle size={18} /> Danger Zone
        </h3>
        <p className="text-sm text-red-700 mb-4">
          Deletion removes all your worksheets, history and sessions. This cannot be undone.
        </p>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Trash2 size={18} /> Delete Account
          </button>
        ) : (
          <div>
            <p className="text-sm font-medium text-red-900 mb-3">
              Are you sure? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
