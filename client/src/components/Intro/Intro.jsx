import { useEffect, useRef, useState } from 'react';
import styles from './Intro.module.css';

// Intro con efecto shimmer basado en el pen ogNENjE de @jshmllr en CodePen.
// Un canvas dibuja una malla de círculos con opacidad aleatoria; sobre él
// se aplica una máscara con ruido de Perlin repetida horizontalmente que
// se desliza en bucle. El resultado son "olas" de brillo verde que atraviesan
// el patrón, con el símbolo de la marca estable centrado por encima.

// Implementación de Perlin noise 2D. Idéntica a la del pen original.
class PerlinNoise {
    constructor() {
        this.p = new Array(512);
        for (let i = 0; i < 256; i++) {
            this.p[i] = this.p[i + 256] = Math.floor(Math.random() * 256);
        }
    }
    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }
    grad(hash, x, y) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    noise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        const u = this.fade(x);
        const v = this.fade(y);
        const A = this.p[X] + Y;
        const B = this.p[X + 1] + Y;
        return this.lerp(v,
            this.lerp(u, this.grad(this.p[A], x, y), this.grad(this.p[B], x - 1, y)),
            this.lerp(u, this.grad(this.p[A + 1], x, y - 1), this.grad(this.p[B + 1], x - 1, y - 1))
        );
    }
    generatePerlinNoise(width, height, cellSize) {
        const c = document.createElement('canvas');
        c.width = width;
        c.height = height;
        const cctx = c.getContext('2d');
        const img = cctx.createImageData(width, height);
        const data = img.data;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const value = ((this.noise(x / cellSize, y / cellSize) + 1) / 2) * 255;
                const cell = (x + y * width) * 4;
                data[cell] = data[cell + 1] = data[cell + 2] = value;
                data[cell + 3] = 255;
            }
        }
        cctx.putImageData(img, 0, 0);
        return c;
    }
    createSeamlessPerlinNoise(width, height, cellSize) {
        const single = this.generatePerlinNoise(width, height, cellSize);
        const seam = document.createElement('canvas');
        seam.width = width * 4;
        seam.height = height;
        const sctx = seam.getContext('2d');
        sctx.drawImage(single, 0, 0);
        sctx.save();
        sctx.translate(width * 2, 0);
        sctx.scale(-1, 1);
        sctx.drawImage(single, 0, 0);
        sctx.restore();
        sctx.drawImage(single, width * 2, 0);
        sctx.save();
        sctx.translate(width * 4, 0);
        sctx.scale(-1, 1);
        sctx.drawImage(single, 0, 0);
        sctx.restore();
        return seam.toDataURL();
    }
}

export default function Intro({ onFinish }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [saliendo, setSaliendo] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        const perlin = new PerlinNoise();

        const settings = {
            size: 5,
            gap: 8,
            color: 'rgb(62, 248, 126)',
            contrast: 2,
            speed: 32,
        };

        const randomOpacity = () => {
            let o = Math.random();
            if (settings.contrast > 0) {
                o = Math.pow(o, 1 + settings.contrast / 5);
            }
            return o;
        };

        const drawShapes = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const step = settings.size + settings.gap;
            for (let y = 0; y < canvas.height; y += step) {
                for (let x = 0; x < canvas.width; x += step) {
                    const o = randomOpacity();
                    ctx.fillStyle = settings.color.replace(')', `,${o})`).replace('rgb', 'rgba');
                    ctx.beginPath();
                    ctx.arc(
                        x + settings.size / 2,
                        y + settings.size / 2,
                        settings.size / 2,
                        0, Math.PI * 2
                    );
                    ctx.fill();
                }
            }
        };

        const applyMask = () => {
            const width = canvas.width;
            const height = canvas.height;
            const cellSize = Math.max(25, settings.size * 2);
            const dataUrl = perlin.createSeamlessPerlinNoise(width, height, cellSize);

            const sizeFactor = Math.max(1, settings.size / 3);
            const baseValue = width * 2250 * sizeFactor;
            const maxSpeed = 100;
            const powerFactor = Math.log(baseValue / (baseValue / 100)) / Math.log(maxSpeed);
            const duration = Math.round(baseValue / Math.pow(settings.speed, powerFactor));
            const maskTravel = 300 * (settings.size / 10);

            let styleTag = document.getElementById('intro-mask-anim');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'intro-mask-anim';
                document.head.appendChild(styleTag);
            }
            styleTag.textContent = `
        @keyframes introMoveMask {
          0%   { mask-position: 0% 0%;    -webkit-mask-position: 0% 0%; }
          100% { mask-position: -${maskTravel}% 0%; -webkit-mask-position: -${maskTravel}% 0%; }
        }
      `;

            canvas.style.maskImage = `url(${dataUrl})`;
            canvas.style.webkitMaskImage = `url(${dataUrl})`;
            canvas.style.maskMode = 'luminance';
            canvas.style.webkitMaskMode = 'luminance';
            canvas.style.maskSize = `${300 * sizeFactor}% 100%`;
            canvas.style.webkitMaskSize = `${300 * sizeFactor}% 100%`;
            canvas.style.maskRepeat = 'repeat-x';
            canvas.style.webkitMaskRepeat = 'repeat-x';
            canvas.style.animation = `introMoveMask ${duration}ms linear infinite`;
            canvas.style.willChange = 'mask-position';
        };

        const resize = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            drawShapes();
            applyMask();
        };
        resize();
        window.addEventListener('resize', resize);

        return () => {
            window.removeEventListener('resize', resize);
        };
    }, []);

    useEffect(() => {
        const t1 = setTimeout(() => setSaliendo(true), 2000);
        const t2 = setTimeout(() => onFinish(), 2600);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [onFinish]);

    return (
        <div className={`${styles.intro} ${saliendo ? styles.saliendo : ''}`} aria-hidden="true">
            <div ref={containerRef} className={styles.shimmerContainer}>
                <canvas ref={canvasRef} className={styles.canvas} />
                <div className={styles.overlay} />
                <div className={styles.logoWrapper}>
                    {/* Solo el símbolo A de la marca, sin el wordmark. Coherente con
              el favicon: es el "icono" de la marca en su forma más limpia
              y encaja mejor con el efecto shimmer que un logo horizontal. */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 75 50"
                        width="90"
                        height="60"
                        aria-label="Yield Fit"
                    >
                        <defs>
                            <linearGradient id="introSymbolGrad" x1="30.91" y1="10.41" x2="12.21" y2="47.91" gradientUnits="userSpaceOnUse">
                                <stop offset="0" stopColor="#41cb7e" />
                                <stop offset=".8" stopColor="#3ef87e" />
                            </linearGradient>
                        </defs>
                        <path fill="#3ef87e" d="M48,.6l26.6,48.4h-23.1l-14.3-27.9-14.1,27.9H0L26.5.6h21.5Z" />
                        <polygon fill="url(#introSymbolGrad)" points="37.2 21.1 26.5 .6 0 49.1 23.1 49.1 37.2 21.1" />
                    </svg>
                </div>
            </div>
        </div>
    );
}