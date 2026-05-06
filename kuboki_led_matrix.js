/**
 * KUBOKI LED MATRIX EXPRESSIONS
 * Sistema de renderizado de expresiones para matrices LED 8x8.
 * Permite mostrar formas como '^ ^' para risas y estados de ánimo.
 */

// Definición de Bitmaps (8x8)
// 0: Apagado, 1: Encendido (Color Principal), 2: Brillo suave
const EXPRESSIONS = {
    HAPPY: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 1, 1, 0],
        [1, 0, 0, 1, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    LAUGHING: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 0, 0, 0, 0, 1, 0],
        [1, 1, 0, 0, 0, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    BLINK: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    NEUTRAL: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 1, 1, 0],
        [0, 1, 1, 0, 0, 1, 1, 0],
        [0, 1, 1, 0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ]
};

/**
 * Renderiza la expresión en la consola y en el DOM si existe
 */
function drawExpression(name, color = "#00FFFF") {
    const matrix = EXPRESSIONS[name] || EXPRESSIONS.NEUTRAL;

    // Consola
    console.log(`\n--- Kuboki Eyes: ${name} ---`);
    matrix.forEach(row => {
        const line = row.map(pixel => (pixel === 1 ? "■" : " ")).join(" ");
        console.log(line);
    });

    // DOM (HTML)
    const face = document.getElementById('kuboki-face');
    if (face) {
        face.innerHTML = '';
        matrix.forEach(row => {
            row.forEach(pixel => {
                const dot = document.createElement('div');
                dot.style.width = '100%';
                dot.style.height = '100%';
                dot.style.borderRadius = '50%';
                if (pixel === 1) {
                    dot.style.background = color;
                    dot.style.boxShadow = `0 0 8px ${color}, 0 0 15px ${color}`;
                } else {
                    dot.style.background = 'rgba(0,0,0,0.2)'; // Falso apagado para que parezca matriz LED
                }
                face.appendChild(dot);
            });
        });
    }
}

/**
 * Secuencia de risa animada
 */
async function animateLaughterSequence() {
    drawExpression('HAPPY');
    const interval = setInterval(() => {
        const rand = Math.random();
        if (rand > 0.5) {
            drawExpression('LAUGHING', "#FF00FF");
        } else {
            drawExpression('HAPPY', "#00FFFF");
        }
    }, 300);

    setTimeout(() => {
        clearInterval(interval);
        drawExpression('NEUTRAL');
    }, 3000);
}

// Exportar para Node.js o Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { drawExpression, animateLaughterSequence, EXPRESSIONS };
} else {
    window.drawExpression = drawExpression;
    window.animateLaughterSequence = animateLaughterSequence;
    window.EXPRESSIONS = EXPRESSIONS;
    
    // Auto-dibujar neutral al cargar
    window.addEventListener('DOMContentLoaded', () => {
        drawExpression('NEUTRAL', '#00FFFF');
    });
}
