// public/editor.js
(function () {
  const frame = document.getElementById("previewFrame");
  const targetSelect = document.getElementById("targetSelect");
  const reloadBtn = document.getElementById("reloadBtn");
  const togglePickBtn = document.getElementById("togglePickBtn");

  const variantABtn = document.getElementById("variantABtn");
  const variantBBtn = document.getElementById("variantBBtn");

  const expKeyInput = document.getElementById("expKey");
  const urlPrefixInput = document.getElementById("urlPrefix");

  const statusText = document.getElementById("statusText");
  const selectorText = document.getElementById("selectorText");
  const tagText = document.getElementById("tagText");
  const trackIdText = document.getElementById("trackIdText");
  const textText = document.getElementById("textText");
  const rectText = document.getElementById("rectText");
  const logBox = document.getElementById("logBox");

  const actionType = document.getElementById("actionType");
  const valueRow = document.getElementById("valueRow");
  const actionValue = document.getElementById("actionValue");

  const attrRow = document.getElementById("attrRow");
  const attrName = document.getElementById("attrName");
  const attrValue = document.getElementById("attrValue");

  const cssRow = document.getElementById("cssRow");
  const cssValue = document.getElementById("cssValue");
  const styleRow = document.getElementById("styleRow");
  const styleValue = document.getElementById("styleValue");

  const addChangeBtn = document.getElementById("addChangeBtn");
  const applyNowBtn = document.getElementById("applyNowBtn");
  const realApplyBtn = document.getElementById("realApplyBtn");
  const openRealBtn = document.getElementById("openRealBtn");
  const clearChangesBtn = document.getElementById("clearChangesBtn");

  const changesList = document.getElementById("changesList");
  const exportJsonBtn = document.getElementById("exportJsonBtn");
  const copyJsonBtn = document.getElementById("copyJsonBtn");
  const jsonBox = document.getElementById("jsonBox");

  let pickMode = true;
  let currentVariant = "A";
  let lastSelected = null;
  let changesB = [];

  function log(msg) {
    const t = new Date().toLocaleTimeString();
    logBox.textContent = `[${t}] ${msg}\n` + logBox.textContent;
  }

  function postToFrame(type, payload) {
    try {
      frame.contentWindow.postMessage({ type, ...(payload || {}) }, location.origin);
      return true;
    } catch (e) {
      log(`postMessage 실패: ${String(e)}`);
      return false;
    }
  }

  function setPickMode(on) {
    pickMode = on;
    togglePickBtn.dataset.state = on ? "on" : "off";
    togglePickBtn.textContent = `선택모드: ${on ? "ON" : "OFF"}`;
    togglePickBtn.classList.toggle("primary", on);
    postToFrame("EDITOR_SET_PICKMODE", { pickMode: on });
    log(`pickMode -> ${on}`);
  }

  function setVariant(v) {
    currentVariant = v;
    variantABtn.classList.toggle("active", v === "A");
    variantBBtn.classList.toggle("active", v === "B");

    if (v === "A") {
      postToFrame("EDITOR_PREVIEW_SET_VARIANT", { variant: "A", changes: [] });
      log("preview -> Variant A (reset)");
    } else {
      postToFrame("EDITOR_PREVIEW_SET_VARIANT", { variant: "B", changes: changesB });
      log(`preview -> Variant B (apply ${changesB.length} changes)`);
    }
  }

  // iframe 로드마다 overlay 주입
  function injectOverlay() {
    statusText.textContent = "iframe 로드됨. 오버레이 주입 중…";
    try {
      const doc = frame.contentDocument;
      if (!doc) throw new Error("iframe contentDocument 접근 불가");

      if (doc.getElementById("__visual_editor_overlay__")) {
        statusText.textContent = "오버레이 이미 활성화됨";
        setPickMode(pickMode);
        setVariant(currentVariant);
        return;
      }

      const script = doc.createElement("script");
      script.id = "__visual_editor_overlay__";
      script.src = "/editor-overlay.js";
      script.async = false;

      script.onload = () => {
        statusText.textContent = "오버레이 활성화됨";
        log("overlay injected");
        setPickMode(pickMode);
        setVariant(currentVariant);
      };

      script.onerror = () => {
        statusText.textContent = "오버레이 주입 실패 (CSP/권한 확인)";
        log("overlay inject failed");
      };

      doc.documentElement.appendChild(script);
    } catch (e) {
      statusText.textContent = "오버레이 주입 실패(동일 origin인지 확인)";
      log(`inject error: ${String(e)}`);
    }
  }

  function renderSelected(info) {
    selectorText.textContent = info?.selector || "—";
    tagText.textContent = info?.tag || "—";
    trackIdText.textContent = info?.track_id || "—";
    textText.textContent = info?.text || "—";
    rectText.textContent = info?.rect
      ? `x:${info.rect.x} y:${info.rect.y} w:${info.rect.w} h:${info.rect.h}`
      : "—";
  }

  function parseStyleDeclarations(input) {
    const raw = String(input || "").trim();
    if (!raw) {
      return { ok: false, reason: "스타일 선언을 입력하세요." };
    }

    const styles = {};
    const chunks = raw.split(/;|\r?\n/);

    for (const chunk of chunks) {
      const line = chunk.trim();
      if (!line) continue;

      const colonIdx = line.indexOf(":");
      if (colonIdx <= 0) {
        return { ok: false, reason: `잘못된 선언: ${line}` };
      }

      const property = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      if (!property || !value) {
        return { ok: false, reason: `잘못된 선언: ${line}` };
      }

      styles[property] = value;
    }

    const entries = Object.entries(styles);
    if (entries.length === 0) {
      return { ok: false, reason: "스타일 선언을 입력하세요." };
    }

    return { ok: true, styles };
  }

  function normalizeChangeFromUI() {
    if (!lastSelected && actionType.value !== "inject_css") {
      alert("먼저 iframe에서 요소를 클릭해 선택하세요.");
      return null;
    }

    const type = actionType.value;

    if (type === "inject_css") {
      const css = (cssValue.value || "").trim();
      if (!css) { alert("CSS 내용을 입력하세요."); return null; }
      return { type: "inject_css", css };
    }

    const selector = lastSelected.selector;
    if (!selector) { alert("selector가 없습니다."); return null; }

    if (type === "hide" || type === "show") {
      return { selector, actions: [{ type }] };
    }

    if (type === "set_text") {
      const v = (actionValue.value || "").trim();
      if (!v) { alert("텍스트를 입력하세요."); return null; }
      return { selector, actions: [{ type: "set_text", value: v }] };
    }

    if (type === "set_style") {
      const parsed = parseStyleDeclarations(styleValue.value);
      if (!parsed.ok) { alert(parsed.reason); return null; }
      return { selector, actions: [{ type: "set_style", styles: parsed.styles }] };
    }

    if (type === "add_class" || type === "remove_class") {
      const v = (actionValue.value || "").trim();
      if (!v) { alert("클래스명을 입력하세요."); return null; }
      return { selector, actions: [{ type, value: v }] };
    }

    if (type === "set_attr") {
      const n = (attrName.value || "").trim();
      const v = (attrValue.value || "").trim();
      if (!n) { alert("attr name을 입력하세요."); return null; }
      return { selector, actions: [{ type: "set_attr", name: n, value: v }] };
    }

    alert("지원하지 않는 action입니다.");
    return null;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderChangesList() {
    changesList.innerHTML = "";
    if (changesB.length === 0) {
      changesList.innerHTML = `<div class="changeMeta">변경 없음 (Variant B)</div>`;
      return;
    }

    changesB.forEach((c, idx) => {
      const el = document.createElement("div");
      el.className = "changeItem";

      let meta = "";
      let code = "";

      if (c.type === "inject_css") {
        meta = `#${idx} · inject_css`;
        code = c.css;
      } else {
        meta = `#${idx} · selector: ${c.selector}`;
        code = JSON.stringify(c.actions, null, 2);
      }

      el.innerHTML = `
        <div class="changeTop">
          <div>
            <div class="changeMeta">${escapeHtml(meta)}</div>
            <div class="mono changeCode">${escapeHtml(code)}</div>
          </div>
          <div class="changeBtns">
            <button class="btn smallBtn" data-act="apply" data-idx="${idx}">프리뷰(B)</button>
            <button class="btn danger smallBtn" data-act="del" data-idx="${idx}">삭제</button>
          </div>
        </div>
      `;

      changesList.appendChild(el);
    });
  }

  function applyPreviewNow() {
    if (currentVariant !== "B") setVariant("B");
    postToFrame("EDITOR_PREVIEW_SET_VARIANT", { variant: "B", changes: changesB });
    log(`preview apply (B, ${changesB.length})`);
  }

  function getDefaultExpKey() {
    const path = new URL(targetSelect.value, location.origin).pathname;
    if (path.startsWith("/checkout")) return "exp_checkout_cta_v1";
    if (path.startsWith("/detail")) return "exp_detail_cta_v1";
    return "exp_main_cta_v1";
  }

  function getDefaultUrlPrefix() {
    const path = new URL(targetSelect.value, location.origin).pathname;
    // query 제외하고 prefix만
    return path === "/" ? "/" : path;
  }

  async function realApplyToServer() {
    const expKey = (expKeyInput.value || "").trim() || getDefaultExpKey();
    const urlPrefix = (urlPrefixInput.value || "").trim() || getDefaultUrlPrefix();

    if (!expKey) { alert("experiment key가 필요합니다."); return; }
    if (!urlPrefix) { alert("url prefix가 필요합니다."); return; }

    // Real 적용은 서버에 “running”으로 저장/배포
    const payload = {
      site_id: "ab-sample",
      key: expKey,
      url_prefix: urlPrefix,
      traffic: { A: 50, B: 50 },
      goals: ["checkout_complete"],
      variants: {
        A: [],         // A는 원본(변경 없음)
        B: changesB    // B에만 변경
      }
    };

    try {
      const r = await fetch("/api/experiments/real-apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

      const j = await r.json();
      if (!j?.ok) {
        alert("Real 적용 실패: " + (j?.reason || "unknown"));
        log("real apply failed");
        return;
      }

      log(`✅ Real applied: ${expKey} (v${j.experiment.version}) url_prefix=${urlPrefix}`);

      // Real 적용 후: 실제 동작 확인을 위해 새 탭으로 열기
      const target = targetSelect.value;
      const realUrl = new URL(target, location.origin);
      realUrl.searchParams.set("__real", "1"); // 표시용(필수 아님)
      window.open(realUrl.toString(), "_blank", "noopener,noreferrer");

      alert(`Real 적용 완료!\n이제 새 탭에서 SDK가 서버 설정을 받아 A/B를 자동 실행합니다.\n(유저마다 A/B가 다를 수 있음)`);
    } catch (e) {
      alert("Real 적용 실패(네트워크): " + String(e));
      log(`real apply error: ${String(e)}`);
    }
  }

  // --- UI hooks ---
  targetSelect.addEventListener("change", () => {
    frame.src = targetSelect.value;
    // 기본값 자동 채우기
    expKeyInput.value = getDefaultExpKey();
    urlPrefixInput.value = getDefaultUrlPrefix();
    log(`navigate iframe -> ${targetSelect.value}`);
  });

  reloadBtn.addEventListener("click", () => {
    frame.contentWindow.location.reload();
    log("iframe reload");
  });

  togglePickBtn.addEventListener("click", () => setPickMode(!pickMode));
  variantABtn.addEventListener("click", () => setVariant("A"));
  variantBBtn.addEventListener("click", () => setVariant("B"));

  actionType.addEventListener("change", () => {
    const t = actionType.value;
    valueRow.style.display = "none";
    attrRow.style.display = "none";
    cssRow.style.display = "none";
    styleRow.style.display = "none";

    if (t === "set_text" || t === "add_class" || t === "remove_class") valueRow.style.display = "flex";
    if (t === "set_attr") attrRow.style.display = "flex";
    if (t === "inject_css") cssRow.style.display = "flex";
    if (t === "set_style") styleRow.style.display = "flex";
    if (t === "hide" || t === "show") {/* none */}
  });

  addChangeBtn.addEventListener("click", () => {
    const change = normalizeChangeFromUI();
    if (!change) return;

    changesB.push(change);
    renderChangesList();
    log(`change added (#${changesB.length - 1})`);

    if (currentVariant === "B") applyPreviewNow();
  });

  applyNowBtn.addEventListener("click", () => applyPreviewNow());
  realApplyBtn.addEventListener("click", () => realApplyToServer());

  openRealBtn.addEventListener("click", () => {
    const target = targetSelect.value;
    const u = new URL(target, location.origin);
    u.searchParams.set("__real", "1");
    window.open(u.toString(), "_blank", "noopener,noreferrer");
  });

  clearChangesBtn.addEventListener("click", () => {
    if (!confirm("Variant B 변경을 모두 삭제할까요?")) return;
    changesB = [];
    renderChangesList();
    jsonBox.value = "";
    log("changes cleared");
    if (currentVariant === "B") applyPreviewNow();
  });

  changesList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    const act = btn.dataset.act;

    if (!Number.isFinite(idx) || idx < 0 || idx >= changesB.length) return;

    if (act === "del") {
      changesB.splice(idx, 1);
      renderChangesList();
      log(`change deleted (#${idx})`);
      if (currentVariant === "B") applyPreviewNow();
    }
    if (act === "apply") {
      applyPreviewNow();
    }
  });

  exportJsonBtn.addEventListener("click", () => {
    const out = {
      variantB: changesB,
      meta: {
        target: targetSelect.value,
        exported_at: new Date().toISOString()
      }
    };
    jsonBox.value = JSON.stringify(out, null, 2);
    log("export json");
  });

  copyJsonBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(jsonBox.value || "");
      log("copied json");
    } catch (e) {
      alert("복사 실패: 브라우저 권한을 확인하세요.");
      log(`copy failed: ${String(e)}`);
    }
  });

  // iframe load hook
  frame.addEventListener("load", () => {
    log("iframe loaded");
    injectOverlay();
  });

  // iframe → parent 메시지 수신
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin) return;
    const data = event.data || {};

    if (data.type === "EDITOR_ELEMENT_HOVER") {
      statusText.textContent = `Hover: ${data.tag || "?"} ${data.selector || ""}`;
      return;
    }

    if (data.type === "EDITOR_ELEMENT_SELECTED") {
      statusText.textContent = "요소 선택됨 ✅";
      lastSelected = data;
      renderSelected(lastSelected);
      if (lastSelected.text) actionValue.placeholder = `예: ${lastSelected.text.slice(0, 30)}...`;
      log(`selected -> ${data.selector}`);
      return;
    }

    if (data.type === "EDITOR_APPLY_RESULT") {
      if (data.ok) log(`apply ok: ${data.message || ""}`);
      else log(`apply fail: ${data.message || ""}`);
      return;
    }

    if (data.type === "EDITOR_LOG") {
      log(`iframe: ${data.message}`);
      return;
    }
  });

  // init defaults
  expKeyInput.value = getDefaultExpKey();
  urlPrefixInput.value = getDefaultUrlPrefix();

  renderChangesList();
  actionType.dispatchEvent(new Event("change"));
  setPickMode(true);
  setVariant("A");
  log("editor ready");
})();
