"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ru" | "en";

const dict = {
  ru: {
    nav_play: "Попробовать",
    nav_how: "Как это работает",
    hero_1: "Каждый пиксель",
    hero_2a: "найдёт",
    hero_2b: "новое",
    hero_3: "место.",
    hero_lede: "Картинка раскладывается на пиксели, и они перелетают так, чтобы собрать другую. Ни один не теряется и не перекрашивается.",
    hero_cta: "Попробовать со своим фото",
    live: "в эфире",
    fact_px: "пикселей",
    fact_lost: "потеряно",
    fact_recolored: "перекрашено",
    play_idx: "(01) Песочница",
    play_title_1: "Возьми",
    play_title_2: "своё",
    play_title_3: "фото",
    from: "Из чего",
    into: "Во что",
    drop: "перетащи файл или нажми",
    drop_here: "Отпусти — станет исходником",
    presets: "или готовое",
    swap: "Поменять местами",
    grid: "сетка",
    order: "порядок вылета",
    modes: {
      contrast: "сначала края",
      brightness: "от тёмных",
      distance: "дальние первыми",
      wave: "волной",
      random: "случайно",
    },
    traj: "траектория",
    presets_traj: { smooth: "Классика", vortex: "Вихрь", burst: "Взрыв", river: "Река", chaos: "Хаос" },
    random: "Случайно",
    knobs: { spread: "разброс старта", arc: "дуга", bias: "направление", swirl: "вихрь", burst: "взрыв", wobble: "дрожь", lift: "подъём" },
    eases: { smooth: "плавно", snap: "резко", linear: "ровно", spring: "пружина" },
    duration: "длительность",
    trails: "шлейфы",
    on: "вкл",
    off: "выкл",
    save: "сохранить",
    video_sq: "Видео 1:1",
    video_v: "Видео 9:16",
    frame: "Кадр PNG",
    play: "Пуск",
    pause: "Пауза",
    reverse: "Назад",
    computing: "раскладываю пиксели",
    recording: "идёт запись — не переключай вкладку",
    saved: "видео сохранено",
    no_rec: "этот браузер не умеет записывать видео",
    bad_file: "не получилось открыть файл",
    stats: (n: number, ms: number, a: number, b: number) =>
      `${n}×${n} · ${(ms / 1000).toFixed(1)} с · ошибка цвета ${a.toFixed(0)} → ${b.toFixed(0)}`,
    how_idx: "(02) Как это работает",
    how_title_1: "Четыре шага,",
    how_title_2: "ноль магии",
    steps: [
      ["Сетка", "Обе картинки режутся в квадрат и сжимаются до сетки N×N. При 128 это 16 384 пикселя — столько частиц и полетит."],
      ["Яркость", "Пиксели исходника и цели сортируются по яркости и ставятся ранг в ранг. Уже узнаваемо, но цвета ещё мимо."],
      ["Обмены", "Тысячи пачек обменов пар: если после обмена цвета ближе к цели (в пространстве Lab) — обмен остаётся. Меньше секунды, в отдельном потоке."],
      ["Полёт", "Каждая частица летит по дуге со своим стартом: сначала края, тёмные или дальние. Форму полёта можно собрать в конструкторе, считает видеокарта."],
    ],
    foot_note: "Картинки не покидают твой браузер",
    credit: "Дизайн и код",
    marquee: ["Ни один пиксель не потерян", "Считается прямо в браузере", "Работает с любым фото"],
  },
  en: {
    nav_play: "Try it",
    nav_how: "How it works",
    hero_1: "Every pixel",
    hero_2a: "finds a",
    hero_2b: "new",
    hero_3: "home.",
    hero_lede: "An image breaks into pixels and they fly across to build another one. Nothing lost, nothing recolored.",
    hero_cta: "Try it with your photo",
    live: "live",
    fact_px: "pixels",
    fact_lost: "lost",
    fact_recolored: "recolored",
    play_idx: "(01) Playground",
    play_title_1: "Bring",
    play_title_2: "your own",
    play_title_3: "photo",
    from: "From",
    into: "Into",
    drop: "drop a file or click",
    drop_here: "Drop it — becomes the source",
    presets: "or pick one",
    swap: "Swap",
    grid: "grid",
    order: "launch order",
    modes: {
      contrast: "edges first",
      brightness: "darks first",
      distance: "far first",
      wave: "wave",
      random: "random",
    },
    traj: "trajectory",
    presets_traj: { smooth: "Classic", vortex: "Vortex", burst: "Burst", river: "River", chaos: "Chaos" },
    random: "Random",
    knobs: { spread: "launch spread", arc: "arc", bias: "direction", swirl: "swirl", burst: "burst", wobble: "wobble", lift: "lift" },
    eases: { smooth: "smooth", snap: "snappy", linear: "linear", spring: "spring" },
    duration: "duration",
    trails: "trails",
    on: "on",
    off: "off",
    save: "export",
    video_sq: "Video 1:1",
    video_v: "Video 9:16",
    frame: "Frame PNG",
    play: "Play",
    pause: "Pause",
    reverse: "Reverse",
    computing: "arranging pixels",
    recording: "recording — keep this tab open",
    saved: "video saved",
    no_rec: "this browser can't record video",
    bad_file: "couldn't open that file",
    stats: (n: number, ms: number, a: number, b: number) =>
      `${n}×${n} · ${(ms / 1000).toFixed(1)} s · color error ${a.toFixed(0)} → ${b.toFixed(0)}`,
    how_idx: "(02) How it works",
    how_title_1: "Four steps,",
    how_title_2: "zero magic",
    steps: [
      ["Grid", "Both images get cropped square and shrunk to an N×N grid. At 128 that is 16,384 pixels — that many particles take off."],
      ["Brightness", "Source and target pixels are sorted by brightness and matched rank to rank. Already recognisable, colors still off."],
      ["Swaps", "Thousands of batched pair swaps: if a swap brings colors closer to the target (in Lab space), it stays. Under a second, in a web worker."],
      ["Flight", "Each particle flies an arc with its own start time: edges, darks or far ones first. Shape the flight in the constructor, the GPU does the math."],
    ],
    foot_note: "Your images never leave the browser",
    credit: "Design & code",
    marquee: ["Not a single pixel lost", "Computed right in your browser", "Works with any photo"],
  },
};

export type Dict = (typeof dict)["ru"];

const Ctx = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({
  lang: "ru",
  t: dict.ru,
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ru");
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("lang");
    } catch {}
    if (saved === "ru" || saved === "en") setLang(saved);
    else if (!navigator.language.startsWith("ru")) setLang("en");
  }, []);
  const set = (l: Lang) => {
    setLang(l);
    document.documentElement.lang = l;
    try {
      localStorage.setItem("lang", l);
    } catch {}
  };
  return <Ctx.Provider value={{ lang, t: dict[lang] as Dict, setLang: set }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
