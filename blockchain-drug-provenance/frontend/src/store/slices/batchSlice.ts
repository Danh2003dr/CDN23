import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DrugBatch, BatchForm, TransferForm } from '../../types';
import { batchService } from '../../services/batchService';

interface BatchState {
  batches: DrugBatch[];
  currentBatch: DrugBatch | null;
  supplyChainHistory: any[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  filters: {
    status?: string;
    manufacturer?: string;
    drugName?: string;
    expiryDateFrom?: string;
    expiryDateTo?: string;
  };
}

// Async thunks
export const fetchBatches = createAsyncThunk(
  'batch/fetchBatches',
  async (params?: any, { rejectWithValue }) => {
    try {
      const response = await batchService.getBatches(params);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to fetch batches');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchBatch = createAsyncThunk(
  'batch/fetchBatch',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await batchService.getBatch(id);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to fetch batch');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchBatchByCode = createAsyncThunk(
  'batch/fetchBatchByCode',
  async (batchCode: string, { rejectWithValue }) => {
    try {
      const response = await batchService.getBatchByCode(batchCode);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Batch not found');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createBatch = createAsyncThunk(
  'batch/createBatch',
  async (batchData: BatchForm, { rejectWithValue }) => {
    try {
      const response = await batchService.createBatch(batchData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to create batch');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateBatch = createAsyncThunk(
  'batch/updateBatch',
  async ({ id, batchData }: { id: string; batchData: Partial<BatchForm> }, { rejectWithValue }) => {
    try {
      const response = await batchService.updateBatch(id, batchData);
      if (response.success && response.data) {
        return response.data.batch;
      }
      throw new Error('Failed to update batch');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const transferBatch = createAsyncThunk(
  'batch/transferBatch',
  async ({ id, transferData }: { id: string; transferData: TransferForm }, { rejectWithValue }) => {
    try {
      const response = await batchService.transferBatch(id, transferData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to transfer batch');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const verifyBatch = createAsyncThunk(
  'batch/verifyBatch',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await batchService.verifyBatch(id);
      if (response.success && response.data) {
        return response.data.batch;
      }
      throw new Error('Failed to verify batch');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const recallBatch = createAsyncThunk(
  'batch/recallBatch',
  async ({ id, data }: { id: string; data: { reason: string; severity: string } }, { rejectWithValue }) => {
    try {
      const response = await batchService.recallBatch(id, data);
      if (response.success && response.data) {
        return response.data.batch;
      }
      throw new Error('Failed to recall batch');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteBatch = createAsyncThunk(
  'batch/deleteBatch',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await batchService.deleteBatch(id);
      if (response.success) {
        return id;
      }
      throw new Error('Failed to delete batch');
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState: BatchState = {
  batches: [],
  currentBatch: null,
  supplyChainHistory: [],
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
  },
  filters: {},
};

// Slice
const batchSlice = createSlice({
  name: 'batch',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentBatch: (state) => {
      state.currentBatch = null;
      state.supplyChainHistory = [];
    },
    setFilters: (state, action: PayloadAction<BatchState['filters']>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setBatches: (state, action: PayloadAction<DrugBatch[]>) => {
      state.batches = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Batches
      .addCase(fetchBatches.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.batches = action.payload.batches || action.payload.items || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
        state.error = null;
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Single Batch
      .addCase(fetchBatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBatch = action.payload.batch;
        state.supplyChainHistory = action.payload.supplyChain || [];
        state.error = null;
      })
      .addCase(fetchBatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Batch by Code
      .addCase(fetchBatchByCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBatchByCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBatch = action.payload.batch;
        state.supplyChainHistory = action.payload.supplyChain || [];
        state.error = null;
      })
      .addCase(fetchBatchByCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create Batch
      .addCase(createBatch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBatch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.batches.unshift(action.payload.batch);
        state.currentBatch = action.payload.batch;
        state.error = null;
      })
      .addCase(createBatch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update Batch
      .addCase(updateBatch.fulfilled, (state, action) => {
        const index = state.batches.findIndex(batch => batch.id === action.payload.id);
        if (index !== -1) {
          state.batches[index] = action.payload;
        }
        if (state.currentBatch?.id === action.payload.id) {
          state.currentBatch = action.payload;
        }
      })
      
      // Transfer Batch
      .addCase(transferBatch.fulfilled, (state, action) => {
        const index = state.batches.findIndex(batch => batch.id === action.payload.batch.id);
        if (index !== -1) {
          state.batches[index] = action.payload.batch;
        }
        if (state.currentBatch?.id === action.payload.batch.id) {
          state.currentBatch = action.payload.batch;
        }
      })
      
      // Verify Batch
      .addCase(verifyBatch.fulfilled, (state, action) => {
        const index = state.batches.findIndex(batch => batch.id === action.payload.id);
        if (index !== -1) {
          state.batches[index] = action.payload;
        }
        if (state.currentBatch?.id === action.payload.id) {
          state.currentBatch = action.payload;
        }
      })
      
      // Recall Batch
      .addCase(recallBatch.fulfilled, (state, action) => {
        const index = state.batches.findIndex(batch => batch.id === action.payload.id);
        if (index !== -1) {
          state.batches[index] = action.payload;
        }
        if (state.currentBatch?.id === action.payload.id) {
          state.currentBatch = action.payload;
        }
      })
      
      // Delete Batch
      .addCase(deleteBatch.fulfilled, (state, action) => {
        state.batches = state.batches.filter(batch => batch.id !== action.payload);
        if (state.currentBatch?.id === action.payload) {
          state.currentBatch = null;
        }
      });
  },
});

export const { clearError, clearCurrentBatch, setFilters, clearFilters, setBatches } = batchSlice.actions;
export default batchSlice.reducer;