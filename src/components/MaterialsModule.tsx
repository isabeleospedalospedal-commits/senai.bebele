/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Building,
  ArrowUpDown,
  X,
  AlertCircle,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { RawMaterial, Partner, MeasurementUnit, MEASUREMENT_UNITS } from '../types/erp';
import { storageService } from '../services/storageService';
import { formatCurrency } from '../utils/formatters';

interface Props {
  materials: RawMaterial[];
  partners: Partner[];
}

export const MaterialsModule: React.FC<Props> = ({ materials, partners }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'zero'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  // Quick adjust stock modal
  const [adjustTarget, setAdjustTarget] = useState<RawMaterial | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('in');

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    unit: 'un' as MeasurementUnit,
    currentStock: 0,
    minStock: 0,
    unitCost: 0,
    supplierId: '',
    location: '',
    notes: '',
  });

  const [formError, setFormError] = useState('');

  const suppliers = partners.filter((p) => p.type === 'supplier' || p.type === 'both');

  const openCreateModal = () => {
    setEditingMaterial(null);
    const count = materials.length + 1;
    setFormData({
      code: `MP-${String(count).padStart(3, '0')}`,
      name: '',
      unit: 'un',
      currentStock: 0,
      minStock: 10,
      unitCost: 0,
      supplierId: suppliers.length > 0 ? suppliers[0].id : '',
      location: '',
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (mat: RawMaterial) => {
    setEditingMaterial(mat);
    setFormData({
      code: mat.code,
      name: mat.name,
      unit: mat.unit,
      currentStock: mat.currentStock,
      minStock: mat.minStock,
      unitCost: mat.unitCost,
      supplierId: mat.supplierId || '',
      location: mat.location || '',
      notes: mat.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('O Nome da matéria-prima é obrigatório.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('O Código/SKU é obrigatório.');
      return;
    }
    if (formData.currentStock < 0) {
      setFormError('A quantidade em estoque não pode ser negativa.');
      return;
    }

    try {
      storageService.saveMaterial({
        id: editingMaterial ? editingMaterial.id : undefined,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        unit: formData.unit,
        currentStock: Number(formData.currentStock),
        minStock: Number(formData.minStock),
        unitCost: Number(formData.unitCost),
        supplierId: formData.supplierId || undefined,
        location: formData.location.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar matéria-prima.');
    }
  };

  const handleDelete = (mat: RawMaterial) => {
    if (window.confirm(`Deseja excluir a matéria-prima "${mat.name}" (${mat.code})?`)) {
      const res = storageService.deleteMaterial(mat.id);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  const handleQuickAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    const delta = adjustType === 'in' ? Math.abs(adjustDelta) : -Math.abs(adjustDelta);
    storageService.adjustStock(adjustTarget.id, delta);
    setAdjustTarget(null);
  };

  const lowStockCount = materials.filter((m) => m.currentStock <= m.minStock && m.currentStock > 0).length;
  const zeroStockCount = materials.filter((m) => m.currentStock <= 0).length;
  const totalStockValue = materials.reduce((acc, m) => acc + m.currentStock * m.unitCost, 0);

  const filteredMaterials = materials.filter((m) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(term) ||
      m.code.toLowerCase().includes(term) ||
      (m.location && m.location.toLowerCase().includes(term));

    if (filterStock === 'low') {
      return matchesSearch && m.currentStock <= m.minStock && m.currentStock > 0;
    }
    if (filterStock === 'zero') {
      return matchesSearch && m.currentStock <= 0;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Módulo 2: Cadastro de Matérias-Primas &amp; Insumos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de insumos, unidades de medida, quantidades em estoque e fornecedores de referência.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Matéria-Prima</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Itens Cadastrados</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{materials.length}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Valor em Estoque</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalStockValue)}</p>
        </div>
        <div
          onClick={() => setFilterStock(filterStock === 'low' ? 'all' : 'low')}
          className={`p-4 bg-white rounded-xl border cursor-pointer transition shadow-2xs ${
            filterStock === 'low'
              ? 'border-amber-400 bg-amber-50'
              : 'border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-amber-800">Estoque Baixo</p>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-1">{lowStockCount}</p>
        </div>
        <div
          onClick={() => setFilterStock(filterStock === 'zero' ? 'all' : 'zero')}
          className={`p-4 bg-white rounded-xl border cursor-pointer transition shadow-2xs ${
            filterStock === 'zero'
              ? 'border-rose-400 bg-rose-50'
              : 'border-rose-200 hover:bg-rose-50/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-rose-800">Estoque Zerado</p>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-900 mt-1">{zeroStockCount}</p>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterStock('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              filterStock === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos os Insumos
          </button>
          <button
            onClick={() => setFilterStock('low')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              filterStock === 'low' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Abaixo do Mínimo ({lowStockCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nome ou localização..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Matéria-Prima</th>
                <th className="px-4 py-3">Unidade</th>
                <th className="px-4 py-3">Estoque Atual</th>
                <th className="px-4 py-3">Estoque Mínimo</th>
                <th className="px-4 py-3">Custo Unitário</th>
                <th className="px-4 py-3">Fornecedor de Referência</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Nenhuma matéria-prima encontrada com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const supplier = partners.find((p) => p.id === mat.supplierId);
                  const isZero = mat.currentStock <= 0;
                  const isLow = mat.currentStock <= mat.minStock && !isZero;

                  return (
                    <tr key={mat.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                        {mat.code}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{mat.name}</p>
                        {mat.location && (
                          <p className="text-[11px] text-slate-400">Local: {mat.location}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 uppercase font-medium text-slate-600">
                        {mat.unit}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-bold font-mono text-sm ${
                              isZero
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-800'
                            }`}
                          >
                            {mat.currentStock} {mat.unit}
                          </span>
                          {isZero && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-rose-100 text-rose-800 rounded font-semibold">
                              Zerado
                            </span>
                          )}
                          {isLow && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded font-semibold">
                              Baixo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {mat.minStock} {mat.unit}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {formatCurrency(mat.unitCost)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {supplier ? (
                          <div className="flex items-center space-x-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[150px]">{supplier.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Não informado</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setAdjustTarget(mat);
                              setAdjustDelta(1);
                              setAdjustType('in');
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Ajustar estoque (+/- entrada ou saída)"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(mat)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                            title="Editar matéria-prima"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(mat)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Excluir matéria-prima"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar Matéria-Prima */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingMaterial ? 'Editar Matéria-Prima' : 'Cadastrar Nova Matéria-Prima'}
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
                  <label className="block font-semibold text-slate-700 mb-1">Código / SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MP-001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome da Matéria-Prima *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tubo de Aço 30x30mm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unidade de Medida *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as MeasurementUnit })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {MEASUREMENT_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estoque Atual *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estoque Mínimo *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Custo Unitário (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fornecedor de Referência
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">Selecione um fornecedor...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.document})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Localização no Estoque / Galpão
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Galpão A - Prateleira 3"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Observações Técnicas
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Secagem em estufa, padrão ABNT..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  {editingMaterial ? 'Salvar Alterações' : 'Cadastrar Matéria-Prima'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste Rápido de Estoque (+/-) */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Ajuste de Estoque</h3>
              <button
                onClick={() => setAdjustTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAdjustSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-semibold text-slate-800">{adjustTarget.name}</p>
                <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                  Estoque atual: <strong>{adjustTarget.currentStock} {adjustTarget.unit}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('in')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                    adjustType === 'in'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Entrada (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('out')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                    adjustType === 'out'
                      ? 'border-rose-600 bg-rose-50 text-rose-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>Saída (-)</span>
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantidade a {adjustType === 'in' ? 'adicionar' : 'remover'} ({adjustTarget.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-base"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
