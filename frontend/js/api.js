/* ==========================================================
   CAPA DE DATOS — api.js
   Responsable: todas las llamadas HTTP a la API REST.
   ========================================================== */

window.App = window.App || {};

window.App.api = (function () {
    const API_BASE = 'http://localhost:3000/api/temas';

    /**
     * Normaliza un item recibido del servidor.
     * El driver pg a veces devuelve composite rows como "(3,JavaScript)";
     * esta función garantiza que siempre obtenemos { id, tema } limpios.
     */
    function normalizeItem(raw) {
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            // Caso normal: { id: 3, tema: 'JavaScript' }
            const id = Number(raw.id) || 0;
            let tema = String(raw.tema ?? '').trim();

            // En caso de que la DB devuelva el string completo dentro de un objeto
            const match = tema.match(/^\((\d+),(.+)\)$/);
            if (match) tema = match[2].trim();

            return { id, tema };
        }
        if (typeof raw === 'string') {
            // Caso excepcional puro string: "(3,JavaScript)" => parseamos
            const match = raw.match(/^\((\d+),(.+)\)$/);
            if (match) return { id: Number(match[1]), tema: match[2].trim() };
        }
        return { id: 0, tema: String(raw ?? '').trim() };
    }

    async function fetchAll() {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return (Array.isArray(data) ? data : []).map(normalizeItem);
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
        return normalizeItem(await res.json());
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
        return normalizeItem(await res.json());
    }

    async function deleteTema(id) {
        const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }

    function formatApiError(err) {
        if (Array.isArray(err?.message)) return err.message.join('. ');
        return err?.message || 'Error desconocido.';
    }

    // Exportar las funciones públicas
    return {
        fetchAll,
        createTema,
        updateTema,
        deleteTema
    };
})();
