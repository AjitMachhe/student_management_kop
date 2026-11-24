import React, { useEffect, useState } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  FileSpreadsheet,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ENTITY_SCHEMAS,
  parseCsvFile,
  autoMapColumns,
  validateMappedRows,
  commitValidCsvRows,
  getRecentImportLogs,
} from '../services/csvService';
import { exportToCsv } from '../utils/csvHelper';
import { useAuth } from '../context/AuthContext';

export default function CsvImport() {
  const { user } = useAuth();
  const [entityType, setEntityType] = useState('schools');
  const [fileName, setFileName] = useState('');
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [validatedRows, setValidatedRows] = useState([]);
  const [step, setStep] = useState(1); // 1: Upload, 2: Map Columns, 3: Preview & Import
  const [processing, setProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [logs, setLogs] = useState([]);

  const fetchLogs = () => {
    getRecentImportLogs().then(setLogs).catch(console.error);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDownloadSampleTemplate = () => {
    const schema = ENTITY_SCHEMAS[entityType];
    const sampleObj = {};
    schema.fields.forEach((f) => {
      sampleObj[f.key] = '';
    });
    exportToCsv(`sample_${entityType}_template.csv`, [sampleObj]);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFileName(file.name);
      const { headers, rows } = await parseCsvFile(file);
      if (rows.length === 0) {
        toast.error('The uploaded CSV file contains no data rows.');
        return;
      }
      setCsvHeaders(headers);
      setRawRows(rows);
      setMapping(autoMapColumns(entityType, headers));
      setImportSummary(null);
      setStep(2);
      toast.success(`Loaded ${rows.length} rows from ${file.name}`);
    } catch (err) {
      toast.error('Failed to parse CSV file. Ensure valid UTF-8 CSV format.');
    }
  };

  const handleValidatePreview = async () => {
    const requiredMissing = ENTITY_SCHEMAS[entityType].fields.filter(
      (f) => f.required && !mapping[f.key]
    );
    if (requiredMissing.length > 0) {
      toast.error(
        `Please map required columns: ${requiredMissing.map((f) => f.label).join(', ')}`
      );
      return;
    }

    setProcessing(true);
    try {
      const results = await validateMappedRows(entityType, rawRows, mapping);
      setValidatedRows(results);
      setStep(3);
    } catch (err) {
      toast.error(err.message || 'Validation failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCommitImport = async () => {
    const validCount = validatedRows.filter((r) => r.isValid).length;
    if (validCount === 0) {
      toast.error('No valid rows available to import.');
      return;
    }

    setProcessing(true);
    try {
      const summary = await commitValidCsvRows(
        entityType,
        fileName,
        validatedRows,
        user?.id
      );
      setImportSummary(summary);
      toast.success(`Successfully imported ${summary.importedCount} records!`);
      fetchLogs();
    } catch (err) {
      toast.error(err.message || 'Database import failed.');
    } finally {
      setProcessing(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setFileName('');
    setCsvHeaders([]);
    setRawRows([]);
    setValidatedRows([]);
    setImportSummary(null);
  };

  const validRowsCount = validatedRows.filter((r) => r.isValid).length;
  const invalidRowsCount = validatedRows.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bulk CSV Import Wizard</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Upload CSV spreadsheets, map columns, detect duplicates, and import verified records
          </p>
        </div>

        <button onClick={handleDownloadSampleTemplate} className="btn-secondary">
          <Download className="h-4 w-4" />
          Download {ENTITY_SCHEMAS[entityType].label} CSV Template
        </button>
      </div>

      {/* Step Indicator */}
      <div className="card-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {[
              { num: 1, title: '1. Select Target & Upload CSV' },
              { num: 2, title: '2. Map CSV Columns' },
              { num: 3, title: '3. Preview, Validate & Import' },
            ].map((s) => (
              <span
                key={s.num}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold ${
                  step === s.num
                    ? 'bg-blue-600 text-white'
                    : step > s.num
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {s.title}
              </span>
            ))}
          </div>

          {step > 1 && (
            <button onClick={resetWizard} className="btn-secondary py-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              Start Over
            </button>
          )}
        </div>
      </div>

      {/* STEP 1: Target & File Upload */}
      {step === 1 && (
        <div className="card-panel space-y-6 p-6">
          <div>
            <label className="label-text">Select Destination Module</label>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Object.entries(ENTITY_SCHEMAS).map(([key, schema]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEntityType(key)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    entityType === key
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <FileSpreadsheet
                    className={`h-6 w-6 ${
                      entityType === key ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <p className="font-bold text-slate-900">{schema.label}</p>
                    <p className="text-xs text-slate-500">
                      {schema.fields.length} mappable columns
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/30 px-6 py-12 text-center transition-colors hover:border-blue-500 hover:bg-blue-50/60">
            <Upload className="h-10 w-10 text-blue-600" />
            <p className="mt-3 text-base font-semibold text-slate-900">
              Click to upload {ENTITY_SCHEMAS[entityType].label} CSV file
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Supports standard UTF-8 .csv files with header row
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* STEP 2: Auto + Manual Column Mapper */}
      {step === 2 && (
        <div className="card-panel space-y-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Map CSV Columns to {ENTITY_SCHEMAS[entityType].label} Fields
              </h2>
              <p className="text-xs text-slate-500">
                File: <span className="font-semibold">{fileName}</span> ({rawRows.length} rows detected)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ENTITY_SCHEMAS[entityType].fields.map((field) => (
              <div key={field.key} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <label className="label-text">
                  {field.label} {field.required && <span className="text-red-600">*</span>}
                </label>
                <select
                  value={mapping[field.key] || ''}
                  onChange={(e) =>
                    setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className="input-field mt-1"
                >
                  <option value="">-- Ignore / Not Mapped --</option>
                  {csvHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button onClick={resetWizard} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleValidatePreview}
              disabled={processing}
              className="btn-primary"
            >
              {processing ? 'Validating Rows...' : 'Validate & Preview Data'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Validation Preview & Commit */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card-panel p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Total Rows Parsed</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{validatedRows.length}</p>
            </div>
            <div className="card-panel border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-700">Valid Ready Rows</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{validRowsCount}</p>
            </div>
            <div className="card-panel border-red-200 bg-red-50/50 p-4">
              <p className="text-xs font-semibold uppercase text-red-700">Invalid / Duplicate Rows</p>
              <p className="mt-1 text-2xl font-bold text-red-700">{invalidRowsCount}</p>
            </div>
          </div>

          {importSummary ? (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <h3 className="mt-2 text-lg font-bold text-emerald-900">Import Completed</h3>
              <p className="mt-1 text-sm text-emerald-800">
                Imported <span className="font-bold">{importSummary.importedCount}</span> valid records.{' '}
                <span className="font-bold">{importSummary.rejectedCount}</span> invalid/duplicate rows were skipped.
              </p>
              <button onClick={resetWizard} className="btn-primary mt-4">
                Import Another File
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
              <p className="text-sm font-medium text-blue-900">
                Only valid rows ({validRowsCount}) will be inserted into PostgreSQL. Invalid rows are automatically skipped.
              </p>
              <button
                onClick={handleCommitImport}
                disabled={processing || validRowsCount === 0}
                className="btn-primary"
              >
                {processing ? 'Importing...' : `Import ${validRowsCount} Valid Records`}
              </button>
            </div>
          )}

          {/* Row-by-Row Highlight Table */}
          <div className="card-panel overflow-hidden">
            <div className="max-h-96 overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 font-semibold uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5">CSV Row</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Record Summary</th>
                    <th className="px-4 py-2.5">Validation Messages</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validatedRows.map((r) => (
                    <tr
                      key={r.rowNumber}
                      className={r.isValid ? 'bg-white' : 'bg-red-50/70'}
                    >
                      <td className="px-4 py-2.5 font-mono font-semibold text-slate-600">
                        #{r.rowNumber}
                      </td>
                      <td className="px-4 py-2.5">
                        {r.isValid ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 font-semibold text-red-800">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">
                        {r.payload.school_name || r.payload.student_name || '-'}
                      </td>
                      <td className="px-4 py-2.5 text-red-700">
                        {r.errors.length > 0 ? r.errors.join(' • ') : 'Ready to import'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent Import Audit Logs */}
      {logs.length > 0 && (
        <div className="card-panel overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h3 className="text-sm font-bold text-slate-900">Recent CSV Import History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Module</th>
                  <th className="px-4 py-2.5">File Name</th>
                  <th className="px-4 py-2.5 text-right">Imported</th>
                  <th className="px-4 py-2.5 text-right">Rejected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2.5 text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-semibold capitalize text-blue-700">
                      {log.entity_type}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{log.file_name}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">
                      {log.imported_rows}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-red-600">
                      {log.rejected_rows}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}