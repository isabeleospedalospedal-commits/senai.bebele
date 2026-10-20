/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * JUSTIFICATIVA TÉCNICA DA ESCOLHA DE PERSISTÊNCIA (REQUISITO DO SISTEMA):
 * ============================================================================
 * Para este mini-ERP de manufatura, foi adotado o `localStorage` do navegador,
 * estruturado com esquema de dados tipado em TypeScript, versionamento e
 * camada de serviço reativa via eventos customizados (`erp-data-updated`).
 * 
 * Principais motivos da escolha:
 * 1. Autonomia & Zero Latência: Funciona imediatamente no navegador sem
 *    exigir configuração de servidor de banco de dados, credenciais ou conexões.
 * 2. Persistência Completa entre Sessões: Mantém cadastros, pedidos e ordens
 *    de produção salvos mesmo após fechar o navegador ou reiniciar a máquina.
 * 3. Integridade e Backup: Permite exportar e importar cópias de segurança (JSON)
 *    e restaurar dados de demonstração a qualquer momento com 1 clique.
 * 4. Baixa complexidade arquitetural: Garante facilidade de manutenção e
 *    execução direta na interface de planejamento da pequena indústria.
 * ============================================================================
 */

import { INITIAL_ERP_DATABASE } from '../data/initialData';
import {
  ERPDatabase,
  Partner,
  RawMaterial,
  Product,
  WorkCenter,
  SalesOrder,
  ProductionOrder,
  ProductionOrderStatus,
  OrderStatus,
  OpMaterialRequirement,
} from '../types/erp';

const STORAGE_KEY = 'mini_erp_manufatura_db_v1';
const EVENT_NAME = 'erp-data-updated';

class StorageService {
  /**
   * Obtém a base de dados do localStorage ou inicializa com dados de demonstração.
   */
  public getDatabase(): ERPDatabase {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        this.saveDatabase(INITIAL_ERP_DATABASE, false);
        return INITIAL_ERP_DATABASE;
      }
      const parsed: ERPDatabase = JSON.parse(stored);
      // Garantir compatibilidade com campos novos se houver
      if (!parsed.version) {
        this.saveDatabase(INITIAL_ERP_DATABASE, false);
        return INITIAL_ERP_DATABASE;
      }
      return parsed;
    } catch (err) {
      console.error('Erro ao ler dados do localStorage:', err);
      return INITIAL_ERP_DATABASE;
    }
  }

  /**
   * Salva a base completa no localStorage e dispara evento para atualização da UI.
   */
  public saveDatabase(db: ERPDatabase, notify: boolean = true): void {
    try {
      db.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      if (notify && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: db }));
      }
    } catch (err) {
      console.error('Erro ao gravar dados no localStorage:', err);
    }
  }

  /**
   * Registra um listener para quando os dados forem alterados no sistema.
   */
  public subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }

  /**
   * Restaura o banco de dados para os dados iniciais de demonstração.
   */
  public resetToInitial(): void {
    this.saveDatabase(INITIAL_ERP_DATABASE);
  }

  /**
   * Exporta todo o banco de dados em formato JSON para download.
   */
  public exportJSON(): string {
    const db = this.getDatabase();
    return JSON.stringify(db, null, 2);
  }

  /**
   * Importa um arquivo JSON de backup validando o conteúdo.
   */
  public importJSON(jsonText: string): boolean {
    try {
      const parsed = JSON.parse(jsonText);
      if (
        Array.isArray(parsed.partners) &&
        Array.isArray(parsed.materials) &&
        Array.isArray(parsed.products) &&
        Array.isArray(parsed.workCenters)
      ) {
        this.saveDatabase(parsed);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Falha ao importar backup JSON:', err);
      return false;
    }
  }

  // ==========================================
  // MÓDULO 3: CLIENTES E FORNECEDORES (PARCEIROS)
  // ==========================================
  public getPartners(): Partner[] {
    return this.getDatabase().partners || [];
  }

  public savePartner(partner: Omit<Partner, 'id' | 'createdAt'> & { id?: string }): Partner {
    const db = this.getDatabase();
    if (partner.id) {
      // Atualizar existente
      const index = db.partners.findIndex((p) => p.id === partner.id);
      if (index !== -1) {
        const updated: Partner = {
          ...db.partners[index],
          ...partner,
          id: partner.id,
        };
        db.partners[index] = updated;
        this.saveDatabase(db);
        return updated;
      }
    }
    // Criar novo
    const newPartner: Partner = {
      ...partner,
      id: `part-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.partners.push(newPartner);
    this.saveDatabase(db);
    return newPartner;
  }

  public deletePartner(id: string): { success: boolean; error?: string } {
    const db = this.getDatabase();
    // Validar se há pedidos vinculados
    const hasOrders = db.orders.some((o) => o.customerId === id);
    if (hasOrders) {
      return { success: false, error: 'Não é possível excluir: parceiro possui pedidos de venda vinculados.' };
    }
    // Validar se há matérias-primas vinculadas
    const hasMaterials = db.materials.some((m) => m.supplierId === id);
    if (hasMaterials) {
      return { success: false, error: 'Não é possível excluir: parceiro é fornecedor de matérias-primas cadastradas.' };
    }
    db.partners = db.partners.filter((p) => p.id !== id);
    this.saveDatabase(db);
    return { success: true };
  }

  // ==========================================
  // MÓDULO 2: CADASTRO DE MATÉRIA-PRIMA
  // ==========================================
  public getMaterials(): RawMaterial[] {
    return this.getDatabase().materials || [];
  }

  public saveMaterial(mat: Omit<RawMaterial, 'id' | 'createdAt'> & { id?: string }): RawMaterial {
    const db = this.getDatabase();
    if (mat.id) {
      const index = db.materials.findIndex((m) => m.id === mat.id);
      if (index !== -1) {
        const updated: RawMaterial = {
          ...db.materials[index],
          ...mat,
          id: mat.id,
        };
        db.materials[index] = updated;
        this.saveDatabase(db);
        return updated;
      }
    }
    const newMaterial: RawMaterial = {
      ...mat,
      id: `mat-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.materials.push(newMaterial);
    this.saveDatabase(db);
    return newMaterial;
  }

  public deleteMaterial(id: string): { success: boolean; error?: string } {
    const db = this.getDatabase();
    // Validar se a matéria-prima é usada em alguma Ficha Técnica de Produto
    const usedInProduct = db.products.some((p) => p.components.some((c) => c.materialId === id));
    if (usedInProduct) {
      return {
        success: false,
        error: 'Esta matéria-prima está cadastrada na Ficha Técnica de um ou mais produtos. Remova-a das fichas antes de excluir.',
      };
    }
    db.materials = db.materials.filter((m) => m.id !== id);
    this.saveDatabase(db);
    return { success: true };
  }

  public adjustStock(id: string, delta: number): void {
    const db = this.getDatabase();
    const item = db.materials.find((m) => m.id === id);
    if (item) {
      item.currentStock = Math.max(0, Math.round((item.currentStock + delta) * 100) / 100);
      this.saveDatabase(db);
    }
  }

  // ==========================================
  // MÓDULO 4: CAPACIDADE PRODUTIVA (POSTOS DE TRABALHO)
  // ==========================================
  public getWorkCenters(): WorkCenter[] {
    return this.getDatabase().workCenters || [];
  }

  public saveWorkCenter(wc: Omit<WorkCenter, 'id' | 'createdAt'> & { id?: string }): WorkCenter {
    const db = this.getDatabase();
    if (wc.id) {
      const index = db.workCenters.findIndex((w) => w.id === wc.id);
      if (index !== -1) {
        const updated: WorkCenter = {
          ...db.workCenters[index],
          ...wc,
          id: wc.id,
        };
        db.workCenters[index] = updated;
        this.saveDatabase(db);
        return updated;
      }
    }
    const newWc: WorkCenter = {
      ...wc,
      id: `wc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.workCenters.push(newWc);
    this.saveDatabase(db);
    return newWc;
  }

  public deleteWorkCenter(id: string): { success: boolean; error?: string } {
    const db = this.getDatabase();
    const usedInProduct = db.products.some((p) => p.workCenterId === id);
    if (usedInProduct) {
      return { success: false, error: 'Posto vinculado a produtos cadastrados. Altere o posto no produto antes de excluir.' };
    }
    const usedInOP = db.productionOrders.some((op) => op.workCenterId === id && op.status !== 'completed' && op.status !== 'cancelled');
    if (usedInOP) {
      return { success: false, error: 'Há Ordens de Produção em andamento ou agendadas vinculadas a este posto.' };
    }
    db.workCenters = db.workCenters.filter((w) => w.id !== id);
    this.saveDatabase(db);
    return { success: true };
  }

  // ==========================================
  // MÓDULO 1: FICHA TÉCNICA DO PRODUTO (BOM)
  // ==========================================
  public getProducts(): Product[] {
    return this.getDatabase().products || [];
  }

  public saveProduct(prod: Omit<Product, 'id' | 'createdAt'> & { id?: string }): Product {
    const db = this.getDatabase();
    if (prod.id) {
      const index = db.products.findIndex((p) => p.id === prod.id);
      if (index !== -1) {
        const updated: Product = {
          ...db.products[index],
          ...prod,
          id: prod.id,
        };
        db.products[index] = updated;
        this.saveDatabase(db);
        return updated;
      }
    }
    const newProduct: Product = {
      ...prod,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.products.push(newProduct);
    this.saveDatabase(db);
    return newProduct;
  }

  public deleteProduct(id: string): { success: boolean; error?: string } {
    const db = this.getDatabase();
    const usedInOrder = db.orders.some((o) => o.items.some((i) => i.productId === id));
    if (usedInOrder) {
      return { success: false, error: 'Produto vinculado a Pedidos de Venda cadastrados.' };
    }
    const usedInOP = db.productionOrders.some((op) => op.productId === id);
    if (usedInOP) {
      return { success: false, error: 'Produto vinculado a Ordens de Produção no histórico.' };
    }
    db.products = db.products.filter((p) => p.id !== id);
    this.saveDatabase(db);
    return { success: true };
  }

  // ==========================================
  // MÓDULO 5: CADASTRO DE PEDIDOS DE VENDA
  // ==========================================
  public getOrders(): SalesOrder[] {
    return this.getDatabase().orders || [];
  }

  public saveOrder(order: Omit<SalesOrder, 'id' | 'createdAt'> & { id?: string }): SalesOrder {
    const db = this.getDatabase();
    if (order.id) {
      const index = db.orders.findIndex((o) => o.id === order.id);
      if (index !== -1) {
        const updated: SalesOrder = {
          ...db.orders[index],
          ...order,
          id: order.id,
        };
        db.orders[index] = updated;
        this.saveDatabase(db);
        return updated;
      }
    }
    // Gerar número de pedido sequencial se não informado
    const count = db.orders.length + 1;
    const generatedNumber = `PED-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
    const newOrder: SalesOrder = {
      ...order,
      orderNumber: order.orderNumber?.trim() || generatedNumber,
      id: `ped-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.orders.push(newOrder);
    this.saveDatabase(db);
    return newOrder;
  }

  public updateOrderStatus(id: string, status: OrderStatus): void {
    const db = this.getDatabase();
    const order = db.orders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      this.saveDatabase(db);
    }
  }

  public deleteOrder(id: string): { success: boolean; error?: string } {
    const db = this.getDatabase();
    const hasActiveOP = db.productionOrders.some(
      (op) => op.orderId === id && op.status !== 'completed' && op.status !== 'cancelled'
    );
    if (hasActiveOP) {
      return { success: false, error: 'Não é possível excluir: existem Ordens de Produção ativas vinculadas a este pedido.' };
    }
    db.orders = db.orders.filter((o) => o.id !== id);
    this.saveDatabase(db);
    return { success: true };
  }

  // ==========================================
  // MÓDULOS 6 & 7: ORDENS DE PRODUÇÃO (OP) & ACOMPANHAMENTO
  // ==========================================
  public getProductionOrders(): ProductionOrder[] {
    return this.getDatabase().productionOrders || [];
  }

  /**
   * Calcula o snapshot dos materiais necessários para uma quantidade de produto.
   */
  public calculateMaterialsSnapshot(productId: string, quantity: number): OpMaterialRequirement[] {
    const db = this.getDatabase();
    const product = db.products.find((p) => p.id === productId);
    if (!product) return [];

    return product.components.map((c) => {
      const mat = db.materials.find((m) => m.id === c.materialId);
      const unitQty = c.quantityNeeded;
      const totalRequiredQty = Math.round(unitQty * quantity * 100) / 100;
      const stock = mat ? mat.currentStock : 0;
      return {
        materialId: c.materialId,
        materialName: mat ? mat.name : 'Matéria-prima desconhecida',
        materialCode: mat ? mat.code : 'N/A',
        unit: mat ? mat.unit : 'un',
        unitQty,
        totalRequiredQty,
        stockAvailableAtCreation: stock,
        isAvailable: stock >= totalRequiredQty,
      };
    });
  }

  /**
   * Emite uma Ordem de Produção a partir de um produto ou item de pedido.
   */
  public emitProductionOrder(data: {
    orderId?: string;
    productId: string;
    quantity: number;
    workCenterId: string;
    scheduledStartDate: string;
    scheduledEndDate: string;
    notes?: string;
  }): ProductionOrder {
    const db = this.getDatabase();
    const product = db.products.find((p) => p.id === data.productId);
    if (!product) throw new Error('Produto não encontrado');

    // Calcular tempo previsto
    let estimatedTimeMinutes = 0;
    if (product.processTimeUnit === 'unit') {
      estimatedTimeMinutes = Math.round(product.processTimeMinutes * data.quantity);
    } else {
      const batchSize = product.batchSize && product.batchSize > 0 ? product.batchSize : 1;
      const batches = Math.ceil(data.quantity / batchSize);
      estimatedTimeMinutes = Math.round(product.processTimeMinutes * batches);
    }

    const materialsSnapshot = this.calculateMaterialsSnapshot(data.productId, data.quantity);

    const count = db.productionOrders.length + 1;
    const opNumber = `OP-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const newOP: ProductionOrder = {
      id: `op-${Date.now()}`,
      opNumber,
      orderId: data.orderId,
      productId: data.productId,
      quantity: data.quantity,
      workCenterId: data.workCenterId,
      scheduledStartDate: data.scheduledStartDate,
      scheduledEndDate: data.scheduledEndDate,
      estimatedTimeMinutes,
      status: 'waiting',
      materialsSnapshot,
      stockDeducted: false,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    db.productionOrders.push(newOP);

    // Se a OP está vinculada a um pedido, atualizar status do pedido para 'in_production' se estava 'pending'
    if (data.orderId) {
      const order = db.orders.find((o) => o.id === data.orderId);
      if (order && order.status === 'pending') {
        order.status = 'in_production';
      }
    }

    this.saveDatabase(db);
    return newOP;
  }

  public saveProductionOrder(op: Omit<ProductionOrder, 'id' | 'createdAt'> & { id?: string }): ProductionOrder {
    const db = this.getDatabase();
    if (op.id) {
      const index = db.productionOrders.findIndex((p) => p.id === op.id);
      if (index !== -1) {
        const updated: ProductionOrder = {
          ...db.productionOrders[index],
          ...op,
          id: op.id,
        };
        db.productionOrders[index] = updated;
        this.saveDatabase(db);
        return updated;
      }
    }
    const count = db.productionOrders.length + 1;
    const opNumber = `OP-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
    const newOP: ProductionOrder = {
      ...op,
      opNumber: op.opNumber || opNumber,
      id: `op-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    db.productionOrders.push(newOP);
    this.saveDatabase(db);
    return newOP;
  }

  /**
   * Baixa os materiais do estoque físico para uma OP.
   */
  public deductStockForOP(opId: string): boolean {
    const db = this.getDatabase();
    const op = db.productionOrders.find((p) => p.id === opId);
    if (!op || op.stockDeducted) return false;

    // Reduzir estoque de cada insumo
    for (const req of op.materialsSnapshot) {
      const material = db.materials.find((m) => m.id === req.materialId);
      if (material) {
        material.currentStock = Math.max(0, Math.round((material.currentStock - req.totalRequiredQty) * 100) / 100);
      }
    }

    op.stockDeducted = true;
    this.saveDatabase(db);
    return true;
  }

  /**
   * Devolve materiais ao estoque se a OP for cancelada.
   */
  public restoreStockForOP(opId: string): boolean {
    const db = this.getDatabase();
    const op = db.productionOrders.find((p) => p.id === opId);
    if (!op || !op.stockDeducted) return false;

    for (const req of op.materialsSnapshot) {
      const material = db.materials.find((m) => m.id === req.materialId);
      if (material) {
        material.currentStock = Math.round((material.currentStock + req.totalRequiredQty) * 100) / 100;
      }
    }

    op.stockDeducted = false;
    this.saveDatabase(db);
    return true;
  }

  /**
   * Atualização de status com registro de acompanhamento de tempo real.
   */
  public updateProductionOrderStatus(
    opId: string,
    newStatus: ProductionOrderStatus,
    options?: {
      actualTimeMinutes?: number;
      actualStartDate?: string;
      actualEndDate?: string;
      autoDeductStock?: boolean;
    }
  ): void {
    const db = this.getDatabase();
    const op = db.productionOrders.find((p) => p.id === opId);
    if (!op) return;

    const now = new Date().toISOString();

    if (newStatus === 'in_production') {
      if (!op.actualStartDate) {
        op.actualStartDate = options?.actualStartDate || now;
      }
      // Se configurado para baixar na inicialização e ainda não baixou
      if (options?.autoDeductStock && !op.stockDeducted) {
        this.deductStockForOP(opId);
      }
    } else if (newStatus === 'completed') {
      if (!op.actualStartDate) {
        op.actualStartDate = op.createdAt;
      }
      op.actualEndDate = options?.actualEndDate || now;

      // Calcular tempo realizado se não fornecido
      if (options?.actualTimeMinutes !== undefined) {
        op.actualTimeMinutes = options.actualTimeMinutes;
      } else if (!op.actualTimeMinutes && op.actualStartDate) {
        const start = new Date(op.actualStartDate).getTime();
        const end = new Date(op.actualEndDate).getTime();
        const diffMinutes = Math.max(1, Math.round((end - start) / (1000 * 60)));
        // Se a diferença for muito grande (ex: dias), usar estimativa ou manter proporcional
        op.actualTimeMinutes = diffMinutes > 1440 ? op.estimatedTimeMinutes : diffMinutes;
      }

      // Garantir que materiais foram baixados
      if (!op.stockDeducted) {
        this.deductStockForOP(opId);
      }

      // Verificar se todas as OPs do pedido vinculado estão concluídas para marcar o pedido como concluído
      if (op.orderId) {
        const relatedOPs = db.productionOrders.filter((o) => o.orderId === op.orderId);
        const allCompleted = relatedOPs.every((o) => (o.id === op.id ? true : o.status === 'completed'));
        if (allCompleted) {
          const order = db.orders.find((o) => o.id === op.orderId);
          if (order && order.status !== 'delivered') {
            order.status = 'completed';
          }
        }
      }
    } else if (newStatus === 'cancelled') {
      // Se estava com materiais baixados, estornar estoque
      if (op.stockDeducted) {
        this.restoreStockForOP(opId);
      }
    }

    op.status = newStatus;
    this.saveDatabase(db);
  }

  public deleteProductionOrder(id: string): { success: boolean; error?: string } {
    const db = this.getDatabase();
    const op = db.productionOrders.find((p) => p.id === id);
    if (!op) return { success: true };

    if (op.status === 'in_production') {
      return { success: false, error: 'Não é possível excluir uma Ordem de Produção que está atualmente em produção. Pause ou cancele primeiro.' };
    }

    if (op.stockDeducted && op.status !== 'completed') {
      // Devolver insumos se não foi concluída
      this.restoreStockForOP(id);
    }

    db.productionOrders = db.productionOrders.filter((p) => p.id !== id);
    this.saveDatabase(db);
    return { success: true };
  }
}

export const storageService = new StorageService();
