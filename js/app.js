/* ============================================================
   OCF STARTUP — Lógica principal
   ============================================================ */

/* ---------------- Idioma / tema ---------------- */
function applyTranslations() {
  const dict = t();
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    const key = el.getAttribute("data-i18n-ph");
    if (dict[key] !== undefined) el.placeholder = dict[key];
  });
  document.querySelectorAll(".lang-group button").forEach(b => {
    b.classList.toggle("active", b.dataset.lang === state.currentLang);
  });
  renderMembers();
  renderIncomeList();
  renderWithdrawals();
  renderFeed();
  renderChat();
  renderEvents();
  if (window.renderSales) { renderSales(); renderRanking(); }
}

function setLang(lang) {
  state.currentLang = lang;
  localStorage.setItem("ocf_lang", lang);
  applyTranslations();
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("ocf_theme", state.theme);
  document.body.classList.toggle("light", state.theme === "light");
  const icon = document.querySelector("#themeToggle i");
  icon.className = state.theme === "light" ? "fa-solid fa-sun" : "fa-solid fa-moon";
}

/* ---------------- Navegación ---------------- */
const TAB_TITLES = {
  dashboard: "navDashboard", members: "navMembers", finances: "navFinances",
  social: "navSocial", events: "navEvents", sales: "navSales"
};

function goTab(tab) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  document.querySelectorAll(".nav-item, .bottom-nav button").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  document.getElementById("topbarTitle").textContent = t()[TAB_TITLES[tab]] || "";
  if (tab === "dashboard") updateChart();
  if (tab === "sales" && window.updateSalesChart) updateSalesChart();
}

/* ---------------- Modales ---------------- */
function openModal(id) { document.getElementById(id).classList.add("active"); }
function closeModal(id) { document.getElementById(id).classList.remove("active"); }

/* ---------------- Auth ---------------- */
function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  document.getElementById("loginError").textContent = "";
  sbClient.auth.signInWithPassword({ email, password }).then(({ error }) => {
    if (error) document.getElementById("loginError").textContent = error.message;
  });
}

function logout() {
  sbClient.auth.signOut().then(() => location.reload());
}

async function handleSignedIn(session) {
  const user = session.user;
  state.currentUserEmail = user.email;
  state.currentUserName = (user.email || "user").split("@")[0];
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("appShell").style.display = "flex";
  document.getElementById("sidebarAvatar").src = DEFAULT_AVATAR + encodeURIComponent(state.currentUserName);
  document.getElementById("sidebarName").textContent = state.currentUserName;
  document.getElementById("monthSelector").value = state.currentMonth;
  document.body.classList.toggle("light", state.theme === "light");
  document.querySelector("#themeToggle i").className = state.theme === "light" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  applyTranslations();
  await loadAllData();
}

try {
  sbClient.auth.onAuthStateChange((_event, session) => {
    if (session) {
      handleSignedIn(session);
    } else {
      document.getElementById("loginScreen").style.display = "grid";
      document.getElementById("appShell").style.display = "none";
    }
  });

  // Por si la sesión ya existía al cargar la página.
  sbClient.auth.getSession().then(({ data }) => {
    if (data && data.session) handleSignedIn(data.session);
  });
} catch (e) {
  console.error("[OCF] No se pudo inicializar la sesión:", e);
}

document.getElementById("monthSelector").addEventListener("change", e => {
  state.currentMonth = e.target.value;
  renderIncomeList();
  updateMonthTotal();
});

/* ---------------- Carga de datos ---------------- */
async function loadAllData() {
  await Promise.all([loadMembers(), loadIncomes(), loadWithdrawals(), loadPosts(), loadChat(), loadEvents()]);
  if (window.loadSales) await loadSales();
  renderMembers();
  renderIncomeList();
  renderWithdrawals();
  updateMetrics();
  updateChart();
  fillBeneficiarySelect();
  celebrate(60);
}

async function loadMembers() {
  const data = sb(await sbClient.from("members").select("*").order("created_at", { ascending: true }));
  state.members = (data || []).map(rowToMember);
}

async function loadIncomes() {
  const data = sb(await sbClient.from("incomes").select("*"));
  state.incomes = {};
  (data || []).forEach(row => {
    if (!state.incomes[row.month]) state.incomes[row.month] = {};
    state.incomes[row.month][row.member_id] = Number(row.amount) || 0;
  });
}

async function loadWithdrawals() {
  const data = sb(await sbClient.from("withdrawals").select("*").order("date", { ascending: false }));
  state.withdrawals = (data || []).map(row => ({
    id: row.id, date: row.date, beneficiaryId: row.beneficiary_id,
    beneficiaryName: row.beneficiary_name, amount: Number(row.amount) || 0
  }));
}

function rowToMember(row) {
  return {
    id: row.id, name: row.name, role: row.role, phone: row.phone, email: row.email,
    photoUrl: row.photo_url, fechaSalida: row.fecha_salida, entryDate: row.entry_date
  };
}

/* ---------------- Miembros ---------------- */
function activeMembers() { return state.members.filter(m => !m.fechaSalida); }

function renderMembers() {
  const container = document.getElementById("membersList");
  const list = activeMembers();
  document.getElementById("mMembers").textContent = list.length;
  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-users"></i>${escapeHtml(t().addIncomeHint)}</div>`;
    return;
  }
  container.innerHTML = list.map(m => `
    <div class="row-item" onclick="showMemberProfile('${m.id}')">
      <img class="avatar" src="${avatarFor(m)}" alt="">
      <div class="info">
        <div class="name">${escapeHtml(m.name)} <span class="badge badge-${m.role}">${escapeHtml(t()["role_" + m.role] || m.role)}</span></div>
        <div class="meta"><i class="fa-solid fa-phone"></i> ${escapeHtml(m.phone || t().noPhone)}</div>
      </div>
      <div class="actions">
        <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); openMemberModal('${m.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-danger-ghost" onclick="event.stopPropagation(); deleteMember('${m.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join("");
}

async function onMemberPhotoFileChange(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  try {
    const dataUrl = await fileToResizedDataUrl(file, 320, 0.82);
    document.getElementById("memberPhotoUrl").value = dataUrl;
    document.getElementById("memberPhotoPreview").src = dataUrl;
  } catch (e) {
    showToast(e.message, "error");
  }
}

function openMemberModal(id) {
  state.editMemberId = id || null;
  const m = id ? state.members.find(x => x.id === id) : null;
  document.getElementById("memberModalTitle").textContent = id ? t().memberModalTitleEdit : t().memberModalTitleNew;
  document.getElementById("memberName").value = m ? m.name : "";
  document.getElementById("memberRole").value = m ? m.role : "Miembro";
  document.getElementById("memberPhone").value = m ? (m.phone || "") : "";
  document.getElementById("memberEmail").value = m ? (m.email || "") : "";
  document.getElementById("memberPhotoUrl").value = m ? (m.photoUrl || "") : "";
  document.getElementById("memberPhotoFile").value = "";
  document.getElementById("memberPhotoPreview").src = avatarFor(m);
  document.getElementById("memberExitDate").value = m ? (m.fechaSalida || "") : "";
  openModal("memberModal");
}

async function saveMember() {
  const name = document.getElementById("memberName").value.trim();
  if (!name) { showToast(t().memberName + " *", "error"); return; }
  const data = {
    name,
    role: document.getElementById("memberRole").value,
    phone: document.getElementById("memberPhone").value.trim(),
    email: document.getElementById("memberEmail").value.trim(),
    photo_url: document.getElementById("memberPhotoUrl").value.trim(),
    fecha_salida: document.getElementById("memberExitDate").value || null
  };
  if (state.editMemberId) {
    sb(await sbClient.from("members").update(data).eq("id", state.editMemberId));
  } else {
    data.entry_date = new Date().toLocaleDateString();
    sb(await sbClient.from("members").insert(data));
  }
  closeModal("memberModal");
  await loadMembers();
  renderMembers();
  renderIncomeList();
  fillBeneficiarySelect();
  if (window.fillSaleSellerSelect) fillSaleSellerSelect();
  showToast(t().save + " ✓");
  celebrate(50);
}

async function deleteMember(id) {
  if (!confirm(t().confirmDeleteMember)) return;
  sb(await sbClient.from("members").delete().eq("id", id));
  await loadMembers();
  renderMembers();
  renderIncomeList();
  fillBeneficiarySelect();
  if (window.fillSaleSellerSelect) fillSaleSellerSelect();
  showToast(t().delete + " ✓");
}

function showMemberProfile(id) {
  const m = state.members.find(x => x.id === id);
  if (!m) return;
  const dict = t();
  const tasksKey = { Presidente: "presidentTasks", Tesorero: "treasurerTasks", Secretario: "secretaryTasks", Reclutador: "recruiterTasks" }[m.role] || "memberTasks";
  document.getElementById("profileInfo").innerHTML = `
    <div style="text-align:center;">
      <img src="${avatarFor(m)}" style="width:84px;height:84px;border-radius:50%;border:3px solid var(--gold);margin-bottom:.8rem;">
      <h3>${escapeHtml(m.name)}</h3>
      <span class="badge badge-${m.role}">${escapeHtml(dict["role_" + m.role] || m.role)}</span>
      <p style="margin-top:.6rem; color:var(--muted); font-size:.85rem;"><i class="fa-solid fa-phone"></i> ${escapeHtml(m.phone || dict.noPhone)}</p>
      <p style="color:var(--muted); font-size:.85rem;"><i class="fa-solid fa-envelope"></i> ${escapeHtml(m.email || dict.noEmail)}</p>
      <p style="color:var(--muted); font-size:.85rem;"><i class="fa-solid fa-calendar"></i> ${dict.entrySince}: ${m.entryDate || "—"}</p>
    </div>`;
  document.getElementById("profileTasks").innerHTML = `
    <strong><i class="fa-solid fa-list-check"></i> ${dict.tasksFor}</strong>
    <div style="margin-top:.5rem; display:flex; flex-direction:column; gap:.4rem;">
      ${(dict[tasksKey] || []).map(task => `<div style="font-size:.85rem;">${task}</div>`).join("")}
    </div>`;
  openModal("profileModal");
}

/* ---------------- Finanzas: Ingresos ---------------- */
function renderIncomeList() {
  const container = document.getElementById("incomeList");
  const list = activeMembers();
  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-coins"></i>${escapeHtml(t().addIncomeHint)}</div>`;
    return;
  }
  if (!state.incomes[state.currentMonth]) state.incomes[state.currentMonth] = {};
  container.innerHTML = list.map(m => {
    const amount = state.incomes[state.currentMonth][m.id] || 0;
    return `
    <div class="income-row" id="income-${m.id}">
      <div class="who"><img src="${avatarFor(m)}"><span><strong>${escapeHtml(m.name)}</strong><br><small style="color:var(--muted);">${escapeHtml(t()["role_" + m.role] || m.role)}</small></span></div>
      <span class="status-pill ${amount > 0 ? "status-paid" : "status-pending"}" id="status-${m.id}">${amount > 0 ? t().paid : t().pending}</span>
      <input type="number" min="0" step="1000" value="${amount}" onchange="onIncomeChange('${m.id}', this)">
    </div>`;
  }).join("");
  updateMonthTotal();
}

async function onIncomeChange(memberId, input) {
  let val = parseInt(input.value, 10) || 0;
  if (val < 0) val = 0;
  input.value = val;
  if (!state.incomes[state.currentMonth]) state.incomes[state.currentMonth] = {};
  state.incomes[state.currentMonth][memberId] = val;
  try {
    sb(await sbClient.from("incomes").upsert(
      { month: state.currentMonth, member_id: memberId, amount: val, updated_at: new Date().toISOString() },
      { onConflict: "month,member_id" }
    ));
    const statusEl = document.getElementById("status-" + memberId);
    statusEl.textContent = val > 0 ? t().paid : t().pending;
    statusEl.className = "status-pill " + (val > 0 ? "status-paid" : "status-pending");
    updateMonthTotal();
    updateMetrics();
    updateChart();
    showToast(fmtMoney(val) + " ✓");
    if (val > 0) celebrate(40);
  } catch (e) {
    /* sb() ya mostró el toast de error */
  }
}

function updateMonthTotal() {
  const total = Object.values(state.incomes[state.currentMonth] || {}).reduce((a, b) => a + b, 0);
  document.getElementById("monthTotal").textContent = fmtMoney(total);
}

function updateMetrics() {
  let totalIncomes = 0;
  for (const m in state.incomes) totalIncomes += Object.values(state.incomes[m]).reduce((a, b) => a + b, 0);
  const totalWithdrawals = state.withdrawals.reduce((s, w) => s + w.amount, 0);
  const savings = totalIncomes - totalWithdrawals;
  document.getElementById("mSavings").textContent = fmtCompact(savings);
  document.getElementById("mWithdrawals").textContent = fmtCompact(totalWithdrawals);
  document.getElementById("totalBalance").textContent = fmtCompact(savings);
  document.getElementById("available40").textContent = fmtCompact(savings * 0.4);
  document.getElementById("retained60").textContent = fmtCompact(savings * 0.6);
  const goal = (state.salesGoal.amount && state.salesGoal.amount > 0) ? state.salesGoal.amount : Math.max(savings * 1.3, 1);
  renderJuiceRing("dashboardGoalRing", Math.min(100, (savings / goal) * 100), { color: "#2BB596", label: fmtCompact(savings), sub: "FCFA" });
}

function renderWithdrawals() {
  const container = document.getElementById("withdrawalsList");
  if (!state.withdrawals.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-receipt"></i>${escapeHtml(t().noWithdrawals)}</div>`;
    return;
  }
  container.innerHTML = state.withdrawals.slice(0, 10).map(w => `
    <div class="row-item" style="cursor:default;">
      <div class="icon icon-danger" style="width:36px;height:36px;"><i class="fa-solid fa-arrow-up-from-bracket"></i></div>
      <div class="info">
        <div class="name">${escapeHtml(w.beneficiaryName)}</div>
        <div class="meta">${w.date}</div>
      </div>
      <div class="num" style="font-weight:700;">${fmtMoney(w.amount)}</div>
    </div>`).join("");
}

function fillBeneficiarySelect() {
  const select = document.getElementById("withdrawalBeneficiary");
  select.innerHTML = activeMembers().map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("");
}

function openWithdrawalModal() {
  document.getElementById("withdrawalDate").value = new Date().toISOString().slice(0, 10);
  let totalIncomes = 0;
  for (const m in state.incomes) totalIncomes += Object.values(state.incomes[m]).reduce((a, b) => a + b, 0);
  const savings = totalIncomes - state.withdrawals.reduce((s, w) => s + w.amount, 0);
  document.getElementById("withdrawalAmount").value = Math.floor(savings * 0.4);
  openModal("withdrawalModal");
}

async function confirmWithdrawal() {
  const beneficiaryId = document.getElementById("withdrawalBeneficiary").value;
  const member = state.members.find(m => m.id === beneficiaryId);
  if (!member) { showToast(t().withdrawalBeneficiary, "error"); return; }
  const amount = parseInt(document.getElementById("withdrawalAmount").value, 10) || 0;
  sb(await sbClient.from("withdrawals").insert({
    date: document.getElementById("withdrawalDate").value,
    beneficiary_id: beneficiaryId, beneficiary_name: member.name, amount
  }));
  closeModal("withdrawalModal");
  await loadWithdrawals();
  renderWithdrawals();
  updateMetrics();
  showToast(t().confirmWithdrawal + " ✓");
  celebrate(80);
}

/* ---------------- Social: Feed / Chat ---------------- */
async function loadPosts() {
  const data = sb(await sbClient.from("posts").select("*").order("created_at", { ascending: false }));
  state.posts = (data || []).map(row => ({
    title: row.title, content: row.content, imageUrl: row.image_url, date: row.date, author: row.author
  }));
}

function renderFeed() {
  const container = document.getElementById("feedList");
  if (!state.posts.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-bullhorn"></i>${escapeHtml(t().noPosts)}</div>`;
    return;
  }
  container.innerHTML = state.posts.map(p => `
    <div class="feed-item">
      <div class="top"><span>${escapeHtml(p.author || "Admin")}</span><span>${p.date}</span></div>
      <h4>${escapeHtml(p.title)}</h4>
      <p style="font-size:.86rem; color:var(--text-soft);">${escapeHtml(p.content)}</p>
      ${p.imageUrl ? `<img src="${p.imageUrl}" onerror="this.style.display='none'">` : ""}
    </div>`).join("");
}

function openPostModal() {
  document.getElementById("postTitle").value = "";
  document.getElementById("postContent").value = "";
  document.getElementById("postImage").value = "";
  openModal("postModal");
}

async function savePost() {
  const title = document.getElementById("postTitle").value.trim();
  const content = document.getElementById("postContent").value.trim();
  if (!title || !content) { showToast(t().postTitle + " / " + t().postContent, "error"); return; }
  sb(await sbClient.from("posts").insert({
    title, content, image_url: document.getElementById("postImage").value.trim(),
    date: new Date().toLocaleDateString(), author: state.currentUserName
  }));
  closeModal("postModal");
  await loadPosts();
  renderFeed();
  showToast(t().publish + " ✓");
}

async function loadChat() {
  const data = sb(await sbClient.from("chat_messages").select("*").order("created_at", { ascending: true }));
  state.messages = (data || []).map(row => ({ userName: row.user_name, userEmail: row.user_email, text: row.text, time: row.time }));
}

function renderChat() {
  const container = document.getElementById("chatMessages");
  container.innerHTML = state.messages.map(m => `
    <div class="chat-bubble ${m.userEmail === state.currentUserEmail ? "own" : ""}">
      <div class="who">${escapeHtml(m.userName)}</div>${escapeHtml(m.text)}
    </div>`).join("");
  container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  sb(await sbClient.from("chat_messages").insert({
    user_name: state.currentUserName, user_email: state.currentUserEmail,
    text, time: new Date().toLocaleTimeString()
  }));
  await loadChat();
  renderChat();
}

// Mensajes nuevos de otros miembros llegan en vivo sin recargar la pestaña.
try {
  sbClient.channel("chat-realtime")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, payload => {
      const row = payload.new;
      state.messages.push({ userName: row.user_name, userEmail: row.user_email, text: row.text, time: row.time });
      renderChat();
    })
    .subscribe();
} catch (e) {
  console.error("[OCF] No se pudo activar el chat en tiempo real:", e);
}

/* ---------------- Eventos ---------------- */
async function loadEvents() {
  const data = sb(await sbClient.from("events").select("*").order("date_time", { ascending: true }));
  state.events = (data || []).map(row => ({ id: row.id, title: row.title, dateTime: row.date_time, description: row.description }));
}

function renderEvents() {
  const container = document.getElementById("eventsList");
  if (!state.events.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i>${escapeHtml(t().noEvents)}</div>`;
    return;
  }
  container.innerHTML = state.events.map(ev => {
    const d = new Date(ev.dateTime);
    const months = { es: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"], en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], fr: ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"] }[state.currentLang];
    return `
    <div class="event-card">
      <div class="event-date-box"><div class="d">${d.getDate()}</div><div class="m">${months[d.getMonth()]}</div></div>
      <div style="flex:1;">
        <h4>${escapeHtml(ev.title)}</h4>
        <p>${escapeHtml(ev.description || "")}</p>
        <div class="time"><i class="fa-regular fa-clock"></i> ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
      </div>
      <button class="btn btn-sm btn-danger-ghost" onclick="deleteEvent('${ev.id}')"><i class="fa-solid fa-trash"></i></button>
    </div>`;
  }).join("");
}

function openEventModal() {
  document.getElementById("eventTitle").value = "";
  document.getElementById("eventDateTime").value = "";
  document.getElementById("eventDesc").value = "";
  openModal("eventModal");
}

async function saveEvent() {
  const title = document.getElementById("eventTitle").value.trim();
  const dateTime = document.getElementById("eventDateTime").value;
  if (!title || !dateTime) { showToast(t().eventTitle, "error"); return; }
  sb(await sbClient.from("events").insert({
    title, date_time: new Date(dateTime).toISOString(), description: document.getElementById("eventDesc").value.trim()
  }));
  closeModal("eventModal");
  await loadEvents();
  renderEvents();
  showToast(t().save + " ✓");
  celebrate(50);
}

async function deleteEvent(id) {
  sb(await sbClient.from("events").delete().eq("id", id));
  await loadEvents();
  renderEvents();
}

/* ---------------- Dashboard: gráfico ---------------- */
function updateChart() {
  const ctx = document.getElementById("evolutionChart");
  if (!ctx) return;
  const months = Object.keys(state.incomes).sort();
  const data = months.map(m => Object.values(state.incomes[m] || {}).reduce((a, b) => a + b, 0));
  if (state.evolutionChart) state.evolutionChart.destroy();
  const gridColor = document.body.classList.contains("light") ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  const textColor = document.body.classList.contains("light") ? "#3C4658" : "#C4CDE0";
  state.evolutionChart = new Chart(ctx, {
    type: "line",
    data: { labels: months.map(monthLabel), datasets: [{
      label: t().metricSavings, data, borderColor: "#D4A24C",
      backgroundColor: "rgba(212,162,76,0.12)", fill: true, tension: 0.4,
      pointBackgroundColor: "#2BB596", pointBorderColor: "#fff"
    }] },
    options: { responsive: true, plugins: { legend: { labels: { color: textColor } } },
      scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } } }
  });
}

function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let totalIncomes = 0;
  for (const m in state.incomes) totalIncomes += Object.values(state.incomes[m]).reduce((a, b) => a + b, 0);
  const totalWithdrawals = state.withdrawals.reduce((s, w) => s + w.amount, 0);
  doc.setFontSize(18); doc.text("OCF Startup — Informe financiero", 14, 18);
  doc.setFontSize(11);
  doc.text(`Emprendedores activos: ${activeMembers().length}`, 14, 32);
  doc.text(`Ahorro total: ${fmtMoney(totalIncomes - totalWithdrawals)}`, 14, 40);
  doc.text(`Total retiros: ${fmtMoney(totalWithdrawals)}`, 14, 48);
  doc.text(`Mes actual (${state.currentMonth}): ${fmtMoney(Object.values(state.incomes[state.currentMonth] || {}).reduce((a, b) => a + b, 0))}`, 14, 56);
  doc.setFontSize(13); doc.text("Retiros recientes", 14, 70);
  doc.setFontSize(10);
  let y = 78;
  state.withdrawals.slice(0, 15).forEach(w => {
    doc.text(`${w.date} — ${w.beneficiaryName} — ${fmtMoney(w.amount)}`, 14, y);
    y += 7;
  });
  doc.save("OCF-informe-financiero.pdf");
}

/* ---------------- Arranque ---------------- */
// Traduce la pantalla de login según el idioma guardado, incluso antes de autenticarse.
try {
  document.querySelectorAll(".lang-group button").forEach(b => {
    b.classList.toggle("active", b.dataset.lang === state.currentLang);
  });
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (t()[key] !== undefined) el.textContent = t()[key];
  });
} catch (e) {
  console.error("[OCF] Error al traducir la pantalla inicial:", e);
}
