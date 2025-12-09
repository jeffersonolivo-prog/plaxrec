import React, { useState } from 'react';
import { User } from '../types';
import { plaxService } from '../services/mockState';
import { Save, User as UserIcon, Loader2, Image as ImageIcon, Upload } from 'lucide-react';

interface SettingsViewProps {
  user: User;
  refresh: () => void;
  onUpdateUser: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser }) => {
  const [loading, setLoading] = useState(false);
  
  // Profile State
  const [name, setName] = useState(user.name.split(' (')[0]); 
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  
  // Password State
  const [newPassword, setNewPassword] = useState('');

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              // Convert to base64 string
              setAvatarUrl(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      
      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
             <div className="flex items-center">
                <UserIcon className="text-gray-400 mr-3" size={20} />
                <h2 className="font-bold text-gray-700">Dados do Perfil</h2>
             </div>
             <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200">ID: {user.id.slice(0, 8)}...</span>
         </div>
         <div className="p-6">
             <form onSubmit={handleUpdateProfile} className="space-y-6">
                 <div className="flex flex-col md:flex-row gap-8">
                     {/* Avatar Preview & Upload */}
                     <div className="flex flex-col items-center space-y-3">
                         <div className="h-32 w-32 rounded-full bg-plax-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative group">
                             {avatarUrl ? (
                                 <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                             ) : (
                                 <span className="text-4xl font-bold text-plax-600">{name.charAt(0)}</span>
                             )}
                             {/* Overlay on hover for indication */}
                             <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center text-white text-xs font-bold cursor-pointer">
                                 Alterar
                             </div>
                         </div>
                         <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-50 shadow-sm flex items-center">
                             <Upload size={12} className="mr-1" /> Carregar Foto
                             <input 
                                 type="file" 
                                 accept="image/*" 
                                 className="hidden" 
                                 onChange={handleFileUpload}
                             />
                         </label>
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
                                 <ImageIcon size={14} className="mr-1"/> Foto de Perfil (Arquivo Local)
                             </label>
                             <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    disabled
                                    placeholder="Selecione um arquivo acima..."
                                    className="w-full border rounded-lg px-4 py-2 bg-gray-50 text-gray-400 cursor-not-allowed"
                                    value={avatarUrl ? (avatarUrl.startsWith('data:') ? 'Imagem carregada' : avatarUrl) : ''}
                                />
                             </div>
                             <p className="text-[10px] text-gray-400 mt-1">A imagem será salva no seu perfil do navegador e banco de dados.</p>
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
    </div>
  );
};

export default SettingsView;