export interface Student {
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  phone: string;
  address: string;
  academicYear: string;
  class: {
    code: string;
    name: string;
  };
  major: {
    code: string;
    name: string;
  };
  faculty: {
    code: string;
    name: string;
  };
}

export interface TrainingPoint {
  id: number;
  studentCode: string;
  semester: string;
  academicYear: string;
  points: number;
  category: string;
  description: string;
  evidenceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rubric {
  id: number;
  name: string;
  description: string;
  academicYear: string;
  isActive: boolean;
  criteriaCount: number;
  criteria?: Criteria[];
}

export interface Criteria {
  id: number;
  name: string;
  description: string;
  maxScore: number;
  weight: number;
  rubricId: number;
}

export interface EvaluationDetail {
  id?: number;
  criteriaId: number;
  criteria?: Criteria;
  score: number;
  evidence: string;
  note: string;
}

export interface Evaluation {
  id: number;
  studentCode: string;
  rubric: {
    id: number;
    name: string;
  };
  semester: string;
  academicYear: string;
  status: 'DRAFT' | 'SUBMITTED' | 'CLASS_APPROVED' | 'FACULTY_APPROVED' | 'CTSV_APPROVED' | 'REJECTED';
  totalScore: number;
  details: EvaluationDetail[];
  rejectionReason?: string;
  resubmissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

