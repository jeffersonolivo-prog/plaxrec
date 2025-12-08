import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { plaxService } from '../services/mockState';
import { Recycle, UserPlus, LogIn, Users, Shield } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(UserRole.COLLECTOR);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = plaxService.login(loginEmail, loginPass);
    if (user) {
      onLogin(user);
    } else {
      alert('Credenciais inválidas. Verifique os botões de acesso rápido abaixo.');
    }
  };

  const quickLogin = (email: string, pass: string) => {
      setLoginEmail(email);
      setLoginPass(pass);
      // Optional: Auto-submit
      // const user = plaxService.login(email, pass);
      // if (user) onLogin(user);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPass) return;
    
    const user = plaxService.register(regName, regEmail, regPass, regRole);
    if (user) {
      onLogin(user);
    } else {
      alert('Erro ao criar conta. Email pode já existir.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center bg-no-repeat relative">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <div className="bg-white z-10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-300">
        <div className="bg-plax-900 p-6 text-center">
            <div className="flex justify-center mb-3">
               <div className="bg-white p-3 rounded-full">
                 <Recycle className="h-8 w-8 text-plax-600" />
               </div>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">PlaxRec</h1>
            <p className="text-plax-200 text-sm">Fintech de Reciclagem & Economia Circular</p>
        </div>

        <div className="p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
                {isRegistering ? 'Criar Nova Conta' : 'Acessar Conta'}
            </h2>

            {isRegistering ? (
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome Completo</label>
                        <input 
                            type="text" 
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-plax-500 focus:outline-none"
                            placeholder="Ex: Maria Silva"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                        <input 
                            type="email" 
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-plax-500 focus:outline-none"
                            placeholder="maria@exemplo.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Senha</label>
                        <input 
                            type="password" 
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-plax-500 focus:outline-none"
                            placeholder="******"
                            value={regPass}
                            onChange={(e) => setRegPass(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo de Perfil</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-plax-500 focus:outline-none bg-white"
                            value={regRole}
                            onChange={(e) => setRegRole(e.target.value as UserRole)}
                        >
                            <option value={UserRole.COLLECTOR}>Coletor</option>
                            <option value={UserRole.RECYCLER}>Reciclador</option>
                            <option value={UserRole.TRANSFORMER}>Transformador</option>
                            <option value={UserRole.ESG_BUYER}>Comprador ESG</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-plax-600 text-white font-bold py-3 rounded-lg hover:bg-plax-700 transition-colors flex items-center justify-center space-x-2">
                        <UserPlus size={18} />
                        <span>Cadastrar</span>
                    </button>
                </form>
            ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                     <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center"><Users size={14} className="mr-1"/> Acesso Rápido (Simulação)</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => quickLogin('joao@plaxrec.com', '123')} className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 text-left">
                                🧑‍🌾 Coletor
                            </button>
                            <button type="button" onClick={() => quickLogin('contato@ecorecicla.com', '123')} className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 text-left">
                                ♻️ Reciclador
                            </button>
                            <button type="button" onClick={() => quickLogin('compras@industria.com', '123')} className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 text-left">
                                🏭 Transformador
                            </button>
                            <button type="button" onClick={() => quickLogin('esg@greencorp.com', '123')} className="text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-1 rounded hover:bg-green-100 text-left font-semibold">
                                🌍 Comprador ESG
                            </button>
                            <button type="button" onClick={() => quickLogin('admin@plaxrec.com', 'admin')} className="col-span-2 mt-1 text-xs bg-gray-800 text-white border border-gray-900 px-2 py-1.5 rounded hover:bg-gray-700 text-center font-bold flex items-center justify-center">
                                <Shield size={12} className="mr-1.5" /> Acesso Administrativo (Admin)
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                        <input 
                            type="email" 
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-plax-500 focus:outline-none"
                            placeholder="seu@email.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Senha</label>
                        <input 
                            type="password" 
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-plax-500 focus:outline-none"
                            placeholder="******"
                            value={loginPass}
                            onChange={(e) => setLoginPass(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="w-full bg-plax-600 text-white font-bold py-3 rounded-lg hover:bg-plax-700 transition-colors flex items-center justify-center space-x-2">
                        <LogIn size={18} />
                        <span>Entrar</span>
                    </button>
                </form>
            )}

            <div className="mt-6 text-center pt-4 border-t border-gray-100">
                <button 
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-sm text-gray-600 hover:text-plax-700 font-medium"
                >
                    {isRegistering ? 'Já tem uma conta? Entre aqui.' : 'Não tem conta? Crie agora.'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;