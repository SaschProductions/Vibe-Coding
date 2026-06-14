const DEFAULT_THEME = {
  surface: "water",
  horizon: ["#7cc9d8", "#2f8f83"],
  accent: "#41e5b4",
  silhouette: "#dffdf5",
  detail: "#ffffff",
  props: ["clean-water"],
  style: { outline: "#08303a", panel: "#f5fff9" }
};

const THEMES = {
  Kueste: {
    surface: "water",
    horizon: ["#79d6df", "#2d9b8b"],
    accent: "#ffd166",
    silhouette: "#e8fbff",
    detail: "#b9f3f1",
    props: ["oil-slick", "buoy", "foam"],
    style: { outline: "#08303a", panel: "#efffff" }
  },
  Wald: {
    surface: "forest",
    horizon: ["#8fd6a5", "#236b45"],
    accent: "#f4d35e",
    silhouette: "#174b33",
    detail: "#d6f7cf",
    props: ["tree-line", "stumps", "sparks"],
    style: { outline: "#123522", panel: "#efffec" }
  },
  Riff: {
    surface: "reef",
    horizon: ["#65c7f7", "#147f8a"],
    accent: "#ff9f80",
    silhouette: "#ffb4a2",
    detail: "#ffe66d",
    props: ["coral", "plastic", "bubbles"],
    style: { outline: "#063c50", panel: "#ecfbff" }
  },
  Wuestenzone: {
    surface: "solar",
    horizon: ["#f8c471", "#b86f34"],
    accent: "#3dd6d0",
    silhouette: "#5a3a22",
    detail: "#ffe7a3",
    props: ["solar-panels", "dust", "heat"],
    style: { outline: "#5a351b", panel: "#fff5d7" }
  },
  Innenstadt: {
    surface: "city",
    horizon: ["#9fb3c8", "#4b5563"],
    accent: "#7ddf64",
    silhouette: "#2f3948",
    detail: "#d8e3ea",
    props: ["skyline", "smog", "park"],
    style: { outline: "#1c2633", panel: "#eef6ff" }
  },
  Arktis: {
    surface: "ice",
    horizon: ["#b8e7f5", "#d9f2f2"],
    accent: "#5c6bc0",
    silhouette: "#eaffff",
    detail: "#9fe9ff",
    props: ["ice-cracks", "drill-marks", "snow"],
    style: { outline: "#376070", panel: "#f5ffff" }
  },
  Feuchtgebiet: {
    surface: "wetland",
    horizon: ["#a0d9b4", "#3a7d60"],
    accent: "#f7b267",
    silhouette: "#225a44",
    detail: "#c6f6c9",
    props: ["reeds", "toxic-stream", "lilies"],
    style: { outline: "#1d4737", panel: "#f0fff0" }
  },
  Gebirge: {
    surface: "mountain",
    horizon: ["#91c4f2", "#5d737e"],
    accent: "#c3f73a",
    silhouette: "#44545c",
    detail: "#eef9ff",
    props: ["peaks", "stream", "rocks"],
    style: { outline: "#2b3a40", panel: "#f7fcff" }
  },
  Wiesen: {
    surface: "meadow",
    horizon: ["#f4e285", "#6a994e"],
    accent: "#386641",
    silhouette: "#4f7d3a",
    detail: "#fff2a8",
    props: ["flowers", "spray-clouds", "field-rows"],
    style: { outline: "#31512b", panel: "#ffffdf" }
  },
  "Metro-Zentrale": {
    surface: "industrial",
    horizon: ["#6ec6ca", "#394867"],
    accent: "#ffcc4d",
    silhouette: "#202735",
    detail: "#ff754a",
    props: ["warning-grid", "pipes", "vents"],
    style: { outline: "#121722", panel: "#fff3de" }
  }
};

const DEFAULT_POLLUTER = {
  label: "Umweltmaschine",
  body: "drone",
  icon: "warning",
  primary: "#26323a",
  secondary: "#ff754a",
  emission: "#8f9290",
  scale: 1
};

const POLLUTERS = {
  smogDrone: { label: "Smog-Drohne", body: "drone", icon: "smog", primary: "#313b43", secondary: "#ff754a", emission: "#8f9290", scale: 1.05 },
  leakCanister: { label: "Leck-Kanister", body: "canister", icon: "oil", primary: "#4b342b", secondary: "#050505", emission: "#101010", scale: 1.14 },
  cutterBot: { label: "Abholzungsbot", body: "sawbot", icon: "saw", primary: "#5b4635", secondary: "#ffd166", emission: "#ff5d36", scale: 1.1 },
  ashPod: { label: "Aschekapsel", body: "pod", icon: "fire", primary: "#3b3332", secondary: "#ff754a", emission: "#ff5d36", scale: 1.02 },
  plasticSkimmer: { label: "Plastik-Skimmer", body: "skimmer", icon: "plastic", primary: "#355f75", secondary: "#ff9f80", emission: "#b8c0c2", scale: 1.08 },
  microbin: { label: "Mikroplastik", body: "pod", icon: "plastic", primary: "#5f6f7c", secondary: "#d66cff", emission: "#b8c0c2", scale: 0.94 },
  sludgeFloat: { label: "Schlammfloat", body: "canister", icon: "toxic", primary: "#34352e", secondary: "#8aff62", emission: "#101010", scale: 1.16 },
  dustRig: { label: "Staub-Rig", body: "rig", icon: "dust", primary: "#7b5537", secondary: "#ffd166", emission: "#c9aa52", scale: 1.12 },
  heatDrone: { label: "Hitzedrohne", body: "drone", icon: "heat", primary: "#6f3f30", secondary: "#ff754a", emission: "#ff8a4c", scale: 1.02 },
  sootTank: { label: "Russpanzer", body: "tank", icon: "smog", primary: "#3b332d", secondary: "#ff754a", emission: "#101010", scale: 1.18 },
  stackBot: { label: "Abgasautomat", body: "stack", icon: "smog", primary: "#4b5563", secondary: "#8f9290", emission: "#8f9290", scale: 1.12 },
  wasteCrate: { label: "Muellkiste", body: "crate", icon: "trash", primary: "#59606a", secondary: "#b8c0c2", emission: "#b8c0c2", scale: 1.06 },
  relayUnit: { label: "Waerme-Relais", body: "relay", icon: "heat", primary: "#516a86", secondary: "#ff8a4c", emission: "#ff754a", scale: 1.08 },
  sparkDrone: { label: "Funken-Drohne", body: "drone", icon: "spark", primary: "#435b8f", secondary: "#ffd166", emission: "#ffd166", scale: 1 },
  meltCore: { label: "Schmelzkern", body: "core", icon: "heat", primary: "#34495e", secondary: "#ff754a", emission: "#9fe9ff", scale: 1.14 },
  runoffSiphon: { label: "Abfluss-Siphon", body: "pipe", icon: "toxic", primary: "#3a5f50", secondary: "#8aff62", emission: "#8aff62", scale: 1.14 },
  sprayDrone: { label: "Spruehdrohne", body: "drone", icon: "spray", primary: "#51735e", secondary: "#a4e04d", emission: "#a4e04d", scale: 1.02 },
  foamPod: { label: "Schaumkapsel", body: "pod", icon: "foam", primary: "#5b6f66", secondary: "#d2e2dd", emission: "#b8c0c2", scale: 1.04 },
  scrapTurbine: { label: "Schrott-Turbine", body: "turbine", icon: "turbine", primary: "#4a555b", secondary: "#c3f73a", emission: "#8f9290", scale: 1.12 },
  gritDrone: { label: "Grit-Drohne", body: "drone", icon: "dust", primary: "#5d5a50", secondary: "#ffd166", emission: "#b8c0c2", scale: 1.02 },
  oilBarrelBot: { label: "Oelfass-Bot", body: "barrel", icon: "oil", primary: "#2a2a24", secondary: "#050505", emission: "#101010", scale: 1.18 },
  oversprayBot: { label: "Pestizidmaschine", body: "sprayer", icon: "spray", primary: "#556b2f", secondary: "#a4e04d", emission: "#a4e04d", scale: 1.12 },
  nitratePod: { label: "Nitratkapsel", body: "pod", icon: "toxic", primary: "#607331", secondary: "#d6ff79", emission: "#a4e04d", scale: 1.08 },
  megaEmitter: { label: "Oel-Tanker", body: "tanker", icon: "oil", primary: "#252b2f", secondary: "#050505", emission: "#101010", scale: 1.2 }
};

const POLLUTION = {
  Waldgesundheit: { shape: "flame", color: "#ff5d36" },
  Riffgesundheit: { shape: "plastic", color: "#d66cff" },
  "Luftqualitaet am Hafen": { shape: "smog", color: "#8f9290" },
  Stadtluft: { shape: "smog", color: "#8f9290" },
  Wasserqualitaet: { shape: "toxic", color: "#8aff62" },
  Eisstabilitaet: { shape: "heat", color: "#ff8a4c" },
  Bachreinheit: { shape: "oil", color: "#101010" },
  Bodenleben: { shape: "toxic", color: "#a4e04d" },
  "Solarfeld-Leistung": { shape: "dust", color: "#c9aa52" },
  "Regionale Stabilitaet": { shape: "smog", color: "#ff754a" }
};

export function biomeTheme(biome) {
  return THEMES[biome] || DEFAULT_THEME;
}

export function polluterVisual(kind) {
  return POLLUTERS[kind] || DEFAULT_POLLUTER;
}

export function pollutionVisual(metricLabel) {
  return POLLUTION[metricLabel] || { shape: "oil", color: "#101010" };
}
