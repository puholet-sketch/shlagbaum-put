(() => {
  const STORAGE_KEY = "shlagbaum-put-case-v1";

  const STAGES = [
    { id: "signatures", title: "Подписи 10%", wait: "До 30 дней на ответ transport.mos.ru" },
    { id: "poll", title: "Опрос в ЭД", wait: "Срок опроса задаёт ЭД (обычно ~7 дней)" },
    { id: "ampp", title: "Схема АМПП", wait: "Ожидание проекта размещения и письма АМПП" },
    { id: "meeting", title: "Встреча / ОСС", wait: "После встречи ЭД — публикация ОСС (~неделя); голосование по карточке ЭД" },
    { id: "install", title: "Установка", wait: "После положительного ОСС — монтаж АМПП" },
  ];

  const form = document.getElementById("case-form");
  const city = document.getElementById("city");
  const cityError = document.getElementById("city-error");
  const tracker = document.getElementById("tracker");
  const trackAddress = document.getElementById("track-address");
  const trackList = document.getElementById("track-list");
  const letterMeta = document.getElementById("letter-meta");
  const letterText = document.getElementById("letter-text");
  const toast = document.getElementById("toast");

  function showToast(msg) {
    toast.hidden = false;
    toast.textContent = msg;
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => { toast.hidden = true; }, 2200);
  }

  function letterFor(stageId, address, uk) {
    const ukLine = uk ? `Управляющая организация: ${uk}.` : "Управляющая организация: _______________.";
    const templates = {
      signatures: {
        to: "transport.mos.ru → Единое окно транспортного комплекса (АМПП)",
        body:
`Добрый день!

Прошу рассмотреть возможность включения многоквартирного дома по адресу:
${address}
в программу установки шлагбаумов за счёт бюджета города Москвы (ГКУ «АМПП»).

${ukLine}

К обращению прилагаю / приложу:
— список собственников, поддерживающих установку (не менее 10%);
— предлагаемую схему размещения (эскиз);
— сведения о социальных/коммерческих объектах во дворе (если есть).

Прошу сообщить о результатах рассмотрения и дальнейших шагах
(опрос в «Электронном доме», проект размещения, ОСС).

Контакт инициатора:
ФИО: _______________
Телефон: _______________
E-mail: _______________`,
      },
      poll: {
        to: "Чат жителей / объявления в подъездах",
        body:
`Соседи, коротко по шлагбауму — ${address}

Открыт / ожидается опрос в «Электронном доме» по установке шлагбаума.
Голосуют собственники помещений (нужна подтверждённая учётная запись mos.ru).

Почему важно:
— опрос — обязательный этап городской программы АМПП;
— при положительном результате город готовит схему и выносит вопрос на ОСС;
— установка по программе — без оплаты монтажа жителями, 1-й год обслуживания бесплатно.

Просьба: проголосуйте и перешлите соседям.
Вопросы — инициативной группе.`,
      },
      ampp: {
        to: "support@ed.mos.ru и/или уточнение в АМПП (transport.mos.ru)",
        body:
`Добрый день!

Обращаюсь как собственник / инициатор по адресу: ${address}.

Опрос в «Электронном доме» по установке шлагбаума завершён / пройден.
Прошу сообщить:
1) получен ли проект размещения шлагбаумов от ГКУ «АМПП»;
2) на какой стадии подготовка ОСС;
3) ориентировочный срок публикации собрания в «Электронном доме»;
4) будет ли схема АМПП приложена к повестке;
5) подтвердите возможность смешанного голосования (онлайн + бумага).

${ukLine}

Контакт: _______________`,
      },
      meeting: {
        to: "Чат жителей — ОСС объявлено",
        body:
`Соседи!

По адресу ${address} в «Электронном доме» / ГИС ЖКХ размещено сообщение
о внеочередном ОСС по установке шлагбаума (заочное голосование).

Как голосовать:
— основной способ: онлайн на ed.mos.ru / в приложении «Электронный дом»;
— бумага нужна только если не голосуете онлайн (СНИЛС обязателен);
— бумагу принимают нарочно у оператора ЭД / в офисах проекта (см. повестку и ed.mos.ru).

В повестке обычно:
1) назначить УК администратором ОСС в ЭД;
2) порядок приёма письменных решений;
3) согласие на установку за счёт бюджета Москвы по схеме АМПП.
«10 месяцев» — это повторное ОСС про тариф ПОСЛЕ ввода шлагбаума, не срок монтажа.

Проверьте доступ собственника в ЭД и проголосуйте в сроки из карточки ОСС.`,
      },
      install: {
        to: "Контрольный запрос в АМПП / УК после положительного ОСС",
        body:
`Добрый день!

По адресу ${address} общее собрание собственников приняло решение
об установке шлагбаума по схеме АМПП (при наличии кворума и большинства «за»).

Прошу сообщить:
— планируемые сроки монтажа;
— контакт для вопросов по доступу/пропускам после ввода;
— порядок обслуживания в первый год.

${ukLine}

Контакт инициатора: _______________`,
      },
    };
    return templates[stageId] || templates.signatures;
  }

  function stageIndex(id) {
    return Math.max(0, STAGES.findIndex((s) => s.id === id));
  }

  function loadCase() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function saveCase(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function render(data) {
    if (!data) {
      tracker.hidden = true;
      return;
    }
    tracker.hidden = false;
    trackAddress.textContent = data.address;
    const current = stageIndex(data.stage);
    trackList.innerHTML = "";
    STAGES.forEach((stage, i) => {
      const li = document.createElement("li");
      const sent = Boolean(data.sent?.[stage.id]);
      let status = "ожидает";
      let cls = "";
      let badgeCls = "";
      if (i < current || sent) {
        status = "сделано / отправлено";
        cls = "is-done";
        badgeCls = "badge--done";
      } else if (i === current) {
        status = sent ? "ждём ответ" : "сейчас";
        cls = "is-current";
        badgeCls = sent ? "badge--wait" : "badge--now";
      }
      li.className = cls;
      li.innerHTML = `<span><strong>${stage.title}</strong><br><small>${stage.wait}</small></span><span class="badge ${badgeCls}">${status}</span>`;
      trackList.appendChild(li);
    });

    const letter = letterFor(data.stage, data.address, data.uk);
    letterMeta.textContent = `Кому / канал: ${letter.to}`;
    letterText.value = letter.body;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (city.value !== "moscow") {
      cityError.hidden = false;
      return;
    }
    cityError.hidden = true;
    const data = {
      city: "moscow",
      address: document.getElementById("address").value.trim(),
      uk: document.getElementById("uk").value.trim(),
      stage: document.getElementById("stage").value,
      sent: loadCase()?.sent || {},
      updatedAt: new Date().toISOString(),
    };
    if (!data.address) return;
    saveCase(data);
    render(data);
    document.getElementById("tracker").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  city.addEventListener("change", () => {
    cityError.hidden = city.value === "moscow";
  });

  document.getElementById("copy-letter").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(letterText.value);
      showToast("Текст письма скопирован");
    } catch {
      letterText.select();
      showToast("Выделите текст и скопируйте вручную");
    }
  });

  document.getElementById("mark-sent").addEventListener("click", () => {
    const data = loadCase();
    if (!data) return;
    data.sent = data.sent || {};
    data.sent[data.stage] = new Date().toISOString();
    data.updatedAt = new Date().toISOString();
    saveCase(data);
    render(data);
    showToast("Этап отмечен как отправленный — ждём ответ инстанции");
  });

  document.getElementById("clear-case").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    render(null);
    form.reset();
    city.value = "moscow";
    cityError.hidden = true;
  });

  render(loadCase());
})();
