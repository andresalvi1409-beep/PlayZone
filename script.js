/* PlayZone conectado a Supabase.
   La clave publishable es pública y puede estar en el frontend.
   NUNCA pongas aquí una clave sb_secret_ ni service_role. */

const SUPABASE_URL = "https://wzrpqkltoszjudzmrktk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ddCrs4VVVBoTKBn_msHzcQ_qtCuiFyl";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

let games = [];
let activeCategory = "Todos";
let isAdminLoggedIn = false;
let loadingGames = false;

const $ = (id) => document.getElementById(id);
const gamesGrid = $("gamesGrid");
const categoryFilters = $("categoryFilters");

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

function showCatalogMessage(message) {
  gamesGrid.innerHTML = `<p class="empty-state">${escapeHTML(message)}</p>`;
}

function fromDatabase(row) {
  return {
    id: row.id,
    name: row.nombre,
    category: row.categoria,
    url: row.url,
    image: row.imagen || "",
    mode: row.modo || "auto",
    featured: Boolean(row.destacado)
  };
}

async function loadGames() {
  loadingGames = true;
  showCatalogMessage("Cargando juegos…");
  const { data, error } = await supabaseClient
    .from("juegos")
    .select("id,nombre,categoria,url,imagen,modo,destacado,created_at")
    .order("created_at", { ascending: false });

  loadingGames = false;
  if (error) {
    console.error("Error cargando juegos:", error);
    showCatalogMessage("No se han podido cargar los juegos. Comprueba la conexión con Supabase y las políticas de lectura.");
    $("gameCount").textContent = "— juegos";
    return;
  }
  games = (data || []).map(fromDatabase);
  renderGames();
  if (isAdminLoggedIn) renderAdminList();
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
  $("gameMessage").style.color = "";
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

$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const button = $("loginButton");
  button.disabled = true;
  button.textContent = "Comprobando…";
  $("loginMessage").textContent = "";
  const email = $("adminEmail").value.trim();
  const password = $("adminPassword").value;
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  button.disabled = false;
  button.textContent = "Entrar al panel";
  if (error) {
    $("loginMessage").textContent = error.message.includes("Email not confirmed")
      ? "Ese correo todavía no está confirmado. Confírmalo en Authentication → Users."
      : "No se ha podido iniciar sesión. Revisa el correo, la contraseña y que el usuario esté confirmado.";
    console.error("Error de inicio de sesión:", error);
    return;
  }
  isAdminLoggedIn = Boolean(data.session);
  $("adminPassword").value = "";
  $("loginMessage").textContent = "";
  updateAdminView();
  await loadGames();
});

$("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  isAdminLoggedIn = false;
  resetGameForm();
  updateAdminView();
});
$("cancelEditBtn").addEventListener("click", resetGameForm);

$("gameForm").addEventListener("submit", async event => {
  event.preventDefault();
  const name = $("gameName").value.trim();
  const category = $("gameCategory").value.trim();
  const url = safeUrl($("gameUrl").value.trim());
  const imageRaw = $("gameImage").value.trim();
  const image = imageRaw ? safeUrl(imageRaw) : null;
  if (!name || !category || !url) {
    $("gameMessage").textContent = "Revisa el nombre, la categoría y el enlace (debe empezar por https:// o http://).";
    return;
  }
  if (imageRaw && !image) {
    $("gameMessage").textContent = "La URL de la imagen no parece válida.";
    return;
  }

  const id = $("editId").value;
  const row = {
    nombre: name,
    categoria: category,
    url,
    imagen: image,
    modo: $("gameMode").value,
    destacado: $("gameFeatured").checked
  };

  $("saveGameBtn").disabled = true;
  $("gameMessage").style.color = "";
  $("gameMessage").textContent = "Guardando…";
  let result;
  if (id) {
    result = await supabaseClient.from("juegos").update(row).eq("id", id);
  } else {
    result = await supabaseClient.from("juegos").insert(row);
  }
  $("saveGameBtn").disabled = false;

  if (result.error) {
    console.error("Error guardando juego:", result.error);
    $("gameMessage").textContent = "No se pudo guardar. Comprueba que has iniciado sesión y que las políticas RLS permiten modificar la tabla.";
    return;
  }
  resetGameForm();
  await loadGames();
  $("gameMessage").style.color = "#16865b";
  $("gameMessage").textContent = id ? "Cambios guardados y publicados." : "¡Juego añadido y publicado!";
});

$("adminGameList").addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) editGame(editButton.dataset.edit);
  if (deleteButton) {
    const game = games.find(item => item.id === deleteButton.dataset.delete);
    if (!game || !confirm(`¿Seguro que quieres eliminar "${game.name}"?`)) return;
    const { error } = await supabaseClient.from("juegos").delete().eq("id", game.id);
    if (error) {
      alert("No se pudo eliminar el juego. Comprueba tu sesión y los permisos RLS.");
      console.error("Error eliminando juego:", error);
      return;
    }
    await loadGames();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeGame();
    closeAdmin();
  }
});

async function init() {
  const { data } = await supabaseClient.auth.getSession();
  isAdminLoggedIn = Boolean(data.session);
  updateAdminView();
  await loadGames();

  // Actualiza el catálogo en otras pestañas/dispositivos cuando Realtime está habilitado.
  supabaseClient
    .channel("playzone-juegos")
    .on("postgres_changes", { event: "*", schema: "public", table: "juegos" }, () => loadGames())
    .subscribe();
}

init();
