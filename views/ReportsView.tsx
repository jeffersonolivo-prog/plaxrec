import React, { useState, useEffect } from 'react';
import { User, UserRole, Transaction, KG_TO_PLAX_RATE } from '../types';
import { plaxService } from '../services/mockState';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, Award, Leaf, Recycle, Factory, Truck } from 'lucide-react';

interface ReportsViewProps {
  user: User;
  refresh: () => void;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export const ReportsView: React.FC<ReportsViewProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await plaxService.getTransactions(user.id);
      // Ordenar por data (antiga -> nova) para os gráficos
      setTransactions(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setLoading(false);
    };
    load();
  }, [user.id]);

  // --- CÁLCULOS DINÂMICOS POR PERFIL ---

  // 1. KPI de Impacto (Peso)
  const calculateImpactWeight = () => {
    let weight = 0;
    transactions.forEach(t => {
      // Coletor: Ganha Plax ao coletar (Input)
      if (user.role === UserRole.COLLECTOR && t.type === 'COLLECTION' && t.toUserId === user.id) {
         weight += (t.amountPlax || 0) / KG_TO_PLAX_RATE;
      }
      // Reciclador: Processa material (NFe Output)
      if (user.role === UserRole.RECYCLER && t.type === 'NFE_RELEASE' && t.fromUserId === user.id) {
         weight += (t.amountPlax || 0) / KG_TO_PLAX_RATE;
      }
      // Transformador: Compra material (NFe Input)
      if (user.role === UserRole.TRANSFORMER && t.type === 'NFE_RELEASE' && t.toUserId === user.id) {
         weight += (t.amountPlax || 0) / KG_TO_PLAX_RATE;
      }
      // ESG: Compra Créditos
      if (user.role === UserRole.ESG_BUYER && t.type === 'ESG_PURCHASE') {
         // Extraindo peso da descrição de forma simplificada ou usando valor aproximado
         // Na prática, ideal seria ter o peso na transação, mas vamos estimar pelo valor BRL se a descrição falhar
         const match = t.description.match(/([0-9.]+)kg/);
         if (match) {
             weight += parseFloat(match[1]);
         }
      }
    });
    return weight;
  };

  // 2. Dados para Gráfico Financeiro (Evolução de Saldo Acumulado)
  const getFinancialEvolutionData = () => {
    let currentPlax = 0;
    let currentBRL = 0;
    const dataPoints: any[] = [];

    transactions.forEach(t => {
       const date = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
       
       // PLAX Logic
       if (t.amountPlax) {
           if (t.toUserId === user.id) currentPlax += t.amountPlax;
           if (t.fromUserId === user.id) currentPlax -= t.amountPlax;
       }

       // BRL Logic
       if (t.amountBRL) {
           if (t.toUserId === user.id) currentBRL += t.amountBRL;
           if (t.fromUserId === user.id) currentBRL -= t.amountBRL;
       }

       // Add point (simplified: taking last transaction of the day ideally, but showing flow here)
       dataPoints.push({
           name: date,
           plax: currentPlax,
           brl: currentBRL
       });
    });
    
    // Se não tiver dados, inicia com zero
    if (dataPoints.length === 0) return [{ name: 'Início', plax: 0, brl: 0 }];
    
    // Pegar apenas os últimos 10 pontos para não poluir o gráfico
    return dataPoints.slice(-15);
  };

  // 3. Distribuição de Fontes (Pie Chart)
  const getIncomeSourcesData = () => {
      const sources: Record<string, number> = {};
      
      transactions.forEach(t => {
          if (t.toUserId === user.id) { // Entradas apenas
              let label = 'Outros';
              if (t.type === 'COLLECTION') label = 'Venda Material';
              if (t.type === 'NFE_RELEASE') label = 'Venda Processada (NFe)';
              if (t.type === 'ESG_PURCHASE') label = 'Venda Crédito ESG';
              if (t.type === 'DEPOSIT') label = 'Aportes';
              if (t.type === 'TRANSFER') label = 'Doações Recebidas';
              
              const val = (t.amountBRL || 0) + ((t.amountPlax || 0) * 0.5); // Normaliza para valor monetário aprox
              sources[label] = (sources[label] || 0) + val;
          }
      });

      return Object.keys(sources).map(k => ({ name: k, value: sources[k] })).filter(i => i.value > 0);
  };

  const impactWeight = calculateImpactWeight();
  const financialData = getFinancialEvolutionData();
  const pieData = getIncomeSourcesData();

  // Texto personalizado por Role
  const getImpactLabel = () => {
      switch(user.role) {
          case UserRole.COLLECTOR: return "Resíduos Coletados";
          case UserRole.RECYCLER: return "Resíduos Processados";
          case UserRole.TRANSFORMER: return "Matéria-Prima Industrializada";
          case UserRole.ESG_BUYER: return "Compensação Ambiental";
          default: return "Volume Movimentado";
      }
  };

  const getImpactIcon = () => {
      switch(user.role) {
          case UserRole.COLLECTOR: return <Recycle size={24} />;
          case UserRole.RECYCLER: return <Factory size={24} />;
          case UserRole.TRANSFORMER: return <Truck size={24} />;
          case UserRole.ESG_BUYER: return <Leaf size={24} />;
          default: return <Award size={24} />;
      }
  };

  if (loading) return <div className="p-10 text-center">Carregando dados...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Relatórios de Performance</h2>
            <p className="text-sm text-gray-500">Dados exclusivos de: <span className="font-bold text-plax-700">{user.name}</span> ({user.role})</p>
        </div>
        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
           Exportar PDF
        </button>
      </div>

      {/* KPI Cards Dinâmicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Card 1: Impacto Físico */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`p-3 rounded-full ${user.role === UserRole.ESG_BUYER ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
               {getImpactIcon()}
            </div>
            <div>
               <p className="text-sm text-gray-500">{getImpactLabel()}</p>
               <p className="text-2xl font-bold text-gray-800">
                   {impactWeight.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} <span className="text-xs font-normal text-gray-400">kg</span>
               </p>
            </div>
         </div>

         {/* Card 2: Financeiro */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
               <TrendingUp size={24} />
            </div>
            <div>
               <p className="text-sm text-gray-500">Patrimônio Atual (R$)</p>
               <p className="text-2xl font-bold text-gray-800">R$ {user.balanceBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
         </div>

         {/* Card 3: Plax / Score */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-plax-100 rounded-full text-plax-600">
               <Award size={24} />
            </div>
            <div>
               <p className="text-sm text-gray-500">Saldo Plax (Utility Token)</p>
               <p className="text-2xl font-bold text-gray-800">{user.balancePlax.toFixed(2)}</p>
            </div>
         </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-700 mb-6">Evolução do Seu Saldo</h3>
           <div className="h-80 w-full">
             {financialData.length > 1 || (financialData[0].plax > 0 || financialData[0].brl > 0) ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={financialData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorBrl" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorPlax" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                     <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                     <Legend />
                     <Area type="monotone" dataKey="plax" stroke="#22c55e" fillOpacity={1} fill="url(#colorPlax)" name="Saldo Plax" />
                     <Area type="monotone" dataKey="brl" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBrl)" name="Saldo R$" />
                   </AreaChart>
                 </ResponsiveContainer>
             ) : (
                 <div className="h-full flex items-center justify-center text-gray-400 text-sm flex-col border-2 border-dashed border-gray-100 rounded-lg">
                    <p>Sem dados suficientes para gerar gráfico.</p>
                    <p className="text-xs mt-1">Realize transações para visualizar sua evolução.</p>
                 </div>
             )}
           </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-700 mb-6">Fontes de Receita (Entradas)</h3>
           <div className="h-80 w-full">
             {pieData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                 </ResponsiveContainer>
             ) : (
                 <div className="h-full flex items-center justify-center text-gray-400 text-sm flex-col border-2 border-dashed border-gray-100 rounded-lg">
                    <p>Nenhuma receita registrada.</p>
                 </div>
             )}
           </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
         <h4 className="font-bold text-blue-900 mb-2">Nota de Privacidade</h4>
         <p className="text-sm text-blue-700">
             Este relatório exibe estritamente os dados vinculados à conta <strong>{user.id.split('-')[0]}...</strong>. 
             Nenhum outro usuário da plataforma tem acesso ao seu saldo ou histórico financeiro.
         </p>
      </div>
    </div>
  );
};
