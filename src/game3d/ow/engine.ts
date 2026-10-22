import { COMBAT_PERSONALITIES, type CombatPersonalityId } from "./combatPersonalities";
import { WATER_STYLES, WATER_MOTIONS, unlockedWaterForms, waterArcPoints, type WaterSwordsman } from "./waterBreathing";
import * as THREE from "three";
import { buildWorld, terrainHeight, zoneAt, WORLD_HALF, ZONE_BY_ID, type OWWorld } from "./world";
import { BREAK_NODES, FOLLOWERS, LOOKS, MISSIONS, NPCS, PLAYER_START, SABURO_DOOR, stepTarget, type FollowerDef, type NpcDef, type Spawn, type Step } from "./campaign";
import { animateHumanoid, setTrainingPhysique, buildCrow, buildDemon, buildHumanoid, makeLabel, makeMarker, type Humanoid, type Look } from "./characters";
import { findNodeById } from "@/lib/storyData";
import { DEMONS } from "@/lib/game/data";
import { buildCabin, type Cabin } from "./cabin";
import { SAGIRI_STATIONS, ROCK_TRAINING, trainingStation, stationMechanic, withinWindow, beatIsClean, threadIsOpen } from "./training";
import { ENCOUNTERS, SKIPPABLE_CINEMATICS, type EncounterDef, type WordWindow, type FighterId } from "./encounters";
import { PROLOGUE, PROLOGUE_VERSION, STORM_WALL, IMPORTANT_NODES, CABIN_ENTRY, CABIN_WAKE, CABIN_FLOOR, CABIN_SPOTS, FALL_LANDING, SLOPE_EDGE, cabinSpot, canUseSword, hunterStatus, freshRefuge, normalizeSave, type RefugeState, type OWSave } from "./prologue";
export type { OWSave } from "./prologue";
export type TransitionKind = "fall" | "enter" | "sleep" | "exit";

export type DialogueView = {
  key: string;
  speaker: string;
  title?: string;
  color: string;
  portrait: string;
  text: string;
  index: number;
  total: number;
  choices: string[] | null;
  origin: string;
};

export type OWHud = {
  hp: number;
  maxHp: number;
  breath: number;
  maxBreath: number;
  rank: number;
  zone: string;
  missionIndex: number;
  missionTotal: number;
  missionTitle: string;
  missionBriefing: string;
  missionCombat: boolean;
  steps: { label: string; done: boolean; current: boolean }[];
  stepLabel: string;
  kills: { done: number; total: number } | null;
  boss: { name: string; title: string; hp: number; maxHp: number } | null;
  target: { dist: number; angle: number } | null;
  targetPos: { x: number; z: number } | null;
  player: { x: number; z: number; yaw: number; cameraYaw: number };
  prompt: string | null;
  dialogue: DialogueView | null;
  finished: boolean;
  hitFlash: number;
  blizzard: number;
  snowfall: number;
  interior: boolean;
  canFight: boolean;
  practiceSword: boolean;
  status: string;
  clock: string;
  morning: boolean;
  sleepPrompt: boolean;
  important: boolean;
  pointerLocked: boolean;
  actors: string[];
  transition: { kind: TransitionKind; opacity: number; progress: number } | null;
  skippable: boolean;
  sideQuest: { level: number; xp: number; nextXp: number; active: string | null; available: { id: string; name: string; giver: string; detail: string; requiredLevel: number; done: boolean }[]; unlocked: string[] } | null;
  encounter: EncounterView | null;
  training: TrainingView | null;
  cinematicBanner: string | null;
  basketVisible: boolean;
  sleepingNpcVisible: boolean;
  nezukoFollowing: boolean;
  cinematicNezukoVisible: boolean;
  cinematicSealVisible: boolean;
};

export type EncounterView = {
  id: string; name: string; title: string; color: string;
  hp: number; maxHp: number; meter: number; goal: number; meterLabel: string;
  enemyHp: number | null; enemyMaxHp: number | null;
  canAttack: boolean; hint: string;
  telegraph: number; lunging: boolean; perfect: number; holding: boolean; parry: number;
  focus: number; maxFocus: number; guard: number; guardMax: number; guardCharged: boolean;
  flash: "perfect" | "parry" | "break" | "hit" | "counter" | null;
  vulnerable: boolean;
  playerName: string; fighter: FighterId; tagReady: boolean; tagCd: number; chosen: boolean; tanjiroHp: number;
  comboStep: number; comboNames: string[]; lastMove: string | null; envReady: boolean; envLabel: string;
  words: { prompt: string; options: { text: string; tone: string }[]; timeLeft: number; total: number } | null;
  reply: string | null; dead: boolean; won: boolean;
};

export type TrainingView = {
  kind: "descent" | "boulder";
  label: string;
  progress: number;
  timeLeft: number | null;
  hits: number;
  hitsNeeded: number;
  hp: number;
  maxHp: number;
  breath: number;
  message: string | null;
  done: boolean;
  failed: boolean;
  station: number;
  stationName: string;
  stationTask: string;
  stationKey: string;
  stationCount: number;
  stationRequired: number;
  stationDistance: number;
  hazardTelegraph: number;
  hazardMax: number;
  agileFlash: number;
  agileCount: number;
  rockPhase: number;
  rockCharge: number;
  rockResistance: number;
  rockParries: number;
  rockCombo: number;
  rockComboTime: number;
  waveTelegraph: number;
  threadTime: number;
  focusHeld: boolean;
  focusTime: number; focusReady: boolean; agileReady: boolean;
  marker: number;
  zoneStart: number;
  zoneEnd: number;
};

export type OWEvent = "mission" | "missionDone" | "victory" | "toast" | "save" | "pause" | "resume";

type Enemy = {
  group: THREE.Group;
  mat: THREE.MeshStandardMaterial;
  pos: THREE.Vector3;
  hp: number;
  maxHp: number;
  boss: boolean;
  name: string;
  title: string;
  style: Spawn["style"];
  scale: number;
  t: number;
  flash: number;
  shoot: number;
  rushCd: number;
  rushT: number;
  rushDir: THREE.Vector3;
  dead: boolean;
};

type NpcObj = { def: NpcDef; group: THREE.Group; human: Humanoid | null; label: THREE.Sprite; marker: THREE.Sprite; t: number };
type Follower = { def: FollowerDef; human: Humanoid; pos: THREE.Vector3; yaw: number; phase: number; label: THREE.Sprite };
type Shot = { mesh: THREE.Mesh; vel: THREE.Vector3; life: number };

type DState =
  | { kind: "node"; nodeId: string; para: number; origin: string; onDone: () => void }
  | { kind: "plain"; speaker: string; portrait: string; color: string; lines: string[]; para: number; origin: string; onDone: () => void };

const HALF = 0.85;
const RADIUS = 0.38;
const KEYMAP: Record<string, string> = {
  KeyW: "fwd", ArrowUp: "fwd", KeyS: "back", ArrowDown: "back", KeyA: "left", ArrowLeft: "left", KeyD: "right", ArrowRight: "right",
  Space: "jump", ShiftLeft: "sprint", ShiftRight: "sprint", KeyJ: "attack", KeyG: "attack", KeyK: "dash", KeyL: "dash", KeyX: "dash",
  KeyB: "breathe", KeyE: "interact", KeyQ: "camL", KeyR: "camR", Escape: "pause", KeyP: "pause", KeyF: "guard", KeyV: "guard", Tab: "tag", KeyC: "tag",
};

export class OpenWorldGame {
  private renderer: THREE.WebGLRenderer;
  private cinematicKeyLight = new THREE.PointLight(0xffe7c7, 0, 13, 2);
  private cinematicFillLight = new THREE.PointLight(0x8ccfff, 0, 10, 2);
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private world: OWWorld;
  private clock = new THREE.Clock();
  private raf = 0;

  private player!: Humanoid;
  private pos = new THREE.Vector3();
  private vel = new THREE.Vector3();
  private yaw = PLAYER_START.yaw;
  private grounded = true;
  private usedDouble = false;
  private jumpBuf = 0;
  private coyote = 0;
  private dashT = 0;
  private dashCd = 0;
  private atkCd = 0;
  private slashT = 0;
  private iFrames = 0;
  private runPhase = 0;
  private hp = 6;
  private breath = 100;
  private hitFlash = 0;

  private camYaw = 0;
  private camPitch = 0.16;
  private dragging = false;
  private dragIdle = 10;
  private lastPointer = { x: 0, y: 0 };
  private shake = 0;

  private npcs: NpcObj[] = [];
  private followers: Follower[] = [];
  private enemies: Enemy[] = [];
  private shots: Shot[] = [];
  private arcs: { mesh: THREE.Mesh; life: number; yaw: number }[] = [];
  private beam: THREE.Mesh;

  private pGeo = new THREE.BufferGeometry();
  private pPos = new Float32Array(500 * 3);
  private pVel = new Float32Array(500 * 3);
  private pCol = new Float32Array(500 * 3);
  private pLife = new Float32Array(500);
  private pHead = 0;

  private keys = new Set<string>();
  private touch = { x: 0, y: 0, sprint: false };
  private audio: AudioContext | null = null;

  // Calendario narrativo independiente del reloj del equipo.
  // El tiempo avanza con la exploración y con las elipsis de entrenamiento.
  private sideQuestDone: string[] = [];
  private sideQuestActive: string | null = null;
  private playerXp = 0;
  private sideQuestDefs = [
    { id: "urokodaki_observar", name: "Leer el terreno", giver: "Urokodaki", detail: "Observa el terreno y completa una estación de entrenamiento.", requiredLevel: 1, xp: 65 },
    { id: "makomo_precision", name: "Paciencia y precisión", giver: "Makomo", detail: "Completa una estación de entrenamiento sin abandonar la práctica.", requiredLevel: 2, xp: 90 },
    { id: "sabito_disciplina", name: "Disciplina de acero", giver: "Sabito", detail: "Supera una estación de nivel superior y demuestra constancia.", requiredLevel: 3, xp: 120 },
  ];
  private playerLevel() { return 1 + Math.floor(this.playerXp / 100); }
  /** Encargos secundarios: no reemplazan la misión principal ni saltan la historia. */
  selectSideQuest(id: string) {
    if (this.missionIdx !== 1 || this.enc || this.dialogue || this.trn || this.transition) return;
    const quest = this.sideQuestDefs.find(q => q.id === id);
    if (!quest || this.sideQuestDone.includes(id) || this.playerLevel() < quest.requiredLevel) return;
    this.sideQuestActive = id;
    this.onEvent("toast", `${quest.giver}: ${quest.detail}`);
    this.pushHud();
  }
  private completeSideQuest(station: number) {
    const q = this.sideQuestDefs.find(q => q.id === this.sideQuestActive);
    if (!q || (q.id === "sabito_disciplina" && station < 5)) return;
    this.playerXp += Math.round(q.xp * this.nezukoMultiplier("learning"));
    this.sideQuestDone.push(q.id);
    this.sideQuestActive = null;
    const unlocked = this.playerLevel() >= 3 ? " · Desbloqueado: entrenamiento avanzado de concentración" : "";
    this.onEvent("toast", `Encargo de ${q.giver} completado · +${q.xp} XP · Nivel ${this.playerLevel()}${unlocked}`);
  }
  // La visita es opcional y solo se resuelve una vez por día de entrenamiento.
  private nezukoLastVisitDay = 0;
  private nezukoAwakeVisits = 0;
  private nezukoBuff: { kind: "speed" | "learning" | "strength"; remaining: number; magnitude: number } | null = null;
  private nezukoMultiplier(kind: "speed" | "learning" | "strength") {
    return this.nezukoBuff?.kind === kind && this.nezukoBuff.remaining > 0 ? this.nezukoBuff.magnitude : 1;
  }
  // Los despertares, no los días, determinan cuánto entiende Nezuko de su situación.
  private nezukoAwarenessStage() {
    const n = this.nezukoAwakeVisits;
    return n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : n <= 9 ? 4 : 5;
  }
  private nezukoAwakeningLines() {
    const n = this.nezukoAwakeVisits;
    if (n === 1) return [
      "Nezuko despierta sobresaltada. Al verte, se tranquiliza un poco, aunque observa la habitación sin reconocerla.",
      "Le explicas despacio que está a salvo en casa de Urokodaki, que Tanjiro sigue con vida y que algo terrible sucedió aquella noche.",
      "Intenta responder, pero el bambú se lo impide. Te toma la mano y permanece a tu lado, todavía desorientada."
    ];
    if (n <= 3) return [
      "Nezuko vuelve a despertar. Esta vez reconoce tu voz antes de abrir completamente los ojos.",
      "Le recuerdas dónde está y por qué lleva bambú. Se toca la boca, observa sus manos y te abraza buscando seguridad.",
      "No comprende todo todavía, pero empieza a relacionar tus explicaciones con su nuevo cuerpo."
    ];
    if (n <= 6) return [
      "Nezuko te recibe con un gesto familiar. Reconoce la habitación y señala la puerta cuando mencionas a Tanjiro.",
      "Le cuentas cómo avanzan los entrenamientos. Ella responde con gestos sencillos y escucha atentamente cuando hablas de aquella noche.",
      "Aunque todavía se confunde con algunos recuerdos, empieza a orientarse sin que debas explicarle todo desde cero."
    ];
    if (n <= 9) return [
      "Nezuko ya se mueve con mayor seguridad en la habitación y parece entender mejor sus sentidos y sus límites.",
      "Cuando le hablas del entrenamiento, aprieta tu mano con determinación. Sabe que tú y Tanjiro estáis intentando ayudarla.",
      "Te abraza por iniciativa propia. Su silencio no significa que haya dejado de comprenderte."
    ];
    return [
      "Nezuko despierta y te reconoce inmediatamente. Busca tu mano y te invita a sentarte junto a ella.",
      "Por sus gestos comprendes que recuerda dónde está, qué le ocurrió y por qué seguís entrenando. Ya no necesita la explicación de las primeras visitas.",
      "Se acurruca a tu lado. Está más orientada y serena, pero sigue siendo un demonio; nada de esto significa que se haya curado."
    ];
  }
  private visitNezuko() {
    if (this.nezukoLastVisitDay === this.trainingDay) {
      this.playLines("Nezuko Kamado", "🌸", ["Ya has pasado un rato con Nezuko hoy. La dejas descansar y prometes regresar otro día."], this.trainingDateLabel());
      return;
    }
    this.nezukoLastVisitDay = this.trainingDay;
    // La visita no garantiza recompensa: un 35 % de posibilidades de encontrarla despierta.
    const awake = Math.random() < 0.35;
    if (!awake) {
      this.playLines("Nezuko Kamado", "🌸", ["Nezuko duerme profundamente, protegida de la luz. Te sientas a su lado y le acaricias el cabello con cuidado.", "No responde, pero su respiración tranquila te recuerda por qué sigues entrenando."], this.trainingDateLabel());
    } else {
      this.nezukoAwakeVisits++;
      const kinds = ["speed", "learning", "strength"] as const;
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const magnitude = kind === "learning" ? [1.15, 1.20, 1.25][Math.floor(Math.random() * 3)] : kind === "speed" ? 1.15 : 1.12;
      this.nezukoBuff = { kind, magnitude, remaining: 3 };
      const benefit = kind === "learning" ? `+${Math.round((magnitude - 1) * 100)} % de experiencia` : kind === "speed" ? "+15 % de velocidad" : "+12 % de fuerza";
      this.playLines("Nezuko Kamado", "🌸", [...this.nezukoAwakeningLines(), `Despertar ${this.nezukoAwakeVisits} · Adaptación ${this.nezukoAwarenessStage()}/5. Ánimo de Nezuko: ${benefit} durante los próximos tres ejercicios completados. Si llegas a la Selección Final con el efecto activo, también te acompañará allí.`], this.trainingDateLabel());
      this.onEvent("toast", `🌸 Ánimo de Nezuko · ${benefit} · 3 entrenamientos`);
    }
    this.onEvent("save");
  }
  private consumeNezukoTraining() {
    if (!this.nezukoBuff) return;
    this.nezukoBuff.remaining = Math.max(0, this.nezukoBuff.remaining - 1);
    if (this.nezukoBuff.remaining === 0) {
      this.nezukoBuff = null;
      this.onEvent("toast", "🌸 El impulso de la visita se desvanece; el recuerdo permanece.");
    }
  }
  private trainingDay = 1;
  private trainingHour = 7;
  private trainingClockSeconds = 0;
  // Los compañeros tienen destinos propios durante la etapa de Sagiri.
  private independentTrainingActive() {
    return this.missionIdx === 1 && this.stepIdx >= 2 && this.stepIdx <= 5 && !this.indoors() && !this.enc && !this.transition;
  }
  private practiceShift() {
    const hour = this.trainingHour;
    return hour < 6 || hour >= 20 ? "rest" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  }
  private practiceAnchor(who: "tanjiro" | "makomo") {
    const base = NPCS.find(n => n.id === "makomo");
    const x = base?.x ?? 0, z = base?.z ?? 0;
    const shift = this.practiceShift();
    // La ubicación es estable dentro de cada franja: se puede encontrar a los compañeros.
    if (who === "tanjiro") {
      if (shift === "morning") return { x: x + 11, z: z + 6, action: "cortes" };
      if (shift === "afternoon") return { x: x - 9, z: z + 11, action: "resistencia" };
      if (shift === "evening") return { x: x + 4, z: z - 9, action: "respiración" };
      return { x: x + 3, z: z - 5, action: "descanso" };
    }
    if (shift === "morning") return { x: x - 8, z: z + 5, action: "equilibrio" };
    if (shift === "afternoon") return { x: x + 8, z: z + 10, action: "precisión" };
    if (shift === "evening") return { x: x - 5, z: z - 7, action: "estiramientos" };
    return { x, z, action: "descanso" };
  }

  private trainingDateLabel() {
    const month = Math.floor((this.trainingDay - 1) / 30) + 1;
    const day = (this.trainingDay - 1) % 30 + 1;
    const period = this.trainingHour < 6 ? "madrugada" : this.trainingHour < 12 ? "mañana" : this.trainingHour < 18 ? "tarde" : "noche";
    return `Mes ${month} · día ${day} · ${period}`;
  }
  private advanceTrainingDays(days: number) {
    this.trainingDay = Math.min(900, this.trainingDay + days);
    this.trainingHour = 7;
    this.trainingClockSeconds = 0;
    this.updateTrainingPhysiques();
    this.onEvent("toast", `✦ ${this.trainingDateLabel()} · Tras ${days} días de práctica y descanso, continúa el entrenamiento.`);
  }
  // La transformación es visual y gradual: el nivel 15 recupera la corpulencia original.
  // El tiempo influye, pero nunca sustituye el esfuerzo de completar las estaciones.
  private trainingPhysiqueProgress() {
    const completed = this.trn?.kind === "descent" ? this.trn.station :
      this.missionIdx > 1 ? 15 : this.missionIdx === 1 && this.stepIdx >= 6 ? 15 : 0;
    const levels = THREE.MathUtils.clamp(completed / 15, 0, 1);
    const days = THREE.MathUtils.clamp((this.trainingDay - 1) / 90, 0, 1);
    return levels >= 1 ? 1 : Math.min(0.97, levels * 0.85 + days * 0.15);
  }
  private updateTrainingPhysiques() {
    const progress = this.trainingPhysiqueProgress();
    setTrainingPhysique(this.player, progress);
    const tanjiro = this.followers.find(f => f.def.id === "f_tanjiro");
    if (tanjiro) setTrainingPhysique(tanjiro.human, progress);
    const atHome = this.npcs.find(n => n.def.id === "tanjiro_home");
    if (atHome?.human) setTrainingPhysique(atHome.human, progress);
  }
  private missionIdx = 0;
  private stepIdx = 0;
  private queued: string | null = null;
  private visited: string[] = [];
  private introPlayed = false;
  private spawned = false;
  private cleared = false;
  private safe = new THREE.Vector3();
  private finished = false;
  private dialogue: DState | null = null;
  private name = { first: "Ren", last: "Shinjo" };
  private zoneId = "";

  private started = false;
  private paused = false;
  private blocked = false;
  private hudT = 0;
  private blizzard = 0;
  private blizzardWarned = false;
  private snowPos = new Float32Array(1600 * 3);
  private snowGeo = new THREE.BufferGeometry();
  private snowPts!: THREE.Points;
  private windGain: GainNode | null = null;
  private windSrc: AudioBufferSourceNode | null = null;
  private refuge: RefugeState = freshRefuge();
  private cabin: Cabin | null = null;
  private transition: { kind: TransitionKind; time: number; switched: boolean; from: THREE.Vector3 } | null = null;
  private sleepPrompt = false;
  private snowfall = 0.78;
  private simulationTime = 0;
  private generation = 0;
  private disposed = false;
  private baseHaori: THREE.Material | null = null;
  private baseTanjiroHaori: THREE.Material | null = null;
  private hold = false;
  private fall: { bodies: { pos: THREE.Vector3; vel: THREE.Vector3; spin: THREE.Vector3; rot: THREE.Euler; rest: number; bounces: number }[]; t: number; settled: boolean; standAt: number } | null = null;
  private pointerLocked = false;
  private camDist = 7.4;
  private wallWarned = false;
  private wallStrength = 0;
  private enc: {
    def: EncounterDef; human: Humanoid; pos: THREE.Vector3; yaw: number; phase: number;
    hp: number; meter: number; enemyHp: number;
    nextAttack: number; telegraph: number; lunging: number; lungeDir: THREE.Vector3; recover: number;
    attacks: number; windowIdx: number; words: { win: WordWindow; timeLeft: number } | null; reply: string | null; replyT: number;
    perfect: number; dead: boolean; won: boolean; endT: number; hitCd: number; slow: number;
    center: THREE.Vector3; radius: number;
    focus: number; guard: number; holding: boolean; guarding: number; broken: number;
    invuln: number; parry: number; counter: number; flash: "perfect" | "parry" | "break" | "hit" | "counter" | null; flashT: number;
    combo?: number; comboReadyAt?: number; chainUntil?: number; envCd?: number; envIdx?: number;
    aiStyle: CombatPersonalityId; aiStrafe: number; aiDecision: number; aiEvade: number; aiFeint: number;
    fighter: FighterId; tagCd: number; tanjiroHp: number; chosen: boolean; lastMove: string | null; lastMoveT: number;
  } | null = null;
  private trn: {
    kind: "descent" | "boulder";
    t: number; timeLeft: number; hp: number; hits: number; message: string | null; msgT: number;
    done: boolean; failed: boolean; endT: number; top: THREE.Vector3;
    traps: { mesh: THREE.Mesh; x: number; z: number; phase: number; dir: THREE.Vector3; cd: number }[];
    boulder: THREE.Mesh | null; marker: number; markerDir: number; zoneStart: number; zoneEnd: number; swingT: number;
    agileCd: number; agileFlash: number; agileCount: number; hitCd: number; nextCheer: number;
    focusTime: number; focusCd: number; focusHeld: boolean;
    markers: THREE.Group[]; rockPieces: THREE.Mesh[]; stationModels: THREE.Object3D[]; waveMesh: THREE.Mesh | null; threadMesh: THREE.Line | null;
    station: number; stationHits: number; stationTimer: number; stationTelegraph: number; stationTelegraphMax: number; stationCombo: number; stationComboTime: number; stationComboReadyAt: number; stationEnvUsed: boolean; stationNear: boolean;
    rockPhase: 0 | 1 | 2; rockCharge: number; rockResistance: number; rockParries: number; waveTimer: number; waveTelegraph: number; rockCombo: number; rockComboTime: number; threadTime: number; threadEAt: number; rockHitReadyAt: number;
  } | null = null;
  private actors: { id: string; human: Humanoid; from: THREE.Vector3; to: THREE.Vector3; t: number; dur: number; phase: number }[] = [];
  private sagiriShelter: THREE.Group | null = null;
  private bambooStage = -1;
  private practiceSwordMaterial = new THREE.MeshStandardMaterial({ color: "#a27643", roughness: 0.96 });
  private playerBladeMaterial: THREE.Material | null = null;
  private tanjiroBladeMaterial: THREE.Material | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private onHud: (s: OWHud) => void,
    private onEvent: (e: OWEvent, payload?: string) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1200);
    this.scene.fog = new THREE.FogExp2("#0d1428", 0.0085);

    this.world = buildWorld(this.scene);
    this.scene.add(this.cinematicKeyLight, this.cinematicFillLight);

    this.player = buildHumanoid(LOOKS.player);
    this.scene.add(this.player.group);
    this.pos.set(PLAYER_START.x, terrainHeight(PLAYER_START.x, PLAYER_START.z) + HALF, PLAYER_START.z);
    this.safe.copy(this.pos);
    this.camYaw = this.yaw + Math.PI;

    for (const def of NPCS) this.npcs.push(this.makeNpc(def));
    this.sagiriShelter = this.makeSagiriShelter();
    for (const def of FOLLOWERS) {
      const human = buildHumanoid(def.look);
      const label = makeLabel(def.name, "#ffd3e6");
      label.position.y = 2.35;
      human.group.add(label);
      this.scene.add(human.group);
      const fp = this.pos.clone();
      this.followers.push({ def, human, pos: fp, yaw: this.yaw, phase: Math.random() * 6, label });
    }

    this.updateTrainingPhysiques();

    this.beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 70, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: "#ffd76a", transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.scene.add(this.beam);

    for (let i = 0; i < 500; i++) this.pPos[i * 3 + 1] = -9999;
    this.pGeo.setAttribute("position", new THREE.BufferAttribute(this.pPos, 3));
    this.pGeo.setAttribute("color", new THREE.BufferAttribute(this.pCol, 3));
    const pts = new THREE.Points(this.pGeo, new THREE.PointsMaterial({ size: 0.26, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.frustumCulled = false;
    this.scene.add(pts);

    for (let i = 0; i < this.snowPos.length / 3; i++) {
      this.snowPos[i * 3] = (Math.random() - 0.5) * 40;
      this.snowPos[i * 3 + 1] = Math.random() * 18;
      this.snowPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    this.snowGeo.setAttribute("position", new THREE.BufferAttribute(this.snowPos, 3));
    const flakeCanvas = document.createElement("canvas");
    flakeCanvas.width = flakeCanvas.height = 32;
    const flakeContext = flakeCanvas.getContext("2d")!;
    const soft = flakeContext.createRadialGradient(16, 16, 0, 16, 16, 15);
    soft.addColorStop(0, "rgba(255,255,255,1)");
    soft.addColorStop(0.35, "rgba(240,248,255,0.9)");
    soft.addColorStop(1, "rgba(240,248,255,0)");
    flakeContext.fillStyle = soft;
    flakeContext.fillRect(0, 0, 32, 32);
    this.snowPts = new THREE.Points(
      this.snowGeo,
      new THREE.PointsMaterial({ color: "#eef6ff", map: new THREE.CanvasTexture(flakeCanvas), size: 0.2, transparent: true, opacity: 0, depthWrite: false }),
    );
    this.snowPts.frustumCulled = false;
    this.snowPts.visible = false;
    this.scene.add(this.snowPts);

    this.player.group.position.set(this.pos.x, this.pos.y - HALF, this.pos.z);
    this.player.group.rotation.y = this.yaw;
    this.refreshCast();
    this.bindInput();
    this.resize();
    window.addEventListener("resize", this.resize);
    this.loop();
  }

  /* =========================== API pública =========================== */

  setName(first: string, last: string) {
    this.name = { first, last };
  }

  start(fresh: boolean) {
    this.ensureAudio();
    this.started = true;
    this.paused = false;
    if (fresh) this.onEvent("mission");
  }

  /** Punto de entrada de pruebas: prepara cada fase sin alterar el resto de la campaña. */
  skipToUrokodakiTraining(stepIndex = 0) {
    const selected = [0, 2, 3, 4, 5].includes(stepIndex) ? stepIndex : 0;
    const prologue = ["p0_1", "p0_2", "p0_slope", "p0_3b", "p0_sleep", "p0_morning", "p0_3", "p0_4", "p0_4_calm", "p0_5_arrive", "p0_5_stand", "p0_5"];
    const previous = selected >= 2 ? ["c1_1", "c1_nezuko_care"] : [];
    if (selected >= 3) previous.push("c1_descent_done");
    if (selected >= 4) previous.push("c1_makomo_support", "c1_makomo_motivated");
    if (selected >= 5) previous.push("c1_sabito", "c1_sabito_win");

    this.generation++;
    this.clearInput();
    this.dialogue = null;
    this.transition = null;
    this.fall = null;
    this.sleepPrompt = false;
    this.queued = null;
    this.clearEnemies();
    this.endEncounter();
    this.endTraining();
    this.clearActors();
    this.missionIdx = 1;
    this.stepIdx = selected;
    this.visited = [...new Set([...prologue, ...previous])];
    this.refuge = { location: "outdoors", fallen: true, slept: true };
    this.introPlayed = false;
    this.finished = false;
    this.blocked = false;
    this.paused = false;
    this.hold = false;
    this.zoneId = "sagiri";
    this.world.setMorning(selected >= 2 && selected <= 4);
    this.snowfall = this.blizzard = 0;
    this.snowPts.visible = false;
    this.scene.add(this.player.group);
    const sag = ZONE_BY_ID.sagiri;
    const spots: Record<number, [number, number]> = {
      0: [sag.x + 4, sag.z + 5.2],
      2: [sag.x - 2, sag.z + 0.3],
      3: [sag.x - 5, sag.z + 8.6],
      4: [sag.x + 8, sag.z + 10],
      5: [sag.x + 12, sag.z - 4.5],
    };
    const [x, z] = spots[selected];
    this.pos.set(x, terrainHeight(x, z) + HALF, z);
    this.safe.copy(this.pos);
    this.vel.set(0, 0, 0);
    this.grounded = true;
    this.hp = this.maxHp();
    this.breath = 100;
    this.iFrames = 1;
    this.yaw = 0;
    this.camYaw = Math.PI;
    this.player.group.position.set(this.pos.x, this.pos.y - HALF, this.pos.z);
    this.player.group.rotation.y = this.yaw;
    this.player.body.visible = true;
    for (const follower of this.followers) follower.pos.copy(this.pos);
    this.refreshCast();
    this.started = true;
    this.onEvent("toast", `⚡ DEV · ${MISSIONS[1].steps[selected].label}`);
    this.pushHud();
    this.onEvent("save");
  }

  /** Congela la partida mientras la interfaz pide volver a pantalla completa. */
  setHold(on: boolean) {
    if (this.hold === on) return;
    this.hold = on;
    if (on) { this.clearInput(); this.exitLook(); }
    this.updateWindAudio();
    this.pushHud();
  }

  /** Captura el puntero para mirar con el ratón sin mantener pulsado. */
  requestLook() {
    if (!this.started || this.paused || this.hold || this.blocked || this.dialogue || this.transition || this.sleepPrompt) return;
    if (this.indoors() || this.pointerLocked) return;
    this.canvas.requestPointerLock?.();
  }

  exitLook() {
    if (typeof document !== "undefined" && document.pointerLockElement === this.canvas) document.exitPointerLock?.();
  }

  setOverlay(on: boolean) {
    this.blocked = on;
    if (on) { this.clearInput(); this.exitLook(); }
  }

  togglePause() {
    if (!this.started || this.transition || this.sleepPrompt) return;
    this.paused = !this.paused;
    if (this.paused) { this.clearInput(); this.exitLook(); }
    this.updateWindAudio();
    this.onEvent(this.paused ? "pause" : "resume");
  }

  setTouch(input: Partial<{ x: number; y: number; sprint: boolean; jump: boolean; attack: boolean; dash: boolean; interact: boolean }>) {
    if (this.transition || this.sleepPrompt || this.blocked || this.paused || this.dialogue) return;
    if (input.x !== undefined) this.touch.x = input.x;
    if (input.y !== undefined) this.touch.y = input.y;
    if (input.sprint !== undefined) this.touch.sprint = input.sprint;
    if (input.jump) this.jumpBuf = 0.14;
    if (input.attack) this.attack();
    if (input.dash) this.dash();
    if (input.interact) this.interact();
  }

  advance() {
    if (this.paused || this.transition || this.blocked) return;
    const d = this.dialogue;
    if (!d) return;
    if (d.kind === "plain") {
      if (d.para < d.lines.length - 1) d.para++;
      else this.closeDialogue(d.onDone);
      this.pushHud();
      return;
    }
    const node = findNodeById(d.nodeId)?.node;
    if (!node) {
      this.closeDialogue(d.onDone);
      return;
    }
    if (d.para < node.paragraphs.length - 1) {
      d.para++;
      if (d.nodeId === "p0_5") this.updateBambooCinematic(d.para);
    } else if (node.choices && node.choices.length) {
      return;
    } else {
      this.goNext(node.nextNodeId);
    }
    this.pushHud();
  }

  /** Salta el texto hasta la siguiente decisión o hasta el final de la escena. */
  skipDialogue() {
    if (this.paused || this.transition || this.blocked) return;
    for (let i = 0; i < 40 && this.dialogue; i++) {
      const d = this.dialogue;
      if (d.kind === "plain") { this.closeDialogue(d.onDone); break; }
      const node = findNodeById(d.nodeId)?.node;
      if (!node) { this.closeDialogue(d.onDone); break; }
      if (node.choices && node.choices.length) {
        d.para = node.paragraphs.length - 1;
        if (d.nodeId === "p0_5") this.updateBambooCinematic(d.para);
        break;
      }
      d.para = node.paragraphs.length - 1;
      if (d.nodeId === "p0_5") this.updateBambooCinematic(d.para);
      this.goNext(node.nextNodeId);
    }
    this.pushHud();
  }

  /** Elección durante una ventana de diálogo en combate. */
  speak(i: number) {
    const e = this.enc;
    if (!e || e.dead || e.won) return;
    // -20 / -21: selección inicial de personaje (protagonista / Tanjiro).
    if (i === -20 || i === -21) {
      e.chosen = true;
      this.setFighter(i === -21 ? "tanjiro" : "player", true);
      this.pushHud();
      return;
    }
    // -10: Golpe de combo estilo Sparking Zero (suma progreso real incluso contra Nezuko/Giyu).
    if (i === -10) {
      // Enfriamiento y ventana de encadenado medidos con reloj real: el ritmo no depende de los fotogramas.
      const now = performance.now();
      if (e.words || e.broken > 0 || now < (e.comboReadyAt ?? 0)) return;
      if ((e.combo ?? 0) > 0 && now > (e.chainUntil ?? 0)) e.combo = 0;
      const chain = e.def.comboChainNames;
      const step = (e.combo ?? 0) % chain.length;
      const move = chain[step];
      const waterUser: WaterSwordsman = e.fighter === "tanjiro" ? "tanjiro" : "player";
      const trainingStations = this.trn?.kind === "descent" ? this.trn.station : Math.min(15, Math.floor(this.companionTraining.player));
      const playerForms = unlockedWaterForms(trainingStations, this.trainingDay - 1);
      const tanjiroForms = unlockedWaterForms(Math.floor(this.companionTraining.tanjiro / 1.5), this.trainingDay - 1);
      const availableForms = waterUser === "tanjiro" ? tanjiroForms : playerForms;
      const formIndex = step % availableForms;
      const water = WATER_STYLES[waterUser].techniques[formIndex];
      const learnedWater = e.def.id === "sabito";
      if (e.focus < (learnedWater ? water.cost : move.focusCost)) { e.reply = "Sin aliento para encadenar. Recupera concentración."; e.replyT = 1.2; this.pushHud(); return; }
      e.comboReadyAt = now + 200;
      e.chainUntil = now + 1600;
      this.slashT = learnedWater ? (formIndex === 1 ? 0.44 : formIndex === 2 ? 0.36 : 0.26) : 0.26;
      e.combo = step + 1;
      e.meter = THREE.MathUtils.clamp(e.meter + Math.round(Math.max(8, move.meterGain) * (learnedWater ? water.power : 1)), 0, e.def.goal);
      e.focus = Math.max(0, e.focus - (learnedWater ? water.cost : Math.min(6, move.focusCost)));
      e.lastMove = learnedWater ? water.name : (e.fighter === "tanjiro" ? move.tanjiroName : move.name);
      e.lastMoveT = 1.4;
      e.flash = step === chain.length - 1 ? "counter" : "hit"; e.flashT = 0.6;
      this.noise(0.08, 0.06);
      this.tone(440 + step * 90, 660 + step * 90, 0.12, "triangle", 0.08);
      if (learnedWater) {
        // Trazos espaciales distintos: corte horizontal, rueda vertical y corriente ondulante.
        const heading = Math.atan2(e.pos.x - this.pos.x, e.pos.z - this.pos.z);
        const arc = waterArcPoints(WATER_MOTIONS[formIndex], this.pos, heading);
        for (let k = 0; k < arc.length; k += 2) {
          const v = arc[k];
          this.burst(new THREE.Vector3(v.x, v.y, v.z), 3, new THREE.Color(water.color), 1.15, 0.65);
        }
      } else {
        this.burst(e.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 10 + step * 4, new THREE.Color(e.def.color), 4 + step, 1.5);
      }
      if (e.def.enemyHp !== undefined && step === chain.length - 1) e.enemyHp = Math.max(0, e.enemyHp - 1);
      if (step === chain.length - 1) { e.combo = 0; this.shake = 0.45; }
      if (e.meter >= e.def.goal || (e.def.enemyHp !== undefined && e.enemyHp <= 0)) this.finishEncounter(true);
      this.pushHud();
      return;
    }
    // -11: Uso del entorno (nieve, árboles, rocas).
    if (i === -11) {
      if (e.words || (e.envCd ?? 0) > 0) return;
      const action = e.def.envActions[(e.envIdx ?? 0) % e.def.envActions.length];
      e.envIdx = (e.envIdx ?? 0) + 1;
      e.envCd = 9;
      e.meter = THREE.MathUtils.clamp(e.meter + Math.max(12, action.meterDelta), 0, e.def.goal);
      e.invuln = Math.max(e.invuln, 0.7);
      e.reply = this.fill(action.effectText);
      e.replyT = 3;
      e.lastMove = action.label; e.lastMoveT = 1.6;
      this.burst(this.pos.clone().add(new THREE.Vector3(0, 1, 0)), 20, new THREE.Color("#bfe9ff"), 5, 2);
      this.tone(520, 820, 0.18, "sine", 0.09);
      if (e.meter >= e.def.goal) this.finishEncounter(true);
      this.pushHud();
      return;
    }
    // -12: Relevo Tag-Team con Tanjiro (recupera 1 punto de guardia y +25 concentración).
    if (i === -12) {
      if (e.tagCd > 0 || e.words) return;
      this.setFighter(e.fighter === "player" ? "tanjiro" : "player", false);
      e.tagCd = 8;
      e.guard = Math.min(e.def.guardBreak, e.guard + 1);
      e.focus = Math.min(100, e.focus + 25);
      e.invuln = Math.max(e.invuln, 0.5);
      e.broken = 0;
      e.reply = e.fighter === "tanjiro" ? "¡Tanjiro entra al relevo! «¡Descansa, cuñado, yo la contengo!»" : `¡${this.name.first} vuelve al frente! Tanjiro cubre la retaguardia.`;
      e.replyT = 2.2;
      this.burst(this.pos.clone(), 16, new THREE.Color("#6ee7b7"), 4, 1.5);
      this.tone(600, 900, 0.2, "triangle", 0.09);
      this.pushHud();
      return;
    }
    if (!e.words) return;
    const opt = e.words.win.options[i];
    if (!opt) return;
    const asTanjiro = e.fighter === "tanjiro";
    e.meter = THREE.MathUtils.clamp(e.meter + opt.delta, 0, e.def.goal);
    e.reply = `${this.fill(asTanjiro ? opt.tanjiroReply : opt.reply)} — ${opt.effectSummary}`;
    e.replyT = 3.4;
    e.words = null;
    e.slow = 0;
    if (opt.tone === "rage") {
      e.nextAttack = 0.25;
      this.shake = 0.5;
      this.tone(120, 60, 0.4, "sawtooth", 0.12);
    } else if (opt.tone === "calm") {
      e.nextAttack = Math.max(e.nextAttack, 1.6);
      this.tone(520, 880, 0.3, "triangle", 0.09);
      this.burst(e.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), 18, new THREE.Color(e.def.color), 3, 1.5);
    }
    if (e.meter >= e.def.goal) this.finishEncounter(true);
    this.pushHud();
  }

  /** Cambia el luchador activo: intercambia la posición del jugador con la del seguidor Tanjiro y su aspecto. */
  private setFighter(who: FighterId, initial: boolean) {
    const e = this.enc;
    if (!e) return;
    const tanjiro = this.followers.find((f) => f.def.id === "f_tanjiro");
    if (e.fighter !== who && tanjiro && !initial) {
      // Intercambio de posiciones: el relevo entra donde estaba el activo y viceversa.
      const mine = this.pos.clone();
      this.pos.set(tanjiro.pos.x, terrainHeight(tanjiro.pos.x, tanjiro.pos.z) + HALF, tanjiro.pos.z);
      tanjiro.pos.set(mine.x, terrainHeight(mine.x, mine.z), mine.z);
      // Vida independiente por luchador.
      const hp = e.hp; e.hp = e.tanjiroHp; e.tanjiroHp = hp;
    }
    e.fighter = who;
    this.applyFighterLook();
  }

  /** El modelo del jugador adopta el haori de Tanjiro cuando él es el luchador activo. */
  private applyFighterLook() {
    const asTanjiro = !!this.enc && this.enc.fighter === "tanjiro";
    const haori = this.player.haori.material as THREE.MeshStandardMaterial;
    if (!this.baseHaori) this.baseHaori = haori;
    this.player.haori.material = asTanjiro ? new THREE.MeshStandardMaterial({ color: "#2f6b4a", roughness: 0.8 }) : this.baseHaori;
    const tanjiro = this.followers.find((f) => f.def.id === "f_tanjiro");
    if (tanjiro) {
      const th = tanjiro.human.haori.material as THREE.MeshStandardMaterial;
      if (!this.baseTanjiroHaori) this.baseTanjiroHaori = th;
      tanjiro.human.haori.material = asTanjiro ? this.baseHaori : this.baseTanjiroHaori;
    }
  }

  /** Acciones para los botones táctiles del duelo. */
  pressAttack() { this.attack(); }
  pressDodge() { this.dash(); }

  /** Mantener o soltar la guardia (clic derecho / F / botón táctil). */
  setGuard(on: boolean) {
    if (this.enc) this.enc.holding = on;
  }

  /** Reintento tras morir en un encuentro o fallar un entrenamiento. */
  retry() {
    if (this.enc?.dead) { const id = this.enc.def.id; this.endEncounter(); this.startEncounter(id); }
    else if (this.trn?.failed) { const k = this.trn.kind; this.endTraining(); this.startTraining(k); }
    this.pushHud();
  }

  choose(i: number) {
    if (this.paused || this.transition || this.blocked) return;
    const d = this.dialogue;
    if (!d || d.kind !== "node") return;
    const node = findNodeById(d.nodeId)?.node;
    const choice = node?.choices?.[i];
    if (!node || !choice || d.para < node.paragraphs.length - 1) return;
    // La rama visitada persiste en la partida y permite recuperar la relación después.
    if (d.nodeId === "c1_sabito") this.mark(choice.nextNodeId);
    this.goNext(choice.nextNodeId);
    this.pushHud();
  }

  serialize(): OWSave {
    const useCheckpoint = this.transition !== null || (this.spawned && !this.cleared);
    const point = useCheckpoint ? this.safe : this.pos;
    return {
      version: PROLOGUE_VERSION, missionIdx: this.missionIdx, stepIdx: this.stepIdx,
      queued: this.queued, visited: [...this.visited], introPlayed: this.introPlayed,
      x: point.x, z: point.z, yaw: this.yaw, finished: this.finished, refuge: { ...this.refuge },
      trainingDay: this.trainingDay, trainingHour: this.trainingHour,
      sideQuestDone: [...this.sideQuestDone], sideQuestActive: this.sideQuestActive, playerXp: this.playerXp,
      nezukoLastVisitDay: this.nezukoLastVisitDay, nezukoAwakeVisits: this.nezukoAwakeVisits, nezukoBuff: this.nezukoBuff ? { ...this.nezukoBuff } : null,
    };
  }

  load(input: OWSave) {
    const s = normalizeSave(input);
    if (!s) return;
    this.generation++;
    this.transition = null;
    this.dialogue = null;
    this.sleepPrompt = false;
    this.blocked = false;
    this.clearInput();
    this.sideQuestDone = s.sideQuestDone ?? [];
    this.sideQuestActive = s.sideQuestActive ?? null;
    this.playerXp = s.playerXp ?? 0;
    this.nezukoLastVisitDay = s.nezukoLastVisitDay ?? 0;
    this.nezukoAwakeVisits = s.nezukoAwakeVisits ?? 0;
    this.nezukoBuff = s.nezukoBuff ?? null;
    this.trainingDay = s.trainingDay ?? 1;
    this.trainingHour = s.trainingHour ?? 7;
    this.trainingClockSeconds = 0;
    this.missionIdx = s.missionIdx;
    this.stepIdx = s.stepIdx;
    this.queued = s.queued;
    this.visited = [...s.visited];
    this.introPlayed = s.introPlayed;
    // Los minijuegos y las cinemáticas no se guardan a mitad de secuencia.
    if (["training", "encounter", "cinematic"].includes(this.currentStep()?.type ?? "")) this.introPlayed = false;
    this.bambooStage = -1;
    this.finished = s.finished;
    this.refuge = s.refuge ?? freshRefuge();
    if (this.indoors()) {
      this.cabin ??= buildCabin();
      this.cabin.scene.add(this.player.group);
      this.cabin.setMorning(this.refuge.slept);
    } else this.scene.add(this.player.group);
    this.world.setMorning(this.isMorning());
    this.pos.set(s.x, this.groundAt(s.x, s.z) + HALF, s.z);
    this.safe.copy(this.pos);
    this.yaw = s.yaw;
    this.camYaw = this.indoors() ? 0 : this.yaw + Math.PI;
    this.vel.set(0, 0, 0);
    this.grounded = true;
    this.player.body.rotation.set(0, 0, 0);
    this.player.body.visible = true;
    this.player.group.position.set(this.pos.x, this.pos.y - HALF, this.pos.z);
    this.blizzard = 0;
    this.blizzardWarned = false;
    this.snowfall = !this.isMorning() && !this.indoors() ? 0.78 : 0;
    this.clearEnemies();
    this.clearActors();
    this.endEncounter();
    this.endTraining();
    this.hp = this.maxHp();
    this.breath = 100;
    this.wallWarned = false;
    this.refreshCast();
    for (const f of this.followers) f.pos.copy(this.pos);
    this.pushHud();
  }

  dispose() {
    this.disposed = true;
    this.generation++;
    cancelAnimationFrame(this.raf);
    this.cabin?.dispose();
    this.clearActors();
    this.endEncounter();
    this.endTraining();
    this.snowGeo.dispose();
    (this.snowPts.material as THREE.PointsMaterial).map?.dispose();
    (this.snowPts.material as THREE.Material).dispose();
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("contextmenu", this.onContext);
    this.canvas.removeEventListener("wheel", this.onWheel);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);
    this.exitLook();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.geometry?.dispose();
    });
    this.renderer.dispose();
    this.practiceSwordMaterial.dispose();
    try {
      this.windSrc?.stop();
    } catch {
      /* already stopped */
    }
    void this.audio?.close();
  }

  /* =========================== reparto =========================== */

  private makeNpc(def: NpcDef): NpcObj {
    let group: THREE.Group;
    let human: Humanoid | null = null;
    if (def.kind === "crow") {
      group = buildCrow();
    } else {
      human = buildHumanoid(def.look ?? LOOKS.kakushi);
      if (def.id === "sabito" && human.sword) (human.sword.children[0] as THREE.Mesh).material = this.practiceSwordMaterial;
      group = human.group;
    }
    const resting = def.id === "nezuko_sleeping";
    if (resting && human) {
      human.body.rotation.x = -Math.PI / 2;
      human.body.position.y = 0.33;
    }
    const label = makeLabel(def.name);
    label.position.y = resting ? 3.15 : def.kind === "crow" ? 2.55 : 2.35;
    const marker = makeMarker("!", "#ffd23f");
    marker.position.y = resting ? 3.75 : def.kind === "crow" ? 3.3 : 3.05;
    marker.visible = false;
    group.add(label, marker);
    group.position.set(def.x, terrainHeight(def.x, def.z) + (resting ? 0.12 : 0), def.z);
    group.rotation.y = 0;
    this.scene.add(group);
    return { def, group, human, label, marker, t: Math.random() * 6 };
  }

  /** Anexo sombreado de la cabaña de Urokodaki, con tatami y un futón protegido del sol. */
  private makeSagiriShelter() {
    const spot = NPCS.find((n) => n.id === "nezuko_sleeping");
    const hut = new THREE.Group();
    hut.name = "sagiri-nezuko-shelter";
    if (!spot) return hut;
    hut.position.set(spot.x, terrainHeight(spot.x, spot.z), spot.z);
    const wood = new THREE.MeshStandardMaterial({ color: "#705039", roughness: 0.9 });
    const reed = new THREE.MeshStandardMaterial({ color: "#baaa81", roughness: 1 });
    const cloth = new THREE.MeshStandardMaterial({ color: "#ac8396", roughness: 0.94 });
    const paper = new THREE.MeshStandardMaterial({ color: "#ddcfac", side: THREE.DoubleSide, roughness: 0.9 });
    const roof = new THREE.MeshStandardMaterial({ color: "#44352d", roughness: 0.9, transparent: true, opacity: 0.95, depthWrite: false });
    const piece = (w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      hut.add(mesh);
      return mesh;
    };
    piece(4.6, 0.13, 5.2, 0, 0.04, 0, wood);
    piece(3.7, 0.09, 3.8, 0, 0.15, -0.12, reed);
    piece(1.3, 0.13, 2.2, 0, 0.25, -0.1, cloth);
    piece(0.96, 0.17, 0.45, 0, 0.36, -1.27, paper);
    piece(4.8, 2.65, 0.14, 0, 1.34, -2.52, paper);
    piece(0.13, 2.62, 5.2, -2.3, 1.33, 0, wood);
    piece(0.13, 2.62, 4.0, 2.3, 1.33, -0.6, wood);
    for (const x of [-2.2, 2.2]) for (const z of [-2.4, 2.4]) piece(0.18, 2.9, 0.18, x, 1.48, z, wood);
    piece(5.25, 0.23, 5.8, 0, 2.83, 0, roof);
    piece(2.8, 0.18, 2.35, -1.8, 2.85, -3.85, roof);
    const lamp = new THREE.PointLight("#ffd2a2", 6, 6, 2);
    lamp.position.set(-1.2, 1.7, 0.8);
    hut.add(lamp);
    hut.visible = false;
    this.scene.add(hut);
    return hut;
  }

  private castIndex() {
    return Math.min(this.missionIdx, MISSIONS.length - 1);
  }

  /** La cesta solo acompaña a Nezuko en los viajes, nunca durante las pruebas físicas. */
  private travelingWithNezuko() {
    if (this.dialogue?.kind === "node" && this.dialogue.nodeId === "p0_5") return this.bambooStage >= 2;
    if (this.missionIdx === 0) return false;
    return this.missionIdx === 1 && ((this.stepIdx <= 1 && !this.visited.includes("c1_nezuko_care")) || this.stepIdx >= 6);
  }

  private refreshCast() {
    this.updateTrainingPhysiques();
    const carrying = this.travelingWithNezuko();
    this.player.basket.visible = carrying;
    const idx = this.castIndex();
    const joined = this.missionIdx > 0 || this.stepIdx >= PROLOGUE.CLIMB;
    const armed = this.canFight();
    const woodenPractice = this.missionIdx === 1 && this.stepIdx >= 2 && this.stepIdx <= 5;
    if (this.player.sword) {
      const blade = this.player.sword.children[0] as THREE.Mesh;
      this.playerBladeMaterial ??= blade.material as THREE.Material;
      blade.material = woodenPractice ? this.practiceSwordMaterial : this.playerBladeMaterial;
      this.player.sword.visible = armed || woodenPractice;
    }
    if (this.sagiriShelter) this.sagiriShelter.visible = this.missionIdx === 1 && this.stepIdx >= 1 && this.stepIdx < 6 && !this.indoors();
    for (const n of this.npcs) {
      let show = n.def.from <= idx && idx <= n.def.to && !this.indoors();
      if (n.def.id === "tanjiro_home" && joined) show = false;
      if (n.def.id === "sabito" && (this.enc?.def.id === "sabito" || !this.visited.includes("c1_1"))) show = false;
      if (n.def.id === "makomo" && !this.visited.includes("c1_1")) show = false;
      // La primera presentación de Makomo se conserva en su posición original.
      if (n.def.id === "makomo" && this.independentTrainingActive() && this.currentStep()?.npc !== "makomo") show = true;
      if (n.def.id === "nezuko_sleeping") show = this.missionIdx === 1 && this.stepIdx >= 1 && this.stepIdx < 6 && !this.indoors();
      n.group.visible = show;
      if (n.def.id === "tanjiro_home" && n.human?.sword) n.human.sword.visible = armed;
    }
    for (const f of this.followers) {
      let show = !this.indoors() && (f.def.id === "f_tanjiro" ? joined : idx >= f.def.from);
      if (f.def.id === "f_nezuko" && (this.missionIdx === 1 || carrying)) show = false;
      if (show && !f.human.group.visible) {
        if (f.def.id === "f_tanjiro" && this.independentTrainingActive()) {
          const a = this.practiceAnchor("tanjiro");
          f.pos.set(a.x, terrainHeight(a.x, a.z), a.z);
        } else f.pos.copy(this.pos);
      }
      f.human.group.visible = show;
      if (f.def.id === "f_tanjiro" && f.human.sword) {
        const blade = f.human.sword.children[0] as THREE.Mesh;
        this.tanjiroBladeMaterial ??= blade.material as THREE.Material;
        blade.material = woodenPractice ? this.practiceSwordMaterial : this.tanjiroBladeMaterial;
        f.human.sword.visible = armed || woodenPractice;
      }
    }
  }

  private indoors() { return this.refuge.location === "saburo"; }
  private isMorning() { return (this.refuge.slept && this.missionIdx === 0) || (this.missionIdx === 1 && this.stepIdx >= 2 && this.stepIdx <= 4); }
  private canFight() { return canUseSword(this.missionIdx, this.stepIdx); }
  private groundAt(x: number, z: number) { return this.indoors() ? CABIN_FLOOR : terrainHeight(x, z); }
  private clearInput() {
    this.keys.clear();
    this.touch = { x: 0, y: 0, sprint: false };
    this.jumpBuf = 0;
    this.dashT = 0;
    this.dragging = false;
  }

  private maxHp() {
    return Math.min(14, 6 + Math.min(this.missionIdx, MISSIONS.length));
  }

  private damage() {
    return Math.ceil((1 + Math.floor(Math.min(this.missionIdx, MISSIONS.length) / 2)) * this.nezukoMultiplier("strength"));
  }

  private currentStep(): Step | null {
    if (this.finished || this.missionIdx >= MISSIONS.length) return null;
    return MISSIONS[this.missionIdx].steps[this.stepIdx] ?? null;
  }

  /* =========================== diálogo =========================== */

  private fill(text: string) {
    return text
      .replaceAll("{firstName}", this.name.first)
      .replaceAll("{lastName}", this.name.last)
      .replaceAll("{fullName}", `${this.name.first} ${this.name.last}`);
  }

  private mark(id: string) {
    if (!this.visited.includes(id)) this.visited.push(id);
  }

  private playNodes(candidates: string[], origin: string, onDone: () => void) {
    const start = candidates.find((c) => c === this.queued) ?? candidates[0];
    this.queued = null;
    if (!start || !findNodeById(start)) {
      onDone();
      return;
    }
    this.mark(start);
    this.dialogue = { kind: "node", nodeId: start, para: 0, origin, onDone };
    this.onStoryNode(start);
    if (start === "c1_nezuko_care") this.refreshCast();
    this.vel.x = this.vel.z = 0;
    this.clearInput();
    this.exitLook();
    this.tone(520, 780, 0.12, "triangle", 0.07);
    this.pushHud();
  }

  private playLines(speaker: string, portrait: string, lines: string[], origin = "Charla") {
    this.dialogue = { kind: "plain", speaker, portrait, color: "text-amber-200", lines: lines.map((l) => this.fill(l)), para: 0, origin, onDone: () => undefined };
    this.vel.x = this.vel.z = 0;
    this.clearInput();
    this.pushHud();
  }

  private goNext(next?: string) {
    const d = this.dialogue;
    if (!d || d.kind !== "node") return;
    if (!next || BREAK_NODES.has(next) || !findNodeById(next)) {
      if (next && BREAK_NODES.has(next)) this.queued = next;
      this.closeDialogue(d.onDone);
      return;
    }
    this.mark(next);
    d.nodeId = next;
    d.para = 0;
    this.onStoryNode(next);
  }

  private closeDialogue(onDone: () => void) {
    this.dialogue = null;
    this.refreshCast();
    this.jumpBuf = 0;
    this.keys.delete("jump");
    this.keys.delete("attack");
    this.keys.delete("interact");
    onDone();
    this.pushHud();
  }

  private dialogueView(): DialogueView | null {
    const d = this.dialogue;
    if (!d) return null;
    if (d.kind === "plain") {
      return { key: `plain-${d.speaker}-${d.para}-${d.lines[d.para]}`, speaker: d.speaker, color: d.color, portrait: d.portrait, text: d.lines[d.para] ?? "", index: d.para, total: d.lines.length, choices: null, origin: d.origin };
    }
    const found = findNodeById(d.nodeId);
    if (!found) return null;
    const { node } = found;
    const last = d.para >= node.paragraphs.length - 1;
    return {
      key: `${node.id}-${d.para}`,
      speaker: node.speaker,
      title: node.title ? this.fill(node.title) : undefined,
      color: node.speakerColor ?? "text-amber-200",
      portrait: node.portraitEmoji ?? "📜",
      text: this.fill(node.paragraphs[d.para] ?? ""),
      index: d.para,
      total: node.paragraphs.length,
      choices: last && node.choices?.length ? node.choices.map((c) => this.fill(c.text)) : null,
      origin: d.origin,
    };
  }

  /* =========================== refugio y noche =========================== */

  private beginTransition(kind: TransitionKind) {
    if (this.transition) return;
    this.clearInput();
    this.vel.set(0, 0, 0);
    this.sleepPrompt = false;
    this.safe.copy(this.pos);
    this.transition = { kind, time: 0, switched: false, from: this.pos.clone() };
    if (kind === "fall") {
      const tanjiro = this.followers.find((f) => f.def.id === "f_tanjiro");
      const start = (offset: THREE.Vector3) => this.pos.clone().add(offset);
      const slope = this.slopeDir(this.pos.x, this.pos.z);
      const mk = (p: THREE.Vector3, side: number) => ({
        pos: p, vel: slope.clone().multiplyScalar(5.5 + Math.random() * 1.5).add(new THREE.Vector3(side * 1.4, 2.2 + Math.random(), 0)),
        spin: new THREE.Vector3(6 + Math.random() * 4, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 6 * side),
        rot: new THREE.Euler(), rest: 0, bounces: 0,
      });
      this.fall = { bodies: [mk(start(new THREE.Vector3(0, 0, 0)), 1), mk(start(new THREE.Vector3(-1.3, 0, 0.9)), -1)], t: 0, settled: false, standAt: 0 };
      if (tanjiro) { tanjiro.human.group.visible = true; tanjiro.label.visible = false; }
      this.tone(90, 40, 0.6, "sawtooth", 0.12);
    }
    this.pushHud();
  }

  /** Dirección de máxima pendiente descendente del terreno. */
  private slopeDir(x: number, z: number) {
    const e = 0.6;
    const gx = terrainHeight(x + e, z) - terrainHeight(x - e, z);
    const gz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
    const v = new THREE.Vector3(-gx, 0, -gz);
    if (v.lengthSq() < 1e-4) {
      // Terreno casi plano: hacia el punto de aterrizaje.
      v.set(FALL_LANDING.x - x, 0, FALL_LANDING.z - z);
    }
    return v.normalize();
  }

  /** Caída física: rebotes contra la pendiente, rodada y frenado; termina cerca del recodo de Saburo. */
  private updateFall(dt: number) {
    const f = this.fall;
    if (!f) return;
    f.t += dt;
    const landing = new THREE.Vector3(FALL_LANDING.x, 0, FALL_LANDING.z);
    let allRest = true;
    f.bodies.forEach((b, i) => {
      if (b.rest > 0.8) return;
      allRest = false;
      // Gravedad + empuje suave hacia el valle para no quedar atascado en un hoyo.
      b.vel.y -= 22 * dt;
      const pull = landing.clone().sub(b.pos).setY(0);
      const dLand = pull.length();
      if (dLand > 2) b.vel.addScaledVector(pull.normalize(), 2.2 * dt);
      // Rozamiento y arrastre del aire.
      b.vel.multiplyScalar(1 - 0.35 * dt);
      b.pos.addScaledVector(b.vel, dt);
      const ground = terrainHeight(b.pos.x, b.pos.z) + 0.55;
      if (b.pos.y < ground) {
        b.pos.y = ground;
        const slope = this.slopeDir(b.pos.x, b.pos.z);
        const vy = b.vel.y;
        if (vy < -2.5 && b.bounces < 4) {
          // Rebote amortiguado con desvío lateral aleatorio.
          b.vel.y = -vy * 0.38;
          b.vel.addScaledVector(slope, 1.8);
          b.vel.x += (Math.random() - 0.5) * 2.4;
          b.vel.z += (Math.random() - 0.5) * 2.4;
          b.bounces++;
          b.spin.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 10);
          this.shake = Math.max(this.shake, 0.35);
          this.burst(b.pos.clone(), 12, new THREE.Color("#eef4ff"), 4, 2);
          this.tone(140 + i * 30, 60, 0.18, "square", 0.08);
        } else {
          // Rodando: sigue la pendiente y se frena.
          b.vel.y = 0;
          b.vel.addScaledVector(slope, 4 * dt);
          b.vel.multiplyScalar(1 - 1.4 * dt);
        }
      }
      const speed = b.vel.length();
      const spinK = Math.min(1, speed / 6);
      b.rot.x += b.spin.x * spinK * dt;
      b.rot.y += b.spin.y * spinK * dt;
      b.rot.z += b.spin.z * spinK * dt;
      if (speed < 0.6 && b.pos.y - 0.55 <= terrainHeight(b.pos.x, b.pos.z) + 0.05) b.rest += dt;
      else b.rest = 0;
    });
    // Cámara: sacudida continua proporcional a la velocidad.
    const p = f.bodies[0];
    this.shake = Math.max(this.shake, Math.min(0.3, p.vel.length() * 0.03));
    this.pos.set(p.pos.x, p.pos.y + HALF - 0.55, p.pos.z);
    this.player.group.position.set(this.pos.x, this.pos.y - HALF, this.pos.z);
    this.player.body.rotation.copy(p.rot);
    this.player.body.visible = true;
    const tanjiro = this.followers.find((fo) => fo.def.id === "f_tanjiro");
    if (tanjiro) {
      const q = f.bodies[1];
      tanjiro.pos.set(q.pos.x, q.pos.y - 0.55, q.pos.z);
      tanjiro.human.group.position.copy(tanjiro.pos);
      tanjiro.human.body.rotation.copy(q.rot);
    }
    if ((allRest || f.t > 7.5) && !f.settled) {
      f.settled = true;
      f.standAt = f.t + 0.9;
      for (const b of f.bodies) b.rot.set(Math.PI / 2 - 0.2, b.rot.y, 0);
    }
    if (f.settled && f.t >= f.standAt) {
      this.transition = null;
      this.fall = null;
      this.refuge.fallen = true;
      this.player.body.rotation.set(0, 0, 0);
      if (tanjiro) tanjiro.human.body.rotation.set(0, 0, 0);
      this.pos.y = terrainHeight(this.pos.x, this.pos.z) + HALF;
      this.vel.set(0, 0, 0);
      this.grounded = true;
      this.completeStep();
      this.onEvent("toast", "Tanjiro: «¿Estás entero?... Mira, hay luz en esa cabaña.»");
    }
  }

  confirmSleep(accept: boolean) {
    if (!this.sleepPrompt || this.paused || this.transition) return;
    this.sleepPrompt = false;
    if (accept && this.indoors() && !this.refuge.slept && this.currentStep()?.type === "sleep") {
      this.mark("p0_sleep");
      this.beginTransition("sleep");
    }
    this.pushHud();
  }

  private transitionView(): OWHud["transition"] {
    const tr = this.transition;
    if (!tr) return null;
    const duration = tr.kind === "fall" ? 8.5 : tr.kind === "sleep" ? 5.2 : 2.6;
    const fadeInAt = tr.kind === "sleep" ? 4.2 : 1.85;
    const opacity = tr.kind === "fall" ? 0 : Math.min(1, tr.time / 0.65, (duration - tr.time) / (duration - fadeInAt));
    return { kind: tr.kind, opacity: Math.max(0, opacity), progress: Math.min(1, tr.time / duration) };
  }

  private clockLabel() {
    if (this.transition?.kind === "sleep") {
      const part = THREE.MathUtils.clamp((this.transition.time - 0.7) / 3.5, 0, 1);
      const minutes = Math.floor(22 * 60 + 30 + part * (7 * 60 + 45));
      return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    }
    if (this.refuge.slept && this.missionIdx === 0) return "06:15";
    if (this.missionIdx === 1) return ["04:55", "05:20", "08:30", "15:25", "18:10", "19:30", "06:10"][Math.min(this.stepIdx, 6)];
    if (this.indoors()) return "22:30";
    if (this.refuge.fallen && this.missionIdx === 0) return "22:15";
    return this.missionIdx === 0 ? "21:40" : "Noche";
  }

  private updateTransition(dt: number) {
    const tr = this.transition;
    if (!tr) return;
    tr.time += dt;
    if (tr.kind === "fall") {
      this.updateFall(dt);
      return;
    }
    const middle = tr.kind === "sleep" ? 3.55 : 1.05;
    if (!tr.switched && tr.time >= middle) {
      tr.switched = true;
      if (tr.kind === "enter") {
        this.cabin ??= buildCabin();
        this.refuge.location = "saburo";
        this.cabin.setMorning(this.refuge.slept);
        this.cabin.scene.add(this.player.group);
        this.pos.set(CABIN_ENTRY.x, CABIN_FLOOR + HALF, CABIN_ENTRY.z);
        this.yaw = Math.PI; this.camYaw = 0;
        this.safe.copy(this.pos);
        this.completeStep();
      } else if (tr.kind === "sleep") {
        this.refuge.slept = true;
        this.cabin?.setMorning(true);
        this.world.setMorning(true);
        this.snowfall = this.blizzard = 0;
        this.snowPts.visible = false;
        this.hp = this.maxHp(); this.breath = 100;
        this.pos.set(CABIN_WAKE.x, CABIN_FLOOR + HALF, CABIN_WAKE.z);
        this.yaw = 0;
        this.safe.copy(this.pos);
        this.completeStep();
      } else {
        this.refuge.location = "outdoors";
        this.scene.add(this.player.group);
        this.world.setMorning(this.isMorning());
        this.pos.set(SABURO_DOOR.x, terrainHeight(SABURO_DOOR.x, SABURO_DOOR.z + 2) + HALF, SABURO_DOOR.z + 2);
        this.yaw = 0.8; this.camYaw = this.yaw + Math.PI;
        this.safe.copy(this.pos);
        this.completeStep();
      }
      this.refreshCast();
      this.player.body.rotation.set(0, 0, 0);
      this.player.group.position.set(this.pos.x, this.pos.y - HALF, this.pos.z);
      this.player.group.rotation.y = this.yaw;
      this.vel.set(0, 0, 0);
      this.grounded = true;
      if (this.indoors()) {
        this.camera.position.set(0, 13.5, 16.5);
        this.camera.lookAt(0, 0, -0.8);
      } else {
        this.camera.position.copy(this.pos).add(new THREE.Vector3(-6, 5, -6));
      }
    }
    const duration = tr.kind === "sleep" ? 5.2 : 2.6;
    if (tr.time >= duration) {
      this.transition = null;
      this.clearInput();
      if (tr.kind === "enter") this.onEvent("toast", "Saburo: «El cuarto está a la izquierda. Podéis descansar en el tatami.»");
      if (tr.kind === "sleep") this.playNodes(["p0_morning"], "El amanecer · 06:15", () => this.onEvent("save"));
      this.onEvent("save");
      this.pushHud();
    }
  }

  /** Personajes que no están en el mapa y entran al llegar su escena. */
  private spawnActor(id: string, look: Look, name: string, color: string, from: { x: number; z: number }, to: { x: number; z: number }, dur: number) {
    if (this.actors.some((a) => a.id === id)) return;
    const human = buildHumanoid(look);
    const label = makeLabel(name, color);
    label.position.y = 2.35;
    human.group.add(label);
    const start = new THREE.Vector3(from.x, terrainHeight(from.x, from.z), from.z);
    human.group.position.copy(start);
    this.scene.add(human.group);
    this.actors.push({ id, human, from: start, to: new THREE.Vector3(to.x, terrainHeight(to.x, to.z), to.z), t: 0, dur, phase: 0 });
    this.burst(start.clone().add(new THREE.Vector3(0, 1, 0)), 22, new THREE.Color("#dbe9ff"), 5, 1.5);
  }

  private clearActors() {
    for (const a of this.actors) this.scene.remove(a.human.group);
    this.actors = [];
  }

  /** Punto por delante del jugador y dentro del encuadre de la cámara. */
  private sceneSpot(forward: number, side: number) {
    const f = new THREE.Vector3(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw));
    const r = new THREE.Vector3(f.z, 0, -f.x);
    const p = this.pos.clone().addScaledVector(f, forward).addScaledVector(r, side);
    return { x: p.x, z: p.z };
  }

  private faceScene(target: { x: number; z: number }) {
    this.yaw = Math.atan2(target.x - this.pos.x, target.z - this.pos.z);
    this.player.group.rotation.y = this.yaw;
  }

  /** Entradas guionizadas: nadie espera plantado en el mapa antes de su escena. */
  private onStoryNode(id: string) {
    if (id === "p0_4") {
      const to = this.sceneSpot(4.2, 1.8);
      this.spawnActor("nezuko", LOOKS.nezuko, "Nezuko", "#ffd3e6", this.sceneSpot(6.2, 3.2), to, 1.4);
      this.faceScene(to);
    }
    if (id === "p0_5") {
      this.bambooStage = -1;
      const nezuko = this.sceneSpot(4.1, 1.4);
      this.spawnActor("nezuko", LOOKS.nezuko, "Nezuko", "#ffd3e6", this.sceneSpot(5.4, 1.6), nezuko, 1.1);
      this.spawnActor("giyu", LOOKS.giyu, "Tomioka Giyu", "#bfe4ff", this.sceneSpot(9, -2.5), this.sceneSpot(5.7, -1.7), 1.6);
      this.faceScene(this.sceneSpot(4.4, 0));
      this.updateBambooCinematic(0);
    }
  }

  /** Coreografía idempotente: saltar el texto también completa cada cambio visual. */
  private updateBambooCinematic(paragraph: number) {
    if (paragraph <= this.bambooStage) return;
    const nezuko = this.actors.find((actor) => actor.id === "nezuko");
    const giyu = this.actors.find((actor) => actor.id === "giyu");
    for (let stage = this.bambooStage + 1; stage <= paragraph; stage++) {
      if (stage === 0) {
        this.player.basket.visible = false;
        if (giyu?.human.sword) giyu.human.sword.visible = false;
        if (nezuko) {
          nezuko.human.group.visible = true;
          const muzzle = nezuko.human.body.getObjectByName("nezuko_muzzle");
          if (muzzle) muzzle.visible = false;
        }
      } else if (stage === 1) {
        if (nezuko) {
          const muzzle = nezuko.human.body.getObjectByName("nezuko_muzzle");
          if (muzzle) muzzle.visible = true;
          // Tomioka se acerca primero y extiende el brazo hacia Nezuko.
          if (giyu) {
            giyu.human.arms[1].rotation.x = -1.1;
            giyu.human.arms[1].rotation.z = -0.45;
          }
          const seal = nezuko.human.group.position.clone().add(new THREE.Vector3(0, 1.55, 0));
          this.burst(seal, 15, new THREE.Color("#91ddb0"), 3, 1);
          this.burst(seal, 16, new THREE.Color("#f4d788"), 4, 1.5);
        }
        if (giyu && nezuko) {
          giyu.from.copy(giyu.human.group.position);
          giyu.to.set(nezuko.to.x - 1.1, terrainHeight(nezuko.to.x - 1.1, nezuko.to.z + 0.5), nezuko.to.z + 0.5);
          giyu.t = 0;
          giyu.dur = 0.95;
        }
        this.tone(510, 910, 0.32, "sine", 0.1);
      } else if (stage === 2) {
        if (nezuko) nezuko.human.group.visible = false;
        this.player.basket.visible = true;
        this.player.group.updateMatrixWorld(true);
        const basketPos = new THREE.Vector3();
        this.player.basket.getWorldPosition(basketPos);
        this.burst(basketPos, 22, new THREE.Color("#f4d788"), 4, 1);
        this.tone(380, 660, 0.4, "triangle", 0.1);
      }
    }
    this.bambooStage = paragraph;
    this.pushHud();
  }

  private updateActors(dt: number) {
    for (const a of this.actors) {
      a.t = Math.min(a.dur, a.t + dt);
      const k = a.t / a.dur;
      const eased = k < 1 ? 1 - Math.pow(1 - k, 3) : 1;
      a.human.group.position.lerpVectors(a.from, a.to, eased);
      a.human.group.position.y = terrainHeight(a.human.group.position.x, a.human.group.position.z);
      const moving = k < 1;
      if (moving) {
        const dir = a.to.clone().sub(a.from);
        a.human.group.rotation.y = Math.atan2(dir.x, dir.z);
        a.phase += dt * 7;
      } else {
        const want = Math.atan2(this.pos.x - a.human.group.position.x, this.pos.z - a.human.group.position.z);
        let diff = want - a.human.group.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        a.human.group.rotation.y += diff * Math.min(1, dt * 4);
      }
      animateHumanoid(a.human, a.phase, moving ? 0.85 : 0, true);
      const label = a.human.group.children.find((c) => (c as THREE.Sprite).isSprite);
      if (label) label.visible = moving || !this.dialogue;
    }
  }

  /* =========================== encuentros (esquivar + hablar) =========================== */

  // Las coberturas pertenecen al combate, no al mapa abierto: colisión y línea de visión reales.
  private arenaDecoration: THREE.Group | null = null;
  private arenaCovers: { x: number; z: number; radius: number; height: number }[] = [];

  private arenaBlocked(from: THREE.Vector3, to: THREE.Vector3) {
    const dx = to.x - from.x, dz = to.z - from.z;
    const lengthSq = dx * dx + dz * dz;
    if (lengthSq < 0.0001) return false;
    return this.arenaCovers.some(o => {
      const u = THREE.MathUtils.clamp(((o.x - from.x) * dx + (o.z - from.z) * dz) / lengthSq, 0, 1);
      const x = from.x + dx * u - o.x, z = from.z + dz * u - o.z;
      return x * x + z * z < (o.radius + 0.16) ** 2;
    });
  }

  private pushOutOfArenaCover(p: THREE.Vector3, padding: number) {
    for (const o of this.arenaCovers) {
      const dx = p.x - o.x, dz = p.z - o.z;
      const min = o.radius + padding;
      const d = Math.hypot(dx, dz);
      if (d < min) {
        const nx = d > 0.001 ? dx / d : 1;
        const nz = d > 0.001 ? dz / d : 0;
        p.x = o.x + nx * min;
        p.z = o.z + nz * min;
      }
    }
  }

  private createArena(center: THREE.Vector3, radius: number, id: string) {
    if (this.arenaDecoration) this.scene.remove(this.arenaDecoration);
    this.arenaCovers = [];
    const group = new THREE.Group();
    const isSabito = id === "sabito";
    const stone = new THREE.MeshStandardMaterial({ color: isSabito ? "#647a70" : "#5a687c", roughness: 0.96 });
    const darkStone = new THREE.MeshStandardMaterial({ color: isSabito ? "#354c44" : "#36445c", roughness: 1 });
    const soil = new THREE.MeshStandardMaterial({ color: isSabito ? "#63785c" : "#67727d", roughness: 1 });
    const wood = new THREE.MeshStandardMaterial({ color: "#58493c", roughness: 1 });
    const arenaFloor = new THREE.Mesh(new THREE.CylinderGeometry(radius - 0.18, radius - 0.18, 0.10, 64), soil);
    arenaFloor.position.set(center.x, terrainHeight(center.x, center.z) + 0.015, center.z);
    group.add(arenaFloor);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius - 0.35, 0.10, 7, 80), darkStone);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(center.x, terrainHeight(center.x, center.z) + 0.13, center.z);
    group.add(ring);
    // Los obstáculos están apartados del eje de aparición, pero pueden usarse para cubrirse.
    const spots = isSabito
      ? [[-3.8, -1.2, 1.0, 1.75], [3.6, 0.9, 1.15, 2.0], [-4.1, 3.7, 0.75, 1.45], [4.2, -3.6, 0.8, 1.5]]
      : [[-3.6, -0.5, 1.1, 2.0], [3.9, 1.2, 1.0, 1.8], [-3.7, 3.8, 0.75, 1.5], [4.0, -3.6, 0.75, 1.45]];
    spots.forEach(([ox, oz, r, h], i) => {
      const x = center.x + ox, z = center.z + oz;
      this.arenaCovers.push({ x, z, radius: r, height: h });
      const mesh = new THREE.Mesh(isSabito
        ? new THREE.DodecahedronGeometry(r, 1)
        : new THREE.CylinderGeometry(r * 0.85, r, h, 7), i % 2 ? darkStone : stone);
      mesh.scale.y = isSabito ? h / (r * 2) : 1;
      mesh.position.set(x, terrainHeight(x, z) + h / 2, z);
      mesh.rotation.y = i * 0.83;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      if (!isSabito) {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r * 0.94, 0.13, 7), wood);
        cap.position.set(x, terrainHeight(x, z) + h + 0.04, z);
        group.add(cap);
      }
    });
    for (let i = 0; i < 14; i++) {
      const angle = i * Math.PI * 2 / 14;
      const x = center.x + Math.cos(angle) * (radius + 0.35);
      const z = center.z + Math.sin(angle) * (radius + 0.35);
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + (i % 3) * 0.12, 0), stone);
      rock.position.set(x, terrainHeight(x, z) + 0.3, z);
      group.add(rock);
    }
    this.scene.add(group);
    this.arenaDecoration = group;
  }

  private startEncounter(id: string) {
    const def = ENCOUNTERS[id];
    if (!def || this.enc) return;
    this.clearInput();
    this.exitLook();
    const human = buildHumanoid(def.look);
    const label = makeLabel(def.name, def.color);
    label.position.y = 2.35;
    human.group.add(label);
    // Arena despejada: el centro del paso de misión; el oponente al norte, tú al sur.
    const step = this.currentStep();
    const c = step ? stepTarget(step) : { x: this.pos.x, z: this.pos.z };
    const center = new THREE.Vector3(c.x, 0, c.z);
    const radius = 7.5;
    this.createArena(center, radius, id);
    this.pos.set(c.x, terrainHeight(c.x, c.z + 3.6) + HALF, c.z + 3.6);
    this.vel.set(0, 0, 0);
    const pos = new THREE.Vector3(c.x + (id === "giyu" ? -1.5 : 1.0), 0, c.z - 3.6);
    pos.y = terrainHeight(pos.x, pos.z);
    this.yaw = Math.atan2(pos.x - this.pos.x, pos.z - this.pos.z);
    this.player.group.position.set(this.pos.x, this.pos.y - HALF, this.pos.z);
    this.player.group.rotation.y = this.yaw;
    human.group.position.copy(pos);
    this.scene.add(human.group);
    this.enc = {
      def, human, pos, yaw: 0, phase: 0, hp: def.playerHp, meter: def.startMeter, enemyHp: def.enemyHp ?? 1,
      nextAttack: 1.4, telegraph: 0, lunging: 0, lungeDir: new THREE.Vector3(), recover: 0,
      attacks: 0, windowIdx: 0, words: null, reply: null, replyT: 0, perfect: 0, dead: false, won: false, endT: 0, hitCd: 0, slow: 0,
      center, radius,
      focus: 100, guard: 3, holding: false, guarding: 0, broken: 0,
      invuln: 0, parry: 0, counter: 0, flash: null, flashT: 0,
      aiStyle: id === "sabito" ? "sabito" : id === "giyu" ? "giyu" : id === "nezuko" ? "nezuko" : "makomo",
      aiStrafe: 1, aiDecision: 0, aiEvade: 0, aiFeint: 0,
      fighter: "player", tagCd: 0, tanjiroHp: def.playerHp, chosen: false, lastMove: null, lastMoveT: 0,
    };
    this.clearActors();
    if (id === "sabito" && human.sword) (human.sword.children[0] as THREE.Mesh).material = this.practiceSwordMaterial;
    this.refreshCast();
    this.safe.copy(this.pos);
    this.iFrames = 0.8;
    this.onEvent("toast", this.fill(def.dodgeHint));
    this.pushHud();
  }

  private endEncounter() {
    if (!this.enc) return;
    this.enc.fighter = "player";
    this.applyFighterLook();
    this.scene.remove(this.enc.human.group);
    if (this.arenaDecoration) { this.scene.remove(this.arenaDecoration); this.arenaDecoration = null; }
    this.arenaCovers = [];
    this.enc = null;
    this.refreshCast();
    this.player.body.rotation.set(0, 0, 0);
    this.player.body.visible = true;
  }

  private finishEncounter(won: boolean) {
    const e = this.enc;
    if (!e || e.dead || e.won) return;
    if (won) { e.won = true; e.words = null; e.endT = 1.6; this.tone(523, 1046, 0.5, "triangle", 0.12); }
    else { e.dead = true; e.words = null; this.shake = 0.9; this.hitFlash = 1; this.tone(160, 40, 0.8, "sawtooth", 0.16); }
    this.pushHud();
  }

  /** Uso del entorno (E): maniobra escénica que suma al medidor con un enfriamiento. */
  private useEnvironment() {
    const e = this.enc!;
    if (e.dead || e.won || e.words || (e.envCd ?? 0) > 0 || e.focus < 15) return;
    const action = e.def.envActions[(e.envIdx ?? 0) % e.def.envActions.length];
    e.envIdx = (e.envIdx ?? 0) + 1;
    e.envCd = 9;
    e.focus -= 15;
    e.meter = Math.min(e.def.goal, e.meter + action.meterDelta);
    e.reply = this.fill(action.effectText);
    e.replyT = 3;
    e.flash = "counter"; e.flashT = 0.8;
    e.invuln = Math.max(e.invuln, 0.5);
    this.shake = 0.3;
    this.tone(500, 900, 0.2, "triangle", 0.09);
    this.burst(this.pos.clone().add(new THREE.Vector3(0, 1, 0)), 24, new THREE.Color("#dff2ff"), 6, 2);
    if (e.meter >= e.def.goal) this.finishEncounter(true);
    this.pushHud();
  }

  /** Ataque en el duelo. Abre una ventana de contraataque tras esquivar o parar. */
  private encounterAttack() {
    const e = this.enc!;
    if (e.dead || e.won || e.words || this.atkCd > 0) return;
    this.atkCd = 0.45;
    this.slashT = 0.26;
    this.noise(0.1, 0.07);
    const d = Math.hypot(e.pos.x - this.pos.x, e.pos.z - this.pos.z);
    const style = COMBAT_PERSONALITIES[e.aiStyle];
    if (e.aiEvade > 0 && e.counter <= 0 && Math.random() < style.evadeChance && e.def.enemyHp !== undefined) {
      e.flash = "perfect"; e.flashT = 0.45; e.aiEvade = 0;
      this.burst(e.pos.clone().add(new THREE.Vector3(0, 1, 0)), 9, new THREE.Color("#9cddfa"), 3, 0.8);
      return;
    }
    const toward = new THREE.Vector3(e.pos.x - this.pos.x, 0, e.pos.z - this.pos.z).normalize();
    const facing = Math.sin(this.yaw) * toward.x + Math.cos(this.yaw) * toward.z;
    const strike = (dmg: number, label: "counter" | "hit") => {
      // Sin vida enemiga (Nezuko): el "golpe" es un abrazo que solo suma al medidor.
      // El golpe/contraataque no forma parte de la cadena de combos (J fuera de ventana de contraataque).
      if (e.def.enemyHp === undefined) {
        e.meter = Math.min(e.def.goal, e.meter + 8 + Math.max(0, dmg) * 2);
      } else {
        e.enemyHp -= dmg;
        e.meter = Math.min(e.def.goal, e.meter + Math.round(e.def.goal / (e.def.enemyHp ?? 8)) * Math.max(1, dmg));
      }
      e.flash = label; e.flashT = 0.9;
      this.shake = 0.35;
      this.tone(600, 240, 0.12, "square", 0.09);
      this.burst(e.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 16, new THREE.Color("#ffd27a"), 5, 1.5);
      e.pos.addScaledVector(toward, 0.9);
      if ((e.def.enemyHp !== undefined && e.enemyHp <= 0) || e.meter >= e.def.goal) this.finishEncounter(true);
    };
    // Contraataque: justo después de esquivar/parar, sin importar la distancia de golpe.
    if (e.counter > 0 && facing > 0.1) { strike(Math.ceil(Math.max(e.def.counterDmg, e.def.enemyHp === undefined ? 1 : 0) * this.nezukoMultiplier("strength")), "counter"); e.counter = 0; return; }
    if (e.def.canAttack && e.recover > 0 && d < 2.6 && facing > 0) { strike(Math.ceil(this.nezukoMultiplier("strength")), "hit"); return; }
    this.tone(300, 140, 0.08, "square", 0.05);
  }

  private updateEncounter(dt: number, t: number) {
    const e = this.enc!;
    const def = e.def;
    const personality = COMBAT_PERSONALITIES[e.aiStyle];
    const scale = e.words ? 0.22 : 1;
    const sdt = dt * scale;
    if (e.words) {
      e.words.timeLeft -= dt;
      if (e.words.timeLeft <= 0) {
        e.words = null;
        e.reply = this.fill(def.id === "giyu" ? "No respondes. Giyu no espera." : "Dudaste demasiado. Vuelve a cargar.");
        e.replyT = 2;
        e.nextAttack = 0.3;
      }
    }
    if (e.replyT > 0) { e.replyT -= dt; if (e.replyT <= 0) e.reply = null; }
    if (e.won) {
      e.endT -= dt;
      animateHumanoid(e.human, e.phase, 0, true);
      if (e.endT <= 0) {
        const step = this.currentStep();
        const after = step?.after ?? [];
        this.endEncounter();
        if (after.length) this.playNodes(after, MISSIONS[this.missionIdx].title, () => this.completeStep());
        else this.completeStep();
      }
      return;
    }
    if (e.dead) return;
    if (!e.chosen) { animateHumanoid(e.human, e.phase, 0, true); animateHumanoid(this.player, this.runPhase, 0, true); return; }

    const frozen = !!this.dialogue || this.blocked;
    const wish = new THREE.Vector3();
    if (!frozen) this.wish(wish);
    const moving = wish.lengthSq() > 0.01;
    this.dashCd = Math.max(0, this.dashCd - sdt);
    this.atkCd = Math.max(0, this.atkCd - sdt);
    this.slashT = Math.max(0, this.slashT - sdt);
    this.iFrames = Math.max(0, this.iFrames - sdt);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2.5);
    this.breath = Math.min(100, this.breath + 30 * sdt);
    e.invuln = Math.max(0, e.invuln - sdt);
    e.counter = Math.max(0, e.counter - sdt);
    e.parry = Math.max(0, e.parry - sdt);
    e.flashT = Math.max(0, e.flashT - dt);
    if (e.flashT <= 0) e.flash = null;
    e.broken = Math.max(0, e.broken - sdt);
    e.envCd = Math.max(0, (e.envCd ?? 0) - sdt);
    e.tagCd = Math.max(0, e.tagCd - sdt);
    if ((e.combo ?? 0) > 0 && performance.now() > (e.chainUntil ?? 0)) e.combo = 0;
    e.lastMoveT = Math.max(0, e.lastMoveT - dt);
    if (e.lastMoveT <= 0) e.lastMove = null;
    // Concentración: se recupera siempre (más despacio con la guardia levantada).
    e.focus = Math.min(100, e.focus + (e.holding ? 8 : 18) * sdt);
    // Guardia tardía: levantarla al empezar la carga también cuenta como parada.
    if (e.holding && !frozen && e.lunging > 0.25 && e.focus > 0 && e.parry <= 0 && e.guarding < 0.5) {
      e.parry = 0.3;
    }
    if (e.holding && !frozen) e.guarding = 1;
    if (!e.holding) { e.guarding = Math.max(0, e.guarding - sdt * 6); e.guard = Math.min(e.def.guardBreak, e.guard + 0.35 * sdt); }
    if (e.broken > 0) {
      this.vel.x *= 1 - Math.min(1, sdt * 6);
      this.vel.z *= 1 - Math.min(1, sdt * 6);
    } else if (this.dashT > 0) this.dashT -= sdt;
    else {
      const slow = e.holding ? 0.45 : 1;
      const k = Math.min(1, 12 * sdt);
      this.vel.x += (wish.x * 7.6 * slow - this.vel.x) * k;
      this.vel.z += (wish.z * 7.6 * slow - this.vel.z) * k;
    }
    this.pos.x += this.vel.x * sdt;
    this.pos.z += this.vel.z * sdt;
    const toC = this.pos.clone().sub(e.center); toC.y = 0;
    const dC = toC.length();
    if (dC > e.radius) { toC.multiplyScalar(e.radius / dC); this.pos.x = e.center.x + toC.x; this.pos.z = e.center.z + toC.z; }
    this.collide();
    this.pushOutOfArenaCover(this.pos, 0.47);
    this.pos.y = terrainHeight(this.pos.x, this.pos.z) + HALF;
    const face = Math.atan2(e.pos.x - this.pos.x, e.pos.z - this.pos.z);
    const want = moving && this.dashT <= 0 ? Math.atan2(wish.x, wish.z) : face;
    let diff = want - this.yaw; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.yaw += diff * Math.min(1, sdt * 12);
    const planar = Math.hypot(this.vel.x, this.vel.z);
    this.runPhase += sdt * (3 + planar * 1.1);
    animateHumanoid(this.player, this.runPhase, Math.min(1, planar / 7.6), true, this.slashT > 0 ? 1 - this.slashT / 0.26 : -1);
    this.player.group.position.set(this.pos.x, this.pos.y - HALF, this.pos.z);
    this.player.group.rotation.y = this.yaw;
    this.player.body.visible = !(this.iFrames > 0 && e.invuln <= 0 && Math.floor(this.iFrames * 16) % 2 === 0);
    this.player.body.rotation.x = e.guarding > 0.5 ? -0.18 : e.broken > 0 ? 0.25 : 0;

    const toP = this.pos.clone().sub(e.pos); toP.y = 0;
    const dist = toP.length() || 0.001;
    const dir = toP.clone().divideScalar(dist);
    e.phase += sdt * 6;
    if (e.lunging > 0) {
      e.lunging -= sdt;
      e.lungeDir.lerp(dir, Math.min(1, sdt * 3.5)).normalize();
      e.pos.addScaledVector(e.lungeDir, def.lungeSpeed * personality.lungeFactor * sdt);
      animateHumanoid(e.human, e.phase, 1, true, 1 - Math.max(0, e.lunging) / 0.45);
      if (e.hitCd <= 0 && dist < 1.9 && !this.arenaBlocked(e.pos, this.pos)) {
        e.hitCd = 0.6;
        const chargeTime = def.lungeSpeed > 0 ? Math.max(0.01, 1 - e.lunging / 0.45) : 1;
        if (e.invuln > 0) {
          // Esquiva limpia: ganas un instante de contraataque.
          e.perfect = 0.6;
          e.counter = 1.25;
          e.flash = "perfect"; e.flashT = 0.8;
          this.tone(900, 1400, 0.12, "sine", 0.08);
          this.burst(this.pos.clone().add(new THREE.Vector3(0, 1, 0)), 14, new THREE.Color("#dff2ff"), 4, 1);
        } else if (e.parry > 0) {
          // Parada perfecta: cuesta concentración, pero deja al oponente abierto.
          e.parry = 0;
          e.focus = Math.max(0, e.focus - 14);
          if (e.focus <= 0) {
            e.guard = Math.max(0, e.guard - 1);
            if (e.guard <= 0) { e.broken = 1.1; e.guarding = 0; e.flash = "break"; e.flashT = 1.4; this.shake = 0.7; this.tone(140, 60, 0.4, "sawtooth", 0.12); }
          }
          e.flash = "parry"; e.flashT = 1.2;
          e.counter = 1.6;
          e.recover = Math.max(e.recover, 1.4);
          e.meter = Math.min(def.goal, e.meter + 4);
          this.shake = 0.3;
          this.tone(1200, 1800, 0.18, "triangle", 0.1);
          this.burst(e.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 26, new THREE.Color("#fff2b0"), 6, 2);
        } else if (e.guarding > 0.5 && e.focus > 0) {
          // Bloqueo normal: reduce el daño, pero cuesta concentración y guardia.
          e.guard -= 1;
          e.focus = Math.max(0, e.focus - 26);
          e.flash = "break"; e.flashT = 0.7;
          const chip = Math.max(1, Math.floor(def.damage / 2));
          e.hp -= chip;
          this.iFrames = 0.7; this.hitFlash = 0.6; this.shake = 0.35;
          this.vel.x += dir.x * 5; this.vel.z += dir.z * 5;
          this.tone(420, 240, 0.12, "square", 0.08);
          this.burst(this.pos.clone().add(new THREE.Vector3(0, 1, 0)), 12, new THREE.Color("#cfe0ff"), 4, 1);
          if (e.hp <= 0) { this.finishEncounter(false); return; }
          if (e.guard <= 0) {
            // Guardia rota: quedas abierto y sin concentración.
            e.broken = 1.1;
            e.focus = 0;
            e.guarding = 0;
            e.flash = "break"; e.flashT = 1.4;
            this.shake = 0.7;
            this.tone(140, 60, 0.4, "sawtooth", 0.12);
          }
        } else {
          e.hp -= def.damage + (e.meter < def.goal * 0.2 ? 1 : 0);
          this.iFrames = 1.0; this.hitFlash = 1; this.shake = 0.6;
          e.flash = "hit"; e.flashT = 0.8;
          this.vel.x += dir.x * 11; this.vel.z += dir.z * 11;
          this.tone(200, 60, 0.25, "square", 0.12);
          this.burst(this.pos.clone(), 18, new THREE.Color("#ff4d4d"), 6, 2);
          if (e.hp <= 0) { this.finishEncounter(false); return; }
        }
        void chargeTime;
      }
      if (e.lunging <= 0) e.recover = def.canAttack ? 1.1 : e.meter < def.goal * 0.2 ? 0.25 : 0.7;
    } else if (e.telegraph > 0) {
      e.telegraph -= sdt;
      animateHumanoid(e.human, e.phase, 0, true, -1);
      e.human.body.rotation.x = -0.25;
      if (e.telegraph <= 0) {
        e.lunging = 0.45;
        // Aguantar la guardia durante el aviso garantiza la parada al contacto.
        if (e.holding && e.focus > 0) e.parry = Math.max(def.parryWindow, 0.62);
        e.guard = Math.min(def.guardBreak, e.guard + (e.holding ? 0.4 : 2));
        e.lungeDir.copy(dir);
        e.human.body.rotation.x = 0;
        this.tone(def.id === "giyu" ? 700 : 300, 120, 0.18, "sawtooth", 0.07);
      }
    } else if (e.recover > 0) {
      e.recover -= sdt;
      animateHumanoid(e.human, e.phase, 0, true);
      e.pos.addScaledVector(dir, -0.6 * sdt);
    } else {
      const keep = personality.preferredRange;
      if (e.aiDecision <= 0) {
        e.aiDecision = personality.decisionEvery * (0.8 + Math.random() * 0.4);
        e.aiStrafe = Math.random() < 0.5 ? -1 : 1;
        if (Math.random() < personality.evadeChance) e.aiEvade = 0.65;
        if (Math.random() < personality.feintChance) e.aiFeint = 0.32;
      }
      if (dist > keep + 0.5) e.pos.addScaledVector(dir, personality.approachSpeed * sdt);
      else if (dist < keep - 0.6) e.pos.addScaledVector(dir, -personality.retreatSpeed * sdt);
      e.pos.addScaledVector(new THREE.Vector3(-dir.z, 0, dir.x), e.aiStrafe * personality.strafeSpeed * sdt);
      if (e.aiFeint > 0) e.human.body.rotation.x = -0.13;
      animateHumanoid(e.human, e.phase, 0.45, true);
      if (!e.words) e.nextAttack -= sdt;
      if (e.nextAttack <= 0 && !e.words) {
        e.attacks++;
        const rage = e.meter < def.goal * 0.3 ? 0.65 : 1;
        e.telegraph = def.telegraph * rage * personality.telegraphFactor;
        const [a, b] = def.attackEvery;
        e.nextAttack = (a + Math.random() * (b - a)) * rage * personality.attackIntervalFactor;
        if (e.attacks % def.wordsEvery === 0) {
          if (e.windowIdx >= def.windows.length) e.windowIdx = 0;
          const win = def.windows[e.windowIdx++];
          e.words = { win, timeLeft: def.wordTime };
          e.telegraph = 0;
          e.nextAttack = 1.2;
          e.slow = 1;
          this.tone(660, 990, 0.25, "triangle", 0.08);
        }
      }
    }
    e.aiDecision -= sdt;
    e.aiEvade = Math.max(0, e.aiEvade - sdt);
    e.aiFeint = Math.max(0, e.aiFeint - sdt);
    e.hitCd = Math.max(0, e.hitCd - sdt);
    e.perfect = Math.max(0, e.perfect - dt);
    const eC = e.pos.clone().sub(e.center); eC.y = 0;
    const eD = eC.length();
    if (eD > e.radius - 0.5) { eC.multiplyScalar((e.radius - 0.5) / eD); e.pos.x = e.center.x + eC.x; e.pos.z = e.center.z + eC.z; }
    this.pushOutOfArenaCover(e.pos, 0.48);
    e.pos.y = terrainHeight(e.pos.x, e.pos.z);
    e.human.group.position.copy(e.pos);
    e.yaw = Math.atan2(dir.x, dir.z);
    e.human.group.rotation.y = e.yaw;
    e.human.body.rotation.z = e.telegraph > 0 ? Math.sin(t * 40) * 0.05 : 0;
  }

  /* =========================== entrenamiento de Urokodaki =========================== */

  private startTraining(kind: "descent" | "boulder") {
    if (this.trn) return;
    const sag = ZONE_BY_ID.sagiri;
    const top = new THREE.Vector3(sag.x - 18, 0, sag.z - 30);
    top.y = terrainHeight(top.x, top.z) + HALF;
    const common = {
      t: 0, timeLeft: 0, hp: 6, hits: 0, message: null as string | null, msgT: 0,
      done: false, failed: false, endT: 0, top, traps: [] as { mesh: THREE.Mesh; x: number; z: number; phase: number; dir: THREE.Vector3; cd: number }[],
      boulder: null as THREE.Mesh | null, marker: 0, markerDir: 1, zoneStart: ROCK_TRAINING.beatStart, zoneEnd: ROCK_TRAINING.beatEnd, swingT: 0,
      agileCd: 0, agileFlash: 0, agileCount: 0, hitCd: 0, nextCheer: 9,
      focusTime: 0, focusCd: 0, focusHeld: false,
      markers: [] as THREE.Group[], rockPieces: [] as THREE.Mesh[], stationModels: [] as THREE.Object3D[], waveMesh: null as THREE.Mesh | null, threadMesh: null as THREE.Line | null,
      station: 0, stationHits: 0, stationTimer: 1.8, stationTelegraph: 0, stationTelegraphMax: 0, stationCombo: 0, stationComboTime: 0, stationComboReadyAt: 0, stationEnvUsed: false, stationNear: false,
      rockPhase: 0 as 0 | 1 | 2, rockCharge: 0, rockResistance: ROCK_TRAINING.maxResistance, rockParries: 0,
      waveTimer: 2.5, waveTelegraph: 0, rockCombo: 0, rockComboTime: 0, threadTime: 0, threadEAt: 0, rockHitReadyAt: 0,
    };
    if (kind === "descent") {
      this.trn = { ...common, kind, message: `${this.trainingDateLabel()}. Practica a tu ritmo: no hay límite global de tiempo. Cada estación enseña una técnica distinta.`, msgT: 7 };
      this.pos.copy(top);
      this.yaw = Math.atan2(sag.x - 2 - top.x, sag.z - 5 - top.z);
      this.camYaw = this.yaw + Math.PI;
      const hut = { x: sag.x - 2, z: sag.z - 5 };
      this.createTrainingMarkers(top, hut);
      this.createStationModels();
    } else {
      const bx = sag.x + 12, bz = sag.z - 6;
      const boulder = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), new THREE.MeshStandardMaterial({ color: "#68717e", roughness: 0.93, flatShading: true }));
      boulder.position.set(bx, terrainHeight(bx, bz) + 1.6, bz);
      boulder.castShadow = true;
      this.scene.add(boulder);
      const standX = bx - 3.2, standZ = bz + 1.5;
      this.pos.set(standX, terrainHeight(standX, standZ) + HALF, standZ);
      this.yaw = Math.atan2(bx - standX, bz - standZ);
      this.camYaw = this.yaw + Math.PI;
      const waveMesh = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.0, 48), new THREE.MeshBasicMaterial({ color: "#88dfff", transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }));
      waveMesh.rotation.x = -Math.PI / 2;
      waveMesh.position.copy(boulder.position).add(new THREE.Vector3(0, -1.47, 0));
      this.scene.add(waveMesh);
      this.trn = { ...common, kind, timeLeft: 0, hp: 6, top: this.pos.clone(), boulder, waveMesh, message: "Mantén E para llenar la Respiración Total. Para la onda con F; luego encadena cuatro J al pulso.", msgT: 7 };
    }
    this.vel.set(0, 0, 0);
    this.grounded = true;
    this.clearInput();
    this.safe.copy(this.pos);
    for (const follower of this.followers) follower.pos.copy(this.pos);
    this.player.group.position.set(this.pos.x, this.pos.y - HALF, this.pos.z);
    this.refreshCast();
    this.pushHud();
  }

  private trainingStationCenter(index: number) {
    const tr = this.trn;
    const sag = ZONE_BY_ID.sagiri;
    const top = tr?.top ?? new THREE.Vector3(sag.x - 18, 0, sag.z - 30);
    if (index >= SAGIRI_STATIONS.length) {
      // El sendero llega por detrás; la meta queda en el lateral exterior, sin atravesar la cabaña.
      const x = sag.x - 7, z = sag.z - 2.5;
      return new THREE.Vector3(x, terrainHeight(x, z), z);
    }
    const hut = new THREE.Vector3(sag.x - 2, 0, sag.z - 5);
    const fraction = trainingStation(index).fraction;
    const x = THREE.MathUtils.lerp(top.x, hut.x, fraction);
    const z = THREE.MathUtils.lerp(top.z, hut.z, fraction);
    return new THREE.Vector3(x, terrainHeight(x, z), z);
  }

  private createTrainingMarkers(top: THREE.Vector3, hut: { x: number; z: number }) {
    const tr = this.trn;
    if (!tr || tr.kind !== "descent") return;
    const fractions = [0.18, 0.39, 0.62, 0.82, 1];
    fractions.forEach((fraction, index) => {
      const x = index === 4 ? ZONE_BY_ID.sagiri.x - 7 : THREE.MathUtils.lerp(top.x, hut.x, fraction);
      const z = index === 4 ? ZONE_BY_ID.sagiri.z - 2.5 : THREE.MathUtils.lerp(top.z, hut.z, fraction);
      const marker = new THREE.Group();
      marker.name = index < 4 ? `sagiri-station-${index + 1}` : "sagiri-finish";
      marker.userData.fraction = fraction;
      marker.position.set(x, terrainHeight(x, z) + 0.12, z);
      const golden = index === 4;
      const color = golden ? "#ffe3a2" : "#8be4ff";
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.085, 6, 26), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.92, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.30, 3.1, 8, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false, depthTest: false }));
      beam.position.y = 1.55;
      const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.65, 6), new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false }));
      pointer.rotation.x = Math.PI;
      pointer.position.y = 2.7;
      beam.renderOrder = 15; pointer.renderOrder = 16;
      marker.add(ring, beam, pointer);
      this.scene.add(marker);
      tr.markers.push(marker);
    });
  }

  private createStationModels() {
    const tr = this.trn;
    if (!tr || tr.kind !== "descent") return;
    const wood = new THREE.MeshStandardMaterial({ color: "#594029", roughness: 0.9 });
    const bamboo = new THREE.MeshStandardMaterial({ color: "#638850", roughness: 0.85 });
    const straw = new THREE.MeshStandardMaterial({ color: "#b59f73", roughness: 0.9 });
    const add = (object: THREE.Object3D, station: number, x: number, z: number, y = 0) => {
      object.userData.station = station;
      object.position.set(x, terrainHeight(x, z) + y, z);
      this.scene.add(object);
      tr.stationModels.push(object);
      return object;
    };
    const first = this.trainingStationCenter(0);
    const path = this.trainingStationCenter(3).sub(first.clone()).setY(0).normalize();
    const side = new THREE.Vector3(path.z, 0, -path.x);
    for (let i = 0; i < 2; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 5.5, 10), wood);
      log.castShadow = true;
      log.rotation.z = Math.PI / 2;
      const base = first.clone().addScaledVector(path, (i - 0.5) * 2.2).addScaledVector(side, i === 0 ? 1.1 : -1.1);
      const node = add(log, 0, base.x, base.z, 1.2) as THREE.Mesh;
      tr.traps.push({ mesh: node, x: base.x, z: base.z, phase: i * 1.7, dir: side.clone(), cd: 0 });
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 3.2, 5), straw);
      rope.position.set(0, 2.0, 0);
      log.add(rope);
    }
    const second = this.trainingStationCenter(1);
    for (let i = 0; i < 3; i++) {
      const missile = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.2, 9), bamboo);
      missile.rotation.z = Math.PI / 2;
      missile.castShadow = true;
      const point = second.clone().addScaledVector(side, (i - 1) * 1.5);
      add(missile, 1, point.x, point.z, 1.2);
    }
    const dummy = (x: number, z: number, station: number) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 1.6, 8), bamboo);
      body.position.y = 1.1; body.castShadow = true;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 7), straw);
      head.position.y = 2.05; head.castShadow = true;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.13, 0.17), wood);
      arm.position.y = 1.45; arm.castShadow = true;
      g.add(body, head, arm);
      add(g, station, x, z);
    };
    const third = this.trainingStationCenter(2);
    for (let i = -1; i <= 1; i++) dummy(third.x + side.x * i * 1.7, third.z + side.z * i * 1.7, 2);
    const fourth = this.trainingStationCenter(3);
    const gate = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 7.5, 12), wood);
    gate.rotation.z = Math.PI / 2; gate.castShadow = true;
    add(gate, 3, fourth.x, fourth.z, 1.05);
    dummy(fourth.x + side.x * 2.2, fourth.z + side.z * 2.2, 3);
    dummy(fourth.x - side.x * 2.2, fourth.z - side.z * 2.2, 3);
  }

  /** Acciones de las cuatro estaciones del descenso. */
  private stationAction(action: "dodge" | "parry" | "combo" | "environment" | "tag") {
    const tr = this.trn;
    if (!tr || tr.kind !== "descent" || tr.done || tr.failed || this.paused || this.blocked || this.hold || this.dialogue || tr.station >= SAGIRI_STATIONS.length) return false;
    const center = this.trainingStationCenter(tr.station);
    if (Math.hypot(this.pos.x - center.x, this.pos.z - center.z) > 7) {
      tr.message = `Acércate al marcador ${tr.station + 1}: ${trainingStation(tr.station).name}.`;
      tr.msgT = 2;
      this.pushHud();
      return false;
    }
    const announce = (text: string, color = "#99e9ff", amount = 12) => {
      tr.message = text; tr.msgT = 2.4;
      this.burst(this.pos.clone().add(new THREE.Vector3(0, 0.7, 0)), amount, new THREE.Color(color), 5, 1.5);
      this.tone(520, 870, 0.19, "triangle", 0.09);
      this.pushHud();
    };
    if (stationMechanic(tr.station) === 0 && action === "dodge") {
      if (!withinWindow(tr.stationTelegraph, 0.36) || tr.agileCd > 0) {
        announce("Espera a que el tronco esté a punto de alcanzarte. ¡Esquiva en el último instante!", "#9fb8d3", 4);
        return false;
      }
      tr.stationTelegraph = 0; tr.stationTimer = 1.55;
      tr.stationHits++; tr.agileCount++; tr.agileCd = 0.7; tr.agileFlash = 1.2;
      this.iFrames = Math.max(this.iFrames, 0.75);
      this.breath = Math.min(100, this.breath + 25);
      const sag = ZONE_BY_ID.sagiri;
      const hut = new THREE.Vector3(sag.x - 2, 0, sag.z - 5);
      const down = hut.clone().sub(this.pos).setY(0).normalize();
      // Impulso de +15 % de la longitud del sendero, sin atravesar las colisiones del mundo.
      const distance = Math.hypot(tr.top.x - hut.x, tr.top.z - hut.z) * 0.15;
      for (let i = 0; i < 10; i++) { this.pos.addScaledVector(down, distance / 10); this.collide(); }
      this.pos.y = terrainHeight(this.pos.x, this.pos.z) + HALF + 0.35;
      this.vel.set(down.x * 12, 1.2, down.z * 12);
      this.player.group.position.set(this.pos.x, this.pos.y - HALF, this.pos.z);
      announce(`¡Esquiva Ágil! Paso de Bruma +15 % · ${tr.stationHits}/${trainingStation(0).required} · aliento recuperado.`, "#a2eaff", 26);
      if (tr.stationHits >= trainingStation(0).required) this.nextTrainingStation();
      return true;
    }
    if (stationMechanic(tr.station) === 1 && action === "parry") {
      if (!withinWindow(tr.stationTelegraph, 0.38)) {
        announce("Espera el destello del bambú. ¡Pulsa F justo antes del impacto!", "#e7c27c", 4);
        return false;
      }
      tr.stationTelegraph = 0; tr.stationTimer = 1.4;
      tr.stationHits++; this.iFrames = Math.max(this.iFrames, 0.5);
      this.breath = Math.min(100, this.breath + 10);
      this.shake = Math.max(this.shake, 0.25);
      announce(`¡Parada perfecta! Bambú desviado (${tr.stationHits}/3).`, "#f6d986", 22);
      if (tr.stationHits >= trainingStation(tr.station).required) this.nextTrainingStation();
      return true;
    }
    if (stationMechanic(tr.station) === 2 && action === "combo") {
      const now = performance.now();
      if (now < tr.stationComboReadyAt) return false;
      if (tr.stationComboTime <= 0) tr.stationCombo = 0;
      tr.stationComboReadyAt = now + 180;
      tr.stationCombo = Math.min(4, tr.stationCombo + 1);
      tr.stationHits = tr.stationCombo;
      tr.stationComboTime = 3.0;
      this.slashT = 0.26;
      this.boulderSlashArc(center.clone().add(new THREE.Vector3(0, 1.25, 0)));
      announce(tr.stationCombo >= 4 ? "¡Combo completo! Pulsa E para rematar usando el terreno." : `Corte ${tr.stationCombo}/4 · sigue con J al ritmo.`, "#a8dcff", 12 + tr.stationCombo * 4);
      return true;
    }
    if (stationMechanic(tr.station) === 2 && action === "environment") {
      if (tr.stationCombo < 4 || tr.stationComboTime <= 0) {
        announce("Primero encadena cuatro golpes J. Después usa E para rematar.", "#f2c99a", 4);
        return false;
      }
      tr.stationHits = 5; tr.stationEnvUsed = true;
      this.shake = 0.4;
      announce("¡Remate de entorno! Desvías el último golpe contra el poste de bambú.", "#93e8cb", 36);
      this.nextTrainingStation();
      return true;
    }
    if (stationMechanic(tr.station) === 3 && action === "tag") {
      if (!withinWindow(tr.stationTelegraph, 0.46)) {
        announce("Espera la señal del tronco gigante. ¡Entonces releva con Tab o C!", "#ffe2aa", 4);
        return false;
      }
      tr.stationHits = 1; tr.stationTelegraph = 0;
      this.iFrames = Math.max(this.iFrames, 1.2);
      this.shake = 0.6;
      this.boulderSlashArc(center.clone().add(new THREE.Vector3(0, 1.15, 0)));
      this.burst(center.clone().add(new THREE.Vector3(0, 1.2, 0)), 60, new THREE.Color("#a2eaff"), 9, 3);
      const tanjiro = this.followers.find((f) => f.def.id === "f_tanjiro");
      if (tanjiro) {
        tanjiro.pos.copy(center).add(new THREE.Vector3(1.2, 0, 0.4));
        tanjiro.human.group.position.copy(tanjiro.pos);
        animateHumanoid(tanjiro.human, this.runPhase, 1, true, 0.75);
      }
      announce("¡Corte doble sincronizado! El tronco cede. Corre hasta la cabaña con Tanjiro.", "#ffe5ab", 40);
      this.nextTrainingStation();
      return true;
    }
    return false;
  }

  // Progreso paralelo de los aprendices: se calcula al completar cada estación,
  // tomando en cuenta los errores del protagonista y la especialidad de cada compañero.
  private companionTraining = { tanjiro: 0, makomo: 0, sabito: 0, player: 0 };
  // Los intentos son por disciplina; el tiempo narrativo cuenta desde que se inicia.
  private trainingAttempts = Array(15).fill(1) as number[];
  private trainingStageStarted = 1;
  private trainingPraise(station: number) {
    const tries = this.trainingAttempts[station] ?? 1;
    const days = Math.max(0, this.trainingDay - this.trainingStageStarted);
    const score = tries + Math.floor(days / 4);
    const name = this.name.first || "compañero";
    const tanjiro = score <= 5
      ? `Tanjiro: «¡Vaya, ${name}! Aprendes muy rápido. ¡Me alegra entrenar contigo!»`
      : score <= 9
      ? `Tanjiro: «Vamos por buen camino, ${name}. Sigamos practicando.»`
      : `Tanjiro: «¡Ánimo, ${name}! Te estás quedando atrás. No puedo proteger yo solo a Nezuko; recuerda tu promesa.»`;
    const makomo = score <= 5
      ? `Makomo: «Eso a mí me tomó mucho más tiempo, ${name}. Me impresiona cómo lo has conseguido.»`
      : score <= 9
      ? `Makomo: «A mí me llevó un tiempo parecido. Cada uno aprende a su ritmo.»`
      : `Makomo: «Te entiendo. Yo también me estanqué en esta parte. Podemos practicar juntos.»`;
    this.onEvent("toast", tanjiro);
    // Segunda reacción disponible como mensaje del propio entrenamiento.
    if (this.trn) { this.trn.message = makomo; this.trn.msgT = 8; }
  }

  private updateCompanionTraining(station: number, remainingHp: number) {
    const performance = Math.max(0, Math.min(1, remainingHp / 6));
    this.companionTraining.player += 1 + performance;
    // Tanjiro destaca en resistencia, Makomo en precisión. Sabito tiene más experiencia.
    const tanjiroGain = [1.65, 1.15, 1.25, 1.5, 1.3][station % 5];
    const makomoGain = [0.85, 1.75, 1.5, 0.95, 1.8][station % 5];
    this.companionTraining.tanjiro += tanjiroGain;
    this.companionTraining.makomo += makomoGain;
    this.companionTraining.sabito += 1.8;
    const compare = (name: "tanjiro" | "makomo") => {
      const delta = this.companionTraining[name] - this.companionTraining.player;
      return `${name === "tanjiro" ? "Tanjiro" : "Makomo"} ${delta > 0.3 ? "va por delante" : delta < -0.3 ? "necesita más práctica" : "avanza a tu ritmo"}`;
    };
    const scenes = [
      "Tanjiro practica la subida por otro sendero; sus piernas tiemblan, pero no se detiene.",
      "Makomo repite una postura hasta que sus pies dejan de resbalar. «Todavía no me sale».",
      "Sabito corrige a Makomo desde lejos: «No quiero que te hieras. Descansa y vuelve a intentarlo».",
      "Al caer la tarde, Tanjiro y Makomo continúan sus propias rutinas de entrenamiento."
    ];
    this.onEvent("toast", `Día de práctica ${station + 1} · ${scenes[station % scenes.length]} ${compare("tanjiro")}; ${compare("makomo")}.`);
  }

  private nextTrainingStation() {
    const tr = this.trn;
    if (!tr || tr.kind !== "descent") return;
    this.completeSideQuest(tr.station);
    this.playerXp += Math.round(30 * this.nezukoMultiplier("learning"));
    this.trainingPraise(tr.station);
    this.updateCompanionTraining(tr.station, tr.hp);
    this.consumeNezukoTraining();
    this.advanceTrainingDays([3, 4, 5, 3, 4][tr.station % 5] + Math.floor(tr.station / 5) * 2);
    tr.station++;
    this.updateTrainingPhysiques();
    this.trainingStageStarted = this.trainingDay;
    tr.stationHits = 0;
    tr.stationTimer = 1.7;
    tr.stationTelegraph = 0;
    tr.stationTelegraphMax = 0;
    tr.stationCombo = 0;
    tr.stationComboTime = 0;
    tr.stationNear = false;
    const name = tr.station < SAGIRI_STATIONS.length ? trainingStation(tr.station).name : "Llegada a la cabaña";
    this.onEvent("toast", `✦ ${name} · ${this.trainingDateLabel()}`);
    this.pushHud();
  }

  private failTrainingHazard(label: string) {
    const tr = this.trn;
    if (!tr || tr.kind !== "descent" || this.iFrames > 0 || tr.hitCd > 0) return;
    tr.hp--;
    this.trainingAttempts[tr.station] = (this.trainingAttempts[tr.station] ?? 1) + 1;
    tr.hitCd = 1.1;
    this.iFrames = 1.1;
    this.hitFlash = 0.8;
    this.shake = 0.48;
    const topward = tr.top.clone().sub(this.pos).setY(0).normalize();
    this.pos.addScaledVector(topward, 1.3);
    this.vel.set(topward.x * 8, 2, topward.z * 8);
    tr.message = tr.hp > 0 ? `${label} — Pierdes 1 vida de entrenamiento. Te quedan ${tr.hp}/6.` : "Urokodaki te recoge. «Levántate y vuelve a empezar.»";
    tr.msgT = 3.3;
    this.tone(180, 60, 0.26, "square", 0.11);
    this.burst(this.pos.clone(), 18, new THREE.Color("#f9a9a4"), 5, 1.5);
    if (tr.hp <= 0) tr.failed = true;
    this.pushHud();
  }

  /** En la roca, E canaliza el aire; durante el Hilo de Apertura sirve de primer botón de E+J. */
  focusBoulder() { this.setTrainingFocus(true); }

  setTrainingFocus(held: boolean) {
    const tr = this.trn;
    if (!tr || tr.kind !== "boulder" || tr.done || tr.failed || this.paused || this.blocked || this.hold || this.dialogue) return;
    if (!held) { tr.focusHeld = false; this.pushHud(); return; }
    if (tr.rockPhase === 2 && tr.threadTime > 0) {
      tr.threadEAt = performance.now();
      tr.focusHeld = true;
      tr.message = "Hilo de Apertura: ¡J ahora!";
      tr.msgT = 0.8;
      this.pushHud();
      return;
    }
    tr.focusHeld = true;
    tr.focusTime = 3;
    tr.message = tr.rockPhase === 0 ? "Inspira. Mantén E para cargar la Respiración Total." : "Concentración Total: el pulso se vuelve más lento.";
    tr.msgT = 2.3;
    this.tone(460, 890, 0.35, "sine", 0.08);
    this.pushHud();
  }

  private rockParry() {
    const tr = this.trn;
    if (!tr || tr.kind !== "boulder" || tr.done || tr.failed) return;
    if (!withinWindow(tr.waveTelegraph, ROCK_TRAINING.parryWindow)) {
      tr.message = "No anticipes la onda. Pulsa F cuando el halo azul esté a punto de tocarte.";
      tr.msgT = 2;
      this.pushHud();
      return;
    }
    tr.waveTelegraph = 0;
    tr.waveTimer = 4.3;
    tr.rockParries++;
    tr.rockCharge = Math.min(ROCK_TRAINING.chargeTarget, tr.rockCharge + 16);
    this.iFrames = Math.max(this.iFrames, 0.6);
    this.breath = Math.min(100, this.breath + 18);
    this.shake = 0.3;
    tr.message = `¡Parada perfecta! Ondas desviadas: ${tr.rockParries}.`;
    tr.msgT = 2;
    this.burst(this.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 26, new THREE.Color("#9ae9ff"), 6, 1.6);
    this.tone(880, 1500, 0.2, "triangle", 0.09);
    if (tr.rockPhase === 1 && tr.rockCombo >= ROCK_TRAINING.comboLength) this.openRockThread();
    this.pushHud();
  }

  private openRockThread() {
    const tr = this.trn;
    if (!tr || tr.kind !== "boulder" || tr.rockPhase === 2 || tr.done) return;
    tr.rockPhase = 2;
    tr.threadTime = ROCK_TRAINING.threadSeconds;
    tr.threadEAt = 0;
    tr.focusHeld = false;
    tr.waveTelegraph = 0;
    tr.message = "¡Hilo de Apertura! E + J dentro de 0,8 segundos.";
    tr.msgT = 0.9;
    const p = this.pos.clone().add(new THREE.Vector3(0.24, 0.9, 0));
    const q = tr.boulder!.position.clone();
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p, q]), new THREE.LineBasicMaterial({ color: "#bff4ff", transparent: true, opacity: 0.95 }));
    this.scene.add(line);
    tr.threadMesh = line;
    this.tone(970, 1320, 0.25, "sine", 0.1);
    this.pushHud();
  }

  private clearRockThread() {
    const tr = this.trn;
    if (!tr?.threadMesh) return;
    this.scene.remove(tr.threadMesh);
    tr.threadMesh.geometry.dispose();
    (tr.threadMesh.material as THREE.Material).dispose();
    tr.threadMesh = null;
  }

  /** Acciones táctiles y de prueba: comparten las reglas de teclado. */
  pressAgile() { this.stationAction("dodge"); }
  pressTrainingParry() { if (this.trn?.kind === "descent") this.stationAction("parry"); else if (this.trn?.kind === "boulder") this.rockParry(); }
  pressTrainingTag() { this.stationAction("tag"); }
  pressTrainingAttack() { this.attack(); }
  pressTrainingEnvironment() { this.interact(); }

  private endTraining() {
    const tr = this.trn;
    if (!tr) return;
    this.clearRockThread();
    const seen = new Set<THREE.Material>();
    const disposeObject = (object: THREE.Object3D) => {
      this.scene.remove(object);
      object.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          if (!seen.has(material)) { material.dispose(); seen.add(material); }
        }
      });
    };
    tr.markers.forEach(disposeObject);
    tr.stationModels.forEach(disposeObject);
    tr.rockPieces.forEach(disposeObject);
    if (tr.waveMesh) disposeObject(tr.waveMesh);
    if (tr.boulder) disposeObject(tr.boulder);
    this.trn = null;
    this.player.body.rotation.x = 0;
  }

  private boulderSlashArc(center: THREE.Vector3) {
    const geometry = new THREE.TorusGeometry(1.65, 0.11, 6, 30, Math.PI * 1.4);
    geometry.rotateX(Math.PI / 2);
    const arc = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: "#7ce2ff", transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    arc.position.copy(center).add(new THREE.Vector3(0, 0.35, 0));
    arc.rotation.y = this.yaw;
    arc.userData.stationary = true;
    this.scene.add(arc);
    this.arcs.push({ mesh: arc, life: 0.26, yaw: this.yaw });
  }

  /** Ritmo de cuatro cortes y, durante el hilo azul, tajo final E + J. */
  private boulderSwing() {
    const tr = this.trn;
    if (!tr || tr.kind !== "boulder" || tr.done || tr.failed || this.paused || this.blocked || this.hold || this.dialogue) return;
    if (tr.rockPhase === 2) {
      const now = performance.now();
      if (!threadIsOpen(tr.threadTime, tr.threadEAt, now, tr.focusHeld)) {
        tr.message = "Pulsa E y enseguida J mientras brilla el Hilo de Apertura.";
        tr.msgT = 1.6;
        this.pushHud();
        return;
      }
      this.clearRockThread();
      tr.threadTime = 0;
      tr.rockResistance = 0;
      tr.hits = 3;
      tr.done = true;
      tr.endT = 2.1;
      tr.message = "¡Tajo Definitivo! La roca se parte en dos.";
      tr.msgT = 3;
      this.slashT = 0.26;
      this.boulderSlashArc(tr.boulder!.position);
      const rock = tr.boulder!;
      rock.visible = false;
      for (const dir of [-1, 1]) {
        const piece = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), new THREE.MeshStandardMaterial({ color: "#68717e", roughness: 1, flatShading: true }));
        piece.position.copy(rock.position).add(new THREE.Vector3(dir * 1.55, -0.2, dir * 0.2));
        piece.rotation.z = dir * -0.35;
        piece.castShadow = true;
        this.scene.add(piece);
        tr.rockPieces.push(piece);
      }
      this.burst(rock.position.clone(), 110, new THREE.Color("#79dfff"), 11, 4);
      this.tone(120, 45, 0.85, "sawtooth", 0.14);
      this.shake = 0.65;
      this.pushHud();
      return;
    }
    if (tr.rockPhase === 0) {
      tr.message = "Mantén E para cargar la Respiración de Concentración Total antes de cortar.";
      tr.msgT = 1.8;
      this.pushHud();
      return;
    }
    const now = performance.now();
    if (now < tr.rockHitReadyAt) return;
    tr.rockHitReadyAt = now + 270;
    tr.swingT = 0.3;
    this.slashT = 0.26;
    if (!beatIsClean(tr.marker, tr.focusTime > 0)) {
      tr.rockCharge = Math.max(35, tr.rockCharge - 6);
      tr.message = "Tu espada roza la piedra. Sigue el latido: espera a que la marca cruce la zona luminosa.";
      tr.msgT = 2;
      this.tone(220, 90, 0.16, "square", 0.06);
      this.pushHud();
      return;
    }
    if (tr.rockComboTime <= 0) tr.rockCombo = 0;
    tr.rockCombo++;
    tr.rockComboTime = ROCK_TRAINING.comboSeconds;
    tr.hits = tr.rockCombo;
    tr.rockResistance = Math.max(22, tr.rockResistance - 16);
    tr.message = `¡Corte al pulso! ${tr.rockCombo}/4 · Resistencia Pétrea ${tr.rockResistance}/100.`;
    tr.msgT = 2.3;
    this.boulderSlashArc(tr.boulder!.position);
    this.burst(tr.boulder!.position.clone(), 25 + tr.rockCombo * 5, new THREE.Color("#77d8ff"), 7, 2);
    this.tone(670 + tr.rockCombo * 80, 1100 + tr.rockCombo * 80, 0.16, "sine", 0.08);
    this.shake = 0.24;
    if (tr.rockCombo >= ROCK_TRAINING.comboLength) {
      if (tr.rockParries >= ROCK_TRAINING.parriesRequired) this.openRockThread();
      else { tr.message = "Cuatro cortes limpios. Ahora para una onda con F para revelar el Hilo de Apertura."; tr.msgT = 4; }
    }
    this.pushHud();
  }

  private updateTraining(dt: number, time: number) {
    const tr = this.trn;
    if (!tr || this.paused || this.hold || this.dialogue || this.blocked) return;
    tr.t += dt;
    tr.agileCd = Math.max(0, tr.agileCd - dt);
    tr.agileFlash = Math.max(0, tr.agileFlash - dt);
    tr.hitCd = Math.max(0, tr.hitCd - dt);
    tr.focusTime = Math.max(0, tr.focusTime - dt);
    tr.focusCd = Math.max(0, tr.focusCd - dt);
    tr.swingT = Math.max(0, tr.swingT - dt);
    if (tr.msgT > 0) { tr.msgT -= dt; if (tr.msgT <= 0) tr.message = null; }
    if (tr.done) {
      if (tr.kind === "boulder") tr.rockPieces.forEach((piece, index) => { piece.rotation.z += (index ? 1 : -1) * dt * 0.6; piece.position.x += (index ? 1 : -1) * dt * 0.32; });
      tr.endT -= dt;
      if (tr.endT <= 0) {
        const step = this.currentStep();
        const after = step?.after ?? [];
        if (tr.kind === "boulder" && after.includes("c1_night_care")) {
          const resting = NPCS.find((npc) => npc.id === "nezuko_sleeping");
          if (resting) {
            this.pos.set(resting.x, terrainHeight(resting.x, resting.z + 2.1) + HALF, resting.z + 2.1);
            this.vel.set(0, 0, 0);
            this.safe.copy(this.pos);
            this.player.group.position.set(this.pos.x, this.pos.y - HALF, this.pos.z);
            for (const follower of this.followers) follower.pos.copy(this.pos);
          }
        }
        this.endTraining();
        if (after.length) this.playNodes(after, MISSIONS[this.missionIdx].title, () => this.completeStep());
        else this.completeStep();
      }
      return;
    }
    if (tr.failed) return;
    if (tr.kind === "descent") {
      for (const model of tr.stationModels) {
        const stage = model.userData.station as number;
        model.visible = stage === tr.station;
        if (stage === 0 && stationMechanic(tr.station) === 0 && model instanceof THREE.Mesh) {
          const phase = tr.traps.find((trap) => trap.mesh === model)?.phase ?? 0;
          const trap = tr.traps.find((entry) => entry.mesh === model);
          if (trap) model.position.set(trap.x + trap.dir.x * Math.sin(time * 4.2 + phase) * 2.0, terrainHeight(trap.x, trap.z) + 1.25, trap.z + trap.dir.z * Math.sin(time * 4.2 + phase) * 2.0);
          model.rotation.z = Math.PI / 2 + Math.sin(time * 4.2 + phase) * 0.32;
        }
        if (stage === 1 && stationMechanic(tr.station) === 1 && model instanceof THREE.Mesh) {
          const telegraph = tr.stationTelegraphMax > 0 ? 1 - tr.stationTelegraph / tr.stationTelegraphMax : 0;
          model.position.x += Math.sin(time * 4 + model.id) * dt * 0.2;
          model.rotation.z = Math.PI / 2 + telegraph * 0.15;
        }
      }
      tr.markers.forEach((marker, index) => {
        marker.visible = index === (tr.station >= SAGIRI_STATIONS.length ? 4 : [0, 1, 2, 3, 0][tr.station % 5]);
        if (marker.visible) marker.scale.setScalar(marker.visible ? 1.12 + Math.sin(time * 3) * 0.08 : 0.8);
      });
      if (tr.nextCheer <= 0) {
        const cheers = ["Tanjiro: «¡Por aquí! ¡Observa el ritmo!»", "Tanjiro: «¡Bien! Respiro contigo. Sigamos juntos.»", "Tanjiro: «¡La cabaña está cerca! ¡No te rindas ahora!»"];
        if (!tr.message) { tr.message = cheers[Math.floor(tr.t / 12) % cheers.length]; tr.msgT = 3; }
        tr.nextCheer = 12;
      }
      tr.nextCheer -= dt;
      const center = this.trainingStationCenter(tr.station);
      tr.stationNear = Math.hypot(this.pos.x - center.x, this.pos.z - center.z) < 7;
      if (tr.station >= SAGIRI_STATIONS.length) {
        const hut = this.trainingStationCenter(SAGIRI_STATIONS.length);
        if (Math.hypot(this.pos.x - hut.x, this.pos.z - hut.z) < 2.8) { tr.done = true; tr.endT = 1.2; tr.message = "¡Circuito superado! Urokodaki te espera en la cabaña."; tr.msgT = 2; this.tone(523, 1046, 0.4, "triangle", 0.12); }
        return;
      }
      if (stationMechanic(tr.station) === 2) {
        tr.stationComboTime = Math.max(0, tr.stationComboTime - dt);
        if (tr.stationComboTime <= 0 && tr.stationCombo > 0) {
          tr.stationCombo = 0; tr.stationHits = 0; tr.message = "La postura se ha enfriado. Reinicia la cadena J · J · J · J."; tr.msgT = 2.5;
        }
        return;
      }
      if (!tr.stationNear) { tr.stationTelegraph = 0; tr.stationTimer = Math.max(0.65, tr.stationTimer); return; }
      if (tr.stationTelegraph > 0) {
        tr.stationTelegraph -= dt;
        if (tr.stationTelegraph <= 0) {
          tr.stationTelegraph = 0;
          if (stationMechanic(tr.station) === 0) this.failTrainingHazard("El tronco pendular te ha alcanzado");
          else if (stationMechanic(tr.station) === 1) {
            if (this.keys.has("guard")) { tr.message = "La guardia detiene el bambú, pero solo una parada perfecta rompe la trampa."; tr.msgT = 2.2; }
            else this.failTrainingHazard("El bambú te golpea desde la niebla");
          } else this.failTrainingHazard("El tronco gigante os obliga a retroceder");
          tr.stationTimer = stationMechanic(tr.station) === 3 ? 1.8 : 1.45;
        }
      } else {
        tr.stationTimer -= dt;
        if (tr.stationTimer <= 0) { tr.stationTelegraphMax = stationMechanic(tr.station) === 0 ? 0.85 : stationMechanic(tr.station) === 1 ? 0.75 : 0.9; tr.stationTelegraph = tr.stationTelegraphMax; }
      }
      return;
    }
    // Roca: presión periódica, carga de respiración, cuatro golpes al pulso e hilo final.
    const rock = tr.boulder!;
    if (tr.waveMesh) {
      const active = tr.waveTelegraph > 0;
      const phase = active ? 1 - tr.waveTelegraph / ROCK_TRAINING.pressureTelegraph : 0;
      tr.waveMesh.visible = active;
      tr.waveMesh.scale.setScalar(active ? 1.1 + phase * 4.5 : 1);
      (tr.waveMesh.material as THREE.MeshBasicMaterial).opacity = active ? 0.55 * (1 - phase * 0.65) : 0;
    }
    if (tr.rockPhase === 2) {
      tr.threadTime = Math.max(0, tr.threadTime - dt);
      if (tr.threadTime <= 0) {
        this.clearRockThread();
        tr.rockPhase = 1; tr.rockCombo = 2; tr.hits = 2; tr.rockComboTime = ROCK_TRAINING.comboSeconds + 1;
        tr.threadEAt = 0; tr.focusHeld = false; tr.waveTimer = 2.5;
        tr.message = "El hilo se desvaneció. Dos cortes más al pulso y aparecerá otra oportunidad."; tr.msgT = 3;
      }
    } else {
      if (tr.focusHeld && this.breath > 4) {
        tr.rockCharge = Math.min(ROCK_TRAINING.chargeTarget, tr.rockCharge + 46 * dt);
        this.breath = Math.max(0, this.breath - 29 * dt);
        tr.focusTime = 3;
        if (tr.rockPhase === 0 && tr.rockCharge >= ROCK_TRAINING.chargeTarget) {
          tr.rockPhase = 1; tr.focusHeld = false;
          tr.message = "Respiración Total. Ahora cuatro cortes J al ritmo del latido; para la onda con F."; tr.msgT = 4;
          this.tone(600, 1060, 0.35, "triangle", 0.1);
        }
      }
      if (tr.rockPhase === 1) {
        tr.marker += tr.markerDir * (tr.focusTime > 0 ? 0.37 : 0.69) * dt;
        if (tr.marker >= 1) { tr.marker = 1; tr.markerDir = -1; }
        if (tr.marker <= 0) { tr.marker = 0; tr.markerDir = 1; }
        if (tr.rockCombo > 0 && tr.rockCombo < 4) {
          tr.rockComboTime = Math.max(0, tr.rockComboTime - dt);
          if (tr.rockComboTime <= 0) { tr.rockCombo = 0; tr.hits = 0; tr.message = "El ritmo se rompió. Vuelve a encadenar J al pulso."; tr.msgT = 2.5; }
        }
        if (tr.rockCombo >= 4 && tr.rockParries >= ROCK_TRAINING.parriesRequired) this.openRockThread();
      }
      if (tr.waveTelegraph > 0) {
        tr.waveTelegraph = Math.max(0, tr.waveTelegraph - dt);
        if (tr.waveTelegraph <= 0) {
          tr.waveTimer = 4.0;
          if (this.iFrames <= 0) {
            tr.hp--; tr.rockCharge = Math.max(20, tr.rockCharge - 12);
            tr.message = tr.hp > 0 ? `¡La onda te desequilibra! Resistencia ${tr.hp}/6. Usa F cuando llegue el halo.` : "La presión te supera. Sabito dice: «Otra vez.»";
            tr.msgT = 3; this.hitFlash = 0.75; this.shake = 0.38;
            this.tone(180, 60, 0.26, "square", 0.1);
            if (tr.hp <= 0) tr.failed = true;
          }
        }
      } else {
        tr.waveTimer -= dt;
        if (tr.waveTimer <= 0) { tr.waveTelegraph = ROCK_TRAINING.pressureTelegraph; this.tone(250, 430, 0.26, "sine", 0.08); }
      }
    }
    tr.swingT = Math.max(0, tr.swingT - dt);
    this.vel.x = this.vel.z = 0;
    this.pos.copy(tr.top);
    this.yaw = Math.atan2(rock.position.x - this.pos.x, rock.position.z - this.pos.z);
    this.player.group.rotation.y = this.yaw;
    animateHumanoid(this.player, this.runPhase, 0, true, this.slashT > 0 ? 1 - this.slashT / 0.26 : -1);
  }

  private cabinPrompt() {
    const spot = cabinSpot(this.pos.x, this.pos.z);
    if (!spot) return null;
    if (spot.id === "tatami") return this.refuge.slept ? "E · Examinar las sábanas" : "E · Dormir en el tatami";
    if (spot.id === "exit") return this.refuge.slept ? "E · Salir a la mañana" : "E · Examinar la puerta · nieva afuera";
    return `E · ${spot.label}`;
  }

  private interactCabin() {
    const spot = cabinSpot(this.pos.x, this.pos.z);
    if (!spot) return;
    this.clearInput(); this.vel.set(0, 0, 0);
    if (spot.id === "tatami" && !this.refuge.slept) {
      this.sleepPrompt = true;
      this.pushHud();
    } else if (spot.id === "exit" && this.refuge.slept) {
      this.beginTransition("exit");
    } else {
      const lines: Record<string, string[]> = {
        exit: ["La nevada sigue golpeando la puerta. Saburo os pide que no arriesguéis otra caída. Debéis dormir en el tatami y esperar a la mañana."],
        tatami: ["Las sábanas están templadas. Ya has descansado; Tanjiro espera para subir a casa de Nezuko."],
        bed: ["Esta es la cama del anciano. Saburo ha dejado sábanas limpias sobre el tatami para vosotros. No necesitas ocupar su cama."],
        bath: ["Te lavas las manos con el agua del lavabo y apartas la nieve derretida de las mangas. El baño tiene una pequeña bañera de madera, un retrete y una toalla limpia."],
        saburo: this.refuge.slept ? ["«La nieve ha parado. Andad con cuidado en la cornisa y saludad a vuestra familia de mi parte.»"] : ["«Os he oído caer desde aquí. Habéis tenido suerte. Dejad secar la ropa, usad el baño si lo necesitáis y dormid sobre el tatami del cuarto.»"],
        tanjiro: this.refuge.slept ? ["«Ya no nieva. Vamos, cuñado. Nezuko estará esperando.»"] : ["«Estoy magullado, pero puedo caminar. Gracias por no soltarme durante la caída. Descansemos; iremos a casa cuando amanezca.»"],
      };
      this.playLines(spot.id === "tanjiro" ? "Tanjiro Kamado" : spot.id === "saburo" ? "Viejo Saburo" : spot.label, spot.id === "bath" ? "🪵" : "🏮", lines[spot.id], "Cabaña de Saburo");
    }
  }

  /* =========================== misiones =========================== */

  private completeStep() {
    const mission = MISSIONS[this.missionIdx];
    if (!mission) return;
    this.stepIdx++;
    this.refreshCast();
    this.introPlayed = false;
    this.spawned = false;
    this.cleared = false;
    this.safe.copy(this.pos);
    this.world.setMorning(this.isMorning());
    if (this.missionIdx > 0) { this.snowfall = 0; this.snowPts.visible = false; }
    if (this.stepIdx >= mission.steps.length) {
      this.completeMission();
      return;
    }
    this.tone(660, 990, 0.2, "triangle", 0.1);
    this.onEvent("toast", `🎯 Nuevo objetivo: ${mission.steps[this.stepIdx].label}`);
    this.onEvent("save");
  }

  private completeMission() {
    const mission = MISSIONS[this.missionIdx];
    this.missionIdx++;
    this.stepIdx = 0;
    this.hp = this.maxHp();
    this.breath = 100;
    this.clearActors();
    this.world.setMorning(this.isMorning());
    this.tone(523, 1046, 0.4, "triangle", 0.14);
    window.setTimeout(() => this.tone(784, 1568, 0.5, "triangle", 0.12), 160);
    this.burst(this.pos.clone().add(new THREE.Vector3(0, 1.4, 0)), 60, new THREE.Color("#ffd76a"), 7, 3);
    this.onEvent("missionDone", mission?.title ?? "");
    if (mission?.id === "m0") this.clearActors();
    if (this.missionIdx >= MISSIONS.length) {
      this.finished = true;
      this.refreshCast();
      this.onEvent("victory");
    } else {
      this.refreshCast();
      this.onEvent("mission");
    }
    this.onEvent("save");
  }

  private updateMission() {
    const step = this.currentStep();
    if (!step || this.dialogue || this.blocked || this.transition || this.sleepPrompt) return;
    const mission = MISSIONS[this.missionIdx];
    const target = stepTarget(step);
    const d = Math.hypot(this.pos.x - target.x, this.pos.z - target.z);
    const origin = mission.title;

    if (step.type === "fall" && !this.refuge.fallen && (d < (step.radius ?? 4) || Math.hypot(this.pos.x - ZONE_BY_ID.kamado.x, this.pos.z - ZONE_BY_ID.kamado.z) < 13)) {
      this.playNodes(step.nodes ?? [], origin, () => this.beginTransition("fall"));
      return;
    }
    if (step.type === "sleep" || step.type === "exit") return;
    if (step.type === "encounter") {
      if (!this.enc && !this.introPlayed) {
        this.introPlayed = true;
        this.playNodes(step.nodes ?? [], origin, () => this.startEncounter(step.encounter!));
      }
      return;
    }
    if (step.type === "cinematic") {
      if (!this.introPlayed) { this.introPlayed = true; this.playNodes(step.nodes ?? [], origin, () => this.completeStep()); }
      return;
    }
    if (step.type === "training") {
      const startRadius = step.training === "descent" ? 4.2 : 11;
      if (!this.trn && !this.introPlayed && d < startRadius) { this.introPlayed = true; this.startTraining(step.training!); }
      return;
    }
    if (this.missionIdx === 0 && this.stepIdx === PROLOGUE.KAMADO && (!this.refuge.slept || this.indoors())) return;
    if (step.type === "reach" && d < (step.radius ?? 7)) {
      this.playNodes(step.nodes ?? [], origin, () => this.completeStep());
      return;
    }

    if (step.type === "kill") {
      if (!this.spawned) {
        if (d < (step.radius ?? 12)) {
          if (step.intro && !this.introPlayed) {
            this.introPlayed = true;
            this.playNodes(step.intro, origin, () => this.spawnStep(step));
          } else {
            this.spawnStep(step);
          }
        }
        return;
      }
      if (!this.cleared && this.enemies.every((e) => e.dead)) {
        this.cleared = true;
        this.shots.forEach((s) => this.scene.remove(s.mesh));
        this.shots = [];
        this.onEvent("toast", "⚔️ ¡Zona despejada!");
        const generation = this.generation;
        window.setTimeout(() => {
          if (this.disposed || generation !== this.generation) return;
          if (step.after?.length) this.playNodes(step.after, origin, () => this.completeStep());
          else this.completeStep();
        }, 900);
      }
    }
  }

  private spawnStep(step: Step) {
    this.clearEnemies();
    this.spawned = true;
    this.cleared = false;
    const center = stepTarget(step);
    let minion = 0;
    for (const s of step.spawns ?? []) {
      const count = s.count ?? 1;
      for (let i = 0; i < count; i++) {
        const info = DEMONS[s.demon];
        const boss = !!s.boss;
        const scale = boss ? (s.demon === "muzan" ? 2.4 : 1.9) : 0.75;
        const tint = s.demon === "muzan" ? "#c4102e" : s.demon === "akaza" ? "#e0477a" : s.demon.startsWith("spider") || s.demon === "rui" ? "#a8a8c8" : boss ? "#8b1fa8" : "#8c1226";
        const { group, mat } = buildDemon(scale, boss, tint);
        const a = (minion++ / 5) * Math.PI * 2 + Math.random();
        const r = boss ? 0 : 5 + Math.random() * 4;
        const x = center.x + Math.cos(a) * r;
        const z = center.z + Math.sin(a) * r;
        group.position.set(x, terrainHeight(x, z) + (boss ? 3 : 1.3), z);
        this.scene.add(group);
        const hp = s.hp ?? (boss ? 12 : 3);
        this.enemies.push({
          group, mat, pos: group.position, hp, maxHp: hp, boss,
          name: info?.name ?? "Demonio", title: info?.title ?? "", style: s.style ?? "shoot", scale,
          t: Math.random() * 6, flash: 0, shoot: 2, rushCd: 2.5, rushT: 0, rushDir: new THREE.Vector3(), dead: false,
        });
        this.burst(group.position.clone(), boss ? 40 : 14, new THREE.Color(boss ? "#ff4d8a" : "#ff6b6b"), 6, 2);
      }
    }
    this.tone(140, 70, 0.5, "sawtooth", 0.12);
    this.shake = 0.4;
  }

  private clearEnemies() {
    for (const e of this.enemies) this.scene.remove(e.group);
    this.enemies = [];
    for (const s of this.shots) this.scene.remove(s.mesh);
    this.shots = [];
    this.spawned = false;
    this.cleared = false;
  }

  /* =========================== interacción =========================== */

  private nearestTalkable(): { kind: "npc"; npc: NpcObj; d: number } | { kind: "follower"; f: Follower; d: number } | null {
    const step = this.currentStep();
    if (step?.type === "talk" && step.npc) {
      const target = this.npcs.find((n) => n.def.id === step.npc && n.group.visible);
      if (target) {
        const distance = Math.hypot(target.group.position.x - this.pos.x, target.group.position.z - this.pos.z);
        if (distance < 3.4) return { kind: "npc", npc: target, d: distance };
      }
    }
    let best: { kind: "npc"; npc: NpcObj; d: number } | { kind: "follower"; f: Follower; d: number } | null = null;
    for (const n of this.npcs) {
      if (!n.group.visible) continue;
      const d = Math.hypot(n.group.position.x - this.pos.x, n.group.position.z - this.pos.z);
      if (d < 3.4 && (!best || d < best.d)) best = { kind: "npc", npc: n, d };
    }
    for (const f of this.followers) {
      if (!f.human.group.visible) continue;
      const d = Math.hypot(f.pos.x - this.pos.x, f.pos.z - this.pos.z);
      if (d < 2.4 && (!best || d < best.d - 0.6)) best = { kind: "follower", f, d };
    }
    return best;
  }

  private interact() {
    if (!this.started || this.paused || this.blocked || this.dialogue || this.transition || this.sleepPrompt) return;
    if (this.enc) { this.speak(-11); return; }
    if (this.trn?.kind === "descent") { this.stationAction("environment"); return; }
    if (this.trn?.kind === "boulder") { this.focusBoulder(); return; }
    if (this.indoors()) { this.interactCabin(); return; }
    const t = this.nearestTalkable();
    if (!t) return;
    if (t.kind === "follower") {
      if (this.missionIdx === 0 && t.f.def.id === "f_tanjiro") {
        this.playLines("Tanjiro Kamado", "🎴", [this.refuge.slept ? "«El sol está saliendo. Ya podemos ir a casa de Nezuko.»" : this.refuge.fallen ? "«Ha sido una buena caída... busquemos al anciano. Creo que nos está llamando.»" : "«Voy contigo. No te apartes de las huellas; la nieve cubre el borde del sendero.»"], "Tu futuro cuñado");
        return;
      }
      if (t.f.def.id === "f_tanjiro" && this.independentTrainingActive()) {
        const a = this.practiceAnchor("tanjiro");
        this.playLines("Tanjiro Kamado", "🎴", [`«Estoy practicando ${a.action}, ${this.name.first}. Quiero mejorar por mi cuenta. Luego podemos comparar lo aprendido.»`], this.trainingDateLabel());
        return;
      }
      const l = t.f.def.lines;
      this.playLines(t.f.def.name, t.f.def.emoji, [l[Math.floor(Math.random() * l.length)]], "Compañero");
      return;
    }
    const step = this.currentStep();
    if (step?.type === "shelter" && step.npc === t.npc.def.id && this.refuge.fallen) {
      this.playNodes(step.nodes ?? [], MISSIONS[this.missionIdx].title, () => this.beginTransition("enter"));
      return;
    }
    if (step?.type === "talk" && step.npc === t.npc.def.id) {
      this.playNodes(step.nodes ?? [], MISSIONS[this.missionIdx].title, () => this.completeStep());
      return;
    }
    if (t.npc.def.id === "nezuko_sleeping" && this.missionIdx === 1 && this.stepIdx >= 1) {
      // El primer encuentro obligatorio de la historia conserva su cinemática.
      this.visitNezuko();
      return;
    }
    if (t.npc.def.id === "makomo" && this.independentTrainingActive()) {
      const a = this.practiceAnchor("makomo");
      this.playLines("Makomo", "🌸", [`«Hoy estoy trabajando ${a.action}. Me gusta entrenar contigo, pero también necesito practicar sola para mejorar.»`], this.trainingDateLabel());
      return;
    }
    const l = t.npc.def.lines;
    this.playLines(t.npc.def.name, t.npc.def.emoji, [l[Math.floor(Math.random() * l.length)]]);
  }

  /* =========================== audio =========================== */

  private ensureAudio() {
    if (!this.audio) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audio = new Ctx();
    }
    if (this.audio.state === "suspended") void this.audio.resume();
  }

  private tone(freq: number, to: number, dur: number, type: OscillatorType, vol = 0.12) {
    if (!this.audio) return;
    const t = this.audio.currentTime;
    const o = this.audio.createOscillator();
    const g = this.audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.audio.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol = 0.1) {
    if (!this.audio) return;
    const ctx = this.audio;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 2400;
    src.connect(f).connect(g).connect(ctx.destination);
    src.start();
  }

  /* =========================== entrada =========================== */

  private onKeyDown = (e: KeyboardEvent) => {
    const act = KEYMAP[e.code];
    if (!act) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.repeat && ["interact", "jump", "pause"].includes(act)) return;
    if (act === "tag" && !this.enc && this.trn?.kind !== "descent") return;
    e.preventDefault();
    if (this.transition || this.sleepPrompt) return;
    if (act === "pause") {
      if (!this.dialogue && !this.blocked) this.togglePause();
      return;
    }
    if (this.dialogue || this.blocked || this.paused) return;
    if (act === "jump" && !this.keys.has("jump")) {
      if (this.enc) this.dash();
      else this.jumpBuf = 0.14;
    }
    if (act === "sprint" && !this.keys.has("sprint") && this.trn?.kind === "descent") this.stationAction("dodge");
    if (act === "guard") {
      if (this.keys.has("guard")) return;
      this.keys.add("guard");
      if (this.trn?.kind === "descent") this.stationAction("parry");
      else if (this.trn?.kind === "boulder") this.rockParry();
      else if (this.enc) this.enc.holding = true;
      return;
    }
    if (act === "tag") {
      if (!this.keys.has("tag")) {
        this.keys.add("tag");
        if (this.trn?.kind === "descent") this.stationAction("tag");
        else if (this.enc) this.speak(this.enc.chosen ? -12 : -20);
      }
      return;
    }
    if (act === "interact" && !this.keys.has("interact")) this.interact();
    if (act === "attack" && !this.keys.has("attack") && !this.keys.has("breathe")) this.attack();
    if ((act === "dash") && !this.keys.has("dash") && !this.keys.has("breathe")) this.dash();
    this.keys.add(act);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const act = KEYMAP[e.code];
    if (act) this.keys.delete(act);
    if (act === "interact" && this.trn?.kind === "boulder") this.setTrainingFocus(false);
    if (act === "guard" && this.enc) { this.enc.holding = false; this.enc.guarding = 0; }
  };

  private downAt = { x: 0, y: 0, t: 0 };

  private onPointerDown = (e: PointerEvent) => {
    if (!this.started || this.dialogue || this.blocked || this.transition || this.sleepPrompt || this.paused) return;
    this.ensureAudio();
    if (e.button === 2) {
      if (this.enc) { this.enc.holding = true; return; }
      this.attack();
      return;
    }
    if (this.pointerLocked) {
      this.attack();
      return;
    }
    this.dragging = true;
    this.dragIdle = 0;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.pointerLocked) {
      this.camYaw -= e.movementX * 0.0024;
      this.camPitch = THREE.MathUtils.clamp(this.camPitch + e.movementY * 0.0019, -0.22, 1.1);
      this.dragIdle = 0;
      return;
    }
    if (!this.dragging || this.indoors() || this.transition) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.camYaw -= dx * 0.006;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * 0.004, -0.22, 1.1);
    this.dragIdle = 0;
  };

  private onPointerLockChange = () => {
    const locked = document.pointerLockElement === this.canvas;
    if (locked === this.pointerLocked) return;
    this.pointerLocked = locked;
    if (!locked) this.dragging = false;
    this.pushHud();
  };

  private onWheel = (e: WheelEvent) => {
    if (this.indoors() || !this.started) return;
    e.preventDefault();
    this.camDist = THREE.MathUtils.clamp(this.camDist + Math.sign(e.deltaY) * 0.8, 3.6, 14);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.enc && e.button === 2) { this.enc.holding = false; this.enc.guarding = 0; return; }
    const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
    if (this.dragging && e.pointerType === "mouse" && moved < 5 && performance.now() - this.downAt.t < 260) {
      this.attack();
    }
    this.dragging = false;
  };

  private onContext = (e: Event) => e.preventDefault();

  private bindInput() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("contextmenu", this.onContext);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    document.addEventListener("pointerlockchange", this.onPointerLockChange);
  }

  private resize = () => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  };

  /* =========================== bucle =========================== */

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const active = this.started && !this.paused && !this.hold;
    if (!this.paused) this.simulationTime += dt;
    const t = this.simulationTime;
    if (active && this.transition) this.updateTransition(dt);
    else if (active && this.enc) this.updateEncounter(dt, t);
    else if (active) { this.update(dt, t); if (this.trn) this.updateTraining(dt, t); }
    else animateHumanoid(this.player, this.runPhase, 0, true);
    this.updateWeather(this.paused ? 0 : dt, t);
    if (this.indoors()) this.cabin?.update(t, this.transition?.kind === "sleep");
    else this.world.update(t, this.paused ? 0 : dt, this.pos);
    this.updateCast(this.paused ? 0 : dt, t);
    this.updateActors(this.paused || this.hold ? 0 : dt);
    this.updateParticles(this.paused ? 0 : dt);
    this.updateCamera(dt);
    this.updateCinematicLighting(dt);
    const cinematicRender = this.dialogue?.kind === "node" && IMPORTANT_NODES.has(this.dialogue.nodeId);
    this.renderer.toneMapping = cinematicRender ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    this.renderer.toneMappingExposure = cinematicRender ? 1.2 : 1;
    this.renderer.render(this.indoors() && this.cabin ? this.cabin.scene : this.scene, this.camera);
    this.hudT += dt;
    if (this.hudT > 0.06) { this.hudT = 0; this.pushHud(); }
  };

  private wish(out: THREE.Vector3) {
    let ix = 0;
    let iz = 0;
    if (this.keys.has("fwd")) iz -= 1;
    if (this.keys.has("back")) iz += 1;
    if (this.keys.has("left")) ix -= 1;
    if (this.keys.has("right")) ix += 1;
    ix += this.touch.x;
    iz += this.touch.y;
    const len = Math.hypot(ix, iz);
    if (len > 1) {
      ix /= len;
      iz /= len;
    }
    const c = this.camYaw;
    const fx = -Math.sin(c);
    const fz = -Math.cos(c);
    const rx = Math.cos(c);
    const rz = -Math.sin(c);
    out.set(rx * ix - fx * iz, 0, rz * ix - fz * iz);
  }

  private update(dt: number, t: number) {
    if (this.independentTrainingActive() && !this.dialogue && !this.paused) {
      this.trainingClockSeconds += dt;
      if (this.trainingClockSeconds >= 90) {
        this.trainingClockSeconds -= 90;
        this.trainingHour += 1;
        if (this.trainingHour >= 24) { this.trainingHour = 0; this.trainingDay = Math.min(900, this.trainingDay + 1); }
        this.updateTrainingPhysiques();
        if ([6, 12, 17, 20].includes(this.trainingHour)) this.onEvent("toast", `✦ ${this.trainingDateLabel()} · Tanjiro y Makomo cambian de actividad.`);
      }
    }
    const frozen = !!this.dialogue || this.blocked || this.sleepPrompt;
    const wish = new THREE.Vector3();
    if (!frozen) this.wish(wish);
    const moving = wish.lengthSq() > 0.01;

    if (!this.indoors() && this.keys.has("camL")) this.camYaw += 1.8 * dt;
    if (!this.indoors() && this.keys.has("camR")) this.camYaw -= 1.8 * dt;
    this.dragIdle += dt;

    const breathing = !frozen && !this.paused && this.keys.has("breathe") && !this.indoors();
    this.breath = Math.min(100, this.breath + (breathing ? 42 : 3) * dt);
    this.atkCd = Math.max(0, this.atkCd - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.slashT = Math.max(0, this.slashT - dt);
    this.iFrames = Math.max(0, this.iFrames - dt);
    this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt * 2.5);

    if (!frozen && !this.indoors() && this.jumpBuf > 0) {
      if (this.grounded || this.coyote > 0) {
        this.vel.y = this.canFight() ? 12 : 6.2;
        this.grounded = false;
        this.coyote = 0;
        this.jumpBuf = 0;
        this.usedDouble = false;
        this.tone(300, 600, 0.12, "square", 0.07);
      } else if (this.canFight() && !this.usedDouble && this.breath >= 20) {
        this.vel.y = 10.5;
        this.usedDouble = true;
        this.jumpBuf = 0;
        this.breath -= 20;
        this.tone(520, 900, 0.14, "triangle", 0.08);
        this.burst(this.pos.clone(), 14, new THREE.Color("#bfe9ff"), 4, 0.5);
      }
    }

    const sprint = this.keys.has("sprint") || this.touch.sprint;
    const speed = (this.indoors() ? 3.4 : this.canFight() ? (sprint ? 14.5 : 8.5) : (sprint ? 8.8 : 5.6)) * this.nezukoMultiplier("speed");
    if (this.dashT > 0) {
      this.dashT -= dt;
    } else {
      const k = Math.min(1, (this.grounded ? 12 : 6) * dt);
      this.vel.x += (wish.x * speed - this.vel.x) * k;
      this.vel.z += (wish.z * speed - this.vel.z) * k;
    }
    if (frozen) this.vel.x = this.vel.z = 0;
    else this.stormWall(dt);
    this.vel.y = Math.max(-50, this.vel.y - 30 * dt);
    if (moving) {
      const target = Math.atan2(wish.x, wish.z);
      let diff = target - this.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.yaw += diff * Math.min(1, dt * 14);
      if (!this.indoors() && !this.dragging && !this.pointerLocked && this.dragIdle > 1.2) {
        let cd = this.yaw + Math.PI - this.camYaw;
        cd = Math.atan2(Math.sin(cd), Math.cos(cd));
        this.camYaw += cd * Math.min(1, dt * 0.9);
      }
    }

    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.collide();
    this.pos.y += this.vel.y * dt;
    const ground = this.groundAt(this.pos.x, this.pos.z);
    const feet = this.pos.y - HALF;
    const snap = this.grounded && this.vel.y <= 0 ? 0.5 : 0;
    const wasGrounded = this.grounded;
    if (feet <= ground + snap && this.vel.y <= 0) {
      this.pos.y = ground + HALF;
      this.vel.y = 0;
      this.grounded = true;
      this.coyote = 0.12;
      this.usedDouble = false;
      if (!wasGrounded) this.burst(this.pos.clone().add(new THREE.Vector3(0, -0.8, 0)), 6, new THREE.Color("#dfe7f5"), 2.5, 0.5);
    } else {
      this.grounded = false;
      this.coyote = Math.max(0, this.coyote - dt);
    }

    if (!frozen) {
      this.updateMission();
      this.updateZone();
    }
    this.updateEnemies(dt, t, frozen);
    this.updateShots(dt, frozen);
    this.updateArcs(dt);

    const planar = Math.hypot(this.vel.x, this.vel.z);
    this.runPhase += dt * (3 + planar * 1.1);
    animateHumanoid(this.player, this.runPhase, Math.min(1, planar / 8.5), this.grounded, this.slashT > 0 ? 1 - this.slashT / 0.26 : -1);
    this.player.group.position.set(this.pos.x, this.pos.y - HALF, this.pos.z);
    this.player.group.rotation.y = this.yaw;
    this.player.body.visible = !(this.iFrames > 0 && Math.floor(this.iFrames * 16) % 2 === 0);
    if (this.blizzard > 0.05) this.player.body.rotation.x = this.blizzard * 0.18;
    else this.player.body.rotation.x *= 0.85;
  }

  /** Durante la noche del prólogo la ventisca cierra el paso a la casa Kamado. */
  private stormWall(dt: number) {
    this.wallStrength = 0;
    if (this.indoors() || this.missionIdx !== 0 || this.refuge.slept || this.transition) return;
    const kamado = ZONE_BY_ID.kamado;
    const gate = { x: kamado.x, z: kamado.z + 6 };
    const dx = this.pos.x - gate.x;
    const dz = this.pos.z - gate.z;
    const d = Math.hypot(dx, dz) || 0.001;
    const strength = THREE.MathUtils.clamp((STORM_WALL.outer - d) / (STORM_WALL.outer - STORM_WALL.inner), 0, 1);
    if (strength <= 0) return;
    this.wallStrength = strength;
    // Empuja hacia fuera y, tras la caída, hacia el recodo donde vive Saburo.
    const haven = this.refuge.fallen ? SABURO_DOOR : { x: ZONE_BY_ID.kumotori.x, z: ZONE_BY_ID.kumotori.z };
    const toHaven = new THREE.Vector3(haven.x - this.pos.x, 0, haven.z - this.pos.z);
    if (toHaven.lengthSq() > 0.01) toHaven.normalize();
    const dir = new THREE.Vector3(dx / d, 0, dz / d).multiplyScalar(0.7).add(toHaven.multiplyScalar(0.3));
    if (dir.lengthSq() < 0.001) dir.set(dx / d, 0, dz / d);
    dir.normalize();
    // Tras la caída la tormenta arrecia: la subida queda sellada hasta el amanecer.
    const sealed = this.refuge.fallen;
    const push = (sealed ? 34 : 13) * strength;
    this.vel.x += dir.x * push * dt * 9;
    this.vel.z += dir.z * push * dt * 9;
    const limit = sealed ? STORM_WALL.sealed : STORM_WALL.inner;
    if (d < limit) {
      this.pos.x = gate.x + (dx / d) * limit;
      this.pos.z = gate.z + (dz / d) * limit;
    }
    this.shake = Math.max(this.shake, strength * 0.3);
    if (strength > 0.33 && !this.wallWarned) {
      this.wallWarned = true;
      this.onEvent("toast", this.refuge.fallen
        ? "La ventisca baja de la cumbre y os cierra el paso. No podréis subir hasta que amanezca."
        : "El viento sopla de frente con una fuerza imposible. No se puede avanzar así.");
    }
    if (strength < 0.12) this.wallWarned = false;
  }

  private updateWeather(dt: number, t: number) {
    const nightSnow = this.missionIdx === 0 && !this.refuge.slept;
    const falling = this.transition?.kind === "fall";
    const outside = !this.indoors();
    const target = nightSnow && outside ? (falling ? 1 : 0.78) : 0;
    this.snowfall += (target - this.snowfall) * Math.min(1, dt * 3);
    const gust = nightSnow && outside ? Math.min(1, Math.max(falling ? 0.8 : 0.12, this.wallStrength * 1.35)) : 0;
    this.blizzard += (gust - this.blizzard) * Math.min(1, dt * 3);
    const fog = this.scene.fog as THREE.FogExp2;
    if (this.isMorning()) { fog.color.set(this.missionIdx === 1 ? "#b6cedb" : "#d7e3ec"); fog.density = this.missionIdx === 1 ? 0.0055 : 0.0045; }
    else if (nightSnow) { fog.color.set("#7b91a9"); fog.density = 0.014 + this.blizzard * 0.018; }
    else if (this.missionIdx === 1 && this.isMorning()) { fog.color.set("#a8c4d6"); fog.density = 0.006; }
    else { fog.color.set("#0d1428"); fog.density = 0.0085; }
    const mat = this.snowPts.material as THREE.PointsMaterial;
    this.snowPts.visible = outside && this.snowfall > 0.03;
    mat.opacity = this.snowfall * 0.92;
    if (this.snowPts.visible) {
      this.snowPts.position.set(this.pos.x, this.pos.y - 2, this.pos.z);
      const pos = this.snowGeo.attributes.position as THREE.BufferAttribute;
      const wind = falling ? 17 : 2.8;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i) - wind * dt + Math.sin(t * 1.3 + i) * dt * 0.8;
        let y = pos.getY(i) - (3 + (i % 9) * 0.25 + this.blizzard * 7) * dt;
        let z = pos.getZ(i) + wind * dt * 0.35;
        if (y < -5) { y = 18 + Math.random() * 5; x = (Math.random() - 0.5) * 40; z = (Math.random() - 0.5) * 40; }
        if (x < -22) x += 44; if (x > 22) x -= 44;
        if (z < -22) z += 44; if (z > 22) z -= 44;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }
    this.updateWindAudio();
  }

  private updateWindAudio() {
    if (!this.audio) return;
    const volume = !this.started || this.paused || this.refuge.slept || this.missionIdx !== 0 ? 0 : this.indoors() ? 0.018 : 0.045 + this.blizzard * 0.12;
    if (volume === 0) {
      if (this.windGain) this.windGain.gain.value = 0;
      return;
    }
    if (!this.windGain) {
      const ctx = this.audio;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 500;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start();
      this.windSrc = src;
      this.windGain = gain;
    }
    this.windGain.gain.setTargetAtTime(volume, this.audio.currentTime, 0.15);
  }

  private collide() {
    const indoors = this.indoors();
    this.pos.x = THREE.MathUtils.clamp(this.pos.x, indoors ? -7.45 : -WORLD_HALF + 2, indoors ? 7.45 : WORLD_HALF - 2);
    this.pos.z = THREE.MathUtils.clamp(this.pos.z, indoors ? -5.95 : -WORLD_HALF + 2, indoors ? 5.95 : WORLD_HALF - 2);
    if (!indoors && this.missionIdx === 0 && !this.refuge.slept) {
      const center = ZONE_BY_ID.kumotori;
      const dx = this.pos.x - center.x, dz = this.pos.z - center.z;
      const distance = Math.hypot(dx, dz);
      if (distance > 62) {
        this.pos.x = center.x + dx / distance * 62;
        this.pos.z = center.z + dz / distance * 62;
        if (!this.blizzardWarned) { this.blizzardWarned = true; this.onEvent("toast", "La nieve oculta los caminos lejanos. Sigue el farol de Tanjiro."); }
      }
    }
    for (const c of indoors ? (this.cabin?.colliders ?? []) : this.world.colliders) {
      if (Math.abs(c.x - this.pos.x) > 14 || Math.abs(c.z - this.pos.z) > 14) continue;
      if (c.kind === "circle") {
        const dx = this.pos.x - c.x;
        const dz = this.pos.z - c.z;
        const d = Math.hypot(dx, dz);
        const min = c.r + RADIUS;
        if (d < min && d > 1e-4) {
          this.pos.x = c.x + (dx / d) * min;
          this.pos.z = c.z + (dz / d) * min;
        }
      } else {
        const dx = this.pos.x - c.x;
        const dz = this.pos.z - c.z;
        const ox = c.hw + RADIUS - Math.abs(dx);
        const oz = c.hd + RADIUS - Math.abs(dz);
        if (ox > 0 && oz > 0) {
          if (ox < oz) this.pos.x += Math.sign(dx || 1) * ox;
          else this.pos.z += Math.sign(dz || 1) * oz;
        }
      }
    }
  }

  private updateZone() {
    if (this.indoors()) return;
    const z = zoneAt(this.pos.x, this.pos.z);
    const id = z?.id ?? "";
    if (id !== this.zoneId) {
      this.zoneId = id;
      if (z) this.onEvent("toast", `📍 ${z.name}`);
    }
  }

  /* =========================== combate =========================== */

  private dash() {
    if (!this.started || this.paused || this.blocked || this.dialogue || this.transition || this.sleepPrompt || this.indoors()) return;
    if (this.trn?.kind === "descent") { this.stationAction("dodge"); return; }
    if (!this.canFight() && !this.enc) return;
    if (this.enc) {
      const e = this.enc;
      if (e.words || e.dead || e.won || e.broken > 0 || this.dashCd > 0 || e.focus < e.def.dodgeCost) return;
      const w = new THREE.Vector3();
      this.wish(w);
      const dir = w.lengthSq() > 0.01 ? w.normalize() : new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      this.vel.x = dir.x * 18; this.vel.z = dir.z * 18;
      this.dashT = 0.24;
      this.dashCd = 0.5;
      e.focus -= e.def.dodgeCost;
      e.invuln = 0.32;
      e.guarding = 0;
      e.holding = false;
      this.iFrames = Math.max(this.iFrames, 0.24);
      this.tone(180, 720, 0.15, "sawtooth", 0.06);
      this.burst(this.pos.clone(), 12, new THREE.Color("#bfe9ff"), 6, 1);
      return;
    }
    if (this.dashCd > 0 || this.breath < 25) return;
    const w = new THREE.Vector3();
    this.wish(w);
    const dir = w.lengthSq() > 0.01 ? w.normalize() : new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    this.vel.x = dir.x * 22;
    this.vel.z = dir.z * 22;
    this.dashT = 0.17;
    this.dashCd = 0.55;
    this.breath -= 25;
    this.iFrames = Math.max(this.iFrames, 0.24);
    this.tone(180, 720, 0.15, "sawtooth", 0.07);
    this.burst(this.pos.clone(), 14, new THREE.Color("#ffe6a3"), 6, 1);
  }

  private attack() {
    if (!this.started || this.paused || this.blocked || this.dialogue || this.transition || this.sleepPrompt || this.indoors()) return;
    if (this.trn?.kind === "boulder") { this.boulderSwing(); return; }
    if (this.trn?.kind === "descent") { this.stationAction("combo"); return; }
    if (this.enc) { if (this.enc.counter > 0 || (this.enc.def.enemyHp !== undefined && this.enc.recover > 0)) this.encounterAttack(); else this.speak(-10); return; }
    if (!this.canFight()) return;
    if (this.atkCd > 0) return;
    this.atkCd = 0.3;
    this.slashT = 0.26;
    this.noise(0.12, 0.08);
    this.tone(880, 260, 0.1, "sawtooth", 0.05);
    const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));

    const geo = new THREE.TorusGeometry(1.8, 0.09, 6, 26, Math.PI * 1.05);
    geo.rotateX(Math.PI / 2);
    const arc = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: "#dff2ff", transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    arc.position.copy(this.pos).add(new THREE.Vector3(0, 0.3, 0));
    arc.rotation.y = this.yaw;
    this.scene.add(arc);
    this.arcs.push({ mesh: arc, life: 0.26, yaw: this.yaw });
    this.burst(this.pos.clone().add(fwd.clone().multiplyScalar(1.6)).add(new THREE.Vector3(0, 0.3, 0)), 10, new THREE.Color("#e8f6ff"), 5, 1);

    for (const e of this.enemies) {
      if (e.dead) continue;
      const to = e.pos.clone().sub(this.pos);
      const vertical = Math.abs(to.y);
      to.y = 0;
      const dist = to.length();
      const reach = 3.4 + e.scale;
      if (dist > reach || vertical > 3 + e.scale) continue;
      if (dist > e.scale + 0.8 && to.normalize().dot(fwd) < 0.2) continue;
      this.hitEnemy(e, fwd);
    }
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      if (s.mesh.position.distanceTo(this.pos) < 3.4) {
        this.burst(s.mesh.position.clone(), 8, new THREE.Color("#ff9ec4"), 4, 1);
        this.scene.remove(s.mesh);
        this.shots.splice(i, 1);
      }
    }
  }

  private hitEnemy(e: Enemy, dir: THREE.Vector3) {
    e.hp -= this.damage();
    e.flash = 0.2;
    e.mat.emissiveIntensity = 3;
    this.shake = Math.max(this.shake, 0.28);
    this.tone(220, 90, 0.13, "square", 0.1);
    this.burst(e.pos.clone(), 14, new THREE.Color("#ff6b81"), 6, 2);
    if (!e.boss) e.pos.add(dir.clone().multiplyScalar(0.9));
    if (e.hp <= 0) {
      e.dead = true;
      e.group.visible = false;
      this.burst(e.pos.clone(), e.boss ? 80 : 26, new THREE.Color(e.boss ? "#ff8ae0" : "#ff4d6d"), e.boss ? 12 : 7, 3);
      this.tone(e.boss ? 90 : 320, e.boss ? 40 : 120, e.boss ? 0.8 : 0.3, "sawtooth", 0.14);
      if (e.boss) this.shake = 0.8;
    }
  }

  private updateEnemies(dt: number, t: number, frozen: boolean) {
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.t += dt;
      if (e.flash > 0) {
        e.flash -= dt;
        e.mat.emissiveIntensity = Math.max(e.boss ? 1 : 0.55, e.mat.emissiveIntensity - dt * 10);
      }
      const ground = terrainHeight(e.pos.x, e.pos.z);
      const hover = e.boss ? 1.4 + e.scale : 1.3;
      const toP = this.pos.clone().sub(e.pos);
      toP.y = 0;
      const dist = toP.length();
      const dir = dist > 0.001 ? toP.clone().divideScalar(dist) : new THREE.Vector3();
      if (!frozen) {
        if (e.rushT > 0) {
          e.rushT -= dt;
          e.pos.addScaledVector(e.rushDir, 19 * dt);
          if (Math.random() < 0.5) this.burst(e.pos.clone(), 2, new THREE.Color("#ff5f8a"), 2, 0.5);
        } else if (dist < 34) {
          const sp = e.boss ? 2.4 : 3.6;
          const keep = e.boss && e.style !== "rush" ? 5 : 0.8;
          if (dist > keep) e.pos.addScaledVector(dir, sp * dt);
          if (e.boss && (e.style === "rush" || e.style === "both")) {
            e.rushCd -= dt;
            if (e.rushCd <= 0 && dist < 22) {
              e.rushCd = e.hp < e.maxHp / 2 ? 1.9 : 2.8;
              e.rushT = 0.55;
              e.rushDir.copy(dir);
              this.tone(110, 300, 0.25, "sawtooth", 0.09);
            }
          }
          if (e.boss && (e.style === "shoot" || e.style === "both")) {
            e.shoot -= dt;
            if (e.shoot <= 0 && dist < 26) {
              const enraged = e.hp < e.maxHp / 2;
              e.shoot = enraged ? 1.1 : 1.8;
              const spread = e.name.includes("Muzan") ? (enraged ? 7 : 5) : enraged ? 3 : 1;
              const aim = this.pos.clone().sub(e.pos).normalize();
              for (let i = 0; i < spread; i++) {
                const v = aim.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (i - (spread - 1) / 2) * 0.2);
                this.spawnShot(e.pos.clone(), v.multiplyScalar(14));
              }
              this.tone(160, 320, 0.18, "sawtooth", 0.06);
            }
          }
        }
      }
      e.pos.y += (ground + hover + Math.sin(e.t * 2) * 0.3 - e.pos.y) * Math.min(1, dt * 4);
      e.group.position.copy(e.pos);
      e.group.rotation.y = Math.atan2(dir.x, dir.z);
      e.group.rotation.z = Math.sin(t * 1.6 + e.t) * 0.12;
      const hitDist = e.scale + 0.7;
      if (!frozen && dist < hitDist && Math.abs(this.pos.y - e.pos.y) < e.scale + 1.6 && this.iFrames <= 0) {
        this.hurt(e.boss ? 2 : 1, dir.clone().multiplyScalar(-1));
      }
    }
  }

  private spawnShot(at: THREE.Vector3, vel: THREE.Vector3) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), new THREE.MeshBasicMaterial({ color: "#ff7ab0" }));
    mesh.position.copy(at);
    this.scene.add(mesh);
    this.shots.push({ mesh, vel, life: 4 });
  }

  private updateShots(dt: number, frozen: boolean) {
    if (frozen) return;
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      s.life -= dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      if (s.mesh.position.distanceTo(this.pos) < 1 && this.iFrames <= 0) {
        this.hurt(1, s.vel.clone().setY(0).normalize().multiplyScalar(-1));
        this.scene.remove(s.mesh);
        this.shots.splice(i, 1);
        continue;
      }
      if (s.life <= 0 || s.mesh.position.y < terrainHeight(s.mesh.position.x, s.mesh.position.z)) {
        this.scene.remove(s.mesh);
        this.shots.splice(i, 1);
      }
    }
  }

  private updateArcs(dt: number) {
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      const a = this.arcs[i];
      a.life -= dt;
      const k = Math.max(0, a.life / 0.26);
      a.mesh.rotation.y = a.yaw + (0.5 - k) * 0.9;
      a.mesh.scale.setScalar(0.75 + (1 - k) * 0.5);
      if (!a.mesh.userData.stationary) a.mesh.position.copy(this.pos).add(new THREE.Vector3(0, 0.3, 0));
      (a.mesh.material as THREE.MeshBasicMaterial).opacity = k;
      if (a.life <= 0) {
        this.scene.remove(a.mesh);
        a.mesh.geometry.dispose();
        (a.mesh.material as THREE.Material).dispose();
        this.arcs.splice(i, 1);
      }
    }
  }

  private hurt(dmg: number, knock: THREE.Vector3) {
    this.hp -= dmg;
    this.iFrames = 1.1;
    this.shake = 0.5;
    this.hitFlash = 1;
    this.vel.x += knock.x * 9;
    this.vel.z += knock.z * 9;
    this.vel.y = 6;
    this.grounded = false;
    this.tone(200, 60, 0.25, "square", 0.12);
    this.burst(this.pos.clone(), 18, new THREE.Color("#ff4d4d"), 6, 2);
    if (this.hp <= 0) this.respawn();
  }

  private respawn() {
    this.clearEnemies();
    this.pos.copy(this.safe);
    this.pos.y = terrainHeight(this.pos.x, this.pos.z) + HALF;
    this.vel.set(0, 0, 0);
    this.hp = this.maxHp();
    this.breath = 100;
    this.iFrames = 1.6;
    for (const f of this.followers) f.pos.copy(this.pos);
    this.onEvent("toast", "🩹 Los Kakushi te rescatan. Inténtalo de nuevo.");
  }

  /* =========================== reparto: animación =========================== */

  private updateCast(dt: number, t: number) {
    const step = this.currentStep();
    const talkTarget = step?.type === "talk" || step?.type === "shelter" ? step.npc : null;
    if (this.sagiriShelter?.visible) {
      const roof = this.sagiriShelter.children.find((child) => child instanceof THREE.Mesh && child.position.y === 2.83) as THREE.Mesh | undefined;
      const roofMat = roof?.material as THREE.MeshStandardMaterial | undefined;
      if (roofMat) {
        const sleeping = NPCS.find((n) => n.id === "nezuko_sleeping");
        const close = sleeping && Math.hypot(this.pos.x - sleeping.x, this.pos.z - sleeping.z) < 6;
        roofMat.opacity += ((close ? 0.24 : 0.95) - roofMat.opacity) * Math.min(1, dt * 5);
      }
    }
    for (const n of this.npcs) {
      if (!n.group.visible) continue;
      n.t += dt;
      const makomoRoutine = n.def.id === "makomo" && this.independentTrainingActive() && this.currentStep()?.npc !== "makomo";
      const anchor = makomoRoutine ? this.practiceAnchor("makomo") : { x: n.def.x, z: n.def.z, action: "" };
      if (makomoRoutine) {
        n.group.position.x += (anchor.x - n.group.position.x) * Math.min(1, dt * 1.7);
        n.group.position.z += (anchor.z - n.group.position.z) * Math.min(1, dt * 1.7);
      } else {
        n.group.position.x += (n.def.x - n.group.position.x) * Math.min(1, dt * 2);
        n.group.position.z += (n.def.z - n.group.position.z) * Math.min(1, dt * 2);
      }
      const nx = n.group.position.x, nz = n.group.position.z;
      const d = Math.hypot(nx - this.pos.x, nz - this.pos.z);
      n.label.visible = d < 16 && !this.dialogue;
      n.marker.visible = n.def.id === talkTarget && !this.dialogue;
      if (n.marker.visible) n.marker.position.y = (n.def.id === "nezuko_sleeping" ? 3.75 : n.def.kind === "crow" ? 3.3 : 3.05) + Math.sin(t * 4) * 0.12;
      if (n.def.id === "nezuko_sleeping") {
        n.group.position.y = terrainHeight(n.def.x, n.def.z) + 0.12;
        continue;
      }
      if (d < 7) {
        const want = Math.atan2(this.pos.x - nx, this.pos.z - nz);
        let diff = want - n.group.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        n.group.rotation.y += diff * Math.min(1, dt * 5);
      }
      if (n.human) {
        const practicing = makomoRoutine && this.practiceShift() !== "rest";
        animateHumanoid(n.human, n.t * (practicing ? 3.5 : 1.5), practicing ? 0.7 : 0, true);
        if (practicing) n.human.body.rotation.y = Math.sin(n.t * 1.2) * 0.16;
      }
      n.group.position.y = terrainHeight(nx, nz) + (n.human ? Math.sin(n.t * 2) * 0.015 : 0);
    }

    const back = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).multiplyScalar(-1);
    const side = new THREE.Vector3(back.z, 0, -back.x);
    let slot = 0;
    for (const f of this.followers) {
      if (!f.human.group.visible) continue;
      if (this.transition?.kind === "fall" && f.def.id === "f_tanjiro") continue;
      const row = Math.floor(slot / 2);
      const col = slot % 2 === 0 ? -1 : 1;
      slot++;
      let target = this.pos.clone().addScaledVector(back, 2.2 + row * 1.6).addScaledVector(side, col * 1.3);
      const independentTanjiro = f.def.id === "f_tanjiro" && this.independentTrainingActive();
      if (independentTanjiro) {
        const a = this.practiceAnchor("tanjiro");
        target = new THREE.Vector3(a.x + Math.sin(t * 0.65) * (this.practiceShift() === "rest" ? 0 : 1.4), 0, a.z + Math.cos(t * 0.65) * (this.practiceShift() === "rest" ? 0 : 1.4));
      }
      if (this.trn?.kind === "descent" && f.def.id === "f_tanjiro") {
        target = this.pos.clone().addScaledVector(side, 1.75).addScaledVector(back, 0.5);
      }
      if (this.enc) {
        // Durante un duelo los compañeros observan desde fuera del círculo, sin estorbar.
        const away = this.pos.clone().sub(this.enc.pos).setY(0).normalize();
        const perp = new THREE.Vector3(-away.z, 0, away.x);
        target = this.enc.pos.clone().addScaledVector(perp, 9 + row * 1.5).addScaledVector(away, 2 + col * 1.2);
      }
      const d = f.pos.distanceTo(target);
      if (d > 28) f.pos.copy(target);
      const prev = f.pos.clone();
      if (d > 0.6) f.pos.lerp(target, Math.min(1, dt * (d > 6 ? 4 : 2.6)));
      f.pos.y = terrainHeight(f.pos.x, f.pos.z);
      const mv = f.pos.clone().sub(prev);
      mv.y = 0;
      const sp = mv.length() / Math.max(dt, 1e-4);
      if (sp > 0.4) f.yaw = Math.atan2(mv.x, mv.z);
      f.phase += dt * (3 + sp * 1.1);
      animateHumanoid(f.human, f.phase, independentTanjiro && this.practiceShift() !== "rest" ? Math.max(0.45, Math.min(1, sp / 8)) : Math.min(1, sp / 8), true);
      f.human.group.position.copy(f.pos);
      f.human.group.rotation.y = f.yaw;
      const near = f.pos.distanceTo(this.pos);
      f.label.visible = !this.dialogue && near > 2.6 && near < 9;
    }

    // Haz guía sobre el objetivo actual.
    const tgt = this.targetPos();
    const showBeam = !!tgt && !this.indoors() && !this.dialogue && !this.transition && !this.enc && !this.trn && !(step?.type === "kill" && this.spawned);
    this.beam.visible = showBeam;
    if (tgt && showBeam) {
      this.beam.position.set(tgt.x, terrainHeight(tgt.x, tgt.z) + 35, tgt.z);
      (this.beam.material as THREE.MeshBasicMaterial).opacity = 0.16 + Math.sin(t * 3) * 0.06;
    }
  }

  private targetPos(): { x: number; z: number } | null {
    const step = this.currentStep();
    if (!step) return null;
    if (step.type === "kill" && this.spawned) {
      let best: Enemy | null = null;
      let bd = Infinity;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = e.pos.distanceTo(this.pos);
        if (d < bd) {
          bd = d;
          best = e;
        }
      }
      return best ? { x: best.pos.x, z: best.pos.z } : stepTarget(step);
    }
    return stepTarget(step);
  }

  /* =========================== partículas y cámara =========================== */

  private burst(at: THREE.Vector3, count: number, color: THREE.Color, speed = 6, up = 3) {
    const N = this.pLife.length;
    for (let i = 0; i < count; i++) {
      const idx = this.pHead++ % N;
      this.pPos[idx * 3] = at.x;
      this.pPos[idx * 3 + 1] = at.y;
      this.pPos[idx * 3 + 2] = at.z;
      const a = Math.random() * Math.PI * 2;
      const b = Math.random() * Math.PI;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.pVel[idx * 3] = Math.sin(b) * Math.cos(a) * s;
      this.pVel[idx * 3 + 1] = Math.abs(Math.cos(b)) * s * 0.7 + up;
      this.pVel[idx * 3 + 2] = Math.sin(b) * Math.sin(a) * s;
      this.pCol[idx * 3] = color.r;
      this.pCol[idx * 3 + 1] = color.g;
      this.pCol[idx * 3 + 2] = color.b;
      this.pLife[idx] = 0.5 + Math.random() * 0.6;
    }
  }

  private updateParticles(dt: number) {
    for (let i = 0; i < this.pLife.length; i++) {
      if (this.pLife[i] <= 0) continue;
      this.pLife[i] -= dt;
      this.pPos[i * 3] += this.pVel[i * 3] * dt;
      this.pPos[i * 3 + 1] += this.pVel[i * 3 + 1] * dt;
      this.pPos[i * 3 + 2] += this.pVel[i * 3 + 2] * dt;
      this.pVel[i * 3 + 1] -= 12 * dt;
      if (this.pLife[i] <= 0) this.pPos[i * 3 + 1] = -9999;
    }
    (this.pGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.pGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  private updateCinematicLighting(dt: number) {
    const d = this.dialogue;
    const active = d?.kind === "node" && (IMPORTANT_NODES.has(d.nodeId) || d.nodeId === "c1_sabito_duelo");
    const target = active && !this.indoors() ? 2.8 : 0;
    this.cinematicKeyLight.intensity = THREE.MathUtils.damp(this.cinematicKeyLight.intensity, target, 5, dt);
    this.cinematicFillLight.intensity = THREE.MathUtils.damp(this.cinematicFillLight.intensity, target * 0.6, 5, dt);
    if (target > 0 || this.cinematicKeyLight.intensity > 0.01) {
      const focus = this.pos.clone();
      const id = d?.kind === "node" ? d.nodeId : "";
      const cinematicActor = id === "p0_5" ? this.actors.find(a => a.id === "nezuko") : undefined;
      const cinematicNpc = id.startsWith("c1_sabito") ? this.npcs.find(n => n.def.id === "sabito") :
        id === "c1_1" ? this.npcs.find(n => n.def.id === "urokodaki") : undefined;
      const focusGroup = cinematicActor?.human.group ?? cinematicNpc?.group;
      if (focusGroup) focus.copy(focusGroup.position);
      this.cinematicKeyLight.position.copy(focus).add(new THREE.Vector3(-2, 4, 2));
      this.cinematicFillLight.position.copy(focus).add(new THREE.Vector3(2, 2, -2));
    }
  }

  private updateCamera(dt: number) {
    if (this.indoors()) {
      const mobile = this.camera.aspect < 1;
      const target = new THREE.Vector3(mobile ? this.pos.x * 0.6 : 0, 0.4, mobile ? this.pos.z * 0.5 : -0.6);
      const desired = target.clone().add(new THREE.Vector3(0, mobile ? 12.5 : 13.5, mobile ? 13 : 16));
      this.camera.position.lerp(desired, 1 - Math.exp(-7 * dt));
      this.camera.lookAt(target);
      return;
    }
    if (this.enc && !this.enc.dead) {
      // Cámara de duelo: detrás del jugador, apuntando al oponente (estilo lock-on).
      const e = this.enc;
      const mid = this.pos.clone().lerp(e.pos, 0.42).add(new THREE.Vector3(0, 1.3, 0));
      const away = this.pos.clone().sub(e.pos); away.y = 0;
      if (away.lengthSq() < 0.01) away.set(0, 0, 1);
      away.normalize();
      const side = new THREE.Vector3(-away.z, 0, away.x);
      const desired = this.pos.clone().addScaledVector(away, 6.8).addScaledVector(side, 1.4).add(new THREE.Vector3(0, 3.9, 0));
      const g = terrainHeight(desired.x, desired.z) + 0.9;
      if (desired.y < g) desired.y = g;
      this.camera.position.lerp(desired, 1 - Math.exp(-8 * dt));
      if (this.shake > 0) {
        this.shake = Math.max(0, this.shake - dt * 1.9);
        this.camera.position.add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(this.shake * 0.5));
      }
      this.camera.lookAt(mid);
      this.camYaw = Math.atan2(away.x, away.z);
      return;
    }
    const cutsceneId = this.dialogue?.kind === "node" ? this.dialogue.nodeId : "";
    const cinematic = IMPORTANT_NODES.has(cutsceneId);
    const target = this.pos.clone().add(new THREE.Vector3(0, 1.45, 0));
    if (cinematic) {
      const npcId = cutsceneId.startsWith("c1_sabito") ? "sabito" : cutsceneId === "c1_1" ? "urokodaki" : null;
      const npc = npcId ? this.npcs.find(n => n.def.id === npcId) : null;
      const actor = cutsceneId === "p0_5" ? this.actors.find(a => a.id === (this.dialogue?.kind === "node" && this.dialogue.para >= 2 ? "giyu" : "nezuko")) : null;
      const focus = actor?.human.group.position ?? npc?.group.position;
      if (focus) {
        const look = target.clone().lerp(focus.clone().add(new THREE.Vector3(0, 1.4, 0)), 0.68);
        const from = this.pos.clone().sub(focus); from.y = 0;
        if (from.lengthSq() < 0.01) from.set(0, 0, 1);
        from.normalize();
        const side = new THREE.Vector3(-from.z, 0, from.x);
        const desired = look.clone().addScaledVector(from, 4.4).addScaledVector(side, 1.3).add(new THREE.Vector3(0, 1.15, 0));
        desired.y = Math.max(desired.y, terrainHeight(desired.x, desired.z) + 1.1);
        this.camera.position.lerp(desired, 1 - Math.exp(-3.5 * dt));
        this.camera.lookAt(look);
        return;
      }
    }
    let dist = this.dialogue ? Math.min(5.6, this.camDist) : this.camDist;
    const dir = new THREE.Vector3(
      Math.sin(this.camYaw) * Math.cos(this.camPitch),
      Math.sin(this.camPitch) + 0.17,
      Math.cos(this.camYaw) * Math.cos(this.camPitch),
    ).normalize();
    // Evita que la cámara atraviese el terreno.
    for (let i = 0; i < 6; i++) {
      const probe = target.clone().addScaledVector(dir, dist);
      if (probe.y > terrainHeight(probe.x, probe.z) + 0.8) break;
      dist *= 0.8;
    }
    const desired = target.clone().addScaledVector(dir, dist);
    const ground = terrainHeight(desired.x, desired.z) + 0.8;
    if (desired.y < ground) desired.y = ground;
    this.camera.position.lerp(desired, 1 - Math.exp(-10 * dt));
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 1.9);
      this.camera.position.add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(this.shake * 0.6));
    }
    this.camera.lookAt(target);
  }

  /* =========================== HUD =========================== */

  private encounterView(): EncounterView | null {
    const e = this.enc;
    if (!e) return null;
    return {
      id: e.def.id, name: e.def.name, title: e.def.title, color: e.def.color,
      hp: Math.max(0, e.hp), maxHp: e.def.playerHp, meter: e.meter, goal: e.def.goal, meterLabel: e.def.meterLabel,
      enemyHp: e.def.canAttack && e.def.enemyHp !== undefined ? Math.max(0, e.enemyHp) : null, enemyMaxHp: e.def.canAttack && e.def.enemyHp !== undefined ? e.def.enemyHp : null,
      canAttack: e.def.canAttack, hint: this.fill(e.def.dodgeHint), telegraph: e.telegraph > 0 ? 1 : 0, lunging: e.lunging > 0, perfect: e.perfect, holding: e.holding, parry: e.parry,
      focus: e.focus, maxFocus: 100, guard: e.guard, guardMax: e.def.guardBreak, guardCharged: e.holding,
      flash: e.flash, vulnerable: e.recover > 0 || e.counter > 0,
      playerName: this.name.first, fighter: e.fighter, tagReady: e.tagCd <= 0, tagCd: e.tagCd, chosen: e.chosen, tanjiroHp: Math.max(0, e.tanjiroHp),
      comboStep: (e.combo ?? 0) % e.def.comboChainNames.length,
      comboNames: e.def.comboChainNames.map((c) => (e.fighter === "tanjiro" ? c.tanjiroName : c.name)),
      lastMove: e.lastMove, envReady: (e.envCd ?? 0) <= 0, envLabel: e.def.envActions[(e.envIdx ?? 0) % e.def.envActions.length].label,
      words: e.words ? { prompt: `${e.words.win.phaseLabel} · ${this.fill(e.fighter === "tanjiro" ? e.words.win.tanjiroPrompt : e.words.win.prompt)}`, options: e.words.win.options.map((o) => ({ text: this.fill(e.fighter === "tanjiro" ? o.tanjiroText : o.text), tone: o.tone })), timeLeft: e.words.timeLeft, total: e.def.wordTime } : null,
      reply: e.reply, dead: e.dead, won: e.won,
    };
  }

  private trainingView(): TrainingView | null {
    const tr = this.trn;
    if (!tr) return null;
    const sag = ZONE_BY_ID.sagiri;
    const hut = { x: sag.x - 2, z: sag.z - 5 };
    const total = Math.hypot(hut.x - tr.top.x, hut.z - tr.top.z) || 1;
    const distance = tr.kind === "descent" ? this.trainingStationCenter(tr.station).distanceTo(new THREE.Vector3(this.pos.x, terrainHeight(this.pos.x, this.pos.z), this.pos.z)) : 0;
    const path = THREE.MathUtils.clamp(1 - Math.hypot(hut.x - this.pos.x, hut.z - this.pos.z) / total, 0, 1);
    const station = tr.station < SAGIRI_STATIONS.length ? trainingStation(tr.station) : null;
    return {
      kind: tr.kind,
      label: tr.kind === "descent" ? "Sendero de las Trampas y la Niebla" : "Partir la Roca Sagrada",
      progress: tr.kind === "descent" ? Math.max(path, Math.min(tr.station, 15) / 16) : (ROCK_TRAINING.maxResistance - tr.rockResistance) / ROCK_TRAINING.maxResistance,
      timeLeft: null,
      hits: tr.kind === "descent" ? tr.stationHits : tr.rockCombo,
      hitsNeeded: tr.kind === "descent" ? (station?.required ?? 1) : ROCK_TRAINING.comboLength,
      hp: Math.max(0, tr.hp), maxHp: 6, breath: this.breath,
      message: tr.message, done: tr.done, failed: tr.failed,
      station: tr.station, stationName: station?.name ?? "Meta: cabaña de Urokodaki",
      stationTask: station?.task ?? "Corre con Tanjiro hasta la cabaña.", stationKey: station?.key ?? "WASD",
      stationCount: tr.stationHits, stationRequired: station?.required ?? 1, stationDistance: distance,
      hazardTelegraph: tr.stationTelegraph, hazardMax: tr.stationTelegraphMax,
      agileFlash: tr.agileFlash, agileCount: tr.agileCount,
      rockPhase: tr.rockPhase, rockCharge: tr.rockCharge, rockResistance: tr.rockResistance,
      rockParries: tr.rockParries, rockCombo: tr.rockCombo, rockComboTime: tr.rockComboTime,
      waveTelegraph: tr.waveTelegraph, threadTime: tr.threadTime,
      focusHeld: tr.focusHeld, focusTime: tr.focusTime, focusReady: this.breath >= 4,
      agileReady: tr.agileCd <= 0,
      marker: tr.marker,
      zoneStart: tr.focusTime > 0 ? ROCK_TRAINING.focusedBeatStart : ROCK_TRAINING.beatStart,
      zoneEnd: tr.focusTime > 0 ? ROCK_TRAINING.focusedBeatEnd : ROCK_TRAINING.beatEnd,
    };
  }

  private isImportantMoment() {
    if (!this.started) return false;
    // Pantalla completa para cinemáticas y escenas de historia; el combate queda libre.
    if (this.transition || this.sleepPrompt) return true;
    if (this.trn) return true;
    if (this.dialogue?.kind === "node" && (IMPORTANT_NODES.has(this.dialogue.nodeId) || SKIPPABLE_CINEMATICS.has(this.dialogue.nodeId))) return true;
    return this.enemies.some((e) => e.boss && !e.dead);
  }

  private pushHud() {
    const mission = MISSIONS[Math.min(this.missionIdx, MISSIONS.length - 1)];
    const step = this.currentStep();
    const tgt = this.targetPos();
    let target: OWHud["target"] = null;
    if (tgt) {
      const dx = tgt.x - this.pos.x;
      const dz = tgt.z - this.pos.z;
      const a = Math.atan2(dx, dz);
      const camF = this.camYaw + Math.PI;
      target = { dist: Math.hypot(dx, dz), angle: Math.atan2(Math.sin(a - camF), Math.cos(a - camF)) };
    }
    const alive = this.enemies.filter((e) => !e.dead);
    const boss = alive.find((e) => e.boss);
    let prompt: string | null = null;
    if (!this.dialogue && !this.transition && !this.sleepPrompt && !this.enc && !this.trn) {
      if (this.indoors()) prompt = this.cabinPrompt();
      const t = this.indoors() ? null : this.nearestTalkable();
      if (t) {
        const isTarget = t.kind === "npc" && (step?.type === "talk" || step?.type === "shelter") && step.npc === t.npc.def.id;
        prompt = `E · Hablar con ${t.kind === "npc" ? t.npc.def.name : t.f.def.name}${isTarget ? " ❗" : ""}`;
      }
    }
    const zone = zoneAt(this.pos.x, this.pos.z);
    this.onHud({
      hp: Math.max(0, this.hp),
      maxHp: this.maxHp(),
      breath: this.breath,
      maxBreath: 100,
      rank: Math.min(this.missionIdx, MISSIONS.length),
      zone: this.indoors() ? "Cabaña de Saburo · interior" : zone?.name ?? "Caminos de Japón · Era Taishō",
      missionIndex: Math.min(this.missionIdx, MISSIONS.length - 1),
      missionTotal: MISSIONS.length,
      missionTitle: mission.title,
      missionBriefing: mission.briefing,
      missionCombat: mission.combat,
      steps: mission.steps.map((s, i) => ({ label: s.label, done: this.finished || i < this.stepIdx, current: !this.finished && i === this.stepIdx })),
      stepLabel: step ? step.label : this.finished ? "Historia completada · explora libremente" : "",
      kills: step?.type === "kill" && this.spawned ? { done: this.enemies.length - alive.length, total: this.enemies.length } : null,
      boss: boss ? { name: boss.name, title: boss.title, hp: Math.max(0, boss.hp), maxHp: boss.maxHp } : null,
      target,
      targetPos: tgt,
      player: { x: this.pos.x, z: this.pos.z, yaw: this.yaw, cameraYaw: this.camYaw },
      prompt,
      dialogue: this.dialogueView(),
      finished: this.finished,
      hitFlash: this.hitFlash,
      blizzard: this.blizzard,
      snowfall: this.indoors() ? 0 : this.snowfall,
      interior: this.indoors(),
      canFight: this.canFight(),
      practiceSword: this.missionIdx === 1 && this.stepIdx >= 2 && this.stepIdx <= 5,
      status: hunterStatus(this.missionIdx),
      clock: this.clockLabel(),
      morning: this.isMorning(),
      sleepPrompt: this.sleepPrompt,
      important: this.isImportantMoment(),
      pointerLocked: this.pointerLocked,
      actors: this.actors.map((a) => a.id),
      skippable: !!this.dialogue,
      sideQuest: this.missionIdx === 1 ? {
        level: this.playerLevel(), xp: this.playerXp, nextXp: this.playerLevel() * 100,
        active: this.sideQuestDefs.find(q => q.id === this.sideQuestActive)?.name ?? null,
        available: this.sideQuestDefs.map(q => ({ id: q.id, name: q.name, giver: q.giver, detail: q.detail, requiredLevel: q.requiredLevel, done: this.sideQuestDone.includes(q.id) })),
        unlocked: ["Corte básico", ...(this.playerLevel() >= 3 ? ["Entrenamiento avanzado de concentración"] : []), ...(this.nezukoBuff ? [`🌸 Ánimo de Nezuko: ${this.nezukoBuff.kind === "speed" ? "velocidad" : this.nezukoBuff.kind === "learning" ? "aprendizaje" : "fuerza"} · ${this.nezukoBuff.remaining} entrenamientos`] : [])],
      } : null,
      encounter: this.encounterView(),
      training: this.trainingView(),
      cinematicBanner: this.dialogue?.kind === "node" && this.dialogue.nodeId === "p0_5" && this.dialogue.para === 1
        ? "CINEMÁTICA: Giyu Tomioka coloca el sello de bambú a Nezuko" : null,
      basketVisible: this.player.basket.visible,
      sleepingNpcVisible: this.npcs.some((n) => n.def.id === "nezuko_sleeping" && n.group.visible),
      nezukoFollowing: this.followers.some((f) => f.def.id === "f_nezuko" && f.human.group.visible),
      cinematicNezukoVisible: this.actors.some((actor) => actor.id === "nezuko" && actor.human.group.visible),
      cinematicSealVisible: this.actors.some((actor) => actor.id === "nezuko" && actor.human.group.visible && actor.human.body.getObjectByName("nezuko_muzzle")?.visible === true),
      transition: this.transitionView(),
    });
  }
}
