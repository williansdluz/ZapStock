export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  address: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  totalQuantity: number;
  remainingQuantity: number;
  price?: number;
  status: 'active' | 'archived';
}

export enum OrderStatus {
  PENDING = 'Pendente',
  LABEL_GENERATED = 'Etiqueta Gerada',
  SHIPPED = 'Enviado',
  DELIVERED = 'Entregue'
}

export interface Order {
  id: string;
  customerId: string;
  productId: string;
  quantity: number;
  status: OrderStatus;
  notes?: string;
  date: string;
  isPaid: boolean;
}

// Helper types for AI parsing
export interface AIOrderParseResult {
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  productKeywords?: string;
  quantity?: number;
}