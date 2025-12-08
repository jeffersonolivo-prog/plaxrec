import React, { useState } from 'react';
import { User, UserRole, PlasticType, Transaction, CollectionBatch, ESG_CREDIT_PRICE_PER_KG } from '../types';
import { plaxService, INSTITUTIONS } from '../services/mockState';
import { ArrowUpRight, ArrowDownLeft, Scale, Truck, ShoppingBag, Landmark, Activity, FileCheck, DollarSign, Download, Leaf, Package, Heart, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ViewProps {
  user: User;
  refresh: () => void;
}

// --- REUSABLE COMPONENT: WITHDRAWAL ---
export const WithdrawalCard: React.FC<{ user: User; refresh: () => void }> = ({ user, refresh }) => {
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
            <div className="flex flex-col sm:flex-row gap-2">
                <input 
                    type="number" 
                    className="flex-1 border rounded-lg px-4 py-2 w-full" 
                    placeholder={`Qtd ${currency}`}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                />
                <button onClick={handleWithdraw} className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 font-medium w-full sm:w-auto">
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

// --- COLLECTOR VIEW ---
export const CollectorView: React.FC<ViewProps> = ({ user, refresh }) => {
  const transactions = plaxService.getTransactions(user.id);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-plax-500 to-plax-700 rounded-2xl p-6 text-white shadow-lg">
           <h3 className="text-plax-100 font-medium mb-1">Seu Saldo Plax</h3>
           <div className="text-4xl font-bold mb-4">{user.balancePlax} PLAX</div>
           <div className="flex items-center text-plax-100 text-sm bg-white/10 p-2 rounded w-fit">
              <span className="mr-2">≈</span> R$ {(user.balancePlax * 0.5).toFixed(2)}
           </div>
           <p className="mt-4 text-xs text-plax-100 bg-white/10 p-2 rounded">
              Receba 15% de bônus em dinheiro sempre que seus lotes forem certificados por empresas ESG.
           </p>
        </div>
        <WithdrawalCard user={user} refresh={refresh} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Histórico de Coletas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">Data</th>
                <th className="px-6 py-3 whitespace-nowrap">Descrição</th>
                <th className="px-6 py-3 whitespace-nowrap">Valor</th>
                <th className="px-6 py-3 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{t.description}</td>
                  <td className="px-6 py-4 text-plax-600 font-bold whitespace-nowrap">
                      {t.amountPlax ? `+${t.amountPlax} PLAX` : `R$ ${t.amountBRL?.toFixed(2)}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- RECYCLER VIEW ---
export const RecyclerView: React.FC<ViewProps> = ({ user, refresh }) => {
  const [weight, setWeight] = useState('');
  const [collectorId, setCollectorId] = useState('u1'); 
  const [plasticType, setPlasticType] = useState<PlasticType>(PlasticType.PET);
  const [nfeWeight, setNfeWeight] = useState('');
  const [nfeNumber, setNfeNumber] = useState('');
  const [transformerId, setTransformerId] = useState('u3');
  
  // Get pending inventory (RECEIVED status)
  const pendingBatches = plaxService.getBatches('RECEIVED').filter(b => b.recyclerId === user.id);
  const totalPendingWeight = pendingBatches.reduce((acc, b) => acc + b.weightKg, 0);

  const handleRegister = () => {
    plaxService.registerCollection(user.id, collectorId, Number(weight), plasticType);
    alert('Coleta registrada! Créditos gerados para o Coletor e Travados para você.');
    setWeight('');
    refresh();
  };

  const handleEmitNFe = () => {
    if(!nfeNumber.trim()) {
        alert("Digite o número da NFe.");
        return;
    }
    const res = plaxService.emitNFe(user.id, transformerId, Number(nfeWeight), nfeNumber);
    alert(res.message);
    if (res.success) {
      setNfeWeight('');
      setNfeNumber('');
      refresh();
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Register Collection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1">
           <h3 className="font-semibold text-gray-700 mb-4 flex items-center"><Scale size={18} className="mr-2"/> Entrada de Material</h3>
           <div className="space-y-4">
             <div>
               <label className="text-xs font-semibold text-gray-500 uppercase">Coletor</label>
               <select className="w-full border p-2 rounded bg-gray-50" value={collectorId} onChange={(e) => setCollectorId(e.target.value)}>
                 {plaxService.getUsers().filter(u => u.role === UserRole.COLLECTOR).map(c => (
                   <option key={c.id} value={c.id}>{c.name}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="text-xs font-semibold text-gray-500 uppercase">Tipo Plástico</label>
               <select className="w-full border p-2 rounded bg-gray-50" value={plasticType} onChange={(e) => setPlasticType(e.target.value as PlasticType)}>
                 {Object.values(PlasticType).map(t => <option key={t} value={t}>{t}</option>)}
               </select>
             </div>
             <div>
               <label className="text-xs font-semibold text-gray-500 uppercase">Peso (kg)</label>
               <input type="number" className="w-full border p-2 rounded" value={weight} onChange={e => setWeight(e.target.value)} />
             </div>
             <button onClick={handleRegister} className="w-full bg-plax-600 text-white py-2 rounded hover:bg-plax-700">Registrar Entrada</button>
           </div>
        </div>

        {/* Emit NFe */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1">
           <h3 className="font-semibold text-gray-700 mb-4 flex items-center"><Truck size={18} className="mr-2"/> Saída (Validar NFe)</h3 >
           <div className="space-y-4">
             <div className="bg-orange-50 p-3 rounded text-orange-800 text-sm mb-2 border border-orange-100">
               Plax Travado: <strong>{user.lockedPlax}</strong> <br/>
               Estoque Físico Pendente: <strong>{totalPendingWeight} kg</strong>
             </div>
             <div>
               <label className="text-xs font-semibold text-gray-500 uppercase">Transformador (Comprador do Lote)</label>
               <select className="w-full border p-2 rounded bg-gray-50" value={transformerId} onChange={(e) => setTransformerId(e.target.value)}>
                 {plaxService.getUsers().filter(u => u.role === UserRole.TRANSFORMER).map(c => (
                   <option key={c.id} value={c.id}>{c.name}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="text-xs font-semibold text-gray-500 uppercase">Número da NFe</label>
               <input 
                  type="text" 
                  className="w-full border p-2 rounded" 
                  value={nfeNumber} 
                  onChange={e => setNfeNumber(e.target.value)}
                  placeholder="Ex: 3524010000..."
               />
             </div>
             <div>
               <label className="text-xs font-semibold text-gray-500 uppercase">Peso da NFe (kg)</label>
               <input 
                  type="number" 
                  className="w-full border p-2 rounded" 
                  value={nfeWeight} 
                  onChange={e => setNfeWeight(e.target.value)}
                  placeholder={`Max: ${totalPendingWeight} kg`}
               />
             </div>
             <button onClick={handleEmitNFe} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Validar NFe & Destravar</button>
           </div>
        </div>
        
        {/* Wallet & Withdraw */}
        <div className="col-span-1 space-y-4">
            <div className="bg-gray-900 text-white p-6 rounded-xl">
                <h3 className="text-gray-400 text-sm uppercase font-bold mb-4">Carteira Empresarial</h3>
                <div className="mb-4">
                    <p className="text-sm text-gray-400">Plax Ativo</p>
                    <p className="text-3xl font-bold text-plax-400">{user.balancePlax}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400">Disponível em R$</p>
                    <p className="text-2xl font-bold">R$ {user.balanceBRL.toFixed(2)}</p>
                </div>
            </div>
            <WithdrawalCard user={user} refresh={refresh} />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
             <h3 className="font-bold text-gray-700 flex items-center"><Package className="mr-2"/> Estoque Aguardando NFe</h3>
             <span className="text-xs text-gray-500">Lotes recebidos mas não processados contabilmente</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="bg-gray-50 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-3 whitespace-nowrap">ID Lote</th>
                        <th className="px-6 py-3 whitespace-nowrap">Peso</th>
                        <th className="px-6 py-3 whitespace-nowrap">Tipo</th>
                        <th className="px-6 py-3 whitespace-nowrap">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingBatches.map(b => (
                        <tr key={b.id} className="border-b">
                            <td className="px-6 py-4 whitespace-nowrap">{b.id}</td>
                            <td className="px-6 py-4 font-bold whitespace-nowrap">{b.weightKg} kg</td>
                            <td className="px-6 py-4 whitespace-nowrap">{b.plasticType}</td>
                            <td className="px-6 py-4 whitespace-nowrap"><span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Aguardando NFe</span></td>
                        </tr>
                    ))}
                    {pendingBatches.length === 0 && (
                        <tr><td colSpan={4} className="p-4 text-center text-gray-400">Nenhum lote pendente. Registre uma nova coleta.</td></tr>
                    )}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

// --- TRANSFORMER VIEW ---
export const TransformerView: React.FC<ViewProps> = ({ user, refresh }) => {
    const transactions = plaxService.getTransactions(user.id);
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
                        <h2 className="text-2xl font-bold mb-2">Painel do Transformador</h2>
                        <p className="text-gray-600">Gestão de créditos recebidos via NFe e liquidação financeira.</p>
                    </div>
                    <div className="bg-white p-6 rounded shadow border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-700">Entradas Recentes (NFe)</h3>
                            <Truck className="text-gray-400" />
                        </div>
                        <ul className="space-y-2">
                            {transactions.filter(t => t.type === 'NFE_RELEASE').slice(0, 5).map(t => (
                                <li key={t.id} className="text-sm text-gray-600 border-b pb-2 flex justify-between">
                                    <span>{t.description}</span>
                                    <span className="font-bold text-green-600">+{t.amountPlax} Plax</span>
                                </li>
                            ))}
                            {transactions.filter(t => t.type === 'NFE_RELEASE').length === 0 && <li className="text-sm text-gray-400">Nenhuma NFe recebida ainda.</li>}
                        </ul>
                    </div>
                 </div>
                 <div className="space-y-4">
                     <div className="bg-gray-900 text-white p-6 rounded-xl">
                        <h3 className="text-gray-400 text-sm uppercase font-bold mb-4">Caixa</h3>
                        <p className="text-3xl font-bold text-plax-400 mb-2">{user.balancePlax} PLAX</p>
                        <p className="text-xl">R$ {user.balanceBRL.toFixed(2)}</p>
                     </div>
                     <WithdrawalCard user={user} refresh={refresh} />
                 </div>
            </div>
        </div>
    )
}

// --- ESG BUYER VIEW ---
export const ESGView: React.FC<ViewProps> = ({ user, refresh }) => {
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [donateAmount, setDonateAmount] = useState('');
  const [selectedInst, setSelectedInst] = useState(INSTITUTIONS[0].id);

  const availableBatches = plaxService.getBatches('PROCESSED_NFE');
  const myCertificates = plaxService.getCertifiedBatches(user.id);
  const availableWeight = availableBatches.reduce((acc, b) => acc + b.weightKg, 0);

  const handlePurchase = () => {
    const res = plaxService.buyCertifiedLots(user.id, Number(purchaseAmount));
    if(res.success) {
        alert(res.message);
        setPurchaseAmount('');
        refresh();
    } else {
        alert(res.message);
    }
  };

  const handleDonation = () => {
      const res = plaxService.reinvest(user.id, Number(donateAmount), selectedInst);
      if(res.success) {
          alert(res.message);
          setDonateAmount('');
          refresh();
      } else {
          alert(res.message);
      }
  }

  const generatePDF = (batch: CollectionBatch) => {
      const w = window.open('', '_blank');
      if(w) {
          w.document.write(`
            <html>
              <head>
                <title>Certificado PlaxRec - ${batch.id}</title>
                <style>
                  body { font-family: 'Helvetica', sans-serif; padding: 40px; text-align: center; border: 10px solid #22c55e; margin: 20px; }
                  .header { color: #15803d; font-size: 30px; font-weight: bold; margin-bottom: 10px; }
                  .sub { color: #555; font-size: 16px; margin-bottom: 40px; }
                  .content { font-size: 18px; line-height: 1.6; text-align: left; max-width: 600px; margin: 0 auto; }
                  .highlight { font-weight: bold; color: #000; }
                  .footer { margin-top: 50px; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 20px; }
                  .seal { margin-top: 30px; width: 100px; height: 100px; background: #22c55e; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="header">CERTIFICADO DE RECICLAGEM DIGITAL</div>
                <div class="sub">Plataforma PlaxRec de Economia Circular</div>
                
                <div class="content">
                  <p>Certificamos que a empresa <span class="highlight">${user.name}</span> adquiriu e aposentou os créditos de reciclagem referentes ao lote <span class="highlight">#${batch.id}</span>.</p>
                  
                  <p>
                    <strong>Detalhes da Rastreabilidade:</strong><br/>
                    Peso: ${batch.weightKg} kg<br/>
                    Tipo de Material: ${batch.plasticType}<br/>
                    Nota Fiscal de Origem: ${batch.nfeId || 'N/A'}<br/>
                    Coletor ID: ${batch.collectorId}<br/>
                    Reciclador ID: ${batch.recyclerId}<br/>
                    Data da Certificação: ${new Date(batch.certificationDate!).toLocaleDateString()}
                  </p>
                  
                  <p>Este certificado valida o impacto positivo gerado na cadeia de reciclagem brasileira, garantindo a reinserção do material na cadeia produtiva.</p>
                </div>
                
                <div class="seal">PlaxRec<br>Verified</div>
                
                <div class="footer">
                   Documento gerado eletronicamente em ${new Date().toLocaleString()}.<br/>
                   A autenticidade deste documento pode ser verificada na blockchain PlaxRec.
                </div>
                <script>window.print();</script>
              </body>
            </html>
          `);
          w.document.close();
      }
  };

  return (
    <div className="space-y-8">
        {/* Marketplace Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center"><Leaf className="text-green-500 mr-2"/>Mercado de Créditos ESG</h3>
                        <p className="text-gray-500 text-sm">Adquira lotes de plástico reciclado rastreados e certificados.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Disponível no Mercado</p>
                        <p className="text-2xl font-bold text-green-600">{availableWeight.toFixed(2)} kg</p>
                    </div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-xl border border-green-100 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-bold text-green-900 mb-2">Valor do Investimento (R$)</label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-green-300 bg-green-100 text-gray-500 text-sm">R$</span>
                            <input 
                                type="number" 
                                className="flex-1 border border-green-300 rounded-r-md p-2 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm"
                                placeholder="Ex: 500.00"
                                value={purchaseAmount}
                                onChange={e => setPurchaseAmount(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-green-700 mt-2">
                            Estimativa: {Number(purchaseAmount) > 0 ? (Number(purchaseAmount) / ESG_CREDIT_PRICE_PER_KG).toFixed(1) : 0} kg de créditos.
                        </p>
                    </div>
                    <button onClick={handlePurchase} className="w-full md:w-auto bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 shadow-md transition-transform active:scale-95">
                        Comprar Créditos
                    </button>
            </div>
            <div className="mt-4 text-xs text-gray-400">
                * Ao comprar créditos, 30% do valor retorna para sua carteira para reinvestimento social obrigatório.
            </div>
          </div>

          <div className="lg:col-span-1 bg-gradient-to-br from-plax-800 to-plax-900 text-white p-6 rounded-xl shadow-lg">
             <div className="flex items-center mb-4">
                 <Heart className="mr-2 text-pink-400" />
                 <h3 className="font-bold">Investimento Social</h3>
             </div>
             <p className="text-sm text-gray-300 mb-4">Use seu saldo de retorno (30%) para doar a instituições cadastradas na plataforma.</p>
             
             <div className="space-y-3">
                 <div>
                    <label className="text-xs uppercase font-semibold text-gray-400">Instituição</label>
                    <select className="w-full p-2 rounded bg-white/10 border border-white/20 text-white text-sm" value={selectedInst} onChange={e => setSelectedInst(e.target.value)}>
                        {INSTITUTIONS.map(i => (
                            <option key={i.id} value={i.id} className="text-gray-900">{i.name}</option>
                        ))}
                    </select>
                 </div>
                 <div>
                    <label className="text-xs uppercase font-semibold text-gray-400">Valor Doação (R$)</label>
                    <input 
                        type="number" 
                        className="w-full p-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-500"
                        placeholder="0.00"
                        value={donateAmount}
                        onChange={e => setDonateAmount(e.target.value)}
                    />
                 </div>
                 <div className="text-right text-xs text-gray-400">Saldo Disp: R$ {user.balanceBRL.toFixed(2)}</div>
                 <button onClick={handleDonation} className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 rounded transition-colors">
                     Realizar Doação
                 </button>
             </div>
          </div>
      </div>
      
      {/* My Certificates Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="p-6 border-b flex justify-between items-center">
               <h3 className="font-bold text-gray-800 flex items-center"><FileCheck className="mr-2 text-plax-600"/> Meus Certificados & Rastreabilidade</h3>
               <span className="bg-plax-100 text-plax-800 text-xs px-2 py-1 rounded-full font-bold">{myCertificates.length} Lotes</span>
           </div>
           <div className="overflow-x-auto">
               <table className="w-full text-sm text-left text-gray-500">
                   <thead className="bg-gray-50 uppercase text-xs">
                       <tr>
                           <th className="px-6 py-3 whitespace-nowrap">ID Lote</th>
                           <th className="px-6 py-3 whitespace-nowrap">Data</th>
                           <th className="px-6 py-3 whitespace-nowrap">NFe Origem</th>
                           <th className="px-6 py-3 whitespace-nowrap">Peso</th>
                           <th className="px-6 py-3 whitespace-nowrap">Ação</th>
                       </tr>
                   </thead>
                   <tbody>
                       {myCertificates.map(batch => (
                           <tr key={batch.id} className="border-b hover:bg-gray-50">
                               <td className="px-6 py-4 font-mono whitespace-nowrap">{batch.id}</td>
                               <td className="px-6 py-4 whitespace-nowrap">{new Date(batch.certificationDate!).toLocaleDateString()}</td>
                               <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">{batch.nfeId}</td>
                               <td className="px-6 py-4 font-bold whitespace-nowrap">{batch.weightKg.toFixed(2)} kg</td>
                               <td className="px-6 py-4 whitespace-nowrap">
                                   <button onClick={() => generatePDF(batch)} className="text-plax-600 hover:text-plax-800 font-medium flex items-center bg-plax-50 px-3 py-1 rounded border border-plax-200">
                                       <Printer size={16} className="mr-2"/> Imprimir Certificado
                                   </button>
                               </td>
                           </tr>
                       ))}
                       {myCertificates.length === 0 && (
                           <tr>
                               <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                   Você ainda não adquiriu certificados de reciclagem.
                               </td>
                           </tr>
                       )}
                   </tbody>
               </table>
           </div>
      </div>
    </div>
  );
};

// --- ADMIN VIEW ---
export const AdminView: React.FC<ViewProps> = ({ user, refresh }) => {
    return (
        <div className="space-y-6">
            <div className="bg-gray-800 text-white p-8 rounded-xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">Painel Administrativo</h2>
                    <p className="text-gray-300 mb-6">Gestão de taxas e reinvestimento da plataforma PlaxRec.</p>
                    <div className="grid grid-cols-2 gap-8 max-w-md">
                        <div>
                            <p className="text-sm text-gray-400">Caixa da Plataforma (R$)</p>
                            <p className="text-3xl font-bold text-emerald-400">R$ {user.balanceBRL.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Taxa de Operação</p>
                            <p className="text-3xl font-bold text-white">2%</p>
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-gray-700 to-transparent opacity-20 transform skew-x-12"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
                        <h3 className="font-bold text-red-600 mb-2">Regras de Saque Admin</h3>
                        <p className="text-xs text-gray-500 mb-4">
                            O Administrador pode sacar até 30% do acumulado para custos operacionais. 
                            O restante deve ser usado para reinvestimento na plataforma.
                        </p>
                        <WithdrawalCard user={user} refresh={refresh} />
                    </div>
                </div>

                <div className="md:col-span-2 bg-white rounded-xl shadow p-6">
                    <h3 className="font-bold text-gray-700 mb-4">Usuários do Sistema</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 uppercase text-gray-500">
                                <tr>
                                    <th className="p-3 whitespace-nowrap">Nome</th>
                                    <th className="p-3 whitespace-nowrap">Função</th>
                                    <th className="p-3 whitespace-nowrap">Saldo Plax</th>
                                    <th className="p-3 whitespace-nowrap">Saldo R$</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plaxService.getUsers().map(u => (
                                    <tr key={u.id} className="border-b">
                                        <td className="p-3 font-medium whitespace-nowrap">{u.name}</td>
                                        <td className="p-3 whitespace-nowrap"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{u.role}</span></td>
                                        <td className="p-3 whitespace-nowrap">{u.balancePlax.toFixed(2)}</td>
                                        <td className="p-3 whitespace-nowrap">R$ {u.balanceBRL.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}