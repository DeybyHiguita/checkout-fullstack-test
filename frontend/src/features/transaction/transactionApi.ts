import { apiClient } from '../../shared/api/client';

export interface Amounts {
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalAmountInCents: number;
  currency: string;
}

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';

export interface TransactionResponse {
  transactionId: string;
  transactionNumber: string;
  status: TransactionStatus;
  amounts: Amounts;
  cardBrand: string | null;
  cardLastFour: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionBody {
  productId: string;
  customer: {
    fullName: string;
    email: string;
    documentType: string;
    documentNumber: string;
    phoneNumber: string;
  };
  delivery: {
    addressLine: string;
    city: string;
    region: string;
    postalCode?: string;
    country?: string;
  };
}

export interface PayBody {
  cardToken: string;
  acceptanceToken: string;
  installments: number;
}

export const transactionApi = {
  create: (body: CreateTransactionBody): Promise<TransactionResponse> =>
    apiClient.post<TransactionResponse>('/transactions', body),
  pay: (id: string, body: PayBody): Promise<TransactionResponse> =>
    apiClient.post<TransactionResponse>(`/transactions/${id}/pay`, body),
  getById: (id: string): Promise<TransactionResponse> =>
    apiClient.get<TransactionResponse>(`/transactions/${id}`),
};
