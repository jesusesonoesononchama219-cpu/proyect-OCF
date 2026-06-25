/* ============================================================
   OCF STARTUP — Configuración global
   ============================================================ */

// ⚠️ Reemplaza estos dos valores con los de tu proyecto Supabase:
// Project Settings → API → "Project URL" y "anon public" key.
const SUPABASE_URL = "https://qmxqvstlkrikxrpreypo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GlCYCgcG6A1miGxg5y3Hhw_-6sX2bvY";

var sbClient;
var BACKEND_READY = false;
try {
  if (!window.supabase) throw new Error("El SDK de Supabase no se cargó (revisa tu conexión a internet o bloqueadores).");
  if (SUPABASE_URL.indexOf("TU-PROYECTO") !== -1 || SUPABASE_ANON_KEY.indexOf("TU-CLAVE") !== -1) {
    throw new Error("Supabase no está configurado todavía: edita js/config.js con tu URL y anon key.");
  }
  sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false } // siempre pide usuario y contraseña al abrir la app
  });
  BACKEND_READY = true;
} catch (e) {
  console.error("[OCF] Backend no disponible:", e.message);
  var chain = function () {
    var c = {};
    ["select","insert","update","upsert","delete","eq","order","limit","maybeSingle"].forEach(function (fn) {
      c[fn] = function () { return chain(); };
    });
    c.then = function (resolve) { return Promise.resolve(resolve({ data: null, error: { message: e.message } })); };
    return c;
  };
  sbClient = {
    auth: {
      signInWithPassword: function () { return Promise.resolve({ error: { message: e.message } }); },
      signOut: function () { return Promise.resolve({}); },
      onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; },
      getSession: function () { return Promise.resolve({ data: { session: null } }); }
    },
    from: function () { return chain(); },
    channel: function () { return { on: function () { return this; }, subscribe: function () {} }; }
  };
}

window.addEventListener("DOMContentLoaded", function () {
  if (!BACKEND_READY) {
    var banner = document.createElement("div");
    banner.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:999;background:#E5626A;color:#fff;text-align:center;padding:.5rem;font-size:.82rem;font-family:Inter,sans-serif;";
    banner.textContent = "⚠️ Supabase no está conectado todavía. Revisa js/config.js (URL y anon key) y la consola del navegador (F12) para más detalles.";
    document.body.prepend(banner);
  }
});

/* ---------- Constantes de negocio ---------- */
var ROLES = ["Miembro", "Presidente", "Tesorero", "Secretario", "Reclutador"];

// % de comisión por defecto según el rol del vendedor (editable por venta).
var COMMISSION_RATES = {
  Miembro: 25,
  Reclutador: 20,
  Secretario: 15,
  Tesorero: 15,
  Presidente: 10
};

var DEFAULT_AVATAR = "https://api.dicebear.com/7.x/initials/svg?backgroundType=gradientLinear&fontWeight=600&seed=";

/* ---------- Estado global de la app ---------- */
var state = {
  currentLang: localStorage.getItem("ocf_lang") || "es",
  theme: localStorage.getItem("ocf_theme") || "dark",
  currentUserEmail: null,
  currentUserName: null,
  currentMonth: new Date().toISOString().slice(0, 7),
  members: [],
  incomes: {},
  withdrawals: [],
  posts: [],
  messages: [],
  events: [],
  sales: [],
  salesGoal: { amount: 0 },
  editMemberId: null,
  evolutionChart: null,
  salesChart: null
};

/* ---------- Helpers ---------- */
function t() { return translations[state.currentLang]; }

function fmtMoney(n) {
  return Math.round(n || 0).toLocaleString("fr-FR") + " FCFA";
}

function fmtCompact(n) {
  n = Math.round(n || 0);
  if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(0) + "K";
  return String(n);
}

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function avatarFor(member) {
  if (member && member.photoUrl) return member.photoUrl;
  const seed = encodeURIComponent((member && member.name) || "OCF");
  return DEFAULT_AVATAR + seed;
}

function showToast(msg, kind) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show" + (kind ? " toast-" + kind : "");
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

// Lanza un error legible si la respuesta de Supabase trae `error`, y devuelve `data` si no.
function sb(res) {
  if (res && res.error) {
    console.error(res.error);
    showToast(res.error.message || "Error de base de datos", "error");
    throw res.error;
  }
  return res ? res.data : null;
}

function celebrate(amount) {
  if (typeof confetti !== "function") return;
  confetti({
    particleCount: amount || 80,
    spread: 65,
    origin: { y: 0.6 },
    colors: ["#D4A24C", "#2BB596", "#FF7A30", "#EDF1F7"]
  });
}

// Construye un "anillo de jugo" (signature visual) en cualquier contenedor.
function renderJuiceRing(containerId, percent, opts) {
  opts = opts || {};
  const size = opts.size || 140;
  const stroke = opts.stroke || 14;
  const color = opts.color || "#2BB596";
  const track = opts.track || "rgba(255,255,255,0.08)";
  const label = opts.label !== undefined ? opts.label : Math.round(percent) + "%";
  const sub = opts.sub || "";
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent || 0));
  const offset = circumference * (1 - clamped / 100);
  const segments = 8;
  let ticks = "";
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI - Math.PI / 2;
    const x1 = c + (r + stroke / 2 + 3) * Math.cos(angle);
    const y1 = c + (r + stroke / 2 + 3) * Math.sin(angle);
    const x2 = c + (r + stroke / 2 + 7) * Math.cos(angle);
    const y2 = c + (r + stroke / 2 + 7) * Math.sin(angle);
    ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${track}" stroke-width="2" stroke-linecap="round"/>`;
  }
  const html = `
    <svg class="juice-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${ticks}
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        transform="rotate(-90 ${c} ${c})" class="juice-ring-arc"/>
      <text x="${c}" y="${sub ? c - 4 : c + 6}" text-anchor="middle" class="juice-ring-value">${label}</text>
      ${sub ? `<text x="${c}" y="${c + 18}" text-anchor="middle" class="juice-ring-sub">${sub}</text>` : ""}
    </svg>`;
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = html;
}

// Convierte un archivo de imagen en un data-URL JPEG redimensionado (para no
// guardar fotos pesadas en la base de datos sin necesitar un bucket de Storage).
function fileToResizedDataUrl(file, maxSize, quality) {
  maxSize = maxSize || 320;
  quality = quality || 0.82;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo procesar la imagen"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) { height *= maxSize / width; width = maxSize; }
        else if (height > maxSize) { width *= maxSize / height; height = maxSize; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function monthLabel(ym) {
  const [y, m] = ym.split("-");
  const names = {
    es: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
    en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    fr: ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"]
  };
  const arr = names[state.currentLang] || names.es;
  return arr[parseInt(m, 10) - 1] + " " + y;
}
