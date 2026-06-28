/* ============================================================
   "NUESTROS ZUMOS" — Variedades de Juice (tarjetas con transición)
   ------------------------------------------------------------
   ⚠️ Las fotos de abajo son TEMPORALES. Para poner las tuyas:
   1) copia tus archivos a assets/juice/
   2) cambia el campo "img" de cada variedad por tu archivo, ej:
        img: "assets/juice/naranja.jpg"
   Puedes agregar o quitar variedades copiando el mismo bloque { }.
   ============================================================ */

const juiceVarieties = [
  {
    name: "Naranja Energía",
    img: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=900&q=80",
    tagline: "100% natural · sin azúcar añadida",
    ingredients: "Naranjas frescas prensadas en frío",
    benefits: "Rica en vitamina C, antioxidante y energizante",
    origin: "Huertos locales de Bénin"
  },
  {
    name: "Verde Detox",
    img: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=80",
    tagline: "Frescura verde para tu día",
    ingredients: "Manzana verde, espinaca, limón y jengibre",
    benefits: "Depurativo, digestivo y lleno de fibra",
    origin: "Mezcla de la casa OCF"
  },
  {
    name: "Mango Tropical",
    img: "https://images.unsplash.com/photo-1605522561233-768ad7a8fee3?auto=format&fit=crop&w=900&q=80",
    tagline: "El sabor del sol del trópico",
    ingredients: "Mango maduro, maracuyá y un toque de menta",
    benefits: "Alto en vitamina A y antioxidantes naturales",
    origin: "Cosecha de temporada"
  },
  {
    name: "Ananás Vital",
    img: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=900&q=80",
    tagline: "Tropical, dulce y refrescante",
    ingredients: "Piña fresca y un toque de coco",
    benefits: "Favorece la digestión y la hidratación",
    origin: "Producción artesanal OCF"
  }
];

function renderJuiceVarieties() {
  const container = document.getElementById("juiceVarietiesTrack");
  if (!container) return;
  container.innerHTML = juiceVarieties.map((v, i) => `
    <div class="juice-card" tabindex="0" onmouseenter="this.classList.add('is-active')" onmouseleave="this.classList.remove('is-active')" onclick="this.classList.toggle('is-active')">
      <div class="juice-card-img" style="background-image:url('${v.img}')"></div>
      <div class="juice-card-body">
        <h4>${escapeHtml(v.name)}</h4>
        <p class="juice-card-tagline">${escapeHtml(v.tagline)}</p>
        <div class="juice-card-info">
          <div class="juice-info-row"><i class="fa-solid fa-leaf"></i> ${escapeHtml(v.ingredients)}</div>
          <div class="juice-info-row"><i class="fa-solid fa-heart-pulse"></i> ${escapeHtml(v.benefits)}</div>
          <div class="juice-info-row"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(v.origin)}</div>
        </div>
      </div>
    </div>`).join("");
}

document.addEventListener("DOMContentLoaded", renderJuiceVarieties);
