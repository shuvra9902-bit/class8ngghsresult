/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import { 
  Users, 
  Award, 
  BookOpen, 
  RefreshCw, 
  CloudOff, 
  Cloud,
  CheckCircle,
  Settings
} from 'lucide-react';

import { 
  Student, 
  StudentSubjectsMarks, 
  ProcessedStudent, 
  GradeScale 
} from './types';

import ResultsTab from './components/ResultsTab';
import InputMarksTab, { SUBJECT_CONFIGS } from './components/InputMarksTab';
import ManageStudentsTab from './components/ManageStudentsTab';
import StudentModal from './components/StudentModal';
import MarksheetModal from './components/MarksheetModal';

const SCHOOL_NAME = "Narayanganj Govt. Girls' High School";

// Grading rules scale
const GRADING_SCALE: GradeScale[] = [
  { min: 80, max: 100, grade: 'A+', gp: 5.0 },
  { min: 70, max: 79, grade: 'A', gp: 4.0 },
  { min: 60, max: 69, grade: 'A-', gp: 3.5 },
  { min: 50, max: 59, grade: 'B', gp: 3.0 },
  { min: 40, max: 49, grade: 'C', gp: 2.0 },
  { min: 33, max: 39, grade: 'D', gp: 1.0 },
  { min: 0, max: 32, grade: 'F', gp: 0.0 },
];

const supabaseConfig = {
  url: "https://bigivbaxpijrcgzymfoc.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpZ2l2YmF4cGlqcmNnenltZm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzUyMDQsImV4cCI6MjA5MzA1MTIwNH0.1SxMogtSctcvNcJLV5ZGT5jPO-cx_VXBTSudrut_wHs"
};

let supabase: SupabaseClient | null = null;
const isSupabaseConfigured = () => {
  return supabaseConfig.url !== "https://REPLACE_WITH_YOUR_PROJECT_ID.supabase.co" && 
         supabaseConfig.key !== "REPLACE_WITH_YOUR_ANON_KEY";
};

if (isSupabaseConfigured()) {
  supabase = createClient(supabaseConfig.url, supabaseConfig.key);
}

// Local cache services
const storageService = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
};

export default function App() {
  const [session, setSession] = useState('2026');
  const [modelTest, setModelTest] = useState('1');
  const [activeTab, setActiveTab] = useState<'results' | 'input-marks' | 'manage-students'>('results');
  const [generalPrintTheme, setGeneralPrintTheme] = useState<'color' | 'bw'>('color');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, StudentSubjectsMarks>>({});
  const [results, setResults] = useState<ProcessedStudent[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState(true);
  const [processMode, setProcessMode] = useState('shift'); // 'shift' or 'class'

  const [filterShift, setFilterShift] = useState('Day');
  const [filterSection, setFilterSection] = useState('A');
  const [filterSubject, setFilterSubject] = useState('bangla');

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showMarksheetModal, setShowMarksheetModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ProcessedStudent | null>(null);

  // Load datasets
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const dbAvailable = isSupabaseConfigured() && supabase !== null;
      setSupabaseStatus(dbAvailable);

      // Load registered students
      let localStudents = storageService.get<Student[]>('students') || [];
      let fetchedStudents = [...localStudents];

      if (dbAvailable && supabase) {
        const { data, error } = await supabase.from('students').select('*');
        if (!error && data) {
          const dbStudents: Student[] = data.map(item => ({
            id: item.id,
            name: item.name,
            roll: item.roll ? item.roll.toString() : "",
            class: item.class,
            section: item.section,
            shift: item.shift
          }));
          
          if (dbStudents.length > 0) {
            fetchedStudents = dbStudents;
            storageService.set('students', dbStudents);
          }
        }
      }

      // Sort and clean student indexes
      fetchedStudents.sort((a, b) => {
        if (a.section !== b.section) return a.section.localeCompare(b.section);
        return parseInt(a.roll) - parseInt(b.roll);
      });
      setStudents(fetchedStudents);

      // Fetch entered marks
      const localMarksKey = `marks-${session}-${modelTest}`;
      let localMarks = storageService.get<Record<string, StudentSubjectsMarks>>(localMarksKey) || {};
      let finalMarks = { ...localMarks };

      if (dbAvailable && supabase) {
        const { data, error } = await supabase
          .from('marks')
          .select('*')
          .eq('session', session)
          .eq('modelTest', modelTest);

        if (!error && data) {
          const dbMarksMap: Record<string, StudentSubjectsMarks> = {};
          data.forEach(item => {
            const parts = item.id.split('_');
            const studentId = parts.slice(2).join('_');
            if (studentId) {
              dbMarksMap[studentId] = item.subjects;
            }
          });
          
          // Merge remote database values with local changes
          finalMarks = { ...finalMarks, ...dbMarksMap };
          storageService.set(localMarksKey, finalMarks);
        }
      }

      setMarks(finalMarks);
      setResults([]); // Reset processed view whenever indices update
    } catch (e) {
      console.error("Data load error:", e);
    } finally {
      setLoading(false);
    }
  }, [session, modelTest]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Saving student records
  const handleAddOrUpdateStudent = async (studentData: Omit<Student, 'id'> & { id?: string }) => {
    const isNew = !studentData.id;
    const studentId = studentData.id || `s_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Check for unique index constraints (Roll + Section + Shift)
    const duplicate = students.some(
      s => s.roll === studentData.roll && 
           s.section === studentData.section && 
           s.shift === studentData.shift && 
           s.id !== studentData.id
    );

    if (duplicate) {
      alert(`Student with Roll ${studentData.roll} already exists in Section ${studentData.section} (${studentData.shift} Shift)!`);
      return;
    }

    const newStudent: Student = {
      ...studentData,
      id: studentId
    };

    try {
      // Save locally first
      let updatedList = isNew ? [...students, newStudent] : students.map(s => s.id === studentId ? newStudent : s);
      updatedList.sort((a, b) => parseInt(a.roll) - parseInt(b.roll));
      setStudents(updatedList);
      storageService.set('students', updatedList);

      // Save to Supabase
      if (supabaseStatus && supabase) {
        const { error } = await supabase.from('students').upsert({
          id: newStudent.id,
          name: newStudent.name,
          roll: parseInt(newStudent.roll) || 0,
          class: newStudent.class,
          section: newStudent.section,
          shift: newStudent.shift
        });
        if (error) console.error("Supabase upsert student error:", error.message);
      }

      setShowStudentModal(false);
      setEditingStudent(null);
    } catch (e) {
      alert("Failed to save student record.");
    }
  };

  // Student deletion
  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student? All their corresponding marks will remain stored but unlinked.')) return;
    
    try {
      const remaining = students.filter(s => s.id !== id);
      setStudents(remaining);
      storageService.set('students', remaining);

      if (supabaseStatus && supabase) {
        await supabase.from('students').delete().eq('id', id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save marks to state and database
  const handleSaveMarks = async (silent = false, specificStudentId: string | null = null) => {
    setSaving(true);
    const localMarksKey = `marks-${session}-${modelTest}`;
    const freshMarks = storageService.get<Record<string, StudentSubjectsMarks>>(localMarksKey) || marks;

    try {
      if (supabaseStatus && supabase) {
        let recordsToUpsert = [];

        if (specificStudentId) {
          const student = students.find(s => s.id === specificStudentId);
          const studentMarks = freshMarks[specificStudentId];
          if (student && studentMarks) {
            recordsToUpsert.push({
              id: `${session}_${modelTest}_${specificStudentId}`,
              session,
              modelTest,
              subjects: studentMarks,
              roll: student.roll,
              section: student.section
            });
          }
        } else {
          recordsToUpsert = Object.entries(freshMarks)
            .map(([studentId, subjectsConfig]) => {
              const student = students.find(s => s.id === studentId);
              if (!student) return null;
              return {
                id: `${session}_${modelTest}_${studentId}`,
                session,
                modelTest,
                subjects: subjectsConfig,
                roll: student.roll,
                section: student.section
              };
            })
            .filter(Boolean);
        }

        if (recordsToUpsert.length > 0) {
          const { error } = await supabase.from('marks').upsert(recordsToUpsert);
          if (error) {
            console.error("Supabase upsert error:", error.message);
          }
        }
      }

      if (!silent) alert('Marks saved successfully!');
    } catch (e) {
      if (!silent) alert('Failed to sync marks online.');
    } finally {
      setSaving(false);
    }
  };

  const updateMark = (studentId: string, subject: string, type: 'mcq' | 'creative', value: string) => {
    setMarks(prev => {
      const updated = {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [subject]: {
            ...prev[studentId]?.[subject],
            [type]: value === '' ? '' : Number(value)
          }
        }
      };
      
      // Keep local standard cache synchronised
      storageService.set(`marks-${session}-${modelTest}`, updated);
      return updated;
    });
  };

  // Grading lookups
  const findGrade = (obtained: number, max: number): { grade: string; gp: number } => {
    const percentage = (obtained / max) * 100;
    const match = GRADING_SCALE.find(g => percentage >= g.min && percentage <= g.max);
    return match ? { grade: match.grade, gp: match.gp } : { grade: 'F', gp: 0.0 };
  };

  // Main calculation thread focusing on unified Science & BGS constraints
  const handleProcessResults = () => {
    if (processMode === 'shift' && filterShift === 'All') {
      alert('Please choose a specific Shift (Day or Morning) to perform Shift-Wise rankings correctly.');
      return;
    }

    let subset = [...students];
    if (processMode === 'shift') {
      subset = students.filter(s => s.shift === filterShift);
    }

    // Determine highest marks inside this subset
    const localHighest: Record<string, number> = {
      bangla: 0,
      english: 0,
      math: 0,
      science: 0,
      bgs: 0,
      combined: 0 // Combined score high
    };

    const studentCalculations = subset.map(student => {
      const studentMarks = marks[student.id] || {};
      
      // Bangla (100)
      const bMCQ = Number(studentMarks.bangla?.mcq || 0);
      const bCreative = Number(studentMarks.bangla?.creative || 0);
      const bTotal = bMCQ + bCreative;
      const bGrade = findGrade(bTotal, 100);
      if (bTotal > localHighest.bangla) localHighest.bangla = bTotal;

      // English (100)
      const eCreative = Number(studentMarks.english?.creative || 0);
      const eTotal = eCreative;
      const eGrade = findGrade(eTotal, 100);
      if (eTotal > localHighest.english) localHighest.english = eTotal;

      // Mathematics (100)
      const mMCQ = Number(studentMarks.math?.mcq || 0);
      const mCreative = Number(studentMarks.math?.creative || 0);
      const mTotal = mMCQ + mCreative;
      const mGrade = findGrade(mTotal, 100);
      if (mTotal > localHighest.math) localHighest.math = mTotal;

      // Science (50) and BGS (50) - Separate Marks
      const sMCQ = Number(studentMarks.science?.mcq || 0);
      const sCreative = Number(studentMarks.science?.creative || 0);
      const sTotal = sMCQ + sCreative;
      if (sTotal > localHighest.science) localHighest.science = sTotal;

      const gMCQ = Number(studentMarks.bgs?.mcq || 0);
      const gCreative = Number(studentMarks.bgs?.creative || 0);
      const gTotal = gMCQ + gCreative;
      if (gTotal > localHighest.bgs) localHighest.bgs = gTotal;

      // COMBINED grading rules out of 100
      const combinedTotal = sTotal + gTotal;
      const combinedGradeInfo = findGrade(combinedTotal, 100);
      if (combinedTotal > localHighest.combined) localHighest.combined = combinedTotal;

      // Construct processed subject maps
      const subjectsProcessed = {
        bangla: { mcq: bMCQ, creative: bCreative, total: bTotal, ...bGrade },
        english: { mcq: 0, creative: eCreative, total: eTotal, ...eGrade },
        math: { mcq: mMCQ, creative: mCreative, total: mTotal, ...mGrade },
        science: { mcq: sMCQ, creative: sCreative, total: sTotal, grade: '-', gp: 0.0 }, // No independent ratings displayed
        bgs: { mcq: gMCQ, creative: gCreative, total: gTotal, grade: '-', gp: 0.0 }       // No independent ratings displayed
      };

      // Check for 'F' grade failures
      const hasFail = 
        subjectsProcessed.bangla.grade === 'F' || 
        subjectsProcessed.english.grade === 'F' || 
        subjectsProcessed.math.grade === 'F' || 
        combinedGradeInfo.grade === 'F';

      const grandTotal = bTotal + eTotal + mTotal + combinedTotal;
      
      // Calculate final GPA (Bangla, English, Math, Combined Sci+BGS)
      const gpSum = subjectsProcessed.bangla.gp + 
                    subjectsProcessed.english.gp + 
                    subjectsProcessed.math.gp + 
                    combinedGradeInfo.gp;

      let gpa = hasFail ? 0.0 : gpSum / 4;
      gpa = Math.round(gpa * 100) / 100;

      let finalGrade = 'F';
      if (!hasFail) {
        if (gpa >= 5.0) finalGrade = 'A+';
        else if (gpa >= 4.0) finalGrade = 'A';
        else if (gpa >= 3.5) finalGrade = 'A-';
        else if (gpa >= 3.0) finalGrade = 'B';
        else if (gpa >= 2.0) finalGrade = 'C';
        else if (gpa >= 1.0) finalGrade = 'D';
      }

      return {
        ...student,
        subjects: subjectsProcessed,
        combinedGrade: {
          total: combinedTotal,
          ...combinedGradeInfo
        },
        grandTotal,
        gpa,
        finalGrade,
        rank: 0,
        highestMarks: localHighest
      };
    });

    // Sort to determine real rankings
    studentCalculations.sort((a, b) => {
      if (b.gpa !== a.gpa) return b.gpa - a.gpa;
      return b.grandTotal - a.grandTotal;
    });

    studentCalculations.forEach((stu, idx) => {
      stu.rank = idx + 1;
      stu.highestMarks = localHighest; // Inject high score map reference
    });

    setResults(studentCalculations);
    alert('Academic performance calculations succeeded!');
  };

  // Marksheet HTML builder for printing
  const generateMarksheetHTML = (student: ProcessedStudent, theme: 'color' | 'bw' = 'color') => {
    const { subjects, highestMarks } = student;
    const combinedMCQ = (subjects.science?.mcq ?? 0) + (subjects.bgs?.mcq ?? 0);
    const combinedCreative = (subjects.science?.creative ?? 0) + (subjects.bgs?.creative ?? 0);
    const combinedTotal = student.combinedGrade?.total || 0;
    const combinedHighest = highestMarks?.['combined'] || 0;

    const barColors = theme === 'bw' ? ['#64748b'] : ['#f97316']; // Obtained: Slate/Orange
    const highestBarColor = theme === 'bw' ? '#000000' : '#115e59'; // Highest: Black/Teal

    const graphData = [
      { label: 'Bangla', obtained: subjects.bangla?.total || 0, highest: highestMarks?.['bangla'] || 0 },
      { label: 'English', obtained: subjects.english?.total || 0, highest: highestMarks?.['english'] || 0 },
      { label: 'Math', obtained: subjects.math?.total || 0, highest: highestMarks?.['math'] || 0 },
      { label: 'Sci & BGS', obtained: combinedTotal, highest: combinedHighest }
    ];

    const graphHTML = graphData.map(d => {
      const pctObtained = Math.min((d.obtained / 100) * 100, 100);
      const pctHighest = Math.min((d.highest / 100) * 100, 100);
      
      return `
        <div class="bar-group">
          <div class="bar-track">
            <div class="bar-fill" style="height: ${pctObtained}%; bg: ${barColors[0]}; background-color: ${barColors[0]};">
               <span class="bar-value obtained">${d.obtained}</span>
            </div>
            <div class="bar-fill" style="height: ${pctHighest}%; bg: ${highestBarColor}; background-color: ${highestBarColor};">
               <span class="bar-value highest">${d.highest}</span>
            </div>
          </div>
          <div class="bar-label">${d.label}</div>
        </div>
      `;
    }).join('');

    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const gpaVal = student.gpa || 0.0;
    const offsetVal = circumference - (gpaVal / 5.0) * circumference;
    const wheelColor = theme === 'bw' 
      ? '#000000' 
      : (gpaVal >= 5.0 ? '#10b981' : gpaVal >= 4.0 ? '#3b82f6' : gpaVal >= 3.0 ? '#f59e0b' : '#ef4444');

    const performanceComment = gpaVal >= 5.0 ? 'Excellent' : 
                               gpaVal >= 4.0 ? 'Good' : 
                               gpaVal >= 3.5 ? 'Average' : 
                               gpaVal >= 1.0 ? 'Needs Improvement' : 'Not Satisfactory';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Marksheet - ${student.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; }
          @page { margin: 0; size: A4; }
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; padding: 0;
            background: #cbd5e1;
            display: flex; justify-content: center;
          }
          .sheet-container {
            width: 210mm; height: 296mm;
            background: #ffffff;
            padding: 15mm 18mm;
            position: relative;
            display: flex; flex-direction: column;
            justify-content: space-between;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .sheet-container::after {
            content: '';
            position: absolute;
            top: 8mm; bottom: 8mm; left: 8mm; right: 8mm;
            border: 2.2px solid ${theme === 'bw' ? '#000000' : '#d97706'}; opacity: ${theme === 'bw' ? '0.12' : '0.15'};
            pointer-events: none; z-index: 10;
          }
          .watermark {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 380px; opacity: ${theme === 'bw' ? '0.04' : '0.09'};
            ${theme === 'bw' ? 'filter: grayscale(1);' : ''}
            pointer-events: none; z-index: 0;
          }
          .header { 
            text-align: center; position: relative;
            z-index: 1; padding-bottom: 12px;
            border-b: 1px solid #e2e8f0; margin-bottom: 5px;
          }
          .logo { position: absolute; top: 5px; left: 0; width: 75px; height: 75px; object-fit: contain; }
          .gpa-wheel-container { 
            position: absolute; top: 5px; right: 0; width: 80px; height: 80px; 
            display: flex; flex-direction: column; align-items: center; justify-content: center; 
          }
          .wheel-text { font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1; }
          .wheel-label { font-size: 8px; color: #64748b; font-weight: 700; margin-top: 2px; text-transform: uppercase; }
          
          .header h1 { 
            margin: 0 90px;
            font-size: 21px; font-weight: 800; color: #0f172a; 
            font-family: 'Playfair Display', serif; line-height: 1.2;
            text-transform: uppercase; letter-spacing: 1px;
          }
          .school-meta {
            color: #b45309; font-weight: 750; font-size: 11px;
            margin: 5px 0; letter-spacing: 0.5px;
          }
          .header h2 { margin: 3px 0; font-size: 14px; color: #334155; font-weight: 800; text-transform: uppercase; }
          .header p.session-info { margin: 0; font-size: 12px; color: #64748b; font-weight: 600; }
          
          .info { 
            display: grid; grid-template-columns: 1fr 1fr; gap: 8px 30px;
            font-size: 13px; background: #f8fafc; padding: 12px 20px;
            border-radius: 8px; border: 2.2px solid ${theme === 'bw' ? '#000000' : '#0f172a'}; 
            z-index: 1; position: relative;
          }
          .info-item { display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px; }
          .info-label { font-weight: 600; color: #64748b; }
          .info-val { font-weight: 850; color: #000000; }
          
          .table-container { width: 100%; z-index: 1; position: relative; }
          table { 
            width: 100%; border-collapse: separate; border-spacing: 0;
            font-size: 12px; border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden;
          }
          th, td { padding: 8px; text-align: center; border-bottom: 1.5px solid #0f172a; border-right: 1.5px solid #0f172a; font-weight: 700; color: #000000; }
          .last-col { border-right: none !important; }
          th { background-color: #0f172a; font-weight: 800; color: #ffffff; text-transform: uppercase; font-size: 10px; border-bottom: 2px solid #0f172a; }
          tr:last-child td { border-bottom: none; }
          tr:nth-child(even) { background-color: #f8fafc; }
          tr.combined-row { background-color: #fefacc; font-weight: 800; color: #78350f; }
          
          .grade-pill {
            display: inline-block; padding: 1px 6px; border-radius: 4px; font-weight: 800; font-size: 10px;
          }
          .grade-A-plus { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
          .grade-A { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
          .grade-A-minus { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
          .grade-B { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
          .grade-C { background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; }
          .grade-D { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
          .grade-F { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
          
          .summary { 
            background: #0f172a; color: white; padding: 12px 25px;
            border-radius: 10px; 
            display: flex; justify-content: space-between; align-items: center;
            z-index: 1; position: relative;
          }
          .summary-item { display: flex; flex-direction: column; align-items: center; }
          .summary-label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 2px; }
          .summary-val { font-size: 18px; font-weight: 800; }
          
          .graph-section { 
            padding: 10px 20px; background: #ffffff; 
            border: 1px solid #e2e8f0; border-radius: 10px; 
            z-index: 1; position: relative;
          }
          .graph-title { text-align: center; font-weight: 800; margin-bottom: 12px; font-size: 11px; color: #475569; text-transform: uppercase; }
          .chart { display: flex; justify-content: space-around; align-items: flex-end; height: 100px; }
          .bar-group { display: flex; flex-direction: column; align-items: center; height: 100%; width: 22%; }
          .bar-track { display: flex; align-items: flex-end; justify-content: center; gap: 5px; flex-grow: 1; width: 100%; border-bottom: 1px solid #cbd5e1; }
          .bar-fill { width: 16px; border-radius: 2px 2px 0 0; position: relative; min-height: 1px; }
          .bar-value { position: absolute; top: -15px; width: 100%; text-align: center; font-size: 9px; font-weight: 800; }
          .bar-value.obtained { color: #f97316; }
          .bar-value.highest { color: #115e59; }
          .bar-label { margin-top: 4px; font-size: 10px; font-weight: 750; color: #64748b; }
          
          .signatures { 
            display: flex; justify-content: space-between; 
            padding: 0 40px; margin-bottom: 5mm;
            z-index: 1; position: relative;
          }
          .sign { text-align: center; width: 30%; }
          .sign-img { height: 42px; display: block; margin: 0 auto 3px auto; object-fit: contain; }
          .sign-img-small { height: 30px; margin-bottom: 2px; }
          .sign-line { border-bottom: 1px solid #475569; height: 1px; margin-bottom: 4px; }
          .sign-title { font-weight: 600; font-size: 11px; color: #0f172a; }
          
          @media print {
            body { padding: 0; margin: 0; display: block; background: #ffffff; }
            .sheet-container { 
              margin: 0; width: 210mm; height: 296mm;
              padding: 15mm 18mm; box-shadow: none; border-radius: 0;
              page-break-after: always; overflow: hidden;
            }
            .bar-fill { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .info { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
            .summary { background-color: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
            tr.combined-row { background-color: #fefacc !important; -webkit-print-color-adjust: exact; }
            .grade-A-plus { background-color: #dcfce7 !important; -webkit-print-color-adjust: exact; }
            .grade-A { background-color: #dbeafe !important; -webkit-print-color-adjust: exact; }
            .grade-A-minus { background-color: #e0e7ff !important; -webkit-print-color-adjust: exact; }
            .grade-B { background-color: #fef3c7 !important; -webkit-print-color-adjust: exact; }
            .grade-C { background-color: #ffedd5 !important; -webkit-print-color-adjust: exact; }
            .grade-D { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
            .grade-F { background-color: #fee2e2 !important; -webkit-print-color-adjust: exact; }
          }
          ${theme === 'bw' ? `
          .school-meta { color: #334155 !important; }
          .gpa-wheel-container svg circle { stroke: #e2e8f0 !important; }
          .gpa-wheel-container svg circle:last-child { stroke: #000000 !important; }
          .wheel-text { color: #000000 !important; }
          .wheel-label { color: #475569 !important; }
          .grade-pill { background: #ffffff !important; color: #000000 !important; border: 1.5px solid #000000 !important; font-weight: 800 !important; }
          .summary { background: #ffffff !important; color: #000000 !important; border: 2.2px solid #000000 !important; }
          .summary-label { color: #475569 !important; }
          .summary-val { color: #000000 !important; }
          .bar-value.obtained { color: #475569 !important; }
          .bar-value.highest { color: #000000 !important; }
          tr.combined-row { background-color: #f1f5f9 !important; color: #1e293b !important; }
          ` : ''}
        </style>
      </head>
      <body>
        <div class="sheet-container">
          <img src="https://z-cdn-media.chatglm.cn/files/81bcbc46-1942-4ae5-82f3-b47bcc90f921_Screenshot_2025-11-05_214918-removebg-preview.png?auth_key=1862791446-2232bbf5a92e4dd18e4bc625a9f1bb07-0-66301cdaf7f9b2d85a3f9478ecc8695f" alt="Watermark" class="watermark">
          
          <div class="header">
            <img src="https://z-cdn-media.chatglm.cn/files/81bcbc46-1942-4ae5-82f3-b47bcc90f921_Screenshot_2025-11-05_214918-removebg-preview.png?auth_key=1862791446-2232bbf5a92e4dd18e4bc625a9f1bb07-0-66301cdaf7f9b2d85a3f9478ecc8695f" alt="School Logo" class="logo">
            
            <div class="gpa-wheel-container">
              <svg width="72" height="72" viewBox="0 0 80 80" style="transform: rotate(-90deg);">
                <circle cx="40" cy="40" r="${radius}" fill="transparent" stroke="#f1f5f9" stroke-width="5" />
                <circle cx="40" cy="40" r="${radius}" fill="transparent" stroke="${wheelColor}" stroke-width="5"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${offsetVal}"
                  stroke-linecap="round"
                />
              </svg>
              <div style="position: absolute; text-align: center;">
                <div class="wheel-text">${gpaVal.toFixed(2)}</div>
                <div class="wheel-label">GPA</div>
              </div>
            </div>

            <h1>${SCHOOL_NAME}</h1>
            <p class="school-meta">EIIN: 112425 | Estd: 1967</p>
            <h2>Model Test - ${modelTest} Marksheet</h2>
            <p class="session-info">Session: ${session}</p>
          </div>
          
          <div class="info">
            <div class="info-item"><span class="info-label">Name</span> <span class="info-val">${student.name}</span></div>
            <div class="info-item"><span class="info-label">Roll</span> <span class="info-val">${student.roll}</span></div>
            <div class="info-item"><span class="info-label">Class</span> <span class="info-val">${student.class}</span></div>
            <div class="info-item"><span class="info-label">Section</span> <span class="info-val">${student.section}</span></div>
            <div class="info-item"><span class="info-label">Shift</span> <span class="info-val">${student.shift}</span></div>
            <div class="info-item"><span class="info-label">Rank</span> <span class="info-val" style="color: #ea580c;">#${student.rank}</span></div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Subject</th><th>MCQ</th><th>Creative</th><th>Total</th><th>Highest</th><th>Grade</th><th class="last-col">GP</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style="font-weight:700; text-align: left;">Bangla</td><td>${subjects.bangla?.mcq ?? '-'}</td><td>${subjects.bangla?.creative ?? '-'}</td><td style="font-weight:850;">${subjects.bangla?.total ?? 0}</td><td>${highestMarks?.['bangla'] || '-'}</td><td><span class="grade-pill grade-${(subjects.bangla?.grade || 'F').replace('+','-plus').replace('-','-minus')}">${subjects.bangla?.grade || 'F'}</span></td><td style="font-weight:700;" class="last-col">${(subjects.bangla?.gp ?? 0).toFixed(2)}</td></tr>
                <tr><td style="font-weight:700; text-align: left;">English</td><td>-</td><td>${subjects.english?.creative ?? '-'}</td><td style="font-weight:850;">${subjects.english?.total ?? 0}</td><td>${highestMarks?.['english'] || '-'}</td><td><span class="grade-pill grade-${(subjects.english?.grade || 'F').replace('+','-plus').replace('-','-minus')}">${subjects.english?.grade || 'F'}</span></td><td style="font-weight:700;" class="last-col">${(subjects.english?.gp ?? 0).toFixed(2)}</td></tr>
                <tr><td style="font-weight:700; text-align: left;">Mathematics</td><td>${subjects.math?.mcq ?? '-'}</td><td>${subjects.math?.creative ?? '-'}</td><td style="font-weight:850;">${subjects.math?.total ?? 0}</td><td>${highestMarks?.['math'] || '-'}</td><td><span class="grade-pill grade-${(subjects.math?.grade || 'F').replace('+','-plus').replace('-','-minus')}">${subjects.math?.grade || 'F'}</span></td><td style="font-weight:700;" class="last-col">${(subjects.math?.gp ?? 0).toFixed(2)}</td></tr>
                <tr>
                  <td style="font-weight:700; text-align: left;">Science</td>
                  <td>${subjects.science?.mcq ?? '-'}</td>
                  <td>${subjects.science?.creative ?? '-'}</td>
                  <td style="font-weight:850;">${subjects.science?.total ?? 0}</td>
                  <td>${highestMarks?.['science'] || '-'}</td>
                  <td rowspan="2" style="vertical-align: middle;">
                    <span class="grade-pill grade-${(student.combinedGrade?.grade || 'F').replace('+','-plus').replace('-','-minus')}">${student.combinedGrade?.grade || 'F'}</span>
                    <div style="font-size: 8.5px; color: #64748b; margin-top: 3.5px; font-weight: 600;">(Combined)</div>
                  </td>
                  <td rowspan="2" class="last-col" style="font-weight:700; vertical-align: middle;">
                    ${(student.combinedGrade?.gp ?? 0).toFixed(2)}
                    <div style="font-size: 8.5px; color: #64748b; margin-top: 3.5px; font-weight: 600;">(Combined)</div>
                  </td>
                </tr>
                <tr>
                  <td style="font-weight:700; text-align: left;">BGS</td>
                  <td>${subjects.bgs?.mcq ?? '-'}</td>
                  <td>${subjects.bgs?.creative ?? '-'}</td>
                  <td style="font-weight:850;">${subjects.bgs?.total ?? 0}</td>
                  <td>${highestMarks?.['bgs'] || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <span class="summary-label">Grand Total</span>
              <span class="summary-val">${student.grandTotal} <span style="font-size:12px; opacity:0.8; font-weight:normal;">/ 400</span></span>
            </div>
            <div class="summary-item">
              <span class="summary-label">GPA</span>
              <span class="summary-val" style="color: #fbbf24;">${student.gpa.toFixed(2)}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Final Grade</span>
              <span class="summary-val">${student.finalGrade}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Remarks</span>
              <span class="summary-val" style="font-size: 13px; font-weight:600;">${performanceComment}</span>
            </div>
          </div>

          <div class="graph-section">
            <div class="graph-title">Performance Analysis Chart</div>
            <div class="chart">
              ${graphHTML}
            </div>
          </div>

          <div class="signatures">
            <div class="sign">
              <img src="https://z-cdn-media.chatglm.cn/files/3074d433-8c22-4df3-97e2-9cf07df0d39b_chinmoy.png" alt="" class="sign-img" onerror="this.style.display='none';">
              <div class="sign-line"></div>
              <div class="sign-title">Class Teacher</div>
            </div>
            <div class="sign">
              <img src="/head-sign.png" alt="Headmaster signature" class="sign-img sign-img-small" onerror="this.style.display='none';">
              <div class="sign-line"></div>
              <div class="sign-title">Headmaster</div>
            </div>
          </div>

        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadSingle = (student: ProcessedStudent, theme: 'color' | 'bw' = 'color') => {
    const rawHTML = generateMarksheetHTML(student, theme);
    const blob = new Blob([rawHTML], { type: 'text/html' });
    const fileUrl = URL.createObjectURL(blob);
    
    // Fallback file download for direct access in systems that block popups
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `marksheet_${student.name.replace(/\s+/g, '_')}_roll_${student.roll}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileUrl);
    
    // Standard beautiful tab opening for instant print
    const printTab = window.open('', '_blank');
    if (printTab) {
      printTab.document.write(rawHTML);
      printTab.document.close();
      printTab.focus();
      setTimeout(() => {
        printTab.print();
      }, 800);
    }
  };

  const downloadBulkMarksheets = async () => {
    if (results.length === 0) {
      alert('Please calculate first to build active student score lists.');
      return;
    }

    setDownloading(true);
    try {
      const activeSubset = filterShift === 'All' ? results : results.filter(r => r.shift === filterShift);
      if (activeSubset.length === 0) {
        alert('No calculated transcripts match the selected filters.');
        setDownloading(false);
        return;
      }

      const zip = new JSZip();
      activeSubset.forEach(student => {
        const rawHTML = generateMarksheetHTML(student, generalPrintTheme);
        const sanitizeName = student.name.replace(/[^a-zA-Z0-9_\s-]/g, '').replace(/\s+/g, '_');
        const filename = `roll_${student.roll}_${sanitizeName}_marksheet.html`;
        zip.file(filename, rawHTML);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const folderUrl = URL.createObjectURL(zipBlob);
      
      const link = document.createElement('a');
      link.href = folderUrl;
      link.download = `grade_transcripts_${filterShift}_shift_session_${session}_test_${modelTest}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(folderUrl);

      alert(`Successfully processed and bundled ${activeSubset.length} marksheets! Check your browser's download folder.`);
    } catch (e) {
      alert('An error occurred while compiling bulk marksheets zip.');
    } finally {
      setDownloading(false);
    }
  };

  // Landscape Tabulation compilation sheet HTML
  const generateTabulationSheetHTML = (activeSubset: ProcessedStudent[]) => {
    const tableRows = activeSubset.map((student) => {
      // Bangla
      const bMCQ = student.subjects.bangla?.mcq ?? '-';
      const bCQ = student.subjects.bangla?.creative ?? '-';
      const bTot = student.subjects.bangla?.total ?? 0;
      const bGrd = student.subjects.bangla?.grade ?? 'F';

      // English
      const eCQ = student.subjects.english?.creative ?? '-';
      const eTot = student.subjects.english?.total ?? 0;
      const eGrd = student.subjects.english?.grade ?? 'F';

      // Mathematics
      const mMCQ = student.subjects.math?.mcq ?? '-';
      const mCQ = student.subjects.math?.creative ?? '-';
      const mTot = student.subjects.math?.total ?? 0;
      const mGrd = student.subjects.math?.grade ?? 'F';

      // Science and BGS input separate parts
      const sMCQ = student.subjects.science?.mcq ?? 0;
      const sCQ = student.subjects.science?.creative ?? 0;
      const sTotal = sMCQ + sCQ;

      const gMCQ = student.subjects.bgs?.mcq ?? 0;
      const gCQ = student.subjects.bgs?.creative ?? 0;
      const gTotal = gMCQ + gCQ;

      // Combined
      const combinedTotal = student.combinedGrade?.total ?? 0;
      const combinedGradeLabel = student.combinedGrade?.grade ?? 'F';

      return `
        <tr>
          <td class="roll-sec-cell"><strong>${student.roll}</strong><br><span class="roll-sec-label">Sec: ${student.section}</span></td>
          <td class="stu-name">${student.name}</td>
          
          <td>${bMCQ}</td><td>${bCQ}</td><td class="sub-tot">${bTot}</td><td class="sub-grd">${bGrd}</td>
          
          <td>-</td><td>${eCQ}</td><td class="sub-tot">${eTot}</td><td class="sub-grd">${eGrd}</td>
          
          <td>${mMCQ}</td><td>${mCQ}</td><td class="sub-tot">${mTot}</td><td class="sub-grd">${mGrd}</td>
          
          <td>${sMCQ}</td><td>${sCQ}</td><td class="sub-tot-alt">${sTotal}</td>
          <td>${gMCQ}</td><td>${gCQ}</td><td class="sub-tot-alt">${gTotal}</td>
          
          <td class="sub-tot-gold">${combinedTotal}</td>
          <td class="sub-grd-gold font-bold">${combinedGradeLabel}</td>
          
          <td class="overall-tot">${student.grandTotal}</td>
          <td class="overall-gpa">${student.gpa.toFixed(2)}</td>
          <td class="overall-grd font-bold">${student.finalGrade}</td>
          <td class="overall-rank font-bold">#${student.rank}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Tabulation Compilation - Narayanganj Govt. Girls' High School</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; margin: 10mm; font-size: 10px; color: #1e293b; background: white; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
          .header h1 { margin: 0; font-size: 20px; color: #0f172a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
          .header h2 { margin: 5px 0; font-size: 13px; color: #475569; font-weight: 700; text-transform: uppercase; }
          .header p { margin: 5px 0 0 0; font-size: 11px; color: #64748b; font-weight: 500; }
          
          table { width: 100%; border-collapse: collapse; text-align: center; border: 1.5px solid #0f172a; }
          th, td { border: 1.5px solid #475569; padding: 5px 3px; }
          th { background-color: #f8fafc; font-weight: 750; color: #0f172a; text-transform: uppercase; font-size: 8px; letter-spacing: 0.5px; }
          
          .topic-hd { background-color: #e2e8f0; font-weight: 800; }
          .stu-name { text-align: left; font-weight: 600; padding-left: 6px; color: #0f172a; font-size: 11px; text-transform: capitalize; }
          .sec-lbl { font-weight: 600; color: #475569; }
          .sub-tot { font-weight: 700; background-color: #f1f5f9; color: #0f172a; }
          .sub-grd { font-weight: 800; color: #1e3a8a; }
          
          .sub-tot-alt { font-weight: 600; background-color: #f8fafc; color: #475569; }
          .sub-tot-gold { font-weight: 800; background-color: #fef9c3; color: #713f12; }
          .sub-grd-gold { font-weight: 800; background-color: #fef9c3; color: #854d0e; }
          
          .overall-tot { font-weight: 850; background-color: #f8fafc; color: #000000; font-size: 10.5px; }
          .overall-gpa { font-weight: 850; font-size: 11px; color: #1d4ed8; background-color: #eff6ff; }
          .overall-grd { font-weight: 850; font-size: 11px; color: #047857; }
          .overall-rank { font-weight: 850; font-size: 11px; color: #b45309; }
          
          tbody tr:hover { background-color: #f8fafc; }
          tbody tr:nth-child(even) { background-color: #f8fafc/40; }
          
          .footer-signs { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 45px; align-items: flex-end; }
          .sign-tag { border-top: 1.5px solid #000000; width: 140px; text-align: center; padding-top: 5px; font-weight: 700; font-size: 10px; color: #0f172a; }
          .sign-block { display: flex; flex-direction: column; align-items: center; }
          .sign-block img { height: 32px; object-fit: contain; margin-bottom: 3px; }
          .roll-sec-cell { text-align: left; font-weight: 700; line-height: 1.25; }
          .roll-sec-label { display: inline-block; font-size: 9px; color: #475569; font-weight: 600; background: #eff6ff; padding: 1px 5px; border-radius: 999px; }
          
          @media print {
            @page { size: A4 landscape; margin: 8mm; }
            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
            .topic-hd { background-color: #e2e8f0 !important; -webkit-print-color-adjust: exact; }
            .sub-tot { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
            .sub-tot-gold { background-color: #fef9c3 !important; -webkit-print-color-adjust: exact; }
            .sub-grd-gold { background-color: #fef9c3 !important; -webkit-print-color-adjust: exact; }
            .overall-gpa { background-color: #eff6ff !important; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${SCHOOL_NAME}</h1>
          <h2>Tabulation Compilation Ledger — Model Test ${modelTest}</h2>
          <p>
            <strong>Session Year:</strong> ${session} &nbsp;|&nbsp; 
            <strong>Shift:</strong> ${filterShift === 'All' ? 'Combined (Morning & Day)' : `${filterShift} Shift`} &nbsp;|&nbsp; 
            <strong>Export Date:</strong> ${new Date().toLocaleDateString(undefined, {year: 'numeric', month: 'long', day: 'numeric'})}
          </p>
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width: 52px;">Roll / Sec</th>
              <th rowspan="2" style="text-align: left; padding-left: 6px;">Student Name</th>
              
              <th colspan="4" class="topic-hd">Bangla</th>
              <th colspan="4" class="topic-hd">English</th>
              <th colspan="4" class="topic-hd">Mathematics</th>
              
              <th colspan="3" class="topic-hd" style="background-color: #f0fdf4;">Science Subject</th>
              <th colspan="3" class="topic-hd" style="background-color: #fff9db;">BGS Subject</th>
              <th colspan="2" class="topic-hd" style="background-color: #fef9c3;">Unified Sci & BGS</th>
              
              <th rowspan="2" style="background-color: #f8fafc; width: 45px;">Grand<br>Total</th>
              <th rowspan="2" style="background-color: #eff6ff; width: 45px;">GPA</th>
              <th rowspan="2" style="background-color: #f0fdf4; width: 45px;">Overall<br>Grade</th>
              <th rowspan="2" style="background-color: #fffbeb; width: 45px;">Rank</th>
            </tr>
            <tr>
              <th>M</th><th>C</th><th>T</th><th>G</th>
              <th>M</th><th>C</th><th>T</th><th>G</th>
              <th>M</th><th>C</th><th>T</th><th>G</th>
              
              <th style="background-color: #f0fdf4;">M</th><th style="background-color: #f0fdf4;">C</th><th style="background-color: #f0fdf4;">T</th>
              <th style="background-color: #fff9db;">M</th><th style="background-color: #fff9db;">C</th><th style="background-color: #fff9db;">T</th>
              
              <th style="background-color: #fef9c3;">Total</th><th style="background-color: #fef9c3;">Grade</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <div class="footer-signs">
          <div class="sign-tag">Class Teacher</div>
          <div class="sign-block">
            <img src="/head-sign.png" alt="Headmaster signature" onerror="this.style.display='none';">
            <div class="sign-tag">Headmaster</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadTabulation = () => {
    const activeSubset = filterShift === 'All' ? results : results.filter(r => r.shift === filterShift);
    
    if (activeSubset.length === 0) {
      alert('Please calculate first to compile student ledger rows.');
      return;
    }
    
    const compilationHTML = generateTabulationSheetHTML(activeSubset);
    const tabulationTab = window.open('', '_blank');
    if (tabulationTab) {
      tabulationTab.document.write(compilationHTML);
      tabulationTab.document.close();
      tabulationTab.focus();
      setTimeout(() => {
        tabulationTab.print();
      }, 500);
    } else {
      // Direct file download fallback for users with popup blockers active
      const blob = new Blob([compilationHTML], { type: 'text/html' });
      const fileUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `tabulation_ledger_${filterShift}_shift_${session}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileUrl);
      alert('We initiated a local file download of your tabulation ledger as pop-ups are currently disabled in this preview session.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Preparing grades workspace, please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col text-slate-800">
      
      {/* Synchronization alert banner */}
      {!supabaseStatus && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-center text-xs text-amber-800 font-semibold flex items-center justify-center gap-2">
          <CloudOff className="w-4 h-4 text-amber-600" />
          <span>Local Storage Fallback Active: Database settings could not be retrieved, modifications are persistent only on this machine.</span>
        </div>
      )}

      {/* Main system header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 bg-indigo-950 text-white font-extrabold text-[11px] uppercase tracking-widest rounded">Pro</span>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Student Academic Ledger</h1>
              </div>
              <p className="text-sm font-medium text-slate-400 mt-0.5">{SCHOOL_NAME}</p>
            </div>

            {/* Inputs configured panel */}
            <div className="flex items-center gap-3 bg-slate-55 p-2 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-0.5">Session</label>
                <input 
                  type="text" 
                  value={session} 
                  onChange={(e) => setSession(e.target.value)} 
                  className="px-2.5 py-1 text-xs border border-slate-250 bg-white rounded font-bold text-slate-800 w-16" 
                />
              </div>
              <div className="w-px h-6 bg-slate-300 self-end mb-1"></div>
              <div>
                <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider mb-0.5">Model Test</label>
                <input 
                  type="text" 
                  value={modelTest} 
                  onChange={(e) => setModelTest(e.target.value)} 
                  className="px-2.5 py-1 text-xs border border-slate-250 bg-white rounded font-bold text-slate-800 w-16" 
                />
              </div>
              <button 
                onClick={loadData} 
                className="self-end mb-0.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-600 text-xs font-semibold rounded cursor-pointer transition-colors"
                title="Reload data entries"
              >
                Sync
              </button>
            </div>
          </div>

          {/* Navigation bars */}
          <nav className="flex gap-6 mt-5 text-sm select-none">
            <button 
              onClick={() => setActiveTab('results')} 
              className={`pb-2.5 font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'results' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-450 hover:text-slate-700'
              }`}
            >
              <Award className="w-4 h-4" />
              Calculated Results
            </button>
            
            <button 
              onClick={() => setActiveTab('input-marks')} 
              className={`pb-2.5 font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'input-marks' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-450 hover:text-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Input Marks Panel
            </button>
            
            <button 
              onClick={() => setActiveTab('manage-students')} 
              className={`pb-2.5 font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'manage-students' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-450 hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Manage Students
            </button>
          </nav>
        </div>
      </header>

      {/* Primary body component */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full">
        {activeTab === 'results' && (
          <ResultsTab 
            results={results} 
            filterShift={filterShift} 
            setFilterShift={setFilterShift} 
            processMode={processMode} 
            setProcessMode={setProcessMode} 
            processResults={handleProcessResults} 
            setSelectedStudent={setSelectedStudent} 
            setShowMarksheetModal={setShowMarksheetModal} 
            downloadBulkMarksheets={downloadBulkMarksheets} 
            downloading={downloading} 
            onDownloadSingle={handleDownloadSingle} 
            onDownloadTabulation={handleDownloadTabulation} 
            generalPrintTheme={generalPrintTheme}
            setGeneralPrintTheme={setGeneralPrintTheme}
          />
        )}
        
        {activeTab === 'input-marks' && (
          <InputMarksTab 
            students={students} 
            marks={marks} 
            filterShift={filterShift} 
            setFilterShift={setFilterShift} 
            filterSection={filterSection} 
            setFilterSection={setFilterSection} 
            filterSubject={filterSubject} 
            setFilterSubject={setFilterSubject} 
            updateMark={updateMark} 
            handleSaveMarks={handleSaveMarks} 
            saving={saving} 
          />
        )}
        
        {activeTab === 'manage-students' && (
          <ManageStudentsTab 
            students={students} 
            filterShift={filterShift} 
            setFilterShift={setFilterShift} 
            filterSection={filterSection} 
            setFilterSection={setFilterSection} 
            setShowStudentModal={setShowStudentModal} 
            setEditingStudent={setEditingStudent} 
            handleDeleteStudent={handleDeleteStudent} 
          />
        )}
      </main>

      {/* Add / Edit Student overlay */}
      {showStudentModal && (
        <StudentModal 
          student={editingStudent} 
          onClose={() => { setShowStudentModal(false); setEditingStudent(null); }} 
          onSave={handleAddOrUpdateStudent} 
        />
      )}

      {/* Detailed Report Sheet / Marksheet overlay */}
      {showMarksheetModal && selectedStudent && (
        <MarksheetModal 
          student={selectedStudent} 
          session={session} 
          modelTest={modelTest} 
          onClose={() => { setShowMarksheetModal(false); setSelectedStudent(null); }} 
          onPrint={() => handleDownloadSingle(selectedStudent)} 
        />
      )}

    </div>
  );
}
