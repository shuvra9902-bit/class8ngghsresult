/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubjectMarks {
  mcq?: number | "";
  creative?: number | "";
}

export interface StudentSubjectsMarks {
  bangla?: SubjectMarks;
  english?: SubjectMarks;
  math?: SubjectMarks;
  science?: SubjectMarks;
  bgs?: SubjectMarks;
}

export interface Student {
  id: string; // Unique, stable ID (either UUID or s_shift_roll_section template)
  name: string;
  roll: string;
  class: string;
  section: string;
  shift: string;
}

export interface DBStudent {
  id: string;
  name: string;
  roll: number | string;
  class: string;
  section: string;
  shift: string;
  created_at?: string;
}

export interface DBMarks {
  id: string;
  session: string;
  modelTest: string;
  subjects: Record<string, SubjectMarks>;
  roll?: string;
  section?: string;
}

export interface SubjectConfig {
  name: string;
  mcq: number;
  creative: number;
  total: number;
}

export interface GradeScale {
  min: number;
  max: number;
  grade: string;
  gp: number;
}

export interface ProcessedStudent extends Student {
  subjects: {
    bangla: { mcq: number; creative: number; total: number; grade: string; gp: number };
    english: { mcq: number; creative: number; total: number; grade: string; gp: number };
    math: { mcq: number; creative: number; total: number; grade: string; gp: number };
    science: { mcq: number; creative: number; total: number; grade: string; gp: number };
    bgs: { mcq: number; creative: number; total: number; grade: string; gp: number };
  };
  combinedGrade: {
    total: number;
    grade: string;
    gp: number;
  };
  grandTotal: number;
  gpa: number;
  finalGrade: string;
  rank: number;
  highestMarks: Record<string, number>;
}
