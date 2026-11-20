(() => {
    'use strict';

    const STORAGE_KEY = 'luna-cabina.admin.v1';
    const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
    const TARGET_IMAGE_BYTES = 550 * 1024;
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));
    const today = () => {
        const date = new Date();
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 10);
    };

    let store = loadStore();
    let selectedImage = '';
    let toastTimer;

    function loadStore() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return {
                promotions: Array.isArray(value.promotions) ? value.promotions : [],
                occasions: Array.isArray(value.occasions) ? value.occasions : []
            };
        } catch (error) {
            return { promotions: [], occasions: [] };
        }
    }

    function saveStore() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
            return true;
        } catch (error) {
            showToast('No se pudieron guardar los datos. Exporta un respaldo y reduce el tamaño o la cantidad de imágenes.', true);
            return false;
        }
    }

    function showToast(message, isError = false) {
        const toast = $('#toast');
        toast.textContent = message;
        toast.hidden = false;
        toast.classList.toggle('is-error', isError);
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3600);
    }

    function formatDate(value) {
        if (!value) return '—';
        const parts = value.split('-').map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) return value;
        return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])));
    }

    function getStatus(item, kind) {
        if (kind === 'promotions') return item.date >= today() ? 'active' : 'expired';
        return item.date >= today() ? 'upcoming' : 'past';
    }

    function getStatusLabel(status) {
        return ({ active: 'Vigente', expired: 'Vencida', upcoming: 'Próxima', past: 'Anterior' })[status] || status;
    }

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function makeThumbnail(item) {
        if (item.image) {
            const image = makeElement('img', 'item-thumb');
            image.src = item.image;
            image.alt = '';
            image.loading = 'lazy';
            return image;
        }
        return makeElement('span', 'item-thumb item-thumb-placeholder', '✧');
    }

    function makeItemCell(item) {
        const cell = makeElement('div', 'item-cell');
        const copy = makeElement('span');
        copy.append(makeElement('strong', '', item.title), makeElement('small', '', item.description));
        cell.append(makeThumbnail(item), copy);
        return cell;
    }

    function makeStatus(status) {
        return makeElement('span', `state-pill ${status}`, getStatusLabel(status));
    }

    function makeActionButton(label, icon, action, id, extraClass = '') {
        const button = makeElement('button', `action-button ${extraClass}`.trim(), icon);
        button.type = 'button';
        button.setAttribute('aria-label', label);
        button.title = label;
        button.dataset.action = action;
        button.dataset.id = id;
        return button;
    }

    function renderRecent() {
        const tbody = $('#recent-list');
        tbody.replaceChildren();
        const items = [
            ...store.promotions.map((item) => ({ ...item, kind: 'promotions' })),
            ...store.occasions.map((item) => ({ ...item, kind: 'occasions' }))
        ].sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')).slice(0, 6);

        items.forEach((item) => {
            const row = document.createElement('tr');
            const name = document.createElement('td');
            name.append(makeItemCell(item));
            const type = document.createElement('td');
            type.append(makeElement('span', 'type-pill', item.kind === 'promotions' ? 'Promoción' : 'Ocasión'));
            const date = makeElement('td', '', item.kind === 'promotions' ? `Hasta ${formatDate(item.date)}` : formatDate(item.date));
            const state = document.createElement('td');
            state.append(makeStatus(getStatus(item, item.kind)));
            const actions = makeElement('td', 'row-actions');
            actions.append(makeActionButton('Editar', '✎', 'edit', item.id), makeActionButton('Eliminar', '⌫', 'delete', item.id, 'delete'));
            row.append(name, type, date, state, actions);
            tbody.append(row);
        });
        $('#dashboard-empty').hidden = items.length > 0;
        $('#recent-title').textContent = items.length ? 'Contenido reciente' : 'Comienza a compartir';
        $('#stat-promotions').textContent = store.promotions.filter((item) => getStatus(item, 'promotions') === 'active').length;
        $('#stat-occasions').textContent = store.occasions.filter((item) => getStatus(item, 'occasions') === 'upcoming').length;
        $('#stat-total').textContent = store.promotions.length + store.occasions.length;
    }

    function renderList(kind) {
        const promotion = kind === 'promotions';
        const items = store[kind];
        const tbody = $(promotion ? '#promotion-list' : '#occasion-list');
        const empty = $(promotion ? '#promotion-empty' : '#occasion-empty');
        const noResults = $(promotion ? '#promotion-no-results' : '#occasion-no-results');
        const query = $(promotion ? '#promotion-search' : '#occasion-search').value.trim().toLocaleLowerCase('es-MX');
        const filter = $(promotion ? '#promotion-filter' : '#occasion-filter').value;
        const filtered = items.filter((item) => {
            const status = getStatus(item, kind);
            const matchesQuery = `${item.title} ${item.description}`.toLocaleLowerCase('es-MX').includes(query);
            const matchesFilter = filter === 'all' || status === filter || (filter === 'upcoming' && status === 'upcoming');
            return matchesQuery && matchesFilter;
        }).sort((a, b) => {
            const statusOrder = (item) => ['active', 'upcoming'].includes(getStatus(item, kind)) ? 0 : 1;
            return statusOrder(a) - statusOrder(b) || a.date.localeCompare(b.date);
        });

        tbody.replaceChildren();
        filtered.forEach((item) => {
            const row = document.createElement('tr');
            const name = document.createElement('td');
            name.append(makeItemCell(item));
            const date = makeElement('td', '', promotion ? `Válida hasta ${formatDate(item.date)}` : formatDate(item.date));
            const state = document.createElement('td');
            state.append(makeStatus(getStatus(item, kind)));
            const actions = makeElement('td', 'row-actions');
            actions.append(makeActionButton('Editar', '✎', 'edit', item.id), makeActionButton('Eliminar', '⌫', 'delete', item.id, 'delete'));
            row.append(name, date, state, actions);
            tbody.append(row);
        });
        empty.hidden = items.length !== 0;
        noResults.hidden = items.length === 0 || filtered.length !== 0;
        if (items.length === 0) empty.querySelector('h3').textContent = promotion ? 'Aún no hay promociones' : 'Aún no hay ocasiones';
    }

    function render() {
        renderRecent();
        renderList('promotions');
        renderList('occasions');
    }

    function showView(view) {
        $$('.view').forEach((section) => {
            const visible = section.id === `view-${view}`;
            section.classList.toggle('is-visible', visible);
            section.hidden = !visible;
        });
        $$('[data-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.view === view && button.classList.contains('nav-link')));
        history.replaceState(null, '', `?section=${encodeURIComponent(view)}`);
    }

    function openEditor(kind, item = null) {
        const promotion = kind === 'promotions';
        $('#item-form').reset();
        $('#item-kind').value = kind;
        $('#item-id').value = item ? item.id : '';
        $('#dialog-eyebrow').textContent = item ? 'EDITAR PUBLICACIÓN' : 'NUEVA PUBLICACIÓN';
        $('#dialog-title').textContent = item ? `Editar ${promotion ? 'promoción' : 'ocasión'}` : `Nueva ${promotion ? 'promoción' : 'ocasión'}`;
        $('#date-label').textContent = promotion ? 'Válida hasta' : 'Fecha de la ocasión';
        $('#item-date').value = item ? item.date : today();
        $('#item-title').value = item ? item.title : '';
        $('#item-description').value = item ? item.description : '';
        $('#item-date').min = !item && promotion ? today() : '';
        selectedImage = item ? item.image : '';
        $('#image-preview').src = selectedImage || '';
        $('#image-preview').hidden = !selectedImage;
        $('#upload-title').textContent = item && item.image ? 'Cambiar imagen' : 'Elige una imagen';
        $('#image-help').textContent = item && item.image ? 'Si no eliges otra, se conserva la imagen actual.' : 'Necesitas agregar una imagen.';
        $('#image-help').hidden = false;
        $('#form-error').hidden = true;
        $('#item-dialog').showModal();
        $('#item-title').focus();
    }

    function closeEditor() {
        $('#item-dialog').close();
    }

    function optimizeImage(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) return reject(new Error('Selecciona un archivo de imagen válido.'));
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return reject(new Error('Usa una imagen JPG, PNG o WebP.'));
            if (file.size > MAX_IMAGE_BYTES) return reject(new Error('La imagen supera 6 MB. Elige una más ligera.'));
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('No se pudo leer la imagen. Intenta con otro archivo.'));
            reader.onload = () => {
                const image = new Image();
                image.onerror = () => reject(new Error('No se pudo abrir la imagen. Intenta con otro archivo.'));
                image.onload = () => {
                    const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(1, Math.round(image.width * scale));
                    canvas.height = Math.max(1, Math.round(image.height * scale));
                    const context = canvas.getContext('2d');
                    if (!context) return reject(new Error('Tu navegador no pudo procesar la imagen.'));
                    context.fillStyle = '#ffffff';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(image, 0, 0, canvas.width, canvas.height);
                    const qualities = [0.82, 0.68, 0.54];
                    const encode = (index) => canvas.toBlob((blob) => {
                        if (!blob) return reject(new Error('No se pudo optimizar la imagen.'));
                        if (blob.size > TARGET_IMAGE_BYTES && index < qualities.length - 1) return encode(index + 1);
                        if (blob.size > TARGET_IMAGE_BYTES) return reject(new Error('La imagen sigue siendo muy pesada. Elige otra más pequeña.'));
                        const result = new FileReader();
                        result.onerror = () => reject(new Error('No se pudo preparar la imagen.'));
                        result.onload = () => resolve(result.result);
                        result.readAsDataURL(blob);
                    }, 'image/jpeg', qualities[index]);
                    encode(0);
                };
                image.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async function handleSave(event) {
        event.preventDefault();
        const kind = $('#item-kind').value;
        const id = $('#item-id').value;
        const existing = id ? store[kind].find((item) => item.id === id) : null;
        const error = $('#form-error');
        const submit = $('#save-button');
        error.hidden = true;
        submit.disabled = true;
        submit.textContent = 'Guardando…';

        try {
            if (!selectedImage) throw new Error('Agrega una imagen antes de guardar.');
            const previous = JSON.parse(JSON.stringify(store));
            const item = {
                id: existing ? existing.id : (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
                title: $('#item-title').value.trim(),
                description: $('#item-description').value.trim(),
                date: $('#item-date').value,
                image: selectedImage,
                createdAt: existing ? existing.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            if (existing) {
                store[kind] = store[kind].map((entry) => entry.id === existing.id ? item : entry);
            } else {
                store[kind].push(item);
            }
            if (!saveStore()) {
                store = previous;
                return;
            }
            closeEditor();
            render();
            showToast(existing ? 'Los cambios quedaron guardados.' : 'La publicación se agregó correctamente.');
        } catch (saveError) {
            error.textContent = saveError.message || 'No se pudo guardar la publicación.';
            error.hidden = false;
        } finally {
            submit.disabled = false;
            submit.textContent = 'Guardar publicación';
        }
    }

    function findItem(id) {
        for (const kind of ['promotions', 'occasions']) {
            const item = store[kind].find((entry) => entry.id === id);
            if (item) return { item, kind };
        }
        return null;
    }

    function handleAction(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const result = findItem(button.dataset.id);
        if (!result) return;
        if (button.dataset.action === 'edit') return openEditor(result.kind, result.item);
        if (button.dataset.action === 'delete' && window.confirm(`¿Eliminar “${result.item.title}”? Esta acción no se puede deshacer.`)) {
            const previous = JSON.parse(JSON.stringify(store));
            store[result.kind] = store[result.kind].filter((item) => item.id !== result.item.id);
            if (saveStore()) {
                render();
                showToast('La publicación se eliminó.');
            } else store = previous;
        }
    }

    function exportData() {
        const backup = { app: 'Luna Cabina', schema: 1, exportedAt: new Date().toISOString(), ...store };
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `luna-cabina-respaldo-${today()}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
        showToast('El respaldo se descargó.');
    }

    async function importData(file) {
        if (!file) return;
        try {
            const backup = JSON.parse(await file.text());
            if (!Array.isArray(backup.promotions) || !Array.isArray(backup.occasions)) throw new Error('El archivo no tiene el formato de respaldo de Luna Cabina.');
            const validItem = (item) => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.description === 'string' && typeof item.date === 'string' && typeof item.image === 'string';
            if (![...backup.promotions, ...backup.occasions].every(validItem)) throw new Error('El archivo contiene publicaciones incompletas.');
            if (!window.confirm('Importar este respaldo reemplazará las publicaciones guardadas actualmente en este navegador. ¿Continuar?')) return;
            const previous = store;
            store = { promotions: backup.promotions, occasions: backup.occasions };
            if (saveStore()) {
                render();
                showToast('El respaldo se importó correctamente.');
            } else {
                store = previous;
            }
        } catch (error) {
            showToast(error.message || 'No se pudo importar el respaldo.', true);
        } finally {
            $('#import-file').value = '';
        }
    }

    function initialize() {
        $('#current-year').textContent = new Date().getFullYear();
        document.addEventListener('click', (event) => {
            const viewButton = event.target.closest('[data-view]');
            if (viewButton) showView(viewButton.dataset.view);
            const createButton = event.target.closest('[data-create]');
            if (createButton) openEditor(createButton.dataset.create);
        });
        document.addEventListener('click', handleAction);
        $('#item-form').addEventListener('submit', handleSave);
        $('#close-dialog').addEventListener('click', closeEditor);
        $('#cancel-dialog').addEventListener('click', closeEditor);
        $('#item-dialog').addEventListener('click', (event) => { if (event.target === $('#item-dialog')) closeEditor(); });
        $('#item-image').addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            $('#form-error').hidden = true;
            try {
                selectedImage = await optimizeImage(file);
                $('#image-preview').src = selectedImage;
                $('#image-preview').hidden = false;
                $('#upload-title').textContent = file.name;
                $('#image-help').textContent = 'Imagen lista para guardar.';
            } catch (error) {
                event.target.value = '';
                $('#form-error').textContent = error.message;
                $('#form-error').hidden = false;
            }
        });
        ['#promotion-search', '#promotion-filter'].forEach((selector) => $(selector).addEventListener('input', () => renderList('promotions')));
        ['#occasion-search', '#occasion-filter'].forEach((selector) => $(selector).addEventListener('input', () => renderList('occasions')));
        $('#export-button').addEventListener('click', exportData);
        $('#import-button').addEventListener('click', () => $('#import-file').click());
        $('#import-file').addEventListener('change', (event) => importData(event.target.files[0]));
        const requested = new URLSearchParams(location.search).get('section');
        const initialView = ['dashboard', 'promotions', 'occasions'].includes(requested) ? requested : 'dashboard';
        showView(initialView);
        render();
    }

    initialize();
})();
