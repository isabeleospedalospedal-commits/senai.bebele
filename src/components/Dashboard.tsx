/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  HardHat,
  PackageCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Gauge,
  CheckCircle,
  Plus,
  Play,
  Building,
} from 'lucide-react';
import {
  SalesOrder,
  ProductionOrder,
  RawMaterial,
  Product,
  WorkCenter,
  Partner,
} from '../types/erp';
import { formatCurrency, formatDate, formatMinutes, getOrderStatusBadge } from '../utils/formatters';
import { NavTab } from './Header';

interface Props {
  orders: SalesOrder[];
  productionOrders: ProductionOrder[];
  materials: RawMaterial[];
  products: Product[];
  workCenters: WorkCenter[];
  partners: Partner[];
  onNavigate: (tab: NavTab) => void;
  onOpenEmitOP: () => void;
}

export const Dashboard: React.FC<Props> = ({
  orders,
  productionOrders,
  materials,
  products,
  workCenters,
  partners,
  onNavigate,
  onOpenEmitOP,
}) => {
  // Key Metrics
  const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'delivered' && o.status !== 'cancelled');
  const totalActiveOrderAmount = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const runningOPs = productionOrders.filter((op) => op.status === 'in_production');
  const waitingOPs = productionOrders.filter((op) => op.status === 'waiting');

  const lowStockMaterials = materials.filter((m) => m.currentStock <= m.minStock);

  // Capacidade total vs ocupação
  let totalEffectiveWeeklyHours = 0;
  let totalBookedHours = 0;

  workCenters.forEach((wc) => {
    const effectiveWeekly = wc.dailyHours * wc.daysPerWeek * wc.workersCount * (wc.efficiencyPercentage / 100);
    totalEffectiveWeeklyHours += effectiveWeekly;

    const activeOpsForCenter = productionOrders.filter(
      (op) => op.workCenterId === wc.id && op.status !== 'completed' && op.status !== 'cancelled'
    );
    const minutes = activeOpsForCenter.reduce((acc, op) => acc + (op.estimatedTimeMinutes || 0), 0);
    totalBookedHours += minutes / 60;
  });

  const overallOccupancy = totalEffectiveWeeklyHours > 0
    ? Math.round((totalBookedHours / totalEffectiveWeeklyHours) * 100)
    : 0;

  // Próximas entregas
  const sortedUpcomingOrders = [...activeOrders].sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <LayoutDashboard className="w-4 h-4" />
            <span>Painel de Planejamento &amp; Controle da Produção (PCP)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Oficina &amp; Manufatura: Visão Geral de Operações
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Acompanhe em tempo real a carteira de pedidos, ocupação de capacidade dos postos, OPs em andamento e alertas de matéria-prima.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('orders')}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Novo Pedido</span>
          </button>
          <button
            onClick={onOpenEmitOP}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <HardHat className="w-4 h-4" />
            <span>Emitir OP</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pedidos em Carteira */}
        <div
          onClick={() => onNavigate('orders')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-amber-300 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pedidos em Aberto</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{activeOrders.length}</p>
          <p className="text-xs text-slate-500 mt-1">
            Valor em carteira: <strong className="text-amber-700">{formatCurrency(totalActiveOrderAmount)}</strong>
          </p>
        </div>

        {/* Card 2: OPs em Produção */}
        <div
          onClick={() => onNavigate('tracking')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-sky-300 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">OPs no Chão de Fábrica</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition">
              <HardHat className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-900 mt-2">{runningOPs.length}</p>
          <p className="text-xs text-slate-500 mt-1">
            +{waitingOPs.length} aguardando início no fluxo
          </p>
        </div>

        {/* Card 3: Ocupação da Capacidade */}
        <div
          onClick={() => onNavigate('capacity')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-purple-300 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ocupação da Capacidade</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-900 mt-2">{overallOccupancy}%</p>
          <p className="text-xs text-slate-500 mt-1">
            {Math.round(totalBookedHours * 10) / 10}h alocadas de {Math.round(totalEffectiveWeeklyHours)}h úteis/sem
          </p>
        </div>

        {/* Card 4: Insumos com Estoque Baixo */}
        <div
          onClick={() => onNavigate('materials')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-rose-300 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Alertas de Matéria-Prima</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-900 mt-2">{lowStockMaterials.length}</p>
          <p className="text-xs text-slate-500 mt-1">
            {lowStockMaterials.length > 0
              ? 'Itens atingiram estoque mínimo'
              : 'Nenhum insumo em nível crítico'}
          </p>
        </div>
      </div>

      {/* Grid: Postos de Trabalho & Próximas Entregas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Postos de Trabalho / Capacidade */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Gauge className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Carga por Posto de Trabalho (Gargalos)
                </h3>
              </div>
              <button
                onClick={() => onNavigate('capacity')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center space-x-1"
              >
                <span>Ver Todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {workCenters.map((wc) => {
                const weeklyEffective = wc.dailyHours * wc.daysPerWeek * wc.workersCount * (wc.efficiencyPercentage / 100);
                const activeOps = productionOrders.filter(
                  (op) => op.workCenterId === wc.id && op.status !== 'completed' && op.status !== 'cancelled'
                );
                const bookedMinutes = activeOps.reduce((acc, op) => acc + (op.estimatedTimeMinutes || 0), 0);
                const bookedH = bookedMinutes / 60;
                const rate = weeklyEffective > 0 ? Math.round((bookedH / weeklyEffective) * 100) : 0;
                const isOver = rate > 100;

                return (
                  <div key={wc.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{wc.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono ml-1.5">({wc.code})</span>
                      </div>
                      <span className="font-mono font-bold text-slate-700">
                        {Math.round(bookedH * 10) / 10}h / {Math.round(weeklyEffective)}h ({rate}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : rate >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, rate)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Calculado com base nas horas disponíveis e eficiência de cada máquina</span>
            <span className="font-medium text-purple-700">PCP Integrado</span>
          </div>
        </div>

        {/* Próximas Entregas de Pedidos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Próximos Prazos de Entrega de Pedidos
                </h3>
              </div>
              <button
                onClick={() => onNavigate('orders')}
                className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center space-x-1"
              >
                <span>Ver Pedidos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {sortedUpcomingOrders.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">
                  Nenhum pedido pendente de entrega.
                </p>
              ) : (
                sortedUpcomingOrders.map((order) => {
                  const customer = partners.find((p) => p.id === order.customerId);
                  const badge = getOrderStatusBadge(order.status);
                  const isLate = order.deliveryDate < new Date().toISOString().slice(0, 10);

                  return (
                    <div
                      key={order.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 transition flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          {customer ? customer.name : 'Cliente'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-semibold font-mono block ${
                            isLate ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {formatDate(order.deliveryDate)}
                        </span>
                        <span className="text-[11px] font-bold text-slate-900 font-mono">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Dica: Clique no botão &quot;Gerar OP&quot; nos pedidos para disparar a fabricação imediata.
          </div>
        </div>
      </div>

      {/* OPs em Andamento no Chão de Fábrica */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Play className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Ordens de Produção Atualmente em Fabricação
            </h3>
          </div>
          <button
            onClick={() => onNavigate('tracking')}
            className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center space-x-1"
          >
            <span>Ir para o Kanban PCP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {runningOPs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
            Nenhuma ordem de produção em andamento neste momento. Inicie uma OP no Kanban de produção!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {runningOPs.map((op) => {
              const prod = products.find((p) => p.id === op.productId);
              const wc = workCenters.find((w) => w.id === op.workCenterId);

              return (
                <div
                  key={op.id}
                  className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-800">{op.opNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800 animate-pulse">
                      Em Execução
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{prod ? prod.name : 'Produto'}</p>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p>Posto: <strong>{wc ? wc.name : '-'}</strong></p>
                    <p>Lote: <strong>{op.quantity} un</strong></p>
                    <p>Tempo Previsto: <strong>{formatMinutes(op.estimatedTimeMinutes)}</strong></p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
