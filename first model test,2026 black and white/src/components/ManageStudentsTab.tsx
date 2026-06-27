/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Student } from '../types';

interface ManageStudentsTabProps {
  students: Student[];
  filterShift: string;
  setFilterShift: (shift: string) => void;
  filterSection: string;
  setFilterSection: (section: string) => void;
  setShowStudentModal: (show: boolean) => void;
  setEditingStudent: (student: Student | null) => void;
  handleDeleteStudent: (id: string) => void;
}

export default function ManageStudentsTab({
  students,
  filterShift,
  setFilterShift,
  filterSection,
  setFilterSection,
  setShowStudentModal,
  setEditingStudent,
  handleDeleteStudent,
}: ManageStudentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Apply filters
  const filteredStudents = students.filter(student => {
    const matchesShift = filterShift === 'All' ? true : student.shift === filterShift;
    const matchesSection = student.section === filterSection;
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.roll.toString().includes(searchTerm);
    return matchesShift && matchesSection && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-150 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Shift selector */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Shift</label>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-700 font-medium"
            >
              <option value="All">All Shifts</option>
              <option value="Day">Day</option>
              <option value="Morning">Morning</option>
            </select>
          </div>

          {/* Section selector */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Section</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-700 font-medium"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="w-full sm:w-64">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Search Student</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Name or Roll..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Add Student CTA */}
        <div className="flex items-end self-end md:self-auto">
          <button
            onClick={() => {
              setEditingStudent(null);
              setShowStudentModal(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-semibold shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Directory table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <p className="text-lg font-medium text-slate-700">No students found</p>
            <p className="text-sm text-slate-400 mt-1">Adjust your shift, section or search query to find more students.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Roll</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Shift</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-semibold text-slate-900">{student.roll}</td>
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-800">{student.name}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-500">{student.class}</td>
                    <td className="px-6 py-3.5 text-sm">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        {student.section}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        student.shift === 'Day' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {student.shift}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          title="Edit"
                          onClick={() => {
                            setEditingStudent(student);
                            setShowStudentModal(true);
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
