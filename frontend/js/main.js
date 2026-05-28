/* ==========================================================
   CAPA DE APLICACIÓN — main.js
   Responsable: estado global, lógica de negocio, eventos, init.
   Orquesta la capa de datos (api.js) y la presentación (ui.js).
   ========================================================== */

(function () {
    const api = window.App.api;
    const ui = window.App.ui;

    // ── DOM refs ─────────────────────────────────
    const temaForm = document.getElementById('temaForm');
    const temaInput = document.getElementById('temaInput');
    const inputCounter = document.getElementById('inputCounter');
    const inputError = document.getElementById('inputError');
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const formTitle = document.getElementById('formTitle');
    const temaList = document.getElementById('temaList');
    const refreshBtn = document.getElementById('refreshBtn');
    const searchInput = document.getElementById('searchInput');
    const confirmModal = document.getElementById('confirmModal');
    const modalDesc = document.getElementById('modalDesc');
    const modalConfirm = document.getElementById('modalConfirmBtn');
    const modalCancel = document.getElementById('modalCancelBtn');

    // ── Estado de la aplicación ──────────────────
    const state = {
        allTemas: [],  // datos de la API
        editingId: null,
        pendingDeleteId: null,
    };

    // ──────────────────────────────────────────────
    // SECCIÓN: CARGA DE DATOS
    // ──────────────────────────────────────────────

    async function loadTemas() {
        ui.showListState('Cargando temas...');
        try {
            state.allTemas = await api.fetchAll();
            ui.setConnectionStatus(true);
            ui.updateStats(state.allTemas);
            renderFiltered();
        } catch {
            ui.setConnectionStatus(false);
            ui.showListState('No se pudo conectar con la API.', true);
            ui.showToast('Error de conexión con la API', 'error');
        }
    }

    function renderFiltered() {
        const q = searchInput.value.trim().toLowerCase();
        const list = q
            ? state.allTemas.filter(t => t.tema.toLowerCase().includes(q))
            : state.allTemas;
        ui.renderList(list, q);
        attachListEvents();
    }

    // ──────────────────────────────────────────────
    // SECCIÓN: EVENTOS DE LISTA (delegados)
    // ──────────────────────────────────────────────

    function attachListEvents() {
        temaList.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () =>
                startEdit(Number(btn.dataset.id), btn.dataset.tema));
        });
        temaList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () =>
                openDeleteModal(Number(btn.dataset.id), btn.dataset.tema));
        });
    }

    // ──────────────────────────────────────────────
    // SECCIÓN: FORMULARIO
    // ──────────────────────────────────────────────

    temaInput.addEventListener('input', () => {
        const len = temaInput.value.length;
        inputCounter.textContent = `${len}/255`;
        inputCounter.style.color = len > 240 ? 'var(--neon-pink)' : '';
        clearError();
    });

    temaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const value = temaInput.value.trim();

        if (!value) { showError('El campo no puede estar vacío.'); return; }
        if (value.length > 255) { showError('Máximo 255 caracteres.'); return; }

        setFormLoading(true);
        try {
            if (state.editingId !== null) {
                const updated = await api.updateTema(state.editingId, value);
                ui.showToast(`Tema "${updated.tema}" actualizado`, 'info');
            } else {
                const created = await api.createTema(value);
                ui.showToast(`Tema "${created.tema}" creado`, 'success');
            }
            resetForm();
            await loadTemas();
        } catch (err) {
            showError(err.message || 'Error al conectar con la API.');
        } finally {
            setFormLoading(false);
        }
    });

    cancelEditBtn.addEventListener('click', resetForm);

    function startEdit(id, tema) {
        state.editingId = id;
        temaInput.value = tema;
        temaInput.dispatchEvent(new Event('input'));
        temaInput.classList.add('is-editing');
        formTitle.innerHTML = `<span class="title-icon" style="color:var(--neon-purple);filter:drop-shadow(0 0 5px var(--neon-purple))">✦</span> Editando Tema`;
        submitBtnText.textContent = 'Guardar Cambios';
        submitBtn.classList.add('editing');
        cancelEditBtn.style.display = 'flex';
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        temaInput.focus();
    }

    function resetForm() {
        state.editingId = null;
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
            ? (state.editingId !== null ? 'Guardando...' : 'Creando...')
            : (state.editingId !== null ? 'Guardar Cambios' : 'Crear Tema');
    }

    function showError(msg) { inputError.textContent = msg; }
    function clearError() { inputError.textContent = ''; }

    // ──────────────────────────────────────────────
    // SECCIÓN: MODAL DE CONFIRMACIÓN
    // ──────────────────────────────────────────────

    function openDeleteModal(id, tema) {
        state.pendingDeleteId = id;
        modalDesc.textContent = `¿Eliminar el tema "${tema}"? Esta acción no se puede deshacer.`;
        confirmModal.style.display = 'flex';
    }

    function closeModal() {
        confirmModal.style.display = 'none';
        state.pendingDeleteId = null;
    }

    modalCancel.addEventListener('click', closeModal);
    confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) closeModal();
    });

    modalConfirm.addEventListener('click', async () => {
        const id = state.pendingDeleteId;
        if (id === null) return;
        closeModal();
        try {
            await api.deleteTema(id);
            ui.showToast(`Tema #${id} eliminado`, 'error');
            await loadTemas();
        } catch {
            ui.showToast('No se pudo eliminar el tema', 'error');
        }
    });

    // ──────────────────────────────────────────────
    // SECCIÓN: CONTROLES GLOBALES
    // ──────────────────────────────────────────────

    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('spinning');
        loadTemas().finally(() =>
            setTimeout(() => refreshBtn.classList.remove('spinning'), 600));
    });

    searchInput.addEventListener('input', renderFiltered);

    // ──────────────────────────────────────────────
    // INIT
    // ──────────────────────────────────────────────
    loadTemas();

})();
