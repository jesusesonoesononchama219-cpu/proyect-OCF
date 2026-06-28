/* ============================================================
   "EVENTOS Y UNIÓN" — Carrusel hero (Aniversario / fotos de miembros)
   ------------------------------------------------------------
   ⚠️ Las imágenes de abajo son TEMPORALES (fotos profesionales de
   stock) mientras llegan las fotos reales de los miembros. Para
   reemplazarlas, solo cambia el campo `img` de cada slide por la
   ruta de tu propia foto (ej: "assets/eventos/circulo.jpg").
   ============================================================ */

const unionSlides = [
  {
    img: "assets/eventos/aniversario1.jpg",
    eyebrow: "2° ANIVERSARIO OCF",
    title: "Familia OCF, brindando con energía",
    sub: "Nuestros miembros celebrando juntos, Sales Juice en mano. 🧃"
  },
  {
    img: "assets/eventos/aniversario2.jpg",
    eyebrow: "JUNTOS SOMOS MÁS FUERTES",
    title: "Un círculo, una sola familia",
    sub: "Cada aniversario es una nueva prueba de que la unión hace la fuerza."
  },
  {
    video: "assets/eventos/aniversario.mp4",
    eyebrow: "ASÍ LO VIVIMOS",
    title: "El aniversario en movimiento",
    sub: "Revive los mejores momentos de nuestra celebración."
  }
];

let unionIndex = 0;
let unionTimer = null;

function renderUnionSlider() {
  const slidesEl = document.getElementById("unionSlides");
  const dotsEl = document.getElementById("unionDots");
  if (!slidesEl || !dotsEl) return;
  slidesEl.innerHTML = unionSlides.map((s, i) => `
    <div class="union-slide ${i === 0 ? "active" : ""}" ${s.img ? `style="background-image:url('${s.img}')"` : ""}>
      ${s.video ? `<video class="union-video" src="${s.video}" autoplay muted loop playsinline></video>` : ""}
      <div class="union-overlay">
        <span class="union-eyebrow">${escapeHtml(s.eyebrow)}</span>
        <h2 class="union-title">${escapeHtml(s.title)}</h2>
        <p class="union-sub">${escapeHtml(s.sub)}</p>
      </div>
    </div>`).join("");
  dotsEl.innerHTML = unionSlides.map((_, i) => `<button class="union-dot ${i === 0 ? "active" : ""}" onclick="unionSliderGoTo(${i})"></button>`).join("");
  startUnionAutoplay();
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
