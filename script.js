/* =====================================================================
   VARSHHHH — PROPOSAL EXPERIENCE
   Vanilla JS. No dependencies. Two canvases:
     bgCanvas  -> ambient aurora stars + floating glow particles (always on)
     fxCanvas  -> one-shot bursts: hearts, confetti, fireworks, roses,
                  glitter, bubbles, butterflies, lens flare
   ===================================================================== */
(() => {
    'use strict';

    /* ---------------------------------------------------------------
       0. UTILITIES
    --------------------------------------------------------------- */
    const rand = (min, max) => Math.random() * (max - min) + min;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const $ = (sel) => document.querySelector(sel);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------------------------------------------------------
       1. CANVAS SETUP
    --------------------------------------------------------------- */
    const bgCanvas = $('#bg-canvas');
    const fxCanvas = $('#fx-canvas');
    const bgCtx = bgCanvas.getContext('2d');
    const fxCtx = fxCanvas.getContext('2d');

    let W = 0,
        H = 0,
        DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        [bgCanvas, fxCanvas].forEach(c => {
            c.width = W * DPR;
            c.height = H * DPR;
            c.style.width = W + 'px';
            c.style.height = H + 'px';
        });
        bgCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
        fxCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    /* ---------------------------------------------------------------
       2. AMBIENT BACKGROUND — twinkling stars + floating glow orbs
    --------------------------------------------------------------- */
    const STAR_COUNT = window.innerWidth < 600 ? 70 : 140;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(0.5, 1.8),
        tw: rand(0, Math.PI * 2),
        speed: rand(0.01, 0.03),
    }));

    const ORB_COUNT = window.innerWidth < 600 ? 10 : 18;
    const glowColors = ['255,47,146', '55,230,255', '255,213,74', '155,107,255', '255,159,208'];
    const orbs = Array.from({ length: ORB_COUNT }, () => ({
        x: rand(0, W),
        y: rand(0, H),
        r: rand(30, 90),
        vx: rand(-0.12, 0.12),
        vy: rand(-0.18, -0.05),
        color: pick(glowColors),
        alpha: rand(0.05, 0.14),
    }));

    function drawBackground() {
        bgCtx.clearRect(0, 0, W, H);

        // twinkling stars
        for (const s of stars) {
            s.tw += s.speed;
            const a = 0.4 + Math.sin(s.tw) * 0.4;
            bgCtx.beginPath();
            bgCtx.fillStyle = `rgba(255,255,255,${clamp(a, 0.05, 0.9)})`;
            bgCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            bgCtx.fill();
        }

        // floating glow orbs (soft bloom particles)
        for (const o of orbs) {
            o.x += o.vx;
            o.y += o.vy;
            if (o.y < -o.r) { o.y = H + o.r;
                o.x = rand(0, W); }
            if (o.x < -o.r) o.x = W + o.r;
            if (o.x > W + o.r) o.x = -o.r;

            const g = bgCtx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
            g.addColorStop(0, `rgba(${o.color},${o.alpha})`);
            g.addColorStop(1, `rgba(${o.color},0)`);
            bgCtx.fillStyle = g;
            bgCtx.beginPath();
            bgCtx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            bgCtx.fill();
        }
    }

    /* ---------------------------------------------------------------
       3. FX PARTICLE ENGINE — one shared pool, typed particles
    --------------------------------------------------------------- */
    let fxParticles = [];

    function spawnHeartBurst(cx, cy, count = 40, power = 1) {
        for (let i = 0; i < count; i++) {
            const angle = rand(0, Math.PI * 2);
            const speed = rand(2, 6) * power;
            fxParticles.push({
                type: 'heart',
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                size: rand(10, 22),
                rot: rand(0, Math.PI * 2),
                vr: rand(-0.06, 0.06),
                color: pick(['#ff2f92', '#ff9fd0', '#ffd54a', '#9b6bff']),
                life: 0,
                maxLife: rand(70, 120),
                gravity: 0.045,
            });
        }
    }

    function spawnFireworkHearts(cx, cy) {
        // a ring of tiny hearts that bursts outward then twinkles, like a firework
        const count = 26;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = rand(3.5, 5.5);
            fxParticles.push({
                type: 'firework-heart',
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: rand(8, 14),
                color: pick(['#ff2f92', '#37e6ff', '#ffd54a', '#ff9fd0']),
                life: 0,
                maxLife: rand(50, 80),
                gravity: 0.02,
            });
        }
    }

    function spawnConfetti(count = 60) {
        for (let i = 0; i < count; i++) {
            fxParticles.push({
                type: 'confetti',
                x: rand(0, W),
                y: rand(-60, -10),
                vx: rand(-1, 1),
                vy: rand(2, 4.5),
                size: rand(6, 11),
                rot: rand(0, Math.PI * 2),
                vr: rand(-0.15, 0.15),
                color: pick(['#ff2f92', '#37e6ff', '#ffd54a', '#9b6bff', '#ff9fd0', '#ffffff']),
                life: 0,
                maxLife: rand(220, 320),
                gravity: 0.01,
                sway: rand(0.02, 0.05),
                swayOff: rand(0, Math.PI * 2),
            });
        }
    }

    function spawnRoses(count = 14) {
        for (let i = 0; i < count; i++) {
            fxParticles.push({
                type: 'rose',
                x: rand(0, W),
                y: rand(-80, -20),
                vx: rand(-0.3, 0.3),
                vy: rand(1, 2.2),
                size: rand(16, 28),
                rot: rand(0, Math.PI * 2),
                vr: rand(-0.02, 0.02),
                life: 0,
                maxLife: rand(260, 380),
                sway: rand(0.01, 0.03),
                swayOff: rand(0, Math.PI * 2),
            });
        }
    }

    function spawnGlitter(count = 50) {
        for (let i = 0; i < count; i++) {
            const angle = rand(0, Math.PI * 2);
            const speed = rand(1, 5);
            fxParticles.push({
                type: 'glitter',
                x: W / 2,
                y: H / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: rand(1.5, 3.5),
                color: pick(['#ffd54a', '#ffffff', '#37e6ff', '#ff9fd0']),
                life: 0,
                maxLife: rand(60, 100),
                gravity: 0.02,
            });
        }
    }

    function spawnBubbles(count = 12) {
        for (let i = 0; i < count; i++) {
            fxParticles.push({
                type: 'bubble',
                x: rand(0, W),
                y: H + rand(0, 100),
                vx: rand(-0.3, 0.3),
                vy: rand(-1.4, -0.7),
                size: rand(8, 22),
                life: 0,
                maxLife: rand(260, 400),
                sway: rand(0.01, 0.03),
                swayOff: rand(0, Math.PI * 2),
            });
        }
    }

    function spawnButterflies(count = 5) {
        for (let i = 0; i < count; i++) {
            fxParticles.push({
                type: 'butterfly',
                x: rand(0, W),
                y: rand(H * 0.3, H * 0.9),
                baseY: 0,
                angle: rand(0, Math.PI * 2),
                speed: rand(0.8, 1.6),
                flap: rand(0, Math.PI * 2),
                color: pick(['#ff2f92', '#ffd54a', '#37e6ff', '#ff9fd0']),
                size: rand(10, 16),
                life: 0,
                maxLife: rand(400, 700),
            });
        }
    }

    function spawnSparkleTrail(x, y) {
        fxParticles.push({
            type: 'sparkle',
            x,
            y,
            vx: rand(-0.4, 0.4),
            vy: rand(-0.6, -0.1),
            size: rand(2, 4),
            life: 0,
            maxLife: rand(30, 50),
            color: pick(['#ffd54a', '#ffffff', '#ff9fd0']),
        });
    }

    // lens flare — single fading radial burst, drawn as a short-lived special entry
    function spawnLensFlare(cx, cy) {
        fxParticles.push({
            type: 'lensflare',
            x: cx,
            y: cy,
            life: 0,
            maxLife: 55,
        });
    }

    /* ---- heart shape path helper (used by heart + firework-heart) ---- */
    function heartPath(ctx, size) {
        ctx.beginPath();
        const s = size / 16;
        ctx.moveTo(0, 4 * s);
        ctx.bezierCurveTo(0, 2 * s, -2 * s, 0, -6 * s, 0);
        ctx.bezierCurveTo(-11 * s, 0, -11 * s, 6.5 * s, -11 * s, 6.5 * s);
        ctx.bezierCurveTo(-11 * s, 10 * s, -7 * s, 13.5 * s, 0, 18 * s);
        ctx.bezierCurveTo(7 * s, 13.5 * s, 11 * s, 10 * s, 11 * s, 6.5 * s);
        ctx.bezierCurveTo(11 * s, 6.5 * s, 11 * s, 0, 6 * s, 0);
        ctx.bezierCurveTo(2 * s, 0, 0, 2 * s, 0, 4 * s);
        ctx.closePath();
    }

    function updateAndDrawFx() {
        fxCtx.clearRect(0, 0, W, H);
        fxParticles = fxParticles.filter(p => p.life < p.maxLife);

        for (const p of fxParticles) {
            p.life++;
            const t = p.life / p.maxLife;
            const fade = 1 - t;

            switch (p.type) {
                case 'heart':
                case 'firework-heart':
                    {
                        p.vy += p.gravity;
                        p.x += p.vx;p.y += p.vy;
                        p.vx *= 0.99;
                        p.rot = (p.rot || 0) + (p.vr || 0);
                        fxCtx.save();
                        fxCtx.translate(p.x, p.y);
                        fxCtx.rotate(p.rot || 0);
                        fxCtx.globalAlpha = clamp(fade, 0, 1);
                        fxCtx.fillStyle = p.color;
                        fxCtx.shadowColor = p.color;
                        fxCtx.shadowBlur = 14;
                        heartPath(fxCtx, p.size);
                        fxCtx.fill();
                        fxCtx.restore();
                        break;
                    }
                case 'confetti':
                    {
                        p.vy += p.gravity;
                        p.x += p.vx + Math.sin(p.life * p.sway + p.swayOff) * 1.1;
                        p.y += p.vy;
                        p.rot += p.vr;
                        fxCtx.save();
                        fxCtx.translate(p.x, p.y);
                        fxCtx.rotate(p.rot);
                        fxCtx.globalAlpha = t > 0.85 ? clamp((1 - t) / 0.15, 0, 1) : 1;
                        fxCtx.fillStyle = p.color;
                        fxCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                        fxCtx.restore();
                        break;
                    }
                case 'rose':
                    {
                        p.x += p.vx + Math.sin(p.life * p.sway + p.swayOff) * 0.6;
                        p.y += p.vy;
                        p.rot += p.vr;
                        fxCtx.save();
                        fxCtx.translate(p.x, p.y);
                        fxCtx.rotate(p.rot);
                        fxCtx.globalAlpha = t > 0.85 ? clamp((1 - t) / 0.15, 0, 1) : 0.9;
                        fxCtx.font = `${p.size}px serif`;
                        fxCtx.textAlign = 'center';
                        fxCtx.textBaseline = 'middle';
                        fxCtx.fillText('\u{1F339}', 0, 0);
                        fxCtx.restore();
                        break;
                    }
                case 'glitter':
                case 'sparkle':
                    {
                        p.vy = (p.vy || 0) + (p.gravity || 0);
                        p.x += p.vx;p.y += p.vy;
                        fxCtx.save();
                        fxCtx.globalAlpha = clamp(fade, 0, 1);
                        fxCtx.fillStyle = p.color;
                        fxCtx.shadowColor = p.color;
                        fxCtx.shadowBlur = 8;
                        fxCtx.beginPath();
                        fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        fxCtx.fill();
                        fxCtx.restore();
                        break;
                    }
                case 'bubble':
                    {
                        p.x += p.vx + Math.sin(p.life * p.sway + p.swayOff) * 0.5;
                        p.y += p.vy;
                        fxCtx.save();
                        fxCtx.globalAlpha = 0.35 * (t > 0.85 ? clamp((1 - t) / 0.15, 0, 1) : 1);
                        fxCtx.strokeStyle = '#bdf2ff';
                        fxCtx.lineWidth = 1.4;
                        fxCtx.beginPath();
                        fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        fxCtx.stroke();
                        fxCtx.restore();
                        break;
                    }
                case 'butterfly':
                    {
                        p.flap += 0.25;
                        p.angle += rand(-0.03, 0.03);
                        p.x += Math.cos(p.angle) * p.speed;
                        p.y += Math.sin(p.angle) * p.speed * 0.6 + Math.sin(p.life * 0.05) * 0.4;
                        if (p.x < -20) p.x = W + 20;
                        if (p.x > W + 20) p.x = -20;
                        if (p.y < -20) p.y = H + 20;
                        if (p.y > H + 20) p.y = -20;
                        const wing = Math.sin(p.flap) * 0.9;
                        fxCtx.save();
                        fxCtx.translate(p.x, p.y);
                        fxCtx.rotate(p.angle);
                        fxCtx.globalAlpha = t > 0.9 ? clamp((1 - t) / 0.1, 0, 1) : 0.85;
                        fxCtx.fillStyle = p.color;
                        fxCtx.shadowColor = p.color;fxCtx.shadowBlur = 6;
                        // left wing
                        fxCtx.save();fxCtx.scale(wing, 1);
                        fxCtx.beginPath();fxCtx.ellipse(-p.size * 0.5, 0, p.size * 0.6, p.size * 0.9, 0, 0, Math.PI * 2);fxCtx.fill();
                        fxCtx.restore();
                        // right wing
                        fxCtx.save();fxCtx.scale(wing, 1);
                        fxCtx.beginPath();fxCtx.ellipse(p.size * 0.5, 0, p.size * 0.6, p.size * 0.9, 0, 0, Math.PI * 2);fxCtx.fill();
                        fxCtx.restore();
                        fxCtx.restore();
                        break;
                    }
                case 'lensflare':
                    {
                        const cx = p.x,
                            cy = p.y;
                        fxCtx.save();
                        fxCtx.globalAlpha = fade * 0.8;
                        const g = fxCtx.createRadialGradient(cx, cy, 0, cx, cy, 220);
                        g.addColorStop(0, 'rgba(255,255,255,0.9)');
                        g.addColorStop(0.25, 'rgba(255,213,74,0.35)');
                        g.addColorStop(1, 'rgba(255,47,146,0)');
                        fxCtx.fillStyle = g;
                        fxCtx.beginPath();
                        fxCtx.arc(cx, cy, 220, 0, Math.PI * 2);
                        fxCtx.fill();
                        // rays
                        fxCtx.translate(cx, cy);
                        fxCtx.rotate(p.life * 0.02);
                        fxCtx.strokeStyle = 'rgba(255,255,255,0.5)';
                        fxCtx.lineWidth = 1;
                        for (let i = 0; i < 8; i++) {
                            const a = (Math.PI / 4) * i;
                            fxCtx.beginPath();
                            fxCtx.moveTo(0, 0);
                            fxCtx.lineTo(Math.cos(a) * 260, Math.sin(a) * 260);
                            fxCtx.stroke();
                        }
                        fxCtx.restore();
                        break;
                    }
            }
        }
    }

    /* ---------------------------------------------------------------
       4. MAIN RENDER LOOP
    --------------------------------------------------------------- */
    function loop() {
        if (!reduceMotion) drawBackground();
        updateAndDrawFx();
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // gentle continuous butterflies + occasional glitter once the show begins
    let ambientButterfliesStarted = false;

    function startAmbientLife() {
        if (ambientButterfliesStarted) return;
        ambientButterfliesStarted = true;
        spawnButterflies(4);
        setInterval(() => spawnButterflies(2), 9000);
        setInterval(() => spawnBubbles(6), 6000);
    }

    /* ---------------------------------------------------------------
       5. SCENE MANAGER
    --------------------------------------------------------------- */
    const scenes = ['scene-loader', 'scene-gate', 'scene-name', 'scene-message', 'scene-proposal', 'scene-final'];

    function goToScene(id) {
        scenes.forEach(s => $('#' + s).classList.toggle('scene--active', s === id));
    }

    /* ---------------------------------------------------------------
       6. LOADER -> GATE
    --------------------------------------------------------------- */
    setTimeout(() => {
        goToScene('scene-gate');
    }, 2200);

    /* ---------------------------------------------------------------
       7. GATE -> BEGIN THE EXPERIENCE
    --------------------------------------------------------------- */
    const music = $('#bg-music');
    const muteBtn = $('#btn-mute');
    let musicEnabled = true;

    function tryPlayMusic() {
        if (!music) return;
        music.volume = 0.5;
        const p = music.play();
        if (p && p.catch) p.catch(() => { /* no music file present or autoplay blocked — silently continue */ });
    }

    muteBtn.addEventListener('click', () => {
        musicEnabled = !musicEnabled;
        muteBtn.classList.toggle('is-muted', !musicEnabled);
        if (!music) return;
        if (musicEnabled) tryPlayMusic();
        else music.pause();
    });

    let begun = false;

    function beginExperience() {
        if (begun) return;
        begun = true;

        tryPlayMusic();
        muteBtn.classList.add('show');

        // cinematic "camera zoom" — scale the whole body briefly
        document.body.style.transition = 'transform 1.6s cubic-bezier(.22,.9,.32,1)';
        document.body.style.transform = 'scale(1.06)';
        setTimeout(() => { document.body.style.transform = 'scale(1)'; }, 900);

        const cx = W / 2,
            cy = H / 2;
        spawnLensFlare(cx, cy);
        spawnHeartBurst(cx, cy, 46, 1.2);
        spawnGlitter(70);
        spawnConfetti(50);
        spawnFireworkHearts(cx, cy * 0.7);
        spawnRoses(10);
        spawnBubbles(10);
        startAmbientLife();

        setTimeout(() => {
            goToScene('scene-name');
            runNameReveal();
        }, 900);
    }

    $('#scene-gate').addEventListener('click', beginExperience);
    $('#btn-begin').addEventListener('click', (e) => { e.stopPropagation();
        beginExperience(); });

    /* ---------------------------------------------------------------
       8. NAME REVEAL — letter by letter with sparkle trails
    --------------------------------------------------------------- */
    const NAME = 'VARSHHHH';
    const lettersHost = $('#name-letters');
    const combinedName = $('#name-combined');
    let nameStarted = false;

    function runNameReveal() {
        if (nameStarted) return;
        nameStarted = true;

        lettersHost.innerHTML = '';
        const spans = [...NAME].map(ch => {
            const span = document.createElement('span');
            span.className = 'ltr';
            span.textContent = ch;
            lettersHost.appendChild(span);
            return span;
        });

        spans.forEach((span, i) => {
            setTimeout(() => {
                span.classList.add('show');
                // sparkle trail at the letter's screen position
                const rect = span.getBoundingClientRect();
                let ticks = 0;
                const trail = setInterval(() => {
                    spawnSparkleTrail(rect.left + rect.width / 2 + rand(-6, 6), rect.top + rect.height / 2);
                    ticks++;
                    if (ticks > 6) clearInterval(trail);
                }, 60);
            }, i * 260);
        });

        const totalTime = spans.length * 260 + 900;
        setTimeout(() => {
            combinedName.classList.add('show');
            spawnGlitter(30);
        }, totalTime);

        setTimeout(() => {
            goToScene('scene-message');
            runMessages();
        }, totalTime + 2200);
    }

    /* ---------------------------------------------------------------
       9. LOVE MESSAGES — sequential fade transitions
    --------------------------------------------------------------- */
    const MESSAGES = [
        'Every heartbeat reminds me of you.',
        'Every smile begins with your name.',
        'My world became beautiful because of you.',
        'You are my favourite person.',
        'I want to spend every tomorrow with you.',
    ];
    const messageText = $('#message-text');
    const messageProgress = $('#message-progress');
    let messagesStarted = false;

    function runMessages() {
        if (messagesStarted) return;
        messagesStarted = true;

        messageProgress.innerHTML = MESSAGES.map(() => '<span></span>').join('');
        const dots = [...messageProgress.children];

        let i = 0;

        function showNext() {
            messageText.classList.remove('show');
            dots.forEach(d => d.classList.remove('active'));
            setTimeout(() => {
                messageText.textContent = MESSAGES[i];
                messageText.classList.add('show');
                dots[i].classList.add('active');
                i++;
                if (i < MESSAGES.length) {
                    setTimeout(showNext, 3000);
                } else {
                    setTimeout(() => {
                        goToScene('scene-proposal');
                        initProposal();
                    }, 3200);
                }
            }, 350);
        }
        showNext();
    }

    /* ---------------------------------------------------------------
       10. PROPOSAL — ring, YES (celebration) / NO (runs away)
    --------------------------------------------------------------- */
    const btnYes = $('#btn-yes');
    const btnNo = $('#btn-no');
    const proposalButtonsWrap = $('.proposal-buttons');
    let proposalInit = false;

    function initProposal() {
        if (proposalInit) return;
        proposalInit = true;

        // place NO button in normal flow initially by positioning it absolutely
        // within the viewport once the scene is visible, so runaway math is easy.
        const rect = btnNo.getBoundingClientRect();
        btnNo.style.position = 'fixed';
        btnNo.style.left = rect.left + 'px';
        btnNo.style.top = rect.top + 'px';
        btnNo.classList.add('is-runaway');

        function runAway() {
            const bw = btnNo.offsetWidth,
                bh = btnNo.offsetHeight;
            const margin = 16;
            const maxLeft = W - bw - margin;
            const maxTop = H - bh - margin;
            const newLeft = clamp(rand(margin, maxLeft), margin, maxLeft);
            const newTop = clamp(rand(margin, maxTop), margin, maxTop);
            btnNo.style.left = newLeft + 'px';
            btnNo.style.top = newTop + 'px';
        }

        // playful dodge on hover/touch AND click — it truly cannot be pressed
        ['mouseenter', 'pointerdown', 'click', 'touchstart'].forEach(evt => {
            btnNo.addEventListener(evt, (e) => {
                e.preventDefault();
                runAway();
            }, { passive: false });
        });

        btnYes.addEventListener('click', onYes);
    }

    function onYes() {
        btnYes.disabled = true;
        btnNo.style.transition = 'opacity .4s';
        btnNo.style.opacity = '0';

        const cx = W / 2,
            cy = H * 0.5;
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 650);

        spawnLensFlare(cx, cy);
        spawnHeartBurst(cx, cy, 70, 1.6);
        spawnFireworkHearts(cx, cy * 0.6);
        setTimeout(() => spawnFireworkHearts(W * 0.25, H * 0.4), 300);
        setTimeout(() => spawnFireworkHearts(W * 0.75, H * 0.45), 600);
        spawnConfetti(90);
        spawnRoses(18);
        spawnGlitter(80);

        // music swells emotionally (simple volume ramp — safe if music unavailable)
        if (music) {
            try {
                let v = music.volume || 0.5;
                const swell = setInterval(() => {
                    v = clamp(v + 0.05, 0, 0.85);
                    music.volume = v;
                    if (v >= 0.85) clearInterval(swell);
                }, 200);
            } catch (e) { /* ignore if audio not supported */ }
        }

        setTimeout(() => {
            goToScene('scene-final');
            spawnHeartBurst(W / 2, H * 0.3, 30, 1);
            const keepGoing = setInterval(() => {
                if (!$('#scene-final').classList.contains('scene--active')) { clearInterval(keepGoing); return; }
                spawnHeartBurst(rand(W * 0.2, W * 0.8), H + 20, 3, 0.6);
            }, 1200);
        }, 1800);
    }

    /* ---------------------------------------------------------------
       11. Skip-ahead: allow tapping name/message scenes to move faster
           (nice UX touch — doesn't skip the proposal itself)
    --------------------------------------------------------------- */
    $('#scene-name').addEventListener('click', () => {
        if (combinedName.classList.contains('show')) {
            goToScene('scene-message');
            runMessages();
        }
    });

})();