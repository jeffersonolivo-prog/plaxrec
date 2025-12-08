import { User, UserRole, Transaction, CollectionBatch, PlasticType, PLAX_TO_BRL_RATE, KG_TO_PLAX_RATE, ESG_CREDIT_PRICE_PER_KG } from '../types';

interface StoredUser extends User {
  password?: string;
}

// Initial Mock Data
const INITIAL_USERS: StoredUser[] = [
  { id: 'u1', name: 'João Coletor', email: 'joao@plaxrec.com', password: '123', role: UserRole.COLLECTOR, balancePlax: 150, balanceBRL: 50.00, lockedPlax: 0 },
  { id: 'u2', name: 'EcoRecicla Ltda', email: 'contato@ecorecicla.com', password: '123', role: UserRole.RECYCLER, balancePlax: 5000, balanceBRL: 12000.00, lockedPlax: 5000 }, 
  { id: 'u3', name: 'Indústria Plástica BR', email: 'compras@industria.com', password: '123', role: UserRole.TRANSFORMER, balancePlax: 2000, balanceBRL: 50000.00, lockedPlax: 0 },
  { id: 'u4', name: 'GreenCorp ESG', email: 'esg@greencorp.com', password: '123', role: UserRole.ESG_BUYER, balancePlax: 0, balanceBRL: 500000.00, lockedPlax: 0 },
  { id: 'u5', name: 'PlaxRec Admin', email: 'admin@plaxrec.com', password: 'admin', role: UserRole.ADMIN, balancePlax: 0, balanceBRL: 4500.00, lockedPlax: 0 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [];

// Pre-seed batches
const INITIAL_BATCHES: CollectionBatch[] = [
    // Lotes já processados (Disponíveis para COMPRADOR ESG comprar agora)
    { id: 'b1', collectorId: 'u1', recyclerId: 'u2', weightKg: 100, plasticType: PlasticType.PET, plaxGenerated: 1000, date: new Date().toISOString(), status: 'PROCESSED_NFE', nfeId: '35240100001' },
    { id: 'b2', collectorId: 'u1', recyclerId: 'u2', weightKg: 50, plasticType: PlasticType.HDPE, plaxGenerated: 500, date: new Date().toISOString(), status: 'PROCESSED_NFE', nfeId: '35240100002' },
    
    // Lote pendente (Disponível para RECICLADOR emitir NFe agora)
    { id: 'b3', collectorId: 'u1', recyclerId: 'u2', weightKg: 500, plasticType: PlasticType.PP, plaxGenerated: 5000, date: new Date().toISOString(), status: 'RECEIVED' }
];

export const INSTITUTIONS = [
    { id: 'i1', name: 'Associação de Catadores do Brasil', cause: 'Apoio social aos coletores' },
    { id: 'i2', name: 'Instituto Limpa Oceanos', cause: 'Limpeza costeira' },
    { id: 'i3', name: 'Fundo Amazônia Sustentável', cause: 'Reflorestamento' },
    { id: 'i4', name: 'PlaxRec Acelera', cause: 'Reinvestimento na Cadeia' }
];

class PlaxService {
  private users: StoredUser[] = [...INITIAL_USERS];
  private transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
  private batches: CollectionBatch[] = [...INITIAL_BATCHES];

  getUsers() { return this.users; }
  getUser(id: string) { return this.users.find(u => u.id === id); }
  
  login(email: string, password: string): User | null {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return null;
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  register(name: string, email: string, password: string, role: UserRole): User | null {
    if (this.users.find(u => u.email === email)) return null;
    const newUser: StoredUser = {
      id: Math.random().toString(36).substr(2, 9),
      name, email, password, role,
      balancePlax: 0, balanceBRL: 0, lockedPlax: 0
    };
    this.users.push(newUser);
    const { password: _, ...safeUser } = newUser;
    return safeUser;
  }

  getTransactions(userId?: string) {
    if (!userId) return this.transactions;
    return this.transactions.filter(t => t.fromUserId === userId || t.toUserId === userId || (!t.fromUserId && !t.toUserId));
  }

  getBatches(status?: string) {
      if(status) return this.batches.filter(b => b.status === status);
      return this.batches;
  }

  getCertifiedBatches(buyerId: string) {
      return this.batches.filter(b => b.certifiedByUserId === buyerId);
  }

  // 1. Collector delivers to Recycler
  registerCollection(recyclerId: string, collectorId: string, weight: number, plasticType: PlasticType) {
    const plaxAmount = weight * KG_TO_PLAX_RATE;
    const collector = this.users.find(u => u.id === collectorId);
    if (collector) collector.balancePlax += plaxAmount;

    const recycler = this.users.find(u => u.id === recyclerId);
    if (recycler) recycler.lockedPlax += plaxAmount;

    const batch: CollectionBatch = {
      id: Math.random().toString(36).substr(2, 9),
      collectorId, recyclerId, weightKg: weight, plasticType,
      plaxGenerated: plaxAmount, date: new Date().toISOString(), status: 'RECEIVED'
    };
    this.batches.push(batch);

    this.transactions.unshift({
      id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), type: 'COLLECTION',
      amountPlax: plaxAmount, description: `Coleta: ${weight}kg ${plasticType}`, status: 'COMPLETED', toUserId: collectorId
    });
    return { success: true, plaxGenerated: plaxAmount };
  }

  // 2. Recycler emits NFe
  emitNFe(recyclerId: string, transformerId: string, weightKg: number, manualNFeId: string) {
    const plaxToUnlock = weightKg * KG_TO_PLAX_RATE;
    const recycler = this.users.find(u => u.id === recyclerId);
    const transformer = this.users.find(u => u.id === transformerId);

    // Validations
    if (!recycler) return { success: false, message: 'Reciclador não encontrado.' };
    if (!transformer) return { success: false, message: 'Transformador não encontrado.' };
    if (!manualNFeId) return { success: false, message: 'Número da NFe é obrigatório.' };
    if (recycler.lockedPlax < plaxToUnlock) return { success: false, message: `Saldo travado insuficiente. Necessário: ${plaxToUnlock} PLAX, Atual: ${recycler.lockedPlax} PLAX` };

    // Find batches to process
    const pendingBatches = this.batches.filter(b => b.recyclerId === recyclerId && b.status === 'RECEIVED');
    const totalPendingWeight = pendingBatches.reduce((acc, b) => acc + b.weightKg, 0);

    if (totalPendingWeight < weightKg) {
        return { success: false, message: `Estoque físico insuficiente. Você tem ${totalPendingWeight}kg recebidos, mas tentou emitir nota para ${weightKg}kg.` };
    }

    // Process logic
    recycler.lockedPlax -= plaxToUnlock;
    recycler.balancePlax += plaxToUnlock;
    transformer.balancePlax += plaxToUnlock; 

    let remainingWeightToProcess = weightKg;
    const nfeId = manualNFeId;

    // Iterate through a copy to safely modify the original array
    for (const batch of [...pendingBatches]) {
        if (remainingWeightToProcess <= 0.001) break;

        if (batch.weightKg <= remainingWeightToProcess) {
            // Consume full batch
            batch.status = 'PROCESSED_NFE';
            batch.nfeId = nfeId;
            remainingWeightToProcess -= batch.weightKg;
        } else {
            // Split batch
            const usedWeight = remainingWeightToProcess;
            const newProcessedBatch: CollectionBatch = {
                ...batch,
                id: Math.random().toString(36).substr(2, 9),
                weightKg: usedWeight,
                plaxGenerated: usedWeight * KG_TO_PLAX_RATE,
                status: 'PROCESSED_NFE',
                nfeId: nfeId
            };
            
            // Update remaining part of original batch
            batch.weightKg -= usedWeight;
            batch.plaxGenerated = batch.weightKg * KG_TO_PLAX_RATE;
            // Original stays 'RECEIVED'

            this.batches.push(newProcessedBatch);
            remainingWeightToProcess = 0;
        }
    }

    this.transactions.unshift({
      id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), type: 'NFE_RELEASE',
      amountPlax: plaxToUnlock, description: `NFe emitida (${nfeId}): ${weightKg}kg`, status: 'COMPLETED', fromUserId: recyclerId, toUserId: transformerId
    });
    
    return { success: true, message: 'NFe cadastrada com sucesso! Créditos liberados.' };
  }

  // 3. ESG Buyer buys CERTIFIED LOTS
  buyCertifiedLots(buyerId: string, amountBRL: number) {
      const buyer = this.users.find(u => u.id === buyerId);
      if (!buyer || buyer.balanceBRL < amountBRL) return { success: false, message: 'Saldo insuficiente' };

      // Find available batches
      const availableBatches = this.batches.filter(b => b.status === 'PROCESSED_NFE');
      if (availableBatches.length === 0) return { success: false, message: 'Não há lotes processados por NFe disponíveis no mercado. Aguarde um Reciclador emitir NFe.' };

      let remainingMoney = amountBRL;
      let purchasedWeight = 0;
      let batchesPurchased = 0;

      // Use a copy to avoid iteration issues when modifying the array
      for (const batch of [...availableBatches]) {
          if (remainingMoney <= 0.01) break; 

          const batchCost = batch.weightKg * ESG_CREDIT_PRICE_PER_KG;
          
          if (remainingMoney >= batchCost - 0.01) { // Tolerance for float comparison
              // Buy full batch
              remainingMoney -= batchCost;
              batch.status = 'CERTIFIED_SOLD';
              batch.certifiedByUserId = buyerId;
              batch.certificationDate = new Date().toISOString();
              purchasedWeight += batch.weightKg;
              batchesPurchased++;
          } else {
              // Buy partial batch (split)
              const weightToBuy = remainingMoney / ESG_CREDIT_PRICE_PER_KG;
              
              if (weightToBuy < 0.01) break;

              // 1. Create the new sold batch
              const newSoldBatch: CollectionBatch = {
                  ...batch,
                  id: Math.random().toString(36).substr(2, 9),
                  weightKg: weightToBuy,
                  plaxGenerated: weightToBuy * KG_TO_PLAX_RATE,
                  status: 'CERTIFIED_SOLD',
                  certifiedByUserId: buyerId,
                  certificationDate: new Date().toISOString(),
              };
              
              // 2. Update the existing batch to reflect remaining weight
              batch.weightKg -= weightToBuy;
              batch.plaxGenerated = batch.weightKg * KG_TO_PLAX_RATE;
              // status stays PROCESSED_NFE

              // 3. Add new sold batch to system
              this.batches.push(newSoldBatch);
              
              purchasedWeight += weightToBuy;
              remainingMoney = 0;
              batchesPurchased++;
              break; // Finished money
          }
      }

      if (purchasedWeight === 0) return { success: false, message: 'Não foi possível processar a compra.' };

      const totalSpent = amountBRL - remainingMoney;
      buyer.balanceBRL -= totalSpent;

      // Distribution Logic
      // 15% Coletor (Reduced from 25%)
      // 30% Reciclador (Increased from 25%)
      // 25% Transformador (Maintained)
      // 30% ESG Buyer Balance (Increased from 25%) for Reinvestment
      
      const collectorShare = totalSpent * 0.15;
      const recyclerShare = totalSpent * 0.30;
      const transformerShare = totalSpent * 0.25;
      const esgShare = totalSpent * 0.30;

      this.distributeToRole(UserRole.COLLECTOR, collectorShare);
      this.distributeToRole(UserRole.RECYCLER, recyclerShare);
      this.distributeToRole(UserRole.TRANSFORMER, transformerShare);
      
      // Credit back to ESG User for reinvestment
      buyer.balanceBRL += esgShare;
      
      this.transactions.unshift({
        id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), type: 'ESG_PURCHASE',
        amountBRL: totalSpent, description: `Compra de ${purchasedWeight.toFixed(2)}kg (Retorno para doação: R$ ${esgShare.toFixed(2)})`, status: 'COMPLETED', fromUserId: buyerId
      });

      return { success: true, message: `Sucesso! Adquirido ${purchasedWeight.toFixed(2)}kg. R$ ${esgShare.toFixed(2)} retornaram para seu fundo de reinvestimento social.`, spent: totalSpent };
  }

  // 5. Reinvest Funds (Donation)
  reinvest(userId: string, amount: number, institutionId: string) {
      const user = this.users.find(u => u.id === userId);
      const institution = INSTITUTIONS.find(i => i.id === institutionId);
      const admin = this.users.find(u => u.role === UserRole.ADMIN);
      
      if (!user || user.balanceBRL < amount) return { success: false, message: 'Saldo insuficiente para doação.' };
      if (!institution) return { success: false, message: 'Instituição inválida.' };

      user.balanceBRL -= amount;

      // Special Logic: If reinvesting in PlaxRec Acelera (i4), Admin gets 100%
      if (institutionId === 'i4') {
         if (admin) admin.balanceBRL += amount;
         
         this.transactions.unshift({
            id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), type: 'TRANSFER',
            amountBRL: amount, description: `Reinvestimento Acelera PlaxRec`, status: 'COMPLETED', fromUserId: userId
        });
        return { success: true, message: `Reinvestimento de R$ ${amount.toFixed(2)} realizado com sucesso na PlaxRec.` };
      }
      
      // Standard Logic for External NGOs: Admin gets 2% fee, rest goes to external entity
      const adminFee = amount * 0.02;
      if(admin) admin.balanceBRL += adminFee;

      this.transactions.unshift({
          id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), type: 'TRANSFER',
          amountBRL: amount, description: `Doação para: ${institution.name}`, status: 'COMPLETED', fromUserId: userId
      });

      return { success: true, message: `Doação de R$ ${amount.toFixed(2)} realizada com sucesso para ${institution.name}.` };
  }

  private distributeToRole(role: UserRole, amount: number) {
    const target = this.users.find(u => u.role === role);
    if (target) target.balanceBRL += amount;
  }

  // 4. Withdrawal
  withdraw(userId: string, amount: number, isPlax: boolean) {
    const user = this.users.find(u => u.id === userId);
    if(!user) return { success: false, message: 'Usuário não encontrado' };

    // Admin Special Rule: Max 30% of accumulated balance
    if (user.role === UserRole.ADMIN) {
        if (!isPlax) { // Admin withdraws BRL usually
            const maxWithdraw = user.balanceBRL * 0.30;
            if (amount > maxWithdraw) {
                return { success: false, message: `Admin limitado a sacar 30% do saldo (Max: R$ ${maxWithdraw.toFixed(2)}) para reinvestimento obrigatório.` };
            }
        }
    }

    if (isPlax) {
        if (user.balancePlax < amount) return { success: false, message: 'Saldo Plax insuficiente' };
        // Convert Plax to Real
        const valueBRL = amount * PLAX_TO_BRL_RATE;
        const adminFee = valueBRL * 0.02;
        const finalValue = valueBRL - adminFee;
        
        user.balancePlax -= amount;
        user.balanceBRL += finalValue; // Move to Wallet BRL (or external bank in real app)
        
        // Fee to Admin
        const admin = this.users.find(u => u.role === UserRole.ADMIN);
        if(admin) admin.balanceBRL += adminFee;

        this.transactions.unshift({
            id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), type: 'WITHDRAWAL',
            amountPlax: amount, amountBRL: finalValue, description: `Conversão Plax -> Real (Taxa 2%)`, status: 'COMPLETED', fromUserId: userId
        });
    } else {
        // Direct BRL withdrawal (Bank Transfer)
        if (user.balanceBRL < amount) return { success: false, message: 'Saldo R$ insuficiente' };
        
        const adminFee = amount * 0.02;
        const finalValue = amount - adminFee;

        user.balanceBRL -= amount;
        
        // Fee to Admin (if not admin himself)
        if (user.role !== UserRole.ADMIN) {
            const admin = this.users.find(u => u.role === UserRole.ADMIN);
            if(admin) admin.balanceBRL += adminFee;
        }

        this.transactions.unshift({
            id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), type: 'WITHDRAWAL',
            amountBRL: finalValue, description: `Saque Bancário (Taxa 2%)`, status: 'COMPLETED', fromUserId: userId
        });
    }

    return { success: true, message: 'Saque realizado com sucesso.' };
  }
}

export const plaxService = new PlaxService();