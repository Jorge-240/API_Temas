/* ============================================
   TEMA MANAGER — app.js
   Connects to NestJS API at http://localhost:3000
   ============================================ */

const API_BASE = 'http://localhost:3000/api/temas';

// ── DOM References ───────────────────────────
const temaForm = document.getElementById('temaForm');
const temaInput = document.getElementById('temaInput');
const inputCounter = document.getElementById('inputCounter');
const inputError = document.getElementById('inputError');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');
const temaList = document.getElementById('temaList');
const listState = document.getElementById('listState');
const listStateText = document.getElementById('listStateText');
const totalCount = document.getElementById('totalCount');
const lastAdded = document.getElementById('lastAdded');
const refreshBtn = document.getElementById('refreshBtn');
const searchInput = document.getElementById('searchInput');
const statusDot = document.getElementById('statusDot');
const statusLabel = document.getElementById('statusLabel');
const confirmModal = document.getElementById('confirmModal');
const modalDesc = document.getElementById('modalDesc');
const modalConfirm = document.getElementById('modalConfirmBtn');
const modalCancel = document.getElementById('modalCancelBtn');
const toastContainer = document.getElementById('toastContainer');

// ── State ────────────────────────────────────
let editingId = null;   // current id being edited (null = create mode)
let allTemas = [];     // full list from server
let pendingDeleteId = null;   // id queued for deletion confirm

// ── Input counter ────────────────────────────
temaInput.addEventListener('input', () => {
    const len = temaInput.value.length;
    inputCounter.textContent = `${len}/255`;
    if (len > 240) inputCounter.style.color = 'var(--neon-pink)';
    else inputCounter.style.color = '';
    if (inputError.textContent) clearError();
});

// ── Form submit ──────────────────────────────
temaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = temaInput.value.trim();
    if (!value) { showError('El campo no puede estar vacío.'); return; }
    if (value.length > 255) { showError('Máximo 255 caracteres.'); return; }

    setFormLoading(true);

    try {
        if (editingId !== null) {
            await updateTema(editingId, value);
        } else {
            await createTema(value);
        }
        resetForm();
        await loadTemas();
    } catch (err) {
        showError(err.message || 'Error al conectar con la API.');
    } finally {
        setFormLoading(false);
    }
});

// ── Cancel edit ──────────────────────────────
cancelEditBtn.addEventListener('click', resetForm);

// ── Refresh ──────────────────────────────────
refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spinning');
    loadTemas().finally(() => {
        setTimeout(() => refreshBtn.classList.remove('spinning'), 600);
    });
});

// ── Search ───────────────────────────────────
searchInput.addEventListener('input', () => {
    renderList(filtered());
});

function filtered() {
    const q = searchInput.value.trim().toLowerCase();
    return q ? allTemas.filter(t => t.tema.toLowerCase().includes(q)) : allTemas;
}

// ── Modal ─────────────────────────────────────
modalCancel.addEventListener('click', closeModal);
confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) closeModal(); });
modalConfirm.addEventListener('click', async () => {
    if (pendingDeleteId === null) return;
    closeModal();
    await doDelete(pendingDeleteId);
    pendingDeleteId = null;
});

// ── API calls ────────────────────────────────

async function loadTemas() {
    showListState('Cargando temas...');
    try {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        allTemas = await res.json();
        setConnectionStatus(true);
        updateStats();
        renderList(filtered());
    } catch (err) {
        setConnectionStatus(false);
        showListState('No se pudo conectar con la API.', true);
        showToast('Error de conexión con la API', 'error');
    }
}

async function createTema(tema) {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(formatApiError(err));
    }
    const created = await res.json();
    showToast(`Tema "${created.tema}" creado`, 'success');
}

async function updateTema(id, tema) {
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(formatApiError(err));
    }
    const updated = await res.json();
    showToast(`Tema #${updated.id} actualizado`, 'info');
}

async function doDelete(id) {
    try {
        const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showToast(`Tema #${id} eliminado`, 'error');
        await loadTemas();
    } catch {
        showToast('No se pudo eliminar el tema', 'error');
    }
}

// ── Render ────────────────────────────────────

function renderList(temas) {
    hideListState();
    temaList.innerHTML = '';

    if (temas.length === 0) {
        temaList.innerHTML = `
      <li class="empty-state">
        <span class="empty-icon">◯</span>
        <span class="empty-text">${searchInput.value ? 'Sin resultados para esa búsqueda.' : 'Aún no hay temas. ¡Crea el primero!'}</span>
      </li>`;
        return;
    }

    temas.forEach((t, idx) => {
        const li = document.createElement('li');
        li.className = 'tema-item';
        li.style.animationDelay = `${idx * 40}ms`;
        li.dataset.id = t.id;
        li.innerHTML = `
      <span class="tema-id">#${t.id}</span>
      <span class="tema-text">${escapeHtml(t.tema)}</span>
      <div class="tema-actions">
        <button class="btn-edit"   data-id="${t.id}" data-tema="${escapeAttr(t.tema)}" aria-label="Editar tema ${t.id}">✎ Editar</button>
        <button class="btn-delete" data-id="${t.id}" data-tema="${escapeAttr(t.tema)}" aria-label="Eliminar tema ${t.id}">✕ Eliminar</button>
      </div>`;
        temaList.appendChild(li);
    });

    // Delegated events
    temaList.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => startEdit(Number(btn.dataset.id), btn.dataset.tema));
    });
    temaList.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => confirmDelete(Number(btn.dataset.id), btn.dataset.tema));
    });
}

function updateStats() {
    totalCount.textContent = allTemas.length;
    if (allTemas.length > 0) {
        const last = allTemas[allTemas.length - 1];
        lastAdded.textContent = truncate(last.tema, 14);
    } else {
        lastAdded.textContent = '—';
    }
}

// ── Form helpers ─────────────────────────────

function startEdit(id, tema) {
    editingId = id;
    temaInput.value = tema;
    temaInput.dispatchEvent(new Event('input'));
    temaInput.classList.add('is-editing');
    formTitle.innerHTML = `<span class="title-icon" style="color:var(--neon-purple);filter:drop-shadow(0 0 5px var(--neon-purple))">✦</span> Editando Tema #${id}`;
    submitBtnText.textContent = 'Guardar Cambios';
    submitBtn.classList.add('editing');
    cancelEditBtn.style.display = 'flex';
    temaInput.focus();
    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
    editingId = null;
    temaForm.reset();
    inputCounter.textContent = '0/255';
    inputCounter.style.color = '';
    temaInput.classList.remove('is-editing');
    formTitle.innerHTML = `<span class="title-icon">✦</span> Nuevo Tema`;
    submitBtnText.textContent = 'Crear Tema';
    submitBtn.classList.remove('editing');
    cancelEditBtn.style.display = 'none';
    clearError();
}

function setFormLoading(on) {
    submitBtn.classList.toggle('loading', on);
    submitBtnText.textContent = on
        ? (editingId !== null ? 'Guardando...' : 'Creando...')
        : (editingId !== null ? 'Guardar Cambios' : 'Crear Tema');
}

function showError(msg) { inputError.textContent = msg; }
function clearError() { inputError.textContent = ''; }

// ── List state helpers ────────────────────────

function showListState(msg, isError = false) {
    listState.classList.remove('hidden');
    listStateText.textContent = msg;
    listStateText.style.color = isError ? 'var(--neon-pink)' : '';
    temaList.innerHTML = '';
}

function hideListState() { listState.classList.add('hidden'); }

// ── Modal helpers ─────────────────────────────

function confirmDelete(id, tema) {
    pendingDeleteId = id;
    modalDesc.textContent = `¿Eliminar el tema "${tema}" (id #${id})? Esta acción no se puede deshacer.`;
    confirmModal.style.display = 'flex';
}

function closeModal() {
    confirmModal.style.display = 'none';
    pendingDeleteId = null;
}

// ── Toast ─────────────────────────────────────

const TOAST_EMOJIS = { success: '✓', error: '✕', info: 'ℹ' };

function showToast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="toast-emoji">${TOAST_EMOJIS[type]}</span><span>${msg}</span>`;
    toastContainer.appendChild(el);
    setTimeout(() => {
        el.classList.add('removing');
        el.addEventListener('animationend', () => el.remove());
    }, 3500);
}

// ── Connection status ─────────────────────────

function setConnectionStatus(online) {
    statusDot.className = `status-dot ${online ? 'online' : 'offline'}`;
    statusLabel.textContent = online ? 'API conectada' : 'Sin conexión';
}

// ── Utilities ─────────────────────────────────

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function truncate(str, max) {
    return str.length <= max ? str : str.slice(0, max) + '…';
}

function formatApiError(err) {
    if (Array.isArray(err?.message)) return err.message.join('. ');
    return err?.message || 'Error desconocido.';
}

// ── Init ──────────────────────────────────────
loadTemas();
