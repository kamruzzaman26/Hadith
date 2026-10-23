
const form = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const resultsList = document.querySelector("#results-list");
const resultCount = document.querySelector("#result-count");
const statusFilter = document.querySelector("#status-filter");
const emptyState = document.querySelector("#empty-state");
const detailPanel = document.querySelector("#detail-panel");

let hadithData = [];
let activeId = null;

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getSource(item) {
  return item.sourceUrl || item.source_url || "";
}

function getStatus(item) {
  return item.status ||
    (getSource(item) ? "source-listed" : "needs-review");
}

function searchableText(item) {
  return normalizeText([
    item.title,
    item.arabic,
    item.translation,
    item.collection,
    item.book,
    item.reference,
    item.narrator,
    item.grade,
    item.note
  ].filter(Boolean).join(" "));
}

function renderPlaceholder() {
  detailPanel.innerHTML = `
    <div class="detail-placeholder">
      <div class="placeholder-icon">📖</div>
      <h2>একটি ফলাফল নির্বাচন করুন</h2>
      <p>হাদীসের পাঠ, উৎস ও রেফারেন্স এখানে দেখা যাবে।</p>
    </div>`;
}

function renderDetail(item) {
  const sourceUrl = getSource(item);

  detailPanel.innerHTML = `
    <h2>${escapeHtml(item.title || item.collection || "হাদীস")}</h2>
    <section class="detail-section">
      <h3>মূল আরবি পাঠ</h3>
      <p class="arabic-full" lang="ar" dir="rtl">${
        escapeHtml(item.arabic || "আরবি পাঠ যোগ করা হয়নি।")
      }</p>
    </section>
    <section class="detail-section">
      <h3>বাংলা অনুবাদ / নোট</h3>
      <p>${escapeHtml(item.translation || item.note || "অনুবাদ যোগ করা হয়নি।")}</p>
    </section>
    <section class="detail-section">
      <h3>গ্রন্থ ও রেফারেন্স</h3>
      <p>গ্রন্থ: ${escapeHtml(item.collection || "উল্লেখ নেই")}</p>
      <p>কিতাব: ${escapeHtml(item.book || "উল্লেখ নেই")}</p>
      <p>রেফারেন্স: ${escapeHtml(item.reference || "উল্লেখ নেই")}</p>
      <p>রাবি: ${escapeHtml(item.narrator || "উল্লেখ নেই")}</p>
      <p>উৎস: ${
        sourceUrl
          ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${
              escapeHtml(item.sourceName || "মূল উৎস দেখুন")
            }</a>`
          : "উৎস সংযুক্ত নেই"
      }</p>
    </section>
    <section class="detail-section">
      <h3>যাচাই-অবস্থা</h3>
      <p>${escapeHtml(item.grade || "স্বতন্ত্র তাহকীক যোগ করা হয়নি।")}</p>
      <p>${escapeHtml(item.gradeNote || item.evidence || item.note || "")}</p>
      <p class="muted">${escapeHtml(item.review || "উদ্ধৃতির আগে মূল উৎস যাচাই করুন।")}</p>
    </section>
    <div class="action-row">
      <button class="action-button primary" id="print-report" type="button">
        রিপোর্ট প্রিন্ট / PDF
      </button>
      <button class="action-button" id="copy-reference" type="button">
        রেফারেন্স কপি
      </button>
    </div>
    <p id="action-message" class="muted" aria-live="polite"></p>`;

  document.querySelector("#print-report").addEventListener("click", () => {
    window.print();
  });

  document.querySelector("#copy-reference").addEventListener("click", async () => {
    const text = [
      item.title || item.collection || "হাদীস",
      item.arabic || "",
      item.translation || "",
      `${item.collection || ""} — ${item.reference || ""}`,
      `উৎস: ${sourceUrl || "সংযুক্ত নয়"}`,
      `যাচাই-অবস্থা: ${item.grade || "যাচাই করা হয়নি"}`
    ].join("\n");

    const message = document.querySelector("#action-message");

    try {
      await navigator.clipboard.writeText(text);
      message.textContent = "রেফারেন্স কপি হয়েছে।";
    } catch {
      message.textContent =
        "কপি করা যায়নি। টেক্সট নির্বাচন করে কপি করুন।";
    }
  });
}

function renderResults() {
  const query = normalizeText(searchInput.value);
  const selectedStatus = statusFilter.value;

  const results = hadithData.filter(item => {
    const statusMatches =
      selectedStatus === "all" || getStatus(item) === selectedStatus;

    const queryMatches =
      !query || searchableText(item).includes(query);

    return statusMatches && queryMatches;
  });

  resultsList.replaceChildren();
  emptyState.classList.toggle("hidden", results.length !== 0);
  resultCount.textContent = `মোট ${results.length}টি রেকর্ড পাওয়া গেছে।`;

  results.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      `result-card${item.id === activeId ? " selected" : ""}`;

    const title = document.createElement("h3");
    title.textContent = item.title || item.collection || "হাদীস";

    const arabic = document.createElement("div");
    arabic.className = "arabic-snippet";
    arabic.lang = "ar";
    arabic.dir = "rtl";
    arabic.textContent = item.arabic || "";

    const reference = document.createElement("p");
    reference.textContent =
      `${item.collection || "উৎস উল্লেখ নেই"} — ${item.reference || "রেফারেন্স নেই"}`;

    const badge = document.createElement("p");
    badge.textContent = getStatus(item) === "needs-review"
      ? "আরও যাচাই প্রয়োজন"
      : "উৎস সংযুক্ত; মান স্বয়ংক্রিয়ভাবে নিশ্চিত নয়";

    button.append(title, arabic, reference, badge);

    button.addEventListener("click", () => {
      activeId = item.id;
      renderResults();
      renderDetail(item);
    });

    resultsList.appendChild(button);
  });

  if (activeId && !results.some(item => item.id === activeId)) {
    activeId = null;
    renderPlaceholder();
  }
}

async function startApp() {
  resultCount.textContent = "ডেমো ডেটা লোড হচ্ছে…";

  try {
    const response = await fetch("./data/hadith-demo.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("JSON ফাইলে array থাকা দরকার");
    }

    hadithData = data.map((item, index) => ({
      ...item,
      id: item.id || `record-${index + 1}`
    }));

    renderResults();
  } catch (error) {
    console.error("Hadith data loading error:", error);
    resultCount.textContent =
      "ডেটা লোড হয়নি। JSON ফাইলের অবস্থান ও গঠন পরীক্ষা করুন।";
    resultsList.replaceChildren();
    emptyState.classList.add("hidden");
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  renderResults();
});

statusFilter.addEventListener("change", renderResults);

document.querySelectorAll("[data-query]").forEach(button => {
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.query;
    renderResults();
  });
});

startApp();
const form = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const resultsList = document.querySelector("#results-list");
const resultCount = document.querySelector("#result-count");
const statusFilter = document.querySelector("#status-filter");
const emptyState = document.querySelector("#empty-state");
const detailPanel = document.querySelector("#detail-panel");

let hadithData = [];
let activeId = null;

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getSource(item) {
  return item.sourceUrl || item.source_url || "";
}

function getStatus(item) {
  return item.status ||
    (getSource(item) ? "source-listed" : "needs-review");
}

function searchableText(item) {
  return normalizeText([
    item.title,
    item.arabic,
    item.translation,
    item.collection,
    item.book,
    item.reference,
    item.narrator,
    item.grade,
    item.note
  ].filter(Boolean).join(" "));
}

function renderPlaceholder() {
  detailPanel.innerHTML = `
    <div class="detail-placeholder">
      <div class="placeholder-icon">📖</div>
      <h2>একটি ফলাফল নির্বাচন করুন</h2>
      <p>হাদীসের পাঠ, উৎস ও রেফারেন্স এখানে দেখা যাবে।</p>
    </div>`;
}

function renderDetail(item) {
  const sourceUrl = getSource(item);

  detailPanel.innerHTML = `
    <h2>${escapeHtml(item.title || item.collection || "হাদীস")}</h2>
    <section class="detail-section">
      <h3>মূল আরবি পাঠ</h3>
      <p class="arabic-full" lang="ar" dir="rtl">${
        escapeHtml(item.arabic || "আরবি পাঠ যোগ করা হয়নি।")
      }</p>
    </section>
    <section class="detail-section">
      <h3>বাংলা অনুবাদ / নোট</h3>
      <p>${escapeHtml(item.translation || item.note || "অনুবাদ যোগ করা হয়নি।")}</p>
    </section>
    <section class="detail-section">
      <h3>গ্রন্থ ও রেফারেন্স</h3>
      <p>গ্রন্থ: ${escapeHtml(item.collection || "উল্লেখ নেই")}</p>
      <p>কিতাব: ${escapeHtml(item.book || "উল্লেখ নেই")}</p>
      <p>রেফারেন্স: ${escapeHtml(item.reference || "উল্লেখ নেই")}</p>
      <p>রাবি: ${escapeHtml(item.narrator || "উল্লেখ নেই")}</p>
      <p>উৎস: ${
        sourceUrl
          ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${
              escapeHtml(item.sourceName || "মূল উৎস দেখুন")
            }</a>`
          : "উৎস সংযুক্ত নেই"
      }</p>
    </section>
    <section class="detail-section">
      <h3>যাচাই-অবস্থা</h3>
      <p>${escapeHtml(item.grade || "স্বতন্ত্র তাহকীক যোগ করা হয়নি।")}</p>
      <p>${escapeHtml(item.gradeNote || item.evidence || item.note || "")}</p>
      <p class="muted">${escapeHtml(item.review || "উদ্ধৃতির আগে মূল উৎস যাচাই করুন।")}</p>
    </section>
    <div class="action-row">
      <button class="action-button primary" id="print-report" type="button">
        রিপোর্ট প্রিন্ট / PDF
      </button>
      <button class="action-button" id="copy-reference" type="button">
        রেফারেন্স কপি
      </button>
    </div>
    <p id="action-message" class="muted" aria-live="polite"></p>`;

  document.querySelector("#print-report").addEventListener("click", () => {
    window.print();
  });

  document.querySelector("#copy-reference").addEventListener("click", async () => {
    const text = [
      item.title || item.collection || "হাদীস",
      item.arabic || "",
      item.translation || "",
      `${item.collection || ""} — ${item.reference || ""}`,
      `উৎস: ${sourceUrl || "সংযুক্ত নয়"}`,
      `যাচাই-অবস্থা: ${item.grade || "যাচাই করা হয়নি"}`
    ].join("\n");

    const message = document.querySelector("#action-message");

    try {
      await navigator.clipboard.writeText(text);
      message.textContent = "রেফারেন্স কপি হয়েছে।";
    } catch {
      message.textContent =
        "কপি করা যায়নি। টেক্সট নির্বাচন করে কপি করুন।";
    }
  });
}

function renderResults() {
  const query = normalizeText(searchInput.value);
  const selectedStatus = statusFilter.value;

  const results = hadithData.filter(item => {
    const statusMatches =
      selectedStatus === "all" || getStatus(item) === selectedStatus;

    const queryMatches =
      !query || searchableText(item).includes(query);

    return statusMatches && queryMatches;
  });

  resultsList.replaceChildren();
  emptyState.classList.toggle("hidden", results.length !== 0);
  resultCount.textContent = `মোট ${results.length}টি রেকর্ড পাওয়া গেছে।`;

  results.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      `result-card${item.id === activeId ? " selected" : ""}`;

    const title = document.createElement("h3");
    title.textContent = item.title || item.collection || "হাদীস";

    const arabic = document.createElement("div");
    arabic.className = "arabic-snippet";
    arabic.lang = "ar";
    arabic.dir = "rtl";
    arabic.textContent = item.arabic || "";

    const reference = document.createElement("p");
    reference.textContent =
      `${item.collection || "উৎস উল্লেখ নেই"} — ${item.reference || "রেফারেন্স নেই"}`;

    const badge = document.createElement("p");
    badge.textContent = getStatus(item) === "needs-review"
      ? "আরও যাচাই প্রয়োজন"
      : "উৎস সংযুক্ত; মান স্বয়ংক্রিয়ভাবে নিশ্চিত নয়";

    button.append(title, arabic, reference, badge);

    button.addEventListener("click", () => {
      activeId = item.id;
      renderResults();
      renderDetail(item);
    });

    resultsList.appendChild(button);
  });

  if (activeId && !results.some(item => item.id === activeId)) {
    activeId = null;
    renderPlaceholder();
  }
}

async function startApp() {
  resultCount.textContent = "ডেমো ডেটা লোড হচ্ছে…";

  try {
    const response = await fetch("./data/hadith-demo.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("JSON ফাইলে array থাকা দরকার");
    }

    hadithData = data.map((item, index) => ({
      ...item,
      id: item.id || `record-${index + 1}`
    }));

    renderResults();
  } catch (error) {
    console.error("Hadith data loading error:", error);
    resultCount.textContent =
      "ডেটা লোড হয়নি। JSON ফাইলের অবস্থান ও গঠন পরীক্ষা করুন।";
    resultsList.replaceChildren();
    emptyState.classList.add("hidden");
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  renderResults();
});

statusFilter.addEventListener("change", renderResults);

document.querySelectorAll("[data-query]").forEach(button => {
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.query;
    renderResults();
  });
});

startApp();
  
