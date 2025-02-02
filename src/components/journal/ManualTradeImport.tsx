import React, { useState } from 'react';
import { Upload, AlertTriangle, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface ManualTradeImportProps {
  onImport: (file: File) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export function ManualTradeImport({ onImport, isOpen, onClose }: ManualTradeImportProps) {
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      if (files[0].type === 'text/csv' || files[0].name.endsWith('.csv')) {
        setFile(files[0]);
        setError(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      if (files[0].type === 'text/csv' || files[0].name.endsWith('.csv')) {
        setFile(files[0]);
        setError(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    try {
      await onImport(file);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to import trades. Please check the file format and try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-4 md:p-8 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-trading-accent/10 flex items-center justify-center">
            <Upload className="w-5 h-5 md:w-6 md:h-6 text-trading-accent" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Import Trades</h2>
            <p className="text-sm md:text-base text-gray-400">Upload your trading history from a CSV file</p>
          </div>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-6 md:p-8 text-center mb-4 md:mb-6 ${
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
            accept=".csv"
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
                <FileText className="w-10 h-10 md:w-12 md:h-12 text-trading-accent mb-3 md:mb-4" />
                <p className="text-trading-accent font-medium mb-1">{file.name}</p>
                <p className="text-xs md:text-sm text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-gray-300 mb-2">
                  Drag and drop your CSV file here
                </p>
                <p className="text-xs md:text-sm text-gray-400">
                  or click to select file
                </p>
              </>
            )}
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-trading-danger mb-4">
            <XCircle className="w-4 h-4 md:w-5 md:h-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-trading-success mb-4">
            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
            <p className="text-sm">Trades imported successfully!</p>
          </div>
        )}

        <div className="flex items-start gap-3 p-3 md:p-4 bg-gray-700/50 rounded-lg mb-4 md:mb-6">
          <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-trading-warning shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm">
            <p className="text-trading-warning font-medium mb-1">CSV Format Requirements</p>
            <p className="text-gray-400">
              The CSV file should include the following columns: Date, Symbol, Type, Volume, Entry, Exit, SL, TP, Profit/Loss
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 md:gap-4">
          <button
            onClick={onClose}
            className="px-4 md:px-6 py-2 md:py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm md:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-4 md:px-6 py-2 md:py-2.5 bg-trading-accent text-gray-900 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                Importing...
              </>
            ) : (
              'Import Trades'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}