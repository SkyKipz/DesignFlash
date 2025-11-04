// ===============================================
// ESTADO DEL JUEGO Y DEFINICIÓN DE RETOS
// ===============================================

const retos = [
    {
        id: 1,
        titulo: "Página de Animales Extintos",
        descripcion: "Crea una página de información simple. Necesitas una imagen, un botón primario y dos áreas de texto para la descripción.",
        elementosNecesarios: {
            "comp-imagen": 1,
            "comp-boton-primario": 1,
            "comp-area-texto": 2
        },
        // ===== Plantilla de layout (en px relativos al #area-drop) =====
        layoutTargets: [
            { type: "comp-imagen",         x: 40,  y: 100, w: 220, h: 140, weight: 0.40 },
            { type: "comp-area-texto",     x: 300, y: 100, w: 320, h: 80,  weight: 0.15 },
            { type: "comp-area-texto",     x: 300, y: 200, w: 320, h: 80,  weight: 0.15 },
            { type: "comp-boton-primario", x: 300, y: 300, w: 180, h: 44,  weight: 0.30 }
        ],
        tiempoLimite: 300,
        tiempoRecord: null
    },
    {
        id: 2,
        titulo: "Formulario de Contacto",
        descripcion: "Diseña un formulario básico. Debe incluir un campo de entrada, un botón secundario y el título de diseño (h1).",
        elementosNecesarios: {
            "comp-campo-entrada": 1,
            "comp-boton-secundario": 1,
        },
        layoutTargets: [
            { type: "comp-campo-entrada",    x: 80,  y: 120, w: 380, h: 44,  weight: 0.45 },
            { type: "comp-boton-secundario", x: 80,  y: 180, w: 160, h: 40,  weight: 0.35 },
            // Si no usas etiqueta en este reto, deja este target como guía opcional (no afecta completitud):
            { type: "comp-etiqueta",         x: 80,  y: 70,  w: 220, h: 32,  weight: 0.20 }
        ],
        tiempoLimite: 300,
        tiempoRecord: null
    }
];

let retoActualIndex = 0;
let score = 0;
let totalPuntos = 0; // NUEVO: acumulador de puntos del juego
let elementoSiendoArrastrado = null;
let offsetX = 0;
let offsetY = 0;
let elementoCounter = 0;

// Referencias del DOM
const btnIniciar = document.getElementById('btn-iniciar');
const pantallaInicio = document.getElementById('pantalla-inicio');
const interfazDisenador = document.getElementById('interfaz-disenador');
const areaDrop = document.getElementById('area-drop');
const componentes = document.querySelectorAll('.componente');
const btnReiniciar = document.getElementById('btn-reiniciar');
const btnRevisar = document.getElementById('btn-revisar');
const btnSiguiente = document.getElementById('btn-siguiente');
const retoHeaderP = document.querySelector('#reto-header p');
const retoActualSpan = document.querySelector('.reto-actual');
const btnSalir = document.getElementById('btn-salir');
const searchInput = document.getElementById('component-search');
const componentGroups = document.querySelectorAll('#panel-componentes .component-group');
const papelera = document.getElementById('papelera');

let tiempoRestante = 0;
let intervaloCronometro = null;
const cronometroDisplay = document.getElementById('cronometro');

// ===============================================
// FUNCIONES DEL CRONÓMETRO
// ===============================================

function formatoTiempo(totalSegundos) {
    const segundosAbsolutos = Math.max(0, totalSegundos);
    const minutos = Math.floor(segundosAbsolutos / 60);
    const segundos = segundosAbsolutos % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function actualizarCronometro() {
    if (tiempoRestante <= 0) {
        detenerCronometro();
        cronometroDisplay.textContent = formatoTiempo(0);
        manejarFinTiempo();
        return;
    }
    tiempoRestante--;
    cronometroDisplay.textContent = formatoTiempo(tiempoRestante);
    if (tiempoRestante <= 60) {
        cronometroDisplay.style.color = '#e74c3c';
        cronometroDisplay.style.borderColor = '#e74c3c';
        cronometroDisplay.classList.add('low-time');
    } else {
        cronometroDisplay.style.color = '#e67e22';
        cronometroDisplay.style.borderColor = '#e67e22';
        cronometroDisplay.classList.remove('low-time');
    }
}

function iniciarCronometro(duracionSegundos) {
    detenerCronometro();
    tiempoRestante = duracionSegundos;
    cronometroDisplay.textContent = formatoTiempo(tiempoRestante);
    intervaloCronometro = setInterval(actualizarCronometro, 1000);
    cronometroDisplay.classList.remove('low-time');
    cronometroDisplay.style.color = '#e67e22';
    cronometroDisplay.style.borderColor = '#e67e22';
}

function detenerCronometro() {
    if (intervaloCronometro) clearInterval(intervaloCronometro);
    intervaloCronometro = null;
}

function manejarFinTiempo() {
    btnRevisar.disabled = true;
    btnReiniciar.disabled = true;
    alert("⌛ ¡Tiempo agotado! No lograste completar el reto a tiempo.");
    btnSiguiente.disabled = false;
}

// ===============================================
// GEOMETRÍA / PUNTUACIÓN DE LAYOUT
// ===============================================

function getRelativeRect(el, container) {
    const cr = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height };
}

function rectIoU(a, b) {
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(a.x + a.w, b.x + b.w);
    const y2 = Math.min(a.y + a.h, b.y + b.h);
    const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const union = a.w * a.h + b.w * b.h - inter;
    if (union <= 0) return 0;
    return inter / union;
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

// Empareja cada target con el elemento del mismo tipo con mayor IoU (greedy por target)
function computeLayoutScore(reto, areaDropEl) {
    const targets = (reto.layoutTargets || []).slice();
    if (targets.length === 0) return { layoutScore: 0, details: [] };

    const weightSum = targets.reduce((s, t) => s + (t.weight || 1), 0) || 1;

    const placed = Array.from(areaDropEl.querySelectorAll('.elemento-en-diseno')).map(el => {
        const type = el.id.replace(/-copia-\d+/, '');
        return { el, type };
    });

    const used = new Set();
    let scoreAccum = 0;
    const details = [];

    for (const tgt of targets) {
        const tRect = { x: tgt.x, y: tgt.y, w: tgt.w, h: tgt.h };
        let best = null;

        for (let i = 0; i < placed.length; i++) {
            if (used.has(i)) continue;
            if (placed[i].type !== tgt.type) continue;
            const r = getRelativeRect(placed[i].el, areaDropEl);
            const iou = rectIoU(r, tRect);
            if (!best || iou > best.iou) best = { idx: i, iou, r };
        }

        const w = (tgt.weight || 1) / weightSum;
        const contrib = best ? best.iou * w : 0;

        if (best) used.add(best.idx);

        scoreAccum += contrib;
        details.push({
            targetType: tgt.type,
            matched: !!best,
            iou: best ? +best.iou.toFixed(3) : 0,
            weight: +w.toFixed(3)
        });
    }

    return { layoutScore: clamp01(scoreAccum), details };
}

// Penalización por solape entre componentes colocados (0..1)
function overlapPenalty(areaDropEl) {
    const els = Array.from(areaDropEl.querySelectorAll('.elemento-en-diseno'));
    if (els.length < 2) return 0;
    let maxPairIoU = 0;
    for (let i = 0; i < els.length; i++) {
        for (let j = i + 1; j < els.length; j++) {
            const a = getRelativeRect(els[i], areaDropEl);
            const b = getRelativeRect(els[j], areaDropEl);
            maxPairIoU = Math.max(maxPairIoU, rectIoU(a, b));
        }
    }
    return clamp01(maxPairIoU); // 0 sin solape, 1 solape total
}

// Dibuja la plantilla/guía en el área de juego
function dibujarPlantilla(reto, areaDropEl) {
    // limpia anteriores
    Array.from(areaDropEl.querySelectorAll('.target-ghost')).forEach(n => n.remove());
    (reto.layoutTargets || []).forEach(t => {
        const g = document.createElement('div');
        g.className = 'target-ghost';
        Object.assign(g.style, {
            position: 'absolute',
            left: t.x + 'px',
            top: t.y + 'px',
            width: t.w + 'px',
            height: t.h + 'px',
            border: '2px dashed rgba(124,58,237,.45)',
            borderRadius: '8px',
            pointerEvents: 'none'
        });
        areaDropEl.appendChild(g);
    });
}

// ===============================================
// FUNCIONES DEL JUEGO
// ===============================================

function reiniciarAreaDiseno() {
    document.querySelectorAll('#area-drop .elemento-en-diseno').forEach(el => el.remove());
    const placeholder = document.getElementById('placeholder-imagen');
    if (placeholder) placeholder.style.display = 'block';
    const reto = retos[retoActualIndex];
    if (reto && reto.tiempoLimite) iniciarCronometro(reto.tiempoLimite);
    btnRevisar.disabled = false;
    btnReiniciar.disabled = false;
}

function cargarReto(index) {
    if (index >= retos.length) {
        retoHeaderP.textContent = "🎉 ¡Juego Terminado! ¡Eres un Diseñador Pro!";
        retoActualSpan.textContent = `Puntuación Final: ${score}/${retos.length}`;
        document.getElementById('controles-inferiores').style.display = 'none';
        let mensajeFinal = "🏆 Resultados del Desafío:\n";
        retos.forEach((r, i) => {
            const tiempo = r.tiempoRecord ? formatoTiempo(r.tiempoRecord) : "N/A";
            mensajeFinal += `\nReto ${i + 1} (${r.titulo}): Tiempo: ${tiempo}`;
        });
        mensajeFinal += `\n\nPuntos totales: ${totalPuntos}`;
        alert(mensajeFinal);
        detenerCronometro();
        return;
    }
    const reto = retos[index];
    let recordText = reto.tiempoRecord ? ` (Récord: ${formatoTiempo(reto.tiempoRecord)})` : '';
    retoHeaderP.textContent = reto.descripcion + recordText;
    retoActualSpan.textContent = `RETO ACTUAL ${index + 1} de ${retos.length}`;
    reiniciarAreaDiseno();
    btnSiguiente.disabled = true;

    // Dibuja guía de targets
    dibujarPlantilla(reto, areaDrop);
}

function verificarReto() {
    if (tiempoRestante <= 0 && !intervaloCronometro) {
        alert("El tiempo ya expiró. Presiona 'Siguiente reto' para continuar.");
        return;
    }

    const reto = retos[retoActualIndex];
    const elementosColocados = document.querySelectorAll('#area-drop .elemento-en-diseno');

    // ----- Completitud -----
    let conteoActual = {};
    elementosColocados.forEach(el => {
        const idOriginal = el.id.replace(/-copia-\d+/, '');
        conteoActual[idOriginal] = (conteoActual[idOriginal] || 0) + 1;
    });

    let faltantes = [];
    for (const [elementoId, cantidadNecesaria] of Object.entries(reto.elementosNecesarios)) {
        const cantidadActual = conteoActual[elementoId] || 0;
        if (cantidadActual < cantidadNecesaria) {
            faltantes.push(`${cantidadNecesaria - cantidadActual}× ${document.getElementById(elementoId).textContent}`);
        }
    }

    const totalRequeridos = Object.values(reto.elementosNecesarios).reduce((a, b) => a + b, 0);
    const totalPresentes = Object.entries(reto.elementosNecesarios)
        .reduce((a, [id, need]) => a + Math.min(need, (conteoActual[id] || 0)), 0);

    const completitud = totalRequeridos > 0 ? (totalPresentes / totalRequeridos) : 1; // 0..1

    // ----- Layout (posición) -----
    const { layoutScore, details } = computeLayoutScore(reto, areaDrop);
    const pen = overlapPenalty(areaDrop); // 0..1
    const layoutConPenalizacion = Math.max(0, layoutScore * (1 - 0.5 * pen)); // hasta -50%

    // ----- Puntos -----
    // Mezcla 50% completitud + 50% layout (ajusta ponderación a tu gusto)
    let puntos = Math.round(100 * (0.5 * completitud + 0.5 * layoutConPenalizacion));

    // Bonus por tiempo (máx +10)
    const bonusTiempo = Math.min(10, Math.floor((tiempoRestante / (reto.tiempoLimite || 1)) * 10));
    puntos += bonusTiempo;

    // Mensaje de detalle
    let mensajeDetalle =
        `Puntuación de layout: ${(layoutScore * 100).toFixed(0)}%` +
        (pen > 0 ? ` (penalización por solapes: ${(pen * 100).toFixed(0)}%)` : ``) +
        `\nCompletitud: ${(completitud * 100).toFixed(0)}%` +
        `\nBonus por tiempo: +${bonusTiempo}` +
        `\n\n➤ Puntos obtenidos: ${puntos}`;

    if (faltantes.length) {
        alert(`🚨 Faltan: ${faltantes.join(', ')}\n\n` + mensajeDetalle + `\n\n¡Sigue ajustando!`);
        btnSiguiente.disabled = true;
        // detalle técnico a consola
        console.table(details);
        return;
    }

    // Si está completo, aprueba y calcula tiempos/records
    detenerCronometro();
    const tiempoUsado = reto.tiempoLimite - tiempoRestante;
    let mensaje = "✅ ¡Diseño APROBADO!\n\n" + mensajeDetalle;

    if (reto.tiempoRecord === null || tiempoUsado < reto.tiempoRecord) {
        reto.tiempoRecord = tiempoUsado;
        mensaje += `\n✨ ¡Nuevo récord! Tiempo: ${formatoTiempo(tiempoUsado)}`;
    } else {
        mensaje += `\nTiempo: ${formatoTiempo(tiempoUsado)}`;
    }

    totalPuntos += puntos;   // acumula puntos del juego
    score++;                 // retos superados
    btnSiguiente.disabled = false;

    // detalle técnico por target
    console.table(details);
    alert(mensaje);
}

function avanzarReto() {
    retoActualIndex++;
    cargarReto(retoActualIndex);
}

// ===============================================
// Botón salir
// ===============================================

function salirAlInicio() {
    if (!confirm("¿Seguro que quieres salir al menú principal? Se perderá el progreso actual.")) return;
    detenerCronometro();
    document.querySelectorAll('#area-drop .elemento-en-diseno').forEach(el => el.remove());
    const placeholder = document.getElementById('placeholder-imagen');
    if (placeholder) placeholder.style.display = 'block';
    retoActualIndex = 0;
    score = 0;
    totalPuntos = 0; // reset de puntos
    interfazDisenador.style.display = 'none';
    pantallaInicio.style.display = 'flex';
    document.body.style.display = 'flex';
}

// ===== dialogo =====
function showMascotIntro() {
    if (localStorage.getItem('skipMascotIntro') === '1') return;

    const mensajes = [
    "¡Hola! Soy Codi.\nTu guía en Design Dash.",
    "Arrastra componentes desde la izquierda\nal área de juego para construir tu UI.",
    "Completa los requisitos del reto y\ncoloca las piezas cerca de la guía punteada.",
    "Cuando estés listo, presiona “Revisar”.\n¡Ganas más puntos si eres preciso y rápido!"
    ];

    let step = 0;
    let typingTimer = null;

    const overlay = document.createElement('div');
    overlay.className = 'mascota-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const modal = document.createElement('div');
    modal.className = 'mascota-modal';
    modal.innerHTML = `
    <div class="mascota-avatar">
        <img src="Assets/Codi_Animado.gif" alt="Codi, la mascota">
    </div>
    <div class="mascota-content">
        <div class="mascota-bubble">
        <div class="mascota-text" id="mascota-text"></div>
        </div>
        <div class="mascota-actions">
        <label class="mascota-left">
            <input type="checkbox" id="skip-intro"> No mostrar de nuevo
        </label>
        <div class="mascota-right">
            <button class="mascota-btn secondary" id="mascota-omitir">Omitir</button>
            <button class="mascota-btn" id="mascota-siguiente">Siguiente</button>
        </div>
        </div>
    </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const textEl = modal.querySelector('#mascota-text');
    const btnNext = modal.querySelector('#mascota-siguiente');
    const btnSkip = modal.querySelector('#mascota-omitir');
    const chkSkip = modal.querySelector('#skip-intro');

    function typeWriter(full, speed = 18) {
    clearInterval(typingTimer);
    textEl.textContent = "";
    let i = 0;
    typingTimer = setInterval(() => {
        textEl.textContent = full.slice(0, i++);
        if (i > full.length) clearInterval(typingTimer);
    }, speed);
    }

    function renderStep() {
    btnNext.textContent = (step < mensajes.length - 1) ? 'Siguiente' : '¡Listo!';
    typeWriter(mensajes[step]);
    }

    function cerrar() {
    clearInterval(typingTimer);
    overlay.remove();
    if (chkSkip.checked) localStorage.setItem('skipMascotIntro', '1');
    }

    btnNext.addEventListener('click', () => {
    if (step < mensajes.length - 1) {
        step++;
        renderStep();
    } else {
        cerrar();
    }
    });

    btnSkip.addEventListener('click', cerrar);

    // Cerrar con ESC / Avanzar con Enter
    function keyHandler(e) {
    if (e.key === 'Escape') { cerrar(); }
    if (e.key === 'Enter') { btnNext.click(); }
    }
    document.addEventListener('keydown', keyHandler);

    // Evita cerrar al hacer click dentro
    modal.addEventListener('click', (e) => e.stopPropagation());
    overlay.addEventListener('click', cerrar);

    // Render inicial
    renderStep();
}

// ===============================================
// EVENTOS PRINCIPALES
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    if (btnIniciar) btnIniciar.addEventListener('click', () => {
        pantallaInicio.style.display = 'none';
        interfazDisenador.style.display = 'flex';
        document.body.style.display = 'block';
        cargarReto(retoActualIndex);

        showMascotIntro();
    });
    if (btnReiniciar) btnReiniciar.addEventListener('click', reiniciarAreaDiseno);
    if (btnRevisar) btnRevisar.addEventListener('click', verificarReto);
    if (btnSiguiente) btnSiguiente.addEventListener('click', avanzarReto);
    if (btnSalir) btnSalir.addEventListener('click', salirAlInicio);

    // DRAG & DROP
    lucide.createIcons();

    componentes.forEach(c => c.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', e.target.id);
        e.dataTransfer.setData('source', 'panel');
    }));

    areaDrop.addEventListener('dragover', e => { e.preventDefault(); areaDrop.classList.add('drag-over'); });
    areaDrop.addEventListener('dragleave', () => areaDrop.classList.remove('drag-over'));
    areaDrop.addEventListener('drop', e => {
        e.preventDefault();
        areaDrop.classList.remove('drag-over');
        const source = e.dataTransfer.getData('source');
        if (source === 'panel') {
            const idOriginal = e.dataTransfer.getData('text/plain');
            const original = document.getElementById(idOriginal);
            const nuevo = original.cloneNode(true);
            elementoCounter++;
            nuevo.removeAttribute('draggable');
            nuevo.classList.remove('componente');
            nuevo.classList.add('elemento-en-diseno');
            nuevo.id = `${idOriginal}-copia-${elementoCounter}`;
            if (nuevo.id.includes('comp-boton-primario')) nuevo.textContent = "Botón de Acción";
            else if (nuevo.id.includes('comp-campo-entrada')) nuevo.textContent = "Campo de Entrada";
            else if (nuevo.id.includes('comp-imagen')) nuevo.textContent = "[Imagen]";
            const rect = areaDrop.getBoundingClientRect();
            const x = e.clientX - rect.left - nuevo.offsetWidth / 2;
            const y = e.clientY - rect.top - nuevo.offsetHeight / 2;
            nuevo.style.position = 'absolute';
            nuevo.style.left = `${Math.max(0, Math.min(x, rect.width - nuevo.offsetWidth))}px`;
            nuevo.style.top = `${Math.max(0, Math.min(y, rect.height - nuevo.offsetHeight))}px`;
            nuevo.setAttribute('draggable', 'true');
            areaDrop.appendChild(nuevo);
            const ph = document.getElementById('placeholder-imagen');
            if (ph) ph.style.display = 'none';
        }
    });
    areaDrop.addEventListener('dragstart', e => {
        if (e.target.classList.contains('elemento-en-diseno')) {
            elementoSiendoArrastrado = e.target;
            const rect = elementoSiendoArrastrado.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            e.dataTransfer.setData('text/plain', elementoSiendoArrastrado.id);
        }
    });
    areaDrop.addEventListener('drop', e => {
        e.preventDefault();
        if (elementoSiendoArrastrado) {
            const rect = areaDrop.getBoundingClientRect();
            const nuevoX = e.clientX - rect.left - offsetX;
            const nuevoY = e.clientY - rect.top - offsetY;
            elementoSiendoArrastrado.style.left = `${Math.max(0, Math.min(nuevoX, rect.width - elementoSiendoArrastrado.offsetWidth))}px`;
            elementoSiendoArrastrado.style.top = `${Math.max(0, Math.min(nuevoY, rect.height - elementoSiendoArrastrado.offsetHeight))}px`;
            elementoSiendoArrastrado = null;
            offsetX = 0;
            offsetY = 0;
        }
    });

    // ===== buscar elementos =====
    function normalizar(texto) {
        return (texto || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''); // quita acentos
    }

    function actualizarContadores() {
        componentGroups.forEach(group => {
            const countEl = group.querySelector('.group-count');
            const visibles = group.querySelectorAll('.group-body .componente:not([data-hidden="true"])').length;
            const total = group.querySelectorAll('.group-body .componente').length;
            if (countEl) countEl.textContent = `${visibles}/${total}`;
            group.classList.toggle('is-empty', visibles === 0);
        });
    }

    function filtrarComponentes(q) {
        const qn = normalizar(q);

        // Mostrar/ocultar componentes
        document.querySelectorAll('#panel-componentes .componente').forEach(card => {
            const text = normalizar(card.textContent);
            const tags = normalizar(card.getAttribute('data-tags'));
            const match = qn === '' || text.includes(qn) || tags.includes(qn);
            card.style.display = match ? '' : 'none';
            card.dataset.hidden = match ? 'false' : 'true';
        });

        // Abrir grupos con coincidencias cuando hay query
        componentGroups.forEach(group => {
            const visibles = group.querySelectorAll('.group-body .componente:not([data-hidden="true"])').length;
            if (qn) {
                group.open = visibles > 0;   // auto-abrir si hay match
            }
        });

        actualizarContadores();
    }

    if (searchInput) {
        actualizarContadores();
        searchInput.addEventListener('input', (e) => filtrarComponentes(e.target.value));
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                filtrarComponentes('');
                e.stopPropagation();
            }
        });
    }

    if (papelera) {
    papelera.addEventListener('dragover', (e) => {
        e.preventDefault();
        papelera.classList.add('drag-over');
    });

    papelera.addEventListener('dragleave', () => {
        papelera.classList.remove('drag-over');
    });

    papelera.addEventListener('drop', (e) => {
        e.preventDefault();
        papelera.classList.remove('drag-over');
        
        const id = e.dataTransfer.getData('text/plain');
        const elemento = document.getElementById(id);

        if (elemento && elemento.classList.contains('elemento-en-diseno')) {
        elemento.remove();
        }
    });
    }
});
