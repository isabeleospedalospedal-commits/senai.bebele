/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  HardHat,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  Calendar,
  AlertCircle,
  Package,
} from 'lucide-react';
import { Product, RawMaterial, WorkCenter, SalesOrder } from '../types/erp';
import { storageService } from '../services/storageService';
import { formatMinutes } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  materials: RawMaterial[];
  workCenters: WorkCenter[];
  orders: SalesOrder[];
  initialOrderId?: string;
  initialProductId?: string;
  initialQuantity?: number;
}

export const EmitOrderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  products,
  materials,
  workCenters,
  orders,
  initialOrderId,
  initialProductId,
  initialQuantity = 1,
}) => {
  const [orderId, setOrderId] = useState<string>(initialOrderId || '');
  const [productId, setProductId] = useState<string>(initialProductId || (products[0]?.id || ''));
  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [workCenterId, setWorkCenterId] = useState<string>('');
  const [scheduledStartDate, setScheduledStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [scheduledEndDate, setScheduledEndDate] = useState<string>(
    new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
  );
  const [deductStockImmediately, setDeductStockImmediately] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Sincronizar quando as props iniciais mudarem
  useEffect(() => {
    if (initialProductId) setProductId(initialProductId);
    if (initialOrderId) setOrderId(initialOrderId);
    if (initialQuantity) setQuantity(initialQuantity);
  }, [initialProductId, initialOrderId, initialQuantity]);

  // Atualizar posto de trabalho padrão quando o produto for selecionado
  const selectedProduct = products.find((p) => p.id === productId);
  useEffect(() => {
    if (selectedProduct?.workCenterId) {
      setWorkCenterId(selectedProduct.workCenterId);
    } else if (workCenters.length > 0 && !workCenterId) {
      setWorkCenterId(workCenters[0].id);
    }
  }, [productId, selectedProduct, workCenters]);

  if (!isOpen) return null;

  // Cálculo das matérias-primas necessárias com base na quantidade informada
  const materialsNeeded = selectedProduct
    ? selectedProduct.components.map((c) => {
        const mat = materials.find((m) => m.id === c.materialId);
        const totalRequired = Math.round(c.quantityNeeded * quantity * 100) / 100;
        const currentStock = mat ? mat.currentStock : 0;
        const hasEnough = currentStock >= totalRequired;
        const shortage = hasEnough ? 0 : Math.round((totalRequired - currentStock) * 100) / 100;

        return {
          materialId: c.materialId,
          name: mat ? mat.name : 'Insumo',
          code: mat ? mat.code : 'N/A',
          unit: mat ? mat.unit : 'un',
          unitQty: c.quantityNeeded,
          totalRequired,
          currentStock,
          hasEnough,
          shortage,
        };
      })
    : [];

  const anyMaterialShortage = materialsNeeded.some((m) => !m.hasEnough);

  // Cálculo do tempo previsto
  let estimatedMinutes = 0;
  if (selectedProduct) {
    if (selectedProduct.processTimeUnit === 'unit') {
      estimatedMinutes = Math.round(selectedProduct.processTimeMinutes * quantity);
    } else {
      const bSize = selectedProduct.batchSize || 1;
      const batches = Math.ceil(quantity / bSize);
      estimatedMinutes = Math.round(selectedProduct.processTimeMinutes * batches);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setErrorMessage('Selecione um produto para emitir a ordem.');
      return;
    }
    if (quantity <= 0) {
      setErrorMessage('A quantidade a produzir deve ser maior que zero.');
      return;
    }
    if (!workCenterId) {
      setErrorMessage('Selecione o posto de trabalho de fabricação.');
      return;
    }

    try {
      const newOP = storageService.emitProductionOrder({
        orderId: orderId || undefined,
        productId,
        quantity,
        workCenterId,
        scheduledStartDate,
        scheduledEndDate,
        notes: notes.trim() || undefined,
      });

      if (deductStockImmediately) {
        storageService.deductStockForOP(newOP.id);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao emitir ordem de produção.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Emissão de Ordem de Produção (OP)
              </h3>
              <p className="text-[11px] text-slate-500">
                Geração de ordem fabril com explosão de materiais e cálculo de tempo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Origem e Produto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vincular ao Pedido de Venda
              </label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Nenhum (OP Avulsa para Estoque)</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} (Entrega: {o.deliveryDate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Produto Acabado *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Quantidade a Produzir *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>
          </div>

          {/* Capacidade, Posto e Prazos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Posto de Trabalho Responsável *
              </label>
              <select
                value={workCenterId}
                onChange={(e) => setWorkCenterId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {workCenters.map((wc) => (
                  <option key={wc.id} value={wc.id}>
                    {wc.name} ({wc.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Data Prevista de Início *
              </label>
              <input
                type="date"
                required
                value={scheduledStartDate}
                onChange={(e) => setScheduledStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Data Prevista de Conclusão *
              </label>
              <input
                type="date"
                required
                value={scheduledEndDate}
                onChange={(e) => setScheduledEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Resumo de Tempo de Processo Calculado */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-indigo-900 block">
                  Tempo Previsto de Processo: {formatMinutes(estimatedMinutes)} ({Math.round((estimatedMinutes / 60) * 10) / 10} horas de máquina)
                </span>
                <span className="text-[11px] text-indigo-700">
                  Calculado automaticamente com base no tempo unitário de {selectedProduct ? formatMinutes(selectedProduct.processTimeMinutes) : 0} da Ficha Técnica.
                </span>
              </div>
            </div>
          </div>

          {/* Tabela de Matérias-Primas Necessárias (Explosão da Ficha Técnica) */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Matérias-Primas Necessárias (Ficha Técnica do Lote)</span>
              </h4>
              {anyMaterialShortage ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Estoque insuficiente detectado</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Estoque suficiente para fabricar</span>
                </span>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Código</th>
                    <th className="px-3 py-2">Matéria-Prima</th>
                    <th className="px-3 py-2">Qtd por Peça</th>
                    <th className="px-3 py-2">Total Requerido</th>
                    <th className="px-3 py-2">Estoque Atual</th>
                    <th className="px-3 py-2 text-right">Disponibilidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materialsNeeded.map((m) => (
                    <tr
                      key={m.materialId}
                      className={m.hasEnough ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50/70'}
                    >
                      <td className="px-3 py-2 font-mono text-slate-600">{m.code}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{m.name}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">
                        {m.unitQty} {m.unit}
                      </td>
                      <td className="px-3 py-2 font-bold font-mono text-slate-900">
                        {m.totalRequired} {m.unit}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-700">
                        {m.currentStock} {m.unit}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {m.hasEnough ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>OK</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-rose-700 font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Faltam {m.shortage} {m.unit}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Opção de Baixa Imediata */}
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="deductImmediately"
              checked={deductStockImmediately}
              onChange={(e) => setDeductStockImmediately(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <label htmlFor="deductImmediately" className="text-slate-700 text-xs font-medium cursor-pointer">
              Reservar e dar baixa imediata nas matérias-primas no estoque agora (caso desmarcado, a baixa ocorrerá ao iniciar ou concluir a produção no PCP).
            </label>
          </div>

          {/* Observações da Ordem */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Instruções de Produção / Observações
            </label>
            <textarea
              rows={2}
              placeholder="Instruções para o operador, tolerâncias dimensionais, cuidados no manuseio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs flex items-center space-x-1.5"
            >
              <HardHat className="w-4 h-4" />
              <span>Confirmar &amp; Emitir Ordem de Produção</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
