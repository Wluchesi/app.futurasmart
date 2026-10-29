/**
 * Futura Smart - Frontend Controller
 * Módulo de Redirecionamento Dinâmico para Placas NFC e QR Code
 * Controle de Autenticação & Permissões Multi-Usuário (Admin vs Usuário Comum)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let state = {
    currentUser: null,
    token: localStorage.getItem('futura_smart_token') || null,
    plates: [],
    users: [],
    analytics: null,
    activeFilter: 'all',
    selectedUserFilter: 'all',
    searchQuery: '',
    selectedPlateForStudio: null,
  };

  // DOM Elements - Navigation & Header
  const btnOpenUsersModal = document.getElementById('btnOpenUsersModal');
  const btnOpenLogs = document.getElementById('btnOpenLogs');
  const btnNewPlate = document.getElementById('btnNewPlate');
  const userHeaderProfile = document.getElementById('userHeaderProfile');
  const userAvatar = document.getElementById('userAvatar');
  const userNameHeader = document.getElementById('userNameHeader');
  const userRoleBadge = document.getElementById('userRoleBadge');
  const btnLogout = document.getElementById('btnLogout');

  // DOM Elements - Main View Navigation Tabs
  const navTabDashboard = document.getElementById('navTabDashboard');
  const navTabPlates = document.getElementById('navTabPlates');
  const viewDashboard = document.getElementById('viewDashboard');
  const viewPlatesManager = document.getElementById('viewPlatesManager');
  const navPlatesCountBadge = document.getElementById('navPlatesCountBadge');
  const btnQuickNewPlate = document.getElementById('btnQuickNewPlate');
  const btnGoToPlatesManager = document.getElementById('btnGoToPlatesManager');

  // DOM Elements - Metrics
  const valTotalPlates = document.getElementById('valTotalPlates');
  const valActivePlates = document.getElementById('valActivePlates');
  const valTotalScans = document.getElementById('valTotalScans');
  const valTodayScans = document.getElementById('valTodayScans');
  const valNfcScans = document.getElementById('valNfcScans');
  const nfcProgressBar = document.getElementById('nfcProgressBar');
  const nfcRatioText = document.getElementById('nfcRatioText');
  const valQrScans = document.getElementById('valQrScans');
  const qrProgressBar = document.getElementById('qrProgressBar');
  const qrRatioText = document.getElementById('qrRatioText');

  // DOM Elements - Admin User Filter Ribbon
  const adminUserFilterSection = document.getElementById('adminUserFilterSection');
  const selectPlateUserFilter = document.getElementById('selectPlateUserFilter');
  const btnClearUserFilter = document.getElementById('btnClearUserFilter');
  const userFilterChipsList = document.getElementById('userFilterChipsList');
  const activeUserFilterPill = document.getElementById('activeUserFilterPill');

  // DOM Elements - Print Studio & A4 Generator
  const btnOpenPrintStudio = document.getElementById('btnOpenPrintStudio');
  const printStudioModal = document.getElementById('printStudioModal');
  const btnClosePrintStudio = document.getElementById('btnClosePrintStudio');
  const tabModeBatch = document.getElementById('tabModeBatch');
  const tabModeExisting = document.getElementById('tabModeExisting');
  const sectionBatchConfig = document.getElementById('sectionBatchConfig');
  const sectionExistingConfig = document.getElementById('sectionExistingConfig');
  const studioNextCodeDisplay = document.getElementById('studioNextCodeDisplay');
  const studioBatchDestination = document.getElementById('studioBatchDestination');
  const studioAssignUser = document.getElementById('studioAssignUser');
  const studioSelectExistingPlates = document.getElementById('studioSelectExistingPlates');
  const btnThemeWhite = document.getElementById('btnThemeWhite');
  const btnThemeBlack = document.getElementById('btnThemeBlack');
  const btnLayout1 = document.getElementById('btnLayout1');
  const btnLayout2 = document.getElementById('btnLayout2');
  const btnLayout4 = document.getElementById('btnLayout4');
  const checkCropMarks = document.getElementById('checkCropMarks');
  const btnDownloadA4Pdf = document.getElementById('btnDownloadA4Pdf');
  const btnPrintA4Direct = document.getElementById('btnPrintA4Direct');
  const canvasPlatesSummary = document.getElementById('canvasPlatesSummary');
  const a4PrintSheet = document.getElementById('a4PrintSheet');
  const a4SheetInner = document.getElementById('a4SheetInner');

  // DOM Elements - Plates Section
  const platesGrid = document.getElementById('platesGrid');
  const platesCount = document.getElementById('platesCount');
  const searchInput = document.getElementById('searchInput');
  const filterPills = document.querySelectorAll('.filter-pill');

  // Modals
  const authModal = document.getElementById('authModal');
  const tabBtnLogin = document.getElementById('tabBtnLogin');
  const tabBtnRegister = document.getElementById('tabBtnRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  const plateModal = document.getElementById('plateModal');
  const btnClosePlateModal = document.getElementById('btnClosePlateModal');
  const btnCancelPlate = document.getElementById('btnCancelPlate');
  const plateForm = document.getElementById('plateForm');
  const modalPlateTitle = document.getElementById('modalPlateTitle');
  const groupAssignUser = document.getElementById('groupAssignUser');
  const formAssignUser = document.getElementById('formAssignUser');

  const studioModal = document.getElementById('studioModal');
  const btnCloseStudio = document.getElementById('btnCloseStudio');
  const studioSubtitle = document.getElementById('studioSubtitle');
  const mockupBrand = document.getElementById('mockupBrand');
  const mockupLocation = document.getElementById('mockupLocation');
  const mockupQrImage = document.getElementById('mockupQrImage');
  const mockupCenterLogo = document.getElementById('mockupCenterLogo');
  const nfcUrlInput = document.getElementById('nfcUrlInput');
  const btnCopyNfcUrl = document.getElementById('btnCopyNfcUrl');
  const btnDownloadPng = document.getElementById('btnDownloadPng');
  const btnDownloadSvg = document.getElementById('btnDownloadSvg');
  const btnTestNfc = document.getElementById('btnTestNfc');
  const btnTestQr = document.getElementById('btnTestQr');
  const btnStudioOpenPrintModal = document.getElementById('btnStudioOpenPrintModal');

  const usersModal = document.getElementById('usersModal');
  const btnCloseUsersModal = document.getElementById('btnCloseUsersModal');
  const usersTableBody = document.getElementById('usersTableBody');
  const usersTotalCount = document.getElementById('usersTotalCount');
  const btnOpenCreateUserModal = document.getElementById('btnOpenCreateUserModal');

  const createUserModal = document.getElementById('createUserModal');
  const btnCloseCreateUser = document.getElementById('btnCloseCreateUser');
  const btnCancelCreateUser = document.getElementById('btnCancelCreateUser');
  const adminCreateUserForm = document.getElementById('adminCreateUserForm');

  const editUserModal = document.getElementById('editUserModal');
  const btnCloseEditUser = document.getElementById('btnCloseEditUser');
  const btnCancelEditUser = document.getElementById('btnCancelEditUser');
  const adminEditUserForm = document.getElementById('adminEditUserForm');
  const editUserId = document.getElementById('editUserId');
  const editUserName = document.getElementById('editUserName');
  const editUserEmail = document.getElementById('editUserEmail');
  const editUserWhatsapp = document.getElementById('editUserWhatsapp');
  const editUserRole = document.getElementById('editUserRole');

  const passwordModal = document.getElementById('passwordModal');
  const btnClosePasswordModal = document.getElementById('btnClosePasswordModal');
  const btnCancelPasswordModal = document.getElementById('btnCancelPasswordModal');
  const adminChangePasswordForm = document.getElementById('adminChangePasswordForm');
  const changePasswordUserId = document.getElementById('changePasswordUserId');
  const newPasswordInput = document.getElementById('newPasswordInput');
  const passwordModalTitle = document.getElementById('passwordModalTitle');

  const logsDrawer = document.getElementById('logsDrawer');
  const btnCloseLogs = document.getElementById('btnCloseLogs');
  const logsList = document.getElementById('logsList');
  const deviceSummary = document.getElementById('deviceSummary');

  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // Form Fields
  const formPlateId = document.getElementById('formPlateId');
  const formName = document.getElementById('formName');
  const formLocation = document.getElementById('formLocation');
  const formType = document.getElementById('formType');
  const formDestination = document.getElementById('formDestination');
  const formSlug = document.getElementById('formSlug');
  const formIsActive = document.getElementById('formIsActive');
  const serverHostPrefix = document.getElementById('serverHostPrefix');

  serverHostPrefix.textContent = window.location.host + '/r/';

  // ==========================================
  // INITIALIZATION & AUTH CHECK
  // ==========================================
  init();

  async function init() {
    setupEventListeners();

    if (state.token) {
      const isValid = await checkCurrentSession();
      if (isValid) {
        onAuthSuccess();
        return;
      }
    }

    // Se não há sessão válida, exibe modal de autenticação
    openAuthModal();
  }

  // Helper para requisições autenticadas
  async function fetchWithAuth(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (state.token) {
      options.headers['Authorization'] = `Bearer ${state.token}`;
    }
    const res = await fetch(url, options);
    if (res.status === 401) {
      // Sessão expirou
      handleLogout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    return res;
  }

  async function checkCurrentSession() {
    try {
      const res = await fetchWithAuth('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        state.currentUser = data.user;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function onAuthSuccess() {
    closeAuthModal();
    updateUserProfileHeader();

    // Carrega dados conforme permissões do usuário
    fetchAnalytics();
    fetchPlates();

    if (state.currentUser.role === 'admin') {
      btnOpenUsersModal.style.display = 'inline-flex';
      if (adminUserFilterSection) adminUserFilterSection.style.display = 'block';
      fetchUsersList();
    } else {
      btnOpenUsersModal.style.display = 'none';
      if (adminUserFilterSection) adminUserFilterSection.style.display = 'none';
    }
  }

  function updateUserProfileHeader() {
    const user = state.currentUser;
    if (!user) return;

    const initial = (user.name || user.email).charAt(0).toUpperCase();
    userAvatar.textContent = initial;
    userNameHeader.textContent = user.name || user.email;

    if (user.role === 'admin') {
      userRoleBadge.textContent = 'Admin';
      userRoleBadge.style.color = '#F6E05E';
    } else {
      userRoleBadge.textContent = 'Cliente';
      userRoleBadge.style.color = '#38BDF8';
    }
  }

  function handleLogout() {
    state.currentUser = null;
    state.token = null;
    state.selectedUserFilter = 'all';
    localStorage.removeItem('futura_smart_token');
    if (adminUserFilterSection) adminUserFilterSection.style.display = 'none';
    openAuthModal();
    showToast('Você saiu do sistema.');
  }

  // ==========================================
  // AUTH MODAL & FORM HANDLERS
  // ==========================================
  function openAuthModal() {
    authModal.classList.add('is-active');
  }

  function closeAuthModal() {
    authModal.classList.remove('is-active');
  }

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        state.token = data.token;
        state.currentUser = data.user;
        localStorage.setItem('futura_smart_token', data.token);
        showToast(data.message || 'Login realizado com sucesso!');
        loginForm.reset();
        onAuthSuccess();
      } else {
        showToast(data.message || 'Erro ao realizar login.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Falha na conexão com o servidor.', true);
    }
  });

  // Novo Cadastro (Nome, E-mail, WhatsApp, Senha)
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const whatsapp = document.getElementById('regWhatsapp').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, whatsapp, password })
      });
      const data = await res.json();

      if (data.success) {
        state.token = data.token;
        state.currentUser = data.user;
        localStorage.setItem('futura_smart_token', data.token);
        showToast('Cadastro realizado com sucesso! Bem-vindo(a).');
        registerForm.reset();
        onAuthSuccess();
      } else {
        showToast(data.message || 'Erro ao criar conta.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Falha na conexão com o servidor.', true);
    }
  });

  // Tab switching (Login vs Cadastro)
  tabBtnLogin.addEventListener('click', () => {
    tabBtnLogin.classList.add('active');
    tabBtnRegister.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  });

  tabBtnRegister.addEventListener('click', () => {
    tabBtnRegister.classList.add('active');
    tabBtnLogin.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });

  btnLogout.addEventListener('click', handleLogout);

  // ==========================================
  // API CALLS: PLACAS & ANALYTICS
  // ==========================================
  async function fetchPlates() {
    try {
      const res = await fetchWithAuth('/api/plates');
      const data = await res.json();
      if (data.success) {
        state.plates = data.plates;
        renderPlates();
        renderDashboardCharts();
        if (state.currentUser?.role === 'admin') {
          updateUserFilterUI();
        }
      }
    } catch (err) {
      console.error('Erro ao buscar placas:', err);
    }
  }

  async function fetchAnalytics() {
    try {
      const res = await fetchWithAuth('/api/analytics');
      const data = await res.json();
      if (data.success) {
        state.analytics = data;
        updateMetricsUI(data.summary);
      }
    } catch (err) {
      console.error('Erro ao buscar métricas:', err);
    }
  }

  function updateMetricsUI(summary) {
    if (!summary) return;
    valTotalPlates.textContent = summary.totalPlates;
    valActivePlates.textContent = `${summary.activePlates} ativas no momento`;
    valTotalScans.textContent = summary.totalScans.toLocaleString('pt-BR');
    valTodayScans.textContent = summary.scansToday;
    valNfcScans.textContent = summary.totalNFC.toLocaleString('pt-BR');
    valQrScans.textContent = summary.totalQR.toLocaleString('pt-BR');

    const nfcPct = summary.nfcRatio || 0;
    const qrPct = summary.qrRatio || 0;

    nfcProgressBar.style.width = `${nfcPct}%`;
    nfcRatioText.textContent = `${nfcPct}% do total`;

    qrProgressBar.style.width = `${qrPct}%`;
    qrRatioText.textContent = `${qrPct}% do total`;

    renderDashboardCharts();
  }

  // ==========================================
  // RENDERING PLATES
  // ==========================================
  function renderPlates() {
    const filtered = state.plates.filter(plate => {
      // Filtro por Usuário Específico (Admin)
      if (state.selectedUserFilter && state.selectedUserFilter !== 'all') {
        if (plate.userId !== state.selectedUserFilter) return false;
      }

      if (state.activeFilter === 'active' && !plate.isActive) return false;
      if (state.activeFilter === 'paused' && plate.isActive) return false;
      if (['google', 'instagram', 'whatsapp', 'menu'].includes(state.activeFilter)) {
        if (plate.type !== state.activeFilter) return false;
      }

      if (state.searchQuery.trim() !== '') {
        const q = state.searchQuery.toLowerCase();
        const matchesName = plate.name.toLowerCase().includes(q);
        const matchesSlug = plate.slug.toLowerCase().includes(q);
        const matchesLoc = (plate.location || '').toLowerCase().includes(q);
        const matchesOwner = (plate.ownerName || '').toLowerCase().includes(q) || (plate.ownerEmail || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSlug && !matchesLoc && !matchesOwner) return false;
      }

      return true;
    });

    platesCount.textContent = filtered.length;
    if (navPlatesCountBadge) {
      navPlatesCountBadge.textContent = state.plates.length;
    }

    if (filtered.length === 0) {
      if (state.selectedUserFilter && state.selectedUserFilter !== 'all') {
        const selectedUser = state.users.find(u => u.id === state.selectedUserFilter);
        const userName = selectedUser ? selectedUser.name : 'este cliente';
        platesGrid.innerHTML = `
          <div class="loading-state" style="padding: 40px 20px;">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">📭</div>
            <h4 style="color:#FFFFFF; font-size:1.05rem; margin-bottom:6px;">Nenhuma placa cadastrada para ${escapeHtml(userName)}</h4>
            <p style="color:var(--text-muted); font-size:0.85rem; max-width:420px; margin:0 auto 16px auto;">Este usuário ainda não possui nenhuma placa inteligente NFC ou QR Code configurada.</p>
            <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
              <button class="btn-primary" id="btnCreateForUserNow">+ Cadastrar Placa para ${escapeHtml(userName)}</button>
              <button class="btn-secondary" id="btnResetFilterToAll">Ver Todas as Placas</button>
            </div>
          </div>
        `;
        const btnCreate = document.getElementById('btnCreateForUserNow');
        if (btnCreate) btnCreate.addEventListener('click', () => {
          openNewPlateModal();
          if (formAssignUser) formAssignUser.value = state.selectedUserFilter;
        });
        const btnReset = document.getElementById('btnResetFilterToAll');
        if (btnReset) btnReset.addEventListener('click', () => setUserFilter('all'));
        return;
      }

      platesGrid.innerHTML = `
        <div class="loading-state">
          <p>Nenhuma placa inteligente cadastrada para este usuário.</p>
        </div>
      `;
      return;
    }

    const host = window.location.host;
    const protocol = window.location.protocol;
    const isAdmin = state.currentUser?.role === 'admin';

    platesGrid.innerHTML = filtered.map(plate => {
      const redirectUrl = `${protocol}//${host}/r/${plate.slug}`;
      const typeIcons = {
        google: '⭐ Google Avaliação',
        instagram: '📸 Instagram',
        whatsapp: '💬 WhatsApp',
        menu: '🍽️ Cardápio Digital',
        custom: '🔗 Link Personalizado'
      };

      const nfcCount = plate.scans?.nfc || 0;
      const qrCount = plate.scans?.qr || 0;
      const totalCount = plate.scans?.total || 0;

      // Se for Admin, mostra etiqueta do cliente/dono da placa
      const ownerBadge = isAdmin && plate.ownerName ? `
        <div class="plate-owner-tag" title="Cliente / Proprietário: ${escapeHtml(plate.ownerEmail)}">
          👤 ${escapeHtml(plate.ownerName)}
        </div>
      ` : '';

      return `
        <div class="plate-item-card ${!plate.isActive ? 'is-paused' : ''}" data-id="${plate.id}">
          <div>
            <div class="card-top">
              <div class="plate-title-group">
                <div class="plate-name">
                  ${escapeHtml(plate.name)}
                  ${plate.code ? `<span class="badge-plate-code" style="margin-left:6px; font-size:0.75rem; background:rgba(6,182,212,0.18); color:#38BDF8; border:1px solid rgba(6,182,212,0.4); padding:2px 7px; border-radius:6px; font-weight:700;">${escapeHtml(plate.code)}</span>` : ''}
                </div>
                <span class="plate-location-badge">📍 ${escapeHtml(plate.location || 'Geral')}</span>
                ${ownerBadge}
              </div>

              <div class="switch-container" title="${plate.isActive ? 'Placa Ativa' : 'Placa Pausada'}">
                <label class="toggle-switch">
                  <input type="checkbox" class="toggle-active-btn" data-id="${plate.id}" ${plate.isActive ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <!-- Dynamic URL Box -->
            <div class="dynamic-url-box">
              <div class="url-label">
                <span>Link Permanente (NFC & QR):</span>
                <span style="font-weight:600; color:${plate.isActive ? '#34D399' : '#F59E0B'}">
                  ${plate.isActive ? '● Ativo' : '⏸ Pausado'}
                </span>
              </div>
              <div class="slug-row">
                <span class="slug-text">${host}/r/${escapeHtml(plate.slug)}</span>
                <button class="btn-icon-copy" data-url="${redirectUrl}" title="Copiar link da placa">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>

              <div class="destination-row">
                <span class="destination-icon">${typeIcons[plate.type] || '🔗'}</span>
                <a href="${escapeHtml(plate.destinationUrl)}" target="_blank" class="destination-link" title="${escapeHtml(plate.destinationUrl)}">
                  ${escapeHtml(plate.destinationUrl)}
                </a>
              </div>
            </div>

            <!-- Plate Scans Mini Grid -->
            <div class="plate-stats-mini">
              <div class="stat-col">
                <span class="stat-col-label">NFC (Aprox.)</span>
                <span class="stat-col-val val-nfc">${nfcCount}</span>
              </div>
              <div class="stat-col">
                <span class="stat-col-label">QR Code</span>
                <span class="stat-col-val val-qr">${qrCount}</span>
              </div>
              <div class="stat-col">
                <span class="stat-col-label">Total Acessos</span>
                <span class="stat-col-val">${totalCount}</span>
              </div>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="card-actions-bar">
            <button class="btn-card-action btn-action-studio btn-open-studio" data-id="${plate.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Estúdio QR & NFC
            </button>
            <button class="btn-card-action btn-print-plate" data-id="${plate.id}" style="border-color: rgba(6, 182, 212, 0.45); color: #38BDF8;" title="Imprimir Arte 10x15cm no Estúdio A4">
              🖨️ Imprimir 10x15
            </button>
            <button class="btn-card-action btn-edit-plate" data-id="${plate.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Editar
            </button>
            <button class="btn-card-action btn-action-danger btn-delete-plate" data-id="${plate.id}" title="Excluir Placa">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    attachCardListeners();
  }

  function attachCardListeners() {
    // Imprimir arte 10x15 individual
    document.querySelectorAll('.btn-print-plate').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openPrintStudioModalWithPlate(id);
      });
    });
    // Copy link buttons
    document.querySelectorAll('.btn-icon-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        navigator.clipboard.writeText(url);
        showToast('Link permanente copiado com sucesso!');
      });
    });

    // Toggle switch
    document.querySelectorAll('.toggle-active-btn').forEach(checkbox => {
      checkbox.addEventListener('change', async () => {
        const id = checkbox.getAttribute('data-id');
        try {
          const res = await fetchWithAuth(`/api/plates/${id}/toggle`, { method: 'PATCH' });
          const data = await res.json();
          if (data.success) {
            showToast(data.isActive ? 'Redirecionamento ativado!' : 'Redirecionamento pausado!');
            await fetchPlates();
            await fetchAnalytics();
          } else {
            showToast(data.message || 'Erro ao alterar placa.', true);
          }
        } catch (err) {
          console.error(err);
          showToast('Erro ao alternar status da placa.', true);
        }
      });
    });

    // Open Studio Modal
    document.querySelectorAll('.btn-open-studio').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openStudioModal(id);
      });
    });

    // Edit Plate
    document.querySelectorAll('.btn-edit-plate').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditPlateModal(id);
      });
    });

    // Delete Plate
    document.querySelectorAll('.btn-delete-plate').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const plate = state.plates.find(p => p.id === id);
        if (!confirm(`Tem certeza que deseja excluir a placa "${plate?.name}"?\nIsso desativará os redirecionamentos da placa física.`)) {
          return;
        }

        try {
          const res = await fetchWithAuth(`/api/plates/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast('Placa removida com sucesso!');
            await fetchPlates();
            await fetchAnalytics();
          } else {
            showToast(data.message || 'Erro ao excluir placa.', true);
          }
        } catch (err) {
          console.error(err);
          showToast('Erro ao excluir placa.', true);
        }
      });
    });
  }

  // ==========================================
  // EVENT LISTENERS SETUP
  // ==========================================
  function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderPlates();
    });

    // Filter pills
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.activeFilter = pill.getAttribute('data-filter');
        renderPlates();
      });
    });

    // Admin User Filter Select & Clear Button
    if (selectPlateUserFilter) {
      selectPlateUserFilter.addEventListener('change', (e) => {
        setUserFilter(e.target.value);
      });
    }

    if (btnClearUserFilter) {
      btnClearUserFilter.addEventListener('click', () => {
        setUserFilter('all');
      });
    }

    // Open New Plate Modal
    btnNewPlate.addEventListener('click', () => {
      openNewPlateModal();
    });

    btnClosePlateModal.addEventListener('click', closePlateModal);
    btnCancelPlate.addEventListener('click', closePlateModal);

    // Save Plate Form
    plateForm.addEventListener('submit', handleSavePlate);

    // Auto-fill slug from name if creating new plate
    formName.addEventListener('input', () => {
      if (!formPlateId.value && !formSlug.dataset.manualEdit) {
        const slug = formName.value.trim().toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        formSlug.value = slug;
      }
    });

    formSlug.addEventListener('input', () => {
      formSlug.dataset.manualEdit = 'true';
    });

    // Studio Modal
    btnCloseStudio.addEventListener('click', closeStudioModal);

    btnCopyNfcUrl.addEventListener('click', () => {
      navigator.clipboard.writeText(nfcUrlInput.value);
      showToast('URL para gravação NFC copiada!');
    });

    btnTestNfc.addEventListener('click', () => simulateScan('nfc'));
    btnTestQr.addEventListener('click', () => simulateScan('qr'));

    // Logs Drawer
    btnOpenLogs.addEventListener('click', openLogsDrawer);
    btnCloseLogs.addEventListener('click', closeLogsDrawer);

    // Users Management Modal (Admin)
    btnOpenUsersModal.addEventListener('click', () => {
      usersModal.classList.add('is-active');
      fetchUsersList();
    });
    btnCloseUsersModal.addEventListener('click', () => {
      usersModal.classList.remove('is-active');
    });

    // Admin Create User Modal
    btnOpenCreateUserModal.addEventListener('click', () => {
      createUserModal.classList.add('is-active');
    });
    btnCloseCreateUser.addEventListener('click', () => createUserModal.classList.remove('is-active'));
    btnCancelCreateUser.addEventListener('click', () => createUserModal.classList.remove('is-active'));
    adminCreateUserForm.addEventListener('submit', handleAdminCreateUser);

    // Admin Edit User Modal
    btnCloseEditUser.addEventListener('click', () => editUserModal.classList.remove('is-active'));
    btnCancelEditUser.addEventListener('click', () => editUserModal.classList.remove('is-active'));
    adminEditUserForm.addEventListener('submit', handleAdminEditUser);

    // Admin Change Password Modal
    btnClosePasswordModal.addEventListener('click', () => passwordModal.classList.remove('is-active'));
    btnCancelPasswordModal.addEventListener('click', () => passwordModal.classList.remove('is-active'));
    adminChangePasswordForm.addEventListener('submit', handleAdminSavePassword);
  }

  // ==========================================
  // MODAL HANDLERS (CREATE / EDIT PLACA)
  // ==========================================
  function openNewPlateModal() {
    formPlateId.value = '';
    formName.value = '';
    formLocation.value = '';
    formType.value = 'google';
    formDestination.value = '';
    formSlug.value = '';
    delete formSlug.dataset.manualEdit;
    formIsActive.checked = true;

    // Se admin, permite escolher usuário dono
    if (state.currentUser?.role === 'admin') {
      groupAssignUser.style.display = 'block';
      const defaultOwner = (state.selectedUserFilter && state.selectedUserFilter !== 'all')
        ? state.selectedUserFilter
        : state.currentUser.id;
      populateAssignUsersDropdown(defaultOwner);
    } else {
      groupAssignUser.style.display = 'none';
    }

    modalPlateTitle.textContent = 'Criar Nova Placa Inteligente';
    plateModal.classList.add('is-active');
  }

  function openEditPlateModal(id) {
    const plate = state.plates.find(p => p.id === id);
    if (!plate) return;

    formPlateId.value = plate.id;
    formName.value = plate.name;
    formLocation.value = plate.location || '';
    formType.value = plate.type || 'google';
    formDestination.value = plate.destinationUrl;
    formSlug.value = plate.slug;
    formIsActive.checked = plate.isActive;

    if (state.currentUser?.role === 'admin') {
      groupAssignUser.style.display = 'block';
      populateAssignUsersDropdown(plate.userId || state.currentUser.id);
    } else {
      groupAssignUser.style.display = 'none';
    }

    modalPlateTitle.textContent = `Editar Placa: ${plate.name}`;
    plateModal.classList.add('is-active');
  }

  function populateAssignUsersDropdown(selectedUserId) {
    formAssignUser.innerHTML = state.users.map(u => `
      <option value="${u.id}" ${u.id === selectedUserId ? 'selected' : ''}>
        ${escapeHtml(u.name)} (${escapeHtml(u.email)}) - ${u.role === 'admin' ? 'Admin' : 'Cliente'}
      </option>
    `).join('') || `<option value="${state.currentUser.id}">Você mesmo (${state.currentUser.name})</option>`;
  }

  function closePlateModal() {
    plateModal.classList.remove('is-active');
  }

  async function handleSavePlate(e) {
    e.preventDefault();

    const id = formPlateId.value;
    const payload = {
      name: formName.value.trim(),
      location: formLocation.value.trim(),
      type: formType.value,
      destinationUrl: formDestination.value.trim(),
      slug: formSlug.value.trim(),
      isActive: formIsActive.checked,
      assignedUserId: state.currentUser?.role === 'admin' ? formAssignUser.value : undefined
    };

    try {
      let res;
      if (id) {
        res = await fetchWithAuth(`/api/plates/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetchWithAuth('/api/plates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (data.success) {
        showToast(id ? 'Placa atualizada com sucesso!' : 'Nova placa criada com sucesso!');
        closePlateModal();
        await fetchPlates();
        await fetchAnalytics();
        if (state.currentUser?.role === 'admin') fetchUsersList();

        // Vincula a placa recém-criada ao Estúdio de Impressão
        if (data.plate && data.plate.id) {
          state.lastCreatedPlateId = data.plate.id;
          studioState.selectedPlateId = data.plate.id;
          studioState.mode = 'existing';
        }
      } else {
        showToast(data.message || 'Erro ao salvar placa.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Falha na comunicação com o servidor.', true);
    }
  }

  // ==========================================
  // GESTÃO DE USUÁRIOS & SEPARAÇÃO DE PLACAS (ADMIN ONLY)
  // ==========================================
  function setUserFilter(userId) {
    state.selectedUserFilter = userId;

    if (selectPlateUserFilter) {
      selectPlateUserFilter.value = userId;
    }

    // Atualiza chips visuais
    document.querySelectorAll('.user-filter-chip').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-user') === userId);
    });

    // Atualiza badge de filtro ativo e botão de limpar
    if (userId !== 'all') {
      if (btnClearUserFilter) btnClearUserFilter.style.display = 'inline-flex';
      const selectedUser = state.users.find(u => u.id === userId);
      const name = selectedUser ? selectedUser.name : 'Cliente';
      if (activeUserFilterPill) {
        activeUserFilterPill.style.display = 'inline-flex';
        activeUserFilterPill.innerHTML = `👤 Cliente: <strong>${escapeHtml(name)}</strong> <button class="btn-pill-remove" title="Remover filtro de cliente">&times;</button>`;
        const removeBtn = activeUserFilterPill.querySelector('.btn-pill-remove');
        if (removeBtn) removeBtn.addEventListener('click', () => setUserFilter('all'));
      }
    } else {
      if (btnClearUserFilter) btnClearUserFilter.style.display = 'none';
      if (activeUserFilterPill) {
        activeUserFilterPill.style.display = 'none';
        activeUserFilterPill.innerHTML = '';
      }
    }

    renderPlates();
  }

  function updateUserFilterUI() {
    if (!selectPlateUserFilter || !userFilterChipsList) return;
    if (state.currentUser?.role !== 'admin') return;

    const totalPlates = state.plates.length;

    // Popula o select dropdown
    let selectHtml = `<option value="all">📂 Todos os Clientes & Usuários (${totalPlates} placas)</option>`;
    
    // Popula os chips rápidos
    let chipsHtml = `
      <button class="user-filter-chip ${state.selectedUserFilter === 'all' ? 'active' : ''}" data-user="all">
        <span>📂 Todos os Clientes</span>
        <span class="chip-count">${totalPlates}</span>
      </button>
    `;

    state.users.forEach(u => {
      const userPlates = state.plates.filter(p => p.userId === u.id);
      const count = userPlates.length;
      const isAdminUser = u.role === 'admin';
      const label = `${u.name} (${u.email})${isAdminUser ? ' ⭐' : ''}`;

      selectHtml += `
        <option value="${u.id}" ${state.selectedUserFilter === u.id ? 'selected' : ''}>
          👤 ${escapeHtml(label)} — ${count} placa(s)
        </option>
      `;

      chipsHtml += `
        <button class="user-filter-chip ${state.selectedUserFilter === u.id ? 'active' : ''}" data-user="${u.id}" title="${escapeHtml(u.email)}">
          <span>${isAdminUser ? '⭐' : '👤'} ${escapeHtml(u.name)}</span>
          <span class="chip-count">${count}</span>
        </button>
      `;
    });

    selectPlateUserFilter.innerHTML = selectHtml;
    userFilterChipsList.innerHTML = chipsHtml;

    // Conecta cliques aos chips
    userFilterChipsList.querySelectorAll('.user-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const userId = chip.getAttribute('data-user');
        setUserFilter(userId);
      });
    });
  }

  async function fetchUsersList() {
    try {
      const res = await fetchWithAuth('/api/users');
      const data = await res.json();
      if (data.success) {
        state.users = data.users;
        usersTotalCount.textContent = `Total: ${data.users.length} usuários cadastrados`;
        renderUsersTable(data.users);
        updateUserFilterUI();
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
  }

  function renderUsersTable(users) {
    const currentUserId = state.currentUser?.id;
    usersTableBody.innerHTML = users.map(u => {
      const isSelf = u.id === currentUserId || u.email === state.currentUser?.email;
      const cleanWa = (u.whatsapp || '').replace(/\D/g, '');
      const waLink = cleanWa ? `https://wa.me/${cleanWa.startsWith('55') ? cleanWa : '55' + cleanWa}` : '#';

      return `
        <tr>
          <td>
            <div class="user-cell-meta">
              <span class="user-cell-name">${escapeHtml(u.name)}</span>
              <span class="user-cell-email">${escapeHtml(u.email)}</span>
            </div>
          </td>
          <td>
            <a href="${waLink}" target="_blank" class="user-cell-whatsapp" title="Abrir conversa no WhatsApp">
              <span>💬 ${escapeHtml(u.whatsapp || 'Não informado')}</span>
            </a>
          </td>
          <td>
            <span class="${u.role === 'admin' ? 'badge-role-admin' : 'badge-role-user'}">
              ${u.role === 'admin' ? '⭐ Administrador' : 'Usuário Comum'}
            </span>
          </td>
          <td>
            <strong>${u.platesCount || 0}</strong> placa(s)
          </td>
          <td>
            <div class="user-actions-row">
              <button class="btn-user-action btn-edit-user" data-id="${u.id}" data-name="${escapeHtml(u.name)}" data-email="${escapeHtml(u.email)}" data-whatsapp="${escapeHtml(u.whatsapp || '')}" data-role="${u.role}" title="Editar Dados do Usuário">
                ✏️ Editar
              </button>
              <button class="btn-user-action btn-change-pass" data-id="${u.id}" data-name="${escapeHtml(u.name)}" title="Alterar Senha">
                🔑 Senha
              </button>
              ${!isSelf ? `
                <button class="btn-user-action btn-user-delete" data-id="${u.id}" data-name="${escapeHtml(u.name)}" title="Excluir Usuário">
                  🗑️ Excluir
                </button>
              ` : `<span style="font-size:0.75rem; color:#A1A1AA; padding-left:4px;">(Sua Conta)</span>`}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    attachUserActionsListeners();
  }

  function attachUserActionsListeners() {
    // Editar Usuário (Nome, Email, WhatsApp, Papel)
    document.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const email = btn.getAttribute('data-email');
        const whatsapp = btn.getAttribute('data-whatsapp');
        const role = btn.getAttribute('data-role');

        editUserId.value = id;
        editUserName.value = name;
        editUserEmail.value = email;
        editUserWhatsapp.value = whatsapp;
        editUserRole.value = role;

        editUserModal.classList.add('is-active');
      });
    });

    // Alterar Senha
    document.querySelectorAll('.btn-change-pass').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        changePasswordUserId.value = id;
        newPasswordInput.value = '';
        passwordModalTitle.textContent = `Alterar Senha: ${name}`;
        passwordModal.classList.add('is-active');
      });
    });

    // Excluir Usuário
    document.querySelectorAll('.btn-user-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        if (!confirm(`Tem certeza que deseja excluir o cadastro de "${name}"?\nAs plaquinhas desse usuário serão mantidas sob sua administração.`)) {
          return;
        }

        try {
          const res = await fetchWithAuth(`/api/users/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            showToast(data.message);
            await fetchUsersList();
            await fetchPlates();
          } else {
            showToast(data.message || 'Erro ao excluir usuário.', true);
          }
        } catch (err) {
          console.error(err);
          showToast('Erro ao excluir usuário.', true);
        }
      });
    });
  }

  // Criar Usuário pelo Admin
  async function handleAdminCreateUser(e) {
    e.preventDefault();
    const name = document.getElementById('adminNewName').value.trim();
    const email = document.getElementById('adminNewEmail').value.trim();
    const whatsapp = document.getElementById('adminNewWhatsapp').value.trim();
    const password = document.getElementById('adminNewPassword').value.trim();
    const role = document.getElementById('adminNewRole').value;

    try {
      const res = await fetchWithAuth('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, whatsapp, password, role })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Novo usuário cadastrado com sucesso!');
        adminCreateUserForm.reset();
        createUserModal.classList.remove('is-active');
        await fetchUsersList();
      } else {
        showToast(data.message || 'Erro ao cadastrar usuário.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao cadastrar usuário.', true);
    }
  }

  // Editar Usuário pelo Admin
  async function handleAdminEditUser(e) {
    e.preventDefault();
    const id = editUserId.value;
    const payload = {
      name: editUserName.value.trim(),
      email: editUserEmail.value.trim(),
      whatsapp: editUserWhatsapp.value.trim(),
      role: editUserRole.value
    };

    try {
      const res = await fetchWithAuth(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || 'Usuário atualizado com sucesso!');
        editUserModal.classList.remove('is-active');
        await fetchUsersList();
        await fetchPlates();
        if (id === state.currentUser?.id) {
          await checkCurrentSession();
          updateUserProfileHeader();
        }
      } else {
        showToast(data.message || 'Erro ao atualizar usuário.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar usuário.', true);
    }
  }

  // Salvar Nova Senha pelo Admin
  async function handleAdminSavePassword(e) {
    e.preventDefault();
    const id = changePasswordUserId.value;
    const newPassword = newPasswordInput.value.trim();

    try {
      const res = await fetchWithAuth(`/api/users/${id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message || 'Senha alterada com sucesso!');
        passwordModal.classList.remove('is-active');
      } else {
        showToast(data.message || 'Erro ao alterar senha.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar senha.', true);
    }
  }

  // ==========================================
  // STUDIO MODAL (NFC & QR MOCKUP)
  // ==========================================
  async function openStudioModal(id) {
    const plate = state.plates.find(p => String(p.id) === String(id));
    if (!plate) {
      console.warn('Placa não encontrada para estúdio:', id);
      return;
    }

    state.selectedPlateForStudio = plate;

    const host = window.location.host;
    const protocol = window.location.protocol;
    const redirectUrl = `${protocol}//${host}/r/${plate.slug}?src=qr`;
    const nfcUrl = `${protocol}//${host}/r/${plate.slug}?src=nfc`;
    const qrEndpoint = `/api/qrcode/${plate.slug}?src=qr&format=svg`;

    studioSubtitle.textContent = `Plaquinha: ${plate.name} (${plate.location || 'Balcão'})`;
    mockupBrand.textContent = plate.name;
    mockupLocation.textContent = plate.location || 'Balcão Principal';
    
    const logos = {
      google: '⭐',
      instagram: '📸',
      whatsapp: '💬',
      menu: '🍽️',
      custom: '🔗'
    };
    mockupCenterLogo.textContent = logos[plate.type] || '⭐';

    // Gera o QR Code com prioridade para DataURL instantâneo (alta fidelidade e sem lag de rede)
    if (window.QRCode && window.QRCode.toDataURL) {
      try {
        const qrDataUrl = await window.QRCode.toDataURL(redirectUrl, {
          margin: 1,
          width: 600,
          errorCorrectionLevel: 'H'
        });
        mockupQrImage.src = qrDataUrl;
        btnDownloadPng.href = qrDataUrl;
        btnDownloadPng.download = `qrcode-${plate.slug}.png`;
      } catch (err) {
        console.warn('Geração local do QR Code falhou, usando endpoint:', err);
        mockupQrImage.src = qrEndpoint;
        btnDownloadPng.href = `/api/qrcode/${plate.slug}?src=qr&format=png`;
        btnDownloadPng.download = `qrcode-${plate.slug}.png`;
      }
    } else {
      mockupQrImage.src = qrEndpoint;
      btnDownloadPng.href = `/api/qrcode/${plate.slug}?src=qr&format=png`;
      btnDownloadPng.download = `qrcode-${plate.slug}.png`;
    }

    // Fallback de erro da imagem para o endpoint SVG ou regerar
    mockupQrImage.onerror = () => {
      if (!mockupQrImage.src.includes('format=svg')) {
        mockupQrImage.src = qrEndpoint;
      }
    };

    nfcUrlInput.value = nfcUrl;

    btnDownloadSvg.href = `/api/qrcode/${plate.slug}?src=qr&format=svg`;
    btnDownloadSvg.download = `qrcode-${plate.slug}.svg`;

    studioModal.classList.add('is-active');
  }

  function closeStudioModal() {
    studioModal.classList.remove('is-active');
    state.selectedPlateForStudio = null;
  }

  async function simulateScan(source) {
    const plate = state.selectedPlateForStudio;
    if (!plate) return;

    try {
      const res = await fetch(`/api/test-scan/${plate.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: source,
          device: navigator.userAgent.includes('iPhone') ? 'iPhone (iOS)' : 'Android'
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Simulação de ${source.toUpperCase()} registrada! Abrindo destino...`);
        window.open(data.targetUrl, '_blank');
        await fetchPlates();
        await fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao simular leitura.', true);
    }
  }

  // ==========================================
  // REAL-TIME LOGS DRAWER
  // ==========================================
  async function openLogsDrawer() {
    logsDrawer.classList.add('is-active');
    await refreshLogs();
  }

  function closeLogsDrawer() {
    logsDrawer.classList.remove('is-active');
  }

  async function refreshLogs() {
    try {
      const res = await fetchWithAuth('/api/analytics');
      const data = await res.json();
      if (!data.success) return;

      const devices = data.deviceBreakdown || {};
      deviceSummary.innerHTML = Object.entries(devices).map(([dev, count]) => `
        <div class="device-pill">
          ${escapeHtml(dev)}: <strong>${count}</strong>
        </div>
      `).join('') || '<div class="device-pill">Nenhum dispositivo registrado</div>';

      const logs = data.recentLogs || [];
      if (logs.length === 0) {
        logsList.innerHTML = '<p style="color:#64748B; font-size:0.85rem;">Nenhum acesso registrado ainda.</p>';
        return;
      }

      logsList.innerHTML = logs.map(log => {
        const timeFormatted = new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateFormatted = new Date(log.timestamp).toLocaleDateString('pt-BR');
        const srcClass = log.source === 'nfc' ? 'src-nfc' : (log.source === 'qr' ? 'src-qr' : 'src-direto');

        return `
          <div class="log-item">
            <div class="log-top-row">
              <span class="log-store-name">${escapeHtml(log.plateName || log.slug)}</span>
              <span class="log-time">${dateFormatted} ${timeFormatted}</span>
            </div>
            <div class="log-details-row">
              <span class="badge-log-src ${srcClass}">${log.source.toUpperCase()}</span>
              <span class="log-device">📱 ${escapeHtml(log.device)}</span>
            </div>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.error(err);
    }
  }

  // ==========================================
  // ESTÚDIO GRÁFICO & IMPRESSÃO A4 (10x15 CM)
  // ==========================================
  let studioState = {
    mode: 'existing', // 'existing' por padrão para imprimir a placa cadastrada
    theme: 'white', // 'white' ou 'black'
    layout: 2, // 1, 2 ou 4
    showCropMarks: true,
    nextCode: 'PI-121',
    zoom: 0.6,
    selectedPlateId: null,
    slotPlateIds: [], // Array de IDs de placas para cada posição na folha A4
    slotThemes: [] // Array de temas para cada posição ('white' ou 'black')
  };

  function setupStudioEventListeners() {
    if (btnOpenPrintStudio) {
      btnOpenPrintStudio.addEventListener('click', () => openPrintStudioModal());
    }
    if (btnClosePrintStudio) {
      btnClosePrintStudio.addEventListener('click', closePrintStudioModal);
    }
    if (btnStudioOpenPrintModal) {
      btnStudioOpenPrintModal.addEventListener('click', () => {
        const plate = state.selectedPlateForStudio;
        if (plate) {
          closeStudioModal();
          openPrintStudioModalWithPlate(plate.id);
        }
      });
    }

    // Botão de replicar a 1ª placa e cor em todos os slots
    const btnRepeatFirstPlate = document.getElementById('btnRepeatFirstPlate');
    if (btnRepeatFirstPlate) {
      btnRepeatFirstPlate.addEventListener('click', () => {
        const firstId = studioState.slotPlateIds[0] || studioState.selectedPlateId || (state.plates[0] && state.plates[0].id);
        const firstTheme = (studioState.slotThemes && studioState.slotThemes[0]) || studioState.theme || 'white';
        if (!firstId) return;
        for (let i = 0; i < studioState.layout; i++) {
          studioState.slotPlateIds[i] = firstId;
          studioState.slotThemes[i] = firstTheme;
        }
        renderSlotSelectors();
        renderStudioSheet();
        showToast('Primeira placa e cor replicadas em todos os slots!');
      });
    }

    // Alternância de modo (Novo Lote vs Placas Existentes)
    if (tabModeBatch && tabModeExisting) {
      tabModeBatch.addEventListener('click', () => {
        studioState.mode = 'batch';
        tabModeBatch.classList.add('active');
        tabModeExisting.classList.remove('active');
        sectionBatchConfig.style.display = 'block';
        sectionExistingConfig.style.display = 'none';
        renderStudioSheet();
      });

      tabModeExisting.addEventListener('click', () => {
        studioState.mode = 'existing';
        tabModeExisting.classList.add('active');
        tabModeBatch.classList.remove('active');
        sectionBatchConfig.style.display = 'none';
        sectionExistingConfig.style.display = 'block';
        renderSlotSelectors();
        renderStudioSheet();
      });
    }

    // Seleção de Tema Global (Branco vs Preto)
    if (btnThemeWhite && btnThemeBlack) {
      btnThemeWhite.addEventListener('click', () => {
        studioState.theme = 'white';
        btnThemeWhite.classList.add('active');
        btnThemeBlack.classList.remove('active');
        for (let i = 0; i < studioState.layout; i++) {
          studioState.slotThemes[i] = 'white';
        }
        renderSlotSelectors();
        renderStudioSheet();
      });

      btnThemeBlack.addEventListener('click', () => {
        studioState.theme = 'black';
        btnThemeBlack.classList.add('active');
        btnThemeWhite.classList.remove('active');
        for (let i = 0; i < studioState.layout; i++) {
          studioState.slotThemes[i] = 'black';
        }
        renderSlotSelectors();
        renderStudioSheet();
      });
    }

    // Seleção de Layout (1, 2 ou 4 placas por folha)
    const layoutBtns = [
      { el: btnLayout1, val: 1 },
      { el: btnLayout2, val: 2 },
      { el: btnLayout4, val: 4 }
    ];

    layoutBtns.forEach(({ el, val }) => {
      if (el) {
        el.addEventListener('click', () => {
          layoutBtns.forEach(b => b.el && b.el.classList.remove('active'));
          el.classList.add('active');
          studioState.layout = val;
          renderSlotSelectors();
          renderStudioSheet();
        });
      }
    });

    // Toggle de marcas de corte
    if (checkCropMarks) {
      checkCropMarks.addEventListener('change', () => {
        studioState.showCropMarks = checkCropMarks.checked;
        renderStudioSheet();
      });
    }

    // Select de placa existente
    if (studioSelectExistingPlates) {
      studioSelectExistingPlates.addEventListener('change', (e) => {
        studioState.selectedPlateId = e.target.value;
        renderStudioSheet();
      });
    }

    // Zoom da mesa gráfica
    document.querySelectorAll('.btn-zoom').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-zoom').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const zoom = parseFloat(btn.getAttribute('data-zoom') || '0.6');
        studioState.zoom = zoom;
        if (a4PrintSheet) {
          a4PrintSheet.style.transform = `scale(${zoom})`;
        }
      });
    });

    // Baixar PDF para Gráfica
    if (btnDownloadA4Pdf) {
      btnDownloadA4Pdf.addEventListener('click', handleDownloadA4Pdf);
    }

    // Impressão Direta
    if (btnPrintA4Direct) {
      btnPrintA4Direct.addEventListener('click', () => {
        window.print();
      });
    }
  }

  async function fetchNextPlateCode() {
    try {
      const res = await fetchWithAuth('/api/plates/next-code');
      const data = await res.json();
      if (data.success && data.nextCode) {
        studioState.nextCode = data.nextCode;
        if (studioNextCodeDisplay) {
          studioNextCodeDisplay.textContent = data.nextCode;
        }
      }
    } catch (err) {
      console.error('Erro ao buscar próximo código:', err);
    }
  }

  function getSlotLabels(count) {
    if (count === 1) {
      return ['Posição Central'];
    }
    if (count === 2) {
      return ['Placa 1 (Esquerda / Superior)', 'Placa 2 (Direita / Inferior)'];
    }
    return [
      'Placa 1 (Topo Esquerdo)',
      'Placa 2 (Topo Direito)',
      'Placa 3 (Base Esquerda)',
      'Placa 4 (Base Direita)'
    ];
  }

  function renderSlotSelectors() {
    const container = document.getElementById('studioSlotsContainer');
    if (!container) return;

    const count = studioState.layout;
    const labels = getSlotLabels(count);

    if (!Array.isArray(studioState.slotPlateIds)) {
      studioState.slotPlateIds = [];
    }
    if (!Array.isArray(studioState.slotThemes)) {
      studioState.slotThemes = [];
    }

    if (!studioState.slotPlateIds[0] && state.plates.length > 0) {
      studioState.slotPlateIds[0] = studioState.selectedPlateId || state.plates[0].id;
    }

    // Preenche slots subsequentes com placas diferentes se houver e temas padrão
    for (let i = 0; i < count; i++) {
      if (!studioState.slotPlateIds[i]) {
        const candidate = state.plates[i] || state.plates[0];
        studioState.slotPlateIds[i] = candidate ? candidate.id : '';
      }
      if (!studioState.slotThemes[i]) {
        studioState.slotThemes[i] = studioState.theme || 'white';
      }
    }

    studioState.slotPlateIds = studioState.slotPlateIds.slice(0, count);
    studioState.slotThemes = studioState.slotThemes.slice(0, count);

    container.innerHTML = labels.map((label, index) => {
      const currentSelectedId = studioState.slotPlateIds[index] || '';
      const currentTheme = studioState.slotThemes[index] || studioState.theme || 'white';

      const optionsHtml = state.plates.map(p => {
        const isSelected = String(p.id) === String(currentSelectedId);
        return `<option value="${p.id}" ${isSelected ? 'selected' : ''}>
          ${p.code ? '[' + p.code + '] ' : ''}${escapeHtml(p.name)} (${escapeHtml(p.slug)})
        </option>`;
      }).join('') || '<option value="">Nenhuma placa cadastrada</option>';

      return `
        <div class="studio-slot-item">
          <div class="studio-slot-header">
            <span class="studio-slot-label">
              <span class="studio-slot-badge">Slot ${index + 1}</span>
              ${label}
            </span>
          </div>

          <select class="studio-select slot-plate-select" data-slot="${index}">
            ${optionsHtml}
          </select>

          <!-- Seletor de Cor do Slot (Branco vs Preto) -->
          <div class="studio-slot-color-bar">
            <span class="studio-slot-color-caption">Cor:</span>
            <div class="slot-color-options">
              <button type="button" class="slot-color-btn ${currentTheme === 'white' ? 'active' : ''}" data-slot="${index}" data-theme="white" title="Clean Branco">
                <span class="slot-color-dot dot-white"></span> Branco
              </button>
              <button type="button" class="slot-color-btn ${currentTheme === 'black' ? 'active' : ''}" data-slot="${index}" data-theme="black" title="Black Premium">
                <span class="slot-color-dot dot-black"></span> Preto
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Listener para mudanças em cada slot individual (Placa)
    container.querySelectorAll('.slot-plate-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const slotIdx = parseInt(e.target.getAttribute('data-slot'), 10);
        studioState.slotPlateIds[slotIdx] = e.target.value;
        if (slotIdx === 0) {
          studioState.selectedPlateId = e.target.value;
        }
        renderStudioSheet();
      });
    });

    // Listener para mudanças de cor por slot
    container.querySelectorAll('.slot-color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.currentTarget;
        const slotIdx = parseInt(targetBtn.getAttribute('data-slot'), 10);
        const theme = targetBtn.getAttribute('data-theme');

        studioState.slotThemes[slotIdx] = theme;

        // Atualiza botões visuais do mesmo slot
        const parent = targetBtn.closest('.slot-color-options');
        if (parent) {
          parent.querySelectorAll('.slot-color-btn').forEach(b => b.classList.remove('active'));
          targetBtn.classList.add('active');
        }

        renderStudioSheet();
      });
    });

    const btnRepeat = document.getElementById('btnRepeatFirstPlate');
    if (btnRepeat) {
      btnRepeat.style.display = count > 1 ? 'inline-flex' : 'none';
    }
  }

  async function openPrintStudioModal(targetPlateId) {
    await fetchNextPlateCode();

    if (targetPlateId) {
      studioState.selectedPlateId = targetPlateId;
      studioState.slotPlateIds = [targetPlateId];
      studioState.slotThemes = [studioState.theme || 'white'];
      // Preenche os outros slots com as demais placas existentes
      const others = state.plates.filter(p => String(p.id) !== String(targetPlateId));
      for (let i = 1; i < studioState.layout; i++) {
        studioState.slotPlateIds[i] = others[i - 1]?.id || targetPlateId;
        studioState.slotThemes[i] = studioState.theme || 'white';
      }
      studioState.mode = 'existing';
    } else {
      if (!studioState.selectedPlateId && state.plates.length > 0) {
        studioState.selectedPlateId = state.lastCreatedPlateId || state.plates[0].id;
      }
      if (!Array.isArray(studioState.slotPlateIds) || studioState.slotPlateIds.length === 0) {
        studioState.slotPlateIds = [];
        studioState.slotThemes = [];
        for (let i = 0; i < studioState.layout; i++) {
          studioState.slotPlateIds[i] = state.plates[i]?.id || state.plates[0]?.id;
          studioState.slotThemes[i] = studioState.theme || 'white';
        }
      }
    }

    // Atualiza estado visual das abas de acordo com o modo
    if (studioState.mode === 'existing') {
      if (tabModeExisting) tabModeExisting.classList.add('active');
      if (tabModeBatch) tabModeBatch.classList.remove('active');
      if (sectionBatchConfig) sectionBatchConfig.style.display = 'none';
      if (sectionExistingConfig) sectionExistingConfig.style.display = 'block';
    } else {
      if (tabModeBatch) tabModeBatch.classList.add('active');
      if (tabModeExisting) tabModeExisting.classList.remove('active');
      if (sectionBatchConfig) sectionBatchConfig.style.display = 'block';
      if (sectionExistingConfig) sectionExistingConfig.style.display = 'none';
    }

    // Popula dropdown de clientes no estúdio
    if (studioAssignUser) {
      studioAssignUser.innerHTML = state.users.map(u => `
        <option value="${u.id}" ${u.id === state.currentUser?.id ? 'selected' : ''}>
          ${escapeHtml(u.name)} (${escapeHtml(u.email)})
        </option>
      `).join('') || `<option value="${state.currentUser?.id}">Você mesmo (${state.currentUser?.name})</option>`;
    }

    // Renderiza seletores individuais para cada slot da folha A4
    renderSlotSelectors();

    // Aplica zoom inicial
    if (a4PrintSheet) {
      a4PrintSheet.style.transform = `scale(${studioState.zoom})`;
    }

    renderStudioSheet();
    printStudioModal.classList.add('is-active');
  }

  async function openPrintStudioModalWithPlate(plateId) {
    studioState.mode = 'existing';
    studioState.selectedPlateId = plateId;
    await openPrintStudioModal(plateId);
  }

  function closePrintStudioModal() {
    printStudioModal.classList.remove('is-active');
  }

  // Gera o HTML da Arte Vetorial 10x15 cm de alta resolução
  function renderPlateCardHtml(plateOrData, theme, showCropMarks) {
    let plateCode = 'PI-121';
    let plateSlug = 'placa';
    let plateName = '';
    let plateType = 'google';

    if (typeof plateOrData === 'object' && plateOrData !== null) {
      plateCode = plateOrData.code || 'PI-121';
      plateSlug = plateOrData.slug || 'placa';
      plateName = plateOrData.name || '';
      plateType = plateOrData.type || 'google';
    } else {
      plateCode = arguments[0] || 'PI-121';
      plateSlug = arguments[1] || 'placa';
      theme = arguments[2] || theme;
      showCropMarks = arguments[3] !== undefined ? arguments[3] : showCropMarks;
    }

    const currentTheme = theme || 'white';
    const isDark = currentTheme !== 'white';
    const themeClass = `theme-${currentTheme}`;
    const host = window.location.host;
    const protocol = window.location.protocol;
    const redirectUrl = `${protocol}//${host}/r/${plateSlug}?src=qr`;

    const cropMarksHtml = showCropMarks ? `
      <div class="crop-marks-container">
        <div class="crop-corner crop-tl"></div>
        <div class="crop-corner crop-tr"></div>
        <div class="crop-corner crop-bl"></div>
        <div class="crop-corner crop-br"></div>
      </div>
    ` : '';

    const qrBgParam = isDark ? '18181b' : 'ffffff';
    const qrColorParam = isDark ? 'ffffff' : '000000';

    const qrEndpoint = `/api/qrcode/${plateSlug}?src=qr&format=svg&bg=${qrBgParam}&color=${qrColorParam}&margin=1`;

    const isInstagram = plateType === 'instagram';
    const isWhatsapp = plateType === 'whatsapp';

    let headerVisualHtml = '';
    let qrCenterBadgeHtml = '';

    if (isInstagram) {
      headerVisualHtml = `
        <svg class="plate-instagram-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 13mm; height: 13mm; color: #E1306C; margin-bottom: 1mm;">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
        <h4 class="plate-title-rate" style="color: #E1306C;">SIGA-NOS NO</h4>
        <div class="plate-google-word" style="background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Instagram</div>
        <div class="plate-divider-line" style="background: linear-gradient(45deg, #f09433, #dc2743, #bc1888);"></div>
        <p class="plate-opinion-sub">${escapeHtml(plateName || 'ACOMPANHE NOSSAS NOVIDADES')}</p>
      `;
      qrCenterBadgeHtml = `
        <div class="qr-center-google-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="#E1306C" stroke-width="2.2" style="width:75%; height:75%;">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </div>
      `;
    } else if (isWhatsapp) {
      headerVisualHtml = `
        <svg class="plate-whatsapp-logo" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2" style="width: 13mm; height: 13mm; margin-bottom: 1mm;">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        <h4 class="plate-title-rate" style="color: #25D366;">FALE CONOSCO NO</h4>
        <div class="plate-google-word" style="color: #25D366;">WhatsApp</div>
        <div class="plate-divider-line" style="background: #25D366;"></div>
        <p class="plate-opinion-sub">${escapeHtml(plateName || 'ATENDIMENTO RÁPIDO')}</p>
      `;
      qrCenterBadgeHtml = `
        <div class="qr-center-google-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2.2" style="width:75%; height:75%;">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </div>
      `;
    } else {
      // Google Review Padrão
      headerVisualHtml = `
        <!-- Logo 3D Oficial Google G -->
        <svg class="plate-google-g-logo" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>

        <!-- 5 Estrelas Douradas -->
        <div class="plate-stars-row">
          <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </div>

        <!-- Chamada Oficial -->
        <h4 class="plate-title-rate">NOS AVALIE NO</h4>
        <div class="plate-google-word">
          <span class="g-blue">G</span><span class="g-red">o</span><span class="g-yellow">o</span><span class="g-blue">g</span><span class="g-green">l</span><span class="g-red">e</span>
        </div>
        <div class="plate-divider-line"></div>
        <p class="plate-opinion-sub">${escapeHtml(plateName ? `${plateName} • SUA OPINIÃO FAZ A DIFERENÇA!` : 'SUA OPINIÃO FAZ A DIFERENÇA!')}</p>
      `;
      qrCenterBadgeHtml = `
        <div class="qr-center-google-badge">
          <svg viewBox="0 0 48 48" style="width:100%; height:100%;">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
        </div>
      `;
    }

    return `
      <div class="print-plate-wrapper">
        ${cropMarksHtml}
        <div class="print-plate-card ${themeClass}">
          <!-- Faixa Colorida Superior -->
          <div class="plate-rainbow-bar"></div>

          <!-- Corpo da Arte -->
          <div class="plate-content-body">
            <!-- Cabeçalho Dinâmico -->
            <div class="plate-header-section">
              ${headerVisualHtml}
            </div>

            <!-- Caixas Centrais Lado a Lado (QR Code + NFC) -->
            <div class="plate-cards-duo">
              <!-- Caixa QR Code -->
              <div class="plate-card-column">
                <div class="plate-frame-gradient">
                  <div class="plate-frame-inner">
                    <img src="${qrEndpoint}" data-slug="${plateSlug}" class="qr-code-rendered-img" alt="QR Code">
                    ${qrCenterBadgeHtml}
                  </div>
                </div>
                <div class="plate-pill-instruction">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  <span>Aponte sua câmera</span>
                </div>
              </div>

              <!-- Caixa NFC Celular -->
              <div class="plate-card-column">
                <div class="plate-frame-gradient">
                  <div class="plate-frame-inner">
                    <svg class="nfc-phone-illustration" viewBox="0 0 64 64" fill="none">
                      <rect x="18" y="8" width="28" height="48" rx="6" stroke="currentColor" stroke-width="2.6" fill="none"/>
                      <line x1="28" y1="13" x2="36" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      <line x1="28" y1="51" x2="36" y2="51" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      <text x="32" y="35" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="10" fill="currentColor">NFC</text>
                      <path d="M12 24 A 14 14 0 0 0 12 40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                      <path d="M7 19 A 20 20 0 0 0 7 45" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                      <path d="M52 24 A 14 14 0 0 1 52 40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                      <path d="M57 19 A 20 20 0 0 1 57 45" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                    </svg>
                  </div>
                </div>
                <div class="plate-pill-instruction">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><circle cx="12" cy="20" r="1"></circle></svg>
                  <span>Aproxime seu celular</span>
                </div>
              </div>
            </div>

            <!-- Rodapé da Placa: Código Sequencial e Assinatura -->
            <div class="plate-footer-section">
              <span class="plate-code-corner">${escapeHtml(plateCode)}</span>

              <div class="plate-thanks-center">
                <span class="plate-thanks-text">Obrigado!</span>
                <svg class="plate-thanks-brush" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="brushGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#4285F4"/>
                      <stop offset="30%" stop-color="#EA4335"/>
                      <stop offset="70%" stop-color="#FBBC05"/>
                      <stop offset="100%" stop-color="#34A853"/>
                    </linearGradient>
                  </defs>
                  <path d="M 0,5 Q 25,0 50,5 T 100,5" stroke="url(#brushGrad)" stroke-width="4.5" stroke-linecap="round" fill="none"/>
                </svg>
              </div>

              <span style="width: 14mm;"></span>
            </div>
          </div>

          <!-- Faixa Colorida Inferior -->
          <div class="plate-rainbow-bar"></div>
        </div>
      </div>
    `;
  }

  function renderStudioSheet() {
    if (!a4SheetInner) return;

    const count = studioState.layout;
    a4SheetInner.className = `a4-sheet-inner layout-${count}`;

    let cardsHtml = '';

    if (studioState.mode === 'batch') {
      const baseNumStr = studioState.nextCode.replace('PI-', '');
      let baseNum = parseInt(baseNumStr, 10);
      if (isNaN(baseNum)) baseNum = 121;

      if (canvasPlatesSummary) {
        canvasPlatesSummary.textContent = `Novo Lote (${studioState.nextCode}...) • ${count} Placa(s) na Folha (10x15cm)`;
      }

      for (let i = 0; i < count; i++) {
        const currentCode = `PI-${baseNum + i}`;
        const currentSlug = `pi-${baseNum + i}`;
        const slotTheme = (studioState.slotThemes && studioState.slotThemes[i]) || studioState.theme || 'white';
        cardsHtml += renderPlateCardHtml({
          code: currentCode,
          slug: currentSlug,
          name: `Placa Inteligente ${currentCode}`,
          type: 'google'
        }, slotTheme, studioState.showCropMarks);
      }
    } else {
      // Modo de placas existentes (padrão)
      if (!Array.isArray(studioState.slotPlateIds)) {
        studioState.slotPlateIds = [];
      }

      const distinctNames = [];
      const distinctPlates = [];

      for (let i = 0; i < count; i++) {
        const targetId = studioState.slotPlateIds[i] || studioState.selectedPlateId;
        const plate = state.plates.find(p => String(p.id) === String(targetId)) || state.plates[i % (state.plates.length || 1)];
        const slotTheme = (studioState.slotThemes && studioState.slotThemes[i]) || studioState.theme || 'white';
        if (plate) {
          distinctPlates.push(plate);
          if (!distinctNames.includes(plate.name)) {
            distinctNames.push(plate.name);
          }
          cardsHtml += renderPlateCardHtml(plate, slotTheme, studioState.showCropMarks);
        }
      }

      if (canvasPlatesSummary) {
        if (distinctNames.length === 1) {
          canvasPlatesSummary.textContent = `${distinctNames[0]} • ${count} cópia(s) na Folha (10x15cm)`;
        } else if (distinctNames.length > 1) {
          canvasPlatesSummary.textContent = `${distinctNames.join(' + ')} • ${count} Placas na Folha (10x15cm)`;
        } else {
          canvasPlatesSummary.textContent = `${count} Placa(s) na Folha (10x15cm)`;
        }
      }

      if (distinctPlates.length === 0) {
        cardsHtml = `<div style="padding: 40px; text-align: center; color: #94a3b8; font-size: 1rem; width: 100%;">
          Nenhuma placa cadastrada encontrada. Cadastre uma placa primeiro ou alterne para o modo "Gerar Novo Lote".
        </div>`;
      }
    }

    a4SheetInner.innerHTML = cardsHtml;

    // Se QRCode client-side estiver disponível, gera Data URLs locais em altíssima definição (instantâneo e sem CORS para html2pdf)
    if (window.QRCode && window.QRCode.toDataURL) {
      const qrImgs = a4SheetInner.querySelectorAll('.qr-code-rendered-img');
      qrImgs.forEach(async (img) => {
        const slug = img.getAttribute('data-slug');
        if (!slug) return;
        const redirectUrl = `${window.location.protocol}//${window.location.host}/r/${slug}?src=qr`;
        const card = img.closest('.print-plate-card');

        const isCardBlack = card ? card.classList.contains('theme-black') : (studioState.theme === 'black');
        const qrBg = isCardBlack ? '#18181b' : '#ffffff';
        const qrColor = isCardBlack ? '#ffffff' : '#000000';

        try {
          const dUrl = await window.QRCode.toDataURL(redirectUrl, {
            margin: 1,
            width: 600,
            errorCorrectionLevel: 'H',
            color: {
              dark: qrColor,
              light: qrBg
            }
          });
          img.src = dUrl;
        } catch (e) {
          // Mantém o src SVG original caso ocorra exceção
        }
      });
    }
  }

  async function handleDownloadA4Pdf() {
    if (!a4PrintSheet) return;

    try {
      showToast('Processando e gerando PDF para gráfica em 300 DPI...');

      // Se estiver no modo lote, persiste no banco para ativar os links e os chips NFC
      if (studioState.mode === 'batch') {
        const destinationUrl = studioBatchDestination?.value?.trim() || 'https://google.com';
        const assignedUserId = studioAssignUser?.value;

        const res = await fetchWithAuth('/api/plates/batch-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            count: studioState.layout,
            destinationUrl,
            assignedUserId,
            type: 'google'
          })
        });

        const data = await res.json();
        if (data.success) {
          await fetchPlates();
          await fetchNextPlateCode();
        }
      }

      let fileSuffix = studioState.theme;
      if (studioState.mode === 'existing') {
        const distinctSlugs = [];
        for (let i = 0; i < studioState.layout; i++) {
          const targetId = studioState.slotPlateIds[i] || studioState.selectedPlateId;
          const p = state.plates.find(pl => String(pl.id) === String(targetId));
          const t = (studioState.slotThemes && studioState.slotThemes[i]) || studioState.theme;
          if (p) {
            const desc = `${p.slug}-${t}`;
            if (!distinctSlugs.includes(desc)) {
              distinctSlugs.push(desc);
            }
          }
        }
        fileSuffix = distinctSlugs.length > 0 ? distinctSlugs.join('_') : studioState.theme;
      }

      // Prepara opções do html2pdf para escala exata A4 sem distorção
      const opt = {
        margin: 0,
        filename: `folha-grafica-a4-${fileSuffix}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 3, // 300 DPI real
          useCORS: true,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      // Reseta zoom temporariamente para renderizar em 100% no canvas do PDF
      const currentTransform = a4PrintSheet.style.transform;
      a4PrintSheet.style.transform = 'scale(1)';

      await html2pdf().set(opt).from(a4PrintSheet).save();

      // Restaura zoom da interface
      a4PrintSheet.style.transform = currentTransform;

      showToast('PDF para gráfica baixado com sucesso!');
      renderStudioSheet();
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      showToast('Erro ao exportar PDF. Tente usar a opção de impressão direta.', true);
    }
  }

  // Inicializa listeners do estúdio
  setupStudioEventListeners();

  // ==========================================
  // TOAST NOTIFICATION
  // ==========================================
  let toastTimer = null;
  function showToast(msg, isError = false) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = msg;
    toastNotification.style.background = isError ? '#EF4444' : '#10B981';
    toastNotification.classList.add('is-active');

    toastTimer = setTimeout(() => {
      toastNotification.classList.remove('is-active');
    }, 3500);
  }

  // ==========================================
  // NAVEGAÇÃO ENTRE ABAS (PAINEL GERAL vs GERENCIADOR)
  // ==========================================
  function switchView(viewName) {
    if (viewName === 'dashboard') {
      if (navTabDashboard) navTabDashboard.classList.add('active');
      if (navTabPlates) navTabPlates.classList.remove('active');
      if (viewDashboard) viewDashboard.style.display = 'block';
      if (viewPlatesManager) viewPlatesManager.style.display = 'none';

      // Ajusta renderização dos gráficos
      setTimeout(() => {
        if (salesGrowthChartInstance) salesGrowthChartInstance.resize();
        if (channelsDoughnutChartInstance) channelsDoughnutChartInstance.resize();
      }, 50);
    } else {
      if (navTabPlates) navTabPlates.classList.add('active');
      if (navTabDashboard) navTabDashboard.classList.remove('active');
      if (viewDashboard) viewDashboard.style.display = 'none';
      if (viewPlatesManager) viewPlatesManager.style.display = 'block';
    }
  }

  if (navTabDashboard) {
    navTabDashboard.addEventListener('click', () => switchView('dashboard'));
  }
  if (navTabPlates) {
    navTabPlates.addEventListener('click', () => switchView('plates'));
  }
  if (btnGoToPlatesManager) {
    btnGoToPlatesManager.addEventListener('click', () => switchView('plates'));
  }
  if (btnQuickNewPlate) {
    btnQuickNewPlate.addEventListener('click', () => openNewPlateModal());
  }

  // ==========================================
  // GRÁFICOS ANALÍTICOS (CHART.JS)
  // ==========================================
  let salesGrowthChartInstance = null;
  let channelsDoughnutChartInstance = null;

  function renderDashboardCharts() {
    if (typeof Chart === 'undefined') return;

    renderSalesGrowthChart();
    renderChannelsDoughnutChart();
  }

  function renderSalesGrowthChart() {
    const canvas = document.getElementById('salesGrowthChart');
    if (!canvas) return;

    const chartTotalPlatesMetric = document.getElementById('chartTotalPlatesMetric');
    const chartActivePlatesMetric = document.getElementById('chartActivePlatesMetric');
    const chartTotalScansMetric = document.getElementById('chartTotalScansMetric');

    const totalPlates = state.plates.length;
    const activePlates = state.plates.filter(p => p.isActive).length;
    let totalScans = 0;
    state.plates.forEach(p => { totalScans += (p.scans?.total || 0); });

    if (chartTotalPlatesMetric) chartTotalPlatesMetric.textContent = totalPlates;
    if (chartActivePlatesMetric) chartActivePlatesMetric.textContent = activePlates;
    if (chartTotalScansMetric) chartTotalScansMetric.textContent = totalScans.toLocaleString('pt-BR');

    // Monta série dos últimos 6 meses
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const months = [];
    const monthlySalesCount = [];
    const cumulativeCounts = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const label = `${monthNames[monthIdx]}/${String(year).slice(2)}`;
      months.push({ label, year, month: monthIdx, count: 0 });
    }

    state.plates.forEach(p => {
      if (!p.createdAt) return;
      const d = new Date(p.createdAt);
      const pYear = d.getFullYear();
      const pMonth = d.getMonth();
      const target = months.find(m => m.year === pYear && m.month === pMonth);
      if (target) {
        target.count++;
      } else {
        if (months[0]) months[0].count++;
      }
    });

    let runningTotal = 0;
    months.forEach(m => {
      monthlySalesCount.push(m.count);
      runningTotal += m.count;
      cumulativeCounts.push(runningTotal);
    });

    if (cumulativeCounts[cumulativeCounts.length - 1] < totalPlates) {
      cumulativeCounts[cumulativeCounts.length - 1] = totalPlates;
    }

    const labels = months.map(m => m.label);

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
    gradient.addColorStop(0.6, 'rgba(37, 99, 235, 0.15)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');

    if (salesGrowthChartInstance) {
      salesGrowthChartInstance.destroy();
    }

    salesGrowthChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Acumulado de Placas',
            data: cumulativeCounts,
            borderColor: '#38BDF8',
            borderWidth: 3,
            backgroundColor: gradient,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: '#0284C7',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7
          },
          {
            label: 'Novas Placas Cadastradas no Mês',
            data: monthlySalesCount,
            borderColor: '#818CF8',
            borderWidth: 2,
            borderDash: [5, 5],
            backgroundColor: 'transparent',
            tension: 0.3,
            pointBackgroundColor: '#818CF8',
            pointRadius: 3,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: '#94A3B8',
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '600' },
              boxWidth: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#FFFFFF',
            bodyColor: '#38BDF8',
            borderColor: 'rgba(56, 189, 248, 0.3)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${context.parsed.y} placas`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94A3B8', font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94A3B8',
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
              precision: 0
            }
          }
        }
      }
    });
  }

  function renderChannelsDoughnutChart() {
    const canvas = document.getElementById('channelsDoughnutChart');
    if (!canvas) return;

    let totalNFC = 0;
    let totalQR = 0;
    state.plates.forEach(p => {
      totalNFC += (p.scans?.nfc || 0);
      totalQR += (p.scans?.qr || 0);
    });

    const totalScans = totalNFC + totalQR;
    const nfcPct = totalScans > 0 ? Math.round((totalNFC / totalScans) * 100) : 50;
    const qrPct = totalScans > 0 ? Math.round((totalQR / totalScans) * 100) : 50;

    const legendNfc = document.getElementById('legendNfcPercent');
    const legendQr = document.getElementById('legendQrPercent');
    if (legendNfc) legendNfc.textContent = `${nfcPct}% (${totalNFC.toLocaleString('pt-BR')})`;
    if (legendQr) legendQr.textContent = `${qrPct}% (${totalQR.toLocaleString('pt-BR')})`;

    const displayData = totalScans > 0 ? [totalNFC, totalQR] : [1, 1];

    const ctx = canvas.getContext('2d');
    if (channelsDoughnutChartInstance) {
      channelsDoughnutChartInstance.destroy();
    }

    channelsDoughnutChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Aproximação NFC', 'Câmera QR Code'],
        datasets: [{
          data: displayData,
          backgroundColor: ['#10B981', '#F59E0B'],
          borderColor: '#0B0F17',
          borderWidth: 4,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#FFFFFF',
            bodyColor: '#F8FAFC',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const val = totalScans > 0 ? context.parsed : 0;
                return ` ${context.label}: ${val.toLocaleString('pt-BR')} acessos`;
              }
            }
          }
        }
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
