/* Davet: eldiven belirir → el sallar → yumruk olur → ekranı üç kez çalar (sesli) →
   "Are you ready?" → yazı makinesi → ekran kararır → davet kartı ve katılım. */
(() => {
  "use strict";

  const E = window.EVENT || {};
  const $ = (s, r) => (r || document).querySelector(s);

  const body = document.body;
  const stage = $("#stage");
  const scenes = {
    glove: $("#scene-glove"),
    ready: $("#scene-ready"),
    letter: $("#scene-letter"),
    card: $("#scene-card")
  };
  const glove = $("#glove");
  const gOpen = $("#glove .open");
  const gFist = $("#glove .fist");
  const ripple = $("#ripple");
  const flash = $("#flash");
  const blackout = $("#blackout");
  const typed = $("#typed");
  const letterText = $("#letter-text");
  const skipBtn = $("#skip");
  const replayBtn = $("#replay");
  const soundHint = $("#sound-hint");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- İçerik ---------- */
  function letterString() {
    const lines = Array.isArray(E.letter) ? E.letter : [String(E.letter || "")];
    return lines.join("\n");
  }
  function fillDetails() {
    const set = (id, v) => { $(id).textContent = v == null ? "" : String(v); };
    set("#card-lead", E.titleLead || "");
    set("#card-title", E.title || E.host || "");
    set("#card-kicker", E.kicker || "");
    set("#f-place", E.place || "");
    set("#f-place-sub", E.placeSub || "");
    set("#f-date", E.date || "");
    set("#f-date-sub", E.dateSub || "");
    set("#f-time", E.time || "");
    set("#f-time-sub", E.timeSub || "");
    set("#f-dress-label", E.dressLabel || "");
    set("#f-dress", E.dress || "");
    set("#f-surprise", E.surprise || "");
    $(".surprise").hidden = !E.surprise;
    $(".dress").hidden = !E.dress;
    document.title = (E.titleLead ? E.titleLead + " " : "") + (E.title || "Davet") + (E.host ? " · " + E.host : "");
    letterText.textContent = letterString();
    $("#letter-ghost").textContent = letterString() + " ";
  }

  /* ---------- Ses: kapı çalma sesi (dosya yok, Web Audio ile üretilir) ---------- */
  let actx = null;
  function ensureAudio() {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
    }
    if (actx && actx.state === "suspended") actx.resume().catch(() => {});
    return actx;
  }
  function audioReady() { return !!(actx && actx.state === "running"); }
  function playKnock(strength) {
    if (!audioReady()) return;
    const c = actx;
    const t = c.currentTime;
    const k = strength || 1;
    // gövde: alçak, hızla sönen vuruş
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(62, t + 0.13);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.45 * k, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.22);
    // eklem: kısa gürültü vuruşu
    const len = Math.floor(c.sampleRate * 0.035);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) * (1 - i / len);
    const n = c.createBufferSource();
    n.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1500; bp.Q.value = 0.7;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.3 * k, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(bp).connect(ng).connect(c.destination);
    n.start(t);
  }
  // Tarayıcılar sesi ancak bir dokunuştan sonra açar; ilk dokunuşta açılır.
  ["pointerdown", "touchstart", "keydown"].forEach((ev) => {
    document.addEventListener(ev, () => { ensureAudio(); if (audioReady()) soundHint.hidden = true; }, { passive: true });
  });
  ensureAudio();

  /* ---------- Zamanlama yardımcıları ---------- */
  let run = 0;                 // her oynatma için artan jeton
  let timers = [];
  let anims = [];

  const sleep = (ms) => new Promise((res) => {
    const id = setTimeout(res, ms);
    timers.push(id);
  });
  const alive = (token) => token === run;

  function animate(el, keyframes, opts) {
    const a = el.animate(keyframes, opts);
    anims.push(a);
    return a.finished.catch(() => {});
  }
  function cancelAll() {
    timers.forEach(clearTimeout); timers = [];
    anims.forEach((a) => { try { a.cancel(); } catch (e) { /* no-op */ } }); anims = [];
  }

  function show(name) {
    Object.keys(scenes).forEach((k) => {
      const on = k === name;
      scenes[k].classList.toggle("is-active", on);
      if (k !== "card") scenes[k].setAttribute("aria-hidden", on ? "false" : "true");
    });
  }

  /* ---------- Ekranı çalma: yumruk izleyiciye doğru gelir ---------- */
  async function knock(token, strength) {
    const total = 420;
    const hit = 0.42; // çarpma anı (oran)
    const done = animate(glove, [
      { transform: "translateY(0) scale(1)", easing: "cubic-bezier(.5,0,.8,.4)" },
      { transform: "translateY(6px) scale(1.22)", offset: hit, easing: "linear" },
      { transform: "translateY(6px) scale(1.2)", offset: hit + 0.1, easing: "cubic-bezier(.2,.6,.3,1)" },
      { transform: "translateY(0) scale(1)" }
    ], { duration: total, fill: "forwards" });
    await sleep(Math.round(total * hit));
    if (!alive(token)) return;
    playKnock(strength);
    // çarpma: hafif ışık ve halka, çok küçük sarsıntı
    const r = glove.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    ripple.style.left = (r.left + r.width / 2 - sr.left) + "px";
    ripple.style.top = (r.top + r.height * 0.36 - sr.top) + "px";
    animate(ripple, [
      { transform: "scale(0.3)", opacity: 0.6 },
      { transform: "scale(1.1)", opacity: 0 }
    ], { duration: 560, easing: "cubic-bezier(.2,.6,.3,1)" });
    animate(flash, [{ opacity: 0.08 * (strength || 1) }, { opacity: 0 }], { duration: 260, easing: "ease-out" });
    animate(stage, [
      { transform: "translate(0,0)" }, { transform: "translate(-1.5px,1px)" }, { transform: "translate(1.5px,-1px)" }, { transform: "translate(0,0)" }
    ], { duration: 200, easing: "ease-out" });
    await done;
  }

  /* ---------- Yazı makinesi ---------- */
  async function typeLetter(token) {
    const text = letterString();
    const speed = Math.max(10, Number(E.typeSpeed) || 46);
    typed.textContent = "";
    const out = document.createTextNode("");
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    typed.appendChild(out);
    typed.appendChild(cursor);
    for (let i = 0; i < text.length; i++) {
      if (!alive(token)) return;
      const ch = text[i];
      out.data += ch;
      let wait = speed + (Math.random() - 0.5) * speed * 0.6;
      if (ch === "\n") wait = text[i + 1] === "\n" ? 120 : 620;
      else if (".!?".includes(ch)) wait = 560;
      else if (",;:".includes(ch)) wait = 280;
      await sleep(wait);
    }
    typed.setAttribute("aria-hidden", "false");
  }

  /* ---------- Akış ---------- */
  async function play() {
    cancelAll();
    const token = ++run;
    body.classList.remove("is-final");
    glove.style.opacity = "0";
    glove.style.transform = "";
    gOpen.style.opacity = "1";
    gFist.style.opacity = "0";
    blackout.style.opacity = "0";
    typed.textContent = "";
    skipBtn.hidden = false;
    soundHint.hidden = audioReady();
    show("glove");

    // yazı tiplerini bekle (en fazla 1.8 sn)
    await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), sleep(1800)]);
    if (!alive(token)) return;
    await sleep(600);
    if (!alive(token)) return;

    // Eldiven yandan belirir (sallamaz)
    await animate(glove, [
      { transform: "translateX(70vw) rotate(8deg)", opacity: 0 },
      { transform: "translateX(0) rotate(0deg)", opacity: 1 }
    ], { duration: 1500, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
    if (!alive(token)) return;
    await sleep(700);
    if (!alive(token)) return;

    // Yumruk olur
    animate(glove, [
      { transform: "scale(1,1)" }, { transform: "scale(1.04,0.95)", offset: 0.5 }, { transform: "scale(1,1)" }
    ], { duration: 280, easing: "ease-out", fill: "forwards" });
    animate(gOpen, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
    await animate(gFist, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: "forwards" });
    if (!alive(token)) return;
    await sleep(520);
    if (!alive(token)) return;

    // Üç kez ekranı çalar (izleyiciye doğru)
    const gaps = [300, 340, 0];
    for (let i = 0; i < 3; i++) {
      await knock(token, i === 2 ? 1.1 : 1);
      if (!alive(token)) return;
      await sleep(gaps[i]);
      if (!alive(token)) return;
    }
    soundHint.hidden = true;
    await sleep(900);
    if (!alive(token)) return;

    // Eldiven yandan çekilir
    await animate(glove, [
      { transform: "translateX(0) scale(1)", opacity: 1 },
      { transform: "translateX(70vw) scale(0.95)", opacity: 0 }
    ], { duration: 900, easing: "cubic-bezier(.5,0,.8,.4)", fill: "forwards" });
    if (!alive(token)) return;
    await sleep(500);
    if (!alive(token)) return;

    // Are you ready?
    show("ready");
    const readyWrap = $(".ready-wrap");
    await animate(readyWrap, [
      { opacity: 0, transform: "translateY(14px)", letterSpacing: "0.12em" },
      { opacity: 1, transform: "translateY(0)", letterSpacing: "0.04em" }
    ], { duration: 2400, easing: "cubic-bezier(.2,.6,.2,1)", fill: "forwards" });
    if (!alive(token)) return;
    await sleep(2600);
    if (!alive(token)) return;
    await animate(readyWrap, [{ opacity: 1 }, { opacity: 0 }], { duration: 1500, easing: "ease-in", fill: "forwards" });
    if (!alive(token)) return;

    // Mektup
    show("letter");
    await sleep(900);
    if (!alive(token)) return;
    await typeLetter(token);
    if (!alive(token)) return;
    await sleep(Math.max(1500, Number(E.readHold) || 4500));
    if (!alive(token)) return;

    // Ekran koyulaşır
    await animate(blackout, [{ opacity: 0 }, { opacity: 1 }], { duration: 1700, easing: "ease-in-out", fill: "forwards" });
    if (!alive(token)) return;
    await sleep(900);
    if (!alive(token)) return;

    finish(token);
  }

  function finish(token) {
    if (token !== undefined && !alive(token)) return;
    const fromBlack = token !== undefined;
    cancelAll();
    run++;
    body.classList.add("is-final");
    skipBtn.hidden = true;
    soundHint.hidden = true;
    show("card");
    const card = $(".card");
    if (!reduceMotion) {
      if (fromBlack) {
        blackout.style.opacity = "1";
        animate(blackout, [{ opacity: 1 }, { opacity: 0 }], { duration: 1600, easing: "ease-out", fill: "forwards" })
          .then(() => { blackout.style.opacity = "0"; });
      } else {
        blackout.style.opacity = "0";
      }
      animate(card, [
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], { duration: 1400, easing: "cubic-bezier(.2,.6,.2,1)" });
    } else {
      blackout.style.opacity = "0";
    }
  }

  skipBtn.addEventListener("click", () => finish());
  replayBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0 });
    play();
  });

  /* ---------- Katılım ---------- */
  const form = $("#rsvp");
  const stepAnswer = $("#step-answer");
  const stepName = $("#step-name");
  const nameInput = $("#name");
  const nameLabel = $("#name-label");
  const nameHelp = $("#name-help");
  const submitBtn = $("#submit");
  const statusEl = $("#status");
  const done = $("#done");
  let answer = null;

  const LS = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* no-op */ } }
  };
  function visitorId() {
    let id = LS.get("davet.visitor");
    if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
        : Array.from({ length: 32 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
      LS.set("davet.visitor", id);
    }
    return id;
  }

  function chooseAnswer(a) {
    answer = a;
    stepAnswer.hidden = true;
    stepName.hidden = false;
    statusEl.textContent = "";
    statusEl.classList.remove("is-error");
    nameHelp.textContent = "";
    nameHelp.classList.remove("is-error");
    nameInput.removeAttribute("aria-invalid");
    if (a === "yes") {
      nameLabel.textContent = "Adın ve soyadın";
      nameInput.required = true;
      nameInput.placeholder = "";
      submitBtn.textContent = "Katılımımı onayla";
    } else {
      nameLabel.textContent = "İstersen adını bırak";
      nameInput.required = false;
      nameInput.placeholder = "İsteğe bağlı";
      submitBtn.textContent = "Gönder";
    }
    const saved = LS.get("davet.name");
    if (saved && !nameInput.value) nameInput.value = saved;
    setTimeout(() => nameInput.focus({ preventScroll: false }), 50);
  }

  form.querySelectorAll("[data-answer]").forEach((b) => {
    b.addEventListener("click", () => chooseAnswer(b.dataset.answer));
  });
  $("#back").addEventListener("click", () => {
    answer = null;
    stepName.hidden = true;
    stepAnswer.hidden = false;
  });

  function cleanName(v) {
    return String(v || "").replace(/[\u0000-\u001f\u007f-\u009f]/g, "").replace(/\s+/g, " ").trim();
  }

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!answer) return;
    const name = cleanName(nameInput.value);
    if (answer === "yes" && name.length < 2) {
      nameHelp.textContent = "Listeye ekleyebilmemiz için adını yaz.";
      nameHelp.classList.add("is-error");
      nameInput.setAttribute("aria-invalid", "true");
      nameInput.focus();
      return;
    }
    if (name.length > 80) {
      nameHelp.textContent = "Ad en fazla 80 karakter olabilir.";
      nameHelp.classList.add("is-error");
      nameInput.setAttribute("aria-invalid", "true");
      return;
    }
    submitBtn.disabled = true;
    statusEl.classList.remove("is-error");
    statusEl.textContent = "Kaydediliyor…";
    try {
      const res = await fetch((E.apiBase || "") + "/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, name, visitor: visitorId() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "server");
      LS.set("davet.answer", answer);
      LS.set("davet.name", name);
      showDone(answer, name);
    } catch (e) {
      statusEl.classList.add("is-error");
      statusEl.textContent = "Kaydedilemedi. Bağlantını kontrol edip tekrar dene.";
    } finally {
      submitBtn.disabled = false;
    }
  });

  function showDone(a, name) {
    form.hidden = true;
    done.hidden = false;
    statusEl.textContent = "";
    const first = name ? name.split(" ")[0] : "";
    if (a === "yes") {
      $("#done-title").textContent = first ? `Teşekkürler, ${first}.` : "Teşekkürler.";
      $("#done-text").textContent = "Adını listeye ekledik. Masada görüşürüz.";
    } else {
      $("#done-title").textContent = first ? `Anlaşıldı, ${first}.` : "Anlaşıldı.";
      $("#done-text").textContent = "Haber verdiğin için teşekkürler. Bir dahaki sefere.";
    }
  }

  $("#change").addEventListener("click", () => {
    done.hidden = true;
    form.hidden = false;
    answer = null;
    stepName.hidden = true;
    stepAnswer.hidden = false;
  });

  /* ---------- Başlat ---------- */
  fillDetails();
  const prev = LS.get("davet.answer");
  if (prev === "yes" || prev === "no") showDone(prev, LS.get("davet.name") || "");

  if (reduceMotion) {
    finish();
  } else {
    play();
  }
})();
