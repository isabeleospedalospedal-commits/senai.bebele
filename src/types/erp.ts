/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MINI-ERP MANUFATURA - TIPOS E DEFINIÇÕES DO SISTEMA
 * 
 * Sistema de Planejamento e Controle da Produção (PCP) para pequenas indústrias.
 */

// Unidades de medida suportadas para matérias-primas
export type MeasurementUnit = 'un' | 'kg' | 'g' | 'm' | 'cm' | 'm2' | 'l' | 'ml';

export const MEASUREMENT_UNITS: { value: MeasurementUnit; label: string }[] = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'cm', label: 'Centímetro (cm)' },
  { value: 'm2', label: 'Metro Quadrado (m²)' },
  { value: 'l', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
];

// Tipos de Parceiro comercial (Módulo 3)
export type PartnerType = 'client' | 'supplier' | 'both';

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  document: string; // CPF ou CNPJ
  email: string;
  phone: string;
  address?: string;
  city?: string;
  notes?: string;
  createdAt: string;
}

// Matéria-Prima / Insumo (Módulo 2)
export interface RawMaterial {
  id: string;
  code: string; // Ex: MP-001
  name: string;
  unit: MeasurementUnit;
  currentStock: number;
  minStock: number;
  unitCost: number; // Custo unitário em R$
  supplierId?: string; // Fornecedor de referência (Partner.id)
  location?: string; // Prateleira/Localização no estoque
  notes?: string;
  createdAt: string;
}

// Componente da Ficha Técnica (BOM item)
export interface ProductComponent {
  materialId: string;
  quantityNeeded: number; // Quantidade de matéria-prima por unidade do produto
}

// Ficha Técnica do Produto (Módulo 1)
export interface Product {
  id: string;
  code: string; // Ex: PROD-100
  name: string;
  category: string;
  salePrice: number; // Preço de venda sugerido
  processTimeMinutes: number; // Tempo de fabricação (em minutos)
  processTimeUnit: 'unit' | 'batch'; // Por unidade ou por lote
  batchSize?: number; // Tamanho do lote se processTimeUnit == 'batch'
  workCenterId?: string; // Posto de trabalho principal
  components: ProductComponent[]; // Matérias-primas necessárias (BOM)
  notes?: string;
  createdAt: string;
}

// Capacidade Produtiva / Posto de Trabalho / Máquina (Módulo 4)
export interface WorkCenter {
  id: string;
  code: string; // Ex: POSTO-01
  name: string;
  description?: string;
  dailyHours: number; // Horas disponíveis por dia (ex: 8h)
  daysPerWeek: number; // Dias úteis por semana (ex: 5 dias)
  workersCount: number; // Quantidade de operadores ou postos paralelos
  efficiencyPercentage: number; // Eficiência operacional (ex: 85%)
  hourlyCost?: number; // Custo por hora produtiva
  createdAt: string;
}

// Item de Pedido de Venda
export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

// Status do Pedido de Venda (Módulo 5)
export type OrderStatus = 'pending' | 'in_production' | 'completed' | 'delivered' | 'cancelled';

export interface SalesOrder {
  id: string;
  orderNumber: string; // Ex: PED-2026-001
  customerId: string; // Partner.id (cliente)
  orderDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
}

// Status da Ordem de Produção (Módulo 7)
export type ProductionOrderStatus = 'waiting' | 'in_production' | 'paused' | 'completed' | 'cancelled';

// Snapshot do material necessário para a OP
export interface OpMaterialRequirement {
  materialId: string;
  materialName: string;
  materialCode: string;
  unit: MeasurementUnit;
  unitQty: number; // Quantidade por unidade do produto
  totalRequiredQty: number; // Quantidade total para o lote da OP
  stockAvailableAtCreation: number;
  isAvailable: boolean; // se stock >= totalRequired
}

// Ordem de Produção (Módulo 6 & 7)
export interface ProductionOrder {
  id: string;
  opNumber: string; // Ex: OP-2026-001
  orderId?: string; // Vinculado a SalesOrder.id (opcional)
  productId: string; // Product.id
  quantity: number; // Quantidade a produzir
  workCenterId: string; // WorkCenter.id
  scheduledStartDate: string; // YYYY-MM-DD
  scheduledEndDate: string; // YYYY-MM-DD
  estimatedTimeMinutes: number; // Tempo previsto calculado (minutos)
  
  // Acompanhamento real (Módulo 7)
  actualStartDate?: string; // Data/hora real de início (ISO string)
  actualEndDate?: string; // Data/hora real de conclusão (ISO string)
  actualTimeMinutes?: number; // Tempo real decorrido em produção (minutos)
  status: ProductionOrderStatus;
  
  materialsSnapshot: OpMaterialRequirement[];
  stockDeducted: boolean; // Indica se os insumos já foram baixados do estoque
  notes?: string;
  createdAt: string;
}

// Estrutura completa do banco de dados persistido no localStorage
export interface ERPDatabase {
  version: number;
  lastUpdated: string;
  partners: Partner[];
  materials: RawMaterial[];
  products: Product[];
  workCenters: WorkCenter[];
  orders: SalesOrder[];
  productionOrders: ProductionOrder[];
}
