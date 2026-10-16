const state = {
  sessionId: null,
  categories: [],
  catIndex: 0,
  answers: {},
  liveMatter: null,
  preview: false,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function showStep(name) {
  $$(".panel").forEach((el) => {
    el.hidden = el.dataset.step !== name;
  });
  const wrap = $("#progressWrap");
  const labels = {
    landing: ["Welcome", 5],
    contact: ["Your details", 20],
    profile: ["Business profile", 40],
    questions: ["Assessment questions", 70],
    results: ["Your results", 100],
  };
  if (name === "landing") {
    wrap.hidden = true;
  } else {
    wrap.hidden = false;
    const [label, pct] = labels[name] || ["", 0];
    $("#stepLabel").textContent = label;
    $("#progressFill").style.width = `${pct}%`;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.detail?.message ||
      (typeof data?.detail === "string" ? data.detail : null) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function exclusiveChips(container) {
  container.addEventListener("change", (e) => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") return;
    if (!input.checked) return;
    const exclusive = input.hasAttribute("data-exclusive");
    container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      if (cb === input) return;
      if (exclusive || cb.hasAttribute("data-exclusive")) cb.checked = false;
    });
  });
}

function collectChecks(name) {
  return $$(`input[name="${name}"]:checked`).map((el) => el.value);
}

function collectRadio(name) {
  const el = $(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}

function renderCategory() {
  const cat = state.categories[state.catIndex];
  if (!cat) return;
  $("#categoryTitle").textContent = cat.name;
  const answered = cat.questions.filter((q) => state.answers[q.id]).length;
  $("#categoryMeta").textContent = `${answered} of ${cat.questions.length} answered in this section · ${state.categories.length} sections total`;
  $("#progressCount").textContent = `Section ${state.catIndex + 1}/${state.categories.length}`;
  const overallAnswered = Object.keys(state.answers).length;
  const overallTotal = state.categories.reduce((n, c) => n + c.questions.length, 0);
  const base = 40;
  const span = 55;
  $("#progressFill").style.width = `${base + (overallAnswered / Math.max(overallTotal, 1)) * span}%`;

  const nav = $("#catNav");
  nav.innerHTML = "";
  state.categories.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cat-pill" + (i === state.catIndex ? " active" : "");
    const done = c.questions.every((q) => state.answers[q.id]);
    if (done) btn.classList.add("done");
    btn.textContent = c.name.split(" ")[0];
    btn.title = c.name;
    btn.addEventListener("click", () => {
      state.catIndex = i;
      renderCategory();
    });
    nav.appendChild(btn);
  });

  const list = $("#questionList");
  list.innerHTML = "";
  cat.questions.forEach((q) => {
    const card = document.createElement("article");
    card.className = "question-card" + (q.critical ? " critical" : "");
    card.innerHTML = `
      <div class="q-meta">
        <span class="tag">${q.id}</span>
        ${q.critical ? '<span class="tag">Critical control</span>' : ""}
      </div>
      <p class="q-text">${escapeHtml(q.question)}</p>
      ${q.help ? `<p class="q-help">${escapeHtml(q.help)}</p>` : ""}
      <div class="answer-list" role="radiogroup" aria-label="${escapeHtml(q.id)}"></div>
    `;
    const group = card.querySelector(".answer-list");
    q.answers.forEach((a) => {
      const id = `${q.id}_${a.code}`;
      const label = document.createElement("label");
      label.innerHTML = `
        <input type="radio" name="${q.id}" value="${a.code}" id="${id}" />
        <span>${escapeHtml(a.label)}</span>
      `;
      const input = label.querySelector("input");
      if (state.answers[q.id] === a.code) input.checked = true;
      input.addEventListener("change", async () => {
        state.answers[q.id] = a.code;
        try {
          await api(`/api/session/${state.sessionId}/answer`, {
            method: "PUT",
            body: JSON.stringify({ question_id: q.id, response: a.code }),
          });
          renderCategory();
        } catch (err) {
          alert(err.message);
        }
      });
      group.appendChild(label);
    });
    list.appendChild(card);
  });

  $("#btnPrevCat").disabled = state.catIndex === 0;
  const last = state.catIndex >= state.categories.length - 1;
  $("#btnNextCat").textContent = last ? "Submit & view results" : "Next category";
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderResults(data) {
  const previewBanner = $("#previewBanner");
  const browseBtn = $("#btnBrowseDemo");
  if (data.preview) {
    previewBanner.hidden = false;
    $("#previewBannerText").textContent =
      data.preview_label ||
      "Fictional Score Sandbox demo inputs from the v3 build pack.";
    browseBtn.hidden = false;
  } else {
    previewBanner.hidden = true;
    browseBtn.hidden = true;
  }

  $("#resultPosition").textContent = data.overall_position;
  if (data.published_score != null) {
    $("#resultScore").textContent = `${Number(data.published_score).toFixed(1)} / 100`;
  } else {
    $("#resultScore").textContent = "Score not published";
  }
  const unk =
    data.unknown_share_overall != null
      ? ` · ${((data.unknown_share_overall || 0) * 100).toFixed(1)}% unknown`
      : "";
  $("#resultSummary").textContent =
    `${data.critical_count} Critical · ${data.high_priority_count} High-priority alerts${unk}. ` +
    `This is a reported-practice score, not a compliance percentage.`;

  const alertBlock = $("#alertBlock");
  const alertList = $("#alertList");
  alertList.innerHTML = "";
  if (data.alerts?.length) {
    alertBlock.hidden = false;
    data.alerts.forEach((a) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${escapeHtml(a.title)}</strong>`;
      alertList.appendChild(li);
    });
  } else {
    alertBlock.hidden = true;
  }

  const wsBlock = $("#workstreamBlock");
  const wsList = $("#workstreamList");
  wsList.innerHTML = "";
  if (data.workstreams?.length) {
    wsBlock.hidden = false;
    data.workstreams.forEach((ws, i) => {
      const el = document.createElement("article");
      el.className = "workstream";
      el.innerHTML = `
        <h4>Workstream ${i + 1}: ${escapeHtml(ws.lead_finding)}</h4>
        <p><strong>Risk / priority:</strong> ${escapeHtml(ws.risk_priority)}</p>
        <p><strong>Why it matters:</strong> ${escapeHtml(ws.why_it_matters)}</p>
        <p><strong>Do first:</strong> ${escapeHtml(ws.do_first)}</p>
        <p><strong>Who owns it:</strong> ${escapeHtml(ws.owner || "—")}</p>
        <p><strong>You reported:</strong> ${escapeHtml(ws.you_reported || "—")}</p>
      `;
      wsList.appendChild(el);
    });
  } else {
    wsBlock.hidden = true;
  }

  const bars = $("#domainBars");
  bars.innerHTML = "";
  (data.domains || []).forEach((d) => {
    const row = document.createElement("div");
    row.className = "domain-row";
    const pct = d.score_pct == null ? 0 : Number(d.score_pct);
    row.innerHTML = `
      <div class="name" title="${escapeHtml(d.display)}">${escapeHtml(d.name)}</div>
      <div class="bar"><span style="width:${Math.min(100, Math.max(0, pct))}%"></span></div>
      <div class="pct">${d.score_pct == null ? "—" : pct.toFixed(0)}</div>
    `;
    bars.appendChild(row);
  });

  $("#markdownReport").textContent = data.markdown || "";
}

async function submitAssessment() {
  const missing = [];
  state.categories.forEach((c) => {
    c.questions.forEach((q) => {
      if (!state.answers[q.id]) missing.push(q.id);
    });
  });
  if (missing.length) {
    alert(`Please answer all questions before submitting (${missing.length} remaining).`);
    // jump to first incomplete category
    const idx = state.categories.findIndex((c) =>
      c.questions.some((q) => !state.answers[q.id])
    );
    if (idx >= 0) {
      state.catIndex = idx;
      renderCategory();
    }
    return;
  }
  try {
    const data = await api(`/api/session/${state.sessionId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers: state.answers }),
    });
    showStep("results");
    renderResults(data);
    $("#progressFill").style.width = "100%";
    $("#stepLabel").textContent = "Your results";
  } catch (err) {
    alert(err.message);
  }
}

function wireExclusiveGroups() {
  $$(".chips[data-multi]").forEach(exclusiveChips);
}

function init() {
  wireExclusiveGroups();

  $("#btnStart").addEventListener("click", () => showStep("contact"));
  $("#btnBackContact").addEventListener("click", () => showStep("contact"));
  $("#btnRestart").addEventListener("click", () => {
    Object.assign(state, {
      sessionId: null,
      categories: [],
      catIndex: 0,
      answers: {},
      liveMatter: null,
      preview: false,
    });
    showStep("landing");
  });

  $("#btnPreview").addEventListener("click", async () => {
    try {
      const data = await api("/api/preview/sandbox", { method: "POST", body: "{}" });
      state.sessionId = data.session_id;
      state.categories = data.categories;
      state.answers = data.answers || {};
      state.catIndex = 0;
      state.preview = true;
      state.liveMatter = "no";
      showStep("results");
      renderResults(data.result);
      $("#progressFill").style.width = "100%";
      $("#stepLabel").textContent = "Client Preview";
      $("#progressWrap").hidden = false;
    } catch (err) {
      alert(err.message);
    }
  });

  $("#btnBrowseDemo").addEventListener("click", () => {
    if (!state.categories.length) return;
    state.catIndex = 0;
    $("#liveMatterBanner").hidden = true;
    showStep("questions");
    renderCategory();
  });

  $("#contactForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    try {
      const data = await api("/api/session", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      state.sessionId = data.session_id;
      showStep("profile");
    } catch (err) {
      alert(err.message);
    }
  });

  $("#profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      arrangements: collectChecks("arrangements"),
      pay_rules: collectChecks("pay_rules"),
      specific: collectChecks("specific"),
      work: collectChecks("work"),
      managers: collectRadio("managers"),
      ai_tools: collectRadio("ai_tools"),
      after_hours: collectRadio("after_hours"),
      change: collectRadio("change"),
      live_matter: collectRadio("live_matter"),
      targeted: {
        pay_error: collectRadio("pay_error"),
        adjustment: collectRadio("adjustment"),
        shared_work: collectRadio("shared_work"),
      },
    };
    try {
      const data = await api(`/api/session/${state.sessionId}/profile`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      state.categories = data.categories;
      state.catIndex = 0;
      state.answers = {};
      state.liveMatter = data.live_matter;
      $("#liveMatterBanner").hidden = !(
        data.live_matter === "yes" || data.live_matter === "need_to_confirm"
      );
      showStep("questions");
      renderCategory();
    } catch (err) {
      alert(err.message);
    }
  });

  $("#btnPrevCat").addEventListener("click", () => {
    if (state.catIndex > 0) {
      state.catIndex -= 1;
      renderCategory();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  $("#btnNextCat").addEventListener("click", async () => {
    const cat = state.categories[state.catIndex];
    const incomplete = cat.questions.filter((q) => !state.answers[q.id]);
    if (incomplete.length) {
      alert(`Answer all questions in this section (${incomplete.length} left).`);
      return;
    }
    if (state.catIndex < state.categories.length - 1) {
      state.catIndex += 1;
      renderCategory();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      await submitAssessment();
    }
  });

  showStep("landing");
}

init();
