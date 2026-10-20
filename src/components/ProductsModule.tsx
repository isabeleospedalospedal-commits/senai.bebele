/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  Layers,
  DollarSign,
  Package,
  X,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Product, RawMaterial, WorkCenter, ProductComponent } from '../types/erp';
import { storageService } from '../services/storageService';
import { formatCurrency, formatMinutes } from '../utils/formatters';

interface Props {
  products: Product[];
  materials: RawMaterial[];
  workCenters: WorkCenter[];
}

export const ProductsModule: React.FC<Props> = ({ products, materials, workCenters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [expandedBOM, setExpandedBOM] = useState<Record<string, boolean>>({});

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    salePrice: 0,
    processTimeMinutes: 60,
    processTimeUnit: 'unit' as 'unit' | 'batch',
    batchSize: 1,
    workCenterId: workCenters.length > 0 ? workCenters[0].id : '',
    components: [] as ProductComponent[],
    notes: '',
  });

  const [formError, setFormError] = useState('');

  // Component form row to add into BOM
  const [selectedMatId, setSelectedMatId] = useState(materials.length > 0 ? materials[0].id : '');
  const [componentQty, setComponentQty] = useState(1);

  const toggleBOM = (prodId: string) => {
    setExpandedBOM((prev) => ({ ...prev, [prodId]: !prev[prodId] }));
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    const count = products.length + 1;
    setFormData({
      code: `PRD-${String(count).padStart(3, '0')}`,
      name: '',
      category: 'Móveis & Decoração',
      salePrice: 0,
      processTimeMinutes: 60,
      processTimeUnit: 'unit',
      batchSize: 1,
      workCenterId: workCenters.length > 0 ? workCenters[0].id : '',
      components: [],
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      code: prod.code,
      name: prod.name,
      category: prod.category || '',
      salePrice: prod.salePrice,
      processTimeMinutes: prod.processTimeMinutes,
      processTimeUnit: prod.processTimeUnit,
      batchSize: prod.batchSize || 1,
      workCenterId: prod.workCenterId || (workCenters.length > 0 ? workCenters[0].id : ''),
      components: [...prod.components],
      notes: prod.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const addComponentToBOM = () => {
    if (!selectedMatId) return;
    if (componentQty <= 0) {
      alert('A quantidade necessária deve ser maior que zero.');
      return;
    }

    const existingIndex = formData.components.findIndex((c) => c.materialId === selectedMatId);
    if (existingIndex !== -1) {
      // Atualizar quantidade existente
      const updated = [...formData.components];
      updated[existingIndex].quantityNeeded += componentQty;
      setFormData({ ...formData, components: updated });
    } else {
      setFormData({
        ...formData,
        components: [...formData.components, { materialId: selectedMatId, quantityNeeded: componentQty }],
      });
    }
    setComponentQty(1);
  };

  const removeComponentFromBOM = (index: number) => {
    const updated = formData.components.filter((_, i) => i !== index);
    setFormData({ ...formData, components: updated });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('O Nome do produto é obrigatório.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('O Código do produto é obrigatório.');
      return;
    }
    if (formData.processTimeMinutes <= 0) {
      setFormError('O tempo de processo de fabricação deve ser maior que zero minutos.');
      return;
    }
    if (formData.components.length === 0) {
      setFormError('A Ficha Técnica precisa de pelo menos 1 matéria-prima cadastrada.');
      return;
    }

    try {
      storageService.saveProduct({
        id: editingProduct ? editingProduct.id : undefined,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        category: formData.category.trim() || 'Geral',
        salePrice: Number(formData.salePrice),
        processTimeMinutes: Number(formData.processTimeMinutes),
        processTimeUnit: formData.processTimeUnit,
        batchSize: formData.processTimeUnit === 'batch' ? Number(formData.batchSize) : undefined,
        workCenterId: formData.workCenterId || undefined,
        components: formData.components,
        notes: formData.notes.trim() || undefined,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar produto.');
    }
  };

  const handleDelete = (prod: Product) => {
    if (window.confirm(`Deseja excluir a ficha técnica do produto "${prod.name}" (${prod.code})?`)) {
      const res = storageService.deleteProduct(prod.id);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  // Calcular custo estimado dos insumos por unidade de produto
  const calculateMaterialsCost = (components: ProductComponent[]) => {
    return components.reduce((acc, comp) => {
      const mat = materials.find((m) => m.id === comp.materialId);
      if (!mat) return acc;
      return acc + comp.quantityNeeded * mat.unitCost;
    }, 0);
  };

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <span>Módulo 1: Ficha Técnica do Produto (BOM) &amp; Tempos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro de produtos acabados, lista de matérias-primas por unidade e tempo de processo usado no PCP.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Ficha Técnica</span>
        </button>
      </div>

      {/* Search and Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-700">
          Total de Produtos Cadastrados: <strong className="text-blue-600">{products.length}</strong>
        </span>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, produto ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* List of Products with Expandable BOM */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            Nenhum produto cadastrado com os termos da busca.
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const isExpanded = !!expandedBOM[prod.id];
            const matCost = calculateMaterialsCost(prod.components);
            const profit = prod.salePrice - matCost;
            const margin = prod.salePrice > 0 ? (profit / prod.salePrice) * 100 : 0;
            const wc = workCenters.find((w) => w.id === prod.workCenterId);

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition"
              >
                {/* Product Summary Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleBOM(prod.id)}
                      className="mt-1 p-1 hover:bg-slate-200 rounded-md text-slate-500 transition"
                      title="Ver componentes da Ficha Técnica (BOM)"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          {prod.code}
                        </span>
                        <span className="text-xs text-slate-500">({prod.category})</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{prod.name}</h3>
                      {prod.notes && (
                        <p className="text-xs text-slate-500 mt-0.5">{prod.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Badges and Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Tempo de Processo (chave para o PCP) */}
                    <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs">
                      <span className="text-[10px] text-indigo-700 block font-medium">Tempo de Processo</span>
                      <span className="font-bold text-indigo-900 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>
                          {formatMinutes(prod.processTimeMinutes)} / {prod.processTimeUnit === 'unit' ? 'unidade' : `lote (${prod.batchSize} un)`}
                        </span>
                      </span>
                    </div>

                    {/* Preço de Venda e Custo */}
                    <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                      <span className="text-[10px] text-emerald-700 block font-medium">Preço Venda / Custo Insumos</span>
                      <span className="font-bold text-emerald-900">
                        {formatCurrency(prod.salePrice)} <span className="text-slate-400 font-normal">| {formatCurrency(matCost)}</span>
                      </span>
                    </div>

                    {/* Posto de trabalho */}
                    <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-xl text-xs">
                      <span className="text-[10px] text-purple-700 block font-medium">Posto de Trabalho</span>
                      <span className="font-semibold text-purple-900">
                        {wc ? wc.name : 'Não definido'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 pl-2">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                        title="Editar Ficha Técnica"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prod)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded BOM View */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span>Matérias-Primas Requeridas por Unidade Fabricada (BOM)</span>
                      </h4>
                      <span className="text-xs font-medium text-slate-500">
                        Margem bruta estimada: <strong className="text-emerald-700">{Math.round(margin)}%</strong>
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2">Código Insumo</th>
                            <th className="px-3 py-2">Matéria-Prima</th>
                            <th className="px-3 py-2">Qtd por Unidade Produzida</th>
                            <th className="px-3 py-2">Custo Unitário Insumo</th>
                            <th className="px-3 py-2">Subtotal na Peça</th>
                            <th className="px-3 py-2">Estoque Disponível Atual</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {prod.components.map((c, idx) => {
                            const mat = materials.find((m) => m.id === c.materialId);
                            const cost = mat ? c.quantityNeeded * mat.unitCost : 0;
                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-mono text-slate-600">
                                  {mat ? mat.code : 'N/A'}
                                </td>
                                <td className="px-3 py-2 font-semibold text-slate-900">
                                  {mat ? mat.name : 'Matéria-prima não encontrada'}
                                </td>
                                <td className="px-3 py-2 font-bold font-mono text-slate-800">
                                  {c.quantityNeeded} {mat ? mat.unit : ''}
                                </td>
                                <td className="px-3 py-2 font-mono text-slate-600">
                                  {mat ? formatCurrency(mat.unitCost) : '-'}
                                </td>
                                <td className="px-3 py-2 font-mono font-semibold text-emerald-800">
                                  {formatCurrency(cost)}
                                </td>
                                <td className="px-3 py-2 font-mono">
                                  {mat ? (
                                    <span
                                      className={
                                        mat.currentStock < c.quantityNeeded
                                          ? 'text-rose-600 font-bold'
                                          : 'text-slate-700'
                                      }
                                    >
                                      {mat.currentStock} {mat.unit}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-right text-slate-600">
                              Custo Total de Matérias-Primas por Peça:
                            </td>
                            <td colSpan={2} className="px-3 py-2 font-bold text-emerald-700 font-mono">
                              {formatCurrency(matCost)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Criar / Editar Ficha Técnica */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingProduct ? 'Editar Ficha Técnica do Produto' : 'Cadastrar Nova Ficha Técnica (BOM)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código / Referência *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: PRD-001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mesa de Centro Freijó"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Mobiliário, Decoração"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço de Venda (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Posto de Trabalho Principal</label>
                  <select
                    value={formData.workCenterId}
                    onChange={(e) => setFormData({ ...formData, workCenterId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Selecione o posto...</option>
                    {workCenters.map((wc) => (
                      <option key={wc.id} value={wc.id}>
                        {wc.name} ({wc.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tempo de Processo (Planejamento PCP) */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center space-x-1.5 text-indigo-900 font-bold">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Tempo de Processo de Fabricação (Utilizado no Planejamento)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Tempo em Minutos *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.processTimeMinutes}
                      onChange={(e) => setFormData({ ...formData, processTimeMinutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Equivale a: <strong>{formatMinutes(formData.processTimeMinutes)}</strong>
                    </span>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Tipo de Aplicação</label>
                    <select
                      value={formData.processTimeUnit}
                      onChange={(e) => setFormData({ ...formData, processTimeUnit: e.target.value as 'unit' | 'batch' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="unit">Por Unidade Produzida</option>
                      <option value="batch">Por Lote de Fabricação</option>
                    </select>
                  </div>
                  {formData.processTimeUnit === 'batch' && (
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Tamanho do Lote (un)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.batchSize}
                        onChange={(e) => setFormData({ ...formData, batchSize: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Componentes da Ficha Técnica (BOM) */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Componentes &amp; Matérias-Primas Necessárias</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {formData.components.length} item(ns) na lista
                  </span>
                </div>

                {/* Seletor para Adicionar Insumo */}
                <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Matéria-Prima
                    </label>
                    <select
                      value={selectedMatId}
                      onChange={(e) => setSelectedMatId(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.code} - {m.name} ({m.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Qtd por Unidade
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      value={componentQty}
                      onChange={(e) => setComponentQty(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                    />
                  </div>

                  <div className="w-full sm:w-auto pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={addComponentToBOM}
                      className="w-full sm:w-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs"
                    >
                      + Incluir
                    </button>
                  </div>
                </div>

                {/* Tabela de componentes adicionados */}
                {formData.components.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Insumo</th>
                          <th className="px-3 py-2">Qtd Necessária</th>
                          <th className="px-3 py-2 text-right">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData.components.map((c, i) => {
                          const mat = materials.find((m) => m.id === c.materialId);
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-3 py-1.5 font-medium text-slate-800">
                                {mat ? `${mat.name} (${mat.code})` : 'Insumo não encontrado'}
                              </td>
                              <td className="px-3 py-1.5 font-bold font-mono text-slate-900">
                                {c.quantityNeeded} {mat ? mat.unit : ''}
                              </td>
                              <td className="px-3 py-1.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeComponentFromBOM(i)}
                                  className="text-rose-600 hover:text-rose-800 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 text-center border border-dashed border-slate-300 rounded-lg text-slate-400">
                    Nenhum componente adicionado à Ficha Técnica ainda.
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações de Fabricação</label>
                <textarea
                  rows={2}
                  placeholder="Instruções de montagem, cuidados no acabamento, especificações técnicas..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  {editingProduct ? 'Salvar Ficha Técnica' : 'Cadastrar Ficha Técnica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
