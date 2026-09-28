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
    presets: "или цель из готовых",
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
    sec: "с",
    trails: "шлейфы",
    on: "вкл",
    off: "выкл",
    save: "сохранить",
    video_sq: "Видео 1:1",
    video_v: "Видео 9:16",
    frame: "Кадр PNG",
    play: "Пуск",
    pause: "Пауза",
    reverse: "Реверс",
    computing: "раскладываю пиксели",
    recording: "идёт запись — не переключай вкладку",
    saved: "видео сохранено",
    no_rec: "этот браузер не умеет записывать видео",
    bad_file: "не получилось открыть файл",
    stats: (n: number, ms: number, a: number, b: number) =>
      `сетка ${n}×${n} · расчёт ${(ms / 1000).toFixed(1)} с · разница цвета ${a.toFixed(0)} → ${b.toFixed(0)}`,
    ease: "скорость",
    tips: {
      from: "Картинка, чьи пиксели полетят. Её цвета сохранятся как есть, поэтому лучше брать контрастное фото — с тёмными и светлыми местами.",
      into: "Картинка, которую пиксели должны собрать. Подойдёт любая: лицо, логотип, надпись.",
      presets: "Готовые цели, если своей картинки под рукой нет. Ставятся в «Во что».",
      grid: "На сколько пикселей режется картинка. 128 — это 128×128 = 16 384 частицы. Больше — детальнее, но дольше расчёт и мельче частицы.",
      order: "Кто взлетает первым: края (самые контрастные места), тёмные, дальние, волна от центра или вразнобой. Меняет рисунок самой анимации, а не результат.",
      traj: "Форма полёта. Возьми пресет или собери свой ползунками — превью сверху сразу показывает траектории. Меняется на лету, без пересчёта.",
      spread: "Насколько растянут старт. 0 — все взлетают одновременно, 0.9 — по очереди, длинной волной.",
      arc: "Изгиб пути. 0 — строго по прямой, чем больше — тем круче дуга.",
      bias: "Куда гнутся дуги: ↺ — все против часовой, ↻ — все по часовой, ± — каждая в свою сторону.",
      swirl: "Закручивает всю массу пикселей вокруг центра посередине полёта. Отрицательное значение — в другую сторону.",
      burst: "Разбрасывает пиксели от центра наружу, как взрыв, а к концу собирает обратно.",
      wobble: "Дрожание на лету — будто пиксели несёт ветром.",
      lift: "Насколько частица светлеет в полёте — как будто подлетает к экрану. Размер не меняется, всегда ровно один пиксель картинки. 0 — летит плоско.",
      ease: "Как меняется скорость: плавно — разгон и торможение; резко — рывок в начале; ровно — одна скорость; пружина — с перелётом и отскоком.",
      duration: "Сколько длится сам полёт, в секундах. В видео до и после добавляются паузы.",
      trails: "За каждой летящей частицей тянется полупрозрачный хвост из её прошлых положений — получается смаз движения. У приземлившихся хвост пропадает, финальная картинка остаётся чёткой.",
      save: "Видео пишется в реальном времени: сначала само фото, потом оно рассыпается на пиксели и собирается. Пока идёт запись, не переключай вкладку — браузер ставит фоновые вкладки на паузу. Кадр PNG — текущий момент.",
    },
    flat_warn: (p: number) =>
      `В исходнике ${p}% пикселей почти одной яркости — контрастную картинку из них не собрать, пиксели ведь не перекрашиваются. Лучше всего работают фото с тёмными и светлыми местами. Или попробуй поменять местами.`,
    stats_hint:
      "Разница цвета — насколько собранная картинка отличается от цели по цвету (средний ΔE в пространстве Lab, 0 — один в один). Первое число — после простой сортировки по яркости, второе — после обменов. Меньше — точнее. Если палитры картинок сильно разные, число останется большим: пиксели не перекрашиваются.",
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
    presets: "or pick a ready target",
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
    sec: "s",
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
      `grid ${n}×${n} · computed in ${(ms / 1000).toFixed(1)} s · color difference ${a.toFixed(0)} → ${b.toFixed(0)}`,
    ease: "speed",
    tips: {
      from: "The picture whose pixels take off. Its colors stay as they are, so a contrasty photo with both darks and lights works best.",
      into: "The picture the pixels should build. Anything goes: a face, a logo, some lettering.",
      presets: "Ready-made targets if you don't have a picture at hand. They go into «Into».",
      grid: "How many pixels the picture is cut into. 128 means 128×128 = 16,384 particles. More is sharper but slower to compute and the particles get smaller.",
      order: "Who takes off first: edges (the most contrasty spots), darks, far ones, a wave from the center, or random. Changes the look of the animation, not the result.",
      traj: "The shape of the flight. Pick a preset or build your own with the sliders — the preview above shows the paths. Updates live, no recompute.",
      spread: "How stretched the launch is. 0 — everyone takes off at once, 0.9 — one after another in a long wave.",
      arc: "Path bend. 0 is a straight line, higher means a bigger curve.",
      bias: "Which way the arcs bend: ↺ all counter-clockwise, ↻ all clockwise, ± each its own way.",
      swirl: "Spins the whole cloud around the center mid-flight. Negative spins the other way.",
      burst: "Blows pixels outwards like an explosion and pulls them back in by the end.",
      wobble: "Jitter along the way, as if the wind carries the pixels.",
      lift: "How much a particle brightens in flight, as if it comes closer to the screen. Its size never changes, always exactly one image pixel. 0 flies flat.",
      ease: "How speed changes: smooth — speeds up and slows down; snappy — a jolt at the start; linear — constant; spring — overshoots and bounces back.",
      duration: "How long the flight itself lasts, in seconds. Videos add pauses before and after.",
      trails: "Every flying particle drags a see-through tail of its past positions — a motion smear. Landed particles lose it, so the final picture stays crisp.",
      save: "Video records in real time: the photo first, then it breaks into pixels and rebuilds. Keep this tab open while recording — browsers pause background tabs. Frame PNG saves the current moment.",
    },
    flat_warn: (p: number) =>
      `${p}% of the source pixels share almost the same brightness, so there is no contrast to build with — pixels are never recolored. Photos with both darks and lights work best. Or try swapping.`,
    stats_hint:
      "Color difference is how far the rebuilt picture is from the target in color (mean ΔE in Lab space, 0 means identical). First number is after a plain brightness sort, second after the swaps. Lower is closer. Very different palettes keep it high: pixels are never recolored.",
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
    const l = saved === "ru" || saved === "en" ? saved : navigator.language.startsWith("ru") ? "ru" : "en";
    setLang(l);
    document.documentElement.lang = l;
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
