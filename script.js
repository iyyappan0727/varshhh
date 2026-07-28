/* =========================================================================
   VARSHHHH — Premium Romantic Proposal Experience
   Vanilla JS — scene orchestration + particle systems
   All animations run on transform/opacity for smooth 60fps performance.
   ========================================================================= */

(() => {
    'use strict';

    /* ----------------------------- helpers ----------------------------- */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const rand = (min, max) => Math.random() * (max - min) + min;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const field = $('#particle-field');
    const body = document.body;

    /* =====================================================================
       1. STARFIELD (canvas) — twinkling stars behind everything
       ===================================================================== */
    const canvas = $('#star-canvas');
    const ctx = canvas.getContext('2d');
    let stars = [];

    function sizeCanvas() {
        canvas.width = window.innerWidth * devicePixelRatio;
        canvas.height = window.innerHeight * devicePixelRatio;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function initStars() {
        const count = Math.min(140, Math.floor((window.innerWidth * window.innerHeight) / 9000));
        stars = Array.from({ length: count }, () => ({
            x: rand(0, window.innerWidth),
            y: rand(0, window.innerHeight),
            r: rand(0.5, 1.8),
            phase: rand(0, Math.PI * 2),
            speed: rand(0.01, 0.03),
        }));
    }

    function drawStars(t) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (const s of stars) {
            const twinkle = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
            ctx.globalAlpha = 0.25 + twinkle * 0.75;
            ctx.fillStyle = '#fdf6ff';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (!reducedMotion) requestAnimationFrame(drawStars);
    }

    sizeCanvas();
    initStars();
    requestAnimationFrame(drawStars);
    window.addEventListener('resize', () => { sizeCanvas();
        initStars(); });

    /* =====================================================================
       2. GENERIC PARTICLE SPAWNER
       Spawns a lightweight absolutely-positioned element, animates it with
       a CSS keyframe (assigned via class), then removes it from the DOM.
       ===================================================================== */
    function spawnParticle({
        parent = field,
        html = '❤',
        className = 'p-heart',
        left = rand(0, 100) + 'vw',
        top = '105vh',
        size = rand(14, 26),
        duration = rand(4, 8),
        delay = 0,
        animName = 'floatUp',
        dx = rand(-80, 80) + 'px',
        dy = rand(-40, 40) + 'px',
        rot = rand(180, 720) + 'deg',
        style = {},
    } = {}) {
        const el = document.createElement('div');
        el.className = `floaty ${className}`;
        el.innerHTML = html;
        el.style.left = left;
        el.style.top = top;
        el.style.fontSize = size + 'px';
        el.style.setProperty('--drift', dx);
        el.style.setProperty('--dx', dx);
        el.style.setProperty('--dy', dy);
        el.style.setProperty('--rot', rot);
        el.style.animation = `${animName} ${duration}s ease-in ${delay}s forwards`;
        Object.assign(el.style, style);
        parent.appendChild(el);
        setTimeout(() => el.remove(), (duration + delay) * 1000 + 200);
        return el;
    }

    /* --- ambient background loop: gentle hearts + glitter always drifting --- */
    function ambientLoop() {
        if (reducedMotion) return;
        spawnParticle({
            html: pick(['❤', '✦', '✧']),
            className: pick(['p-heart', 'p-glitter']),
            size: rand(8, 16),
            duration: rand(8, 14),
            animName: 'floatUp',
            dx: rand(-40, 40) + 'px',
            style: { opacity: 0.5 },
        });
        setTimeout(ambientLoop, rand(900, 1800));
    }
    ambientLoop();

    /* =====================================================================
       3. SCENE MANAGEMENT
       ===================================================================== */
    const scenes = {
        loading: $('#scene-loading'),
        burst: $('#scene-burst'),
        name: $('#scene-name'),
        messages: $('#scene-messages'),
        proposal: $('#scene-proposal'),
        final: $('#scene-final'),
    };

    function goTo(id) {
        Object.values(scenes).forEach((s) => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    /* =====================================================================
       4. SCENE 1 → 2 : TAP TO BEGIN → BURST SEQUENCE
       ===================================================================== */
    const beginBtn = $('#begin-btn');
    const music = $('#bg-music');
    let started = false;

    function beginExperience() {
        if (started) return;
        started = true;

        // attempt soft music start (best-effort; ignored if no source attached)
        if (music.currentSrc || music.src) {
            music.volume = 0.35;
            music.play().catch(() => {});
        }

        goTo('scene-burst');
        playBurstSequence();
    }

    beginBtn.addEventListener('click', beginExperience);
    scenes.loading.addEventListener('click', beginExperience);

    function playBurstSequence() {
        const burstScene = scenes.burst;
        burstScene.classList.add('scene-burst-play');

        // hearts explode from center
        for (let i = 0; i < 26; i++) {
            const angle = (Math.PI * 2 * i) / 26 + rand(-0.15, 0.15);
            const dist = rand(120, window.innerWidth * 0.42);
            spawnParticle({
                parent: burstScene,
                html: '❤',
                className: pick(['p-heart', 'p-heart-gold']),
                left: '50vw',
                top: '50vh',
                size: rand(16, 30),
                duration: rand(1, 1.6),
                delay: rand(0, 0.2),
                animName: 'burstOut',
                dx: Math.cos(angle) * dist + 'px',
                dy: Math.sin(angle) * dist + 'px',
                style: { position: 'absolute' },
            });
        }

        // glitter spread
        for (let i = 0; i < 40; i++) {
            const angle = rand(0, Math.PI * 2);
            const dist = rand(80, window.innerWidth * 0.5);
            spawnParticle({
                parent: burstScene,
                html: '',
                className: 'p-glitter',
                left: '50vw',
                top: '50vh',
                size: rand(4, 8),
                duration: rand(1.2, 2),
                delay: rand(0, 0.3),
                animName: 'burstOut',
                dx: Math.cos(angle) * dist + 'px',
                dy: Math.sin(angle) * dist + 'px',
                style: { position: 'absolute', borderRadius: '50%' },
            });
        }

        // confetti
        for (let i = 0; i < 30; i++) {
            spawnParticle({
                parent: burstScene,
                html: '',
                className: 'p-confetti',
                left: rand(0, 100) + 'vw',
                top: '-5vh',
                size: rand(6, 10),
                duration: rand(2.5, 4),
                delay: rand(0, 1),
                animName: 'fallDown',
                dx: rand(-60, 60) + 'px',
                rot: rand(360, 900) + 'deg',
                style: {
                    position: 'absolute',
                    background: pick(['#ff4d8d', '#f5c26b', '#c77dff', '#fdf6ff']),
                    width: rand(6, 10) + 'px',
                    height: rand(10, 16) + 'px',
                },
            });
        }

        // roses falling
        for (let i = 0; i < 12; i++) {
            spawnParticle({
                parent: burstScene,
                html: '🌹',
                className: 'p-rose',
                left: rand(0, 100) + 'vw',
                top: '-8vh',
                size: rand(18, 28),
                duration: rand(3.5, 5.5),
                delay: rand(0, 1.5),
                animName: 'fallDown',
                dx: rand(-50, 50) + 'px',
                rot: rand(-180, 180) + 'deg',
                style: { position: 'absolute' },
            });
        }

        // butterflies
        for (let i = 0; i < 6; i++) {
            const el = spawnParticle({
                parent: burstScene,
                html: '🦋',
                className: 'p-butterfly',
                left: rand(10, 90) + 'vw',
                top: rand(30, 90) + 'vh',
                size: rand(20, 30),
                duration: rand(3, 4.5),
                delay: rand(0.2, 1.2),
                animName: 'floatUp',
                dx: rand(-100, 100) + 'px',
                style: { position: 'absolute' },
            });
            el.style.animation += `, flutter 0.6s ease-in-out infinite`;
        }

        // floating bubbles
        for (let i = 0; i < 14; i++) {
            spawnParticle({
                parent: burstScene,
                html: '',
                className: 'p-bubble',
                left: rand(0, 100) + 'vw',
                top: '105vh',
                size: rand(10, 26),
                duration: rand(4, 7),
                delay: rand(0, 1.5),
                animName: 'floatUp',
                dx: rand(-30, 30) + 'px',
                style: { position: 'absolute', width: rand(10, 26) + 'px', height: rand(10, 26) + 'px' },
            });
        }

        // heart-shaped fireworks (bursts appearing at random points, staggered)
        const fireworkPoints = [
            [rand(15, 35), rand(15, 35)],
            [rand(65, 85), rand(20, 40)],
            [rand(30, 70), rand(10, 25)],
        ];
        fireworkPoints.forEach(([lx, ly], idx) => {
            setTimeout(() => {
                for (let i = 0; i < 14; i++) {
                    const angle = (Math.PI * 2 * i) / 14;
                    const dist = rand(40, 90);
                    spawnParticle({
                        parent: burstScene,
                        html: '❤',
                        className: 'p-heart',
                        left: lx + 'vw',
                        top: ly + 'vh',
                        size: rand(10, 16),
                        duration: 1.1,
                        animName: 'burstOut',
                        dx: Math.cos(angle) * dist + 'px',
                        dy: Math.sin(angle) * dist + 'px',
                        style: { position: 'absolute' },
                    });
                }
            }, idx * 450 + 300);
        });

        // move on to name reveal once the show settles
        setTimeout(() => {
            burstScene.classList.remove('scene-burst-play');
            goTo('scene-name');
            playNameReveal();
        }, 2600);
    }

    /* =====================================================================
       5. SCENE 3 : NAME REVEAL — letter by letter, with sparkle trails
       ===================================================================== */
    const NAME = 'V A R S H H H'.split(' '); // spelled with spaced display, joins to "Varshhhh"
    const nameLettersEl = $('#name-letters');
    const nameFinalEl = $('#name-final');
    const nextBtn = $('.next-btn');

    function playNameReveal() {
        nameLettersEl.innerHTML = '';
        nameFinalEl.classList.remove('show');
        nextBtn.classList.remove('show');

        NAME.forEach((ch, i) => {
            const span = document.createElement('span');
            span.className = 'letter';
            span.textContent = ch;
            span.style.animationDelay = `${i * 0.28}s`;
            nameLettersEl.appendChild(span);

            // sparkle trail as each letter lands
            setTimeout(() => {
                for (let s = 0; s < 5; s++) {
                    spawnParticle({
                        html: '✦',
                        className: 'p-glitter',
                        left: `calc(${nameLettersEl.getBoundingClientRect().left + span.offsetLeft}px)`,
                        top: `calc(${nameLettersEl.getBoundingClientRect().top}px)`,
                        size: rand(6, 10),
                        duration: rand(0.8, 1.3),
                        animName: 'burstOut',
                        dx: rand(-30, 30) + 'px',
                        dy: rand(-30, 10) + 'px',
                        style: { position: 'fixed', borderRadius: '50%' },
                    });
                }
            }, i * 280 + 500);
        });

        const totalDelay = NAME.length * 280 + 900;
        setTimeout(() => nameFinalEl.classList.add('show'), totalDelay);
        setTimeout(() => nextBtn.classList.add('show'), totalDelay + 500);
    }

    /* =====================================================================
       6. SCENE 4 : LOVE MESSAGES — sequential smooth transitions
       ===================================================================== */
    const lines = $$('.love-line');
    const dotsWrap = $('#message-dots');
    let messagesStarted = false;

    lines.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.dataset.i = i;
        dotsWrap.appendChild(dot);
    });
    const dots = $$('span', dotsWrap);

    function playMessages() {
        if (messagesStarted) return;
        messagesStarted = true;
        let i = 0;

        function showNext() {
            lines.forEach((l) => l.classList.remove('show'));
            dots.forEach((d) => d.classList.remove('active'));
            lines[i].classList.add('show');
            dots[i].classList.add('active');
            i++;
            if (i < lines.length) {
                setTimeout(showNext, 2600);
            } else {
                setTimeout(() => goTo('scene-proposal'), 3000);
            }
        }
        showNext();
    }

    /* wire up "Continue" from name scene -> messages */
    nextBtn.addEventListener('click', () => {
        goTo('scene-messages');
        playMessages();
    });

    /* =====================================================================
       7. SCENE 5 : FINAL PROPOSAL — YES / NO interactions
       ===================================================================== */
    const yesBtn = $('#yes-btn');
    const noBtn = $('#no-btn');
    const choiceRow = $('.choice-row');

    // NO button playfully evades the pointer
    function dodge() {
        const rowRect = choiceRow.getBoundingClientRect();
        const btnRect = noBtn.getBoundingClientRect();
        const margin = 12;
        const maxLeft = window.innerWidth - btnRect.width - margin;
        const maxTop = window.innerHeight - btnRect.height - margin;
        const newLeft = rand(margin, maxLeft);
        const newTop = rand(margin, maxTop);

        if (!noBtn.classList.contains('runaway')) {
            noBtn.classList.add('runaway');
            // freeze current visual position before switching to fixed
            noBtn.style.left = btnRect.left + 'px';
            noBtn.style.top = btnRect.top + 'px';
            // force reflow then animate to new spot
            requestAnimationFrame(() => {
                noBtn.style.left = newLeft + 'px';
                noBtn.style.top = newTop + 'px';
            });
        } else {
            noBtn.style.left = newLeft + 'px';
            noBtn.style.top = newTop + 'px';
        }
    }

    noBtn.addEventListener('pointerenter', dodge);
    noBtn.addEventListener('click', (e) => { e.preventDefault();
        dodge(); });
    noBtn.addEventListener('touchstart', (e) => { e.preventDefault();
        dodge(); }, { passive: false });

    yesBtn.addEventListener('click', () => {
        playYesSequence();
    });

    function playYesSequence() {
        // gentle screen shake
        body.classList.add('shake');
        setTimeout(() => body.classList.remove('shake'), 650);

        // emotional music swell (best-effort)
        if (music.currentSrc || music.src) {
            music.volume = 0.6;
        }

        // heart explosion + fireworks + confetti + roses, reused from burst sequence
        const layer = field; // use the persistent field so it renders above proposal scene
        for (let i = 0; i < 40; i++) {
            const angle = rand(0, Math.PI * 2);
            const dist = rand(100, window.innerWidth * 0.5);
            spawnParticle({
                parent: layer,
                html: '❤',
                className: pick(['p-heart', 'p-heart-gold']),
                left: '50vw',
                top: '50vh',
                size: rand(16, 30),
                duration: rand(1.2, 1.8),
                animName: 'burstOut',
                dx: Math.cos(angle) * dist + 'px',
                dy: Math.sin(angle) * dist + 'px',
                style: { position: 'fixed' },
            });
        }
        for (let i = 0; i < 36; i++) {
            spawnParticle({
                parent: layer,
                html: '',
                className: 'p-confetti',
                left: rand(0, 100) + 'vw',
                top: '-5vh',
                size: rand(6, 10),
                duration: rand(2.5, 4),
                delay: rand(0, 0.8),
                animName: 'fallDown',
                style: {
                    position: 'fixed',
                    background: pick(['#ff4d8d', '#f5c26b', '#c77dff', '#fdf6ff']),
                    width: rand(6, 10) + 'px',
                    height: rand(10, 16) + 'px',
                },
            });
        }
        for (let i = 0; i < 10; i++) {
            spawnParticle({
                parent: layer,
                html: '🌹',
                className: 'p-rose',
                left: rand(0, 100) + 'vw',
                top: '-8vh',
                size: rand(18, 26),
                duration: rand(3.5, 5),
                delay: rand(0, 1),
                animName: 'fallDown',
                style: { position: 'fixed' },
            });
        }
        // celebratory heart fireworks bursts
        [
            [20, 25],
            [80, 30],
            [50, 15]
        ].forEach(([lx, ly], idx) => {
            setTimeout(() => {
                for (let i = 0; i < 16; i++) {
                    const angle = (Math.PI * 2 * i) / 16;
                    const dist = rand(50, 100);
                    spawnParticle({
                        parent: layer,
                        html: '❤',
                        className: 'p-heart-gold',
                        left: lx + 'vw',
                        top: ly + 'vh',
                        size: rand(10, 16),
                        duration: 1.2,
                        animName: 'burstOut',
                        dx: Math.cos(angle) * dist + 'px',
                        dy: Math.sin(angle) * dist + 'px',
                        style: { position: 'fixed' },
                    });
                }
            }, idx * 400 + 200);
        });

        setTimeout(() => goTo('scene-final'), 1600);
    }

    /* =====================================================================
       8. INIT
       ===================================================================== */
    goTo('scene-loading');
})();
