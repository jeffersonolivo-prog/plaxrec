import { User, UserRole, Transaction, CollectionBatch, PlasticType, PLAX_TO_BRL_RATE, KG_TO_PLAX_RATE, ESG_CREDIT_PRICE_PER_KG } from '../types';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseClient';

export const INSTITUTIONS = [
    { id: 'i1', name: 'Associação de Catadores do Brasil', cause: 'Apoio social aos coletores' },
    { id: 'i2', name: 'Instituto Limpa Oceanos', cause: 'Limpeza costeira' },
    { id: 'i3', name: 'Fundo Amazônia Sustentável', cause: 'Reflorestamento' },
    { id: 'i4', name: 'PlaxRec Acelera', cause: 'Reinvestimento na Cadeia' }
];

class PlaxService {
  private activePersonaRole: UserRole | null = null;

  private checkConfig() {
      const url = SUPABASE_URL;
      const key = SUPABASE_ANON_KEY;
      if (!url || url.includes('COLE_SUA') || !key || key.includes('COLE_SUA')) {
          return "Supabase não configurado. Edite o arquivo services/supabaseClient.ts com suas chaves reais.";
      }
      return null;
  }

  // --- Virtual Persona Logic ---

  setDemoPersona(role: UserRole | null) {
      if (role) {
          this.activePersonaRole = role;
          localStorage.setItem('plax_demo_role', role);
      } else {
          this.activePersonaRole = null;
          localStorage.removeItem('plax_demo_role');
      }
  }

  getDemoPersona(): UserRole | null {
      if (this.activePersonaRole) return this.activePersonaRole;
      return localStorage.getItem('plax_demo_role') as UserRole || null;
  }

  private getEffectiveUserId(authUserId: string): string {
      // Garante que o ID base não seja já um ID virtual, prevenindo recursão
      const baseId = authUserId.includes('_') ? authUserId.split('_')[0] : authUserId;
      const role = this.getDemoPersona();
      
      if (role && role !== UserRole.GUEST) {
          return `${baseId}_${role}`;
      }
      return baseId;
  }

  // --- Auth & User ---

  async getCurrentUser(authUserId: string): Promise<User | null> {
    if (!authUserId) return null;
    const configError = this.checkConfig();
    if (configError) { console.error(configError); return null; }

    try {
        const effectiveId = this.getEffectiveUserId(authUserId);
        const currentRole = this.getDemoPersona();

        // 1. Tenta buscar o perfil (Real ou Virtual)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', effectiveId)
            .single();
        
        // Se encontrou e não deu erro (incluindo RLS), retorna
        if (data && !error) {
            return {
                id: data.id,
                name: data.name,
                email: data.email,
                role: (data.role as UserRole), 
                balancePlax: data.balance_plax || 0,
                balanceBRL: data.balance_brl || 0,
                lockedPlax: data.locked_plax || 0,
                avatarUrl: data.avatar_url || ''
            };
        }

        // 2. Se não encontrou e estamos em MODO DEMO, cria objeto VIRTUAL
        if (currentRole) {
            console.log(`Usando persona virtual na memória: ${effectiveId}`);
            
            // Tenta pegar nome do usuário real, se falhar usa genérico
            let baseName = 'Usuário Demo';
            let baseEmail = 'demo@plaxrec.com';
            let avatar = '';

            // Tenta ler o user real (pode falhar por RLS dependendo da config, mas geralmente user pode ler seu próprio profile)
            // Usa o ID base real para essa consulta
            const baseId = authUserId.split('_')[0];
            const { data: realProfile } = await supabase.from('profiles').select('*').eq('id', baseId).single();
            
            if (realProfile) {
                baseName = realProfile.name;
                baseEmail = realProfile.email;
                avatar = realProfile.avatar_url;
            }

            const newPersona: User = {
                id: effectiveId,
                name: `${baseName} (${currentRole})`,
                email: baseEmail,
                role: currentRole,
                balancePlax: 0,
                balanceBRL: 0,
                lockedPlax: 0,
                avatarUrl: avatar
            };

            // Tenta salvar no banco apenas para persistência futura, mas não bloqueia se falhar
            // (Isso corrige o problema do usuário ser desconectado se o DB bloquear a criação)
            supabase.from('profiles').insert({
                id: effectiveId,
                name: newPersona.name,
                email: newPersona.email,
                role: newPersona.role,
                balance_plax: 0,
                balance_brl: 0,
                locked_plax: 0,
                avatar_url: avatar
            }).then(({ error }) => {
                if(error) console.warn("Modo Volátil: Persistência no banco falhou (provavelmente RLS/FK), mas o app continuará funcionando.", error.message);
            });

            return newPersona;
        }

        // 3. Fallback para usuário original (primeiro acesso real ou erro de leitura)
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user && authData.user.id === authUserId) {
             const newProfileData = {
                id: authUserId,
                name: authData.user.user_metadata?.name || 'Novo Usuário',
                email: authData.user.email || '',
                role: UserRole.GUEST,
                balance_plax: 0,
                balance_brl: 0,
                locked_plax: 0,
            };
            await supabase.from('profiles').insert(newProfileData);
            return { ...newProfileData, balancePlax: 0, balanceBRL: 0, lockedPlax: 0 } as User;
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

    this.setDemoPersona(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) return { user: null, error: authError.message };
    if (!authData.user) return { user: null, error: 'Erro desconhecido na autenticação.' };

    const user = await this.getCurrentUser(authData.user.id);
    return { user };
  }

  async loginWithGoogle(): Promise<{ error?: string }> {
    const configError = this.checkConfig();
    if (configError) return { error: configError };
    this.setDemoPersona(null);
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
    return { error: error?.message };
  }

  async register(name: string, email: string, password: string): Promise<{ user: User | null, error?: string }> {
    const configError = this.checkConfig();
    if (configError) return { user: null, error: configError };
    this.setDemoPersona(null);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email, password, options: { data: { name, role: UserRole.GUEST } }
    });

    if (authError) return { user: null, error: authError.message };
    if (authData.user && !authData.session) return { user: null, error: 'Verifique seu e-mail.' };
    
    return { user: { id: authData.user!.id, name, email, role: UserRole.GUEST, balancePlax: 0, balanceBRL: 0, lockedPlax: 0 } };
  }

  async updateProfileRole(userId: string, role: UserRole) {
      const configError = this.checkConfig();
      if (configError) return { success: false, message: configError };
      try {
          await supabase.from('profiles').update({ role: role }).eq('id', userId);
          return { success: true };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  }

  async updateProfile(userId: string, updates: any) {
      const { error } = await supabase.from('profiles').update({
          name: updates.name,
          avatar_url: updates.avatarUrl
      }).eq('id', userId);

      if (updates.password && !userId.includes('_')) {
          await supabase.auth.updateUser({ password: updates.password });
      }
      
      return { success: !error, message: error ? error.message : 'Perfil atualizado' };
  }

  async logout() {
      this.setDemoPersona(null);
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
        balancePlax: d.balance_plax, balanceBRL: d.balance_brl, lockedPlax: d.locked_plax, avatarUrl: d.avatar_url
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
        id: t.id, date: t.date, type: t.type, amountPlax: t.amount_plax, amountBRL: t.amount_brl,
        description: t.description, status: t.status, fromUserId: t.from_user_id, toUserId: t.to_user_id
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
          id: b.id, collectorId: b.collector_id, recyclerId: b.recycler_id, weightKg: b.weight_kg,
          plasticType: b.plastic_type, plaxGenerated: b.plax_generated, date: b.created_at,
          status: b.status, nfeId: b.nfe_id, certifiedByUserId: b.certified_by_user_id, certificationDate: b.certification_date
      }));
  }

  async getCertifiedBatches(buyerId: string): Promise<CollectionBatch[]> {
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
    const { error } = await supabase.from('batches').insert({
        collector_id: collectorId, recycler_id: recyclerId, weight_kg: weight,
        plastic_type: plasticType, plax_generated: plaxAmount, status: 'RECEIVED'
    });
    if (error) return { success: false, message: error.message };

    await this.updateBalance(collectorId, 'balance_plax', plaxAmount);
    await this.updateBalance(recyclerId, 'locked_plax', plaxAmount);
    await supabase.from('transactions').insert({
        type: 'COLLECTION', amount_plax: plaxAmount, description: `Coleta: ${weight}kg ${plasticType}`,
        status: 'COMPLETED', to_user_id: collectorId, from_user_id: recyclerId
    });
    return { success: true, plaxGenerated: plaxAmount };
  }

  async emitNFe(recyclerId: string, transformerId: string, weightKg: number, manualNFeId: string) {
    const plaxToUnlock = weightKg * KG_TO_PLAX_RATE;
    const recycler = await this.getUserById(recyclerId);
    if (!recycler || recycler.lockedPlax < plaxToUnlock) return { success: false, message: `Saldo travado insuficiente.` };

    const { data: batches } = await supabase.from('batches').select('*').eq('recycler_id', recyclerId).eq('status', 'RECEIVED');
    if (!batches) return { success: false };

    let remaining = weightKg;
    for (const batch of batches) {
        if (remaining <= 0) break;
        if (batch.weight_kg <= remaining) {
            await supabase.from('batches').update({ status: 'PROCESSED_NFE', nfe_id: manualNFeId }).eq('id', batch.id);
            remaining -= batch.weight_kg;
        } else {
             await supabase.from('batches').update({ status: 'PROCESSED_NFE', nfe_id: manualNFeId }).eq('id', batch.id);
             remaining = 0;
        }
    }

    await this.updateBalance(recyclerId, 'locked_plax', -plaxToUnlock);
    await this.updateBalance(recyclerId, 'balance_plax', plaxToUnlock);
    await this.updateBalance(transformerId, 'balance_plax', plaxToUnlock);

    await supabase.from('transactions').insert({
        type: 'NFE_RELEASE', amount_plax: plaxToUnlock, description: `NFe emitida (${manualNFeId})`,
        status: 'COMPLETED', from_user_id: recyclerId, to_user_id: transformerId
    });
    return { success: true, message: 'NFe processada.' };
  }

  async depositBRL(userId: string, amount: number) {
      await this.updateBalance(userId, 'balance_brl', amount);
      await supabase.from('transactions').insert({
             type: 'DEPOSIT', amount_brl: amount, description: 'Aporte de Capital', status: 'COMPLETED', to_user_id: userId
      });
      return { success: true, message: 'Depósito realizado.' };
  }

  async buyCertifiedLots(buyerId: string, amountBRL: number) {
      const buyer = await this.getUserById(buyerId);
      if (buyer.balanceBRL < amountBRL) return { success: false, message: 'Saldo insuficiente.' };

      const { data: batches } = await supabase.from('batches').select('*').eq('status', 'PROCESSED_NFE').limit(10);
      if(!batches || batches.length === 0) return { success: false, message: 'Sem lotes disponíveis.' };
      
      let spent = 0;
      for(const b of batches) {
          const cost = b.weight_kg * ESG_CREDIT_PRICE_PER_KG;
          if ((spent + cost) <= amountBRL) {
              spent += cost;
              await supabase.from('batches').update({ status: 'CERTIFIED_SOLD', certified_by_user_id: buyerId, certification_date: new Date().toISOString() }).eq('id', b.id);
          }
      }

      if (spent === 0) return { success: false, message: 'Saldo insuficiente para comprar 1 lote sequer.' };

      await this.updateBalance(buyerId, 'balance_brl', -spent);
      
      await this.distributeToRole(UserRole.COLLECTOR, spent * 0.15);
      await this.distributeToRole(UserRole.RECYCLER, spent * 0.30);
      await this.distributeToRole(UserRole.TRANSFORMER, spent * 0.25);
      await this.updateBalance(buyerId, 'balance_brl', spent * 0.30); 

      await supabase.from('transactions').insert({
        type: 'ESG_PURCHASE', amount_brl: spent, description: `Compra de Créditos`, status: 'COMPLETED', from_user_id: buyerId
      });

      return { success: true, message: `Compra de R$ ${spent} realizada.` };
  }

  async reinvest(userId: string, amount: number, institutionId: string) {
      const user = await this.getUserById(userId);
      if (user.balanceBRL < amount) return { success: false, message: 'Saldo insuficiente.' };
      await this.updateBalance(userId, 'balance_brl', -amount);
      const fee = amount * 0.02;
      await this.distributeToRole(UserRole.ADMIN, fee);
      await supabase.from('transactions').insert({
          type: 'TRANSFER', amount_brl: amount, description: `Doação Social`, status: 'COMPLETED', from_user_id: userId
      });
      return { success: true, message: 'Doação realizada.' };
  }
  
  async withdraw(userId: string, amount: number, isPlax: boolean) {
      const user = await this.getUserById(userId);
      if (isPlax) {
          if (user.balancePlax < amount) return { success: false, message: 'Saldo Plax insuficiente' };
          const brl = (amount * PLAX_TO_BRL_RATE) * 0.98;
          await this.updateBalance(userId, 'balance_plax', -amount);
          await this.updateBalance(userId, 'balance_brl', brl);
          await this.distributeToRole(UserRole.ADMIN, (amount * PLAX_TO_BRL_RATE) * 0.02);
      } else {
          if (user.balanceBRL < amount) return { success: false, message: 'Saldo R$ insuficiente' };
          await this.updateBalance(userId, 'balance_brl', -amount);
          await this.distributeToRole(UserRole.ADMIN, amount * 0.02);
      }
      await supabase.from('transactions').insert({
          type: 'WITHDRAWAL', amount_plax: isPlax?amount:0, amount_brl: isPlax?0:amount,
          description: 'Saque', status: 'COMPLETED', from_user_id: userId
      });
      return { success: true, message: 'Saque realizado.' };
  }

  // --- Helpers ---

  private async getUserById(userId: string): Promise<User> {
      // Tenta buscar, se der erro retorna objeto vazio seguro para evitar crash
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!data) {
          // Fallback seguro se o ID não existir no banco (Modo Demo Volátil)
          return { id: userId, name: 'Usuário', email: '', role: UserRole.GUEST, balancePlax: 0, balanceBRL: 0, lockedPlax: 0 };
      }
      return { id: data.id, name: data.name, email: data.email, role: data.role, balancePlax: data.balance_plax, balanceBRL: data.balance_brl, lockedPlax: data.locked_plax, avatarUrl: data.avatar_url };
  }

  private async updateBalance(userId: string, field: string, amount: number) {
      const { data } = await supabase.from('profiles').select(field).eq('id', userId).single();
      if (data) {
          await supabase.from('profiles').update({ [field]: (data[field] || 0) + amount }).eq('id', userId);
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