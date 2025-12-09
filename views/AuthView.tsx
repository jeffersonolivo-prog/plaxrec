import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { plaxService } from '../services/mockState';
import { Recycle, UserPlus, LogIn, Users, Loader2 } from 'lucide-react';

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
      if (error && error.includes('Email not confirmed')) {
          alert('⚠️ AÇÃO NECESSÁRIA NO SUPABASE ⚠️\n\nO erro "Email not confirmed" ocorreu.\n\nPara corrigir em ambiente de teste:\n1. Vá ao painel do seu projeto Supabase.\n2. Clique em "Authentication" (menu lateral) -> "Providers" -> "Email".\n3. DESMARQUE a opção "Confirm email".\n4. Salve.\n\nAlternativamente, verifique o e-mail cadastrado e clique no link de confirmação.');
      } else {
          alert(error || 'Credenciais inválidas. Se você acabou de configurar o Supabase, crie uma conta nova.');
      }
    }
  };

  const handleGoogleLogin = async () => {
      setLoading(true);
      const { error } = await plaxService.loginWithGoogle(googleRole);
      if (error) {
          setLoading(false);
          alert("Erro ao iniciar login com Google: " + error);
      }
      // Se não der erro, o Supabase redireciona a página, então não precisamos setar loading false.
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPass) return;
    
    setLoading(true);
    const { user, error } = await plaxService.register(regName, regEmail, regPass, regRole);
    setLoading(false);
    
    if (user) {
      onLogin(user);
      console.log("Usuário registrado.");
    } else {
      alert(error || 'Erro ao criar conta.');
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
                            <option value={UserRole.ADMIN}>Administrador (Sistema)</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-plax-600 text-white font-bold py-3 rounded-lg hover:bg-plax-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={18} />}
                        <span>{loading ? 'Processando...' : 'Cadastrar'}</span>
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-2">
                        Ao se registrar com Google, você poderá selecionar seu perfil acima.
                    </p>
                </form>
            ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                     <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center"><Users size={14} className="mr-1"/> Acesso Rápido</p>
                        <p className="text-xs text-gray-400 mb-2">Preencha os campos abaixo com suas credenciais do banco de dados.</p>
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
                    <button type="submit" disabled={loading} className="w-full bg-plax-600 text-white font-bold py-3 rounded-lg hover:bg-plax-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin" /> : <LogIn size={18} />}
                        <span>{loading ? 'Entrando...' : 'Entrar'}</span>
                    </button>
                </form>
            )}
            
            <div className="mt-4 flex flex-col gap-2">
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Ou continue com</span></div>
                </div>
                
                {/* Seletor de Role para Google */}
                <div className="mb-2">
                    <label className="block text-xs text-center text-gray-500 mb-1">Entrar como:</label>
                    <select 
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={googleRole}
                        onChange={(e) => setGoogleRole(e.target.value as UserRole)}
                    >
                        <option value={UserRole.COLLECTOR}>Coletor</option>
                        <option value={UserRole.RECYCLER}>Reciclador</option>
                        <option value={UserRole.TRANSFORMER}>Transformador</option>
                        <option value={UserRole.ESG_BUYER}>Comprador ESG</option>
                    </select>
                </div>

                <button 
                    onClick={handleGoogleLogin} 
                    type="button"
                    disabled={loading}
                    className="w-full border border-gray-300 bg-white text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Google ({googleRole})</span>
                </button>
            </div>

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