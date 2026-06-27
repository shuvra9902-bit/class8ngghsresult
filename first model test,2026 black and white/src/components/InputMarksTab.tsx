/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Save, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { Student, StudentSubjectsMarks } from '../types';

export const SUBJECT_CONFIGS: Record<string, { name: string; mcq: number; creative: number; total: number }> = {
  bangla: { name: 'Bangla', mcq: 20, creative: 80, total: 100 },
  english: { name: 'English', mcq: 0, creative: 100, total: 100 },
  math: { name: 'Mathematics', mcq: 30, creative: 70, total: 100 },
  science: { name: 'Science', mcq: 10, creative: 40, total: 50 },
  bgs: { name: 'BGS', mcq: 10, creative: 40, total: 50 }
};

interface InputMarksTabProps {
  students: Student[];
  marks: Record<string, StudentSubjectsMarks>;
  filterShift: string;
  setFilterShift: (shift: string) => void;
  filterSection: string;
  setFilterSection: (section: string) => void;
  filterSubject: string;
  setFilterSubject: (subject: string) => void;
  updateMark: (studentId: string, subjectKey: string, type: 'mcq' | 'creative', value: string) => void;
  handleSaveMarks: (silent: boolean, specificStudentId?: string | null) => Promise<void>;
  saving: boolean;
}

export default function InputMarksTab({
  students,
  marks,
  filterShift,
  setFilterShift,
  filterSection,
  setFilterSection,
  filterSubject,
  setFilterSubject,
  updateMark,
  handleSaveMarks,
  saving,
}: InputMarksTabProps) {
  // Filter students based on shift and section
  const filteredStudents = students.filter(student => 
    (filterShift === 'All' ? true : student.shift === filterShift) && 
    student.section === filterSection
  );

  const subject = SUBJECT_CONFIGS[filterSubject];
  const [overLimit, setOverLimit] = useState<Record<string, boolean>>({}); // key is `${studentId}-${type}`
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleInput = (studentId: string, subjectKey: string, type: 'mcq' | 'creative', value: string, max: number) => {
    const limitKey = `${studentId}-${type}`;
    const num = value === '' ? 0 : Number(value);

    if (num > max || num < 0) {
      setOverLimit(prev => ({ ...prev, [limitKey]: true }));
    } else {
      setOverLimit(prev => {
        const next = { ...prev };
        delete next[limitKey];
        return next;
      });
    }

    updateMark(studentId, subjectKey, type, value);
  };

  const handleBlur = async (studentId: string, subjectKey: string, type: 'mcq' | 'creative', value: string, max: number) => {
    const num = value === '' ? 0 : Number(value);
    if (num > max || num < 0) return; // do not save invalid marks

    setAutoSaveStatus('saving');
    try {
      await handleSaveMarks(true, studentId);
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  };

  const hasErrors = Object.keys(overLimit).length > 0;

  return (
    <div className="space-y-4">
      {/* Parameter Filter Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Shift</label>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-slate-700"
            >
              <option value="All">All Shifts</option>
              <option value="Day">Day</option>
              <option value="Morning">Morning</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Section</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium text-slate-700"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Subject To Mark</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold text-slate-800"
            >
              {Object.entries(SUBJECT_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name} ({config.mcq > 0 ? `${config.mcq}M + ${config.creative}C = ` : ''}{config.total} Marks)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sync / Status Indicator */}
        <div className="flex items-center gap-3">
          {autoSaveStatus === 'saving' && (
            <span className="text-xs text-blue-500 font-medium flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Auto-saving...
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
              ✓ Auto-saved
            </span>
          )}
          {autoSaveStatus === 'error' && (
            <span className="text-xs text-red-500 font-semibold bg-red-50 px-2.5 py-1 rounded-full border border-red-100 flex items-center gap-1 animate-bounce">
              ⚠ Sync failed
            </span>
          )}

          <button
            onClick={() => handleSaveMarks(false)}
            disabled={saving || hasErrors || filteredStudents.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold shadow-sm hover:shadow transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save All Marks'}
          </button>
        </div>
      </div>

      {hasErrors && (
        <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-150 rounded-lg text-red-700 text-sm font-medium animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-4.5 h-4.5 text-red-600 flex-shrink-0" />
          <span>Some entered marks exceed the maximum allowed for this subject. Correct the highlighted errors to make sure they can be successfully saved.</span>
        </div>
      )}

      {/* Entry Matrix */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center text-slate-500">
          <p className="text-lg font-medium text-slate-700">No students registered in this section</p>
          <p className="text-sm text-slate-450 mt-1">Please add students under the "Manage Students" directory first.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">Roll</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</th>
                  {subject.mcq > 0 && (
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-40">
                      MCQ Mark (Max: {subject.mcq})
                    </th>
                  )}
                  {subject.creative > 0 && (
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-40">
                      Creative Mark (Max: {subject.creative})
                    </th>
                  )}
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-36">
                    Total Marks (/{subject.total})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((student) => {
                  const studentKey = student.id;
                  const studentMarks = marks[studentKey]?.[filterSubject] || {};
                  
                  const mcqVal = studentMarks.mcq ?? '';
                  const creativeVal = studentMarks.creative ?? '';
                  const total = (Number(mcqVal) || 0) + (Number(creativeVal) || 0);

                  const mcqOver = overLimit[`${student.id}-mcq`];
                  const creativeOver = overLimit[`${student.id}-creative`];

                  return (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-slate-50/35 transition-colors ${
                        mcqOver || creativeOver ? 'bg-red-50/40 hover:bg-red-50/60' : ''
                      }`}
                    >
                      <td className="px-6 py-3.5 text-sm font-semibold text-slate-900">{student.roll}</td>
                      <td className="px-6 py-3.5 text-sm font-medium text-slate-800">{student.name}</td>
                      
                      {subject.mcq > 0 && (
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max={subject.mcq}
                              placeholder="0"
                              value={mcqVal}
                              onChange={(e) => handleInput(student.id, filterSubject, 'mcq', e.target.value, subject.mcq)}
                              onBlur={(e) => handleBlur(student.id, filterSubject, 'mcq', e.target.value, subject.mcq)}
                              className={`w-24 px-3 py-1.5 border rounded-lg text-center outline-none text-sm font-semibold text-slate-800 transition-all focus:ring-4 ${
                                mcqOver 
                                  ? 'border-red-400 bg-red-50 text-red-900 focus:ring-red-400/20' 
                                  : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500 bg-white'
                              }`}
                            />
                            {mcqOver && (
                              <span className="text-[10px] text-red-600 font-bold animate-pulse">
                                Over Max {subject.mcq}
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      {subject.creative > 0 && (
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max={subject.creative}
                              placeholder="0"
                              value={creativeVal}
                              onChange={(e) => handleInput(student.id, filterSubject, 'creative', e.target.value, subject.creative)}
                              onBlur={(e) => handleBlur(student.id, filterSubject, 'creative', e.target.value, subject.creative)}
                              className={`w-24 px-3 py-1.5 border rounded-lg text-center outline-none text-sm font-semibold text-slate-800 transition-all focus:ring-4 ${
                                creativeOver 
                                  ? 'border-red-400 bg-red-50 text-red-900 focus:ring-red-400/20' 
                                  : 'border-slate-200 focus:ring-blue-500/10 focus:border-blue-500 bg-white'
                              }`}
                            />
                            {creativeOver && (
                              <span className="text-[10px] text-red-600 font-bold animate-pulse">
                                Over Max {subject.creative}
                              </span>
                            )}
                          </div>
                        </td>
                      )}

                      <td className="px-6 py-3.5 text-center">
                        <span className={`text-base font-bold text-center ${
                          mcqOver || creativeOver ? 'text-red-600' : 'text-slate-800'
                        }`}>
                          {total}
                        </span>
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
