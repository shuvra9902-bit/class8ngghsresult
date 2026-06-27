/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { ProcessedStudent } from '../types';

interface MarksheetModalProps {
  student: ProcessedStudent;
  session: string;
  modelTest: string;
  onClose: () => void;
  onPrint: (theme: 'color' | 'bw') => void;
}

export default function MarksheetModal({
  student,
  session,
  modelTest,
  onClose,
  onPrint,
}: MarksheetModalProps) {
  const { subjects, highestMarks } = student;
  const [printTheme, setPrintTheme] = React.useState<'color' | 'bw'>('color');
  
  // Calculate combined Sci+BGS marks
  const combinedMCQ = (subjects.science?.mcq || 0) + (subjects.bgs?.mcq || 0);
  const combinedCreative = (subjects.science?.creative || 0) + (subjects.bgs?.creative || 0);
  const combinedTotal = student.combinedGrade?.total || 0;
  const combinedHighest = highestMarks?.['combined'] || 0;

  // Circular progress wheel indicators
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const gpa = student.gpa || 0.0;
  const offset = circumference - (gpa / 5.0) * circumference;
  
  const getWheelColor = (g: number) => {
    if (g >= 5.0) return '#10b981'; // Emerald
    if (g >= 4.0) return '#3b82f6'; // Blue
    if (g >= 3.0) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };
  
  const getComment = (g: number) => {
    if (g >= 5.0) return 'Excellent';
    if (g >= 4.0) return 'Good';
    if (g >= 3.5) return 'Average';
    if (g >= 1.0) return 'Needs Improvement';
    return 'Not Satisfactory';
  };

  const performanceComment = getComment(gpa);

  // Performance bar chart data
  const chartData = [
    { label: 'Bangla', obtained: subjects.bangla?.total || 0, highest: highestMarks?.['bangla'] || 0, max: 100 },
    { label: 'English', obtained: subjects.english?.total || 0, highest: highestMarks?.['english'] || 0, max: 100 },
    { label: 'Math', obtained: subjects.math?.total || 0, highest: highestMarks?.['math'] || 0, max: 100 },
    { label: 'Sci & BGS', obtained: combinedTotal, highest: combinedHighest, max: 100 }
  ];

  const getGradeClass = (grade: string) => {
    if (printTheme === 'bw') {
      return 'bg-white text-slate-950 border-slate-950 font-extrabold';
    }
    switch (grade) {
      case 'A+': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'A': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'A-': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'B': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'C': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'D': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-red-50 text-red-700 border-red-150';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-250 max-w-3xl w-full h-[90vh] my-auto relative flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal headers */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <h2 className="text-base font-bold text-slate-800">Transcript Preview - {student.name}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Marksheet printable container */}
        <div className={`p-6 md:p-8 flex-grow overflow-y-auto space-y-6 relative select-none ${printTheme === 'bw' ? 'bg-white' : ''}`}>
          {/* Subtle logo watermark */}
          <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center pointer-events-none z-0">
            <img 
              src="https://z-cdn-media.chatglm.cn/files/81bcbc46-1942-4ae5-82f3-b47bcc90f921_Screenshot_2025-11-05_214918-removebg-preview.png?auth_key=1862791446-2232bbf5a92e4dd18e4bc625a9f1bb07-0-66301cdaf7f9b2d85a3f9478ecc8695f" 
              alt="Watermark" 
              className={`w-[280px] h-[280px] object-contain transition-all ${printTheme === 'bw' ? 'opacity-[0.03] grayscale' : 'opacity-[0.09]'}`}
            />
          </div>

          {/* Academic crest & institution identity */}
          <div className={`relative border-b ${printTheme === 'bw' ? 'border-slate-400' : 'border-amber-500/20'} pb-5 min-h-[90px] flex flex-col md:flex-row items-center justify-between gap-5 z-10`}>
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src="https://z-cdn-media.chatglm.cn/files/81bcbc46-1942-4ae5-82f3-b47bcc90f921_Screenshot_2025-11-05_214918-removebg-preview.png?auth_key=1862791446-2232bbf5a92e4dd18e4bc625a9f1bb07-0-66301cdaf7f9b2d85a3f9478ecc8695f" 
                alt="School Logo" 
                className={`w-16 h-16 object-contain ${printTheme === 'bw' ? 'grayscale opacity-90' : ''}`}
              />
            </div>

            {/* School details text */}
            <div className="text-center flex-grow px-2 md:px-6">
              <h1 className={`text-2xl font-bold uppercase tracking-widest text-shadow-sm font-sans ${printTheme === 'bw' ? 'text-slate-950' : 'text-indigo-950'}`}>
                Narayanganj Govt. Girls' High School
              </h1>
              <p className={`text-[10px] font-extrabold tracking-wider uppercase mt-1 ${printTheme === 'bw' ? 'text-slate-600' : 'text-amber-600'}`}>
                Estd: 1967 | EIIN: 112425
              </p>
              <h2 className="text-sm font-bold text-slate-700 tracking-wide uppercase mt-1.5">
                Model Test - {modelTest} Marksheet
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">
                Academic Session: {session}
              </p>
            </div>

            {/* GPA Radial Visualizer */}
            <div className="relative w-20 h-20 flex-shrink-0 flex flex-col items-center justify-center">
              <svg width="76" height="76" viewBox="0 0 88 88" className="transform -rotate-90 absolute">
                <circle cx="44" cy="44" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                <circle 
                  cx="44" 
                  cy="44" 
                  r={radius} 
                  fill="transparent" 
                  stroke={printTheme === 'bw' ? '#000000' : getWheelColor(gpa)} 
                  strokeWidth="6" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={offset} 
                  strokeLinecap="round" 
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="relative flex flex-col items-center z-10 text-center">
                <span className="text-base font-extrabold text-slate-800 leading-none">
                  {gpa.toFixed(2)}
                </span>
                <span className="text-[8px] uppercase font-bold text-slate-450 mt-0.5">
                  GPA
                </span>
              </div>
            </div>
          </div>

          {/* Student metadata grid */}
          <div className={`grid grid-cols-2 lg:grid-cols-3 gap-3 ${printTheme === 'bw' ? 'bg-white border-[2.5px] border-slate-950' : 'bg-slate-50/70 border-[2.5px] border-indigo-950'} p-4 rounded-xl z-10 relative shadow-sm`}>
            <div className="flex justify-between border-b border-dashed border-slate-300 pb-1.5 px-1.5 text-sm">
              <span className="font-bold text-slate-500">Name:</span>
              <span className="font-extrabold text-slate-950 text-base">{student.name}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5 px-1.5 text-sm">
              <span className="font-semibold text-slate-450">Roll:</span>
              <span className="font-bold text-slate-800">#{student.roll}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5 px-1.5 text-sm">
              <span className="font-semibold text-slate-450">Class:</span>
              <span className="font-bold text-slate-800">{student.class}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5 px-1.5 text-sm">
              <span className="font-semibold text-slate-450">Section:</span>
              <span className="font-bold text-slate-800">{student.section}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5 px-1.5 text-sm">
              <span className="font-semibold text-slate-450">Shift:</span>
              <span className="font-bold text-slate-800">{student.shift}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5 px-1.5 text-sm">
              <span className="font-semibold text-slate-450">Rank:</span>
              <span className="font-extrabold text-amber-600">#{student.rank}</span>
            </div>
          </div>

          {/* Combined Subject Table */}
          <div className="relative border-2 border-slate-400 rounded-lg overflow-hidden z-10">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-xs uppercase tracking-wider text-center">
                  <th className="px-4 py-2.5 text-left font-bold border-r border-slate-800 w-1/3">Subject Name</th>
                  <th className="px-3 py-2.5 border-r border-slate-800 w-20">MCQ Marks</th>
                  <th className="px-3 py-2.5 border-r border-slate-800 w-20">Creative</th>
                  <th className="px-3 py-2.5 border-r border-slate-800 w-20">Total Obtained</th>
                  <th className="px-3 py-2.5 border-r border-slate-800 w-20 bg-amber-500/10 text-amber-300">Highest Mark</th>
                  <th className="px-3 py-2.5 border-r border-slate-800 w-20">Letter Grade</th>
                  <th className="px-3 py-2.5 w-16">Grade Point</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-slate-950 text-center">
                {/* Bangla */}
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 text-left font-bold border-r text-slate-950 border-slate-300">Bangla</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 font-extrabold">{subjects.bangla?.mcq ?? '-'}</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 font-extrabold">{subjects.bangla?.creative ?? '-'}</td>
                  <td className="px-3 py-2.5 font-black border-r border-slate-300 text-slate-950">{subjects.bangla?.total ?? 0}</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 bg-amber-500/10 text-amber-950 font-black">{highestMarks?.['bangla'] || '-'}</td>
                  <td className="px-3 py-2.5 border-r border-slate-300">
                    <span className={`px-2 py-0.5 rounded font-black text-xs border ${getGradeClass(subjects.bangla?.grade || 'F')}`}>
                      {subjects.bangla?.grade || 'F'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-black text-slate-950">{(subjects.bangla?.gp ?? 0).toFixed(2)}</td>
                </tr>

                {/* English */}
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 text-left font-bold border-r text-slate-950 border-slate-300">English</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 font-extrabold">-</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 font-extrabold">{subjects.english?.creative ?? '-'}</td>
                  <td className="px-3 py-2.5 font-black border-r border-slate-300 text-slate-950">{subjects.english?.total ?? 0}</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 bg-amber-500/10 text-amber-950 font-black">{highestMarks?.['english'] || '-'}</td>
                  <td className="px-3 py-2.5 border-r border-slate-300">
                    <span className={`px-2 py-0.5 rounded font-black text-xs border ${getGradeClass(subjects.english?.grade || 'F')}`}>
                      {subjects.english?.grade || 'F'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-black text-slate-950">{(subjects.english?.gp ?? 0).toFixed(2)}</td>
                </tr>

                {/* Mathematics */}
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 text-left font-bold border-r text-slate-950 border-slate-300">Mathematics</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 font-extrabold">{subjects.math?.mcq ?? '-'}</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 font-extrabold">{subjects.math?.creative ?? '-'}</td>
                  <td className="px-3 py-2.5 font-black border-r border-slate-300 text-slate-950">{subjects.math?.total ?? 0}</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 bg-amber-500/10 text-amber-950 font-black">{highestMarks?.['math'] || '-'}</td>
                  <td className="px-3 py-2.5 border-r border-slate-300">
                    <span className={`px-2 py-0.5 rounded font-black text-xs border ${getGradeClass(subjects.math?.grade || 'F')}`}>
                      {subjects.math?.grade || 'F'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-black text-slate-950">{(subjects.math?.gp ?? 0).toFixed(2)}</td>
                </tr>

                {/* Science */}
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 text-left font-bold border-r text-slate-950 border-slate-300">Science</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 font-extrabold">{subjects.science?.mcq ?? '-'}</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 font-extrabold">{subjects.science?.creative ?? '-'}</td>
                  <td className="px-3 py-2.5 font-black border-r border-slate-300 text-slate-950">{subjects.science?.total ?? 0}</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 bg-amber-500/5 text-amber-800 font-bold">{highestMarks?.['science'] || '-'}</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 align-middle" rowSpan={2}>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className={`px-2 py-0.5 rounded font-black text-xs border ${getGradeClass(student.combinedGrade?.grade || 'F')}`}>
                        {student.combinedGrade?.grade || 'F'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold italic leading-none">(Combined/100)</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-slate-850 align-middle" rowSpan={2}>
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="font-extrabold text-amber-950">{(student.combinedGrade?.gp ?? 0).toFixed(2)}</span>
                      <span className="text-[9px] text-slate-500 font-bold italic leading-none">(Combined/100)</span>
                    </div>
                  </td>
                </tr>

                {/* BGS */}
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 text-left font-bold border-r text-slate-950 border-slate-300">BGS</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 font-extrabold">{subjects.bgs?.mcq ?? '-'}</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 font-extrabold">{subjects.bgs?.creative ?? '-'}</td>
                  <td className="px-3 py-2.5 font-black border-r border-slate-300 text-slate-950">{subjects.bgs?.total ?? 0}</td>
                  <td className="px-3 py-2.5 border-r border-slate-300 bg-amber-500/5 text-amber-800 font-bold">{highestMarks?.['bgs'] || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Results Summary banner */}
          <div className={printTheme === 'bw' 
            ? "bg-white text-slate-950 p-4 rounded-xl border-[2.2px] border-slate-950 shadow-sm relative z-10"
            : "bg-indigo-950 text-white p-4 rounded-xl border border-indigo-900 shadow-md relative z-10"
          }>
            <div className={`grid grid-cols-4 gap-4 text-center divide-x ${printTheme === 'bw' ? 'divide-slate-400' : 'divide-indigo-800'}`}>
              <div>
                <p className={`text-[10px] uppercase font-bold tracking-wider ${printTheme === 'bw' ? 'text-slate-650' : 'text-indigo-200'}`}>Grand Total</p>
                <p className="text-lg font-bold mt-1">
                  {student.grandTotal} <span className={`text-xs font-normal ${printTheme === 'bw' ? 'text-slate-500' : 'text-indigo-300'}`}> / 400</span>
                </p>
              </div>

              <div>
                <p className={`text-[10px] uppercase font-bold tracking-wider ${printTheme === 'bw' ? 'text-slate-650' : 'text-indigo-200'}`}>GPA Score</p>
                <p className={`text-lg font-black mt-1 ${printTheme === 'bw' ? 'text-slate-950' : 'text-yellow-300'}`}>{student.gpa.toFixed(2)}</p>
              </div>

              <div>
                <p className={`text-[10px] uppercase font-bold tracking-wider ${printTheme === 'bw' ? 'text-slate-650' : 'text-indigo-200'}`}>Overall Grade</p>
                <p className={`text-lg font-black mt-1`}>
                  {student.finalGrade}
                </p>
              </div>

              <div>
                <p className={`text-[10px] uppercase font-bold tracking-wider ${printTheme === 'bw' ? 'text-slate-650' : 'text-indigo-250'}`}>Teacher's Note</p>
                <p className={`text-xs font-semibold mt-1.5 line-clamp-1 ${printTheme === 'bw' ? 'text-slate-800 font-bold' : 'text-indigo-100'}`}>{performanceComment}</p>
              </div>
            </div>
          </div>

          {/* Graphical side-by-side bar chart */}
          <div className={`p-4 ${printTheme === 'bw' ? 'bg-white border-[2.2px] border-slate-950 shadow-none' : 'bg-slate-50/60 border border-slate-200 shadow-sm'} rounded-xl relative z-10 select-none`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject-Wise Performance Analysis</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-sm ${printTheme === 'bw' ? 'bg-slate-400' : 'bg-orange-500'}`}></span>
                  <span className="text-[10px] font-bold text-slate-500">Obtained</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-sm ${printTheme === 'bw' ? 'bg-slate-950' : 'bg-teal-800'}`}></span>
                  <span className="text-[10px] font-bold text-slate-500">Highest</span>
                </div>
              </div>
            </div>

            <div className="flex justify-around items-end h-32 pt-2 border-b border-slate-250">
              {chartData.map((data) => {
                const pctObtained = Math.min((data.obtained / data.max) * 100, 100);
                const pctHighest = Math.min((data.highest / data.max) * 100, 100);

                return (
                  <div key={data.label} className="flex flex-col items-center w-24 h-full relative group">
                    <div className="w-full flex-grow flex items-end justify-center gap-1.5 relative px-1">
                      {/* Obtained Bar */}
                      <div 
                        className={`w-5 rounded-t relative transition-all duration-500 shadow-sm ${printTheme === 'bw' ? 'bg-slate-400' : 'bg-orange-500'}`}
                        style={{ height: `${pctObtained}%` }}
                      >
                        <span className="absolute -top-5 left-0 right-0 text-center text-[9px] font-bold text-slate-750">
                          {data.obtained}
                        </span>
                      </div>

                      {/* Highest Bar */}
                      <div 
                        className={`w-5 rounded-t relative transition-all duration-500 shadow-sm ${printTheme === 'bw' ? 'bg-slate-950' : 'bg-teal-800'}`}
                        style={{ height: `${pctHighest}%` }}
                      >
                        <span className="absolute -top-5 left-0 right-0 text-center text-[9px] font-bold text-slate-750">
                          {data.highest}
                        </span>
                      </div>
                    </div>
                    <span className="mt-2 text-[10px] font-bold text-slate-500 whitespace-nowrap">{data.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Beautiful signatures block */}
          <div className="flex justify-between items-end gap-10 px-6 pt-5 relative z-10">
            {/* Teacher plate */}
            <div className="text-center w-1/3">
              <div className="h-11 flex items-center justify-center mb-0.5 pt-0.5" style={{ paddingTop: '0.25in' }}>
                <img 
                  src="https://z-cdn-media.chatglm.cn/files/3074d433-8c22-4df3-97e2-9cf07df0d39b_chinmoy.png" 
                  alt="" 
                  className={`h-9 object-contain ${printTheme === 'bw' ? 'grayscale opacity-90' : ''}`}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <div className={`w-full border-t ${printTheme === 'bw' ? 'border-slate-800' : 'border-slate-300'} mb-1`} style={{ marginTop: '0.25in' }}></div>
              <p className={`font-semibold text-xs tracking-wider ${printTheme === 'bw' ? 'text-slate-900' : 'text-indigo-900'}`}>Class Teacher</p>
            </div>

            {/* Principal plate */}
            <div className="text-center w-1/3 pt-1">
              <div className="h-11 flex items-center justify-center mb-0.5 pt-0.5">
                <img 
                  src="/head-sign.png" 
                  alt="Headmaster signature" 
                  className={`h-9 object-contain ${printTheme === 'bw' ? 'grayscale opacity-90' : ''}`}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <div className={`w-full border-t ${printTheme === 'bw' ? 'border-slate-800' : 'border-slate-300'} mb-1`}></div>
              <p className={`font-semibold text-xs tracking-wider ${printTheme === 'bw' ? 'text-slate-900' : 'text-indigo-900'}`}>Headmaster</p>
            </div>
          </div>

        </div>

        {/* Modal actions bar */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
          
          {/* Theme Selector */}
          <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-lg">
            <button
              onClick={() => setPrintTheme('color')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                printTheme === 'color'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-650 hover:text-slate-900'
              }`}
            >
              🎨 Colorful
            </button>
            <button
              onClick={() => setPrintTheme('bw')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                printTheme === 'bw'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-650 hover:text-slate-900'
              }`}
            >
              📓 Black & White
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={onClose} 
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
            >
              Close Preview
            </button>
            
            <button 
              onClick={() => onPrint(printTheme)} 
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF ({printTheme === 'color' ? 'Color' : 'B&W'})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
