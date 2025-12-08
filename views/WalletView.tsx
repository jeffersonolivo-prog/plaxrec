import React, { useState } from 'react';
import { User } from '../types';
import { plaxService } from '../services/mockState';
import { Wallet, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';

interface WalletViewProps {
  user: User;
  refresh: () => void;
}

// Local definition to avoid circular imports
const WithdrawalSection: React.FC<{ user: User; refresh: () => void }> = ({ user, refresh }) => {
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState<'PLAX' | 'BRL'>('BRL');

    const handleWithdraw = () => {
        const val = Number(amount);
        if (val <= 0) return;
        const res = plaxService.withdraw(user.id, val, currency === 'PLAX');
        if (res.success) {
            alert(res.message);
            setAmount('');
            refresh();
        } else {
            alert(res.message);
        }
    }

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-gray-700 font-bold mb-4 flex items-center"><DollarSign size={18} className="mr-2" /> Realizar Saque / Conversão</h3>
            <div className="flex space-x-2 mb-4">
                <button onClick={() => setCurrency('BRL')} className={`flex-1 py-1 rounded text-sm font-medium ${currency === 'BRL' ? 'bg-plax-100 text-plax-700 border border-plax-200' : 'bg-gray-50 text-gray-500'}`}>R$ (Bancário)</button>
                <button onClick={() => setCurrency('PLAX')} className={`flex-1 py-1 rounded text-sm font-medium ${currency === 'PLAX' ? 'bg-plax-100 text-plax-700 border border-plax-200' : 'bg-gray-50 text-gray-500'}`}>PLAX (Conversão)</button>
            </div>
            <div className="flex gap-2">
                <input 
                    type="number" 
                    className="flex-1 border rounded-lg px-4 py-2" 
                    placeholder={`Qtd ${currency}`}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                />
                <button onClick={handleWithdraw} className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 font-medium">
                    Sacar
                </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
                Disponível: {currency === 'PLAX' ? `${user.balancePlax} PLAX` : `R$ ${user.balanceBRL.toFixed(2)}`} <br/>
                Taxa de Adm: 2%
            </p>
        </div>
    )
}

const WalletView: React.FC<WalletViewProps> = ({ user, refresh }) => {
  const transactions = plaxService.getTransactions(user.id);

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Minha Carteira</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 text-sm font-medium">Saldo em Plax</span>
                    <span className="p-2 bg-green-100 rounded-full text-green-600"><Wallet size={18}/></span>
                </div>
                <div className="text-3xl font-bold text-gray-800">{user.balancePlax.toFixed(2)}</div>
                <div className="text-xs text-gray-400 mt-1">Disponível para uso na rede</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500 text-sm font-medium">Saldo em Reais</span>
                    <span className="p-2 bg-blue-100 rounded-full text-blue-600"><TrendingUp size={18}/></span>
                </div>
                <div className="text-3xl font-bold text-gray-800">R$ {user.balanceBRL.toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">Disponível para saque</div>
            </div>
            
            <div className="lg:col-span-1">
                <WithdrawalSection user={user} refresh={refresh} />
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-700 flex items-center">
                    <Clock className="mr-2 text-gray-400" size={20}/> Extrato Completo
                </h3>
                <button className="text-sm text-plax-600 font-medium hover:underline">Exportar CSV</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 uppercase text-xs text-gray-500 font-semibold">
                        <tr>
                            <th className="p-4">Data</th>
                            <th className="p-4">Transação</th>
                            <th className="p-4">Tipo</th>
                            <th className="p-4 text-right">Valor</th>
                            <th className="p-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((t) => (
                            <tr key={t.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="p-4">{new Date(t.date).toLocaleDateString()} <span className="text-xs text-gray-400 block">{new Date(t.date).toLocaleTimeString()}</span></td>
                                <td className="p-4 font-medium text-gray-800">{t.description}</td>
                                <td className="p-4">
                                    <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                        {t.type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className={`p-4 text-right font-bold ${t.amountPlax ? 'text-plax-600' : 'text-gray-800'}`}>
                                    {t.amountPlax ? `+ ${t.amountPlax} P` : `R$ ${t.amountBRL?.toFixed(2)}`}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {t.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {transactions.length === 0 && (
                    <div className="p-8 text-center text-gray-400">Nenhuma transação registrada.</div>
                )}
            </div>
        </div>
    </div>
  );
};

export default WalletView;