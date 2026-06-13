const DEFAULT_THEME = {
  surface: "water",
  horizon: ["#7cc9d8", "#2f8f83"],
  accent: "#41e5b4",
  silhouette: "#dffdf5",
  detail: "#ffffff"
};

const THEMES = {
  Kueste: {
    surface: "water",
    horizon: ["#79d6df", "#2d9b8b"],
    accent: "#ffd166",
    silhouette: "#e8fbff",
    detail: "#b9f3f1"
  },
  Wald: {
    surface: "forest",
    horizon: ["#8fd6a5", "#236b45"],
    accent: "#f4d35e",
    silhouette: "#174b33",
    detail: "#d6f7cf"
  },
  Riff: {
    surface: "reef",
    horizon: ["#65c7f7", "#147f8a"],
    accent: "#ff9f80",
    silhouette: "#ffb4a2",
    detail: "#ffe66d"
  },
  Wuestenzone: {
    surface: "solar",
    horizon: ["#f8c471", "#b86f34"],
    accent: "#3dd6d0",
    silhouette: "#5a3a22",
    detail: "#ffe7a3"
  },
  Innenstadt: {
    surface: "city",
    horizon: ["#9fb3c8", "#4b5563"],
    accent: "#7ddf64",
    silhouette: "#2f3948",
    detail: "#d8e3ea"
  },
  Arktis: {
    surface: "ice",
    horizon: ["#b8e7f5", "#d9f2f2"],
    accent: "#5c6bc0",
    silhouette: "#eaffff",
    detail: "#9fe9ff"
  },
  Feuchtgebiet: {
    surface: "wetland",
    horizon: ["#a0d9b4", "#3a7d60"],
    accent: "#f7b267",
    silhouette: "#225a44",
    detail: "#c6f6c9"
  },
  Gebirge: {
    surface: "mountain",
    horizon: ["#91c4f2", "#5d737e"],
    accent: "#c3f73a",
    silhouette: "#44545c",
    detail: "#eef9ff"
  },
  Wiesen: {
    surface: "meadow",
    horizon: ["#f4e285", "#6a994e"],
    accent: "#386641",
    silhouette: "#4f7d3a",
    detail: "#fff2a8"
  },
  "Metro-Zentrale": {
    surface: "industrial",
    horizon: ["#6ec6ca", "#394867"],
    accent: "#ffcc4d",
    silhouette: "#202735",
    detail: "#ff754a"
  }
};

const DEFAULT_POLLUTER = {
  label: "Umweltmaschine",
  body: "drone",
  primary: "#26323a",
  secondary: "#ff754a",
  emission: "#8f9290"
};

const POLLUTERS = {
  smogDrone: { label: "Smog-Drohne", body: "drone", primary: "#313b43", secondary: "#ff754a", emission: "#8f9290" },
  leakCanister: { label: "Leck-Kanister", body: "canister", primary: "#4b342b", secondary: "#050505", emission: "#101010" },
  cutterBot: { label: "Abholzungsbot", body: "sawbot", primary: "#5b4635", secondary: "#ffd166", emission: "#ff5d36" },
  ashPod: { label: "Aschekapsel", body: "pod", primary: "#3b3332", secondary: "#ff754a", emission: "#ff5d36" },
  plasticSkimmer: { label: "Plastik-Skimmer", body: "skimmer", primary: "#355f75", secondary: "#ff9f80", emission: "#b8c0c2" },
  microbin: { label: "Mikroplastik", body: "pod", primary: "#5f6f7c", secondary: "#d66cff", emission: "#b8c0c2" },
  sludgeFloat: { label: "Schlammfloat", body: "canister", primary: "#34352e", secondary: "#8aff62", emission: "#101010" },
  dustRig: { label: "Staub-Rig", body: "rig", primary: "#7b5537", secondary: "#ffd166", emission: "#c9aa52" },
  heatDrone: { label: "Hitzedrohne", body: "drone", primary: "#6f3f30", secondary: "#ff754a", emission: "#ff8a4c" },
  sootTank: { label: "Russpanzer", body: "tank", primary: "#3b332d", secondary: "#ff754a", emission: "#101010" },
  stackBot: { label: "Abgasautomat", body: "stack", primary: "#4b5563", secondary: "#8f9290", emission: "#8f9290" },
  wasteCrate: { label: "Muellkiste", body: "crate", primary: "#59606a", secondary: "#b8c0c2", emission: "#b8c0c2" },
  relayUnit: { label: "Waerme-Relais", body: "relay", primary: "#516a86", secondary: "#ff8a4c", emission: "#ff754a" },
  sparkDrone: { label: "Funken-Drohne", body: "drone", primary: "#435b8f", secondary: "#ffd166", emission: "#ffd166" },
  meltCore: { label: "Schmelzkern", body: "core", primary: "#34495e", secondary: "#ff754a", emission: "#9fe9ff" },
  runoffSiphon: { label: "Abfluss-Siphon", body: "pipe", primary: "#3a5f50", secondary: "#8aff62", emission: "#8aff62" },
  sprayDrone: { label: "Spruehdrohne", body: "drone", primary: "#51735e", secondary: "#a4e04d", emission: "#a4e04d" },
  foamPod: { label: "Schaumkapsel", body: "pod", primary: "#5b6f66", secondary: "#d2e2dd", emission: "#b8c0c2" },
  scrapTurbine: { label: "Schrott-Turbine", body: "turbine", primary: "#4a555b", secondary: "#c3f73a", emission: "#8f9290" },
  gritDrone: { label: "Grit-Drohne", body: "drone", primary: "#5d5a50", secondary: "#ffd166", emission: "#b8c0c2" },
  oilBarrelBot: { label: "Oelfass-Bot", body: "barrel", primary: "#2a2a24", secondary: "#050505", emission: "#101010" },
  oversprayBot: { label: "Pestizidmaschine", body: "sprayer", primary: "#556b2f", secondary: "#a4e04d", emission: "#a4e04d" },
  nitratePod: { label: "Nitratkapsel", body: "pod", primary: "#607331", secondary: "#d6ff79", emission: "#a4e04d" },
  megaEmitter: { label: "Mega-Emitter", body: "core", primary: "#202735", secondary: "#ff754a", emission: "#ff4d3d" }
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
