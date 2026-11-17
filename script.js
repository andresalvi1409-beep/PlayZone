/* PlayZone - catálogo de juegos y panel local de administración.
   IMPORTANTE: la contraseña del panel es una barrera visual, no seguridad real.
   Cambia ADMIN_PASSWORD antes de usarlo. En una web pública se necesita backend. */

const ADMIN_PASSWORD = "cambia-esta-clave"; // Cámbiala antes de publicar.

const DEFAULT_GAMES = [
  { id: "demo-1", name: "Drift Hunters", category: "Coches", url: "https://www.drifted.com/drift-hunters/", image: "", mode: "external", featured: true },
  { id: "demo-2", name: "Slope", category: "Habilidad", url: "https://slope-game.github.io/", image: "", mode: "auto", featured: true },
  { id: "demo-3", name: "2048", category: "Puzzle", url: "https://play2048.co/", image: "", mode: "auto", featured: false }
];

const STORAGE_KEY = "playzone_games_v1";
let games = loadGames();
let activeCategory = "Todos";
let isAdminLoggedIn = false;

const $ = (id) => document.getElementById(id);
const gamesGrid = $("gamesGrid");
const categoryFilters = $("categoryFilters");

function loadGames() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [...DEFAULT_GAMES];
  } catch (error) {
    console.warn("No se pudieron leer los juegos guardados.", error);
    return [...DEFAULT_GAMES];
  }
}

function saveGames() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function renderFilters() {
  const categories = ["Todos", ...new Set(games.map(game => game.category).filter(Boolean).sort((a,b) => a.localeCompare(b, "es")))];
  if (!categories.includes(activeCategory)) activeCategory = "Todos";
  categoryFilters.innerHTML = categories.map(category =>
    `<button class="filter-btn ${category === activeCategory ? "active" : ""}" data-category="${escapeHTML(category)}" type="button">${escapeHTML(category)}</button>`
  ).join("");
}

function renderGames() {
  renderFilters();
  const query = $("searchInput").value.trim().toLocaleLowerCase("es");
  const filtered = games.filter(game => {
    const matchesCategory = activeCategory === "Todos" || game.category === activeCategory;
    const matchesQuery = `${game.name} ${game.category}`.toLocaleLowerCase("es").includes(query);
    return matchesCategory && matchesQuery;
  }).sort((a,b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

  $("gameCount").textContent = `${games.length} ${games.length === 1 ? "juego" : "juegos"}`;
  $("emptyState").hidden = filtered.length > 0;
  gamesGrid.innerHTML = filtered.map(game => {
    const image = safeUrl(game.image || "");
    return `
      <article class="game-card">
        <div class="game-image">
          ${image ? `<img src="${escapeHTML(image)}" alt="Imagen de ${escapeHTML(game.name)}" loading="lazy" onerror="this.remove()">` : "🎮"}
          ${game.featured ? '<span class="featured-tag">★ DESTACADO</span>' : ""}
        </div>
        <div class="game-info">
          <h3>${escapeHTML(game.name)}</h3>
          <span class="game-category">${escapeHTML(game.category)}</span>
          <button class="play-btn" type="button" data-play="${escapeHTML(game.id)}">Jugar ahora →</button>
        </div>
      </article>`;
  }).join("");
}

function openGame(game) {
  const url = safeUrl(game.url);
  if (!url) return;
  $("gameTitle").textContent = game.name;
  $("openExternal").href = url;
  const wrap = $("iframeWrap");
  wrap.innerHTML = "";

  if (game.mode === "external") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const frame = document.createElement("iframe");
  frame.src = url;
  frame.title = game.name;
  frame.allow = "fullscreen; autoplay; gamepad";
  frame.allowFullscreen = true;
  frame.referrerPolicy = "no-referrer";
  wrap.appendChild(frame);
  $("gameModal").classList.add("show");
  $("gameModal").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeGame() {
  $("gameModal").classList.remove("show");
  $("gameModal").setAttribute("aria-hidden", "true");
  $("iframeWrap").innerHTML = "";
  document.body.style.overflow = "";
}

function openAdmin() {
  $("adminModal").classList.add("show");
  $("adminModal").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  updateAdminView();
}
function closeAdmin() {
  $("adminModal").classList.remove("show");
  $("adminModal").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
function updateAdminView() {
  $("adminLogin").hidden = isAdminLoggedIn;
  $("adminContent").hidden = !isAdminLoggedIn;
  if (isAdminLoggedIn) renderAdminList();
}

function resetGameForm() {
  $("gameForm").reset();
  $("editId").value = "";
  $("saveGameBtn").textContent = "＋ Añadir juego";
  $("cancelEditBtn").hidden = true;
  $("gameMessage").textContent = "";
}

function renderAdminList() {
  $("adminGameCount").textContent = `${games.length} en total`;
  $("adminGameList").innerHTML = games.map(game => `
    <div class="admin-row">
      <div><strong>${escapeHTML(game.name)}</strong><small>${escapeHTML(game.category)} · ${game.mode === "external" ? "Enlace externo" : "Intentar insertar"}</small></div>
      <div class="row-actions">
        <button type="button" data-edit="${escapeHTML(game.id)}">Editar</button>
        <button class="delete-btn" type="button" data-delete="${escapeHTML(game.id)}">Eliminar</button>
      </div>
    </div>`).join("") || '<p class="game-category">Todavía no has añadido juegos.</p>';
}

function editGame(id) {
  const game = games.find(item => item.id === id);
  if (!game) return;
  $("editId").value = game.id;
  $("gameName").value = game.name;
  $("gameCategory").value = game.category;
  $("gameUrl").value = game.url;
  $("gameImage").value = game.image || "";
  $("gameMode").value = game.mode || "auto";
  $("gameFeatured").checked = Boolean(game.featured);
  $("saveGameBtn").textContent = "Guardar cambios";
  $("cancelEditBtn").hidden = false;
  $("gameMessage").textContent = "";
  $("gameName").focus();
  $("gameForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

categoryFilters.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  renderGames();
});
gamesGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-play]");
  if (!button) return;
  const game = games.find(item => item.id === button.dataset.play);
  if (game) openGame(game);
});
$("searchInput").addEventListener("input", renderGames);
$("openAdmin").addEventListener("click", openAdmin);
document.querySelectorAll("[data-close-game]").forEach(el => el.addEventListener("click", closeGame));
document.querySelectorAll("[data-close-admin]").forEach(el => el.addEventListener("click", closeAdmin));

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();
  if ($("adminPassword").value === ADMIN_PASSWORD) {
    isAdminLoggedIn = true;
    $("adminPassword").value = "";
    $("loginMessage").textContent = "";
    updateAdminView();
  } else {
    $("loginMessage").textContent = "La contraseña no es correcta.";
  }
});
$("logoutBtn").addEventListener("click", () => {
  isAdminLoggedIn = false;
  resetGameForm();
  updateAdminView();
});
$("cancelEditBtn").addEventListener("click", resetGameForm);

$("gameForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = $("gameName").value.trim();
  const category = $("gameCategory").value.trim();
  const url = safeUrl($("gameUrl").value.trim());
  const imageRaw = $("gameImage").value.trim();
  const image = imageRaw ? safeUrl(imageRaw) : "";
  if (!name || !category || !url) {
    $("gameMessage").textContent = "Revisa el nombre, la categoría y el enlace (debe empezar por https:// o http://).";
    return;
  }
  if (imageRaw && !image) {
    $("gameMessage").textContent = "La URL de la imagen no parece válida.";
    return;
  }

  const id = $("editId").value;
  const data = {
    id: id || `game-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    name, category, url, image,
    mode: $("gameMode").value,
    featured: $("gameFeatured").checked
  };
  if (id) games = games.map(game => game.id === id ? data : game);
  else games.push(data);

  saveGames();
  resetGameForm();
  renderGames();
  renderAdminList();
  $("gameMessage").style.color = "#16865b";
  $("gameMessage").textContent = id ? "Cambios guardados." : "¡Juego añadido!";
});

$("adminGameList").addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) editGame(editButton.dataset.edit);
  if (deleteButton) {
    const game = games.find(item => item.id === deleteButton.dataset.delete);
    if (!game || !confirm(`¿Seguro que quieres eliminar "${game.name}"?`)) return;
    games = games.filter(item => item.id !== game.id);
    saveGames();
    renderGames();
    renderAdminList();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeGame();
    closeAdmin();
  }
});

renderGames();
