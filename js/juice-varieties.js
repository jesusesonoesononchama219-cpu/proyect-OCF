/* ============================================================
   "NUESTROS ZUMOS" — Variedades de Juice (tarjetas con transición)
   ------------------------------------------------------------
   ⚠️ Las fotos de abajo son TEMPORALES. Para poner las tuyas:
   1) copia tus archivos a assets/juice/
   2) cambia el campo "img" de cada variedad por tu archivo, ej:
        img: "assets/juice/naranja.jpg"
   Cada texto tiene 3 versiones (es/en/fr) para traducirse solo
   al cambiar el idioma de la app. Puedes agregar o quitar
   variedades copiando el mismo bloque { }.
   ============================================================ */

const juiceVarieties = [
  {
    img: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=900&q=80",
    name: { es: "Naranja Energía", en: "Orange Energy", fr: "Orange Énergie" },
    tagline: { es: "100% natural · sin azúcar añadida", en: "100% natural · no added sugar", fr: "100% naturel · sans sucre ajouté" },
    ingredients: { es: "Naranjas frescas prensadas en frío", en: "Fresh cold-pressed oranges", fr: "Oranges fraîches pressées à froid" },
    benefits: { es: "Rica en vitamina C, antioxidante y energizante", en: "Rich in vitamin C, antioxidant and energizing", fr: "Riche en vitamine C, antioxydante et énergisante" },
    origin: { es: "Huertos locales de Bénin", en: "Local orchards in Benin", fr: "Vergers locaux du Bénin" }
  },
  {
    img: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=80",
    name: { es: "Verde Detox", en: "Green Detox", fr: "Vert Détox" },
    tagline: { es: "Frescura verde para tu día", en: "Green freshness for your day", fr: "Fraîcheur verte pour ta journée" },
    ingredients: { es: "Manzana verde, espinaca, limón y jengibre", en: "Green apple, spinach, lemon and ginger", fr: "Pomme verte, épinard, citron et gingembre" },
    benefits: { es: "Depurativo, digestivo y lleno de fibra", en: "Detoxifying, digestive and full of fiber", fr: "Dépuratif, digestif et riche en fibres" },
    origin: { es: "Mezcla de la casa OCF", en: "OCF house blend", fr: "Mélange maison OCF" }
  },
  {
    img: "https://images.unsplash.com/photo-1605522561233-768ad7a8fee3?auto=format&fit=crop&w=900&q=80",
    name: { es: "Mango Tropical", en: "Tropical Mango", fr: "Mangue Tropicale" },
    tagline: { es: "El sabor del sol del trópico", en: "The taste of tropical sun", fr: "Le goût du soleil tropical" },
    ingredients: { es: "Mango maduro, maracuyá y un toque de menta", en: "Ripe mango, passion fruit and a touch of mint", fr: "Mangue mûre, fruit de la passion et une touche de menthe" },
    benefits: { es: "Alto en vitamina A y antioxidantes naturales", en: "High in vitamin A and natural antioxidants", fr: "Riche en vitamine A et antioxydants naturels" },
    origin: { es: "Cosecha de temporada", en: "Seasonal harvest", fr: "Récolte de saison" }
  },
  {
    img: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=900&q=80",
    name: { es: "Ananás Vital", en: "Vital Pineapple", fr: "Ananas Vital" },
    tagline: { es: "Tropical, dulce y refrescante", en: "Tropical, sweet and refreshing", fr: "Tropical, sucré et rafraîchissant" },
    ingredients: { es: "Piña fresca y un toque de coco", en: "Fresh pineapple with a touch of coconut", fr: "Ananas frais et une touche de coco" },
    benefits: { es: "Favorece la digestión y la hidratación", en: "Supports digestion and hydration", fr: "Favorise la digestion et l'hydratation" },
    origin: { es: "Producción artesanal OCF", en: "OCF artisanal production", fr: "Production artisanale OCF" }
  }
];

function renderJuiceVarieties() {
  const container = document.getElementById("juiceVarietiesTrack");
  if (!container) return;
  container.innerHTML = juiceVarieties.map((v) => `
    <div class="juice-card" tabindex="0" onmouseenter="this.classList.add('is-active')" onmouseleave="this.classList.remove('is-active')" onclick="this.classList.toggle('is-active')">
      <div class="juice-card-img" style="background-image:url('${v.img}')"></div>
      <div class="juice-card-body">
        <h4>${escapeHtml(pickLang(v.name))}</h4>
        <p class="juice-card-tagline">${escapeHtml(pickLang(v.tagline))}</p>
        <div class="juice-card-info">
          <div class="juice-info-row"><i class="fa-solid fa-leaf"></i> ${escapeHtml(pickLang(v.ingredients))}</div>
          <div class="juice-info-row"><i class="fa-solid fa-heart-pulse"></i> ${escapeHtml(pickLang(v.benefits))}</div>
          <div class="juice-info-row"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(pickLang(v.origin))}</div>
        </div>
      </div>
    </div>`).join("");
}

document.addEventListener("DOMContentLoaded", renderJuiceVarieties);
