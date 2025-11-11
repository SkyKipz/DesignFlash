// ===============================================
// ESTADO DEL JUEGO Y DEFINICIÓN DE RETOS
// ===============================================

const retos = [
    {
        id: 1,
        titulo: "Página de Animales Extintos",
        descripcion: "Crea una página de información simple. Usa un header, un título, una imagen, dos áreas de texto y un botón secundario.",
        elementosNecesarios: {
            "comp-header": 1,
            "comp-titulo": 1,
            "comp-imagen": 1,
            "comp-area-texto": 2,
        },
        // ===== Plantilla de layout (en px relativos al #area-drop) =====
        layoutTargets: [
            { type: "comp-header",         x: 8,  y: 20,  w: 1570, h: 80,  weight: 0.20 },
            { type: "comp-titulo",         x: 550,  y: 120,  w: 470, h: 60,  weight: 0.20 },
            { type: "comp-imagen",         x: 350,  y: 220, w: 320, h: 320, weight: 0.20 },
            { type: "comp-area-texto",     x: 750, y: 220, w: 400, h: 160,  weight: 0.15 },
            { type: "comp-area-texto",     x: 750, y: 400, w: 400, h: 160,  weight: 0.15 },
            { type: "comp-boton-secundario", x: 420, y: 550, w: 190, h: 50,  weight: 0.10 }
        ],
        tiempoLimite: 300,
        tiempoRecord: null,
        spriteSet: 'nivel1',
        spriteOverrides: {},
        fondo: {
            background: 'url("Assets/fondos/nivel1.png")',
            size: 'cover',
            position: 'top center',
            opacity: 0.70
        },
    },
    {
        id: 2,
        titulo: "Formulario de Contacto",
        descripcion: "Arma la portada de 'Café Frida': incluye un header, un título, una imagen destacada, dos áreas de texto descriptivo, un campo de entrada y dos botones.",
        elementosNecesarios: {
            "comp-header": 1,
            "comp-titulo": 1,
            "comp-imagen": 1,
            "comp-area-texto": 2,
            "comp-campo-entrada": 1,
            "comp-boton-primario": 1,
            "comp-boton-secundario": 1,
        },
        layoutTargets: [
            { type: "comp-header",         x: 8,  y: 20,  w: 1570, h: 120,  weight: 0.20 },
            { type: "comp-titulo", x: 500, y: 160, w: 500, h: 70, weight: 0.10 },
            { type: "comp-imagen", x: 160, y: 270, w: 320, h: 320, weight: 0.15 },
            { type: "comp-area-texto", x: 520, y: 280, w: 270, h: 170, weight: 0.10 },
            { type: "comp-area-texto", x: 800, y: 280, w: 270, h: 170, weight: 0.10 },
            { type: "comp-campo-entrada", x: 1050, y: 170, w: 330, h: 50, weight: 0.10 },
            { type: "comp-boton-primario", x: 540, y: 470, w: 180, h: 50, weight: 0.15 },
            { type: "comp-boton-secundario", x: 800, y: 470, w: 180, h: 50, weight: 0.10 },
        ],
        tiempoLimite: 300,
        tiempoRecord: null,
        spriteSet: 'nivel2',
        spriteOverrides: {},
        fondo: {
            background: 'url("Assets/fondos/nivel2.png")',
            size: 'cover',
            position: 'top center',
            opacity: 0.70
        },
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
const STORAGE_KEY = 'designDashProgress_v1';
const btnBorrar = document.getElementById('btn-borrar-progreso');
const ACH_STORAGE_KEY = 'designDashAchievements_v1';
const LB_KEY = 'designDashLeaderboard_v1';
const ACHIEVEMENTS = [
  { id: 'welcome',   title: '¡Bienvenido, Diseñador!', desc: 'Completa tu primer reto.', icon: '👋' },
  { id: 'architect', title: 'El Arquitecto Nace',      desc: 'Arrastra y suelta tu primer elemento de interfaz.', icon: '🏗️' },
  { id: 'marathon',  title: 'Maratón de Diseño',       desc: 'Completa los 2 niveles.', icon: '🏁' },
  { id: 'symmetry',  title: 'Simetría Perfecta',       desc: 'Crea un diseño perfectamente simétrico.', icon: '🪞' },
  { id: 'speedrun',  title: 'Contrarreloj',            desc: 'Completa un desafío con tiempo restante significativo.', icon: '⏱️' },
  { id: 'patpat',    title: 'Pat Pat',                 desc: 'Haz click en Codi el camaleón.', icon: '🦎' }
];
const SPRITE_SETS = {
  nivel1: {
    "comp-boton-primario": { src: "Assets/sprites/nivel1/boton-primario.png", w: 320, h: 88,  cls: "sprite--button sprite--nivel1" },
    "comp-boton-secundario":{ src: "Assets/sprites/nivel1/boton-secundario.png", w: 190, h: 90,  cls: "sprite--button sprite--nivel1" },
    "comp-campo-entrada":   { src: "Assets/sprites/nivel1/campo-de-texto.png", w: 640, h: 88,  cls: "sprite--input  sprite--nivel1" },
    "comp-area-texto":      { src: "Assets/sprites/nivel1/tarjeta-de-texto.png", w: 370, h: 150,  cls: "sprite--input  sprite--nivel1" },
    "comp-imagen":          { src: "Assets/sprites/nivel1/image.png", w: 280, h: 280, cls: "sprite--image  sprite--nivel1" },
    "comp-header":          { src: "Assets/sprites/nivel1/header.png", w: 1540, h: 72,  cls: "sprite--header sprite--nivel1" },
    "comp-titulo":          { src: "Assets/sprites/nivel1/titulo-web.png", w: 440, h: 280, cls: "sprite--title  sprite--nivel1" },
  },                                
  nivel2: {
    "comp-boton-primario": { src: "Assets/sprites/nivel2/boton-primario.png", w: 320, h: 88,  cls: "sprite--button sprite--nivel2" },
    "comp-boton-secundario":{ src: "Assets/sprites/nivel2/boton-secundario.png", w: 190, h: 90,  cls: "sprite--button sprite--nivel2" },
    "comp-campo-entrada":   { src: "Assets/sprites/nivel2/campo-de-texto.png", w: 640, h: 88,  cls: "sprite--input  sprite--nivel2" },
    "comp-area-texto":      { src: "Assets/sprites/nivel2/tarjeta-de-texto.png", w: 370, h: 150,  cls: "sprite--input  sprite--nivel2" },
    "comp-imagen":          { src: "Assets/sprites/nivel2/image.png", w: 280, h: 280, cls: "sprite--image  sprite--nivel2" },
    "comp-header":          { src: "Assets/sprites/nivel2/header.png", w: 1540, h: 100,  cls: "sprite--header sprite--nivel2" },
    "comp-titulo":          { src: "Assets/sprites/nivel2/titulo-web.png", w: 440, h: 280, cls: "sprite--title  sprite--nivel2" },
  }
};

let CURRENT_SPRITE_SET = 'nivel1';

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
        cronometroDisplay.style.color = '#ffffff';
        cronometroDisplay.style.borderColor = '#ffffff';
        cronometroDisplay.classList.remove('low-time');
    }
}

function iniciarCronometro(duracionSegundos) {
    detenerCronometro();
    tiempoRestante = duracionSegundos;
    cronometroDisplay.textContent = formatoTiempo(tiempoRestante);
    intervaloCronometro = setInterval(actualizarCronometro, 1000);
    cronometroDisplay.classList.remove('low-time');
    cronometroDisplay.style.color = '#ffffff';
    cronometroDisplay.style.borderColor = '#ffffff';
}

function detenerCronometro() {
    if (intervaloCronometro) clearInterval(intervaloCronometro);
    intervaloCronometro = null;
}

function manejarFinTiempo() {
    btnRevisar.disabled = true;
    btnReiniciar.disabled = true;
    alert("⌛ ¡Tiempo agotado! No lograste completar el reto a tiempo.");
    setDivDisabled('btn-siguiente', false);
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
    aplicarFondoReto(reto);
    CURRENT_SPRITE_SET = reto?.spriteSet || 'nivel1';
    let recordText = reto.tiempoRecord ? ` (Récord: ${formatoTiempo(reto.tiempoRecord)})` : '';
    retoHeaderP.textContent = reto.descripcion + recordText;
    retoActualSpan.textContent = `RETO ACTUAL ${index + 1} de ${retos.length}`;
    reiniciarAreaDiseno();
    setDivDisabled('btn-siguiente', true);

    // Dibuja guía de targets
    dibujarPlantilla(reto, areaDrop);
}

function verificarReto() {
    if (tiempoRestante <= 0 && !intervaloCronometro) {
        alert("El tiempo ya expiró. Presiona 'Siguiente reto' para continuar.");
        // Guarda dónde nos quedamos para retomar
        const p = loadProgress();
        p.lastRetoIndex = retoActualIndex;
        saveProgress(p);
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
        const nombre = document.getElementById(elementoId)?.textContent || elementoId;
        faltantes.push(`${cantidadNecesaria - cantidadActual}× ${nombre}`);
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
    // Mezcla 50% completitud + 50% layout
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

    // Si faltan componentes, no aprueba
    if (faltantes.length) {
        alert(`🚨 Faltan: ${faltantes.join(', ')}\n\n${mensajeDetalle}\n\n¡Sigue ajustando!`);
        setDivDisabled('btn-siguiente', true);

        // Guarda lugar para retomar
        const p = loadProgress();
        p.lastRetoIndex = retoActualIndex;
        saveProgress(p);

        console.table(details); // diagnóstico
        return;
    }

    // ----- Aprobado -----
    detenerCronometro();
    const tiempoUsado = reto.tiempoLimite - tiempoRestante;
    let mensaje = "✅ ¡Diseño APROBADO!\n\n" + mensajeDetalle;

    if (reto.tiempoRecord === null || tiempoUsado < reto.tiempoRecord) {
        reto.tiempoRecord = tiempoUsado;
        mensaje += `\n✨ ¡Nuevo récord! Tiempo: ${formatoTiempo(tiempoUsado)}`;
    } else {
        mensaje += `\nTiempo: ${formatoTiempo(tiempoUsado)}`;
    }

    // Habilitar "Siguiente"
    setDivDisabled('btn-siguiente', false);

    // Acumular puntos en la sesión actual
    totalPuntos += puntos;
    score++;

    // ===== Guardar progreso persistente =====
    const progress = loadProgress();
    const id = reto.id;

    // Mejor puntaje por reto
    const previo = progress.puntosPorReto?.[id] || 0;
    progress.puntosPorReto = progress.puntosPorReto || {};
    progress.puntosPorReto[id] = Math.max(previo, puntos);

    // Marcar reto como pasado
    progress.passedPorReto = progress.passedPorReto || {};
    progress.passedPorReto[id] = true;

    // Recalcular total de puntos (suma mejores)
    progress.totalPuntos = Object.values(progress.puntosPorReto).reduce((a, b) => a + b, 0);

    // Dónde retomar: primer reto no pasado (o el siguiente si todos pasados)
    progress.lastRetoIndex = computeResumeIndex(progress);

    unlockAchievement('welcome');
    // 2) Contrarreloj (ej.: si terminas con ≥ 25% de tiempo restante)
    const ratioTiempo = (tiempoRestante / (reto.tiempoLimite || 1));
    if (ratioTiempo >= 0.25) unlockAchievement('speedrun');

    if (checkSymmetry(areaDrop)) unlockAchievement('symmetry');

    saveProgress(progress);

    const todosPasados = retos.every(r => progress.passedPorReto[r.id]);
    if (todosPasados) unlockAchievement('marathon');

    if (allLevelsCompleted(progress)) {
        const finalScore = typeof totalPuntos !== 'undefined' ? totalPuntos : (progress.totalPuntos || 0);
        promptScoreAndSave(finalScore);
    }
    // ========================================

    console.table(details); // diagnóstico por target
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
    const progress = loadProgress();

    if (allLevelsCompleted(progress)) {
        // 👇 Sin confirmación si ya terminó todo
        prepareNewRun();  // reinicia la vuelta, conserva logros y récords por reto

        // Limpia UI del área
        detenerCronometro();
        document.querySelectorAll('#area-drop .elemento-en-diseno').forEach(el => el.remove());
        const placeholder = document.getElementById('placeholder-imagen');
        if (placeholder) placeholder.style.display = 'block';

        // Vuelve al menú
        interfazDisenador.style.display = 'none';
        pantallaInicio.style.display = 'flex';
        document.body.style.display = 'flex';

        return;
    }

    // 🔒 Si NO terminó todos, mantener confirmación
    if (!confirm("¿Seguro que quieres salir al menú principal? Se perderá el progreso actual.")) return;

    detenerCronometro();
    document.querySelectorAll('#area-drop .elemento-en-diseno').forEach(el => el.remove());
    const placeholder = document.getElementById('placeholder-imagen');
    if (placeholder) placeholder.style.display = 'block';

    // No reseteamos localStorage aquí (conserva avance/retomar)
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
        <img src="Assets/Codi_Hablando.gif" alt="Codi, la mascota">
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

    const codiIntroImg = modal.querySelector('.mascota-avatar img');
    if (codiIntroImg) {
    codiIntroImg.style.cursor = 'pointer';
    codiIntroImg.addEventListener('click', () => {
        // Si tienes helpers de logros:
        if (typeof unlockAchievement === 'function') {
        const justUnlocked = unlockAchievement('patpat');
        if (justUnlocked) {
            // feedback visual rápido
            codiIntroImg.classList.add('patpat-anim');
            setTimeout(() => codiIntroImg.classList.remove('patpat-anim'), 500);
        }
        } else {
        // Fallback sin helpers: marcar directamente en localStorage
        try {
            const key = 'designDashAchievements_v1';
            const map = JSON.parse(localStorage.getItem(key) || '{}');
            if (!map.patpat) {
            map.patpat = { unlockedAt: Date.now() };
            localStorage.setItem(key, JSON.stringify(map));
            }
        } catch {}
        }
    });
    }

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

function setDivDisabled(elOrId, disabled) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;
    el.setAttribute('aria-disabled', disabled ? 'true' : 'false');
}

function isDivDisabled(elOrId) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    return el && el.getAttribute('aria-disabled') === 'true';
}

function loadProgress() {
    try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { puntosPorReto: {}, passedPorReto: {}, totalPuntos: 0, lastRetoIndex: 0 };
    const data = JSON.parse(raw);
    // sane defaults
    return {
        puntosPorReto: data.puntosPorReto || {},
        passedPorReto: data.passedPorReto || {},
        totalPuntos: typeof data.totalPuntos === 'number' ? data.totalPuntos : 0,
        lastRetoIndex: typeof data.lastRetoIndex === 'number' ? data.lastRetoIndex : 0,
    };
    } catch {
    return { puntosPorReto: {}, passedPorReto: {}, totalPuntos: 0, lastRetoIndex: 0 };
    }
}

function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// Devuelve el índice del primer reto NO pasado; si todos pasados, el último
function computeResumeIndex(progress) {
    for (let i = 0; i < retos.length; i++) {
    const id = retos[i].id;
    if (!progress.passedPorReto[id]) return i;
    }
    return Math.min(retos.length - 1, progress.lastRetoIndex || 0);
}

// Nueva partida
function resetProgress() {
  localStorage.removeItem('designDashProgress_v1');
  localStorage.removeItem('skipMascotIntro');
  // NUEVO: limpia logros (opcional)
  localStorage.removeItem(ACH_STORAGE_KEY);
  alert("Progreso y logros borrados.");
}


function aplicarFondoReto(reto) {
    const f = reto?.fondo || {};
    areaDrop.style.setProperty('--drop-bg', f.background || 'none');
    areaDrop.style.setProperty('--drop-bg-size', f.size || 'cover');
    areaDrop.style.setProperty('--drop-bg-pos', f.position || 'top center');
    areaDrop.style.setProperty('--drop-bg-opacity', String(f.opacity ?? 0.25));
}

function applySprite(el, baseType) {
    const cfg = SPRITES[baseType];
    if (!cfg) return false;

    el.classList.add('sprite');
    if (cfg.cls) el.classList.add(cfg.cls);

    // Tamaño fijo (puedes hacerlo resizable en otra mejora)
    el.style.width  = cfg.w + 'px';
    el.style.height = cfg.h + 'px';

    el.style.backgroundImage = `url("${cfg.src}")`;

    // Oculta cualquier texto placeholder
    el.textContent = '';
    return true;
}

// Extrae el tipo base "comp-xxx" de un id que puede ser copia
function baseTypeFromId(id) {
    return id.replace(/-copia-\d+$/, '');
}

function getSpriteConfig(baseType) {
    const reto = retos[retoActualIndex];
    // override por reto
    if (reto?.spriteOverrides && reto.spriteOverrides[baseType]) {
    return reto.spriteOverrides[baseType];
    }
    // del set activo
    const setName = reto?.spriteSet || CURRENT_SPRITE_SET || 'nivel1';
    const set = SPRITE_SETS[setName] || SPRITE_SETS.nivel1;
    return set[baseType];
}

function applySprite(el, baseType) {
    const cfg = getSpriteConfig(baseType);
    if (!cfg) return false;

    el.classList.add('sprite');
    if (cfg.cls) {
    cfg.cls.split(/\s+/).forEach(c => c && el.classList.add(c));
    }

    // Tamaño/imagen
    el.style.width  = cfg.w + 'px';
    el.style.height = cfg.h + 'px';
    el.style.backgroundImage = `url("${cfg.src}")`;

    // Limpia cualquier texto placeholder
    el.textContent = '';
    return true;
}

function loadAchievements() {
    try {
        return JSON.parse(localStorage.getItem(ACH_STORAGE_KEY)) || {};
    } catch { return {}; }
}

function saveAchievements(map) {
    localStorage.setItem(ACH_STORAGE_KEY, JSON.stringify(map || {}));
}

function isAchUnlocked(id) {
    const map = loadAchievements();
    return !!map[id];
}

function unlockAchievement(id) {
    const map = loadAchievements();
    if (map[id]) return false; // ya estaba
    map[id] = { unlockedAt: Date.now() };
    saveAchievements(map);
    // feedback rápido
    console.log('🏆 Logro desbloqueado:', id);
    // si quieres, muestra un toast / mini badge aquí
    return true;
}

function renderAchievementsModal() {
    const grid = document.getElementById('ach-grid');
    if (!grid) return;
    const map = loadAchievements();
    grid.innerHTML = '';

    ACHIEVEMENTS.forEach(a => {
        const unlocked = !!map[a.id];
        const card = document.createElement('div');
        card.className = 'ach-card' + (unlocked ? ' unlocked' : '');
        card.innerHTML = `
            <div class="ach-badge">Desbloqueado</div>
            <div class="ach-icon-frame ${unlocked ? '' : 'ach-locked'}">
                <img src="Assets/logros/${a.id}.png" alt="${a.title}">
            </div>
            <div class="ach-title">${a.title}</div>
            <div class="ach-desc">${a.desc}</div>
        `;
        grid.appendChild(card);
    });
}

function openAchievements() {
    renderAchievementsModal();
    const ov = document.getElementById('achievements-overlay');
    if (ov) ov.setAttribute('aria-hidden', 'false');
}

function closeAchievements() {
    const ov = document.getElementById('achievements-overlay');
    if (ov) ov.setAttribute('aria-hidden', 'true');
}

function checkSymmetry(area) {
    const els = Array.from(area.querySelectorAll('.elemento-en-diseno'));
    if (els.length < 2) return false;

    const centerX = area.clientWidth / 2;
    const tol = 8; // tolerancia en px
    // Representa por baseType y por "lado"
    const items = els.map(el => {
        const rect = el.getBoundingClientRect();
        const parentRect = area.getBoundingClientRect();
        const left = parseFloat(el.style.left) || (rect.left - parentRect.left + area.scrollLeft);
        const top  = parseFloat(el.style.top)  || (rect.top  - parentRect.top  + area.scrollTop);
        return {
        base: el.id.replace(/-copia-\d+$/, ''),
        x: left, y: top, w: el.offsetWidth, h: el.offsetHeight
        };
    });

    // Intenta emparejar cada elemento con su espejo
    let paired = 0, used = new Set();
    for (let i = 0; i < items.length; i++) {
        if (used.has(i)) continue;
        const a = items[i];
        // coordenada espejo ideal
        const mirrorX = 2*centerX - (a.x + a.w);
        for (let j = i + 1; j < items.length; j++) {
        if (used.has(j)) continue;
        const b = items[j];
        if (a.base !== b.base) continue;
        const sameY = Math.abs(a.y - b.y) <= tol;
        const sameW = Math.abs(a.w - b.w) <= tol;
        const mirrored = Math.abs(b.x - mirrorX) <= tol;
        if (sameY && sameW && mirrored) {
            used.add(i); used.add(j);
            paired += 2;
            break;
        }
        }
    }

    // Si el 100% están emparejados (o ≥ 80% si quieres permisivo)
    const ratio = paired / items.length;
    const ok = ratio >= 0.8;
    return ok;
}

function allLevelsCompleted(progress) {
    if (!progress?.passedPorReto) return false;
    return retos.every(r => !!progress.passedPorReto[r.id]);
}

// Resetea SOLO el progreso de la vuelta actual (no logros ni récords por reto)
function prepareNewRun() {
    const p = loadProgress();
    p.passedPorReto = {};      // vuelves a jugar todos
    p.totalPuntos = 0;         // puntaje de la vuelta se reinicia
    p.lastRetoIndex = 0;       // arranca en nivel 1
    saveProgress(p);
}

function loadLeaderboard() {
    try { return JSON.parse(localStorage.getItem(LB_KEY)) || []; }
    catch { return []; }
}

function saveLeaderboard(arr) {
    localStorage.setItem(LB_KEY, JSON.stringify(arr || []));
}

function addLeaderboardEntry(name, score) {
    const list = loadLeaderboard();
    list.push({ name: name || 'Anónimo', score: Number(score)||0, ts: Date.now() });
    // ordenar por score desc, luego por fecha asc (antiguo primero si empata)
    list.sort((a,b) => b.score - a.score || a.ts - b.ts);
    // recortar (por ejemplo top 50)
    saveLeaderboard(list.slice(0, 50));
}

function openRanking() {
    renderRanking();
    document.getElementById('ranking-overlay')?.setAttribute('aria-hidden','false');
}

function closeRanking() {
    document.getElementById('ranking-overlay')?.setAttribute('aria-hidden','true');
}

function renderRanking() {
    const ul = document.getElementById('rk-list');
    if (!ul) return;
    const list = loadLeaderboard();
    ul.innerHTML = '';
    if (list.length === 0) {
        ul.innerHTML = '<li><span class="rk-name">Aún no hay puntajes.</span><span class="rk-score">—</span></li>';
        return;
    }
    list.forEach((e,i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="rk-name">${i+1}. ${e.name}</span><span class="rk-score">${e.score} pts</span>`;
        ul.appendChild(li);
    });
}

function promptScoreAndSave(finalScore, onDone) {
    const ov = document.getElementById('score-name-overlay');
    const input = document.getElementById('sn-input');
    const scoreEl = document.getElementById('sn-score');
    const btnSave = document.getElementById('sn-save');
    const btnCancel = document.getElementById('sn-cancel');
    if (!ov || !input || !scoreEl || !btnSave || !btnCancel) {
        onDone && onDone();
        return;
    }

    scoreEl.textContent = `Puntos: ${finalScore}`;
    ov.setAttribute('aria-hidden', 'false');

    const lastName = localStorage.getItem('lastPlayerName') || '';
    input.value = lastName;

    function close() {
        ov.setAttribute('aria-hidden', 'true');
        btnSave.removeEventListener('click', onSave);
        btnCancel.removeEventListener('click', onCancel);
        onDone && onDone();
    }
    function onSave() {
        const name = (input.value || '').trim() || 'Anónimo';
        localStorage.setItem('lastPlayerName', name);
        addLeaderboardEntry(name, finalScore); // ya la tienes
        openRanking();                         // opcional: mostrar ranking al guardar
        close();
    }
    function onCancel() { close(); }

    btnSave.addEventListener('click', onSave);
    btnCancel.addEventListener('click', onCancel);
}

// ===============================================
// EVENTOS PRINCIPALES
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    if (btnIniciar) btnIniciar.addEventListener('click', () => {
        pantallaInicio.style.display = 'none';
        interfazDisenador.style.display = 'flex';
        document.body.style.display = 'block';
        const progress = loadProgress();
        retoActualIndex = computeResumeIndex(progress);

        totalPuntos = progress.totalPuntos || 0;
        score = Object.values(progress.passedPorReto).filter(Boolean).length;

        cargarReto(retoActualIndex);

        // === Intro de la mascota solo en el reto 1 ===
        if (typeof showMascotIntro === 'function' && retoActualIndex === 0) {
            showMascotIntro();
        }
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
    areaDrop.addEventListener('drop', (e) => {
        e.preventDefault();
        areaDrop.classList.remove('drag-over');

        const source = e.dataTransfer.getData('source');
        if (source !== 'panel') return;

        if (typeof unlockAchievement === 'function') {
            unlockAchievement('architect');
        }    

        const idOriginal = e.dataTransfer.getData('text/plain');
        const original = document.getElementById(idOriginal);
        if (!original) return;

        // Clonar
        const nuevo = original.cloneNode(true);
        elementoCounter++;

        // Limpiar/ajustar clases
        nuevo.removeAttribute('draggable');
        nuevo.classList.remove('componente');
        nuevo.classList.add('elemento-en-diseno');
        nuevo.id = `${idOriginal}-copia-${elementoCounter}`;

        // === APLICAR SPRITE SEGÚN EL RETO ===
        const baseType = baseTypeFromId(idOriginal);
        const hadSprite = applySprite(nuevo, baseType);

        // Fallback si no hay sprite definido para este tipo
        if (!hadSprite) {
            if (baseType.includes('comp-boton-primario')) nuevo.textContent = "Botón de Acción";
            else if (baseType.includes('comp-campo-entrada')) nuevo.textContent = "Campo de Entrada";
            else if (baseType.includes('comp-imagen')) nuevo.textContent = "[Imagen]";
        }

        // Colocación (centrado donde soltó)
        const rect = areaDrop.getBoundingClientRect();

        // Usa tamaño conocido si hay sprite; si no, usa offsetWidth/Height tras añadir al DOM
        let placeW, placeH;
        const cfg = getSpriteConfig(baseType);
        if (cfg) {
            placeW = cfg.w;
            placeH = cfg.h;
            // anticipamos tamaño exacto
            nuevo.style.width  = placeW + 'px';
            nuevo.style.height = placeH + 'px';
        }

        // Añade temporalmente para medir si no hay cfg
        if (!cfg) {
            nuevo.style.position = 'absolute';
            nuevo.style.left = '-9999px';
            nuevo.style.top  = '-9999px';
            areaDrop.appendChild(nuevo);
            placeW = nuevo.offsetWidth;
            placeH = nuevo.offsetHeight;
            nuevo.remove(); // reubicaremos bien
        }

        const x = e.clientX - rect.left - (placeW / 2);
        const y = e.clientY - rect.top  - (placeH / 2);

        nuevo.style.position = 'absolute';
        nuevo.style.left = `${Math.max(0, Math.min(x, rect.width  - placeW))}px`;
        nuevo.style.top  = `${Math.max(0, Math.min(y, rect.height - placeH))}px`;

        // Rehabilita drag interno
        nuevo.setAttribute('draggable', 'true');

        // Inserta definitivamente
        areaDrop.appendChild(nuevo);

        // Oculta placeholder si aplica
        const ph = document.getElementById('placeholder-imagen');
        if (ph) ph.style.display = 'none';
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

    if (btnBorrar) {
    btnBorrar.addEventListener('click', () => {
        if (confirm("¿Seguro que quieres borrar todo tu progreso? No podrás deshacer esta acción.")) {
        resetProgress();
        }
    });
    }
    const btnLogros = document.getElementById('btn-logros');
    if (btnLogros) btnLogros.addEventListener('click', openAchievements);

    const achClose = document.getElementById('ach-close');
    if (achClose) achClose.addEventListener('click', closeAchievements);

    const achOverlay = document.getElementById('achievements-overlay');
    if (achOverlay) {
        achOverlay.addEventListener('click', (e) => {
            if (e.target === achOverlay) closeAchievements();
        });
    }
    // Ranking: abrir/cerrar
    document.getElementById('btn-ranking')?.addEventListener('click', openRanking);
    document.getElementById('rk-close')?.addEventListener('click', closeRanking);
    document.getElementById('ranking-overlay')?.addEventListener('click', (e)=>{
    if (e.target.id === 'ranking-overlay') closeRanking();
    });

    // Modal de nombre: cerrar al click fuera (opcional, aquí no cierro para obligar a elegir)
    document.getElementById('score-name-overlay')?.addEventListener('click', (e)=>{
    // si quieres cerrar haciendo click fuera, descomenta:
    // if (e.target.id === 'score-name-overlay') e.currentTarget.setAttribute('aria-hidden','true');
    });
});
