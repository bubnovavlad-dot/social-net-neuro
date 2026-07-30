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
const goalFeedback = document.querySelector("#goalFeedback");
const composerFeedback = document.querySelector("#composerFeedback");

let activeKind = "Афоризм";
let missionsDone = new Set(["read"]);
let dailyBonusClaimed = false;
let submittedResponses = new Set();
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
    const mission = button.dataset.mission;
    if (mission === "read") {
      showToast("Материал дня уже прочитан");
      return;
    }

    if (mission === "comment") {
      composer.scrollIntoView({ behavior: "smooth", block: "center" });
      composerText.focus();
      showToast("Опубликуйте содержательный отклик, чтобы действие засчиталось");
      return;
    }

    const repost = feedList.querySelector("[data-repost]");
    repost?.scrollIntoView({ behavior: "smooth", block: "center" });
    showToast("Сделайте репост публикации - отметка появится после действия");
  });
});

publishPost.addEventListener("click", () => {
  const text = composerText.value.trim();
  const validation = validateResponse(text);
  if (validation) {
    showComposerFeedback(validation, "error");
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
      <input type="text" value="Добавлю комментарий, чтобы закрепить вывод: что изменилось в состоянии и какой шаг хочу попробовать дальше." aria-label="Комментарий" />
      <button class="primary-action" type="button" data-send-comment>Отправить</button>
    </div>
  `;
  card.querySelector(".post-text").textContent = text;
  feedList.prepend(card);
  wirePostActions(card);
  submittedResponses.add(normalizeResponse(text));
  const result = markMission("comment");
  const bonusText = result.closedDay ? " День серии закрыт: +50 нейро." : "";
  addNeuro(20 + (result.closedDay ? 50 : 0));
  showComposerFeedback(`Отклик опубликован: +20 нейро.${bonusText} Следующий шаг - поддержать участника.`, "success");
  showToast(result.closedDay ? "Отклик опубликован. День серии закрыт: +20 и +50 нейро" : "Отклик опубликован: +20 нейро");
});

document.querySelectorAll(".post-card").forEach(wirePostActions);

document.addEventListener("click", (event) => {
  const toastButton = event.target.closest("[data-toast]");
  if (toastButton) {
    showToast(toastButton.dataset.toast);
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
      const input = button.closest(".comment-box").querySelector("input");
      const validation = validateResponse(input.value);
      if (validation) {
        showToast(validation);
        input.focus();
        return;
      }
      submittedResponses.add(normalizeResponse(input.value));
      const result = markMission("comment");
      if (result.isNew) {
        addNeuro(20 + (result.closedDay ? 50 : 0));
      }
      button.closest(".comment-box").hidden = true;
      showToast(result.closedDay ? "Комментарий зачтен: +20. День серии закрыт: +50 нейро" : result.isNew ? "Комментарий зачтен: +20 нейро" : "Комментарий опубликован, действие уже засчитано сегодня");
    });
  });

  card.querySelectorAll("[data-repost]").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.add("is-active");
      const result = markMission("share");
      if (result.isNew) {
        addNeuro(10 + (result.closedDay ? 50 : 0));
      }
      showToast(result.closedDay ? "Репост добавлен: +10. День серии закрыт: +50 нейро" : result.isNew ? "Репост добавлен: +10 нейро" : "Репост уже засчитан сегодня");
    });
  });
}

function markMission(name) {
  const beforeSize = missionsDone.size;
  missionsDone.add(name);
  document.querySelectorAll(`[data-mission="${name}"]`).forEach((item) => item.classList.add("is-done"));
  const percent = Math.round((missionsDone.size / 3) * 100);
  dailyProgress.style.width = `${percent}%`;
  dailyProgress.closest(".progress-track").setAttribute("aria-label", `Прогресс дня ${percent}%`);

  const closedDay = percent === 100 && !dailyBonusClaimed;
  if (closedDay) {
    dailyBonusClaimed = true;
    goalFeedback.textContent = "Цель дня закрыта: +50 нейро и прогресс к бейджу. Завтра появится новый мягкий шаг.";
    goalFeedback.classList.add("is-success");
  } else if (missionsDone.size < 3) {
    goalFeedback.textContent = missionsDone.has("comment") ? "Остался один шаг: поддержите участника или сделайте репост." : "Следующий шаг: оставьте отклик к материалу дня.";
  }

  return {
    isNew: missionsDone.size > beforeSize,
    closedDay,
    percent
  };
}

function addNeuro(amount) {
  const next = Number(neuroCount.textContent) + amount;
  neuroCount.textContent = String(next);
}

function openScreen(id) {
  tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.screen === id));
  screens.forEach((screen) => screen.classList.toggle("is-active", screen.id === id));
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function validateResponse(text) {
  if (!text) return "Добавьте мысль или короткий отклик";
  const sentenceCount = text.split(/[.!?]+/).filter((sentence) => sentence.trim().length >= 12).length;
  if (text.length < 120 && sentenceCount < 2) {
    return "Добавьте личное наблюдение: ориентир - 120 символов или 2 осмысленных предложения";
  }
  if (submittedResponses.has(normalizeResponse(text))) return "Похоже на повтор: нейро начисляются только за уникальный отклик";
  return "";
}

function normalizeResponse(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function showComposerFeedback(message, tone) {
  composerFeedback.textContent = message;
  composerFeedback.classList.add("is-visible");
  composerFeedback.classList.toggle("is-error", tone === "error");
  composerFeedback.classList.toggle("is-success", tone === "success");
}
