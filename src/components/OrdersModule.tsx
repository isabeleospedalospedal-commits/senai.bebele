/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  Building,
  HardHat,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { SalesOrder, Partner, Product, OrderItem, OrderStatus, WorkCenter } from '../types/erp';
import { storageService } from '../services/storageService';
import { formatCurrency, formatDate, getOrderStatusBadge } from '../utils/formatters';

interface Props {
  orders: SalesOrder[];
  partners: Partner[];
  products: Product[];
  workCenters: WorkCenter[];
  onOpenEmitOP: (orderId: string, productId: string, qty: number) => void;
}

export const OrdersModule: React.FC<Props> = ({
  orders,
  partners,
  products,
  workCenters,
  onOpenEmitOP,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    orderNumber: '',
    customerId: '',
    orderDate: new Date().toISOString().slice(0, 10),
    deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    status: 'pending' as OrderStatus,
    items: [] as OrderItem[],
    notes: '',
  });

  const [formError, setFormError] = useState('');

  // Row builder for items inside order modal
  const [selectedProdId, setSelectedProdId] = useState(products.length > 0 ? products[0].id : '');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  const clients = partners.filter((p) => p.type === 'client' || p.type === 'both');

  const openCreateModal = () => {
    setEditingOrder(null);
    const count = orders.length + 1;
    const initialProd = products[0];
    setSelectedProdId(initialProd ? initialProd.id : '');
    setItemPrice(initialProd ? initialProd.salePrice : 0);
    setItemQty(1);

    setFormData({
      orderNumber: `PED-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`,
      customerId: clients.length > 0 ? clients[0].id : '',
      orderDate: new Date().toISOString().slice(0, 10),
      deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: 'pending',
      items: initialProd
        ? [{ id: `item-${Date.now()}`, productId: initialProd.id, quantity: 1, unitPrice: initialProd.salePrice }]
        : [],
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (order: SalesOrder) => {
    setEditingOrder(order);
    setFormData({
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      status: order.status,
      items: [...order.items],
      notes: order.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleProductSelectChange = (prodId: string) => {
    setSelectedProdId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setItemPrice(prod.salePrice);
    }
  };

  const addItemToOrder = () => {
    if (!selectedProdId) return;
    if (itemQty <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      productId: selectedProdId,
      quantity: itemQty,
      unitPrice: itemPrice,
    };

    setFormData({ ...formData, items: [...formData.items, newItem] });
    setItemQty(1);
  };

  const removeItemFromOrder = (id: string) => {
    setFormData({ ...formData, items: formData.items.filter((item) => item.id !== id) });
  };

  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setFormError('Selecione um cliente para o pedido.');
      return;
    }
    if (!formData.deliveryDate) {
      setFormError('Informe a data de entrega prometida.');
      return;
    }
    if (formData.items.length === 0) {
      setFormError('Adicione pelo menos um produto ao pedido.');
      return;
    }

    const totalAmount = calculateTotal(formData.items);

    try {
      storageService.saveOrder({
        id: editingOrder ? editingOrder.id : undefined,
        orderNumber: formData.orderNumber,
        customerId: formData.customerId,
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate,
        status: formData.status,
        items: formData.items,
        totalAmount,
        notes: formData.notes.trim() || undefined,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar pedido.');
    }
  };

  const handleDelete = (order: SalesOrder) => {
    if (window.confirm(`Deseja excluir o pedido ${order.orderNumber}?`)) {
      const res = storageService.deleteOrder(order.id);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  const filteredOrders = orders.filter((o) => {
    const customer = partners.find((p) => p.id === o.customerId);
    const matchesFilter = filterStatus === 'all' ? true : o.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(term) ||
      (customer && customer.name.toLowerCase().includes(term));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShoppingCart className="w-6 h-6 text-amber-600" />
            <span>Módulo 5: Cadastro &amp; Gestão de Pedidos de Venda</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de pedidos vinculados a clientes, produtos, datas de entrega e emissão direta de OPs.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Pedido de Venda</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'Todos os Pedidos' },
            { id: 'pending', label: 'Pendentes' },
            { id: 'in_production', label: 'Em Produção' },
            { id: 'completed', label: 'Concluídos' },
            { id: 'delivered', label: 'Entregues' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                filterStatus === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
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
            placeholder="Buscar por número do pedido ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            Nenhum pedido encontrado.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const customer = partners.find((p) => p.id === order.customerId);
            const badge = getOrderStatusBadge(order.status);

            // Verificar proximidade da data de entrega
            const today = new Date().toISOString().slice(0, 10);
            const isLate = order.deliveryDate < today && order.status !== 'completed' && order.status !== 'delivered';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition hover:border-slate-300"
              >
                {/* Header Pedido */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                      {order.orderNumber}
                    </span>

                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border ${badge.bg}`}>
                      {badge.label}
                    </span>

                    <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-medium">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{customer ? customer.name : 'Cliente não identificado'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Emissão: {formatDate(order.orderDate)}</span>
                    </div>

                    <div
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-semibold ${
                        isLate
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Entrega: {formatDate(order.deliveryDate)}</span>
                      {isLate && <span className="text-[10px] uppercase font-bold">(Atrasado)</span>}
                    </div>

                    <div className="font-mono font-bold text-sm text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </div>

                    <div className="flex items-center space-x-1 pl-2">
                      <button
                        onClick={() => openEditModal(order)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                        title="Editar pedido"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(order)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Excluir pedido"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="p-4 sm:p-5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-slate-500 font-semibold border-b border-slate-200 pb-2">
                        <tr>
                          <th className="pb-2">Produto</th>
                          <th className="pb-2">Quantidade</th>
                          <th className="pb-2">Preço Unitário</th>
                          <th className="pb-2">Subtotal</th>
                          <th className="pb-2 text-right">Planejamento &amp; Fabricação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {order.items.map((item) => {
                          const prod = products.find((p) => p.id === item.productId);
                          const subtotal = item.quantity * item.unitPrice;

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5">
                                <span className="font-semibold text-slate-900">
                                  {prod ? prod.name : 'Produto não encontrado'}
                                </span>
                                {prod && (
                                  <span className="font-mono text-[10px] text-slate-400 block">
                                    {prod.code}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 font-bold font-mono text-slate-800 text-sm">
                                {item.quantity} un
                              </td>
                              <td className="py-2.5 font-mono text-slate-600">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="py-2.5 font-mono font-semibold text-slate-900">
                                {formatCurrency(subtotal)}
                              </td>
                              <td className="py-2.5 text-right">
                                <button
                                  onClick={() => onOpenEmitOP(order.id, item.productId, item.quantity)}
                                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold text-xs transition"
                                  title="Emitir Ordem de Produção para fabricar este item"
                                >
                                  <HardHat className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Gerar OP</span>
                                  <ArrowRight className="w-3 h-3 text-indigo-400" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {order.notes && (
                    <p className="mt-3 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <strong>Observações do Pedido:</strong> {order.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Criar / Editar Pedido */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingOrder ? 'Editar Pedido de Venda' : 'Registrar Novo Pedido de Venda'}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número do Pedido</label>
                  <input
                    type="text"
                    required
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cliente *</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="">Selecione o cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.document})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data do Pedido</label>
                  <input
                    type="date"
                    required
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Prevista de Entrega *</label>
                  <input
                    type="date"
                    required
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Atual</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as OrderStatus })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_production">Em Produção</option>
                    <option value="completed">Concluído</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Itens do Pedido */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>Produtos do Pedido</span>
                </h4>

                {/* Seletor de Produto */}
                <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Produto</label>
                    <select
                      value={selectedProdId}
                      onChange={(e) => handleProductSelectChange(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-24">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Qtd (un)</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                    />
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Preço Unit. (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono"
                    />
                  </div>

                  <div className="w-full sm:w-auto pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={addItemToOrder}
                      className="w-full sm:w-auto px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs"
                    >
                      + Adicionar
                    </button>
                  </div>
                </div>

                {/* Lista de itens inseridos */}
                {formData.items.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Produto</th>
                          <th className="px-3 py-2">Quantidade</th>
                          <th className="px-3 py-2">Preço Unit.</th>
                          <th className="px-3 py-2">Subtotal</th>
                          <th className="px-3 py-2 text-right">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formData.items.map((item) => {
                          const prod = products.find((p) => p.id === item.productId);
                          return (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-3 py-1.5 font-medium text-slate-900">
                                {prod ? prod.name : 'Produto'}
                              </td>
                              <td className="px-3 py-1.5 font-mono font-bold text-slate-800">
                                {item.quantity} un
                              </td>
                              <td className="px-3 py-1.5 font-mono text-slate-600">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">
                                {formatCurrency(item.quantity * item.unitPrice)}
                              </td>
                              <td className="px-3 py-1.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeItemFromOrder(item.id)}
                                  className="text-rose-600 hover:text-rose-800 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-right text-slate-700">
                            Valor Total do Pedido:
                          </td>
                          <td colSpan={2} className="px-3 py-2 text-amber-700 font-mono text-sm">
                            {formatCurrency(calculateTotal(formData.items))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 text-center border border-dashed border-slate-300 rounded-lg text-slate-400">
                    Nenhum produto adicionado ao pedido ainda.
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações / Condições Especiais</label>
                <textarea
                  rows={2}
                  placeholder="Endereço de entrega, requisitos especiais, prazos acordados..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  {editingOrder ? 'Salvar Alterações' : 'Criar Pedido de Venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
