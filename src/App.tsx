/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MINI-ERP MANUFATURA - APLICAÇÃO PRINCIPAL (APP.TSX)
 * 
 * Sistema integrado de Planejamento e Controle da Produção (PCP) para pequenas empresas.
 * Persistência: localStorage do navegador com atualização reativa e exportação de backups.
 */

import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ProductsModule } from './components/ProductsModule';
import { MaterialsModule } from './components/MaterialsModule';
import { PartnersModule } from './components/PartnersModule';
import { CapacityModule } from './components/CapacityModule';
import { OrdersModule } from './components/OrdersModule';
import { ProductionOrdersModule } from './components/ProductionOrdersModule';
import { EmitOrderModal } from './components/EmitOrderModal';
import { DocumentationModal } from './components/DocumentationModal';
import { storageService } from './services/storageService';
import { ERPDatabase } from './types/erp';
import { Database, BookOpen } from 'lucide-react';

export default function App() {
  const [database, setDatabase] = useState<ERPDatabase>(() => storageService.getDatabase());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isDocOpen, setIsDocOpen] = useState(false);

  // Estado para emissão de OP a partir de pedidos ou avulsa
  const [isEmitModalOpen, setIsEmitModalOpen] = useState(false);
  const [emitOPContext, setEmitOPContext] = useState<{
    orderId?: string;
    productId?: string;
    quantity?: number;
  }>({});

  // Inscrever para atualizações automáticas do storage
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setDatabase(storageService.getDatabase());
    });
    return () => unsubscribe();
  }, []);

  const handleOpenEmitOP = (orderId?: string, productId?: string, quantity?: number) => {
    setEmitOPContext({ orderId, productId, quantity });
    setIsEmitModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header & Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenDoc={() => setIsDocOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            orders={database.orders}
            productionOrders={database.productionOrders}
            materials={database.materials}
            products={database.products}
            workCenters={database.workCenters}
            partners={database.partners}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenEmitOP={() => handleOpenEmitOP()}
          />
        )}

        {currentTab === 'products' && (
          <ProductsModule
            products={database.products}
            materials={database.materials}
            workCenters={database.workCenters}
          />
        )}

        {currentTab === 'materials' && (
          <MaterialsModule
            materials={database.materials}
            partners={database.partners}
          />
        )}

        {currentTab === 'partners' && (
          <PartnersModule partners={database.partners} />
        )}

        {currentTab === 'capacity' && (
          <CapacityModule
            workCenters={database.workCenters}
            products={database.products}
            productionOrders={database.productionOrders}
          />
        )}

        {currentTab === 'orders' && (
          <OrdersModule
            orders={database.orders}
            partners={database.partners}
            products={database.products}
            workCenters={database.workCenters}
            onOpenEmitOP={(orderId, productId, qty) =>
              handleOpenEmitOP(orderId, productId, qty)
            }
          />
        )}

        {(currentTab === 'production_orders' || currentTab === 'tracking') && (
          <ProductionOrdersModule
            productionOrders={database.productionOrders}
            products={database.products}
            workCenters={database.workCenters}
            orders={database.orders}
            materials={database.materials}
            onOpenEmitModal={() => handleOpenEmitOP()}
          />
        )}
      </main>

      {/* Footer com nota sobre persistência e link para documentação */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              <strong>Mini-ERP Manufatura</strong> • Persistência de dados ativa no <code>localStorage</code> (sessões mantidas automaticamente).
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDocOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Manual &amp; Guia de Uso</span>
            </button>
            <span>v1.0.0</span>
          </div>
        </div>
      </footer>

      {/* Modal de Emissão de Ordem de Produção */}
      <EmitOrderModal
        isOpen={isEmitModalOpen}
        onClose={() => setIsEmitModalOpen(false)}
        products={database.products}
        materials={database.materials}
        workCenters={database.workCenters}
        orders={database.orders}
        initialOrderId={emitOPContext.orderId}
        initialProductId={emitOPContext.productId}
        initialQuantity={emitOPContext.quantity}
      />

      {/* Modal de Documentação e Instruções */}
      <DocumentationModal
        isOpen={isDocOpen}
        onClose={() => setIsDocOpen(false)}
      />
    </div>
  );
}
