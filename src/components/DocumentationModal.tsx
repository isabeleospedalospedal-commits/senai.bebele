/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, BookOpen, Database, Layers, CheckCircle, Clock, Cpu, HardHat, FileText, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Manual &amp; Guia do Mini-ERP de Manufatura</h2>
              <p className="text-xs text-slate-500">Planejamento e Controle da Produção (PCP) para Pequenas Indústrias</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed">
          {/* Box de Justificativa Técnica de Persistência */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <div className="flex items-center space-x-2 text-indigo-900 font-semibold mb-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>Justificativa da Escolha de Persistência (Requisito Obrigatório)</span>
            </div>
            <p className="text-indigo-800 text-xs">
              Optou-se pela persistência via <strong>localStorage do navegador</strong> integrado a uma camada de serviço tipada em TypeScript com validações relacionais.
            </p>
            <ul className="mt-2 text-xs text-indigo-700 list-disc list-inside space-y-1">
              <li><strong>Zero dependência de infraestrutura externa:</strong> Permite que a pequena manufatura opere instantaneamente sem custos de banco na nuvem.</li>
              <li><strong>Persistência entre sessões:</strong> Os dados cadastrados permanecem salvos ao fechar ou atualizar o navegador.</li>
              <li><strong>Segurança com Backup:</strong> O sistema possui ferramentas nativas para exportar e importar backups JSON completos e restaurar dados de teste.</li>
            </ul>
          </div>

          {/* Fluxo Recomendado de PCP */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Fluxo de Operação do PCP (Passo a Passo)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded mb-1">Passo 1</span>
                <h4 className="font-semibold text-slate-800 text-sm">Clientes &amp; Fornecedores (Parceiros)</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Cadastre empresas clientes e fornecedoras de insumos com CPF/CNPJ, telefone e e-mail.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded mb-1">Passo 2</span>
                <h4 className="font-semibold text-slate-800 text-sm">Cadastro de Matéria-Prima</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Registre insumos, unidades de medida (m, un, kg, L), estoque atual, estoque mínimo e fornecedor de referência.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded mb-1">Passo 3</span>
                <h4 className="font-semibold text-slate-800 text-sm">Capacidade Produtiva</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Configure postos de trabalho (máquinas/linhas), horas diárias de trabalho, operadores e eficiência operacional (%).
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded mb-1">Passo 4</span>
                <h4 className="font-semibold text-slate-800 text-sm">Ficha Técnica do Produto (BOM)</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Monte a lista de matérias-primas por unidade e informe o tempo de fabricação (em minutos) para o planejamento.
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded mb-1">Passo 5</span>
                <h4 className="font-semibold text-slate-800 text-sm">Cadastro de Pedidos de Venda</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Lance pedidos com cliente, data de entrega acordada e produtos. Use o botão <strong>&quot;Gerar OP&quot;</strong> para acionar a fábrica!
                </p>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 rounded mb-1">Passo 6 e 7</span>
                <h4 className="font-semibold text-slate-800 text-sm">Emissão &amp; Acompanhamento da Produção</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Gere a OP com matérias-primas calculadas. No Kanban, controle: Iniciar, Pausar e Concluir, comparando tempo previsto vs realizado e baixando o estoque.
                </p>
              </div>
            </div>
          </div>

          {/* Destaque das Regras Relacionais */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Validações e Integridade Relacional Ativas</span>
            </h4>
            <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
              <li>Não permite excluir matéria-prima que esteja presente na Ficha Técnica de um produto.</li>
              <li>Não permite excluir produto vinculado a pedidos ou ordens de produção no histórico.</li>
              <li>Calcula automaticamente a necessidade total de matéria-prima multiplicando a quantidade da OP pela quantidade na ficha técnica.</li>
              <li>Destaca em vermelho insumos que não possuem estoque suficiente no momento do planejamento da OP.</li>
              <li>Baixa automaticamente os insumos do estoque físico quando a ordem é iniciada ou finalizada.</li>
            </ul>
          </div>

          {/* Como executar o projeto */}
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs space-y-2">
            <div className="text-slate-400 font-sans text-xs font-bold uppercase tracking-wider">
              Instruções de Instalação e Execução (Desenvolvimento)
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
              <p className="text-emerald-400"># 1. Instalar dependências</p>
              <p>npm install</p>
              <p className="text-emerald-400 mt-2"># 2. Iniciar servidor de desenvolvimento</p>
              <p>npm run dev</p>
              <p className="text-emerald-400 mt-2"># 3. Compilar para produção</p>
              <p>npm run build</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow transition"
          >
            Entendido, ir para o sistema
          </button>
        </div>
      </div>
    </div>
  );
};
