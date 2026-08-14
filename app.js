import { defaultSites } from "./sites.js";

const STORAGE_KEY = "my-workbench:user-sites:v1";

const grid = document.querySelector("#site-grid");
const count = document.querySelector("#site-count");
const template = document.querySelector("#site-card-template");
const dialog = document.querySelector("#site-dialog");
const form = document.querySelector("#site-form");

function readUserSites() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveUserSites(sites) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
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
  const sites = [...defaultSites, ...userSites];
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

    favicon.src = site.favicon || `${new URL(site.url).origin}/favicon.ico`;
    favicon.addEventListener("load", () => card.classList.add("has-favicon"));
    favicon.addEventListener("error", () => favicon.remove());

    if (site.userAdded) {
      const deleteButton = card.querySelector(".delete-button");
      deleteButton.hidden = false;
      deleteButton.addEventListener("click", () => {
        saveUserSites(userSites.filter((item) => item.id !== site.id));
        renderSites();
      });
    }

    fragment.append(card);
  });

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
