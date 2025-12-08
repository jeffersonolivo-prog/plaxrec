import React from 'react';
import { User, UserRole } from '../types';
import { plaxService } from '../services/mockState';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Award, Leaf } from 'lucide-react';

interface ReportsViewProps {
  user: User;
  refresh: () => void;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export const ReportsView: React.FC<ReportsViewProps> = ({ user }) => {
  const transactions = plaxService.getTransactions(user.id);
  
  // Prepare data for charts based on transactions
  // 1. Monthly Volume (Simulated by grouping transactions by minute/hour for demo or just mock data)
  const data = [
    { name: 'Jan', plax: 400, brl: 240 },
    { name: 'Fev', plax: 300, brl: 139 },
    { name: 'Mar', plax: 200, brl: 980 },
    { name: 'Abr', plax: 278, brl: 390 },
    { name: 'Mai', plax: 189, brl: 480 },
    { name: 'Jun', plax: 239, brl: 380 },
    { name: 'Jul', plax: 349, brl: 430 },
  ];

  // Distribution for Pie Chart
  const pieData = [
    { name: 'Venda de Material', value: 400 },
    { name: 'Bônus ESG', value: 300 },
    { name: 'Cashback', value: 300 },
    { name: 'Outros', value: 200 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Relatórios de Impacto & Financeiro</h2>
        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
           Exportar PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600">
               <Leaf size={24} />
            </div>
            <div>
               <p className="text-sm text-gray-500">Impacto Ambiental</p>
               <p className="text-2xl font-bold text-gray-800">1.2 Ton <span className="text-xs font-normal text-gray-400">Reciclados</span></p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
               <TrendingUp size={24} />
            </div>
            <div>
               <p className="text-sm text-gray-500">Movimentação Total</p>
               <p className="text-2xl font-bold text-gray-800">R$ {user.balanceBRL.toLocaleString()}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
               <Award size={24} />
            </div>
            <div>
               <p className="text-sm text-gray-500">Score ESG</p>
               <p className="text-2xl font-bold text-gray-800">98/100</p>
            </div>
         </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-700 mb-6">Evolução Financeira (Semestral)</h3>
           <div className="h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                 <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                 <Legend />
                 <Line type="monotone" dataKey="plax" stroke="#22c55e" strokeWidth={3} dot={{r: 4}} activeDot={{r: 8}} name="Créditos Plax" />
                 <Line type="monotone" dataKey="brl" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} name="Reais (R$)" />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-700 mb-6">Composição de Receita</h3>
           <div className="h-80 w-full">
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
                  <Tooltip />
                  <Legend />
                </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
         <h4 className="font-bold text-blue-900 mb-2">Nota de Auditoria</h4>
         <p className="text-sm text-blue-700">
             Todos os dados apresentados neste relatório são baseados nas transações registradas na blockchain (simulada) do PlaxRec.
             A certificação de lastro é garantida pelas Notas Fiscais emitidas pelos Recicladores e validadas pelos Transformadores.
         </p>
      </div>
    </div>
  );
};