'use client';

import { useState, useRef } from 'react';
import { XMarkIcon, DocumentArrowUpIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/buttons';
import { DASHBOARD_ADD_DATA_URL } from '@/lib/constants';
import { useRouter } from 'next/navigation';

interface UploadDataModalProps {
  dashboardId: number;
  onClose: () => void;
}

interface AddDataButtonProps {
  dashboardId: number;
}

// Helper to get auth token from cookies
function getAuthToken(): string | null {
  const match = document.cookie.match(/(^| )auth-token=([^;]+)/);
  if (match) {
    // Replace double underscores with spaces (as stored in cookie)
    return match[2].replace(/__/g, ' ');
  }
  return null;
}

export function UploadDataModal({ dashboardId, onClose }: UploadDataModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [overrides, setOverrides] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please select at least one file.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    if (overrides.trim()) {
      try {
        // Validate JSON
        JSON.parse(overrides);
        formData.append('column_type_overrides', overrides);
      } catch (err) {
        setError('Invalid JSON for column type overrides');
        setUploading(false);
        return;
      }
    }

    // Get the auth token from cookies
    const token = getAuthToken();
    if (!token) {
      setError('You are not logged in. Please log in again.');
      setUploading(false);
      return;
    }

    try {
      const url = DASHBOARD_ADD_DATA_URL(dashboardId);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: token, // token already includes "Bearer "
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Upload failed');
      }

      // Success: refresh the page to show the new data
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-purple-600 to-violet-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <DocumentArrowUpIcon className="w-5 h-5" />
            Upload Data
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
            disabled={uploading}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Files (CSV or Excel)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              disabled={uploading}
            />
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-gray-500 hover:text-red-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column Type Overrides */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Column Type Overrides (JSON, optional)
            </label>
            <textarea
              rows={4}
              value={overrides}
              onChange={(e) => setOverrides(e.target.value)}
              placeholder='{"column_name": "INTEGER", "date_col": "DATE"}'
              className="w-full rounded-md border border-gray-300 p-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={uploading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Specify SQL types for specific columns (e.g., TEXT, INTEGER, FLOAT, DATE, TIMESTAMP).
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              disabled={uploading}
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={files.length === 0 || uploading}
              className="min-w-30"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4"/>
                  Uploading...
                </span>
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddDataButton({ dashboardId }: AddDataButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gray-100 rounded-md text-sm font-medium hover:bg-gray-200"
      >
        Add Data
      </button>
      {isOpen && (
        <UploadDataModal
          dashboardId={dashboardId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
