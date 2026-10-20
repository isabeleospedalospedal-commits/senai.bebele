/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Gauge,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  X,
  AlertCircle,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { WorkCenter, Product, ProductionOrder } from '../types/erp';
import { storageService } from '../services/storageService';
import { formatMinutes } from '../utils/formatters';

interface Props {
  workCenters: WorkCenter[];
  products: Product[];
  productionOrders: ProductionOrder[];
}

export const CapacityModule: React.FC<Props> = ({ workCenters, products, productionOrders }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<WorkCenter | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    dailyHours: 8,
    daysPerWeek: 5,
    workersCount: 1,
    efficiencyPercentage: 85,
    hourlyCost: 0,
  });

  const [formError, setFormError] = useState('');

  // Simulator State: "Verificar se um pedido cabe na capacidade disponível"
  const [simProductId, setSimProductId] = useState(products.length > 0 ? products[0].id : '');
  const [simQuantity, setSimQuantity] = useState(5);

  const openCreateModal = () => {
    setEditingCenter(null);
    const count = workCenters.length + 1;
    setFormData({
      code: `POSTO-0${count}`,
      name: '',
      description: '',
      dailyHours: 8,
      daysPerWeek: 5,
      workersCount: 1,
      efficiencyPercentage: 85,
      hourlyCost: 60,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (wc: WorkCenter) => {
    setEditingCenter(wc);
    setFormData({
      code: wc.code,
      name: wc.name,
      description: wc.description || '',
      dailyHours: wc.dailyHours,
      daysPerWeek: wc.daysPerWeek,
      workersCount: wc.workersCount,
      efficiencyPercentage: wc.efficiencyPercentage,
      hourlyCost: wc.hourlyCost || 0,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('O Nome do posto de trabalho é obrigatório.');
      return;
    }
    if (formData.dailyHours <= 0 || formData.daysPerWeek <= 0 || formData.workersCount <= 0) {
      setFormError('Horas, dias e operadores devem ser maiores que zero.');
      return;
    }

    try {
      storageService.saveWorkCenter({
        id: editingCenter ? editingCenter.id : undefined,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        dailyHours: Number(formData.dailyHours),
        daysPerWeek: Number(formData.daysPerWeek),
        workersCount: Number(formData.workersCount),
        efficiencyPercentage: Number(formData.efficiencyPercentage),
        hourlyCost: Number(formData.hourlyCost),
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar posto de trabalho.');
    }
  };

  const handleDelete = (wc: WorkCenter) => {
    if (window.confirm(`Deseja excluir o posto de trabalho "${wc.name}"?`)) {
      const res = storageService.deleteWorkCenter(wc.id);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  // Cálculo de capacidade para um posto:
  // Horas brutas/sem = dailyHours * daysPerWeek * workersCount
  // Horas úteis/sem = Horas brutas * (efficiencyPercentage / 100)
  const getWorkCenterMetrics = (wc: WorkCenter) => {
    const rawWeeklyHours = wc.dailyHours * wc.daysPerWeek * wc.workersCount;
    const effectiveWeeklyHours = rawWeeklyHours * (wc.efficiencyPercentage / 100);
    const effectiveDailyHours = (wc.dailyHours * wc.workersCount) * (wc.efficiencyPercentage / 100);

    // Carga agendada: soma das OPs ativas (aguardando, em produção, pausadas)
    const activeOPs = productionOrders.filter(
      (op) => op.workCenterId === wc.id && op.status !== 'completed' && op.status !== 'cancelled'
    );
    const totalMinutesBooked = activeOPs.reduce((acc, op) => acc + (op.estimatedTimeMinutes || 0), 0);
    const bookedHours = totalMinutesBooked / 60;

    // Percentual de ocupação semanal
    const occupancyRate = effectiveWeeklyHours > 0 ? (bookedHours / effectiveWeeklyHours) * 100 : 0;

    return {
      rawWeeklyHours,
      effectiveWeeklyHours: Math.round(effectiveWeeklyHours * 10) / 10,
      effectiveDailyHours: Math.round(effectiveDailyHours * 10) / 10,
      activeOPsCount: activeOPs.length,
      bookedHours: Math.round(bookedHours * 10) / 10,
      occupancyRate: Math.round(occupancyRate),
    };
  };

  // Simulação de Pedido vs Capacidade
  const selectedSimProduct = products.find((p) => p.id === simProductId);
  const simWorkCenter = selectedSimProduct
    ? workCenters.find((w) => w.id === selectedSimProduct.workCenterId)
    : undefined;

  let simTimeMinutes = 0;
  if (selectedSimProduct) {
    if (selectedSimProduct.processTimeUnit === 'unit') {
      simTimeMinutes = selectedSimProduct.processTimeMinutes * simQuantity;
    } else {
      const bSize = selectedSimProduct.batchSize || 1;
      simTimeMinutes = selectedSimProduct.processTimeMinutes * Math.ceil(simQuantity / bSize);
    }
  }
  const simHours = simTimeMinutes / 60;

  const simWcMetrics = simWorkCenter ? getWorkCenterMetrics(simWorkCenter) : null;
  const simFitsInWeeklyCapacity = simWcMetrics ? simHours <= simWcMetrics.effectiveWeeklyHours : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Gauge className="w-6 h-6 text-purple-600" />
            <span>Módulo 4: Capacidade Produtiva &amp; Análise de Carga</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Definição de jornada, postos de trabalho e verificação se pedidos e lotes cabem na capacidade da fábrica.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Posto de Trabalho</span>
        </button>
      </div>

      {/* Simulator Section: "Verificar se um pedido cabe na capacidade" */}
      <div className="p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-2 text-purple-900 font-bold text-sm mb-2">
          <Calculator className="w-5 h-5 text-purple-600" />
          <span>Simulador de Viabilidade: O pedido cabe na capacidade disponível?</span>
        </div>
        <p className="text-xs text-purple-800 mb-4">
          Selecione um produto e a quantidade desejada para calcular o impacto nas horas produtivas do posto responsável.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Produto a Fabricar</label>
            <select
              value={simProductId}
              onChange={(e) => setSimProductId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Quantidade Desejada (unidades)</label>
            <input
              type="number"
              min="1"
              value={simQuantity}
              onChange={(e) => setSimQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Posto de Trabalho Vinculado</label>
            <div className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 font-medium text-slate-700">
              {simWorkCenter ? `${simWorkCenter.name} (${simWorkCenter.code})` : 'Nenhum posto associado'}
            </div>
          </div>
        </div>

        {/* Sim Results Banner */}
        {selectedSimProduct && simWorkCenter && simWcMetrics && (
          <div className="p-3.5 bg-white rounded-xl border border-purple-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  simFitsInWeeklyCapacity
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {simFitsInWeeklyCapacity ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  {simFitsInWeeklyCapacity
                    ? 'Pedido VIÁVEL: Cabe na capacidade semanal!'
                    : 'ALERTA DE GARGALO: Ultrapassa a capacidade semanal do posto!'}
                </p>
                <p className="text-slate-600 mt-0.5">
                  Tempo estimado: <strong>{formatMinutes(simTimeMinutes)}</strong> ({Math.round(simHours * 10) / 10}h). 
                  Capacidade efetiva do posto: <strong>{simWcMetrics.effectiveWeeklyHours}h/semana</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4">
              <div>
                <p className="text-[11px] text-slate-400">Impacto na capacidade</p>
                <p className="text-base font-bold text-purple-700 font-mono">
                  {Math.round((simHours / simWcMetrics.effectiveWeeklyHours) * 100)}% da semana
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Work Centers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {workCenters.map((wc) => {
          const metrics = getWorkCenterMetrics(wc);
          const isOverloaded = metrics.occupancyRate > 100;
          const isNearCapacity = metrics.occupancyRate >= 80 && !isOverloaded;

          return (
            <div
              key={wc.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {wc.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1.5">{wc.name}</h3>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(wc)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                      title="Editar posto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(wc)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Excluir posto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {wc.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{wc.description}</p>
                )}

                {/* Parameters specs */}
                <div className="grid grid-cols-2 gap-2 my-4 p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Jornada Diária</span>
                    <span className="font-semibold text-slate-800">
                      {wc.dailyHours}h/dia ({wc.daysPerWeek} dias/sem)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Postos / Operadores</span>
                    <span className="font-semibold text-slate-800">
                      {wc.workersCount} operador(es)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Eficiência Operacional</span>
                    <span className="font-semibold text-slate-800">{wc.efficiencyPercentage}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Capacidade Efetiva</span>
                    <span className="font-bold text-indigo-700">
                      {metrics.effectiveWeeklyHours}h / semana
                    </span>
                  </div>
                </div>

                {/* Capacity Occupancy Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Carga Atual (OPs Ativas):</span>
                    <span className="font-mono font-bold text-slate-900">
                      {metrics.bookedHours}h / {metrics.effectiveWeeklyHours}h ({metrics.occupancyRate}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverloaded
                          ? 'bg-rose-500'
                          : isNearCapacity
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, metrics.occupancyRate)}%` }}
                    />
                  </div>

                  {isOverloaded && (
                    <div className="flex items-center space-x-1 text-[11px] text-rose-600 font-medium pt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Posto sobrecarregado! Requer horas extras ou redistribuição.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{metrics.activeOPsCount} OPs em andamento</span>
                {wc.hourlyCost ? <span>Custo: R$ {wc.hourlyCost}/h</span> : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Criar / Editar Posto de Trabalho */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingCenter ? 'Editar Posto de Trabalho' : 'Novo Posto de Trabalho / Máquina'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: POSTO-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome do Posto / Linha *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Marcenaria & Usinagem"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descrição das Máquinas e Recursos
                </label>
                <textarea
                  rows={2}
                  placeholder="Esquadrejadeira, lixadeiras, solda MIG, cabine de pintura..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Horas / Dia *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={formData.dailyHours}
                    onChange={(e) => setFormData({ ...formData, dailyHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dias / Semana *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    required
                    value={formData.daysPerWeek}
                    onChange={(e) => setFormData({ ...formData, daysPerWeek: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Operadores / Máquinas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.workersCount}
                    onChange={(e) => setFormData({ ...formData, workersCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Eficiência Operacional (%) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formData.efficiencyPercentage}
                    onChange={(e) => setFormData({ ...formData, efficiencyPercentage: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Desconta paradas planejadas, setups e descanso (padrão: 80% a 90%).
                  </p>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Custo por Hora (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourlyCost}
                    onChange={(e) => setFormData({ ...formData, hourlyCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  {editingCenter ? 'Salvar Alterações' : 'Cadastrar Posto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
