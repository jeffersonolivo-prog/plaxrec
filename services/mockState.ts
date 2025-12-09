import { User, UserRole, Transaction, CollectionBatch, PlasticType, PLAX_TO_BRL_RATE, KG_TO_PLAX_RATE, ESG_CREDIT_PRICE_PER_KG } from '../types';
import { supabase } from './supabaseClient';

export const INSTITUTIONS = [
    { id: 'i1', name: 'Associação de Catadores do Brasil', cause: 'Apoio social aos coletores' },
    { id: 'i2', name: 'Instituto Limpa Oceanos', cause: 'Limpeza costeira' },
    { id: 'i3', name: 'Fundo Amazônia Sustentável', cause: 'Reflorestamento' },
    { id: 'i4', name: 'PlaxRec Acelera', cause: 'Reinvestimento na Cadeia' }
];

class PlaxService {
  
  // Helper to check configuration
  private checkConfig() {
      // @ts-ignore - accessing internal property to check for placeholder
      const url = supabase.supabaseUrl;
      if (url && url.includes('your-project')) {
          return "Supabase não configurado. Edite o arquivo services/supabaseClient.ts com suas chaves.";
      }
      return null;
  }

  // --- Auth & User ---

  async getCurrentUser(userId: string): Promise<User | null> {
    const configError = this.checkConfig();
    if (configError) { console.error(configError); return null; }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !data) return null;

    return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        balancePlax: data.balance_plax,
        balanceBRL: data.balance_brl,
        lockedPlax: data.locked_plax
    };
  }
  
  async login(email: string, password: string): Promise<{ user: User | null, error?: string }> {
    const configError = this.checkConfig();
    if (configError) return { user: null, error: configError };

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) return { user: null, error: authError.message };
    if (!authData.user) return { user: null, error: 'Erro desconhecido' };

    return { user: await this.getCurrentUser(authData.user.id) };
  }

  async loginWithGoogle(rolePreference?: UserRole): Promise<{ error?: string }> {
    const configError = this.checkConfig();
    if (configError) return { error: configError };

    // Save preference to localStorage to be retrieved after redirect
    if (rolePreference) {
        localStorage.setItem('plax_google_role_pref', rolePreference);
    }

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin // Volta para a URL atual após login
        }
    });

    return { error: error?.message };
  }

  async register(name: string, email: string, password: string, role: UserRole): Promise<{ user: User | null, error?: string }> {
    const configError = this.checkConfig();
    if (configError) return { user: null, error: configError };

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name, role } // Trigger will handle profile creation
        }
    });

    if (authError) return { user: null, error: authError.message };
    if (!authData.user) return { user: null, error: 'Erro ao criar usuário.' };

    return { user: { id: authData.user.id, name, email, role, balancePlax: 0, balanceBRL: 0, lockedPlax: 0 } };
  }

  async updateProfileRole(userId: string, role: UserRole) {
      const configError = this.checkConfig();
      if (configError) return;
      await supabase.from('profiles').update({ role: role }).eq('id', userId);
  }

  async logout() {
      await supabase.auth.signOut();
  }

  // --- Data Fetching ---

  async getUsers(): Promise<User[]> {
      const configError = this.checkConfig();
      if (configError) return [];

      const { data } = await supabase.from('profiles').select('*');
      if (!data) return [];
      return data.map((d: any) => ({
        id: d.id, name: d.name, email: d.email, role: d.role as UserRole,
        balancePlax: d.balance_plax, balanceBRL: d.balance_brl, lockedPlax: d.locked_plax
      }));
  }

  async getTransactions(userId?: string): Promise<Transaction[]> {
    const configError = this.checkConfig();
    if (configError) return [];

    let query = supabase.from('transactions').select('*').order('date', { ascending: false });
    
    if (userId) {
        query = query.or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
    }

    const { data } = await query;
    if (!data) return [];
    
    return data.map((t: any) => ({
        id: t.id,
        date: t.date,
        type: t.type,
        amountPlax: t.amount_plax,
        amountBRL: t.amount_brl,
        description: t.description,
        status: t.status,
        fromUserId: t.from_user_id,
        toUserId: t.to_user_id
    }));
  }

  async getBatches(status?: string): Promise<CollectionBatch[]> {
      const configError = this.checkConfig();
      if (configError) return [];

      let query = supabase.from('batches').select('*').order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);

      const { data } = await query;
      if (!data) return [];

      return data.map((b: any) => ({
          id: b.id,
          collectorId: b.collector_id,
          recyclerId: b.recycler_id,
          weightKg: b.weight_kg,
          plasticType: b.plastic_type,
          plaxGenerated: b.plax_generated,
          date: b.created_at,
          status: b.status,
          nfeId: b.nfe_id,
          certifiedByUserId: b.certified_by_user_id,
          certificationDate: b.certification_date
      }));
  }

  async getCertifiedBatches(buyerId: string): Promise<CollectionBatch[]> {
     const configError = this.checkConfig();
     if (configError) return [];

     const { data } = await supabase.from('batches').select('*').eq('certified_by_user_id', buyerId);
     if (!data) return [];
     return data.map((b: any) => ({
        id: b.id, collectorId: b.collector_id, recyclerId: b.recycler_id, weightKg: b.weight_kg,
        plasticType: b.plastic_type, plaxGenerated: b.plax_generated, date: b.created_at,
        status: b.status, nfeId: b.nfe_id, certifiedByUserId: b.certified_by_user_id, certificationDate: b.certification_date
     }));
  }

  // --- Actions ---

  async registerCollection(recyclerId: string, collectorId: string, weight: number, plasticType: PlasticType) {
    const configError = this.checkConfig();
    if (configError) return { success: false, message: configError };

    const plaxAmount = weight * KG_TO_PLAX_RATE;

    // 1. Create Batch
    const { error: batchError } = await supabase.from('batches').insert({
        collector_id: collectorId,
        recycler_id: recyclerId,
        weight_kg: weight,
        plastic_type: plasticType,
        plax_generated: plaxAmount,
        status: 'RECEIVED'
    });

    if (batchError) return { success: false, message: batchError.message };

    // 2. Update Balances (RPC is better, but doing direct update for MVP)
    // Collector gets Plax
    await this.updateBalance(collectorId, 'balance_plax', plaxAmount);
    // Recycler gets Locked Plax
    await this.updateBalance(recyclerId, 'locked_plax', plaxAmount);

    // 3. Create Transaction
    await supabase.from('transactions').insert({
        type: 'COLLECTION',
        amount_plax: plaxAmount,
        description: `Coleta: ${weight}kg ${plasticType}`,
        status: 'COMPLETED',
        to_user_id: collectorId
    });

    return { success: true, plaxGenerated: plaxAmount };
  }

  async emitNFe(recyclerId: string, transformerId: string, weightKg: number, manualNFeId: string) {
    const configError = this.checkConfig();
    if (configError) return { success: false, message: configError };

    const plaxToUnlock = weightKg * KG_TO_PLAX_RATE;
    const recycler = await this.getCurrentUser(recyclerId);
    
    if (!recycler) return { success: false, message: 'Reciclador não encontrado' };
    if (recycler.lockedPlax < plaxToUnlock) return { success: false, message: `Saldo travado insuficiente.` };

    // Find batches
    const { data: batches } = await supabase.from('batches').select('*')
        .eq('recycler_id', recyclerId).eq('status', 'RECEIVED');
    
    if (!batches) return { success: false, message: 'Erro ao buscar lotes' };

    let remainingWeightToProcess = weightKg;
    
    // Process Batches in DB
    for (const batch of batches) {
        if (remainingWeightToProcess <= 0.001) break;

        if (batch.weight_kg <= remainingWeightToProcess) {
            await supabase.from('batches').update({ status: 'PROCESSED_NFE', nfe_id: manualNFeId })
                .eq('id', batch.id);
            remainingWeightToProcess -= batch.weight_kg;
        } else {
            const usedWeight = remainingWeightToProcess;
            // Split: create processed one
            await supabase.from('batches').insert({
                collector_id: batch.collector_id,
                recycler_id: batch.recycler_id,
                weight_kg: usedWeight,
                plastic_type: batch.plastic_type,
                plax_generated: usedWeight * KG_TO_PLAX_RATE,
                status: 'PROCESSED_NFE',
                nfe_id: manualNFeId
            });
            // Reduce original
            await supabase.from('batches').update({ 
                weight_kg: batch.weight_kg - usedWeight,
                plax_generated: (batch.weight_kg - usedWeight) * KG_TO_PLAX_RATE
            }).eq('id', batch.id);
            
            remainingWeightToProcess = 0;
        }
    }

    // Update Balances
    await this.updateBalance(recyclerId, 'locked_plax', -plaxToUnlock);
    await this.updateBalance(recyclerId, 'balance_plax', plaxToUnlock);
    await this.updateBalance(transformerId, 'balance_plax', plaxToUnlock);

    // Transaction
    await supabase.from('transactions').insert({
        type: 'NFE_RELEASE',
        amount_plax: plaxToUnlock,
        description: `NFe emitida (${manualNFeId}): ${weightKg}kg`,
        status: 'COMPLETED',
        from_user_id: recyclerId,
        to_user_id: transformerId
    });

    return { success: true, message: 'NFe processada com sucesso.' };
  }

  async depositBRL(userId: string, amount: number) {
      const configError = this.checkConfig();
      if (configError) return { success: false, message: configError };

      await this.updateBalance(userId, 'balance_brl', amount);
      
      await supabase.from('transactions').insert({
          type: 'DEPOSIT',
          amount_brl: amount,
          description: 'Aporte de Capital ESG',
          status: 'COMPLETED',
          to_user_id: userId
      });

      return { success: true, message: 'Depósito realizado com sucesso.' };
  }

  async buyCertifiedLots(buyerId: string, amountBRL: number) {
      const configError = this.checkConfig();
      if (configError) return { success: false, message: configError };

      const buyer = await this.getCurrentUser(buyerId);
      if (!buyer || buyer.balanceBRL < amountBRL) return { success: false, message: 'Saldo insuficiente. Realize um depósito primeiro.' };

      const { data: availableBatches } = await supabase.from('batches').select('*').eq('status', 'PROCESSED_NFE');
      if (!availableBatches || availableBatches.length === 0) return { success: false, message: 'Sem lotes disponíveis.' };

      let remainingMoney = amountBRL;
      let purchasedWeight = 0;

      for (const batch of availableBatches) {
          if (remainingMoney <= 0.01) break; 
          const batchCost = batch.weight_kg * ESG_CREDIT_PRICE_PER_KG;

          if (remainingMoney >= batchCost - 0.01) {
              await supabase.from('batches').update({
                  status: 'CERTIFIED_SOLD',
                  certified_by_user_id: buyerId,
                  certification_date: new Date().toISOString()
              }).eq('id', batch.id);
              purchasedWeight += batch.weight_kg;
              remainingMoney -= batchCost;
          } else {
             continue; 
          }
      }

      const totalSpent = amountBRL - remainingMoney;
      if (totalSpent <= 0) return { success: false, message: 'Não foi possível comprar. Verifique se há lotes inteiros que caibam no valor.' };

      // Update Buyer Balance
      await this.updateBalance(buyerId, 'balance_brl', -totalSpent);

      // Distribution
      const collectorShare = totalSpent * 0.15;
      const recyclerShare = totalSpent * 0.30;
      const transformerShare = totalSpent * 0.25;
      const esgShare = totalSpent * 0.30;

      await this.distributeToRole(UserRole.COLLECTOR, collectorShare);
      await this.distributeToRole(UserRole.RECYCLER, recyclerShare);
      await this.distributeToRole(UserRole.TRANSFORMER, transformerShare);
      await this.updateBalance(buyerId, 'balance_brl', esgShare);

      await supabase.from('transactions').insert({
        type: 'ESG_PURCHASE',
        amount_brl: totalSpent,
        description: `Compra de ${purchasedWeight.toFixed(2)}kg`,
        status: 'COMPLETED',
        from_user_id: buyerId
      });

      return { success: true, message: `Compra realizada. ${purchasedWeight}kg adquiridos.` };
  }

  async reinvest(userId: string, amount: number, institutionId: string) {
      const configError = this.checkConfig();
      if (configError) return { success: false, message: configError };

      const user = await this.getCurrentUser(userId);
      const institution = INSTITUTIONS.find(i => i.id === institutionId);
      
      if (!user || user.balanceBRL < amount) return { success: false, message: 'Saldo insuficiente.' };

      await this.updateBalance(userId, 'balance_brl', -amount);

      if (institutionId === 'i4') {
          // Send to Admin
          await this.distributeToRole(UserRole.ADMIN, amount);
      } else {
          // External + 2% Fee
          const fee = amount * 0.02;
          await this.distributeToRole(UserRole.ADMIN, fee);
      }

      await supabase.from('transactions').insert({
          type: 'TRANSFER',
          amount_brl: amount,
          description: `Doação para: ${institution?.name}`,
          status: 'COMPLETED',
          from_user_id: userId
      });

      return { success: true, message: 'Doação realizada.' };
  }

  async withdraw(userId: string, amount: number, isPlax: boolean) {
      const configError = this.checkConfig();
      if (configError) return { success: false, message: configError };

      const user = await this.getCurrentUser(userId);
      if(!user) return { success: false, message: 'Erro usuário' };

      if (isPlax) {
          if (user.balancePlax < amount) return { success: false, message: 'Saldo insuficiente' };
          const valBRL = amount * PLAX_TO_BRL_RATE;
          const fee = valBRL * 0.02;
          const net = valBRL - fee;

          await this.updateBalance(userId, 'balance_plax', -amount);
          await this.updateBalance(userId, 'balance_brl', net);
          await this.distributeToRole(UserRole.ADMIN, fee); // Admin gets fee in BRL

          await supabase.from('transactions').insert({
            type: 'WITHDRAWAL',
            amount_plax: amount,
            amount_brl: net,
            description: 'Conversão Plax -> Real',
            status: 'COMPLETED',
            from_user_id: userId
          });

      } else {
          if (user.balanceBRL < amount) return { success: false, message: 'Saldo insuficiente' };
          const fee = amount * 0.02;
          const net = amount - fee;
          
          await this.updateBalance(userId, 'balance_brl', -amount);
          if (user.role !== UserRole.ADMIN) {
              await this.distributeToRole(UserRole.ADMIN, fee);
          }

          await supabase.from('transactions').insert({
            type: 'WITHDRAWAL',
            amount_brl: net,
            description: 'Saque Bancário',
            status: 'COMPLETED',
            from_user_id: userId
          });
      }
      return { success: true, message: 'Saque registrado.' };
  }

  // --- Helpers ---

  private async updateBalance(userId: string, field: 'balance_plax' | 'balance_brl' | 'locked_plax', amount: number) {
      // Need to fetch current first to add (Concurrency issue in MVP, in Prod use RPC "increment")
      const user = await this.getCurrentUser(userId);
      if (!user) return;

      const mapping = {
          'balance_plax': user.balancePlax,
          'balance_brl': user.balanceBRL,
          'locked_plax': user.lockedPlax
      };
      
      const newVal = mapping[field] + amount;
      
      await supabase.from('profiles').update({ [field]: newVal }).eq('id', userId);
  }

  private async distributeToRole(role: UserRole, amount: number) {
      // Find first user of role (Simplification)
      const { data } = await supabase.from('profiles').select('id, balance_brl').eq('role', role).limit(1);
      if (data && data.length > 0) {
          const u = data[0];
          await supabase.from('profiles').update({ balance_brl: u.balance_brl + amount }).eq('id', u.id);
      }
  }
}

export const plaxService = new PlaxService();