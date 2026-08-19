import { defaultSites } from "./sites.js";

const USER_SITES_STORAGE_KEY = "my-workbench:user-sites:v1";
const HIDDEN_SITES_STORAGE_KEY = "my-workbench:hidden-sites:v1";

const grid = document.querySelector("#site-grid");
const count = document.querySelector("#site-count");
const template = document.querySelector("#site-card-template");
const dialog = document.querySelector("#site-dialog");
const form = document.querySelector("#site-form");
const undoToast = document.querySelector("#undo-toast");
const undoMessage = document.querySelector("#undo-message");
const undoButton = document.querySelector("#undo-button");
let undoTimer;

function readUserSites() {
  try {
    const stored = JSON.parse(localStorage.getItem(USER_SITES_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveUserSites(sites) {
  localStorage.setItem(USER_SITES_STORAGE_KEY, JSON.stringify(sites));
}

function readHiddenSiteIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(HIDDEN_SITES_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveHiddenSiteIds(ids) {
  localStorage.setItem(HIDDEN_SITES_STORAGE_KEY, JSON.stringify(ids));
}

function showUndo(siteName, undo) {
  window.clearTimeout(undoTimer);
  undoMessage.textContent = `已删除“${siteName}”`;
  undoToast.hidden = false;

  undoButton.onclick = () => {
    window.clearTimeout(undoTimer);
    undo();
    undoToast.hidden = true;
  };

  undoTimer = window.setTimeout(() => {
    undoToast.hidden = true;
  }, 6000);
}

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function renderSites() {
  const userSites = readUserSites();
  const hiddenSiteIds = readHiddenSiteIds();
  const sites = [
    ...defaultSites.filter((site) => !hiddenSiteIds.includes(site.id)),
    ...userSites,
  ];
  const fragment = document.createDocumentFragment();

  sites.forEach((site, index) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const link = card.querySelector(".card-link");
    const favicon = card.querySelector(".site-favicon");
    const fallback = card.querySelector(".favicon-fallback");

    card.style.setProperty("--accent", site.color);
    link.href = site.url;
    link.setAttribute("aria-label", `打开${site.name}`);
    card.querySelector(".card-index").textContent = String(index + 1).padStart(2, "0");
    card.querySelector(".card-title").textContent = site.name;
    card.querySelector(".card-description").textContent = site.description || "打开网站";
    card.querySelector(".card-host").textContent = getHostname(site.url);
    fallback.textContent = site.name.trim().charAt(0).toUpperCase();

    if (site.favicon) {
      favicon.src = site.favicon;
      favicon.addEventListener("load", () => card.classList.add("has-favicon"));
      favicon.addEventListener("error", () => favicon.remove());
    } else {
      favicon.remove();
    }

    const deleteButton = card.querySelector(".delete-button");
    deleteButton.setAttribute("aria-label", `删除${site.name}`);
    deleteButton.title = `删除${site.name}`;
    deleteButton.addEventListener("click", () => {
      if (site.userAdded) {
        saveUserSites(userSites.filter((item) => item.id !== site.id));
        renderSites();
        showUndo(site.name, () => {
          saveUserSites([...readUserSites(), site]);
          renderSites();
        });
        return;
      }

      saveHiddenSiteIds([...new Set([...hiddenSiteIds, site.id])]);
      renderSites();
      showUndo(site.name, () => {
        saveHiddenSiteIds(readHiddenSiteIds().filter((id) => id !== site.id));
        renderSites();
      });
    });

    fragment.append(card);
  });

  if (sites.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-directory";
    emptyState.textContent = "工作台暂时为空";
    fragment.append(emptyState);
  }

  grid.replaceChildren(fragment);
  count.textContent = `${sites.length} 个站点`;
}

function closeDialog() {
  dialog.close();
  form.reset();
}

document.querySelector("#open-dialog").addEventListener("click", () => dialog.showModal());
document.querySelector("#close-dialog").addEventListener("click", closeDialog);
document.querySelector("#cancel-dialog").addEventListener("click", closeDialog);

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const url = new URL(String(data.get("url")));
  const userSites = readUserSites();

  userSites.push({
    id: crypto.randomUUID(),
    name: String(data.get("name")).trim(),
    url: url.toString(),
    description: String(data.get("description")).trim(),
    color: String(data.get("color")),
    favicon: `${url.origin}/favicon.ico`,
    userAdded: true,
  });

  saveUserSites(userSites);
  renderSites();
  closeDialog();
});

document.querySelector("#current-year").textContent = new Date().getFullYear();
renderSites();
