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
      fetchUsersList();
    } else {
      btnOpenUsersModal.style.display = 'none';
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
    localStorage.removeItem('futura_smart_token');
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
  }

  // ==========================================
  // RENDERING PLATES
  // ==========================================
  function renderPlates() {
    const filtered = state.plates.filter(plate => {
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

    if (filtered.length === 0) {
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
      populateAssignUsersDropdown(state.currentUser.id);
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
      } else {
        showToast(data.message || 'Erro ao salvar placa.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Falha na comunicação com o servidor.', true);
    }
  }

  // ==========================================
  // GESTÃO DE USUÁRIOS (ADMIN ONLY)
  // ==========================================
  async function fetchUsersList() {
    try {
      const res = await fetchWithAuth('/api/users');
      const data = await res.json();
      if (data.success) {
        state.users = data.users;
        usersTotalCount.textContent = `Total: ${data.users.length} usuários cadastrados`;
        renderUsersTable(data.users);
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
  function openStudioModal(id) {
    const plate = state.plates.find(p => p.id === id);
    if (!plate) return;

    state.selectedPlateForStudio = plate;

    const host = window.location.host;
    const protocol = window.location.protocol;
    const nfcUrl = `${protocol}//${host}/r/${plate.slug}?src=nfc`;
    const qrEndpoint = `/api/qrcode/${plate.slug}?src=qr`;

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
    mockupQrImage.src = qrEndpoint;

    nfcUrlInput.value = nfcUrl;

    btnDownloadPng.href = `/api/qrcode/${plate.slug}?src=qr&format=png`;
    btnDownloadPng.download = `qrcode-${plate.slug}.png`;

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

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
