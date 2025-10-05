import apiService from './apiService';
import { DrugBatch, BatchForm, TransferForm, ApiResponse, PaginatedResponse } from '../types';

export const batchService = {
  // Get all batches with pagination and filters
  async getBatches(params?: {
    page?: number;
    limit?: number;
    status?: string;
    manufacturer?: string;
    drugName?: string;
    expiryDateFrom?: string;
    expiryDateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<DrugBatch>> {
    return apiService.get('/drug-batches', params);
  },

  // Get single batch by ID
  async getBatch(id: string): Promise<ApiResponse<{ batch: DrugBatch; supplyChain: any[] }>> {
    return apiService.get(`/drug-batches/${id}`);
  },

  // Get batch by code (for QR scanning)
  async getBatchByCode(batchCode: string): Promise<ApiResponse<{ batch: DrugBatch; supplyChain: any[]; verification: any }>> {
    return apiService.get(`/drug-batches/code/${batchCode}`);
  },

  // Create new batch
  async createBatch(batchData: BatchForm): Promise<ApiResponse<{ batch: DrugBatch; qrCode: any }>> {
    return apiService.post('/drug-batches', batchData);
  },

  // Update batch
  async updateBatch(id: string, batchData: Partial<BatchForm>): Promise<ApiResponse<{ batch: DrugBatch }>> {
    return apiService.put(`/drug-batches/${id}`, batchData);
  },

  // Transfer batch
  async transferBatch(id: string, transferData: TransferForm): Promise<ApiResponse<{ batch: DrugBatch; transactionHash: string }>> {
    return apiService.post(`/drug-batches/${id}/transfer`, transferData);
  },

  // Verify batch
  async verifyBatch(id: string): Promise<ApiResponse<{ batch: DrugBatch }>> {
    return apiService.put(`/drug-batches/${id}/verify`);
  },

  // Recall batch
  async recallBatch(id: string, data: { reason: string; severity: string }): Promise<ApiResponse<{ batch: DrugBatch }>> {
    return apiService.put(`/drug-batches/${id}/recall`, data);
  },

  // Delete batch (admin only)
  async deleteBatch(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/drug-batches/${id}`);
  },

  // Get batches by current user
  async getMyBatches(): Promise<ApiResponse<DrugBatch[]>> {
    return apiService.get('/drug-batches?my=true');
  },

  // Get expiring batches
  async getExpiringBatches(days: number = 30): Promise<ApiResponse<DrugBatch[]>> {
    return apiService.get(`/drug-batches?expiring=${days}`);
  },

  // Get recalled batches
  async getRecalledBatches(): Promise<ApiResponse<DrugBatch[]>> {
    return apiService.get('/drug-batches?status=RECALLED');
  }
};