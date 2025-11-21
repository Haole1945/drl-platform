export interface SubCriteriaFormData {
  id: string; // e.g., "1.1", "1.2"
  name: string;
  points: number; // Can be negative
  description: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

export interface CriteriaFormData {
  id?: number;
  name: string;
  description: string;
  maxPoints: number;
  orderIndex: number;
  isNew?: boolean;
  isDeleted?: boolean;
  subCriteria?: SubCriteriaFormData[];
}

export interface RubricFormData {
  id: number | undefined;
  name: string;
  description: string;
  maxScore: number;
  academicYear: string;
}