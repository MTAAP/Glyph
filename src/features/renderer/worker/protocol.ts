export type { WorkerRequest, WorkerResponse } from '@/shared/types';

export interface WorkerError {
  type: 'error';
  message: string;
}

export type WorkerMessage = import('@/shared/types').WorkerResponse | WorkerError;
