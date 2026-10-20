/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MINI-ERP MANUFATURA - DADOS INICIAIS DE DEMONSTRAÇÃO (SEED DATA)
 * 
 * Empresa fictícia: "Artefatos & Design Manufatura Ltda"
 * Setor: Fabricação sob encomenda de mobiliário e luminárias de design industrial.
 */

import { ERPDatabase } from '../types/erp';

export const INITIAL_ERP_DATABASE: ERPDatabase = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  
  // Módulo 3: Clientes e Fornecedores
  partners: [
    {
      id: 'part-01',
      name: 'Restaurante & Café Aurora Paulista',
      type: 'client',
      document: '24.981.332/0001-44',
      email: 'compras@aurorapaulista.com.br',
      phone: '(11) 98455-1234',
      address: 'Alameda Santos, 820 - Jardins',
      city: 'São Paulo - SP',
      notes: 'Cliente corporativo frequente. Exige entregas no período da manhã.',
      createdAt: '2026-09-01T10:00:00Z',
    },
    {
      id: 'part-02',
      name: 'Studio Moura Arquitetura & Interiores',
      type: 'client',
      document: '31.109.845/0001-90',
      email: 'projetos@studiomoura.com',
      phone: '(11) 97120-4321',
      address: 'Rua Fradique Coutinho, 450 - Pinheiros',
      city: 'São Paulo - SP',
      notes: 'Escritório de arquitetura de alto padrão. Projetos sob medida.',
      createdAt: '2026-09-05T14:30:00Z',
    },
    {
      id: 'part-03',
      name: 'Madeireira & Chapas Pinheiros Ltda',
      type: 'supplier',
      document: '08.432.119/0001-18',
      email: 'vendas@madeireirapinheiros.ind.br',
      phone: '(11) 3211-7788',
      address: 'Av. das Nações Unidas, 4500',
      city: 'São Paulo - SP',
      notes: 'Fornecedor principal de pranchas de madeira maciça e compensados certificados FSC.',
      createdAt: '2026-08-15T09:00:00Z',
    },
    {
      id: 'part-04',
      name: 'Metalúrgica & Perfis Industrial Ltda',
      type: 'both',
      document: '15.670.321/0001-05',
      email: 'contato@metalurgicaperfis.com.br',
      phone: '(11) 2940-5566',
      address: 'Rodovia Anhanguera, Km 22',
      city: 'Osasco - SP',
      notes: 'Fornece tubos e perfis de aço carbono; também contrata nossos serviços de pintura.',
      createdAt: '2026-08-18T11:20:00Z',
    },
  ],

  // Módulo 2: Cadastro de Matéria-Prima
  materials: [
    {
      id: 'mat-01',
      code: 'MP-MAD-01',
      name: 'Prancha de Madeira Maciça Freijó 2x20cm',
      unit: 'm',
      currentStock: 45.0,
      minStock: 20.0,
      unitCost: 85.0,
      supplierId: 'part-03',
      location: 'Galpão A - Prateleira 01',
      notes: 'Madeira seca em estufa com teor de umidade inferior a 12%.',
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      id: 'mat-02',
      code: 'MP-MET-02',
      name: 'Tubo de Aço Carbono Quadrado 30x30mm 1.5mm',
      unit: 'm',
      currentStock: 62.0,
      minStock: 30.0,
      unitCost: 28.5,
      supplierId: 'part-04',
      location: 'Galpão B - Racks de Perfis',
      notes: 'Barras de 6 metros cortadas conforme plano de corte.',
      createdAt: '2026-09-01T08:15:00Z',
    },
    {
      id: 'mat-03',
      code: 'MP-QUI-03',
      name: 'Verniz Poliuretano Acetinado UV',
      unit: 'l',
      currentStock: 14.5,
      minStock: 8.0,
      unitCost: 55.0,
      supplierId: 'part-04',
      location: 'Cabine de Pintura - Armário Químicos',
      notes: 'Acabamento premium toque sedoso, secagem rápida.',
      createdAt: '2026-09-01T08:30:00Z',
    },
    {
      id: 'mat-04',
      code: 'MP-FIX-04',
      name: 'Parafuso Allen Cabeça Cilíndrica Inox M6x40',
      unit: 'un',
      currentStock: 280,
      minStock: 100,
      unitCost: 1.2,
      supplierId: 'part-04',
      location: 'Almoxarifado - Gaveta 14',
      notes: 'Aço inoxidável 304 para montagem estrutural aparente.',
      createdAt: '2026-09-01T08:45:00Z',
    },
    {
      id: 'mat-05',
      code: 'MP-ELE-05',
      name: 'Fita LED Cob 3000K Branco Quente 12V',
      unit: 'm',
      currentStock: 25.0,
      minStock: 15.0,
      unitCost: 32.0,
      supplierId: 'part-04',
      location: 'Almoxarifado - Eletrônicos',
      notes: 'Alto índice de reprodução de cor (IRC > 90) para luminárias.',
      createdAt: '2026-09-02T09:00:00Z',
    },
    {
      id: 'mat-06',
      code: 'MP-ACA-06',
      name: 'Sapatilha de Borracha NBR Antirrisco 30x30mm',
      unit: 'un',
      currentStock: 18, // Estoque baixo para demonstração de alerta!
      minStock: 50,
      unitCost: 2.5,
      supplierId: 'part-04',
      location: 'Almoxarifado - Gaveta 22',
      notes: 'Item de acabamento para pés de mesas e banquetas.',
      createdAt: '2026-09-02T09:15:00Z',
    },
  ],

  // Módulo 4: Capacidade Produtiva (Postos de Trabalho / Máquinas)
  workCenters: [
    {
      id: 'wc-01',
      code: 'PCP-MARC-01',
      name: 'Marcenaria & Usinagem de Madeira',
      description: 'Esquadrejadeira, tupia de coluna e bancadas de lixamento.',
      dailyHours: 8,
      daysPerWeek: 5,
      workersCount: 2,
      efficiencyPercentage: 85, // 8h * 5d * 2 op * 0.85 = 68 horas úteis/semana
      hourlyCost: 75.0,
      createdAt: '2026-09-01T07:00:00Z',
    },
    {
      id: 'wc-02',
      code: 'PCP-SERR-02',
      name: 'Serralheria & Solda TIG/MIG',
      description: 'Serra fita para corte de metais, bancada de solda e esmerilhamento.',
      dailyHours: 8,
      daysPerWeek: 5,
      workersCount: 1,
      efficiencyPercentage: 80, // 8h * 5d * 1 op * 0.80 = 32 horas úteis/semana
      hourlyCost: 85.0,
      createdAt: '2026-09-01T07:15:00Z',
    },
    {
      id: 'wc-03',
      code: 'PCP-PINT-03',
      name: 'Pintura, Acabamento & Montagem Final',
      description: 'Cabine de pintura eletrostática/verniz e bancada de embalagem e expedição.',
      dailyHours: 8,
      daysPerWeek: 5,
      workersCount: 2,
      efficiencyPercentage: 90, // 8h * 5d * 2 op * 0.90 = 72 horas úteis/semana
      hourlyCost: 65.0,
      createdAt: '2026-09-01T07:30:00Z',
    },
  ],

  // Módulo 1: Ficha Técnica do Produto (BOM)
  products: [
    {
      id: 'prod-01',
      code: 'PRD-MESA-01',
      name: 'Mesa de Jantar Industrial Freijó & Aço (1,80m x 0,90m)',
      category: 'Mesas & Bancadas',
      salePrice: 2850.0,
      processTimeMinutes: 240, // 4 horas por unidade (usado no PCP)
      processTimeUnit: 'unit',
      workCenterId: 'wc-01',
      components: [
        { materialId: 'mat-01', quantityNeeded: 4.8 }, // 4.8 metros de madeira Freijó
        { materialId: 'mat-02', quantityNeeded: 8.2 }, // 8.2 metros de tubo de aço
        { materialId: 'mat-03', quantityNeeded: 0.6 }, // 0.6 litros de verniz PU
        { materialId: 'mat-04', quantityNeeded: 16 }, // 16 parafusos Allen
        { materialId: 'mat-06', quantityNeeded: 4 }, // 4 sapatilhas de borracha
      ],
      notes: 'Tampo maciço chanfrado e base metálica com pintura epóxi fosca.',
      createdAt: '2026-09-05T09:00:00Z',
    },
    {
      id: 'prod-02',
      code: 'PRD-BANQ-02',
      name: 'Banqueta Alta Bistrô Assento Freijó',
      category: 'Cadeiras & Assentos',
      salePrice: 620.0,
      processTimeMinutes: 75, // 1h15 por unidade
      processTimeUnit: 'unit',
      workCenterId: 'wc-02',
      components: [
        { materialId: 'mat-01', quantityNeeded: 1.2 },
        { materialId: 'mat-02', quantityNeeded: 3.8 },
        { materialId: 'mat-03', quantityNeeded: 0.15 },
        { materialId: 'mat-04', quantityNeeded: 8 },
        { materialId: 'mat-06', quantityNeeded: 4 },
      ],
      notes: 'Altura do assento 75cm para bancadas padrão de 105cm.',
      createdAt: '2026-09-05T10:00:00Z',
    },
    {
      id: 'prod-03',
      code: 'PRD-LUMI-03',
      name: 'Luminária Pendente Linear Minimalista 1,20m',
      category: 'Iluminação',
      salePrice: 890.0,
      processTimeMinutes: 60, // 1 hora por unidade
      processTimeUnit: 'unit',
      workCenterId: 'wc-03',
      components: [
        { materialId: 'mat-02', quantityNeeded: 1.4 },
        { materialId: 'mat-05', quantityNeeded: 1.2 }, // 1.2m de fita LED
        { materialId: 'mat-03', quantityNeeded: 0.1 },
        { materialId: 'mat-04', quantityNeeded: 6 },
      ],
      notes: 'Driver bivolt embutido na canopla de teto.',
      createdAt: '2026-09-06T11:00:00Z',
    },
  ],

  // Módulo 5: Cadastro de Pedidos de Venda
  orders: [
    {
      id: 'ped-01',
      orderNumber: 'PED-2026-001',
      customerId: 'part-01', // Restaurante Aurora
      orderDate: '2026-10-10',
      deliveryDate: '2026-10-28',
      items: [
        { id: 'item-01', productId: 'prod-01', quantity: 2, unitPrice: 2850.0 },
        { id: 'item-02', productId: 'prod-02', quantity: 6, unitPrice: 620.0 },
      ],
      totalAmount: 9420.0,
      status: 'in_production',
      notes: 'Entregar e montar no local no dia 28/10 antes da inauguração do café.',
      createdAt: '2026-10-10T14:00:00Z',
    },
    {
      id: 'ped-02',
      orderNumber: 'PED-2026-002',
      customerId: 'part-02', // Studio Moura
      orderDate: '2026-10-15',
      deliveryDate: '2026-11-05',
      items: [
        { id: 'item-03', productId: 'prod-03', quantity: 3, unitPrice: 890.0 },
      ],
      totalAmount: 2670.0,
      status: 'pending',
      notes: 'Aguardando validação da voltagem do imóvel pelo arquiteto.',
      createdAt: '2026-10-15T16:20:00Z',
    },
  ],

  // Módulo 6 & 7: Ordens de Produção & Acompanhamento
  productionOrders: [
    {
      id: 'op-01',
      opNumber: 'OP-2026-001',
      orderId: 'ped-01',
      productId: 'prod-01', // Mesa de Jantar
      quantity: 2,
      workCenterId: 'wc-01',
      scheduledStartDate: '2026-10-12',
      scheduledEndDate: '2026-10-16',
      estimatedTimeMinutes: 480, // 2 un * 240 min = 480 min (8 horas)
      actualStartDate: '2026-10-12T08:30:00Z',
      actualEndDate: '2026-10-15T15:45:00Z',
      actualTimeMinutes: 450, // 7h30 (30 min adiantado em relação ao previsto)
      status: 'completed',
      stockDeducted: true,
      notes: 'Produção executada com sucesso. Qualidade do freijó excelente.',
      materialsSnapshot: [
        { materialId: 'mat-01', materialName: 'Prancha de Madeira Maciça Freijó 2x20cm', materialCode: 'MP-MAD-01', unit: 'm', unitQty: 4.8, totalRequiredQty: 9.6, stockAvailableAtCreation: 54.6, isAvailable: true },
        { materialId: 'mat-02', materialName: 'Tubo de Aço Carbono Quadrado 30x30mm 1.5mm', materialCode: 'MP-MET-02', unit: 'm', unitQty: 8.2, totalRequiredQty: 16.4, stockAvailableAtCreation: 78.4, isAvailable: true },
        { materialId: 'mat-03', materialName: 'Verniz Poliuretano Acetinado UV', materialCode: 'MP-QUI-03', unit: 'l', unitQty: 0.6, totalRequiredQty: 1.2, stockAvailableAtCreation: 15.7, isAvailable: true },
        { materialId: 'mat-04', materialName: 'Parafuso Allen Cabeça Cilíndrica Inox M6x40', materialCode: 'MP-FIX-04', unit: 'un', unitQty: 16, totalRequiredQty: 32, stockAvailableAtCreation: 312, isAvailable: true },
        { materialId: 'mat-06', materialName: 'Sapatilha de Borracha NBR Antirrisco 30x30mm', materialCode: 'MP-ACA-06', unit: 'un', unitQty: 4, totalRequiredQty: 8, stockAvailableAtCreation: 26, isAvailable: true },
      ],
      createdAt: '2026-10-11T09:00:00Z',
    },
    {
      id: 'op-02',
      opNumber: 'OP-2026-002',
      orderId: 'ped-01',
      productId: 'prod-02', // Banquetas
      quantity: 6,
      workCenterId: 'wc-02',
      scheduledStartDate: '2026-10-18',
      scheduledEndDate: '2026-10-24',
      estimatedTimeMinutes: 450, // 6 un * 75 min = 450 min (7.5 horas)
      actualStartDate: '2026-10-19T08:00:00Z',
      actualEndDate: undefined,
      actualTimeMinutes: 210, // 3h30 já decorridas em produção
      status: 'in_production',
      stockDeducted: true,
      notes: 'Em fase de soldagem da estrutura tubular metálica.',
      materialsSnapshot: [
        { materialId: 'mat-01', materialName: 'Prancha de Madeira Maciça Freijó 2x20cm', materialCode: 'MP-MAD-01', unit: 'm', unitQty: 1.2, totalRequiredQty: 7.2, stockAvailableAtCreation: 45.0, isAvailable: true },
        { materialId: 'mat-02', materialName: 'Tubo de Aço Carbono Quadrado 30x30mm 1.5mm', materialCode: 'MP-MET-02', unit: 'm', unitQty: 3.8, totalRequiredQty: 22.8, stockAvailableAtCreation: 62.0, isAvailable: true },
        { materialId: 'mat-03', materialName: 'Verniz Poliuretano Acetinado UV', materialCode: 'MP-QUI-03', unit: 'l', unitQty: 0.15, totalRequiredQty: 0.9, stockAvailableAtCreation: 14.5, isAvailable: true },
        { materialId: 'mat-04', materialName: 'Parafuso Allen Cabeça Cilíndrica Inox M6x40', materialCode: 'MP-FIX-04', unit: 'un', unitQty: 8, totalRequiredQty: 48, stockAvailableAtCreation: 280, isAvailable: true },
        { materialId: 'mat-06', materialName: 'Sapatilha de Borracha NBR Antirrisco 30x30mm', materialCode: 'MP-ACA-06', unit: 'un', unitQty: 4, totalRequiredQty: 24, stockAvailableAtCreation: 18, isAvailable: false },
      ],
      createdAt: '2026-10-16T10:00:00Z',
    },
    {
      id: 'op-03',
      opNumber: 'OP-2026-003',
      orderId: 'ped-02',
      productId: 'prod-03', // Luminárias
      quantity: 3,
      workCenterId: 'wc-03',
      scheduledStartDate: '2026-10-25',
      scheduledEndDate: '2026-10-27',
      estimatedTimeMinutes: 180, // 3 un * 60 min = 180 min (3 horas)
      status: 'waiting',
      stockDeducted: false,
      notes: 'Aguardando liberação do cliente para iniciar corte e montagem dos circuitos.',
      materialsSnapshot: [
        { materialId: 'mat-02', materialName: 'Tubo de Aço Carbono Quadrado 30x30mm 1.5mm', materialCode: 'MP-MET-02', unit: 'm', unitQty: 1.4, totalRequiredQty: 4.2, stockAvailableAtCreation: 62.0, isAvailable: true },
        { materialId: 'mat-05', materialName: 'Fita LED Cob 3000K Branco Quente 12V', materialCode: 'MP-ELE-05', unit: 'm', unitQty: 1.2, totalRequiredQty: 3.6, stockAvailableAtCreation: 25.0, isAvailable: true },
        { materialId: 'mat-03', materialName: 'Verniz Poliuretano Acetinado UV', materialCode: 'MP-QUI-03', unit: 'l', unitQty: 0.1, totalRequiredQty: 0.3, stockAvailableAtCreation: 14.5, isAvailable: true },
        { materialId: 'mat-04', materialName: 'Parafuso Allen Cabeça Cilíndrica Inox M6x40', materialCode: 'MP-FIX-04', unit: 'un', unitQty: 6, totalRequiredQty: 18, stockAvailableAtCreation: 280, isAvailable: true },
      ],
      createdAt: '2026-10-18T11:00:00Z',
    },
  ],
};
