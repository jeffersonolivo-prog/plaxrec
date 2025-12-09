import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { plaxService } from '../services/mockState';
import { Recycle, UserPlus, LogIn, Loader2 } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(UserRole.COLLECTOR);

  // Google Login Preference State
  const [googleRole, setGoogleRole] = useState<UserRole>(UserRole.COLLECTOR);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { user, error } = await plaxService.login(loginEmail, loginPass);
    setLoading(false);
    
    if (user) {
      onLogin(user);
    } else {
      handleAuthError(error);
    }
  };

  const handleGoogleLogin = async () => {
      setLoading(true);
      const { error } = await plaxService.loginWithGoogle(googleRole);
      if (error) {
          setLoading(false);
          handleAuthError(error);
      }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPass) return;
    
    setLoading(true);
    const { user, error } = await plaxService.register(regName, regEmail, regPass, regRole);
    setLoading(false);
    
    if (user) {
      onLogin(user);
    } else {
      handleAuthError(error);
    }
  };

  const handleAuthError = (error?: string) => {
      if (!error) return;
      
      if (error.includes('Supabase não configurado') || error.includes('placeholder')) {
          alert('ERRO DE CONFIGURAÇÃO:\n\nVocê precisa editar o arquivo "services/supabaseClient.ts" e colocar suas chaves do Supabase nas variáveis SUPABASE_URL e SUPABASE_ANON_KEY.');
      } else if (error.includes('Email not confirmed')) {
          alert('⚠️ AÇÃO NECESSÁRIA NO SUPABASE ⚠️\n\nErro: Email não confirmado.\n\nSolução: Vá no painel do Supabase -> Authentication -> Providers -> Email -> Desmarque "Confirm email".');
      } else if (error.includes('Invalid login credentials')) {
          alert('Email ou senha incorretos.');
      } else {
          alert(`Erro: ${error}`);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center bg-no-repeat relative">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <div className="bg-white z-10 w-full max-w-md rounded-2xl shadow-2xl flex flex-col relative animate-in fade-in zoom-in duration-300 my-auto">
        <div className="bg-plax-900 p-6 text-center rounded-t-2xl">
            <div className="flex justify-center mb-3">
               <div className="bg-white p-3 rounded-full shadow-lg">
                 <Recycle className="h-8 w-8 text-plax-600" />
               </div>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">PlaxRec</h1>
            <p className="text-plax-200 text-sm">Fintech de Reciclagem & Economia Circular</p>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-160px)]">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
                {isRegistering ? 'Criar Nova Conta' : 'Acessar Conta'}
            </h2>

            {/* Google Login Section */}
            <div className="mb-6 pb-6 border-b border-gray-100">
                <div className="mb-2">
                    <label className="block text-xs text-center text-gray-500 mb-1">Entrar como:</label>
                    <select 
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-plax-500"
                        value={googleRole}
                        onChange={(e) => setGoogleRole(e.target.value as UserRole)}
                    >
                        <option value={UserRole.COLLECTOR}>Coletor</option>
                        <option value={UserRole.RECYCLER}>Reciclador</option>
                        <option value={UserRole.TRANSFORMER}>Transformador</option>
                        <option value={UserRole.ESG_BUYER}>Comprador ESG</option>
                        <option value={UserRole.ADMIN}>Administrador</option>
                    </select>
                </div>

                <button 
                    onClick={handleGoogleLogin} 
                    type="button"
                    disabled={loading}
                    className="w-full border border-gray-300 bg-white text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shadow-sm"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Entrar com Google</span>
                </button>
            </div>

            <div className="relative py-2 mb-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Ou use seu e-mail</span></div>
            </div>

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
                            <option value={UserRole.ADMIN}>Administrador</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-plax-600 text-white font-bold py-3 rounded-lg hover:bg-plax-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md">
                        {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={18} />}
                        <span>{loading ? 'Processando...' : 'Cadastrar'}</span>
                    </button>
                </form>
            ) : (
                <form onSubmit={handleLogin} className="space-y-4">
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
                    <button type="submit" disabled={loading} className="w-full bg-plax-600 text-white font-bold py-3 rounded-lg hover:bg-plax-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md">
                        {loading ? <Loader2 className="animate-spin" /> : <LogIn size={18} />}
                        <span>{loading ? 'Entrando...' : 'Entrar'}</span>
                    </button>
                </form>
            )}

            <div className="mt-6 text-center pt-4 border-t border-gray-100">
                <button 
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-sm text-gray-600 hover:text-plax-700 font-medium underline"
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