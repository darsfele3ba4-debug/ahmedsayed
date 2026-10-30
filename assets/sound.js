// ===== المؤثرات الصوتية (تُولَّد داخل المتصفح بدون ملفات صوت - تعمل بدون إنترنت) =====
const SFX = (() => {
    let ctx = null, muted = false;
    try { muted = localStorage.getItem('sfx-muted') === '1'; } catch (e) {}

    function ac() {
        if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }
    function tone(c, freq, t0, dur, type, vol, dest) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(dest || c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function noiseBuffer(c, sec) {
        const b = c.createBuffer(1, Math.floor(c.sampleRate * sec), c.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        return b;
    }
    // تصفيق
    function claps(c, t0, n, span) {
        for (let i = 0; i < n; i++) {
            const t = t0 + Math.random() * span, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
            s.buffer = noiseBuffer(c, 0.06); f.type = 'bandpass'; f.frequency.value = 1200 + Math.random() * 1500; f.Q.value = 0.8;
            g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35 + Math.random() * 0.25, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
            s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + 0.07);
        }
    }
    // هتاف الجمهور
    function crowd(c, t0, dur) {
        const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        s.buffer = noiseBuffer(c, dur); f.type = 'bandpass'; f.frequency.setValueAtTime(700, t0); f.frequency.linearRampToValueAtTime(1100, t0 + dur * 0.4); f.Q.value = 0.6;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        s.connect(f); f.connect(g); g.connect(c.destination); s.start(t0); s.stop(t0 + dur);
    }

    function correct(big) {
        if (muted) return; const c = ac(); if (!c) return; const t = c.currentTime + 0.01;
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { tone(c, f, t + i * 0.08, 0.28, 'triangle', 0.32); tone(c, f * 2, t + i * 0.08, 0.15, 'sine', 0.06); });
        tone(c, 1318.5, t + 0.34, 0.45, 'triangle', 0.25);
        crowd(c, t + 0.15, big ? 1.8 : 1.2);
        claps(c, t + 0.2, big ? 26 : 16, big ? 1.4 : 0.9);
    }
    function wrong() {
        if (muted) return; const c = ac(); if (!c) return; const t = c.currentTime + 0.01;
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.connect(c.destination);
        const notes = [293.66, 277.18, 261.63, 246.94]; // وا وا وا واااا
        notes.forEach((f, i) => {
            const st = t + i * 0.32, dur = i === 3 ? 0.9 : 0.3;
            const o = c.createOscillator(), g = c.createGain();
            o.type = 'sawtooth'; o.frequency.setValueAtTime(f, st);
            if (i === 3) { // اهتزاز حزين فى النغمة الأخيرة
                const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 6; lg.gain.value = 7;
                lfo.connect(lg); lg.connect(o.frequency); lfo.start(st); lfo.stop(st + dur);
                o.frequency.linearRampToValueAtTime(f * 0.94, st + dur);
            }
            g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(0.22, st + 0.04);
            g.gain.setValueAtTime(0.22, st + dur - 0.08); g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
            o.connect(g); g.connect(lp); o.start(st); o.stop(st + dur + 0.05);
        });
    }
    function small(ok) { // صوت قصير (التوصيل)
        if (muted) return; const c = ac(); if (!c) return; const t = c.currentTime + 0.01;
        if (ok) { tone(c, 659.25, t, 0.15, 'triangle', 0.3); tone(c, 987.77, t + 0.08, 0.25, 'triangle', 0.3); }
        else { tone(c, 196, t, 0.18, 'sawtooth', 0.15); tone(c, 155.56, t + 0.15, 0.3, 'sawtooth', 0.15); }
    }
    function fanfare() {
        if (muted) return; const c = ac(); if (!c) return; const t = c.currentTime + 0.01;
        [523.25, 523.25, 523.25, 659.25, 783.99, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, t + i * 0.13, i === 7 ? 0.8 : 0.16, 'triangle', 0.28));
        crowd(c, t + 0.3, 2.2); claps(c, t + 0.4, 34, 1.8);
    }
    // ===== أصوات خاصة بمسابقة من سيربح المليون (مختلفة عن باقى الألعاب) =====
    function sweep(c, f1, f2, t0, dur, type, vol) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = type; o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function boom(c, t0, f, dur, vol) { sweep(c, f, f * 0.45, t0, dur, 'sine', vol); }
    function milQuestion() { // نغمة دخول السؤال: ضربة عميقة + نغمتان غامضتان
        if (muted) return; const c = ac(); if (!c) return; const t = c.currentTime + 0.01;
        boom(c, t, 110, 0.9, 0.5);
        [[220, 0], [261.63, 0.18], [329.63, 0.36]].forEach(([f, d]) => { tone(c, f, t + d, 0.7, 'sine', 0.16); tone(c, f * 1.5, t + d, 0.6, 'triangle', 0.05); });
    }
    function milSuspense() { // الإجابة النهائية: نبضات قلب متسارعة
        if (muted) return; const c = ac(); if (!c) return; const t = c.currentTime + 0.01;
        [0, 0.32, 0.6, 0.85, 1.07].forEach((d, i) => { boom(c, t + d, 75, 0.22, 0.55); boom(c, t + d + 0.11, 62, 0.2, 0.35); });
        sweep(c, 180, 360, t, 1.25, 'sine', 0.06);
    }
    function milRight() { // إجابة صحيحة: كورد نحاسى صاعد
        if (muted) return; const c = ac(); if (!c) return; const t = c.currentTime + 0.01;
        [[392, 0], [493.88, 0], [587.33, 0], [523.25, 0.22], [659.25, 0.22], [783.99, 0.22], [1046.5, 0.22]].forEach(([f, d]) => {
            tone(c, f, t + d, d ? 0.9 : 0.24, 'sawtooth', 0.07); tone(c, f, t + d, d ? 0.9 : 0.24, 'triangle', 0.14);
        });
        sweep(c, 600, 2400, t + 0.2, 0.6, 'sine', 0.05);
    }
    function milWrong() { // إجابة خاطئة: ضربة منخفضة + هبوط درامى
        if (muted) return; const c = ac(); if (!c) return; const t = c.currentTime + 0.01;
        boom(c, t, 90, 1.4, 0.6);
        [[311.13, 0], [293.66, 0.25], [207.65, 0.5]].forEach(([f, d], i) => tone(c, f, t + d, i === 2 ? 1.3 : 0.3, 'sawtooth', 0.09));
        sweep(c, 400, 80, t + 0.5, 1.2, 'triangle', 0.12);
    }
    function milLifeline() { // وسيلة مساعدة: صوت انسيابى
        if (muted) return; const c = ac(); if (!c) return; const t = c.currentTime + 0.01;
        sweep(c, 300, 1500, t, 0.35, 'sine', 0.18); sweep(c, 1500, 900, t + 0.3, 0.3, 'sine', 0.12);
    }
    function milWin() { // الفوز بالمليون
        if (muted) return; const c = ac(); if (!c) return; const t = c.currentTime + 0.01;
        boom(c, t, 110, 1.2, 0.5);
        [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => { tone(c, f, t + i * 0.14, i === 5 ? 1.4 : 0.3, 'sawtooth', 0.07); tone(c, f, t + i * 0.14, i === 5 ? 1.4 : 0.3, 'triangle', 0.15); });
        crowd(c, t + 0.6, 2.6); claps(c, t + 0.7, 40, 2.2);
    }
    function setMuted(m) { muted = m; try { localStorage.setItem('sfx-muted', m ? '1' : '0'); } catch (e) {} }
    return { correct, wrong, small, fanfare, milQuestion, milSuspense, milRight, milWrong, milLifeline, milWin, setMuted, isMuted: () => muted, unlock: ac };
})();
