async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (typeof data?.detail === "string" && data.detail) ||
      data?.detail?.message ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function formToObject(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

function setStatus(el, text, ok = true) {
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? "var(--teal)" : "var(--danger)";
}

document.addEventListener("DOMContentLoaded", () => {
  const filter = document.getElementById("questionFilter");
  const nav = document.getElementById("questionNav");
  if (filter && nav) {
    filter.addEventListener("input", () => {
      const q = filter.value.trim().toLowerCase();
      nav.querySelectorAll("li").forEach((li) => {
        const hay = (li.querySelector("a")?.dataset.filter || "").toLowerCase();
        li.hidden = Boolean(q) && !hay.includes(q);
      });
    });
  }

  const questionForm = document.getElementById("questionForm");
  if (questionForm) {
    questionForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const qid = questionForm.dataset.qid;
      const status = document.getElementById("questionStatus");
      try {
        await api(`/admin/api/content/questions/${encodeURIComponent(qid)}`, {
          method: "PUT",
          body: JSON.stringify(formToObject(questionForm)),
        });
        setStatus(status, "Saved");
      } catch (err) {
        setStatus(status, err.message, false);
      }
    });
  }

  document.querySelectorAll(".answer-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = form.querySelector(".save-status");
      try {
        await api(
          `/admin/api/content/answers/${encodeURIComponent(form.dataset.qid)}/${encodeURIComponent(form.dataset.code)}`,
          { method: "PUT", body: JSON.stringify(formToObject(form)) },
        );
        setStatus(status, "Saved");
      } catch (err) {
        setStatus(status, err.message, false);
      }
    });
  });

  document.querySelectorAll(".report-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = form.querySelector(".save-status");
      try {
        await api(`/admin/api/content/report-copy/${form.dataset.index}`, {
          method: "PUT",
          body: JSON.stringify(formToObject(form)),
        });
        setStatus(status, "Saved");
      } catch (err) {
        setStatus(status, err.message, false);
      }
    });
  });

  const reloadBtn = document.getElementById("btnReloadEngine");
  if (reloadBtn) {
    reloadBtn.addEventListener("click", async () => {
      if (!confirm("Replace the live content pack with engine/data/pack.json?")) return;
      try {
        await api("/admin/api/content/reload-from-engine", { method: "POST", body: "{}" });
        location.reload();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const passwordForm = document.getElementById("passwordForm");
  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = document.getElementById("passwordStatus");
      try {
        await api("/admin/api/settings/password", {
          method: "POST",
          body: JSON.stringify(formToObject(passwordForm)),
        });
        passwordForm.reset();
        setStatus(status, "Password updated");
      } catch (err) {
        setStatus(status, err.message, false);
      }
    });
  }

  const settingsForm = document.getElementById("settingsForm");
  if (settingsForm) {
    settingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = document.getElementById("settingsStatus");
      try {
        await api("/admin/api/settings", {
          method: "POST",
          body: JSON.stringify(formToObject(settingsForm)),
        });
        setStatus(status, "Settings saved");
      } catch (err) {
        setStatus(status, err.message, false);
      }
    });
  }
});
