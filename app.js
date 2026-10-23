/* Demo only: replace this small dataset with properly licensed, reviewed records. */
const hadithData = [
  {
    id: "demo-bukhari-1",
    title: "নিয়তের গুরুত্ব",
    arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
    translation: "নিশ্চয়ই কাজের মূল্যায়ন নিয়তের ওপর নির্ভরশীল।",
    collection: "সহীহ আল-বুখারী",
    book: "ওহীর সূচনা অধ্যায়",
    reference: "হাদীস ১ (প্রচলিত নম্বরায়ন)",
    narrator: "উমর ইবনুল খাত্তাব (রা.)",
    status: "source-listed",
    grade: "সহীহ আল-বুখারীতে সংকলিত",
    gradeNote: "এই ডেমোতে গ্রন্থে সংকলনের তথ্য দেখানো হয়েছে; এটি স্বতন্ত্র পূর্ণাঙ্গ সনদ-তাহকীক রিপোর্ট নয়।",
    sourceName: "Sunnah.com — Sahih al-Bukhari 1",
    sourceUrl: "https://sunnah.com/bukhari:1",
    evidence: "গ্রন্থ ও হাদীস নম্বরের রেফারেন্স সংযুক্ত। প্রকাশিত সংস্করণভেদে নম্বর বা অনুবাদে পার্থক্য থাকতে পারে।",
    review: "ডেমো রেকর্ড; ব্যবহার বা উদ্ধৃতির আগে মূল উৎস এবং ব্যবহৃত অনুবাদ যাচাই করুন।"
  },
  {
    id: "demo-unverified",
    title: "ব্যবহারকারীর নিজস্ব বর্ণনা যাচাইয়ের নমুনা",
    arabic: "أدخل نص الحديث هنا",
    translation: "এখানে পরীক্ষার জন্য নিজের হাদীসের পাঠ বসানো যাবে। এটি কোনো প্রকৃত হাদীসের উদ্ধৃতি নয়।",
    collection: "উৎস এখনো যোগ করা হয়নি",
    book: "—",
    reference: "—",
    narrator: "অজানা",
    status: "needs-review",
    grade: "যাচাই করা হয়নি",
    gradeNote: "কোনো উৎস বা তাহকীকের প্রমাণ যোগ করা হয়নি। এটিকে যঈফ বা মাওযূ বলা হচ্ছে না।",
    sourceName: "কোনো উৎস সংযুক্ত নেই",
    sourceUrl: "",
    evidence: "যাচাইযোগ্য উৎস যোগ না করা পর্যন্ত কোনো হুকুম দেওয়া যাবে না।",
    review: "এটি শুধু UI পরীক্ষা করার placeholder; প্রকৃত হাদীস ডেটা নয়।"
  }
];

const form = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const resultsList = document.querySelector("#results-list");
const resultCount = document.querySelector("#result-count");
const statusFilter = document.querySelector("#status-filter");
const emptyState = document.querySelector("#empty-state");
const detailPanel = document.querySelector("#detail-panel");

let activeId = null;
let currentResults = [...hadithData];

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[ـ]/g, "")
    .replace(/[.,،؛:!?؟()[\]{}"'“”‘’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function haystack(item) {
  return normalizeText([
    item.title, item.arabic, item.translation, item.collection,
    item.book, item.reference, item.narrator, item.grade
  ].join(" "));
}

function searchItems(query) {
  const q = normalizeText(query);
  const status = statusFilter.value;
  return hadithData.filter(item => {
    const statusMatches = status === "all" || item.status === status;
    const queryMatches = !q || haystack(item).includes(q);
    return statusMatches && queryMatches;
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
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
      <h3>${escapeHtml(item.title)}</h3>
      <div class="arabic-snippet" lang="ar" dir="rtl">${escapeHtml(item.arabic)}</div>
      <div>${escapeHtml(item.translation)}</div>
      <div class="result-meta">
        <span>${escapeHtml(item.collection)}</span>
        <span>•</span>
        <span>${escapeHtml(item.reference)}</span>
        <span class="pill ${item.status === "needs-review" ? "review" : ""}">
          ${item.status === "needs-review" ? "আরও যাচাই প্রয়োজন" : "উৎস সংযুক্ত"}
        </span>
      </div>`;
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
  const source = item.sourceUrl
    ? `<a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.sourceName)}</a>`
    : escapeHtml(item.sourceName);

  detailPanel.innerHTML = `
    <p class="eyebrow" style="color:var(--green-2)">হাদীসের বিবরণ</p>
    <h2 class="detail-title">${escapeHtml(item.title)}</h2>
    <section class="detail-section">
      <h3>মূল আরবি পাঠ</h3>
      <p class="arabic-full" lang="ar" dir="rtl">${escapeHtml(item.arabic)}</p>
    </section>
    <section class="detail-section">
      <h3>বাংলা অনুবাদ / নোট</h3>
      <p class="translation">${escapeHtml(item.translation)}</p>
    </section>
    <section class="detail-section">
      <h3>গ্রন্থ ও রেফারেন্স</h3>
      <dl class="info-list">
        <div class="info-row"><dt>গ্রন্থ</dt><dd>${escapeHtml(item.collection)}</dd></div>
        <div class="info-row"><dt>কিতাব / বাব</dt><dd>${escapeHtml(item.book)}</dd></div>
        <div class="info-row"><dt>রেফারেন্স</dt><dd>${escapeHtml(item.reference)}</dd></div>
        <div class="info-row"><dt>সাহাবি রাবি</dt><dd>${escapeHtml(item.narrator)}</dd></div>
        <div class="info-row"><dt>উৎস</dt><dd>${source}</dd></div>
      </dl>
    </section>
    <section class="detail-section">
      <h3>হুকুম ও যাচাই-অবস্থা</h3>
      <p><span class="pill ${item.status === "needs-review" ? "review" : ""}">${escapeHtml(item.grade)}</span></p>
      <p class="muted">${escapeHtml(item.gradeNote)}</p>
    </section>
    <section class="detail-section">
      <h3>প্রমাণ ও সীমাবদ্ধতা</h3>
      <p>${escapeHtml(item.evidence)}</p>
      <p class="muted">${escapeHtml(item.review)}</p>
    </section>
    <div class="action-row">
      <button class="action-button primary" id="print-report" type="button">রিপোর্ট প্রিন্ট / PDF</button>
      <button class="action-button" id="copy-reference" type="button">রেফারেন্স কপি</button>
    </div>
    <p id="action-message" class="muted" aria-live="polite"></p>
  `;

  document.querySelector("#print-report").addEventListener("click", () => window.print());
  document.querySelector("#copy-reference").addEventListener("click", async () => {
    const text = `${item.title}\n${item.arabic}\n${item.translation}\n${item.collection} — ${item.reference}\nউৎস: ${item.sourceUrl || "সংযুক্ত নয়"}\nঅবস্থা: ${item.grade}`;
    const message = document.querySelector("#action-message");
    try {
      await navigator.clipboard.writeText(text);
      message.textContent = "রেফারেন্স কপি হয়েছে।";
    } catch {
      message.textContent = "কপি করা যায়নি। টেক্সট নির্বাচন করে ম্যানুয়ালি কপি করুন।";
    }
  });
}

function renderPlaceholder() {
  detailPanel.innerHTML = `
    <div class="detail-placeholder">
      <div class="placeholder-icon">📖</div>
      <h2>একটি ফলাফল নির্বাচন করুন</h2>
      <p>হাদীসের মূল পাঠ, উৎস, রেফারেন্স ও গবেষণা-অবস্থা এখানে দেখা যাবে।</p>
    </div>`;
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

renderResults();
      
