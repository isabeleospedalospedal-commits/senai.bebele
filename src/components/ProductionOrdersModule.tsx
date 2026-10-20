/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  HardHat,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Trash2,
  Eye,
  Check,
  TrendingDown,
  TrendingUp,
  X,
  Building,
  RotateCcw,
} from 'lucide-react';
import {
  ProductionOrder,
  ProductionOrderStatus,
  Product,
  WorkCenter,
  SalesOrder,
  RawMaterial,
} from '../types/erp';
import { storageService } from '../services/storageService';
import {
  formatDate,
  formatDateTime,
  formatMinutes,
  getOpStatusBadge,
} from '../utils/formatters';

interface Props {
  productionOrders: ProductionOrder[];
  products: Product[];
  workCenters: WorkCenter[];
  orders: SalesOrder[];
  materials: RawMaterial[];
  onOpenEmitModal: () => void;
}

export const ProductionOrdersModule: React.FC<Props> = ({
  productionOrders,
  products,
  workCenters,
  orders,
  materials,
  onOpenEmitModal,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOPDetails, setSelectedOPDetails] = useState<ProductionOrder | null>(null);

  // Modal de Apontamento de Conclusão (Tempo Realizado)
  const [completingOP, setCompletingOP] = useState<ProductionOrder | null>(null);
  const [actualMinutes, setActualMinutes] = useState<number>(60);
  const [completionNotes, setCompletionNotes] = useState<string>('');

  const handleStartProduction = (op: ProductionOrder) => {
    storageService.updateProductionOrderStatus(op.id, 'in_production', {
      autoDeductStock: true, // baixa os insumos ao iniciar se ainda não foram baixados
    });
  };

  const handlePauseProduction = (op: ProductionOrder) => {
    storageService.updateProductionOrderStatus(op.id, 'paused');
  };

  const openCompletionModal = (op: ProductionOrder) => {
    setCompletingOP(op);
    // Sugerir tempo previsto ou tempo atual
    setActualMinutes(op.actualTimeMinutes || op.estimatedTimeMinutes || 60);
    setCompletionNotes(op.notes || '');
  };

  const handleConfirmCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingOP) return;

    storageService.updateProductionOrderStatus(completingOP.id, 'completed', {
      actualTimeMinutes: actualMinutes,
      autoDeductStock: true,
    });

    if (completionNotes !== completingOP.notes) {
      storageService.saveProductionOrder({
        ...completingOP,
        notes: completionNotes,
        actualTimeMinutes: actualMinutes,
        status: 'completed',
      });
    }

    setCompletingOP(null);
  };

  const handleCancelProduction = (op: ProductionOrder) => {
    if (window.confirm(`Deseja cancelar a Ordem de Produção ${op.opNumber}? Caso os materiais tenham sido baixados, o estoque será devolvido.`)) {
      storageService.updateProductionOrderStatus(op.id, 'cancelled');
    }
  };

  const handleDeleteOP = (op: ProductionOrder) => {
    if (window.confirm(`Deseja excluir definitivamente a ordem ${op.opNumber}?`)) {
      const res = storageService.deleteProductionOrder(op.id);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  const handleManualDeductStock = (op: ProductionOrder) => {
    if (storageService.deductStockForOP(op.id)) {
      alert('Matérias-primas baixadas com sucesso do estoque!');
    }
  };

  // Comparação de Tempo: Previsto vs Realizado
  const getTimeComparison = (estimated: number, actual?: number) => {
    if (!actual) return null;
    const diff = actual - estimated;
    if (diff === 0) {
      return { text: 'Exato no tempo previsto', color: 'text-slate-600', icon: Check };
    }
    if (diff < 0) {
      return {
        text: `${formatMinutes(Math.abs(diff))} mais rápido (-${Math.round((Math.abs(diff) / estimated) * 100)}%)`,
        color: 'text-emerald-700 font-semibold',
        icon: TrendingDown,
      };
    }
    return {
      text: `${formatMinutes(diff)} de atraso (+${Math.round((diff / estimated) * 100)}%)`,
      color: 'text-rose-700 font-semibold',
      icon: TrendingUp,
    };
  };

  const filteredOPs = productionOrders.filter((op) => {
    const product = products.find((p) => p.id === op.productId);
    const order = orders.find((o) => o.id === op.orderId);
    const matchesStatus = statusFilter === 'all' ? true : op.status === statusFilter;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      op.opNumber.toLowerCase().includes(term) ||
      (product && product.name.toLowerCase().includes(term)) ||
      (order && order.orderNumber.toLowerCase().includes(term));

    return matchesStatus && matchesSearch;
  });

  const columns: { id: ProductionOrderStatus; title: string; color: string }[] = [
    { id: 'waiting', title: '1. Aguardando Início', color: 'border-t-slate-400 bg-slate-50/50' },
    { id: 'in_production', title: '2. Em Produção', color: 'border-t-sky-500 bg-sky-50/30' },
    { id: 'paused', title: '3. Pausada', color: 'border-t-amber-500 bg-amber-50/30' },
    { id: 'completed', title: '4. Concluída', color: 'border-t-emerald-500 bg-emerald-50/30' },
    { id: 'cancelled', title: '5. Cancelada', color: 'border-t-rose-400 bg-rose-50/30' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <HardHat className="w-6 h-6 text-indigo-600" />
            <span>Módulos 6 &amp; 7: Ordens de Produção &amp; Acompanhamento PCP</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Emissão de ordens, controle de status em chão de fábrica, baixa de insumos e comparação tempo previsto vs realizado.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Alternador Kanban / Tabela */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Quadro Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Lista Detalhada
            </button>
          </div>

          <button
            onClick={onOpenEmitModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Nova OP</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'Todas as OPs' },
            { id: 'waiting', label: 'Aguardando' },
            { id: 'in_production', label: 'Em Produção' },
            { id: 'paused', label: 'Pausadas' },
            { id: 'completed', label: 'Concluídas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                statusFilter === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por OP, produto ou pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {columns.map((col) => {
            const colOrders = filteredOPs.filter((op) => op.status === col.id);

            return (
              <div
                key={col.id}
                className={`bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col min-h-[450px] border-t-4 ${col.color}`}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                  <span className="font-bold text-xs text-slate-800">{col.title}</span>
                  <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-white text-slate-700 rounded-full border border-slate-200 shadow-2xs">
                    {colOrders.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="p-2.5 space-y-3 flex-1 overflow-y-auto">
                  {colOrders.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-[11px]">
                      Nenhuma OP nesta etapa
                    </div>
                  ) : (
                    colOrders.map((op) => {
                      const prod = products.find((p) => p.id === op.productId);
                      const wc = workCenters.find((w) => w.id === op.workCenterId);
                      const order = orders.find((o) => o.id === op.orderId);
                      const timeComp = getTimeComparison(op.estimatedTimeMinutes, op.actualTimeMinutes);

                      return (
                        <div
                          key={op.id}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition space-y-2.5"
                        >
                          {/* Top Card Info */}
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                {op.opNumber}
                              </span>
                              {order && (
                                <span className="ml-1 text-[10px] text-slate-500 font-medium">
                                  ({order.orderNumber})
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => setSelectedOPDetails(op)}
                              className="text-slate-400 hover:text-slate-600 p-1"
                              title="Ver ficha completa da OP"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Product and Qty */}
                          <div>
                            <p className="font-bold text-slate-900 text-xs line-clamp-2">
                              {prod ? prod.name : 'Produto'}
                            </p>
                            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                              Lote a fabricar: <strong className="text-slate-900">{op.quantity} un</strong>
                            </p>
                          </div>

                          {/* Work Center and Dates */}
                          <div className="text-[11px] space-y-1 text-slate-600 bg-slate-50 p-2 rounded-lg">
                            <div className="flex items-center space-x-1">
                              <span className="text-slate-400">Posto:</span>
                              <span className="font-semibold text-slate-800 truncate">
                                {wc ? wc.name : 'Posto fabril'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-slate-400">Prazo:</span>
                              <span className="font-medium text-slate-700">
                                {formatDate(op.scheduledEndDate)}
                              </span>
                            </div>
                          </div>

                          {/* Tempos: Previsto vs Realizado (Módulo 7) */}
                          <div className="text-[11px] border-t border-slate-100 pt-2 space-y-1">
                            <div className="flex items-center justify-between text-slate-500">
                              <span>Previsto:</span>
                              <span className="font-mono font-semibold text-slate-800">
                                {formatMinutes(op.estimatedTimeMinutes)}
                              </span>
                            </div>

                            {op.actualTimeMinutes !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Realizado:</span>
                                <span className="font-mono font-bold text-indigo-700">
                                  {formatMinutes(op.actualTimeMinutes)}
                                </span>
                              </div>
                            )}

                            {/* Desvio do Tempo */}
                            {timeComp && (
                              <div className={`flex items-center space-x-1 text-[10px] ${timeComp.color} pt-0.5`}>
                                <timeComp.icon className="w-3 h-3 shrink-0" />
                                <span>{timeComp.text}</span>
                              </div>
                            )}
                          </div>

                          {/* Baixa de Estoque status */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            <span>Insumos:</span>
                            {op.stockDeducted ? (
                              <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Baixado do estoque</span>
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium">Aguardando baixa</span>
                            )}
                          </div>

                          {/* Interactive Action Buttons */}
                          <div className="pt-2 flex items-center justify-between gap-1.5">
                            {op.status === 'waiting' && (
                              <button
                                onClick={() => handleStartProduction(op)}
                                className="w-full py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 shadow-2xs transition"
                              >
                                <Play className="w-3 h-3" />
                                <span>Iniciar Produção</span>
                              </button>
                            )}

                            {op.status === 'in_production' && (
                              <>
                                <button
                                  onClick={() => handlePauseProduction(op)}
                                  className="p-1.5 border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-xs"
                                  title="Pausar linha de produção"
                                >
                                  <Pause className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openCompletionModal(op)}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 shadow-2xs transition"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Concluir</span>
                                </button>
                              </>
                            )}

                            {op.status === 'paused' && (
                              <button
                                onClick={() => handleStartProduction(op)}
                                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 shadow-2xs transition"
                              >
                                <Play className="w-3 h-3" />
                                <span>Retomar</span>
                              </button>
                            )}

                            {op.status === 'completed' && (
                              <div className="w-full py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-center font-bold text-[11px]">
                                Finalizado
                              </div>
                            )}

                            {op.status !== 'completed' && op.status !== 'cancelled' && (
                              <button
                                onClick={() => handleCancelProduction(op)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                title="Cancelar ordem"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW 2: TABLE VIEW */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">OP</th>
                  <th className="px-4 py-3">Produto Acabado</th>
                  <th className="px-4 py-3">Qtd</th>
                  <th className="px-4 py-3">Posto Fabril</th>
                  <th className="px-4 py-3">Data Conclusão</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tempo Previsto</th>
                  <th className="px-4 py-3">Tempo Realizado</th>
                  <th className="px-4 py-3">Comparação / Desvio</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOPs.map((op) => {
                  const prod = products.find((p) => p.id === op.productId);
                  const wc = workCenters.find((w) => w.id === op.workCenterId);
                  const badge = getOpStatusBadge(op.status);
                  const timeComp = getTimeComparison(op.estimatedTimeMinutes, op.actualTimeMinutes);

                  return (
                    <tr key={op.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {op.opNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {prod ? prod.name : 'Produto'}
                      </td>
                      <td className="px-4 py-3 font-bold font-mono text-slate-800">
                        {op.quantity} un
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {wc ? wc.name : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(op.scheduledEndDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md border ${badge.bg} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {formatMinutes(op.estimatedTimeMinutes)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                        {op.actualTimeMinutes ? formatMinutes(op.actualTimeMinutes) : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {timeComp ? (
                          <span className={timeComp.color}>{timeComp.text}</span>
                        ) : (
                          <span className="text-slate-400">Em andamento</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setSelectedOPDetails(op)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                            title="Ver Detalhes da OP"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {op.status === 'in_production' && (
                            <button
                              onClick={() => openCompletionModal(op)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg font-bold"
                              title="Concluir Produção"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteOP(op)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Excluir OP"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Conclusão / Apontamento de Tempo Real (Módulo 7) */}
      {completingOP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Apontamento de Conclusão da Produção</span>
              </h3>
              <button
                onClick={() => setCompletingOP(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                <p className="font-bold text-slate-900">{completingOP.opNumber}</p>
                <p className="text-slate-600">
                  Lote: <strong>{completingOP.quantity} un</strong> de{' '}
                  <strong>{products.find((p) => p.id === completingOP.productId)?.name}</strong>
                </p>
                <p className="text-slate-500 font-mono text-[11px]">
                  Tempo Previsto na Ficha Técnica:{' '}
                  <strong>{formatMinutes(completingOP.estimatedTimeMinutes)}</strong>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tempo Real Decorrido na Produção (Minutos) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={actualMinutes}
                  onChange={(e) => setActualMinutes(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-base font-bold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Equivale a: <strong>{formatMinutes(actualMinutes)}</strong>.
                  {actualMinutes < completingOP.estimatedTimeMinutes && (
                    <span className="text-emerald-700 font-semibold ml-1">
                      (Economia de {formatMinutes(completingOP.estimatedTimeMinutes - actualMinutes)})
                    </span>
                  )}
                  {actualMinutes > completingOP.estimatedTimeMinutes && (
                    <span className="text-rose-700 font-semibold ml-1">
                      (Atraso de {formatMinutes(actualMinutes - completingOP.estimatedTimeMinutes)})
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observações do Apontamento
                </label>
                <textarea
                  rows={2}
                  placeholder="Relato de qualidade, refugo, velocidade de operação..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px]">
                ℹ️ Ao confirmar a conclusão, o sistema automaticamente baixará as matérias-primas do estoque (caso ainda não estejam baixadas) e atualizará o status do pedido vinculado para concluído caso todas as OPs sejam entregues.
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingOP(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Confirmar Conclusão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes Completos da OP */}
      {selectedOPDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <HardHat className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Ficha Completa da Ordem {selectedOPDetails.opNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOPDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto">
              {/* Resumo da OP */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 block">Produto</span>
                  <span className="font-bold text-slate-900">
                    {products.find((p) => p.id === selectedOPDetails.productId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Quantidade</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {selectedOPDetails.quantity} unidades
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Posto</span>
                  <span className="font-semibold text-slate-800">
                    {workCenters.find((w) => w.id === selectedOPDetails.workCenterId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Status</span>
                  <span className="font-bold text-indigo-700 capitalize">
                    {selectedOPDetails.status}
                  </span>
                </div>
              </div>

              {/* Tempos de Processo */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-1">
                <p className="font-bold text-indigo-900 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Acompanhamento Temporal da Produção</span>
                </p>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-slate-500">Tempo Previsto:</span>{' '}
                    <strong className="font-mono text-slate-800">
                      {formatMinutes(selectedOPDetails.estimatedTimeMinutes)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Tempo Realizado:</span>{' '}
                    <strong className="font-mono text-indigo-700">
                      {selectedOPDetails.actualTimeMinutes
                        ? formatMinutes(selectedOPDetails.actualTimeMinutes)
                        : 'Ainda em processamento'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Matérias-Primas Requeridas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Insumos Consumidos / Necessários</span>
                  </h4>
                  {selectedOPDetails.stockDeducted ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Estoque Já Baixado
                    </span>
                  ) : (
                    <button
                      onClick={() => handleManualDeductStock(selectedOPDetails)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
                    >
                      Dar Baixa Manual no Estoque
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Insumo</th>
                        <th className="px-3 py-2">Qtd por Peça</th>
                        <th className="px-3 py-2">Total Requerido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOPDetails.materialsSnapshot.map((m) => (
                        <tr key={m.materialId}>
                          <td className="px-3 py-2 font-medium text-slate-800">{m.materialName}</td>
                          <td className="px-3 py-2 font-mono text-slate-600">
                            {m.unitQty} {m.unit}
                          </td>
                          <td className="px-3 py-2 font-bold font-mono text-slate-900">
                            {m.totalRequiredQty} {m.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedOPDetails.notes && (
                <div className="p-3 bg-slate-50 rounded-xl text-slate-700">
                  <strong>Observações:</strong> {selectedOPDetails.notes}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedOPDetails(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
