(function (global) {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function createNode(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === "string") el.textContent = text;
    return el;
  }

  function renderMessage(listEl, role, text) {
    const item = createNode("div", `chatMsg ${role}`);
    item.textContent = text;
    listEl.appendChild(item);
    listEl.scrollTop = listEl.scrollHeight;
  }

  function setupFloatingWidget(root, storageKey) {
    const card = root.closest(".floatingCopilot") || root;
    const header = card.querySelector(".floatingCopilotHead");
    if (!card || !header) return;

    const persistKey = `uxsdk.floatingWidget.${storageKey || root.id || "copilot"}`;

    function persist() {
      const rect = card.getBoundingClientRect();
      const payload = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
      try {
        localStorage.setItem(persistKey, JSON.stringify(payload));
      } catch {}
    }

    function applySavedRect() {
      try {
        const raw = localStorage.getItem(persistKey);
        if (!raw) return;
        const saved = JSON.parse(raw);
        const width = Number(saved.width);
        const height = Number(saved.height);
        const left = Number(saved.left);
        const top = Number(saved.top);
        if (Number.isFinite(width)) card.style.width = `${width}px`;
        if (Number.isFinite(height)) card.style.height = `${height}px`;
        if (Number.isFinite(left) && Number.isFinite(top)) {
          card.style.left = `${clamp(left, 8, Math.max(8, window.innerWidth - 160))}px`;
          card.style.top = `${clamp(top, 8, Math.max(8, window.innerHeight - 80))}px`;
          card.style.right = "auto";
          card.style.bottom = "auto";
        }
      } catch {}
    }

    applySavedRect();

    let dragState = null;

    header.addEventListener("mousedown", (event) => {
      if (event.target.closest("button, a, input, textarea, select, label")) return;
      const rect = card.getBoundingClientRect();
      dragState = {
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
      };
      card.classList.add("is-dragging");
      event.preventDefault();
    });

    window.addEventListener("mousemove", (event) => {
      if (!dragState) return;
      const rect = card.getBoundingClientRect();
      const nextLeft = clamp(event.clientX - dragState.offsetX, 8, Math.max(8, window.innerWidth - rect.width - 8));
      const nextTop = clamp(event.clientY - dragState.offsetY, 8, Math.max(8, window.innerHeight - rect.height - 8));
      card.style.left = `${nextLeft}px`;
      card.style.top = `${nextTop}px`;
      card.style.right = "auto";
      card.style.bottom = "auto";
    });

    window.addEventListener("mouseup", () => {
      if (!dragState) return;
      dragState = null;
      card.classList.remove("is-dragging");
      persist();
    });

    if (typeof ResizeObserver === "function") {
      const resizeObserver = new ResizeObserver(() => persist());
      resizeObserver.observe(card);
    }

    window.addEventListener("resize", () => {
      const rect = card.getBoundingClientRect();
      const nextLeft = clamp(rect.left, 8, Math.max(8, window.innerWidth - rect.width - 8));
      const nextTop = clamp(rect.top, 8, Math.max(8, window.innerHeight - rect.height - 8));
      card.style.left = `${nextLeft}px`;
      card.style.top = `${nextTop}px`;
      card.style.right = "auto";
      card.style.bottom = "auto";
      persist();
    });
  }

  function initAnalyticsChat(options) {
    const root = document.getElementById(options.rootId);
    if (!root) return null;

    const messagesEl = root.querySelector(".chatMessages");
    const inputEl = root.querySelector(".chatInput");
    const sendBtn = root.querySelector(".chatSendBtn");
    const quickButtons = root.querySelectorAll("button[data-q]");
    const statusEl = root.querySelector(".chatStatus");

    const state = {
      sessionId: `analytics_${Math.random().toString(16).slice(2, 10)}`,
      selectedExperimentKey: null,
      selectedElement: null,
      page: options.page,
    };

    if (options.floatingStorageKey) {
      setupFloatingWidget(root, options.floatingStorageKey);
    }

    function setBusy(busy, label) {
      if (sendBtn) sendBtn.disabled = busy;
      if (inputEl) inputEl.disabled = busy;
      if (statusEl) statusEl.textContent = label || (busy ? "분석 중…" : "준비 완료");
    }

    function getContext() {
      const extra = typeof options.getContext === "function" ? options.getContext() : {};
      return {
        page: state.page,
        selectedExperimentKey: state.selectedExperimentKey,
        selectedElement: state.selectedElement,
        sessionId: state.sessionId,
        ...extra,
      };
    }

    async function send(content) {
      const text = String(content || "").trim();
      if (!text) return;
      renderMessage(messagesEl, "user", text);
      setBusy(true, "분석 중…");

      const payload = {
        agent: "analytics_copilot",
        messages: [{ role: "user", content: text }],
        context: getContext(),
      };

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.reason || "chat failed");

        renderMessage(messagesEl, "assistant", data.answer || "(no answer)");
        if (statusEl) statusEl.textContent = `응답 모드: ${data?.meta?.llmMode || "unknown"}`;

        const actions = Array.isArray(data.actions) ? data.actions : [];
        const expAction = actions.find((a) => a.type === "experiment_draft");
        if (expAction && typeof options.onExperimentDraft === "function") {
          options.onExperimentDraft(expAction.draft);
        }
        const changesAction = actions.find((a) => a.type === "editor_changes");
        if (changesAction && typeof options.onEditorChanges === "function") {
          options.onEditorChanges(changesAction.changesB || [], expAction?.draft || null);
        }
      } catch (err) {
        renderMessage(messagesEl, "assistant", `오류: ${String(err)}`);
        if (statusEl) statusEl.textContent = "오류가 발생했어요";
      } finally {
        setBusy(false, statusEl?.textContent || "준비 완료");
      }
    }

    sendBtn.addEventListener("click", () => {
      send(inputEl.value);
      inputEl.value = "";
    });

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send(inputEl.value);
        inputEl.value = "";
      }
    });

    for (const btn of quickButtons) {
      btn.addEventListener("click", () => send(btn.dataset.q || ""));
    }

    renderMessage(messagesEl, "assistant", "분석 코파일럿이 준비됐습니다. 빠른 액션 버튼이나 질문을 입력해 주세요.");
    if (statusEl) statusEl.textContent = "준비 완료";

    return {
      setSelectedExperimentKey(key) {
        state.selectedExperimentKey = key || null;
      },
      setSelectedElement(element) {
        state.selectedElement = element || null;
      },
      send,
    };
  }

  global.AnalyticsChat = { init: initAnalyticsChat };
})(window);
