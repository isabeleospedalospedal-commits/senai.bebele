/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import {
  Factory,
  LayoutDashboard,
  FileSpreadsheet,
  PackageCheck,
  Users,
  Gauge,
  ShoppingCart,
  HardHat,
  Timer,
  Download,
  Upload,
  RotateCcw,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { storageService } from '../services/storageService';

export type NavTab =
  | 'dashboard'
  | 'products'
  | 'materials'
  | 'partners'
  | 'capacity'
  | 'orders'
  | 'production_orders'
  | 'tracking';

interface Props {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenDoc: () => void;
}

export const Header: React.FC<Props> = ({ currentTab, onSelectTab, onOpenDoc }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    if (
      window.confirm(
        'Deseja restaurar os dados de demonstração da pequena fábrica de móveis? Quaisquer alterações não exportadas serão sobrescritas.'
      )
    ) {
      storageService.resetToInitial();
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(storageService.exportJSON());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_mini_erp_manufatura_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storageService.importJSON(content);
      if (success) {
        alert('Dados importados com sucesso!');
      } else {
        alert('Falha ao importar: arquivo JSON inválido ou incompatível com a estrutura do ERP.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'products', label: 'Fichas Técnicas', icon: FileSpreadsheet },
    { id: 'materials', label: 'Matérias-Primas', icon: PackageCheck },
    { id: 'partners', label: 'Clientes & Fornecedores', icon: Users },
    { id: 'capacity', label: 'Capacidade Produtiva', icon: Gauge },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'production_orders', label: 'Ordens de Produção', icon: HardHat },
    { id: 'tracking', label: 'Acompanhamento PCP', icon: Timer },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner & Quick Tools */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3 border-b border-slate-100">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-sm">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black tracking-tight text-slate-900">
                  MINI-ERP <span className="text-indigo-600 font-semibold text-base">MANUFATURA</span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Persistência Local Ativa
                </span>
              </div>
              <p className="text-xs text-slate-500">
                PCP: Planejamento, Fichas Técnicas, Capacidade e Controle da Produção
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <button
              onClick={onOpenDoc}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              title="Ver documentação e manual do sistema"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Como Usar / Manual</span>
            </button>

            <button
              onClick={handleExport}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
              title="Baixar cópia de segurança de todos os dados em JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar Backup</span>
            </button>

            <label
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
              title="Importar dados a partir de um arquivo JSON salvo anteriormente"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Importar</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <button
              onClick={handleReset}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 transition"
              title="Restaurar base inicial da fábrica de demonstração"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
              <span>Dados Exemplo</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
