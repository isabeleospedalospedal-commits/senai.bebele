/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * MINI-ERP MANUFATURA - UTILITÁRIOS DE FORMATAÇÃO E STATUS
 */

import { OrderStatus, PartnerType, ProductionOrderStatus } from '../types/erp';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    // Se for string YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateTimeStr?: string): string {
  if (!dateTimeStr) return '-';
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateTimeStr;
  }
}

/**
 * Converte minutos em formato amigável como "2h 30m" ou "45 min".
 */
export function formatMinutes(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0 min';
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

export function getPartnerTypeBadge(type: PartnerType): { label: string; bg: string; text: string } {
  switch (type) {
    case 'client':
      return { label: 'Cliente', bg: 'bg-blue-100 text-blue-800 border-blue-200', text: 'text-blue-800' };
    case 'supplier':
      return { label: 'Fornecedor', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'text-emerald-800' };
    case 'both':
      return { label: 'Cliente & Fornecedor', bg: 'bg-purple-100 text-purple-800 border-purple-200', text: 'text-purple-800' };
    default:
      return { label: type, bg: 'bg-gray-100 text-gray-800 border-gray-200', text: 'text-gray-800' };
  }
}

export function getOrderStatusBadge(status: OrderStatus): { label: string; bg: string } {
  switch (status) {
    case 'pending':
      return { label: 'Pendente', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'in_production':
      return { label: 'Em Produção', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'completed':
      return { label: 'Concluído', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'delivered':
      return { label: 'Entregue', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
    case 'cancelled':
      return { label: 'Cancelado', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
    default:
      return { label: status, bg: 'bg-gray-100 text-gray-700 border-gray-300' };
  }
}

export function getOpStatusBadge(status: ProductionOrderStatus): { label: string; bg: string; border: string } {
  switch (status) {
    case 'waiting':
      return { label: 'Aguardando Início', bg: 'bg-slate-100 text-slate-700', border: 'border-slate-300' };
    case 'in_production':
      return { label: 'Em Produção', bg: 'bg-sky-100 text-sky-800 animate-pulse', border: 'border-sky-300' };
    case 'paused':
      return { label: 'Pausada', bg: 'bg-amber-100 text-amber-800', border: 'border-amber-300' };
    case 'completed':
      return { label: 'Concluída', bg: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-300' };
    case 'cancelled':
      return { label: 'Cancelada', bg: 'bg-rose-100 text-rose-800', border: 'border-rose-300' };
    default:
      return { label: status, bg: 'bg-gray-100 text-gray-700', border: 'border-gray-300' };
  }
}
