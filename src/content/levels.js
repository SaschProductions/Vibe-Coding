export const LEVELS = [
  {
    id: 1,
    name: "Kuestenalarm",
    biome: "Kueste",
    threat: "Smog-Drohnen und Leck-Kanister",
    metricLabel: "Luftqualitaet am Hafen",
    background: {
      sky: "#7cc9d8",
      ground: "#2f8f83",
      accent: "#ffd166"
    },
    targetPollution: 18,
    intro: "Stoppe die ersten Drohnen und lerne, wie Verschmutzung als Timer funktioniert.",
    polluters: [
      { type: "smogDrone", hp: 1, score: 10, pollution: 2, speed: 0.9 },
      { type: "leakCanister", hp: 2, score: 20, pollution: 4, speed: 0.55 }
    ],
    waves: [
      { at: 0, formation: "line", count: 6, polluter: "smogDrone", lane: "top" },
      { at: 8, formation: "vee", count: 5, polluter: "smogDrone", lane: "mid" },
      { at: 16, formation: "stagger", count: 3, polluter: "leakCanister", lane: "mixed" }
    ]
  },
  {
    id: 2,
    name: "Waldbrandlinie",
    biome: "Wald",
    threat: "Abholzungsbots und Aschekapseln",
    metricLabel: "Waldgesundheit",
    background: {
      sky: "#8fd6a5",
      ground: "#236b45",
      accent: "#f4d35e"
    },
    targetPollution: 22,
    intro: "Schuetze die Baumkronen vor unbemannten Schneidemaschinen.",
    polluters: [
      { type: "cutterBot", hp: 1, score: 12, pollution: 3, speed: 1 },
      { type: "ashPod", hp: 2, score: 24, pollution: 5, speed: 0.65 }
    ],
    waves: [
      { at: 0, formation: "arc", count: 7, polluter: "cutterBot", lane: "mid" },
      { at: 9, formation: "columns", count: 6, polluter: "cutterBot", lane: "mixed" },
      { at: 18, formation: "guarded", count: 4, polluter: "ashPod", escort: "cutterBot" }
    ]
  },
  {
    id: 3,
    name: "Korallenriff",
    biome: "Riff",
    threat: "Plastik-Skimmer und Mikroplastik",
    metricLabel: "Riffgesundheit",
    background: {
      sky: "#65c7f7",
      ground: "#147f8a",
      accent: "#ff9f80"
    },
    targetPollution: 26,
    intro: "Halte Plastikschwaerme auf, bevor das Riff erstickt.",
    polluters: [
      { type: "plasticSkimmer", hp: 1, score: 12, pollution: 3, speed: 1.15 },
      { type: "microbin", hp: 1, score: 8, pollution: 2, speed: 1.35 },
      { type: "sludgeFloat", hp: 3, score: 32, pollution: 6, speed: 0.5 }
    ],
    waves: [
      { at: 0, formation: "swarm", count: 8, polluter: "microbin", lane: "top" },
      { at: 7, formation: "line", count: 6, polluter: "plasticSkimmer", lane: "mid" },
      { at: 17, formation: "wall", count: 3, polluter: "sludgeFloat", lane: "mixed" }
    ]
  },
  {
    id: 4,
    name: "Solarfeld",
    biome: "Wuestenzone",
    threat: "Staub-Rigs und Russpanzer",
    metricLabel: "Solarfeld-Leistung",
    background: {
      sky: "#f8c471",
      ground: "#b86f34",
      accent: "#3dd6d0"
    },
    targetPollution: 30,
    intro: "Halte die Solarfelder frei, waehrend Staubmaschinen anruecken.",
    polluters: [
      { type: "dustRig", hp: 2, score: 22, pollution: 4, speed: 0.8 },
      { type: "heatDrone", hp: 1, score: 14, pollution: 3, speed: 1.2 },
      { type: "sootTank", hp: 4, score: 42, pollution: 8, speed: 0.42 }
    ],
    waves: [
      { at: 0, formation: "zigzag", count: 7, polluter: "heatDrone", lane: "mixed" },
      { at: 10, formation: "columns", count: 5, polluter: "dustRig", lane: "mid" },
      { at: 21, formation: "bossGuard", count: 1, polluter: "sootTank", escort: "heatDrone" }
    ]
  },
  {
    id: 5,
    name: "Smog ueber der City",
    biome: "Innenstadt",
    threat: "Abgasautomaten und Muellkisten",
    metricLabel: "Stadtluft",
    background: {
      sky: "#9fb3c8",
      ground: "#4b5563",
      accent: "#7ddf64"
    },
    targetPollution: 34,
    intro: "Schalte die Abgasquellen aus, bevor die Skyline im Smog verschwindet.",
    polluters: [
      { type: "stackBot", hp: 2, score: 24, pollution: 5, speed: 0.75 },
      { type: "smogDrone", hp: 1, score: 10, pollution: 2, speed: 1.25 },
      { type: "wasteCrate", hp: 3, score: 34, pollution: 7, speed: 0.55 }
    ],
    waves: [
      { at: 0, formation: "line", count: 8, polluter: "smogDrone", lane: "top" },
      { at: 9, formation: "block", count: 6, polluter: "stackBot", lane: "mid" },
      { at: 20, formation: "stagger", count: 4, polluter: "wasteCrate", lane: "mixed" }
    ]
  },
  {
    id: 6,
    name: "Gletscherbruch",
    biome: "Arktis",
    threat: "Waerme-Relais und Schmelzkerne",
    metricLabel: "Eisstabilitaet",
    background: {
      sky: "#b8e7f5",
      ground: "#d9f2f2",
      accent: "#5c6bc0"
    },
    targetPollution: 38,
    intro: "Unterbrich die Waerme-Relais, bevor das Eis bricht.",
    polluters: [
      { type: "relayUnit", hp: 2, score: 26, pollution: 5, speed: 0.85 },
      { type: "sparkDrone", hp: 1, score: 14, pollution: 3, speed: 1.35 },
      { type: "meltCore", hp: 4, score: 46, pollution: 9, speed: 0.45 }
    ],
    waves: [
      { at: 0, formation: "paired", count: 8, polluter: "sparkDrone", lane: "mixed" },
      { at: 11, formation: "diamond", count: 5, polluter: "relayUnit", lane: "mid" },
      { at: 24, formation: "coreGuard", count: 1, polluter: "meltCore", escort: "relayUnit" }
    ]
  },
  {
    id: 7,
    name: "Flussgift",
    biome: "Feuchtgebiet",
    threat: "Abfluss-Siphons und Spruehdrohnen",
    metricLabel: "Wasserqualitaet",
    background: {
      sky: "#a0d9b4",
      ground: "#3a7d60",
      accent: "#f7b267"
    },
    targetPollution: 42,
    intro: "Stoppe die Abflussquellen, bevor Gift durch das Marschland zieht.",
    polluters: [
      { type: "runoffSiphon", hp: 3, score: 34, pollution: 7, speed: 0.58 },
      { type: "sprayDrone", hp: 1, score: 16, pollution: 3, speed: 1.4 },
      { type: "foamPod", hp: 2, score: 24, pollution: 5, speed: 0.9 }
    ],
    waves: [
      { at: 0, formation: "swarm", count: 9, polluter: "sprayDrone", lane: "top" },
      { at: 10, formation: "stagger", count: 6, polluter: "foamPod", lane: "mixed" },
      { at: 23, formation: "columns", count: 4, polluter: "runoffSiphon", lane: "mid" }
    ]
  },
  {
    id: 8,
    name: "Bergstrom",
    biome: "Gebirge",
    threat: "Schrott-Turbinen und Oelfass-Bots",
    metricLabel: "Bachreinheit",
    background: {
      sky: "#91c4f2",
      ground: "#5d737e",
      accent: "#c3f73a"
    },
    targetPollution: 46,
    intro: "Sichere den Pass, damit klares Schmelzwasser das Tal erreicht.",
    polluters: [
      { type: "scrapTurbine", hp: 3, score: 36, pollution: 7, speed: 0.7 },
      { type: "gritDrone", hp: 1, score: 16, pollution: 3, speed: 1.45 },
      { type: "oilBarrelBot", hp: 4, score: 50, pollution: 10, speed: 0.5 }
    ],
    waves: [
      { at: 0, formation: "zigzag", count: 8, polluter: "gritDrone", lane: "mixed" },
      { at: 12, formation: "arc", count: 5, polluter: "scrapTurbine", lane: "mid" },
      { at: 26, formation: "guarded", count: 2, polluter: "oilBarrelBot", escort: "gritDrone" }
    ]
  },
  {
    id: 9,
    name: "Wiesensterben",
    biome: "Wiesen",
    threat: "Pestizidmaschinen und Nitratkapseln",
    metricLabel: "Bodenleben",
    background: {
      sky: "#f4e285",
      ground: "#6a994e",
      accent: "#386641"
    },
    targetPollution: 50,
    intro: "Verteidige Felder und Bluetenstreifen vor unkontrollierten Spruehmaschinen.",
    polluters: [
      { type: "oversprayBot", hp: 2, score: 28, pollution: 6, speed: 1 },
      { type: "nitratePod", hp: 3, score: 38, pollution: 8, speed: 0.72 },
      { type: "dustRig", hp: 2, score: 22, pollution: 4, speed: 1.1 }
    ],
    waves: [
      { at: 0, formation: "rows", count: 8, polluter: "oversprayBot", lane: "mid" },
      { at: 11, formation: "columns", count: 6, polluter: "dustRig", lane: "mixed" },
      { at: 25, formation: "stagger", count: 4, polluter: "nitratePod", lane: "mixed" }
    ]
  },
  {
    id: 10,
    name: "Tanker-Havarie",
    biome: "Metro-Zentrale",
    threat: "Oel-Tanker mit Begleitflotte",
    metricLabel: "Regionale Stabilitaet",
    background: {
      sky: "#6ec6ca",
      ground: "#394867",
      accent: "#ffcc4d"
    },
    targetPollution: 56,
    intro: "Der finale Tanker verliert Oel und laesst Begleitschiffe die Region abschirmen.",
    polluters: [
      { type: "smogDrone", hp: 1, score: 12, pollution: 3, speed: 1.45 },
      { type: "stackBot", hp: 2, score: 26, pollution: 5, speed: 1 },
      { type: "megaEmitter", hp: 6, score: 80, pollution: 14, speed: 0.38 }
    ],
    waves: [
      { at: 0, formation: "swarm", count: 10, polluter: "smogDrone", lane: "top" },
      { at: 10, formation: "block", count: 8, polluter: "stackBot", lane: "mid" },
      { at: 23, formation: "mixedWall", count: 10, polluter: "smogDrone", support: "stackBot" },
      { at: 38, formation: "finalCore", count: 1, polluter: "megaEmitter", escort: "stackBot" }
    ]
  }
];
