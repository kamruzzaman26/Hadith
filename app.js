/* Hadith Research Platform — demo app; not an automatic hadith grader. */
"use strict";

const form = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const resultsList = document.querySelector("#results-list");
const resultCount = document.querySelector("#result-count");
const statusFilter = document.querySelector("#status-filter");
const emptyState = document.querySelector("#empty-state");
const detailPanel = document.querySelector("#detail-panel");

let hadithData = [];
let activeId = null;
let currentResults = [];

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي")
    .replace(/ؤ/g, "و").replace(/ئ/g, "ي").replace(/ـ/g, "")
    .replace(/[.,،؛:!?؟()[\]{}"'“”‘’]/g, " ")
    .replace(/\s+/g, " ").trim();
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}
function itemText(item) {
  return normalizeText([
    item.title, item.arabic, item.translation, item.collection, item.book,
    item.reference, item.narrator, item.grade, item.sourceName, item.evidence
  ].join(" "));
}
function searchItems(query) {
  const q = normalizeText(query);
  const status = statusFilter.value;
  return hadithData.filter(item => {
    const statusMatches = status === "all" || item.status === status;
    return statusMatches && (!q || itemText(item).includes(q));
  });
}
function duplicateGroups(items) {
  const groups = new Map();
  for (const item of items) {
    const key = normalizeText(item.arabic || item.translation || "");
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.values()].filter(group => group.length > 1);
}
function isPossibleDuplicate(item) {
  const key = normalizeText(item.arabic || item.translation || "");
  if (!key) return false;
  return hadithData.some(other => other.id !== item.id &&
    normalizeText(other.arabic || other.translation || "") === key);
}
function renderPlaceholder() {
  detailPanel.innerHTML = `<div class="detail-placeholder"><div class="placeholder-icon">📖</div><h2>একটি ফলাফল নির্বাচন করুন</h2><p>মূল পাঠ, উৎস, রেফারেন্স ও গবেষণা-অবস্থা এখানে দেখা যাবে।</p></div>`;
}
function renderResults() {
  currentResults = searchItems(searchInput.value);
  resultCount.textContent = `${currentResults.length}টি ফলাফল • ডেমো ডেটা`;
  resultsList.innerHTML = "";
  emptyState.classList.toggle("hidden", currentResults.length !== 0);

  currentResults.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `result-card${item.id === activeId ? " selected" : ""}`;
    button.innerHTML = `
      <h3>${escapeHtml(item.title || item.collection || "শিরোনাম নেই")}</h3>
      <div class="arabic-snippet" lang="ar" dir="rtl">${escapeHtml(item.arabic || "আরবি পাঠ যোগ করা হয়নি")}</div>
      <div>${escapeHtml(item.translation || item.note || "")}</div>
      <div class="result-meta"><span>${escapeHtml(item.collection || "গ্রন্থ উল্লেখ নেই")}</span><span>•</span><span>${escapeHtml(item.reference || "রেফারেন্স নেই")}</span>
      <span class="pill ${item.status === "needs-review" ? "review" : ""}">${item.status === "needs-review" ? "আরও যাচাই প্রয়োজন" : "উৎস সংযুক্ত"}</span>
      ${isPossibleDuplicate(item) ? '<span class="pill duplicate">সম্ভাব্য ডুপ্লিকেট</span>' : ""}</div>`;
    button.addEventListener("click", () => {
      activeId = item.id;
      renderResults();
      renderDetail(item);
    });
    resultsList.appendChild(button);
  });
  if (activeId && !currentResults.some(item => item.id === activeId)) {
    activeId = null;
    renderPlaceholder();
  }
}
function renderDetail(item) {
  const sourceUrl = item.sourceUrl || item.source_url || "";
  const sourceName = item.sourceName || item.source_name || (sourceUrl ? "মূল উৎস খুলুন" : "কোনো উৎস সংযুক্ত নেই");
  const source = sourceUrl
    ? `<a class="source-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceName)} ↗</a>`
    : escapeHtml(sourceName);
  const duplicateNotice = isPossibleDuplicate(item)
    ? `<div class="duplicate-note"><strong>সম্ভাব্য ডুপ্লিকেট:</strong> ডেটায় একইরকম স্বাভাবিকীকৃত পাঠ আছে। এটি একই সনদ বা একই হাদিস হওয়ার চূড়ান্ত প্রমাণ নয়।</div>` : "";
  detailPanel.innerHTML = `
    <p class="eyebrow dark">হাদিসের বিবরণ</p>
    <h2 class="detail-title">${escapeHtml(item.title || item.collection || "হাদিসের বিবরণ")}</h2>
    <section class="detail-section"><h3>মূল আরবি পাঠ</h3><p class="arabic-full" lang="ar" dir="rtl">${escapeHtml(item.arabic || "আরবি পাঠ যোগ করা হয়নি।")}</p></section>
    <section class="detail-section"><h3>বাংলা অনুবাদ / নোট</h3><p class="translation">${escapeHtml(item.translation || item.note || "অনুবাদ বা নোট যোগ করা হয়নি।")}</p></section>
    <section class="detail-section"><h3>গ্রন্থ ও রেফারেন্স</h3><p>${escapeHtml(item.collection || "উল্লেখ নেই")} · ${escapeHtml(item.reference || "রেফারেন্স নেই")}</p><p>অধ্যায়: ${escapeHtml(item.book || "উল্লেখ নেই")}</p><p>বর্ণনাকারী: ${escapeHtml(item.narrator || "উল্লেখ নেই")}</p></section>
    <section class="detail-section"><h3>যাচাই-অবস্থা</h3><p><strong>${escapeHtml(item.grade || (item.status === "needs-review" ? "যাচাই করা হয়নি" : "রেকর্ডে উৎস সংযুক্ত"))}</strong></p><p>${escapeHtml(item.gradeNote || "এই রেকর্ডের গ্রেড-সংক্রান্ত তথ্য আলাদাভাবে যাচাই করুন।")}</p><p>${escapeHtml(item.evidence || "")}</p><p>${escapeHtml(item.review || "")}</p></section>
    <section class="detail-section"><h3>উৎস</h3><p>${source}</p></section>
    ${duplicateNotice}
    <div class="detail-actions"><button type="button" id="copy-reference">রেফারেন্স কপি</button><button type="button" id="print-detail">প্রিন্ট / PDF</button></div>
  `;
  document.querySelector("#copy-reference").addEventListener("click", async () => {
    const text = `${item.collection || ""} ${item.reference || ""}\n${item.sourceUrl || item.source_url || ""}`.trim();
    try {
      await navigator.clipboard.writeText(text);
      showToast("রেফারেন্স কপি হয়েছে");
    } catch {
      window.prompt("রেফারেন্স কপি করুন:", text);
    }
  });
  document.querySelector("#print-detail").addEventListener("click", () => window.print());
}
function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}
async function startApp() {
  try {
    const response = await fetch("./data/hadith-demo.json");
    if (!response.ok) throw new Error(`ডেটা ফাইল লোড হয়নি (${response.status})`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("JSON ডেটা array আকারে নেই");
    hadithData = data.map((item, index) => ({
      ...item,
      id: item.id || `record-${index + 1}`,
      status: item.status || ((item.sourceUrl || item.source_url) ? "source-listed" : "needs-review")
    }));
    renderResults();
    if (hadithData.length) renderDetail(hadithData[0]);
    const dupes = duplicateGroups(hadithData).length;
    if (dupes) resultCount.textContent += ` • ${dupes}টি সম্ভাব্য ডুপ্লিকেট-গ্রুপ`;
  } catch (error) {
    console.error(error);
    resultCount.textContent = "ডেটা লোড হয়নি। data/hadith-demo.json ফাইল ও GitHub Pages প্রকাশ পরীক্ষা করুন।";
    resultsList.innerHTML = `<p class="error-message">ডেমো ডেটা পড়া যায়নি। ফাইলের নাম, JSON ফরম্যাট এবং প্রকাশের অবস্থা পরীক্ষা করুন।</p>`;
  }
}
form.addEventListener("submit", event => { event.preventDefault(); renderResults(); });
searchInput.addEventListener("input", renderResults);
statusFilter.addEventListener("change", renderResults);
document.querySelectorAll("[data-query]").forEach(button => {
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.query;
    renderResults();
    searchInput.focus();
  });
});
startApp();
