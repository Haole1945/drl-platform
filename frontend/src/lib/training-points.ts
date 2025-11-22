import { apiClient } from './api';
import type { ApiResponse } from './api';

export interface TrainingPoint {
  id: number;
  activityName: string;
  description?: string;
  activityDate: string;
  points: number;
  evidenceUrl?: string;
  semester: string;
  studentCode: string;
  studentName: string;
}

export interface CreateTrainingPointRequest {
  activityName: string;
  description?: string;
  activityDate: string;
  points: number;
  evidenceUrl?: string;
  semester: string;
  studentCode: string;
}

export interface UpdateTrainingPointRequest {
  activityName?: string;
  description?: string;
  activityDate?: string;
  points?: number;
  evidenceUrl?: string;
  semester?: string;
}

export const getAllTrainingPoints = async (page: number = 0, size: number = 20): Promise<ApiResponse<{ content: TrainingPoint[]; totalElements: number; totalPages: number }>> => {
  return apiClient.get(`/training-points?page=${page}&size=${size}`);
};

export const getTrainingPointById = async (id: number): Promise<ApiResponse<TrainingPoint>> => {
  return apiClient.get(`/training-points/${id}`);
};

export const getTrainingPointsByStudent = async (studentCode: string, semester?: string): Promise<ApiResponse<TrainingPoint[]>> => {
  const url = semester 
    ? `/training-points/student/${studentCode}?semester=${semester}`
    : `/training-points/student/${studentCode}`;
  return apiClient.get(url);
};

export const calculateTotalPoints = async (studentCode: string, semester?: string): Promise<ApiResponse<{ studentCode: string; totalPoints: number; semester?: string }>> => {
  const url = semester
    ? `/training-points/student/${studentCode}/total?semester=${semester}`
    : `/training-points/student/${studentCode}/total`;
  return apiClient.get(url);
};

export const createTrainingPoint = async (data: CreateTrainingPointRequest): Promise<ApiResponse<TrainingPoint>> => {
  return apiClient.post('/training-points', data);
};

export const updateTrainingPoint = async (id: number, data: UpdateTrainingPointRequest): Promise<ApiResponse<TrainingPoint>> => {
  return apiClient.put(`/training-points/${id}`, data);
};

export const deleteTrainingPoint = async (id: number): Promise<ApiResponse<void>> => {
  return apiClient.delete(`/training-points/${id}`);
};
