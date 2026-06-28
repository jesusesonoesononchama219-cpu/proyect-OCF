/* ============================================================
   "EVENTOS Y UNIÓN" — Carrusel hero (Aniversario / fotos de miembros)
   ------------------------------------------------------------
   ⚠️ Las imágenes/video de abajo son las fotos reales del 2°
   aniversario. Para cambiarlas, reemplaza el campo `img`/`video`
   por tu propio archivo en assets/eventos/.
   Cada texto tiene 3 versiones (es/en/fr) para que se traduzca
   automáticamente al cambiar el idioma de la app.
   ============================================================ */

const unionSlides = [
  {
    img: "assets/eventos/aniversario1.jpg",
    eyebrow: { es: "2° ANIVERSARIO OCF", en: "OCF 2ND ANNIVERSARY", fr: "2ᵃ ANNIVERSAIRE OCF" },
    title: {
      es: "Familia OCF, brindando con energía",
      en: "OCF family, toasting with energy",
      fr: "Famille OCF, célébrant avec énergie"
    },
    sub: {
      es: "Nuestros miembros celebrando juntos, Sales Juice en mano. 🧃",
      en: "Our members celebrating together, Sales Juice in hand. 🧃",
      fr: "Nos membres célébrant ensemble, Sales Juice à la main. 🧃"
    }
  },
  {
    img: "assets/eventos/aniversario2.jpg",
    eyebrow: { es: "JUNTOS SOMOS MÁS FUERTES", en: "TOGETHER WE ARE STRONGER", fr: "ENSEMBLE NOUS SOMMES PLUS FORTS" },
    title: {
      es: "Un círculo, una sola familia",
      en: "One circle, one family",
      fr: "Un cercle, une seule famille"
    },
    sub: {
      es: "Cada aniversario es una nueva prueba de que la unión hace la fuerza.",
      en: "Every anniversary is new proof that unity is strength.",
      fr: "Chaque anniversaire est une nouvelle preuve que l'union fait la force."
    }
  },
  {
    video: "assets/eventos/aniversario.mp4",
    eyebrow: { es: "ASÍ LO VIVIMOS", en: "HOW WE LIVED IT", fr: "COMME NOUS L'AVONS VÉCU" },
    title: {
      es: "El aniversario en movimiento",
      en: "The anniversary in motion",
      fr: "L'anniversaire en mouvement"
    },
    sub: {
      es: "Revive los mejores momentos de nuestra celebración.",
      en: "Relive the best moments of our celebration.",
      fr: "Revivez les meilleurs moments de notre célébration."
    }
  }
];

let unionIndex = 0;
let unionTimer = null;

function pickLang(field) {
  if (typeof field === "string") return field; // compatibilidad si algún slide trae texto plano
  return field[state.currentLang] || field.es || "";
}

function renderUnionSlider() {
  const slidesEl = document.getElementById("unionSlides");
  const dotsEl = document.getElementById("unionDots");
  if (!slidesEl || !dotsEl) return;
  slidesEl.innerHTML = unionSlides.map((s, i) => `
    <div class="union-slide ${i === unionIndex ? "active" : ""}" ${s.img ? `style="background-image:url('${s.img}')"` : ""}>
      ${s.video ? `
        <video class="union-video" id="unionVideo${i}" src="${s.video}" autoplay muted loop playsinline></video>
        <button class="union-mute-btn" onclick="toggleUnionSound(${i}, this)" aria-label="Activar sonido">
          <i class="fa-solid fa-volume-xmark"></i>
        </button>` : ""}
      <div class="union-overlay">
        <span class="union-eyebrow">${escapeHtml(pickLang(s.eyebrow))}</span>
        <h2 class="union-title">${escapeHtml(pickLang(s.title))}</h2>
        <p class="union-sub">${escapeHtml(pickLang(s.sub))}</p>
      </div>
    </div>`).join("");
  dotsEl.innerHTML = unionSlides.map((_, i) => `<button class="union-dot ${i === unionIndex ? "active" : ""}" onclick="unionSliderGoTo(${i})"></button>`).join("");
  startUnionAutoplay();
}

function toggleUnionSound(i, btn) {
  const video = document.getElementById("unionVideo" + i);
  if (!video) return;
  video.muted = !video.muted;
  btn.innerHTML = video.muted ? `<i class="fa-solid fa-volume-xmark"></i>` : `<i class="fa-solid fa-volume-high"></i>`;
  btn.classList.toggle("is-on", !video.muted);
}

function showUnionSlide(i) {
  const slides = document.querySelectorAll(".union-slide");
  const dots = document.querySelectorAll(".union-dot");
  if (!slides.length) return;
  unionIndex = (i + slides.length) % slides.length;
  slides.forEach((s, idx) => s.classList.toggle("active", idx === unionIndex));
  dots.forEach((d, idx) => d.classList.toggle("active", idx === unionIndex));
}

function unionSliderNext() { showUnionSlide(unionIndex + 1); restartUnionAutoplay(); }
function unionSliderPrev() { showUnionSlide(unionIndex - 1); restartUnionAutoplay(); }
function unionSliderGoTo(i) { showUnionSlide(i); restartUnionAutoplay(); }

function startUnionAutoplay() {
  clearInterval(unionTimer);
  unionTimer = setInterval(() => showUnionSlide(unionIndex + 1), 4000);
}
function restartUnionAutoplay() { startUnionAutoplay(); }

document.addEventListener("DOMContentLoaded", renderUnionSlider);
