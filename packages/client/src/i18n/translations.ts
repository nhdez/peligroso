export type LanguageCode = "es" | "en" | string;

export interface TranslationDictionary {
  [key: string]: string;
}

export const DEFAULT_TRANSLATIONS: Record<string, TranslationDictionary> = {
  es: {
    // Header & Navigation
    "app.title": "🃏 Truco Argentino",
    "app.subtitle": "Seleccioná un modo de juego para empezar",
    "app.leave": "← Salir de la partida",
    "app.account": "Cuenta y Personalización",
    "app.admin": "🛡️ Consola Admin",

    // Lobby Game Modes
    "mode.ai": "🤖 Jugar contra la IA (Un Jugador)",
    "mode.local": "👥 2 Jugadores Local (Paso a Paso)",
    "mode.online": "🌐 Partida en Servidor Online",
    "mode.select_seat": "Seleccionar Asiento:",
    "mode.match_id": "ID de la Partida",
    "mode.start_local": "Iniciar Partida Local",
    "mode.connect_server": "Conectarse al Servidor",

    // Phases
    "phase.title": "Fase Actual",
    "phase.primera": "PRIMERA",
    "phase.segunda": "SEGUNDA",
    "phase.tercera": "TERCERA",
    "phase.primera_desc": "Envido y 1ª Mano",
    "phase.segunda_desc": "2ª Mano de Truco",
    "phase.tercera_desc": "Definición de Truco",
    "phase.breakdown": "Desglose de Manos",
    "phase.in_progress": "En Progreso...",
    "phase.pending": "Pendiente",
    "phase.tied": "🤝 Emparde (Parda)",

    // Game Actions & Calls
    "call.envido": "Envido (2)",
    "call.real_envido": "Real Envido (3)",
    "call.falta_envido": "Falta Envido 💥",
    "call.truco": "¡Truco!",
    "call.retruco": "¡Re-Truco! 🔥",
    "call.vale4": "¡Vale 4!! 💥",
    "call.mazo": "Me voy al mazo 🏳️",
    "call.quiero": "Quiero 👍",
    "call.no_quiero": "No Quiero 👎",
    "call.plus_envido": "+ Envido",
    "call.plus_real_envido": "+ Real Envido",
    "call.plus_falta_envido": "+ Falta Envido",

    // Point Stake Meter
    "stake.title": "⚡ Medidor de Puntos en Juego",
    "stake.quiero": "Quiero (Si Acepta)",
    "stake.no_quiero": "No Quiero (Si Rechaza)",
    "stake.base": "Mano Base 1 Pto",
    "stake.active_deck": "Mazo Activo",

    // Game Table Status
    "table.your_turn": "👉 TU TURNO (Jugador {id}) — ¡Arrastrá o hacé clic en una carta!",
    "table.waiting": "⏳ Esperando al Jugador {id}...",
    "table.drop_here": "🖐️ ¡Soltá la carta acá para jugar!",
    "table.opponent_cards": "Cartas jugadas por el oponente (Jugador {id}):",
    "table.your_cards": "Cartas jugadas por vos:",
    "table.your_hand": "Tu Mano (Tantos de Envido: {score}) — Arrastrá o hacé clic:",
    "table.history": "📜 Historial de la Partida",
    "table.arena": "🏟️ Arena: Mat de {name}",

    // Admin & Auth
    "admin.console_title": "🛡️ Consola de Administración",
    "admin.tab_users": "👥 Gestionar Usuarios",
    "admin.tab_decks": "🎴 Temas de Mazos",
    "admin.tab_i18n": "🌐 Traducciones (i18n)",
    "admin.ban": "Banear Usuario",
    "admin.unban": "Desbanear",
    "admin.make_admin": "Hacer Admin",
    "admin.demote": "Quitar Admin",
  },
  en: {
    // Header & Navigation
    "app.title": "🃏 Truco Argentino",
    "app.subtitle": "Select a game mode to start playing",
    "app.leave": "← Leave Match",
    "app.account": "Account & Customization",
    "app.admin": "🛡️ Admin Console",

    // Lobby Game Modes
    "mode.ai": "🤖 Play against AI (Single Player)",
    "mode.local": "👥 Local 2-Player (Pass & Play)",
    "mode.online": "🌐 Online Server Match",
    "mode.select_seat": "Select Seat:",
    "mode.match_id": "Match ID",
    "mode.start_local": "Start Local Match",
    "mode.connect_server": "Connect to Server",

    // Phases
    "phase.title": "Current Phase",
    "phase.primera": "PRIMERA",
    "phase.segunda": "SEGUNDA",
    "phase.tercera": "TERCERA",
    "phase.primera_desc": "Envido & 1st Trick",
    "phase.segunda_desc": "2nd Trick",
    "phase.tercera_desc": "Definition Trick",
    "phase.breakdown": "Tricks Breakdown",
    "phase.in_progress": "In Progress...",
    "phase.pending": "Pending",
    "phase.tied": "🤝 Tied (Parda)",

    // Game Actions & Calls
    "call.envido": "Envido (2)",
    "call.real_envido": "Real Envido (3)",
    "call.falta_envido": "Falta Envido 💥",
    "call.truco": "Truco!",
    "call.retruco": "Re-Truco! 🔥",
    "call.vale4": "Vale 4!! 💥",
    "call.mazo": "Me voy al mazo 🏳️",
    "call.quiero": "Quiero 👍",
    "call.no_quiero": "No Quiero 👎",
    "call.plus_envido": "+ Envido",
    "call.plus_real_envido": "+ Real Envido",
    "call.plus_falta_envido": "+ Falta Envido",

    // Point Stake Meter
    "stake.title": "⚡ Point Stake Meter",
    "stake.quiero": "Quiero (If Accepted)",
    "stake.no_quiero": "No Quiero (If Declined)",
    "stake.base": "Standard 1 Pt Base Hand",
    "stake.active_deck": "Active Deck Theme",

    // Game Table Status
    "table.your_turn": "👉 YOUR TURN (Player {id}) — Drag or click a card to play!",
    "table.waiting": "⏳ Waiting for Player {id}...",
    "table.drop_here": "🖐️ Drop card here to play!",
    "table.opponent_cards": "Opponent (Player {id}) Cards Played:",
    "table.your_cards": "Cards Played by You:",
    "table.your_hand": "Your Hand (Envido Score: {score}) — Drag or click:",
    "table.history": "📜 Game History",
    "table.arena": "🏟️ Arena: {name}'s Mat",

    // Admin & Auth
    "admin.console_title": "🛡️ Admin Management Console",
    "admin.tab_users": "👥 Manage Users",
    "admin.tab_decks": "🎴 Card Deck Themes",
    "admin.tab_i18n": "🌐 Translations (i18n)",
    "admin.ban": "Ban User",
    "admin.unban": "Unban",
    "admin.make_admin": "Make Admin",
    "admin.demote": "Demote",
  },
};
