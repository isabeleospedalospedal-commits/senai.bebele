/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import { Partner, PartnerType } from '../types/erp';
import { storageService } from '../services/storageService';
import { getPartnerTypeBadge, formatDate } from '../utils/formatters';

interface Props {
  partners: Partner[];
}

export const PartnersModule: React.FC<Props> = ({ partners }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'client' as PartnerType,
    document: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });

  const [formError, setFormError] = useState<string>('');

  const openCreateModal = () => {
    setEditingPartner(null);
    setFormData({
      name: '',
      type: 'client',
      document: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      type: partner.type,
      document: partner.document,
      email: partner.email,
      phone: partner.phone,
      address: partner.address || '',
      city: partner.city || '',
      notes: partner.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('O Nome ou Razão Social é obrigatório.');
      return;
    }
    if (!formData.document.trim()) {
      setFormError('O Documento (CPF ou CNPJ) é obrigatório.');
      return;
    }

    try {
      storageService.savePartner({
        id: editingPartner ? editingPartner.id : undefined,
        name: formData.name.trim(),
        type: formData.type,
        document: formData.document.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        notes: formData.notes.trim(),
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar parceiro.');
    }
  };

  const handleDelete = (partner: Partner) => {
    if (window.confirm(`Tem certeza que deseja excluir o cadastro de "${partner.name}"?`)) {
      const result = storageService.deletePartner(partner.id);
      if (!result.success) {
        alert(result.error);
      }
    }
  };

  const filteredPartners = partners.filter((p) => {
    const matchesFilter =
      filterType === 'all'
        ? true
        : filterType === 'client'
        ? p.type === 'client' || p.type === 'both'
        : filterType === 'supplier'
        ? p.type === 'supplier' || p.type === 'both'
        : p.type === filterType;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      p.document.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      (p.city && p.city.toLowerCase().includes(term));

    return matchesFilter && matchesSearch;
  });

  const clientsCount = partners.filter((p) => p.type === 'client' || p.type === 'both').length;
  const suppliersCount = partners.filter((p) => p.type === 'supplier' || p.type === 'both').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Módulo 3: Clientes &amp; Fornecedores (Parceiros Comerciais)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro unificado de clientes de pedidos de venda e fornecedores de matéria-prima.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente / Fornecedor</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Total de Parceiros</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{partners.length}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-blue-100 bg-blue-50/30 shadow-2xs">
          <p className="text-xs font-medium text-blue-700">Clientes Ativos</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{clientsCount}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-emerald-100 bg-emerald-50/30 shadow-2xs">
          <p className="text-xs font-medium text-emerald-700">Fornecedores Cadastrados</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{suppliersCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'client', label: 'Clientes' },
            { id: 'supplier', label: 'Fornecedores' },
            { id: 'both', label: 'Ambos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
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
            placeholder="Buscar por nome, documento ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table of Partners */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Parceiro / Razão Social</th>
                <th className="px-4 py-3">Tipo de Cadastro</th>
                <th className="px-4 py-3">Documento (CPF/CNPJ)</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Localização</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Nenhum parceiro encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => {
                  const badge = getPartnerTypeBadge(partner.type);
                  return (
                    <tr key={partner.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{partner.name}</span>
                        </div>
                        {partner.notes && (
                          <p className="text-[11px] text-slate-500 font-normal mt-0.5 line-clamp-1">
                            {partner.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {partner.document}
                      </td>
                      <td className="px-4 py-3 text-slate-600 space-y-0.5">
                        {partner.email && (
                          <div className="flex items-center space-x-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{partner.email}</span>
                          </div>
                        )}
                        {partner.phone && (
                          <div className="flex items-center space-x-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{partner.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {partner.city || partner.address ? (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{partner.city || partner.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => openEditModal(partner)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                            title="Editar parceiro"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(partner)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Excluir parceiro"
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

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingPartner ? 'Editar Cadastro de Parceiro' : 'Novo Cliente ou Fornecedor'}
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tipo de Parceiro *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'client', label: 'Cliente' },
                    { id: 'supplier', label: 'Fornecedor' },
                    { id: 'both', label: 'Ambos' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t.id as PartnerType })}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition ${
                        formData.type === t.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome ou Razão Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Studio Moura Arquitetura Ltda"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Documento (CPF / CNPJ) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telefone / Celular
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  E-mail Comercial
                </label>
                <input
                  type="email"
                  placeholder="contato@empresa.com.br"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cidade / UF
                  </label>
                  <input
                    type="text"
                    placeholder="São Paulo - SP"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, número, bairro"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observações Internas
                </label>
                <textarea
                  rows={2}
                  placeholder="Condições de pagamento, horário de recebimento, preferências..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition"
                >
                  {editingPartner ? 'Salvar Alterações' : 'Cadastrar Parceiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
