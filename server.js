require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
const db = require('./lib/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Netlify Functions path rewrite support
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/server')) {
    req.url = req.url.replace('/.netlify/functions/server', '') || '/';
  }
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Stateless Session Token Engine (100% compatível com Serverless e Netlify Functions)
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'futura-smart-nfc-token-secret-key-2026';

function generateToken(user) {
  const payload = Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Date.now()
  })).toString('base64url');

  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
  if (signature !== expectedSig) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    // Válido por 30 dias
    if (Date.now() - data.iat > 30 * 24 * 60 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

// Seed Super Admin Account in Database
async function seedAdmin() {
  try {
    const adminEmail = 'wluchesi@gmail.com';
    let admin = await db.getUserByEmail(adminEmail);

    if (!admin) {
      admin = {
        id: 'usr-admin-01',
        name: 'W Luchesi',
        email: adminEmail,
        whatsapp: '(11) 99999-9999',
        password: 'C@n@l4141',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      await db.createUser(admin);
      console.log('[Auth] Administrador wluchesi@gmail.com inicializado com sucesso.');
    } else {
      await db.updateUser(admin.id, { role: 'admin', password: 'C@n@l4141' });
    }
  } catch (err) {
    console.error('Erro no seed admin:', err);
  }
}
seedAdmin();

// Detect Device
function detectDevice(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'iPhone (iOS)';
  if (/android/.test(ua)) return 'Android';
  if (/macintosh|mac os x/.test(ua)) return 'Mac (Desktop)';
  if (/windows/.test(ua)) return 'Windows (Desktop)';
  if (/linux/.test(ua)) return 'Linux (Desktop)';
  return 'Outro / Mobile';
}

// Authentication Middlewares
async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Não autorizado. Faça login para continuar.' });
  }

  const token = authHeader.split(' ')[1];
  const tokenData = verifyToken(token);

  if (!tokenData || !tokenData.userId) {
    return res.status(401).json({ success: false, message: 'Sessão expirada ou inválida. Faça login novamente.' });
  }

  let user = await db.getUserById(tokenData.userId);
  if (!user && tokenData.email) {
    user = await db.getUserByEmail(tokenData.email);
  }

  if (!user) {
    return res.status(401).json({ success: false, message: 'Usuário não encontrado.' });
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    role: user.role
  };

  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso negado. Recurso restrito a administradores.' });
  }
  next();
}

/* ========================================================
   1. MÓDULO DE REDIRECIONAMENTO DINÂMICO PÚBLICO (/r/:slug)
   ======================================================== */
app.get('/r/:slug', async (req, res) => {
  try {
    const slug = req.params.slug.trim().toLowerCase();
    const source = (req.query.src || 'direct').toLowerCase(); // 'nfc', 'qr', 'direct'
    const userAgent = req.headers['user-agent'] || '';
    const device = detectDevice(userAgent);

    const plate = await db.getPlateBySlug(slug);

    // Caso 1: Placa inexistente
    if (!plate) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Placa não encontrada | Futura Smart</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin:0; padding:0; box-sizing:border-box; font-family:'Plus Jakarta Sans',sans-serif; }
            body { background:#090D16; color:#F1F5F9; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; text-align:center; }
            .card { background:rgba(30,41,59,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:40px 30px; max-width:440px; width:100%; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); backdrop-filter:blur(16px); }
            .icon { width:64px; height:64px; border-radius:50%; background:rgba(239,68,68,0.15); color:#EF4444; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:28px; }
            h1 { font-size:1.5rem; margin-bottom:12px; font-weight:700; color:#FFFFFF; }
            p { color:#94A3B8; font-size:0.95rem; line-height:1.5; margin-bottom:24px; }
            .badge { display:inline-block; background:rgba(255,255,255,0.06); padding:6px 14px; border-radius:99px; font-size:0.85rem; color:#38BDF8; font-family:monospace; margin-bottom:24px; border:1px solid rgba(56,189,248,0.2); }
            a { display:inline-block; background:#0284C7; color:#fff; text-decoration:none; padding:12px 24px; border-radius:12px; font-weight:600; font-size:0.9rem; transition:0.2s; }
            a:hover { background:#0369A1; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⚠️</div>
            <h1>Placa Não Cadastrada</h1>
            <p>O identificador desta placa inteligente não foi localizado no sistema ou ainda não foi configurado.</p>
            <div class="badge">slug: ${slug}</div>
            <br>
            <a href="/">Ir para o Painel</a>
          </div>
        </body>
        </html>
      `);
    }

    // Caso 2: Placa Pausada / Inativa
    if (!plate.isActive) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Placa em Pausa | ${plate.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            * { margin:0; padding:0; box-sizing:border-box; font-family:'Plus Jakarta Sans',sans-serif; }
            body { background:#090D16; color:#F1F5F9; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; text-align:center; }
            .card { background:rgba(30,41,59,0.7); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:40px 30px; max-width:440px; width:100%; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); backdrop-filter:blur(16px); }
            .icon { width:64px; height:64px; border-radius:50%; background:rgba(245,158,11,0.15); color:#F59E0B; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:28px; }
            h1 { font-size:1.4rem; margin-bottom:8px; font-weight:700; color:#FFFFFF; }
            .store { color:#38BDF8; font-size:1.1rem; font-weight:600; margin-bottom:16px; }
            p { color:#94A3B8; font-size:0.95rem; line-height:1.5; margin-bottom:24px; }
            .notice { background:rgba(255,255,255,0.04); padding:12px; border-radius:12px; font-size:0.85rem; color:#CBD5E1; border:1px solid rgba(255,255,255,0.06); }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⏳</div>
            <h1>Placa Temporariamente em Pausa</h1>
            <div class="store">${plate.name}</div>
            <p>O direcionamento desta plaquinha está temporariamente suspenso para manutenção pelo administrador do estabelecimento.</p>
            <div class="notice">Por favor, tente novamente em alguns instantes.</div>
          </div>
        </body>
        </html>
      `);
    }

    // Caso 3: Placa Ativa -> Registrar Métrica e Redirecionar
    const logEntry = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      plateId: plate.id,
      userId: plate.userId || '',
      slug: plate.slug,
      plateName: plate.name,
      source: source === 'nfc' ? 'nfc' : (source === 'qr' ? 'qr' : 'direto'),
      device: device,
      userAgent: userAgent,
      targetUrl: plate.destinationUrl,
      timestamp: new Date().toISOString()
    };

    // Grava de forma assíncrona
    db.recordScan(plate.id, source, logEntry).catch(e => console.error('Erro ao registrar scan:', e));

    let target = plate.destinationUrl;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }

    return res.redirect(302, target);
  } catch (err) {
    console.error('Erro no redirecionamento /r/:slug:', err);
    res.status(500).send('Erro interno do servidor');
  }
});

/* ========================================================
   2. ROTAS DE AUTENTICAÇÃO (LOGIN & REGISTRO)
   ======================================================== */

// Registrar novo usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, whatsapp, password } = req.body;

    if (!name || !email || !whatsapp || !password) {
      return res.status(400).json({ success: false, message: 'Todos os campos (Nome, E-mail, WhatsApp e Senha) são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.getUserByEmail(cleanEmail);

    if (existing) {
      return res.status(400).json({ success: false, message: 'Este e-mail já está cadastrado no sistema.' });
    }

    const newUser = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      email: cleanEmail,
      whatsapp: whatsapp.trim(),
      password: password.trim(),
      role: 'user',
      createdAt: new Date().toISOString()
    };

    await db.createUser(newUser);

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso!',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, whatsapp: newUser.whatsapp, role: newUser.role }
    });
  } catch (err) {
    console.error('Erro registro:', err);
    res.status(500).json({ success: false, message: 'Erro ao registrar usuário' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Informe o e-mail e a senha.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.getUserByEmail(cleanEmail);

    if (!user || user.password !== password.trim()) {
      return res.status(401).json({ success: false, message: 'E-mail ou senha incorretos.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: `Bem-vindo(a), ${user.name}!`,
      token,
      user: { id: user.id, name: user.name, email: user.email, whatsapp: user.whatsapp, role: user.role }
    });
  } catch (err) {
    console.error('Erro login:', err);
    res.status(500).json({ success: false, message: 'Erro ao processar login' });
  }
});

// Obter usuário da sessão atual
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

/* ========================================================
   3. GESTÃO DE USUÁRIOS (APENAS ADMINISTRADORES)
   ======================================================== */

// Listar todos os usuários
app.get('/api/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await db.getUsers();
    const plates = await db.getPlates();

    const safeUsers = users.map(u => {
      const platesCount = plates.filter(p => p.userId === u.id).length;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        whatsapp: u.whatsapp,
        role: u.role,
        platesCount,
        createdAt: u.created_at || u.createdAt
      };
    });

    res.json({ success: true, users: safeUsers });
  } catch (err) {
    console.error('Erro get users:', err);
    res.status(500).json({ success: false, message: 'Erro ao listar usuários' });
  }
});

// Criar novo usuário pelo admin
app.post('/api/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, whatsapp, password, role } = req.body;

    if (!name || !email || !whatsapp || !password) {
      return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.getUserByEmail(cleanEmail);

    if (existing) {
      return res.status(400).json({ success: false, message: 'E-mail já cadastrado.' });
    }

    const newUser = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      email: cleanEmail,
      whatsapp: whatsapp.trim(),
      password: password.trim(),
      role: role === 'admin' ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };

    await db.createUser(newUser);

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso!',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, whatsapp: newUser.whatsapp, role: newUser.role }
    });
  } catch (err) {
    console.error('Erro admin create user:', err);
    res.status(500).json({ success: false, message: 'Erro ao cadastrar usuário' });
  }
});

// Editar dados de um usuário pelo admin (Nome, E-mail, WhatsApp, Papel)
app.put('/api/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, whatsapp, role } = req.body;
    const user = await db.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (whatsapp !== undefined) updateFields.whatsapp = whatsapp.trim();

    if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      const existing = await db.getUserByEmail(cleanEmail);
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ success: false, message: 'Este e-mail já está em uso por outro usuário.' });
      }
      updateFields.email = cleanEmail;
    }

    if (role && (role === 'admin' || role === 'user')) {
      if (user.email === 'wluchesi@gmail.com') {
        updateFields.role = 'admin';
      } else {
        updateFields.role = role;
      }
    }

    const updated = await db.updateUser(user.id, updateFields);
    res.json({ success: true, message: `Dados do usuário ${name || user.name} atualizados com sucesso!`, user: updated });
  } catch (err) {
    console.error('Erro edit user:', err);
    res.status(500).json({ success: false, message: 'Erro ao atualizar dados do usuário' });
  }
});

// Alterar senha de um usuário pelo admin
app.put('/api/users/:id/password', authenticate, requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'A nova senha deve ter pelo menos 4 caracteres.' });
    }

    const user = await db.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    await db.updateUser(user.id, { password: newPassword.trim() });
    res.json({ success: true, message: `Senha do usuário ${user.name} alterada com sucesso!` });
  } catch (err) {
    console.error('Erro change password:', err);
    res.status(500).json({ success: false, message: 'Erro ao alterar senha' });
  }
});

// Excluir usuário pelo admin
app.delete('/api/users/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    if (user.email === 'wluchesi@gmail.com') {
      return res.status(400).json({ success: false, message: 'O administrador principal não pode ser excluído.' });
    }

    await db.deleteUser(req.params.id);
    res.json({ success: true, message: `Usuário ${user.name} excluído com sucesso!` });
  } catch (err) {
    console.error('Erro delete user:', err);
    res.status(500).json({ success: false, message: 'Erro ao excluir usuário' });
  }
});

/* ========================================================
   4. GESTÃO DE PLACAS & ANALYTICS (COM CONTROLE DE ACESSO)
   ======================================================== */

// Listar placas
app.get('/api/plates', authenticate, async (req, res) => {
  try {
    let plates = await db.getPlates();
    const users = await db.getUsers();

    if (req.user.role !== 'admin') {
      plates = plates.filter(p => p.userId === req.user.id);
    } else {
      plates = plates.map(p => {
        const owner = users.find(u => u.id === p.userId);
        return {
          ...p,
          ownerName: owner ? owner.name : 'Administrador',
          ownerEmail: owner ? owner.email : 'wluchesi@gmail.com',
          ownerWhatsapp: owner ? owner.whatsapp : ''
        };
      });
    }

    res.json({ success: true, count: plates.length, plates });
  } catch (err) {
    console.error('Erro get plates:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar placas' });
  }
});

// Obter próximo código sequencial de placa (iniciando em PI-121)
app.get('/api/plates/next-code', authenticate, async (req, res) => {
  try {
    const nextCode = await db.getNextPlateCode();
    res.json({ success: true, nextCode });
  } catch (err) {
    console.error('Erro next-code:', err);
    res.status(500).json({ success: false, message: 'Erro ao calcular próximo código' });
  }
});

// Gerar lote de placas sequenciais para impressão gráfica
app.post('/api/plates/batch-generate', authenticate, async (req, res) => {
  try {
    const { count = 1, destinationUrl, type = 'google', assignedUserId, location = 'Balcão' } = req.body;
    const userId = (req.user.role === 'admin' && assignedUserId) ? assignedUserId : req.user.id;
    const url = destinationUrl ? destinationUrl.trim() : 'https://google.com';

    const created = [];
    const requestedCount = Math.min(Math.max(parseInt(count, 10) || 1, 1), 16);

    for (let i = 0; i < requestedCount; i++) {
      const code = await db.getNextPlateCode();
      const num = code.replace('PI-', '');
      const slug = `pi-${num.toLowerCase()}`;

      const newPlate = {
        id: 'plk-' + Math.random().toString(36).substring(2, 9),
        userId: userId,
        slug: slug,
        name: `Placa Inteligente ${code}`,
        code: code,
        location: location,
        type: type,
        destinationUrl: url,
        isActive: true,
        notes: `Gerada no Estúdio Gráfico [${code}]`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const saved = await db.createPlate(newPlate);
      created.push(saved);
    }

    res.status(201).json({
      success: true,
      message: `${created.length} placa(s) gerada(s) com sucesso na sequência!`,
      plates: created
    });
  } catch (err) {
    console.error('Erro batch-generate:', err);
    res.status(500).json({ success: false, message: 'Erro ao gerar lote de placas' });
  }
});

// Buscar placa individual
app.get('/api/plates/:id', authenticate, async (req, res) => {
  try {
    const plates = await db.getPlates();
    const plate = plates.find(p => p.id === req.params.id || p.slug === req.params.id);

    if (!plate) return res.status(404).json({ success: false, message: 'Placa não encontrada.' });

    if (req.user.role !== 'admin' && plate.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Acesso negado a esta placa.' });
    }

    res.json({ success: true, plate });
  } catch (err) {
    console.error('Erro get plate:', err);
    res.status(500).json({ success: false, message: 'Erro ao buscar placa' });
  }
});

// Criar nova placa
app.post('/api/plates', authenticate, async (req, res) => {
  try {
    const { name, location, destinationUrl, type, slug, assignedUserId } = req.body;

    if (!name || !destinationUrl) {
      return res.status(400).json({ success: false, message: 'Nome e URL de destino são obrigatórios.' });
    }

    const plates = await db.getPlates();

    let finalSlug = slug ? slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') : '';
    if (!finalSlug) {
      finalSlug = name.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (!finalSlug) finalSlug = 'placa-' + Math.random().toString(36).substring(2, 7);
    }

    let counter = 1;
    let uniqueSlug = finalSlug;
    while (plates.some(p => p.slug.toLowerCase() === uniqueSlug.toLowerCase())) {
      uniqueSlug = `${finalSlug}-${counter}`;
      counter++;
    }

    let ownerId = req.user.id;
    if (req.user.role === 'admin' && assignedUserId) {
      ownerId = assignedUserId;
    }

    const newPlate = {
      id: 'plk-' + Math.random().toString(36).substring(2, 9),
      userId: ownerId,
      slug: uniqueSlug,
      name: name.trim(),
      location: (location || 'Balcão / Entrada').trim(),
      type: type || 'google',
      destinationUrl: destinationUrl.trim(),
      isActive: true,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scans: {
        total: 0,
        nfc: 0,
        qr: 0
      }
    };

    await db.createPlate(newPlate);
    res.status(201).json({ success: true, plate: newPlate });
  } catch (err) {
    console.error('Erro create plate:', err);
    res.status(500).json({ success: false, message: 'Erro ao criar placa' });
  }
});

// Atualizar placa existente
app.put('/api/plates/:id', authenticate, async (req, res) => {
  try {
    const { name, location, destinationUrl, type, slug, isActive, assignedUserId } = req.body;
    const plates = await db.getPlates();
    const existing = plates.find(p => p.id === req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Placa não encontrada.' });
    }

    if (req.user.role !== 'admin' && existing.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Acesso negado. Você só pode editar suas próprias placas.' });
    }

    let updatedSlug = existing.slug;
    if (slug && slug.trim().toLowerCase() !== existing.slug) {
      const candidate = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      if (plates.some(p => p.id !== existing.id && p.slug.toLowerCase() === candidate)) {
        return res.status(400).json({ success: false, message: 'Este link/slug já está em uso por outra placa.' });
      }
      updatedSlug = candidate;
    }

    let updatedUserId = existing.userId;
    if (req.user.role === 'admin' && assignedUserId) {
      updatedUserId = assignedUserId;
    }

    const updatePayload = {
      name: name !== undefined ? name.trim() : existing.name,
      location: location !== undefined ? location.trim() : existing.location,
      destinationUrl: destinationUrl !== undefined ? destinationUrl.trim() : existing.destinationUrl,
      type: type !== undefined ? type : existing.type,
      slug: updatedSlug,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      userId: updatedUserId
    };

    const updated = await db.updatePlate(existing.id, updatePayload);
    res.json({ success: true, plate: updated });
  } catch (err) {
    console.error('Erro update plate:', err);
    res.status(500).json({ success: false, message: 'Erro ao atualizar placa' });
  }
});

// Alternar status ativo/pausado
app.patch('/api/plates/:id/toggle', authenticate, async (req, res) => {
  try {
    const plates = await db.getPlates();
    const plate = plates.find(p => p.id === req.params.id);
    if (!plate) return res.status(404).json({ success: false, message: 'Placa não encontrada.' });

    if (req.user.role !== 'admin' && plate.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    const newActiveState = !plate.isActive;
    await db.updatePlate(plate.id, { isActive: newActiveState });

    res.json({ success: true, isActive: newActiveState, plate: { ...plate, isActive: newActiveState } });
  } catch (err) {
    console.error('Erro toggle plate:', err);
    res.status(500).json({ success: false, message: 'Erro ao alternar status da placa' });
  }
});

// Excluir placa
app.delete('/api/plates/:id', authenticate, async (req, res) => {
  try {
    const plates = await db.getPlates();
    const plate = plates.find(p => p.id === req.params.id);

    if (!plate) return res.status(404).json({ success: false, message: 'Placa não encontrada.' });

    if (req.user.role !== 'admin' && plate.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    await db.deletePlate(req.params.id);
    res.json({ success: true, message: 'Placa removida com sucesso.' });
  } catch (err) {
    console.error('Erro delete plate:', err);
    res.status(500).json({ success: false, message: 'Erro ao excluir placa' });
  }
});

// Obter Analytics consolidados
app.get('/api/analytics', authenticate, async (req, res) => {
  try {
    let plates = await db.getPlates();
    let logs = await db.getLogs();

    if (req.user.role !== 'admin') {
      plates = plates.filter(p => p.userId === req.user.id);
      const userPlateIds = new Set(plates.map(p => p.id));
      logs = logs.filter(l => userPlateIds.has(l.plateId));
    }

    const totalPlates = plates.length;
    const activePlates = plates.filter(p => p.isActive).length;

    let totalScans = 0;
    let totalNFC = 0;
    let totalQR = 0;

    plates.forEach(p => {
      totalScans += (p.scans?.total || 0);
      totalNFC += (p.scans?.nfc || 0);
      totalQR += (p.scans?.qr || 0);
    });

    const deviceCounts = {};
    logs.forEach(l => {
      const dev = l.device || 'Desconhecido';
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });

    const todayStr = new Date().toISOString().slice(0, 10);
    const scansToday = logs.filter(l => l.timestamp && l.timestamp.startsWith(todayStr)).length;

    res.json({
      success: true,
      summary: {
        totalPlates,
        activePlates,
        totalScans,
        totalNFC,
        totalQR,
        scansToday,
        nfcRatio: totalScans > 0 ? Math.round((totalNFC / totalScans) * 100) : 0,
        qrRatio: totalScans > 0 ? Math.round((totalQR / totalScans) * 100) : 0
      },
      deviceBreakdown: deviceCounts,
      recentLogs: logs.slice(0, 30)
    });
  } catch (err) {
    console.error('Erro get analytics:', err);
    res.status(500).json({ success: false, message: 'Erro ao gerar analytics' });
  }
});

// Gerador de QR Code dinâmico em SVG ou PNG
app.get('/api/qrcode/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const format = (req.query.format || 'png').toLowerCase();
    const source = (req.query.src || 'qr').toLowerCase();
    const colorDark = req.query.color || '#000000';
    const colorLight = req.query.bg || '#ffffff';
    const margin = parseInt(req.query.margin || '2', 10);

    const protocol = req.protocol;
    const host = req.get('host');
    const redirectUrl = `${protocol}://${host}/r/${slug}?src=${source}`;

    const qrOptions = {
      margin: margin,
      color: {
        dark: colorDark,
        light: colorLight
      },
      width: 600,
      errorCorrectionLevel: 'H'
    };

    if (format === 'svg') {
      const svgString = await QRCode.toString(redirectUrl, { ...qrOptions, type: 'svg' });
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svgString);
    } else {
      const buffer = await QRCode.toBuffer(redirectUrl, qrOptions);
      res.setHeader('Content-Type', 'image/png');
      return res.send(buffer);
    }
  } catch (err) {
    console.error('Erro ao gerar QRCode:', err);
    res.status(500).json({ success: false, message: 'Falha ao gerar QR Code' });
  }
});

// Simular escaneamento
app.post('/api/test-scan/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { source, device } = req.body;

    const plate = await db.getPlateBySlug(slug);
    if (!plate) return res.status(404).json({ success: false, message: 'Placa não encontrada.' });

    const src = source === 'nfc' ? 'nfc' : 'qr';

    const logEntry = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      plateId: plate.id,
      userId: plate.userId || '',
      slug: plate.slug,
      plateName: plate.name,
      source: src,
      device: device || 'Simulador Web',
      userAgent: 'Web Simulator / Painel Administrativo',
      targetUrl: plate.destinationUrl,
      timestamp: new Date().toISOString()
    };

    await db.recordScan(plate.id, src, logEntry);

    res.json({
      success: true,
      message: `Simulação de ${src.toUpperCase()} computada com sucesso!`,
      targetUrl: plate.destinationUrl,
      plate
    });
  } catch (err) {
    console.error('Erro test-scan:', err);
    res.status(500).json({ success: false, message: 'Erro ao registrar teste' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Futura Smart] Servidor ativo em http://localhost:${PORT}`);
  });
}

module.exports = app;
