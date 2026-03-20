(function () {
  function createMessage(role, text) {
    const el = document.createElement("div");
    el.className = `chatbotMessage ${role}`;
    el.textContent = String(text || "");
    return el;
  }

  function initAnalyticsChatWidget(options) {
    const fab = document.getElementById(options.fabId);
    const panel = document.getElementById(options.panelId);
    const closeBtn = document.getElementById(options.closeBtnId);
    const messagesEl = document.getElementById(options.messagesId);
    const inputEl = document.getElementById(options.inputId);
    const sendBtn = document.getElementById(options.sendBtnId);
    const selectedExperimentEl = document.getElementById(options.selectedExperimentId);
    const quickButtons = Array.from(panel?.querySelectorAll("[data-q]") || []);

    if (!fab || !panel || !messagesEl || !inputEl || !sendBtn) return null;

    const openKey = `uxsdk.chatWidget.open.${options.storageKey || "default"}`;
    const state = {
      isOpen: false,
      sessionId: `analytics_${Math.random().toString(16).slice(2, 10)}`,
      selectedExperimentKey: null,
    };

    function scrollToBottom() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function renderMessage(role, text) {
      messagesEl.appendChild(createMessage(role, text));
      scrollToBottom();
    }

    function setOpen(nextOpen) {
      state.isOpen = !!nextOpen;
      panel.classList.toggle("is-hidden", !state.isOpen);
      panel.setAttribute("aria-hidden", state.isOpen ? "false" : "true");
      fab.setAttribute("aria-expanded", state.isOpen ? "true" : "false");
      try {
        localStorage.setItem(openKey, state.isOpen ? "1" : "0");
      } catch {}
      if (state.isOpen) {
        setTimeout(() => inputEl.focus(), 120);
      }
    }

    function setBusy(busy) {
      sendBtn.disabled = busy;
      inputEl.disabled = busy;
    }

    function setSelectedExperimentKey(key) {
      state.selectedExperimentKey = key || null;
      if (!selectedExperimentEl) return;
      selectedExperimentEl.textContent = state.selectedExperimentKey
        ? `${state.selectedExperimentKey} 기준으로 응답 중`
        : "실험을 선택하면 더 구체적으로 도와줄 수 있어요";
    }

    async function send(text) {
      const content = String(text || "").trim();
      if (!content) return;

      renderMessage("user", content);
      inputEl.value = "";
      setBusy(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            agent: "analytics_copilot",
            messages: [{ role: "user", content }],
            context: {
              page: "dashboard",
              selectedExperimentKey: state.selectedExperimentKey,
              sessionId: state.sessionId,
            },
          }),
        });

        const data = await response.json();
        if (!data?.ok) throw new Error(data?.reason || "chat failed");

        renderMessage("assistant", data.answer || "응답이 비어 있어요.");

        const actions = Array.isArray(data.actions) ? data.actions : [];
        const draftAction = actions.find((item) => item.type === "experiment_draft");
        const changesAction = actions.find((item) => item.type === "editor_changes");
        if (draftAction && typeof options.onExperimentDraft === "function") {
          options.onExperimentDraft(draftAction.draft);
        }
        if (changesAction && typeof options.onEditorChanges === "function") {
          options.onEditorChanges(changesAction.changesB || [], draftAction?.draft || null);
        }
      } catch (error) {
        renderMessage("assistant", `오류: ${String(error)}`);
      } finally {
        setBusy(false);
      }
    }

    fab.addEventListener("click", () => setOpen(!state.isOpen));
    if (closeBtn) closeBtn.addEventListener("click", () => setOpen(false));
    sendBtn.addEventListener("click", () => send(inputEl.value));
    inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        send(inputEl.value);
      }
    });
    quickButtons.forEach((btn) => {
      btn.addEventListener("click", () => send(btn.dataset.q || ""));
    });

    renderMessage("assistant", "안녕하세요. 현재 실험 성과를 해석하거나 다음 A/B 테스트 아이디어를 제안해드릴게요.");

    try {
      setOpen(localStorage.getItem(openKey) === "1");
    } catch {
      setOpen(false);
    }

    return {
      setSelectedExperimentKey,
      open() {
        setOpen(true);
      },
      close() {
        setOpen(false);
      },
      send,
    };
  }

  window.AnalyticsChatWidget = {
    init: initAnalyticsChatWidget,
  };
})();
