require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kotdhanvkjvevxfoqdiq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'plates.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Verifica se o Supabase está ativado e configurado com chave
const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY && SUPABASE_KEY.trim().length > 10);

let supabase = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY.trim());
    console.log('[Banco de Dados] Conectado com sucesso ao Supabase Cloud:', SUPABASE_URL);
  } catch (err) {
    console.error('[Banco de Dados] Falha ao inicializar cliente Supabase:', err);
    supabase = null;
  }
} else {
  console.log('[Banco de Dados] Operando com armazenamento local (Para ativar Supabase na nuvem, insira sua chave no arquivo .env).');
}

// Helpers locais (fallback)
function getLocalUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    return data.users || [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar local users:', err);
  }
}

function getLocalData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return { plates: [], logs: [] };
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    return { plates: data.plates || [], logs: data.logs || [] };
  } catch {
    return { plates: [], logs: [] };
  }
}

function saveLocalData(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar local data:', err);
  }
}

// ==========================================
// ADAPTER INTERFACE
// ==========================================

// Helper para extrair ou normalizar código único da placa (ex: PI-121)
function extractPlateCode(p) {
  if (!p) return null;
  if (p.code && typeof p.code === 'string' && p.code.trim()) {
    return p.code.trim().toUpperCase();
  }
  const str = `${p.notes || ''} ${p.slug || ''} ${p.name || ''}`.toUpperCase();
  const m = str.match(/P[IL]-(\d+)/);
  if (m) {
    return `PI-${m[1]}`;
  }
  return null;
}

const db = {
  isCloud: isSupabaseConfigured,

  // --- USERS ---
  async getUsers() {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error('Erro Supabase getUsers:', error);
        return getLocalUsers();
      }
      return data || [];
    }
    return getLocalUsers();
  },

  async getUserByEmail(email) {
    const clean = (email || '').trim().toLowerCase();
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*').ilike('email', clean).maybeSingle();
      if (error) {
        console.error('Erro Supabase getUserByEmail:', error);
        return getLocalUsers().find(u => u.email.toLowerCase() === clean);
      }
      return data;
    }
    return getLocalUsers().find(u => u.email.toLowerCase() === clean);
  },

  async getUserById(id) {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      if (!error && data) return data;
    }
    return getLocalUsers().find(u => u.id === id);
  },

  async createUser(user) {
    if (supabase) {
      const { data, error } = await supabase.from('users').insert([{
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase(),
        whatsapp: user.whatsapp,
        password: user.password,
        role: user.role || 'user',
        created_at: user.createdAt || new Date().toISOString()
      }]).select().single();

      if (error) {
        console.error('Erro Supabase createUser:', error);
      } else {
        return data;
      }
    }
    const users = getLocalUsers();
    users.push(user);
    saveLocalUsers(users);
    return user;
  },

  async updateUser(id, fields) {
    if (supabase) {
      const updatePayload = {};
      if (fields.name) updatePayload.name = fields.name;
      if (fields.email) updatePayload.email = fields.email.toLowerCase();
      if (fields.whatsapp !== undefined) updatePayload.whatsapp = fields.whatsapp;
      if (fields.role) updatePayload.role = fields.role;
      if (fields.password) updatePayload.password = fields.password;

      const { data, error } = await supabase.from('users').update(updatePayload).eq('id', id).select().single();
      if (error) {
        console.error('Erro Supabase updateUser:', error);
      } else {
        return data;
      }
    }

    const users = getLocalUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...fields };
      saveLocalUsers(users);
      return users[idx];
    }
    return null;
  },

  async deleteUser(id) {
    if (supabase) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) console.error('Erro Supabase deleteUser:', error);
    }
    const users = getLocalUsers().filter(u => u.id !== id);
    saveLocalUsers(users);
  },

  // --- PLATES ---
  async getPlates() {
    if (supabase) {
      const { data, error } = await supabase.from('plates').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Erro Supabase getPlates:', error);
        return getLocalData().plates;
      }
      return (data || []).map(p => ({
        id: p.id,
        userId: p.user_id,
        slug: p.slug,
        name: p.name,
        code: extractPlateCode(p),
        location: p.location,
        type: p.type,
        destinationUrl: p.destination_url,
        isActive: p.is_active,
        notes: p.notes,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        scans: {
          total: p.scans_total || 0,
          nfc: p.scans_nfc || 0,
          qr: p.scans_qr || 0
        }
      }));
    }
    return getLocalData().plates.map(p => ({ ...p, code: extractPlateCode(p) }));
  },

  async getPlateBySlug(slug) {
    const clean = (slug || '').trim().toLowerCase();
    if (supabase) {
      const { data, error } = await supabase.from('plates').select('*').ilike('slug', clean).maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          slug: data.slug,
          name: data.name,
          code: extractPlateCode(data),
          location: data.location,
          type: data.type,
          destinationUrl: data.destination_url,
          isActive: data.is_active,
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          scans: {
            total: data.scans_total || 0,
            nfc: data.scans_nfc || 0,
            qr: data.scans_qr || 0
          }
        };
      }
    }
    const found = getLocalData().plates.find(p => p.slug.toLowerCase() === clean);
    return found ? { ...found, code: extractPlateCode(found) } : null;
  },

  async getNextPlateCode() {
    const plates = await this.getPlates();
    let max = 101; // Começa em PI-102 pra frente
    plates.forEach(p => {
      const code = extractPlateCode(p);
      if (code) {
        const m = code.match(/PI-(\d+)/);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > max) max = num;
        }
      }
    });
    return `PI-${max + 1}`;
  },

  async createPlate(plate) {
    const code = plate.code || extractPlateCode(plate);
    const notesValue = code ? (plate.notes ? `${plate.notes} [${code}]` : code) : (plate.notes || '');

    if (supabase) {
      const { error } = await supabase.from('plates').insert([{
        id: plate.id,
        user_id: plate.userId,
        slug: plate.slug,
        name: plate.name,
        location: plate.location,
        type: plate.type,
        destination_url: plate.destinationUrl,
        is_active: plate.isActive,
        notes: notesValue,
        scans_total: 0,
        scans_nfc: 0,
        scans_qr: 0,
        created_at: plate.createdAt,
        updated_at: plate.updatedAt
      }]);
      if (error) console.error('Erro Supabase createPlate:', error);
    }
    const data = getLocalData();
    const localPlate = { ...plate, code, notes: notesValue };
    data.plates.unshift(localPlate);
    saveLocalData(data);
    return localPlate;
  },

  async updatePlate(id, fields) {
    if (supabase) {
      const updatePayload = {
        updated_at: new Date().toISOString()
      };
      if (fields.name !== undefined) updatePayload.name = fields.name;
      if (fields.location !== undefined) updatePayload.location = fields.location;
      if (fields.type !== undefined) updatePayload.type = fields.type;
      if (fields.destinationUrl !== undefined) updatePayload.destination_url = fields.destinationUrl;
      if (fields.slug !== undefined) updatePayload.slug = fields.slug;
      if (fields.isActive !== undefined) updatePayload.is_active = fields.isActive;
      if (fields.userId !== undefined) updatePayload.user_id = fields.userId;

      const { error } = await supabase.from('plates').update(updatePayload).eq('id', id);
      if (error) console.error('Erro Supabase updatePlate:', error);
    }

    const data = getLocalData();
    const idx = data.plates.findIndex(p => p.id === id);
    if (idx !== -1) {
      data.plates[idx] = { ...data.plates[idx], ...fields, updatedAt: new Date().toISOString() };
      saveLocalData(data);
      return data.plates[idx];
    }
    return null;
  },

  async deletePlate(id) {
    if (supabase) {
      const { error } = await supabase.from('plates').delete().eq('id', id);
      if (error) console.error('Erro Supabase deletePlate:', error);
    }
    const data = getLocalData();
    data.plates = data.plates.filter(p => p.id !== id);
    saveLocalData(data);
  },

  async recordScan(plateId, source, logData) {
    if (supabase) {
      // Incrementa os contadores na placa
      const { data: p } = await supabase.from('plates').select('scans_total, scans_nfc, scans_qr').eq('id', plateId).maybeSingle();
      if (p) {
        const total = (p.scans_total || 0) + 1;
        const nfc = source === 'nfc' ? (p.scans_nfc || 0) + 1 : (p.scans_nfc || 0);
        const qr = source === 'qr' ? (p.scans_qr || 0) + 1 : (p.scans_qr || 0);

        await supabase.from('plates').update({
          scans_total: total,
          scans_nfc: nfc,
          scans_qr: qr,
          updated_at: new Date().toISOString()
        }).eq('id', plateId);
      }

      // Insere o log
      await supabase.from('logs').insert([{
        id: logData.id,
        plate_id: plateId,
        user_id: logData.userId || null,
        slug: logData.slug,
        plate_name: logData.plateName,
        source: logData.source,
        device: logData.device,
        user_agent: logData.userAgent,
        target_url: logData.targetUrl,
        created_at: logData.timestamp
      }]);
    }

    // Grava também no local
    const local = getLocalData();
    const pl = local.plates.find(p => p.id === plateId);
    if (pl) {
      if (!pl.scans) pl.scans = { total: 0, nfc: 0, qr: 0 };
      pl.scans.total += 1;
      if (source === 'nfc') pl.scans.nfc += 1;
      else if (source === 'qr') pl.scans.qr += 1;
    }
    local.logs.unshift(logData);
    if (local.logs.length > 500) local.logs = local.logs.slice(0, 500);
    saveLocalData(local);
  },

  async getLogs() {
    if (supabase) {
      const { data, error } = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(200);
      if (!error && data) {
        return data.map(l => ({
          id: l.id,
          plateId: l.plate_id,
          userId: l.user_id,
          slug: l.slug,
          plateName: l.plate_name,
          source: l.source,
          device: l.device,
          userAgent: l.user_agent,
          targetUrl: l.target_url,
          timestamp: l.created_at
        }));
      }
    }
    return getLocalData().logs;
  }
};

module.exports = db;
