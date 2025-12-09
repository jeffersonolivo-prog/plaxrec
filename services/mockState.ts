import { User, UserRole, Transaction, CollectionBatch, PlasticType, PLAX_TO_BRL_RATE, KG_TO_PLAX_RATE, ESG_CREDIT_PRICE_PER_KG } from '../types';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseClient';

export const INSTITUTIONS = [
    { id: 'i1', name: 'Associação de Catadores do Brasil', cause: 'Apoio social aos coletores' },
    { id: 'i2', name: 'Instituto Limpa Oceanos', cause: 'Limpeza costeira' },
    { id: 'i3', name: 'Fundo Amazônia Sustentável', cause: 'Reflorestamento' },
    { id: 'i4', name: 'PlaxRec Acelera', cause: 'Reinvestimento na Cadeia' }
];

class PlaxService {
  private demoMode = false;
  
  // Helper to check configuration
  private checkConfig() {
      const url = SUPABASE_URL;
      const key = SUPABASE_ANON_KEY;

      if (!url || url.includes('COLE_SUA') || !key || key.includes('COLE_SUA')) {
          return "Supabase não configurado. Edite o arquivo services/supabaseClient.ts com suas chaves reais.";
      }
      return null;
  }

  // --- Auth & User ---

  async getCurrentUser(userId: string): Promise<User | null> {
    const configError = this.checkConfig();
    if (configError) { 
        console.error(configError); 
        return null; 
    }

    try {
        // 1. Tenta buscar o perfil existente no banco de dados
        const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
        // Se encontrou, retorna o usuário normalmente
        if (data && !error) {
            return {
                id: data.id,
                name: data.name,
                email: data.email,
                role: (data.role as UserRole) || UserRole.GUEST, 
                balancePlax: data.balance_plax || 0,
                balanceBRL: data.balance_brl || 0,
                lockedPlax: data.locked_plax || 0,
                avatarUrl: data.avatar_url || ''
            };
        }

        // 2. Se não encontrou o perfil, cria um perfil temporário/automático.
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData.user;

        if (authUser && authUser.id === userId) {
            console.warn("Perfil não encontrado no DB. Tentando criar perfil GUEST.");
            
            const meta = authUser.user_metadata || {};
            const fallbackName = meta.name || authUser.email?.split('@')[0] || 'Novo Usuário';
            const fallbackAvatar = meta.avatar_url || '';
            const fallbackRole = UserRole.GUEST;

            const newProfileData = {
                id: userId,
                name: fallbackName,
                email: authUser.email || '',
                role: fallbackRole,
                balance_plax: 0,
                balance_brl: 0,
                locked_plax: 0,
                avatar_url: fallbackAvatar
            };

            // 3. Tenta inserir no banco (Self-Healing)
            const { error: insertError } = await supabase.from('profiles').insert(newProfileData);
            
            if (insertError) {
                console.error("Falha ao criar perfil no DB. Usando perfil em memória.", insertError);
            }

            return {
                id: newProfileData.id,
                name: newProfileData.name,
                email: newProfileData.email,
                role: newProfileData.role,
                balancePlax: 0,
                balanceBRL: 0,
                lockedPlax: 0,
                avatarUrl: newProfileData.avatar_url
            };
        }

        return null;

    } catch (e) {
        console.error("Erro crítico ao obter usuário:", e);
        return null;
    }
  }
  
  async login(email: string, password: string): Promise<{ user: User | null, error?: string }> {
    const configError = this.checkConfig();
    if (configError) return { user: null, error: configError };

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) return { user: null, error: authError.message };
    if (!authData.user) return { user: null, error: 'Erro desconhecido na autenticação.' };

    const user = await this.getCurrentUser(authData.user.id);
    if (!user) {
        return { user: null, error: 'Falha ao carregar perfil do usuário.' };
    }

    return { user };
  }

  async loginWithGoogle(): Promise<{ error?: string }> {
    const configError = this.checkConfig();
    if (configError) return { error: configError };

    const currentOrigin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: currentOrigin,
        }
    });

    return { error: error?.message };
  }

  async register(name: string, email: string, password: string): Promise<{ user: User | null, error?: string }> {
    const configError = this.checkConfig();
    if (configError) return { user: null, error: configError };

    const role = UserRole.GUEST;

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name, role }
        }
    });

    if (authError) return { user: null, error: authError.message };
    
    if (authData.user && !authData.session) {
         return { user: null, error: 'Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.' };
    }

    if (!authData.user) return { user: null, error: 'Erro ao criar usuário.' };

    return { user: { id: authData.user.id, name, email, role, balancePlax: 0, balanceBRL: 0, lockedPlax: 0 } };
  }

  async updateProfileRole(userId: string, role: UserRole) {
      const configError = this.checkConfig();
      if (configError) return { success: false, message: configError };
      
      try {
          const { error } = await supabase.from('profiles').update({ role: role }).eq('id', userId);
          if (error) throw error;
          await supabase.auth.updateUser({ data: { role: role } });
          return { success: true };
      } catch (e: any) {
          console.error("Erro ao atualizar papel:", e);
          return { success: false, message: e.message };
      }
  }

  async updateProfile(userId: string, updates: { name?: string; avatarUrl?: string; password?: string }) {
      const configError = this.checkConfig();
      if (configError) return { success: false, message: configError };

      try {
          // 1. Update Database Fields
          const dbUpdates: any = {};
          if (updates.name) dbUpdates.name = updates.name;
          if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

          if (Object.keys(dbUpdates).length > 0) {
              const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
              if (error) throw error;
          }

          // 2. Update Auth (Password or Metadata)
          const authUpdates: any = {};
          if (updates.password) authUpdates.password = updates.password;
          if (updates.name || updates.avatarUrl) {
              authUpdates.data = {};
              if (updates.name) authUpdates.data.name = updates.name;
              if (updates.avatarUrl) authUpdates.data.avatar_url = updates.avatarUrl;
          }

          if (Object.keys(authUpdates).length > 0) {
              const { error: authError } = await supabase.auth.updateUser(authUpdates);
              if (authError) throw authError;
          }

          return { success: true, message: 'Perfil atualizado com sucesso!' };

      } catch (e: any) {
          console.error("Erro ao atualizar perfil:", e);
          return { success: false, message: e.message || 'Erro ao atualizar.' };
      }
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
        balancePlax: d.balance_plax, balanceBRL: d.balance_brl, lockedPlax: d.locked_plax,
        avatarUrl: d.avatar_url
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
    const plaxAmount = weight * KG_TO_PLAX_RATE;
    const configError = this.checkConfig();
    if (configError) return { success: false, message: configError };

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

    // 2. Update Balances
    await this.updateBalance(collectorId, 'balance_plax', plaxAmount);
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
    const plaxToUnlock = weightKg * KG_TO_PLAX_RATE;
    const configError = this.checkConfig();
    if (configError) return { success: false, message: configError };

    const recycler = await this.getCurrentUser(recyclerId);
    if (!recycler) return { success: false, message: 'Reciclador não encontrado' };
    if (recycler.lockedPlax < plaxToUnlock) return { success: false, message: `Saldo travado insuficiente.` };

    const { data: batches } = await supabase.from('batches').select('*')
        .eq('recycler_id', recyclerId).eq('status', 'RECEIVED');
    
    if (!batches) return { success: false, message: 'Erro ao buscar lotes' };

    let remainingWeightToProcess = weightKg;
    
    for (const batch of batches) {
        if (remainingWeightToProcess <= 0.001) break;

        if (batch.weight_kg <= remainingWeightToProcess) {
            await supabase.from('batches').update({ status: 'PROCESSED_NFE', nfe_id: manualNFeId })
                .eq('id', batch.id);
            remainingWeightToProcess -= batch.weight_kg;
        } else {
            const usedWeight = remainingWeightToProcess;
            await supabase.from('batches').insert({
                collector_id: batch.collector_id,
                recycler_id: batch.recycler_id,
                weight_kg: usedWeight,
                plastic_type: batch.plastic_type,
                plax_generated: usedWeight * KG_TO_PLAX_RATE,
                status: 'PROCESSED_NFE',
                nfe_id: manualNFeId
            });
            await supabase.from('batches').update({ 
                weight_kg: batch.weight_kg - usedWeight,
                plax_generated: (batch.weight_kg - usedWeight) * KG_TO_PLAX_RATE
            }).eq('id', batch.id);
            
            remainingWeightToProcess = 0;
        }
    }

    await this.updateBalance(recyclerId, 'locked_plax', -plaxToUnlock);
    await this.updateBalance(recyclerId, 'balance_plax', plaxToUnlock);
    await this.updateBalance(transformerId, 'balance_plax', plaxToUnlock);

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
             type: 'DEPOSIT', amount_brl: amount, description: 'Aporte de Capital ESG',
             status: 'COMPLETED', to_user_id: userId
      });

      return { success: true, message: 'Depósito realizado com sucesso.' };
  }

  async buyCertifiedLots(buyerId: string, amountBRL: number) {
      const buyer = await this.getCurrentUser(buyerId);
      if (!buyer || buyer.balanceBRL < amountBRL) return { success: false, message: 'Saldo insuficiente. Realize um depósito primeiro.' };

      const configError = this.checkConfig();
      if (configError) return { success: false, message: configError };
      const { data } = await supabase.from('batches').select('*').eq('status', 'PROCESSED_NFE');
      const availableBatches = data || [];

      if (availableBatches.length === 0) return { success: false, message: 'Sem lotes disponíveis.' };

      let remainingMoney = amountBRL;
      let purchasedWeight = 0;

      for (const batch of availableBatches) {
          if (remainingMoney <= 0.01) break; 
          const weight = batch.weight_kg;
          const batchCost = weight * ESG_CREDIT_PRICE_PER_KG;

          if (remainingMoney >= batchCost - 0.01) {
              await supabase.from('batches').update({
                  status: 'CERTIFIED_SOLD',
                  certified_by_user_id: buyerId,
                  certification_date: new Date().toISOString()
              }).eq('id', batch.id);
              
              purchasedWeight += weight;
              remainingMoney -= batchCost;
          }
      }

      const totalSpent = amountBRL - remainingMoney;
      if (totalSpent <= 0) return { success: false, message: 'Não foi possível comprar.' };

      await this.updateBalance(buyerId, 'balance_brl', -totalSpent);

      const collectorShare = totalSpent * 0.15;
      const recyclerShare = totalSpent * 0.30;
      const transformerShare = totalSpent * 0.25;
      const esgShare = totalSpent * 0.30;

      await this.distributeToRole(UserRole.COLLECTOR, collectorShare);
      await this.distributeToRole(UserRole.RECYCLER, recyclerShare);
      await this.distributeToRole(UserRole.TRANSFORMER, transformerShare);
      await this.updateBalance(buyerId, 'balance_brl', esgShare);

      await supabase.from('transactions').insert({
        type: 'ESG_PURCHASE', amount_brl: totalSpent, description: `Compra de ${purchasedWeight.toFixed(2)}kg`,
        status: 'COMPLETED', from_user_id: buyerId
      });

      return { success: true, message: `Compra realizada. ${purchasedWeight}kg adquiridos.` };
  }

  async reinvest(userId: string, amount: number, institutionId: string) {
      const user = await this.getCurrentUser(userId);
      const institution = INSTITUTIONS.find(i => i.id === institutionId);
      
      if (!user || user.balanceBRL < amount) return { success: false, message: 'Saldo insuficiente.' };
      
      const configError = this.checkConfig();
      if (configError) return { success: false, message: configError };

      await this.updateBalance(userId, 'balance_brl', -amount);

      if (institutionId === 'i4') {
          await this.distributeToRole(UserRole.ADMIN, amount);
      } else {
          const fee = amount * 0.02;
          await this.distributeToRole(UserRole.ADMIN, fee);
      }

      await supabase.from('transactions').insert({
          type: 'TRANSFER', amount_brl: amount, description: `Doação para: ${institution?.name}`,
          status: 'COMPLETED', from_user_id: userId
      });

      return { success: true, message: 'Investimento social realizado.' };
  }
  
  async withdraw(userId: string, amount: number, isPlax: boolean) {
      const user = await this.getCurrentUser(userId);
      if (!user) return { success: false, message: 'Usuário não encontrado' };
      
      if (isPlax) {
          if (user.balancePlax < amount) return { success: false, message: 'Saldo Plax insuficiente' };
          
          const conversionRate = PLAX_TO_BRL_RATE;
          const grossBrl = amount * conversionRate;
          const fee = grossBrl * 0.02; // 2% fee
          const netBrl = grossBrl - fee;

          await this.updateBalance(userId, 'balance_plax', -amount);
          await this.updateBalance(userId, 'balance_brl', netBrl);
          
          // Transfer Fee to Admin
          await this.distributeToRole(UserRole.ADMIN, fee);

      } else {
          // BRL Withdrawal
          if (user.balanceBRL < amount) return { success: false, message: 'Saldo R$ insuficiente' };
          
          const fee = amount * 0.02; // 2% fee on withdrawal
          const netWithdrawal = amount - fee; // User gets less in bank, or user pays fee on top? Usually deducted from requested amount or balance.
          // Let's assume the 'amount' is what they want to take out from their balance.
          
          await this.updateBalance(userId, 'balance_brl', -amount);
          
          // Transfer Fee to Admin
          await this.distributeToRole(UserRole.ADMIN, fee);
      }
      
      await supabase.from('transactions').insert({
          type: 'WITHDRAWAL', 
          amount_plax: isPlax ? amount : 0,
          amount_brl: isPlax ? 0 : amount,
          description: isPlax ? 'Conversão Plax -> R$' : 'Saque Bancário',
          status: 'COMPLETED', 
          from_user_id: userId
      });
      
      return { success: true, message: 'Operação realizada com sucesso' };
  }

  // --- Helpers ---

  private async updateBalance(userId: string, field: string, amount: number) {
      const { data } = await supabase.from('profiles').select(field).eq('id', userId).single();
      if (data) {
          const current = data[field] || 0;
          await supabase.from('profiles').update({ [field]: current + amount }).eq('id', userId);
      }
  }

  private async distributeToRole(role: UserRole, amountTotal: number) {
      const { data } = await supabase.from('profiles').select('id').eq('role', role).limit(1);
      if (data && data.length > 0) {
          await this.updateBalance(data[0].id, 'balance_brl', amountTotal);
      }
  }
}

export const plaxService = new PlaxService();