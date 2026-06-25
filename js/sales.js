/* ============================================================
   SALES JUICE — Módulo de ventas de OCF Startup
   ============================================================ */

/* ---------------- Carga de datos ---------------- */
async function loadSales() {
  const data = sb(await sbClient.from("sales").select("*").order("date", { ascending: false }));
  state.sales = (data || []).map(row => ({
    id: row.id, memberId: row.member_id, memberName: row.member_name, memberRole: row.member_role,
    product: row.product, amount: Number(row.amount) || 0, commissionPct: Number(row.commission_pct) || 0,
    commissionAmount: Number(row.commission_amount) || 0, netAmount: Number(row.net_amount) || 0, date: row.date
  }));
  const goalRow = sb(await sbClient.from("app_config").select("*").eq("key", "salesGoal").maybeSingle());
  state.salesGoal = (goalRow && goalRow.value) || { amount: 0 };
  fillSaleSellerSelect();
  fillSalesFilters();
}

/* ---------------- Cálculos ---------------- */
function calcSale(amount, commissionPct) {
  const commissionAmount = Math.round(amount * (commissionPct / 100));
  const netAmount = amount - commissionAmount;
  return { commissionAmount, netAmount };
}

function currentMonthSales() {
  return state.sales.filter(s => (s.date || "").slice(0, 7) === state.currentMonth);
}

/* ---------------- Selects / filtros ---------------- */
function fillSaleSellerSelect() {
  const select = document.getElementById("saleSeller");
  if (!select) return;
  select.innerHTML = activeMembers().map(m => `<option value="${m.id}">${escapeHtml(m.name)} — ${escapeHtml(m.role)}</option>`).join("");
}

function fillSalesFilters() {
  const monthSelect = document.getElementById("salesFilterMonth");
  const memberSelect = document.getElementById("salesFilterMember");
  if (!monthSelect || !memberSelect) return;
  const months = Array.from(new Set(state.sales.map(s => (s.date || "").slice(0, 7)))).sort().reverse();
  if (!months.includes(state.currentMonth)) months.unshift(state.currentMonth);
  monthSelect.innerHTML = `<option value="">${t().everyone}</option>` + months.map(m => `<option value="${m}" ${m === state.currentMonth ? "selected" : ""}>${monthLabel(m)}</option>`).join("");
  memberSelect.innerHTML = `<option value="">${t().everyone}</option>` + activeMembers().map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("");
}

/* ---------------- Modal: nueva venta ---------------- */
function openSaleModal() {
  fillSaleSellerSelect();
  document.getElementById("saleProduct").value = "";
  document.getElementById("saleAmount").value = "";
  document.getElementById("saleDate").value = new Date().toISOString().slice(0, 10);
  onSaleSellerChange();
  openModal("saleModal");
}

function onSaleSellerChange() {
  const memberId = document.getElementById("saleSeller").value;
  const member = state.members.find(m => m.id === memberId);
  const rate = member ? (COMMISSION_RATES[member.role] || 20) : 20;
  document.getElementById("saleCommissionPct").value = rate;
  recalcSaleModal();
}

function recalcSaleModal() {
  const amount = parseFloat(document.getElementById("saleAmount").value) || 0;
  const pct = parseFloat(document.getElementById("saleCommissionPct").value) || 0;
  const { commissionAmount, netAmount } = calcSale(amount, pct);
  document.getElementById("saleCommissionPreview").textContent = fmtMoney(commissionAmount);
  document.getElementById("saleNetPreview").textContent = fmtMoney(netAmount);
}

async function saveSale() {
  const memberId = document.getElementById("saleSeller").value;
  const member = state.members.find(m => m.id === memberId);
  const product = document.getElementById("saleProduct").value.trim();
  const amount = parseFloat(document.getElementById("saleAmount").value) || 0;
  const commissionPct = parseFloat(document.getElementById("saleCommissionPct").value) || 0;
  const date = document.getElementById("saleDate").value || new Date().toISOString().slice(0, 10);
  if (!member || !product || amount <= 0) { showToast(t().saleProduct, "error"); return; }
  const { commissionAmount, netAmount } = calcSale(amount, commissionPct);
  sb(await sbClient.from("sales").insert({
    member_id: memberId, member_name: member.name, member_role: member.role,
    product, amount, commission_pct: commissionPct, commission_amount: commissionAmount,
    net_amount: netAmount, date
  }));
  closeModal("saleModal");
  await loadSales();
  renderSales();
  renderRanking();
  renderSalesMetrics();
  updateSalesChart();
  renderDashboardSalesPreview();
  showToast(t().saveSale + " ✓ +" + fmtMoney(commissionAmount));
  celebrate(120);
}

async function deleteSale(id) {
  if (!confirm(t().confirmDeleteMember)) return;
  sb(await sbClient.from("sales").delete().eq("id", id));
  await loadSales();
  renderSales();
  renderRanking();
  renderSalesMetrics();
  updateSalesChart();
}

/* ---------------- Render: lista de ventas ---------------- */
function filteredSales() {
  const monthFilter = document.getElementById("salesFilterMonth") ? document.getElementById("salesFilterMonth").value : "";
  const memberFilter = document.getElementById("salesFilterMember") ? document.getElementById("salesFilterMember").value : "";
  return state.sales.filter(s => (!monthFilter || (s.date || "").slice(0, 7) === monthFilter) && (!memberFilter || s.memberId === memberFilter));
}

function renderSales() {
  const container = document.getElementById("salesList");
  if (!container) return;
  const list = filteredSales();
  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-lemon"></i>${escapeHtml(t().noSales)}</div>`;
  } else {
    container.innerHTML = list.slice(0, 30).map(s => `
      <div class="sale-card">
        <div class="slice"><i class="fa-solid fa-lemon"></i></div>
        <div class="info">
          <div class="top">${escapeHtml(s.product)} <span class="badge badge-${s.memberRole}">${escapeHtml(s.memberName)}</span></div>
          <div class="meta">${s.date} · ${fmtMoney(s.amount)} · ${s.commissionPct}%</div>
        </div>
        <div class="amounts">
          <div class="net num">${fmtMoney(s.netAmount)}</div>
          <div class="comm">+${fmtMoney(s.commissionAmount)}</div>
        </div>
        <button class="btn btn-sm btn-danger-ghost" onclick="deleteSale('${s.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>`).join("");
  }
  renderSalesMetrics();
}

function renderDashboardSalesPreview() {
  const container = document.getElementById("dashboardSalesPreview");
  if (!container) return;
  const list = state.sales.slice(0, 5);
  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-lemon"></i>${escapeHtml(t().noSales)}</div>`;
    return;
  }
  container.innerHTML = list.map(s => `
    <div class="row-item" style="cursor:default;">
      <div class="slice" style="width:32px;height:32px;font-size:.78rem;"><i class="fa-solid fa-lemon"></i></div>
      <div class="info"><div class="name">${escapeHtml(s.product)}</div><div class="meta">${escapeHtml(s.memberName)} · ${s.date}</div></div>
      <div class="num" style="font-weight:700;">${fmtMoney(s.amount)}</div>
    </div>`).join("");
}

/* ---------------- Métricas ---------------- */
function renderSalesMetrics() {
  const list = currentMonthSales();
  const total = list.reduce((a, s) => a + s.amount, 0);
  const commissions = list.reduce((a, s) => a + s.commissionAmount, 0);
  const net = list.reduce((a, s) => a + s.netAmount, 0);
  document.getElementById("sCount").textContent = list.length;
  document.getElementById("sTotal").textContent = fmtCompact(total);
  document.getElementById("sCommissions").textContent = fmtCompact(commissions);
  document.getElementById("sNet").textContent = fmtCompact(net);
  document.getElementById("mSalesTotal").textContent = fmtCompact(total);
  const goal = (state.salesGoal && state.salesGoal.amount) || 0;
  const pct = goal > 0 ? Math.min(100, (total / goal) * 100) : 0;
  renderJuiceRing("salesGoalRing", pct, { color: "#FF7A33", label: fmtCompact(total), sub: goal > 0 ? "/ " + fmtCompact(goal) : "FCFA" });
  renderDashboardSalesPreview();
}

/* ---------------- Ranking ---------------- */
function renderRanking() {
  const container = document.getElementById("salesRanking");
  if (!container) return;
  const totals = {};
  currentMonthSales().forEach(s => { totals[s.memberId] = (totals[s.memberId] || 0) + s.amount; });
  const ranked = Object.entries(totals).map(([memberId, total]) => {
    const member = state.members.find(m => m.id === memberId);
    return { name: member ? member.name : "—", total };
  }).sort((a, b) => b.total - a.total);
  if (!ranked.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-trophy"></i>${escapeHtml(t().noRanking)}</div>`;
    return;
  }
  const max = ranked[0].total || 1;
  const medals = ["🥇", "🥈", "🥉"];
  container.innerHTML = ranked.slice(0, 8).map((r, i) => `
    <div class="ranking-row">
      <div class="pos">${medals[i] || (i + 1)}</div>
      <div class="bar-wrap">
        <div style="display:flex; justify-content:space-between; font-size:.85rem; font-weight:600;"><span>${escapeHtml(r.name)}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${(r.total / max) * 100}%;"></div></div>
      </div>
      <div class="amt">${fmtMoney(r.total)}</div>
    </div>`).join("");
}

/* ---------------- Meta ---------------- */
function openGoalModal() {
  document.getElementById("goalAmountInput").value = (state.salesGoal && state.salesGoal.amount) || "";
  openModal("goalModal");
}

async function saveGoal() {
  const amount = parseFloat(document.getElementById("goalAmountInput").value) || 0;
  sb(await sbClient.from("app_config").upsert({ key: "salesGoal", value: { amount } }));
  state.salesGoal = { amount };
  closeModal("goalModal");
  renderSalesMetrics();
  updateMetrics();
  showToast(t().setGoal + " ✓");
  celebrate(70);
}

/* ---------------- Gráfico de evolución de ventas ---------------- */
function updateSalesChart() {
  const ctx = document.getElementById("salesChart");
  if (!ctx) return;
  const byDay = {};
  state.sales.forEach(s => { byDay[s.date] = (byDay[s.date] || 0) + s.amount; });
  const days = Object.keys(byDay).sort().slice(-30);
  if (state.salesChart) state.salesChart.destroy();
  const textColor = document.body.classList.contains("light") ? "#3C4658" : "#C4CDE0";
  const gridColor = document.body.classList.contains("light") ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
  state.salesChart = new Chart(ctx, {
    type: "bar",
    data: { labels: days, datasets: [{
      label: t().salesTotal, data: days.map(d => byDay[d]),
      backgroundColor: "#FF7A33", borderRadius: 6, maxBarThickness: 28
    }] },
    options: { responsive: true, plugins: { legend: { labels: { color: textColor } } },
      scales: { x: { ticks: { color: textColor }, grid: { display: false } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } } }
  });
}

/* ---------------- Reporte PDF de ventas ---------------- */
function generateSalesPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const list = currentMonthSales();
  const total = list.reduce((a, s) => a + s.amount, 0);
  const commissions = list.reduce((a, s) => a + s.commissionAmount, 0);
  doc.setFontSize(18); doc.text("SALES JUICE — Reporte de ventas", 14, 18);
  doc.setFontSize(11);
  doc.text(`Mes: ${monthLabel(state.currentMonth)}`, 14, 30);
  doc.text(`Ventas registradas: ${list.length}`, 14, 38);
  doc.text(`Total vendido: ${fmtMoney(total)}`, 14, 46);
  doc.text(`Comisiones pagadas: ${fmtMoney(commissions)}`, 14, 54);
  doc.setFontSize(13); doc.text("Detalle", 14, 68);
  doc.setFontSize(9);
  let y = 76;
  list.forEach(s => {
    doc.text(`${s.date} · ${s.memberName} · ${s.product} · ${fmtMoney(s.amount)} (${s.commissionPct}%)`, 14, y);
    y += 6;
    if (y > 280) { doc.addPage(); y = 18; }
  });
  doc.save("SalesJuice-reporte.pdf");
}
