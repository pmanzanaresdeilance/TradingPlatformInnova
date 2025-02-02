import React, { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { importMT5Report } from '@/services/mt5Import';

interface ImportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
}

export function ImportHistoryModal({ isOpen, onClose, onImport }: ImportHistoryModalProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      if (files[0].type === 'text/html' || files[0].name.endsWith('.html')) {
        setFile(files[0]);
        setError(null);
      } else {
        setError('Please upload an HTML report file from MetaTrader 5');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      if (files[0].type === 'text/html' || files[0].name.endsWith('.html')) {
        setFile(files[0]);
        setError(null);
      } else {
        setError('Please upload an HTML report file from MetaTrader 5');
      }
    }
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setImporting(true);
    setError(null);
    
    try {
      const content = await file.text();
      await importMT5Report(user.id, content);
      setSuccess(true);
      onImport();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to import trades:', err);
      setError('Failed to import trades. Please check the file format and try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-trading-accent/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-trading-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Import Trading History</h2>
            <p className="text-gray-400">Upload your MT5 HTML report</p>
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 ${
            dragActive
              ? 'border-trading-accent bg-trading-accent/10'
              : 'border-gray-700 hover:border-trading-accent/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".html"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            {file ? (
              <>
                <FileText className="w-12 h-12 text-trading-accent mb-4" />
                <p className="text-trading-accent font-medium mb-1">{file.name}</p>
                <p className="text-sm text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-300 mb-2">
                  Drag and drop your MT5 HTML report here
                </p>
                <p className="text-sm text-gray-400">
                  or click to select file
                </p>
              </>
            )}
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-trading-danger mb-4">
            <XCircle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-trading-success mb-4">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-sm">Trading history imported successfully!</p>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg mb-6">
          <AlertTriangle className="w-5 h-5 text-trading-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-trading-warning font-medium mb-1">How to Export MT5 Report</p>
            <ol className="text-gray-400 list-decimal pl-4 space-y-1">
              <li>Open MetaTrader 5</li>
              <li>Go to Account History in the Terminal window</li>
              <li>Right-click and select "Save Detailed Report"</li>
              <li>Choose HTML format and save the file</li>
              <li>Upload the saved HTML file here</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-6 py-2.5 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Importing...
              </>
            ) : (
              'Import History'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}