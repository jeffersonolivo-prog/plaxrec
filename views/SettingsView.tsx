import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { plaxService } from '../services/mockState';
import { Save, User as UserIcon, Lock, RefreshCw, Loader2, Image as ImageIcon, AlertTriangle } from 'lucide-react';

interface SettingsViewProps {
  user: User;
  refresh: () => void;
  onUpdateUser: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, refresh, onUpdateUser }) => {
  const [loading, setLoading] = useState(false);
  
  // Profile State
  const [name, setName] = useState(user.name.split(' (')[0]); // Remove sufixo da persona se houver
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  
  // Role State (Demo Feature)
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const updates: any = { name, avatarUrl };
    if (newPassword.trim()) {
        updates.password = newPassword;
    }

    const res = await plaxService.updateProfile(user.id, updates);
    setLoading(false);
    
    if (res.success) {
        alert(res.message);
        setNewPassword('');
        onUpdateUser(); 
    } else {
        alert('Erro: ' + res.message);
    }
  };

  const handleChangeRole = async () => {
      // Verifica se é o mesmo papel atual
      if (selectedRole === user.role) return;
      
      const confirmChange = window.confirm(
          `Trocar para a Persona: ${selectedRole}?\n\n` +
          "Isso criará/carregará uma carteira isolada para este perfil. " +
          "Seus dados do perfil anterior permanecerão salvos."
      );
      if (!confirmChange) return;

      setLoading(true);
      
      // Usa a nova lógica de Persona Virtual
      plaxService.setDemoPersona(selectedRole);
      
      // Delay para garantir que o serviço atualizou o storage/estado
      setTimeout(() => {
          setLoading(false);
          // Recarrega a aplicação inteira para garantir que todos os componentes peguem o novo ID Virtual
          window.location.reload();
      }, 1000);
  };

  const resetDemo = () => {
      if(window.confirm("Isso irá desconectar as personas virtuais e voltar para sua conta real original.")) {
          plaxService.setDemoPersona(null);
          window.location.reload();
      }
  }

  const isVirtual = user.id.includes('_');

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      
      {/* 1. Profile Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
             <div className="flex items-center">
                <UserIcon className="text-gray-400 mr-3" size={20} />
                <h2 className="font-bold text-gray-700">Dados do Perfil {isVirtual && '(Persona Virtual)'}</h2>
             </div>
             {isVirtual && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-200">ID: {user.id}</span>}
         </div>
         <div className="p-6">
             <form onSubmit={handleUpdateProfile} className="space-y-6">
                 <div className="flex flex-col md:flex-row gap-8">
                     {/* Avatar Preview */}
                     <div className="flex flex-col items-center space-y-3">
                         <div className="h-32 w-32 rounded-full bg-plax-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                             {avatarUrl ? (
                                 <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                             ) : (
                                 <span className="text-4xl font-bold text-plax-600">{name.charAt(0)}</span>
                             )}
                         </div>
                     </div>

                     {/* Inputs */}
                     <div className="flex-1 space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome de Exibição</label>
                                 <input 
                                     type="text" 
                                     className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-plax-500 outline-none"
                                     value={name}
                                     onChange={e => setName(e.target.value)}
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                 <input 
                                     type="email" 
                                     disabled
                                     className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                                     value={user.email}
                                 />
                             </div>
                         </div>

                         <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center">
                                 <ImageIcon size={14} className="mr-1"/> URL da Foto
                             </label>
                             <input 
                                 type="text" 
                                 className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-plax-500 outline-none"
                                 value={avatarUrl}
                                 onChange={e => setAvatarUrl(e.target.value)}
                             />
                         </div>
                     </div>
                 </div>

                 <div className="flex justify-end pt-4">
                     <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-plax-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-plax-700 shadow-md flex items-center"
                     >
                         {loading ? <Loader2 className="animate-spin mr-2"/> : <Save className="mr-2" size={18}/>}
                         Salvar
                     </button>
                 </div>
             </form>
         </div>
      </div>

      {/* 2. Persona Switching (Demo Mode) */}
      <div className="bg-indigo-50 rounded-xl shadow-sm border border-indigo-100 overflow-hidden relative">
         <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
             DEMO MODE: ISOLAMENTO ATIVO
         </div>
         <div className="p-6 border-b border-indigo-100 flex items-center">
             <RefreshCw className="text-indigo-600 mr-3" size={20} />
             <h2 className="font-bold text-indigo-900">Gerenciador de Personas</h2>
         </div>
         <div className="p-6">
             <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm mb-6">
                 <div className="flex items-start gap-3">
                     <AlertTriangle className="text-orange-500 shrink-0 mt-1" size={18} />
                     <p className="text-sm text-gray-600">
                         Neste modo, cada papel funciona como um usuário distinto com sua própria carteira. 
                         Ao trocar para "Coletor", você verá apenas o saldo e transações do Coletor.
                     </p>
                 </div>
             </div>

             <div className="flex flex-col sm:flex-row items-end gap-4">
                 <div className="flex-1 w-full">
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Selecionar Persona para Simular</label>
                     <select 
                        className="w-full border-2 border-indigo-100 rounded-lg px-4 py-3 text-indigo-900 font-bold focus:outline-none focus:border-indigo-500"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                     >
                         <option value={UserRole.COLLECTOR}>COLETOR (Vende material)</option>
                         <option value={UserRole.RECYCLER}>RECICLADOR (Processa e Emite NFe)</option>
                         <option value={UserRole.TRANSFORMER}>TRANSFORMADOR (Indústria Final)</option>
                         <option value={UserRole.ESG_BUYER}>COMPRADOR ESG (Investidor)</option>
                         <option value={UserRole.ADMIN}>ADMINISTRADOR (Auditoria)</option>
                     </select>
                 </div>
                 <button 
                    onClick={handleChangeRole}
                    disabled={loading || selectedRole === user.role}
                    className={`px-6 py-3 rounded-lg font-bold flex items-center shadow-sm transition-all whitespace-nowrap
                        ${selectedRole === user.role 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'}
                    `}
                 >
                    {loading ? <Loader2 className="animate-spin mr-2"/> : <RefreshCw className="mr-2" size={18}/>}
                    Trocar Persona
                 </button>
             </div>
             
             {isVirtual && (
                 <div className="mt-6 pt-6 border-t border-indigo-100 flex justify-center">
                     <button onClick={resetDemo} className="text-xs text-indigo-400 hover:text-indigo-600 underline">
                         Sair do Modo Persona e Voltar ao Usuário Real
                     </button>
                 </div>
             )}
         </div>
      </div>

    </div>
  );
};

export default SettingsView;
