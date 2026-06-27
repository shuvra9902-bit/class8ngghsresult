/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileSpreadsheet, Download, RefreshCw, Eye, ExternalLink } from 'lucide-react';
import { ProcessedStudent } from '../types';

interface ResultsTabProps {
  results: ProcessedStudent[];
  filterShift: string;
  setFilterShift: (shift: string) => void;
  processMode: string;
  setProcessMode: (mode: string) => void;
  processResults: () => void;
  setSelectedStudent: (student: ProcessedStudent) => void;
  setShowMarksheetModal: (show: boolean) => void;
  downloadBulkMarksheets: () => void;
  downloading: boolean;
  onDownloadSingle: (student: ProcessedStudent, theme?: 'color' | 'bw') => void;
  onDownloadTabulation: () => void;
  generalPrintTheme: 'color' | 'bw';
  setGeneralPrintTheme: (theme: 'color' | 'bw') => void;
}

export default function ResultsTab({
  results,
  filterShift,
  setFilterShift,
  processMode,
  setProcessMode,
  processResults,
  setSelectedStudent,
  setShowMarksheetModal,
  downloadBulkMarksheets,
  downloading,
  onDownloadSingle,
  onDownloadTabulation,
  generalPrintTheme,
  setGeneralPrintTheme,
}: ResultsTabProps) {
  
  const handleDownloadStandalone = () => {
    const link = document.createElement('a');
    link.href = '/marksheet_system.html';
    link.download = 'marksheet_system.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Apply visual shift filtering on the processed results
  const filteredResults = filterShift === 'All' 
    ? results 
    : results.filter(r => r.shift === filterShift);

  const getFinalGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'A': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'A-': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      case 'B': return 'bg-amber-100/60 text-amber-800 border border-amber-200';
      case 'C': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'D': return 'bg-slate-50 text-slate-750 border border-slate-200';
      default: return 'bg-red-50 text-red-750 border border-red-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top filter and actions block */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Processing Scope
            </label>
            <select
              value={processMode}
              onChange={(e) => {
                setProcessMode(e.target.value);
                if (e.target.value === 'class') {
                  setFilterShift('All');
                } else if (filterShift === 'All') {
                  setFilterShift('Day');
                }
              }}
              className="px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold text-slate-700"
            >
              <option value="shift">Shift Wise (Day / Morning Separated)</option>
              <option value="class">Class Wise (All Students Combined)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Active Shift Filter
            </label>
            <select
              value={filterShift}
              disabled={processMode === 'class'}
              onChange={(e) => setFilterShift(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="All">All Shifts</option>
              <option value="Day">Day Shift</option>
              <option value="Morning">Morning Shift</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Print Palette Theme
            </label>
            <select
              value={generalPrintTheme}
              onChange={(e) => setGeneralPrintTheme(e.target.value as 'color' | 'bw')}
              className="px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold text-slate-700"
            >
              <option value="color">🎨 Colorful Mode</option>
              <option value="bw">📓 Black & White Mode</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-2 text-sm">
          {/* Tabulation sheet trigger */}
          <button
            onClick={onDownloadTabulation}
            disabled={filteredResults.length === 0}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Tabulation Sheet
          </button>

          {/* Bulk Download Zip */}
          <button
            onClick={downloadBulkMarksheets}
            disabled={downloading || filteredResults.length === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Packing zip...' : 'Download All Marksheets'}
          </button>

          {/* Standalone Single File Offline App */}
          <button
            onClick={handleDownloadStandalone}
            className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/40 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            title="Download fully self-contained offline application containing all student entries and scoring functions"
          >
            <ExternalLink className="w-4 h-4 text-amber-700" />
            Download Offline App (Single HTML)
          </button>

          {/* Recalculate / Process */}
          <button
            onClick={processResults}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 animate-hover-spin" />
            Calculate Grades
          </button>
        </div>
      </div>

      {/* Main Results Directory */}
      {filteredResults.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center text-slate-500">
          <p className="text-lg font-medium text-slate-700">No grades processed yet</p>
          <p className="text-sm mt-1.5 text-slate-400">
            Please make sure you have entered marks, then click "Calculate Grades" to generate school transcripts.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden select-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/75 border-b border-slate-200">
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-center w-14">Rank</th>
                  <th className="px-3 py-3 w-16">Roll</th>
                  <th className="px-4 py-3 min-w-40">Student Name</th>
                  <th className="px-3 py-3 text-center w-16">Section</th>
                  <th className="px-4 py-3 text-center" colSpan={2}>Bangla</th>
                  <th className="px-4 py-3 text-center" colSpan={2}>English</th>
                  <th className="px-4 py-3 text-center" colSpan={2}>Mathematics</th>
                  <th className="px-4 py-3 text-center" colSpan={2}>Sci & BGS (Comb.)</th>
                  <th className="px-3 py-3 text-center w-20">Grand Total</th>
                  <th className="px-3 py-3 text-center w-16">GPA</th>
                  <th className="px-3 py-3 text-center w-20">Grade</th>
                  <th className="px-4 py-3 text-center w-24">Actions</th>
                </tr>
                <tr className="bg-amber-500/[0.04] border-b border-slate-200 text-[9px] font-extrabold tracking-wider text-center">
                  <th colSpan={4} className="border-r border-slate-200/50"></th>
                  {/* Bangla subheaders */}
                  <th className="px-2 py-1 text-slate-450 border-r border-slate-100">Obt</th>
                  <th className="px-2 py-1 text-amber-700 font-bold border-r border-slate-200/50">High</th>
                  {/* English subheaders */}
                  <th className="px-2 py-1 text-slate-450 border-r border-slate-100">Obt</th>
                  <th className="px-2 py-1 text-amber-700 font-bold border-r border-slate-200/50">High</th>
                  {/* Math subheaders */}
                  <th className="px-2 py-1 text-slate-450 border-r border-slate-100">Obt</th>
                  <th className="px-2 py-1 text-amber-700 font-bold border-r border-slate-200/50">High</th>
                  {/* Sci + BGS subheaders */}
                  <th className="px-2 py-1 text-slate-450 border-r border-slate-100">Obt</th>
                  <th className="px-2 py-1 text-amber-700 font-bold border-r border-slate-200/50">High</th>
                  <th colSpan={4}></th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-150 text-slate-700 text-sm">
                {filteredResults.map((student) => {
                  const combinedTotal = student.combinedGrade?.total || 0;
                  const combinedGp = student.combinedGrade?.gp || 0.0;
                  const combinedGradeLabel = student.combinedGrade?.grade || 'F';

                  return (
                    <tr key={student.id} className="hover:bg-slate-55/35 transition-colors">
                      <td className="px-4 py-3 text-center font-extrabold text-indigo-950">
                        {student.rank}
                      </td>
                      <td className="px-3 py-3 text-slate-500 font-semibold">
                        {student.roll}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {student.name}
                      </td>
                      <td className="px-3 py-3 text-center font-medium">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">
                          {student.section}
                        </span>
                      </td>

                      {/* Bangla */}
                      <td className="px-2 py-3 text-center">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{student.subjects.bangla?.total ?? 0}</span>
                          <span className="text-[10px] text-slate-450">GP {(student.subjects.bangla?.gp ?? 0).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center bg-amber-500/[0.02] border-r border-slate-100 text-amber-900 font-bold text-xs">
                        {student.highestMarks?.['bangla'] ?? '-'}
                      </td>

                      {/* English */}
                      <td className="px-2 py-3 text-center">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{student.subjects.english?.total ?? 0}</span>
                          <span className="text-[10px] text-slate-450">GP {(student.subjects.english?.gp ?? 0).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center bg-amber-500/[0.02] border-r border-slate-100 text-amber-900 font-bold text-xs">
                        {student.highestMarks?.['english'] ?? '-'}
                      </td>

                      {/* Math */}
                      <td className="px-2 py-3 text-center">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{student.subjects.math?.total ?? 0}</span>
                          <span className="text-[10px] text-slate-450">GP {(student.subjects.math?.gp ?? 0).toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center bg-amber-500/[0.02] border-r border-slate-100 text-amber-900 font-bold text-xs">
                        {student.highestMarks?.['math'] ?? '-'}
                      </td>

                      {/* Sci & BGS Combined Subject column */}
                      <td className="px-2 py-3 text-center bg-amber-500/[0.01]">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-amber-950">{combinedTotal}</span>
                          <span className="text-[10px] text-amber-700/85 font-semibold">GP {combinedGp.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center bg-amber-500/[0.03] border-r border-slate-100 text-amber-950 font-extrabold text-xs">
                        {student.highestMarks?.['combined'] ?? '-'}
                      </td>

                      {/* Grand total */}
                      <td className="px-3 py-3 text-center font-extrabold text-slate-900 text-sm">
                        {student.grandTotal}
                      </td>

                      {/* overall GPA */}
                      <td className="px-3 py-3 text-center font-extrabold text-blue-650 text-sm">
                        {student.gpa.toFixed(2)}
                      </td>

                      {/* Letter Grade */}
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${getFinalGradeBadge(student.finalGrade)}`}>
                          {student.finalGrade}
                        </span>
                      </td>

                      {/* Row actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            title="Preview Marksheet"
                            onClick={() => {
                              setSelectedStudent(student);
                              setShowMarksheetModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            title="Download Marksheet"
                            onClick={() => onDownloadSingle(student, generalPrintTheme)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
