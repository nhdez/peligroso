export type LanguageCode = "es" | "en" | string;

export interface TranslationDictionary {
  [key: string]: string;
}

export const DEFAULT_TRANSLATIONS: Record<string, TranslationDictionary> = {
  es: {
    // Header & Navigation
    "app.title": "🔥 Peligroso",
    "app.subtitle": "Selecciona un modo de juego para empezar",
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

    // Active Session Reconnection Banner
    "active_session.title": "¡Partida en Progreso! (Partida #{id})",
    "active_session.desc": "Te desconectaste o recargaste la página. Haz clic abajo para volver a la partida.",
    "active_session.rejoin": "⚡ Volver a la Partida",
    "active_session.abandon": "Abandonar Sesión ❌",

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
    "phase.tied": "🤝 Empate (Parda)",

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
    "table.your_turn": "👉 TU TURNO (Jugador {id}) — ¡Arrastra o haz clic en una carta!",
    "table.waiting": "⏳ Esperando al Jugador {id}...",
    "table.drop_here": "🖐️ ¡Suelta la carta aquí para jugar!",
    "table.opponent_cards": "Cartas jugadas por el oponente (Jugador {id}):",
    "table.your_cards": "Cartas jugadas por ti:",
    "table.your_hand": "Tu Mano (Puntos de Envido: {score}) — Arrastra o haz clic:",
    "table.history": "📜 Historial de la Partida",
    "table.arena": "🏟️ Arena: Mat de {name}",

    // Voice & Social Panel Controls
    "social.mic_off": "Micrófono: Desactivado",
    "social.mic_muted": "Micrófono: Silenciado",
    "social.mic_active": "Micrófono: Activo",
    "social.cam_active": "Cámara: Transmitiendo",
    "social.cam_off": "Cámara: Desactivada",
    "social.audio_muted": "Salida de Audio: Silenciada",
    "social.audio_active": "Salida de Audio: Activa",
    "social.spectators_title": "👥 Control de Audio de Espectadores",
    "social.mute_specs_on": "Silenciar Espectadores: SI",
    "social.mute_specs_off": "Silenciar Espectadores: NO",
    "social.send": "Enviar",
    "social.placeholder": "Enviar mensaje...",
    "social.live_chat": "💬 Chat en Vivo",
    "social.game_logs": "📜 Registro de Partida",

    // Suerte de Reyes Opening Ritual
    "reyes.title": "Suerte de Reyes",
    "reyes.subtitle": "Sacando cartas boca arriba... ¡El que saque el primer Rey (12) mezcla y reparte!",
    "reyes.resolved": "¡SUERTE DE REYES RESUELTA!",
    "reyes.won_msg": "¡El Jugador {id} sacó el {rank} de {suit}!",
    "reyes.dealer_msg": "El Jugador {id} mezclará y repartirá la primera mano.",
    "reyes.begin": "⚡ Iniciar Juego",
    "reyes.skip": "⏩ Saltar Ritual",

    // CS2 Victory Showcase Card
    "victory.title": "MVP DE LA PARTIDA — TARJETA DE VICTORIA",
    "victory.anthem_active": "🎵 Himno de Victoria Activo ({sec}s)",
    "victory.winner_label": "GANADOR DE LA PARTIDA | Rating ELO: {elo}",
    "victory.dismiss": "Cerrar Tarjeta de Victoria",

    // Profile & Account Customization
    "profile.avatar_label": "👤 Imagen de Avatar de Perfil",
    "profile.country_label": "🌍 Seleccionar País (Bandera)",
    "profile.deck_label": "🎴 Seleccionar Tema del Mazo de Cartas",
    "profile.mat_preset_label": "🏟️ Seleccionar Tapete de la Arena",
    "profile.mat_custom_label": "🖼️ O Subir Imagen de Tapete Personalizado",
    "profile.opacity_label": "🌗 Opacidad del Tapete ({percent}%)",
    "profile.victory_title": "🏆 Tarjeta de Victoria Estilo CS2",
    "profile.victory_img_label": "📸 URL de Imagen / Banner de Victoria",
    "profile.victory_music_label": "🎵 Himno de Victoria (URL de Video de YouTube)",
    "profile.victory_music_desc": "¡Reproduce 10 segundos de música de victoria cuando ganas!",
    "profile.victory_quote_label": "💬 Lema / Frase de Victoria",
    "profile.save": "Guardar Cambios",

    // Leaderboard & Matchmaking Queue
    "leaderboard.title": "🏆 Tabla de Clasificación Global",
    "leaderboard.rank": "Puesto",
    "leaderboard.player": "Jugador",
    "leaderboard.elo": "Rating ELO",
    "leaderboard.win_rate": "Porcentaje de Victorias",
    "queue.searching": "🔍 Buscando Oponente 1v1...",
    "queue.estimated": "Tiempo estimado: ~10s",
    "queue.switch_ai": "🤖 Jugar contra la IA",
    "queue.cancel": "Cancelar Búsqueda",

    // Admin Console
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
    "app.title": "🔥 Peligroso",
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

    // Active Session Reconnection Banner
    "active_session.title": "Active Match In Progress! (Match #{id})",
    "active_session.desc": "You were disconnected or refreshed. Click rejoin below to return to your game.",
    "active_session.rejoin": "⚡ Rejoin Match Now",
    "active_session.abandon": "Abandon Session ❌",

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

    // Voice & Social Panel Controls
    "social.mic_off": "Microphone: Off",
    "social.mic_muted": "Microphone: Muted",
    "social.mic_active": "Microphone: Active",
    "social.cam_active": "Camera Stream: Active",
    "social.cam_off": "Camera Stream: Off",
    "social.audio_muted": "Audio Output: Muted",
    "social.audio_active": "Audio Output: Active",
    "social.spectators_title": "👥 Spectator Audio Controls",
    "social.mute_specs_on": "Mute Spectators: ON",
    "social.mute_specs_off": "Mute Spectators: OFF",
    "social.send": "Send",
    "social.placeholder": "Send message...",
    "social.live_chat": "💬 Live Chat",
    "social.game_logs": "📜 Game Logs",

    // Suerte de Reyes Opening Ritual
    "reyes.title": "Suerte de Reyes",
    "reyes.subtitle": "Drawing cards face-up... Whoever gets the first King (12) shuffles and deals!",
    "reyes.resolved": "¡SUERTE DE REYES RESOLVED!",
    "reyes.won_msg": "Player {id} drew the {rank} de {suit}!",
    "reyes.dealer_msg": "Player {id} will shuffle and deal Hand #1.",
    "reyes.begin": "⚡ Begin Game",
    "reyes.skip": "⏩ Skip Ritual",

    // CS2 Victory Showcase Card
    "victory.title": "MATCH MVP — VICTORY CARD",
    "victory.anthem_active": "🎵 10s Anthem Active ({sec}s)",
    "victory.winner_label": "MATCH WINNER | ELO Rating: {elo}",
    "victory.dismiss": "Dismiss Victory Showcase",

    // Profile & Account Customization
    "profile.avatar_label": "👤 Profile Avatar Image",
    "profile.country_label": "🌍 Select Country (Flag Badge)",
    "profile.deck_label": "🎴 Select Card Deck Theme",
    "profile.mat_preset_label": "🏟️ Select Arena Mat Surface",
    "profile.mat_custom_label": "🖼️ Or Upload Custom Arena Mat Image",
    "profile.opacity_label": "🌗 Mat Surface Opacity ({percent}%)",
    "profile.victory_title": "🏆 CS2-Style Victory Showcase Card",
    "profile.victory_img_label": "📸 Victory Image / Banner URL",
    "profile.victory_music_label": "🎵 Victory Anthem (YouTube Video URL)",
    "profile.victory_music_desc": "Plays 10 seconds of background victory audio in the arena when you win!",
    "profile.victory_quote_label": "💬 Victory Motto / Quote",
    "profile.save": "Save Changes",

    // Leaderboard & Matchmaking Queue
    "leaderboard.title": "🏆 Global Leaderboard & Top Players",
    "leaderboard.rank": "Rank",
    "leaderboard.player": "Player",
    "leaderboard.elo": "ELO Rating",
    "leaderboard.win_rate": "Win Rate",
    "queue.searching": "🔍 Searching for 1v1 Opponent...",
    "queue.estimated": "Estimated wait: ~10s",
    "queue.switch_ai": "🤖 Switch to AI Match",
    "queue.cancel": "Cancel Queue",

    // Admin Console
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
