/* ==========================================================
   CAPA DE PRESENTACIÓN — ui.js
   Responsable: todo el renderizado DOM, stats, toasts, estado.
   ========================================================== */

window.App = window.App || {};

window.App.ui = (function () {
    // ── DOM refs ─────────────────────────────────
    const temaList = document.getElementById('temaList');
    const listState = document.getElementById('listState');
    const listStateText = document.getElementById('listStateText');
    const totalCount = document.getElementById('totalCount');
    const lastAdded = document.getElementById('lastAdded');
    const statusDot = document.getElementById('statusDot');
    const statusLabel = document.getElementById('statusLabel');
    const toastContainer = document.getElementById('toastContainer');

    // ── Render lista ─────────────────────────────
    function renderList(temas, searchQuery = '') {
        hideListState();
        temaList.innerHTML = '';

        if (temas.length === 0) {
            temaList.innerHTML = `
        <li class="empty-state">
          <span class="empty-icon">◯</span>
          <span class="empty-text">
            ${searchQuery
                    ? 'Sin resultados para esa búsqueda.'
                    : 'Aún no hay temas. ¡Crea el primero!'}
          </span>
        </li>`;
            return;
        }

        temas.forEach((t, idx) => {
            const li = document.createElement('li');
            li.className = 'tema-item';
            li.style.animationDelay = `${idx * 40}ms`;
            li.dataset.id = t.id;

            li.innerHTML = `
        <span class="tema-text">${escapeHtml(t.tema)}</span>
        <div class="tema-actions">
          <button
            class="btn-edit"
            data-id="${t.id}"
            data-tema="${escapeAttr(t.tema)}"
            aria-label="Editar ${escapeAttr(t.tema)}">✎ Editar</button>
          <button
            class="btn-delete"
            data-id="${t.id}"
            data-tema="${escapeAttr(t.tema)}"
            aria-label="Eliminar ${escapeAttr(t.tema)}">✕ Eliminar</button>
        </div>`;

            temaList.appendChild(li);
        });
    }

    // ── Stats ────────────────────────────────────
    function updateStats(temas) {
        totalCount.textContent = temas.length;

        if (temas.length > 0) {
            const last = temas[temas.length - 1];
            const nombre = typeof last?.tema === 'string' ? last.tema : '';
            lastAdded.textContent = truncate(nombre, 16) || '—';
        } else {
            lastAdded.textContent = '—';
        }
    }

    // ── Conexión ──────────────────────────────────
    function setConnectionStatus(online) {
        statusDot.className = `status-dot ${online ? 'online' : 'offline'}`;
        statusLabel.textContent = online ? 'API conectada' : 'Sin conexión';
    }

    // ── Estado de la lista ────────────────────────
    function showListState(msg, isError = false) {
        listState.classList.remove('hidden');
        listStateText.textContent = msg;
        listStateText.style.color = isError ? 'var(--neon-pink)' : '';
        temaList.innerHTML = '';
    }

    function hideListState() {
        listState.classList.add('hidden');
    }

    // ── Toasts ────────────────────────────────────
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

    // ── Utilidades internas ───────────────────────
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function escapeAttr(str) {
        return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function truncate(str, max) {
        if (typeof str !== 'string') return '';
        return str.length <= max ? str : str.slice(0, max) + '…';
    }

    // Exportar funciones públicas
    return {
        renderList,
        updateStats,
        setConnectionStatus,
        showListState,
        hideListState,
        showToast
    };
})();
