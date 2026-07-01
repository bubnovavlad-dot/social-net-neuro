const tabs = document.querySelectorAll(".tab");
const screens = document.querySelectorAll(".screen");
const content = document.querySelector("#phoneContent");
const composer = document.querySelector("#composer");
const composerText = document.querySelector("#composerText");
const publishPost = document.querySelector("#publishPost");
const feedList = document.querySelector("#feedList");
const toast = document.querySelector("#toast");
const neuroCount = document.querySelector("#neuroCount");
const dailyProgress = document.querySelector("#dailyProgress");

const copiedTexts = {
  email:
    "НейроКафе открывает сообщество практики. Делитесь инсайтами, рисунками и комментариями, поддерживайте других и получайте нейро за осмысленные действия.",
  banner:
    "Публикуйте инсайты. Собирайте достижения. Первый комментарий или репост засчитает день в серии.",
  push:
    "Сегодня в ленте новый афоризм. Прочитайте, оставьте отклик и сохраните серию.",
};

let activeKind = "Афоризм";
let missionsDone = new Set(["read"]);
let toastTimer = null;

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.screen;

    tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    screens.forEach((screen) => screen.classList.toggle("is-active", screen.id === target));
    content.scrollTo({ top: 0, behavior: "smooth" });
  });
});

document.querySelectorAll("[data-focus-composer]").forEach((button) => {
  button.addEventListener("click", () => {
    openScreen("feed");
    composer.scrollIntoView({ behavior: "smooth", block: "center" });
    composerText.focus();
  });
});

document.querySelectorAll(".tool-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    activeKind = chip.dataset.kind;
    document.querySelectorAll(".tool-chip").forEach((item) => item.classList.toggle("is-active", item === chip));
  });
});

document.querySelectorAll("[data-mission]").forEach((button) => {
  button.addEventListener("click", () => {
    markMission(button.dataset.mission);
    button.classList.add("is-done");
  });
});

publishPost.addEventListener("click", () => {
  const text = composerText.value.trim();
  if (!text) {
    showToast("Добавьте мысль или короткий отклик");
    composerText.focus();
    return;
  }

  const card = document.createElement("article");
  card.className = "post-card accent-post";
  card.innerHTML = `
    <header class="post-head">
      <div class="avatar avatar-user">А</div>
      <div>
        <h3>Вы · Искатель</h3>
        <p>${activeKind} · только что</p>
      </div>
      <img src="./assets/icons/seeker.png" alt="Бейдж Искатель" />
    </header>
    <p class="post-text"></p>
    <div class="post-metrics">
      <span>Публикация зачтена</span>
      <span>Комментарий или репост сохранит серию</span>
    </div>
    <div class="post-actions">
      <button type="button" data-like>Поддержать</button>
      <button type="button" data-comment>Комментировать</button>
      <button type="button" data-repost>В свою ленту</button>
    </div>
    <div class="comment-box" hidden>
      <input type="text" value="Добавлю комментарий, чтобы закрепить вывод." aria-label="Комментарий" />
      <button class="primary-action" type="button" data-send-comment>Отправить</button>
    </div>
  `;
  card.querySelector(".post-text").textContent = text;
  feedList.prepend(card);
  wirePostActions(card);
  markMission("comment");
  addNeuro(20);
  showToast("Пост опубликован, день серии почти закрыт");
});

document.querySelectorAll(".post-card").forEach(wirePostActions);

document.addEventListener("click", (event) => {
  const toastButton = event.target.closest("[data-toast]");
  if (toastButton) {
    showToast(toastButton.dataset.toast);
  }

  const copyButton = event.target.closest("[data-copy-template]");
  if (copyButton) {
    const key = copyButton.dataset.copyTemplate;
    copyText(copiedTexts[key] || "", copyButton.dataset.copyMessage || "Текст скопирован");
  }
});

document.querySelectorAll(".bottom-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".bottom-item").forEach((navItem) => navItem.classList.remove("is-active"));
    item.classList.add("is-active");
    if (item.textContent.includes("Сообщество")) openScreen("feed");
    if (item.textContent.includes("Учеба")) openScreen("quests");
  });
});

function wirePostActions(card) {
  card.querySelectorAll("[data-like]").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("is-active");
      showToast(button.classList.contains("is-active") ? "Поддержка отправлена" : "Поддержка снята");
    });
  });

  card.querySelectorAll("[data-comment]").forEach((button) => {
    button.addEventListener("click", () => {
      const box = card.querySelector(".comment-box");
      if (!box) return;

      box.hidden = !box.hidden;
      if (!box.hidden) box.querySelector("input").focus();
    });
  });

  card.querySelectorAll("[data-send-comment]").forEach((button) => {
    button.addEventListener("click", () => {
      markMission("comment");
      addNeuro(20);
      button.closest(".comment-box").hidden = true;
      showToast("Комментарий зачтен в серию");
    });
  });

  card.querySelectorAll("[data-repost]").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.add("is-active");
      markMission("share");
      addNeuro(10);
      showToast("Репост добавлен в вашу ленту");
    });
  });
}

function markMission(name) {
  missionsDone.add(name);
  document.querySelectorAll(`[data-mission="${name}"]`).forEach((item) => item.classList.add("is-done"));
  const percent = Math.round((missionsDone.size / 3) * 100);
  dailyProgress.style.width = `${percent}%`;

  if (percent === 100) {
    showToast("День серии закрыт: +50 нейро и прогресс к бейджу");
  }
}

function addNeuro(amount) {
  const next = Number(neuroCount.textContent) + amount;
  neuroCount.textContent = String(next);
}

function openScreen(id) {
  tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.screen === id));
  screens.forEach((screen) => screen.classList.toggle("is-active", screen.id === id));
}

async function copyText(text, successMessage) {
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    showToast("Текст готов для копирования");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}
