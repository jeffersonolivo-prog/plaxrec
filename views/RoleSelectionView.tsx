import React, { useState } from 'react';
import { UserRole } from '../types';
import { Recycle, Truck, Factory, Leaf, Shield, Loader2, AlertTriangle } from 'lucide-react';

interface RoleSelectionViewProps {
  onSelectRole: (role: UserRole) => void;
  userName: string;
}

const RoleSelectionView: React.FC<RoleSelectionViewProps> = ({ onSelectRole, userName }) => {
  const [loading, setLoading] = useState(false);

  const handleSelect = async (role: UserRole) => {
    const confirm = window.confirm("Confirmar a escolha deste perfil para esta conta?");
    if (!confirm) return;

    setLoading(true);
    // Pequeno delay para feedback visual
    await new Promise(r => setTimeout(r, 500));
    onSelectRole(role);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-plax-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Configurando seu perfil...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-6 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo, {userName}!</h1>
        <p className="text-lg text-gray-600">Para começar, precisamos saber qual é o seu papel na cadeia de reciclagem.</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 max-w-2xl text-sm text-yellow-800 flex items-start">
        <AlertTriangle className="mr-3 shrink-0 mt-0.5" size={20} />
        <span>
            <strong>Atenção:</strong> Esta escolha definirá o tipo da sua conta. 
            Para atuar em outro papel (ex: testar como Reciclador após criar um Coletor), 
            você precisará criar um novo cadastro com outro e-mail.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        
        {/* Card Coletor */}
        <button 
          onClick={() => handleSelect(UserRole.COLLECTOR)}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-plax-500 hover:shadow-md transition-all text-left flex items-start group"
        >
          <div className="p-3 bg-green-100 rounded-lg text-green-700 mr-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <Recycle size={28} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800 group-hover:text-plax-700">Sou Coletor</h3>
            <p className="text-sm text-gray-500 mt-1">Coletor individual, cooperativa ou ponto de entrega voluntária. Vendo material reciclável.</p>
          </div>
        </button>

        {/* Card Reciclador */}
        <button 
          onClick={() => handleSelect(UserRole.RECYCLER)}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left flex items-start group"
        >
          <div className="p-3 bg-blue-100 rounded-lg text-blue-700 mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <Factory size={28} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-700">Sou Reciclador</h3>
            <p className="text-sm text-gray-500 mt-1">Compro material bruto, processo (lavagem/moagem) e emito Nota Fiscal para a indústria.</p>
          </div>
        </button>

        {/* Card Transformador */}
        <button 
          onClick={() => handleSelect(UserRole.TRANSFORMER)}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all text-left flex items-start group"
        >
          <div className="p-3 bg-indigo-100 rounded-lg text-indigo-700 mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Truck size={28} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-700">Sou Transformador</h3>
            <p className="text-sm text-gray-500 mt-1">Indústria que compra o plástico processado para fabricar novos produtos finais.</p>
          </div>
        </button>

        {/* Card ESG */}
        <button 
          onClick={() => handleSelect(UserRole.ESG_BUYER)}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all text-left flex items-start group"
        >
          <div className="p-3 bg-emerald-100 rounded-lg text-emerald-700 mr-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Leaf size={28} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800 group-hover:text-emerald-700">Investidor ESG</h3>
            <p className="text-sm text-gray-500 mt-1">Empresa ou fundo que deseja comprar créditos de reciclagem e investir em impacto social.</p>
          </div>
        </button>

      </div>

      <div className="mt-8">
        <button 
          onClick={() => handleSelect(UserRole.ADMIN)}
          className="text-gray-400 hover:text-gray-600 text-sm flex items-center space-x-1"
        >
          <Shield size={14} />
          <span>Acesso Administrativo</span>
        </button>
      </div>

    </div>
  );
};

export default RoleSelectionView;