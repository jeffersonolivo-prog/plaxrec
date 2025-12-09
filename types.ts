
export enum UserRole {
  GUEST = 'VISITANTE', // Novo usuário que ainda não escolheu perfil
  COLLECTOR = 'COLETOR',
  RECYCLER = 'RECICLADOR',
  TRANSFORMER = 'TRANSFORMADOR',
  ESG_BUYER = 'COMPRADOR_ESG',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  balancePlax: number; // Available Plax
  balanceBRL: number; // Available Real
  lockedPlax: number; // For Recycler/Transformer before NFe
}

export enum PlasticType {
  PET = 'PET',
  HDPE = 'PEAD',
  PVC = 'PVC',
  LDPE = 'PEBD',
  PP = 'PP',
  PS = 'PS',
}

export interface Transaction {
  id: string;
  date: string;
  type: 'COLLECTION' | 'NFE_RELEASE' | 'ESG_PURCHASE' | 'WITHDRAWAL' | 'TRANSFER' | 'DEPOSIT';
  amountPlax?: number;
  amountBRL?: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'LOCKED';
  fromUserId?: string;
  toUserId?: string;
}

export interface CollectionBatch {
  id: string;
  collectorId: string;
  recyclerId: string;
  weightKg: number;
  plasticType: PlasticType;
  plaxGenerated: number;
  date: string;
  status: 'RECEIVED' | 'PROCESSED_NFE' | 'CERTIFIED_SOLD';
  nfeId?: string;
  certifiedByUserId?: string; // The ESG buyer who bought this lot
  certificationDate?: string;
}

// Current Exchange Rate (Mock)
export const PLAX_TO_BRL_RATE = 0.50; // 1 Plax = R$ 0.50
export const KG_TO_PLAX_RATE = 10; // 1 kg = 10 Plax
export const ESG_CREDIT_PRICE_PER_KG = 2.00; // Price ESG buyer pays per Kg of certified plastic
