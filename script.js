/* =====================================================================
   CalmSpace, a rule based stress relief chat companion.

   This is NOT a large language model and NOT a clinical tool. Every
   reply is chosen from hand written templates using a keyword and
   punctuation based "stress score" estimated from what the user types.
   See README.md for the full explanation of how the scoring works and
   its honest limitations.
   ===================================================================== */

// ---------------------------------------------------------------------
// 1. Stress lexicon: word -> weight. Positive weight = more stressed,
//    negative weight = calmer. Weights are heuristic, not clinical.
// ---------------------------------------------------------------------
const STRESS_LEXICON = {
  // high stress / overwhelm
  "overwhelmed": 9, "overwhelming": 9, "anxious": 8, "anxiety": 8,
  "panic": 10, "panicking": 10, "stressed": 8, "stress": 6,
  "exhausted": 7, "burnt out": 9, "burned out": 9, "burnout": 9,
  "can't cope": 10, "cant cope": 10, "hopeless": 9, "helpless": 8,
  "furious": 8, "angry": 7, "frustrated": 6, "irritated": 5,
  "scared": 7, "afraid": 6, "terrified": 9, "worried": 6, "worry": 6,
  "nervous": 6, "tense": 6, "pressure": 5, "deadline": 5, "deadlines": 5,
  "behind": 4, "failing": 8, "failed": 6, "fail": 5, "crying": 8,
  "cry": 6, "sad": 6, "lonely": 6, "alone": 4, "tired": 4, "sleep": 3,
  "insomnia": 7, "can't sleep": 8, "hate": 7, "sick of": 6, "done with": 5,
  "too much": 6, "so much": 3, "no time": 5, "rejected": 7, "rejection": 7,
  "fired": 8, "quit": 5, "argument": 5, "fight": 5, "sick": 4,
  "pain": 5, "hurts": 5, "broke": 4, "broken": 5, "lost": 4,

  // calm / positive
  "calm": -7, "relaxed": -8, "relax": -6, "better": -5, "good": -3,
  "great": -5, "fine": -3, "okay": -2, "ok": -2, "happy": -6,
  "grateful": -6, "thankful": -6, "thanks": -3, "thank you": -4,
  "relief": -6, "peaceful": -7, "proud": -5, "excited": -4,
  "confident": -5, "hopeful": -5, "improving": -4, "improved": -4,
  "manageable": -4, "under control": -6, "resolved": -5, "solved": -5,
  "sorted": -4, "chill": -5, "fun": -4, "laughing": -6, "laugh": -5,
  "smile": -4, "smiling": -4, "love": -3, "enjoy": -4, "enjoyed": -4,
  "rested": -6, "slept well": -6,
};

const CRISIS_KEYWORDS = [
  "kill myself", "end my life", "end it all", "suicide", "suicidal",
  "hurt myself", "self harm", "self-harm", "don't want to be alive",
  "dont want to be alive", "not worth living", "better off dead",
];

// ---------------------------------------------------------------------
// 2. Response banks. Multiple options per bucket so replies rotate
//    instead of repeating the exact same line, and written with more
//    personality so the bot feels fun rather than clinical.
// ---------------------------------------------------------------------
const REPLIES = {
  crisis: [
    "I'm really glad you told me that, and I want to take it seriously. I'm a simple scripted chat companion, not a crisis service, so please reach out to a real person right now: a crisis line in your country, a doctor, or someone you trust. You matter, and this deserves more support than I can give.",
  ],
  high: [
    "Ooof, okay, that's a lot to carry at once. Let's slow down together for a second, you don't have to fix everything this instant. Wanna try a 30 second breathing bubble with me? It's under \"Take a breather\" up top.",
    "I hear you, that's heavy stuff. You're allowed to just pause for a bit, no gold star needed for pushing through.",
    "That sounds genuinely stressful, and nothing about feeling that way is an overreaction. Let's just breathe for a moment before anything else, deal?",
    "Okay, that's a lot! You don't need to have it all figured out right now. I'm right here, zero rush.",
    "Big feelings detected 👀 Want to vent more, or shake it off with the bubble pop game for a sec?",
  ],
  medium: [
    "That makes sense, it's a fair amount to juggle. What's the one part that feels heaviest right now?",
    "I get why that's on your mind. Wanna talk it through, or would a quick breather help more?",
    "Sounds like today's got some weight to it. You're handling more than you're giving yourself credit for, honestly.",
    "That's a totally reasonable thing to feel stressed about. What would make the next hour feel a tiny bit lighter?",
    "Mm, that tracks. What's the story behind it?",
  ],
  low: [
    "Ooh I like that energy! What's been going right for you today?",
    "Nice, glad it's feeling more manageable! Anything you want to keep doing more of?",
    "That's a good spot to be in. Wanna just chat, or go pop some bubbles for fun?",
    "Love that. Small wins count for a lot, seriously.",
    "Heck yes. Tell me more, I'm here for the good stuff too.",
  ],
  improving: [
    "I'm really glad that helped, that's a genuine shift, even a small one! Let's keep that going.",
    "That's great to hear, you did that, not me. Nice work!",
    "Good, I can feel that lift too. Wanna keep talking, or just enjoy the calmer moment for a bit?",
    "That matters, even if there's still more underneath it. Glad it eased up a little.",
    "Yesss, small victories! What helped just now?",
  ],
  topic_sleep: [
    "Sleep and stress feed each other a lot. Even 10 minutes of winding down screen free before bed can help, though I know that's easier said than done.",
  ],
  topic_work: [
    "Work and deadlines have a way of piling up in your head until they feel bigger than they are. Breaking it into just the next single step can help.",
  ],
  topic_anger: [
    "That frustration makes sense, anger is just a signal that something matters to you. A short walk or even shaking your hands out can help it move through your body.",
  ],
  greeting: [
    "Hey, good to see you! How are you actually feeling right now, not the polite answer, the real one?",
    "Hi there! What's on your mind today?",
  ],
  fallback: [
    "Thanks for sharing that with me. Tell me a bit more about what's going on?",
    "I'm listening, go on.",
    "That's worth talking through. What's underneath that feeling, do you think?",
    "Ooh, say more about that.",
  ],
};

// Short, chatty follow-ups occasionally tacked on right after a main
// reply, so the bot feels like it keeps the conversation going instead
// of always waiting in silence for the next message.
const QUICK_FOLLOWUPS = [
  "Also, random question: what's one tiny thing that always makes you smile?",
  "By the way, I'm a big fan of the bubble game if you ever want a 10 second break.",
  "No pressure to answer that deeply, even one word is fine with me.",
  "Also I'm very proud of you for just showing up and typing today.",
  "Sidebar: what's the last thing that made you laugh?",
];

// Messages the bot sends on its own if the person goes quiet for a
// while, so it feels like an active companion rather than something
// that only speaks when spoken to.
const IDLE_NUDGES = [
  "Still there? 👀 No rush, just checking in.",
  "Random fact while you think: octopuses have three hearts. Anyway, what's up?",
  "I'm just gonna wiggle here happily until you say something 🕺",
  "Wanna play a quick round of color match while you think? It's under \"Take a breather\".",
  "No pressure at all, I'm just happy to hang out. What's on your mind?",
  "Psst, I'm still here. Whenever you're ready.",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------
// 3. App state
// ---------------------------------------------------------------------
const state = {
  baseline: null,
  current: 50,
  history: [],           // {t, score}
  moodCounts: { high: 0, medium: 0, low: 0 },
  messageCount: 0,
  rating: null,
  bubblesPopped: 0,
  colorMatchScore: 0,
  userStyle: { totalLen: 0, exclaim: 0, msgs: 0 },
  crisisTriggered: false,
};

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

// ---------------------------------------------------------------------
// 4. Onboarding questionnaire -> baseline score
// ---------------------------------------------------------------------
const ONBOARDING_QUESTIONS = [
  { q: "How stressed do you feel right now, on a scale of 1 (very calm) to 5 (very stressed)?", key: "now" },
  { q: "How did you sleep last night? 1 (great) to 5 (terrible)?", key: "sleep" },
  { q: "How overwhelmed does today's to do list make you feel? 1 (not at all) to 5 (completely)?", key: "todo" },
  { q: "How tense does your body feel right now? 1 (relaxed) to 5 (very tense)?", key: "tense" },
  { q: "How in control do you feel of what's on your plate? 1 (fully in control) to 5 (not at all)?", key: "control" },
];
let onboardingIndex = 0;
const onboardingAnswers = {};

// ---------------------------------------------------------------------
// 5. Message analysis
// ---------------------------------------------------------------------
function analyzeMessage(raw) {
  const text = raw.toLowerCase();

  for (const phrase of CRISIS_KEYWORDS) {
    if (text.includes(phrase)) return { crisis: true, score: 90, triggers: [phrase] };
  }

  let score = 0;
  const triggers = [];
  for (const [word, weight] of Object.entries(STRESS_LEXICON)) {
    if (text.includes(word)) {
      score += weight;
      triggers.push(word);
    }
  }

  // punctuation / intensity signals
  const exclaims = (raw.match(/!/g) || []).length;
  const caps = (raw.match(/\b[A-Z]{3,}\b/g) || []).length;
  const question = (raw.match(/\?/g) || []).length;
  score += exclaims * 2 + caps * 3 + (question > 1 ? 2 : 0);

  // topic detection (separate from stress score)
  const topics = [];
  if (/sleep|insomnia|tired|awake all night/.test(text)) topics.push("sleep");
  if (/work|deadline|exam|assignment|boss|interview|job/.test(text)) topics.push("work");
  if (/angry|furious|frustrat|mad at/.test(text)) topics.push("anger");

  // normalize into a -30..+40 delta range roughly
  const delta = clamp(score, -30, 40);
  return { crisis: false, delta, triggers, topics };
}

function bucketOf(score) {
  if (score >= 67) return "high";
  if (score >= 34) return "medium";
  return "low";
}

// ---------------------------------------------------------------------
// 6. Reply generation
// ---------------------------------------------------------------------
function generateReply(analysis) {
  if (analysis.crisis) return pick(REPLIES.crisis);

  const bucket = bucketOf(state.current);

  // Respond to what the person just said before falling back to the
  // aggregate session bucket, so a clearly calming message gets
  // acknowledged instead of being met with a "that sounds stressful"
  // reply left over from the aggregate score still being elevated.
  if (analysis.delta <= -5) {
    return pick(REPLIES.improving);
  }

  if (analysis.topics && analysis.topics.includes("anger") && Math.random() < 0.6) {
    return pick(REPLIES.topic_anger);
  }
  if (analysis.topics && analysis.topics.includes("sleep") && Math.random() < 0.5) {
    return pick(REPLIES.topic_sleep);
  }
  if (analysis.topics && analysis.topics.includes("work") && Math.random() < 0.5) {
    return pick(REPLIES.topic_work);
  }

  if (analysis.triggers.length === 0 && Math.abs(analysis.delta) < 2) {
    return pick(REPLIES.fallback);
  }

  return pick(REPLIES[bucket]);
}

// ---------------------------------------------------------------------
// 7. Companion emotion state machine
// ---------------------------------------------------------------------
function companionEmotionFor(bucket, justPopped, justImproved) {
  if (justPopped) return "laugh";
  // A clearly calming message should light the companion up even if the
  // aggregate score is still in a higher band, matching the same
  // precedence generateReply() uses for the text itself, so the face and
  // the words never contradict each other.
  if (justImproved) return "happy";
  if (bucket === "high") return "concerned";
  if (bucket === "low") return "happy";
  return "neutral";
}

// ---------------------------------------------------------------------
// Everything below wires the logic above to the DOM. Kept in the same
// file for a small project like this; see README for the split
// rationale if this were to grow further.
// ---------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const chatLog = document.getElementById("chat-log");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const meterFill = document.getElementById("meter-fill");
  const meterLabel = document.getElementById("meter-label");
  const trendIcon = document.getElementById("trend-icon");
  const disclaimer = document.getElementById("disclaimer-banner");
  const companion = document.getElementById("companion");
  const companionWrap = document.getElementById("companion-wrap");
  const companionBubble = document.getElementById("companion-bubble");
  const confettiLayer = document.getElementById("confetti-layer");

  disclaimer.addEventListener("click", () => disclaimer.classList.toggle("expanded"));

  function addMessage(text, who) {
    const div = document.createElement("div");
    div.className = `msg ${who}`;
    div.textContent = text;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function setCompanionEmotion(emotion, speak) {
    companion.setAttribute("data-emotion", emotion);
    companion.classList.remove("bounce");
    void companion.offsetWidth; // restart animation
    companion.classList.add("bounce");
    if (speak) {
      companionBubble.textContent = speak;
      companionBubble.classList.add("show");
      setTimeout(() => companionBubble.classList.remove("show"), 2200);
    }
  }

  // --- Fun visual effects: sparkles + confetti ------------------------
  function spawnSparkles(count) {
    const rect = companionWrap.getBoundingClientRect();
    const emojis = ["✨", "⭐", "💫"];
    for (let i = 0; i < count; i++) {
      const s = document.createElement("div");
      s.className = "sparkle";
      s.textContent = pick(emojis);
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 30;
      s.style.setProperty("--sx", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--sy", `${Math.sin(angle) * dist}px`);
      s.style.left = `${rect.width / 2}px`;
      s.style.top = `${rect.height / 2}px`;
      companionWrap.appendChild(s);
      setTimeout(() => s.remove(), 950);
    }
  }

  function spawnConfetti(originEl) {
    const rect = (originEl || document.body).getBoundingClientRect();
    const colors = ["#ff6fae", "#8b5cf6", "#ffb648", "#2dd4bf", "#ffe66d", "#4d7cff"];
    for (let i = 0; i < 20; i++) {
      const c = document.createElement("div");
      c.className = "confetti-piece";
      c.style.background = pick(colors);
      c.style.left = `${rect.left + rect.width / 2}px`;
      c.style.top = `${rect.top + rect.height / 2}px`;
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 90;
      c.style.setProperty("--cx", `${Math.cos(angle) * dist}px`);
      c.style.setProperty("--cy", `${Math.sin(angle) * dist - 40}px`);
      c.style.setProperty("--cr", `${Math.random() * 480 - 240}deg`);
      confettiLayer.appendChild(c);
      setTimeout(() => c.remove(), 1050);
    }
  }

  function updateMeter(prevBucket) {
    meterFill.style.width = `${state.current}%`;
    const bucket = bucketOf(state.current);
    meterFill.setAttribute("data-level", bucket);
    meterLabel.textContent = `${Math.round(state.current)} / 100`;

    if (prevBucket) {
      if (state.current > prevBucket + 2) trendIcon.textContent = "▲";
      else if (state.current < prevBucket - 2) trendIcon.textContent = "▼";
      else trendIcon.textContent = "▬";
    }
    state.history.push({ t: state.history.length, score: state.current });
    state.moodCounts[bucket] = (state.moodCounts[bucket] || 0) + 1;
    // Dashboard rendering must never be able to break the caller (e.g. the
    // onboarding flow, which sets its "done" flag right after calling this).
    try {
      renderDashboard();
    } catch (err) {
      console.error("Dashboard render failed, continuing without it:", err);
    }
  }

  // --- Idle nudge system: the bot keeps talking if you go quiet -------
  let idleTimer = null;
  let idleAliveTimer = null;
  function resetIdleNudge() {
    clearTimeout(idleTimer);
    if (document.getElementById("onboarding-flag").value !== "done") return;
    idleTimer = setTimeout(() => {
      addMessage(pick(IDLE_NUDGES), "bot");
      setCompanionEmotion("happy", null);
      resetIdleNudge();
    }, 13000 + Math.random() * 5000);
  }
  function startAliveTicks() {
    clearInterval(idleAliveTimer);
    idleAliveTimer = setInterval(() => {
      companion.classList.remove("wave");
      void companion.offsetWidth;
      companion.classList.add("wave");
    }, 7000 + Math.random() * 3000);
  }
  startAliveTicks();

  function pushBotReply(text, chatty) {
    setTimeout(() => {
      addMessage(text, "bot");
      resetIdleNudge();
      // Sometimes chain a quick, playful follow up so the bot feels
      // like it keeps the conversation going rather than always
      // waiting in silence for the next message.
      if (chatty && Math.random() < 0.35) {
        setTimeout(() => {
          addMessage(pick(QUICK_FOLLOWUPS), "bot");
          resetIdleNudge();
        }, 900 + Math.random() * 500);
      }
    }, 400 + Math.random() * 400);
  }

  function handleOnboardingAnswer(raw) {
    const n = parseInt(raw.trim(), 10);
    const q = ONBOARDING_QUESTIONS[onboardingIndex];
    if (isNaN(n) || n < 1 || n > 5) {
      pushBotReply("Just a number from 1 to 5 works best here, whatever feels closest.");
      return;
    }
    onboardingAnswers[q.key] = n;
    onboardingIndex++;
    if (onboardingIndex < ONBOARDING_QUESTIONS.length) {
      pushBotReply(ONBOARDING_QUESTIONS[onboardingIndex].q);
    } else {
      const vals = Object.values(onboardingAnswers);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      state.baseline = clamp(((avg - 1) / 4) * 100, 0, 100);
      state.current = state.baseline;
      updateMeter(null);
      document.getElementById("onboarding-flag").value = "done";
      pushBotReply(`Thanks for that! Your starting stress reading is ${Math.round(state.baseline)} out of 100. That's just a starting point, not a diagnosis, it'll move around as we talk. So, what's on your mind right now?`, true);
    }
  }

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = chatInput.value.trim();
    if (!raw) return;
    addMessage(raw, "user");
    chatInput.value = "";
    state.messageCount++;
    state.userStyle.msgs++;
    state.userStyle.totalLen += raw.length;
    state.userStyle.exclaim += (raw.match(/!/g) || []).length;
    resetIdleNudge();

    if (document.getElementById("onboarding-flag").value !== "done") {
      handleOnboardingAnswer(raw);
      return;
    }

    const analysis = analyzeMessage(raw);
    const prevBucket = state.current;

    if (analysis.crisis) {
      state.crisisTriggered = true;
      state.current = 95;
      updateMeter(prevBucket);
      setCompanionEmotion("concerned", null);
      pushBotReply(generateReply(analysis));
      return;
    }

    state.current = clamp(state.current * 0.6 + clamp(state.current + analysis.delta, 0, 100) * 0.4, 0, 100);
    updateMeter(prevBucket);

    const bucket = bucketOf(state.current);
    const justImproved = analysis.delta <= -5;
    setCompanionEmotion(companionEmotionFor(bucket, false, justImproved));
    if (bucket === "low" || justImproved) spawnSparkles(4);
    pushBotReply(generateReply(analysis), true);
  });

  companion.addEventListener("click", () => {
    const reactions = [
      { emotion: "laugh", say: "Hehe, that tickled!" },
      { emotion: "happy", say: "Hi! I'm right here with you." },
      { emotion: "jump", say: "Boop!" },
      { emotion: "happy", say: "You're doing better than you think." },
      { emotion: "laugh", say: "Wheee!" },
    ];
    const r = pick(reactions);
    setCompanionEmotion(r.emotion, r.say);
    spawnSparkles(5);
    setTimeout(() => setCompanionEmotion(companionEmotionFor(bucketOf(state.current), false)), 1600);
  });

  // --- Dashboard -------------------------------------------------
  let chart = null;
  let moodChart = null;

  function renderDashboard() {
    document.getElementById("kpi-current").textContent = Math.round(state.current);
    document.getElementById("kpi-baseline").textContent = state.baseline !== null ? Math.round(state.baseline) : "-";
    const avg = state.history.length
      ? Math.round(state.history.reduce((a, b) => a + b.score, 0) / state.history.length)
      : 0;
    document.getElementById("kpi-avg").textContent = avg;
    document.getElementById("kpi-peak").textContent = state.history.length
      ? Math.round(Math.max(...state.history.map((h) => h.score))) : 0;
    document.getElementById("kpi-messages").textContent = state.messageCount;
    document.getElementById("kpi-rating").textContent = state.rating ? `${state.rating} / 5` : "Not rated yet";
    document.getElementById("kpi-bubbles").textContent = state.bubblesPopped;

    if (typeof Chart === "undefined") {
      // Chart.js failed to load (e.g. offline, blocked script). The chat
      // and stress meter must keep working regardless, only the two
      // canvas charts are skipped.
      return;
    }

    const ctx = document.getElementById("trend-chart");
    if (ctx) {
      const labels = state.history.map((h) => h.t);
      const data = state.history.map((h) => Math.round(h.score));
      if (!chart) {
        chart = new Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [{
              label: "Stress level",
              data,
              borderColor: "#ff6fae",
              backgroundColor: "rgba(255,111,174,0.18)",
              fill: true,
              tension: 0.35,
              pointRadius: 2,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { min: 0, max: 100, ticks: { color: "#c9c2e6" }, grid: { color: "rgba(255,255,255,0.08)" } },
              x: { ticks: { color: "#c9c2e6" }, grid: { color: "rgba(255,255,255,0.08)" } },
            },
            plugins: { legend: { labels: { color: "#fdfcff" } } },
          },
        });
      } else {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update();
      }
    }

    const moodCtx = document.getElementById("mood-chart");
    if (moodCtx) {
      const values = [state.moodCounts.low, state.moodCounts.medium, state.moodCounts.high];
      if (!moodChart) {
        moodChart = new Chart(moodCtx, {
          type: "doughnut",
          data: {
            labels: ["Calm", "Moderate", "High stress"],
            datasets: [{ data: values, backgroundColor: ["#2dd4bf", "#ffb648", "#ff5f7e"] }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom", labels: { color: "#fdfcff" } } },
          },
        });
      } else {
        moodChart.data.datasets[0].data = values;
        moodChart.update();
      }
    }
  }

  document.getElementById("dashboard-toggle").addEventListener("click", () => {
    document.getElementById("dashboard-panel").classList.toggle("open");
    renderDashboard();
  });
  document.getElementById("dashboard-close").addEventListener("click", () => {
    document.getElementById("dashboard-panel").classList.remove("open");
  });

  // --- Take a breather panel (breathing + games) ----------------------
  const breatherPanel = document.getElementById("breather-panel");
  document.getElementById("breather-toggle").addEventListener("click", () => {
    breatherPanel.classList.toggle("open");
  });
  document.getElementById("breather-close").addEventListener("click", () => {
    breatherPanel.classList.remove("open");
  });

  const breathCircle = document.getElementById("breath-circle");
  const breathText = document.getElementById("breath-text");
  let breathTimer = null;
  function startBreathing() {
    stopBreathing();
    const phases = [
      { text: "Breathe in...", cls: "in", ms: 4000 },
      { text: "Hold...", cls: "hold", ms: 4000 },
      { text: "Breathe out...", cls: "out", ms: 4000 },
      { text: "Hold...", cls: "hold", ms: 4000 },
    ];
    let i = 0;
    function step() {
      const p = phases[i % phases.length];
      breathText.textContent = p.text;
      breathCircle.className = `breath-circle ${p.cls}`;
      i++;
      breathTimer = setTimeout(step, p.ms);
    }
    step();
  }
  function stopBreathing() {
    if (breathTimer) clearTimeout(breathTimer);
    breathText.textContent = "Press start when ready";
    breathCircle.className = "breath-circle";
  }
  document.getElementById("breath-start").addEventListener("click", startBreathing);
  document.getElementById("breath-stop").addEventListener("click", stopBreathing);

  // --- Bubble pop mini game -------------------------------------------
  const bubbleField = document.getElementById("bubble-field");
  const bubbleScoreEl = document.getElementById("bubble-score");
  const BUBBLE_COLORS = ["#ff6fae", "#8b5cf6", "#2dd4bf", "#ffb648", "#4d7cff", "#ffe66d"];
  let bubbleSpawner = null;
  function spawnBubble() {
    const b = document.createElement("div");
    b.className = "bubble";
    const color = pick(BUBBLE_COLORS);
    b.style.background = `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7), ${color})`;
    b.style.color = color;
    const size = 26 + Math.random() * 38;
    b.style.width = `${size}px`;
    b.style.height = `${size}px`;
    b.style.left = `${Math.random() * 90}%`;
    b.style.animationDuration = `${4 + Math.random() * 3}s`;
    b.addEventListener("click", () => {
      b.classList.add("popped");
      state.bubblesPopped++;
      bubbleScoreEl.textContent = `Bubbles popped: ${state.bubblesPopped}`;
      state.current = clamp(state.current - 3, 0, 100);
      updateMeter(state.current);
      setCompanionEmotion("laugh", "Pop!");
      if (state.bubblesPopped % 3 === 0) spawnConfetti(b);
      setTimeout(() => b.remove(), 200);
    });
    b.addEventListener("animationend", () => b.remove());
    bubbleField.appendChild(b);
  }

  // --- Color match mini game -------------------------------------------
  const COLOR_PALETTE = [
    { name: "Pink", hex: "#ff6fae" },
    { name: "Purple", hex: "#8b5cf6" },
    { name: "Orange", hex: "#ffb648" },
    { name: "Teal", hex: "#2dd4bf" },
    { name: "Yellow", hex: "#ffe66d" },
    { name: "Blue", hex: "#4d7cff" },
  ];
  const cgGrid = document.getElementById("cg-grid");
  const cgTargetWord = document.getElementById("cg-target-word");
  const cgScoreEl = document.getElementById("cg-score");

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function newColorRound() {
    const shuffled = shuffle(COLOR_PALETTE);
    const target = shuffled[0];
    cgTargetWord.textContent = target.name;
    cgTargetWord.style.color = target.hex;
    cgGrid.innerHTML = "";
    shuffled.forEach((c) => {
      const tile = document.createElement("div");
      tile.className = "cg-tile";
      tile.style.background = c.hex;
      tile.addEventListener("click", () => {
        if (c.name === target.name) {
          state.colorMatchScore++;
          cgScoreEl.textContent = `Score: ${state.colorMatchScore}`;
          spawnConfetti(tile);
          setCompanionEmotion("laugh", "Nice!");
          newColorRound();
        } else {
          tile.classList.add("shake");
          setTimeout(() => tile.classList.remove("shake"), 400);
        }
      });
      cgGrid.appendChild(tile);
    });
  }

  // --- Breather tab switching ------------------------------------------
  document.getElementById("game-tab").addEventListener("click", () => switchBreatherTab("game"));
  document.getElementById("breathe-tab").addEventListener("click", () => switchBreatherTab("breathe"));
  document.getElementById("colorgame-tab").addEventListener("click", () => switchBreatherTab("color"));

  function switchBreatherTab(tab) {
    document.getElementById("game-panel").classList.toggle("hidden", tab !== "game");
    document.getElementById("breathe-panel-inner").classList.toggle("hidden", tab !== "breathe");
    document.getElementById("colorgame-panel").classList.toggle("hidden", tab !== "color");
    document.getElementById("game-tab").classList.toggle("active", tab === "game");
    document.getElementById("breathe-tab").classList.toggle("active", tab === "breathe");
    document.getElementById("colorgame-tab").classList.toggle("active", tab === "color");
    if (tab === "game" && !bubbleSpawner) {
      bubbleSpawner = setInterval(spawnBubble, 900);
    }
    if (tab === "color" && cgGrid.children.length === 0) {
      newColorRound();
    }
  }

  // --- Rating -------------------------------------------------------
  document.querySelectorAll(".star").forEach((star) => {
    star.addEventListener("click", () => {
      state.rating = parseInt(star.dataset.value, 10);
      document.querySelectorAll(".star").forEach((s) => {
        s.classList.toggle("filled", parseInt(s.dataset.value, 10) <= state.rating);
      });
      document.getElementById("rating-thanks").textContent = `Thanks for rating this chat ${state.rating}/5!`;
      if (state.rating === 5) spawnConfetti(star);
      renderDashboard();
    });
  });

  // --- Kick things off ----------------------------------------------
  addMessage("Hi, I'm CalmSpace! Before we talk, a quick disclaimer: I'm a scripted companion, not a therapist or a medical service. If you're in crisis, please contact a real crisis line or professional. Tap this banner any time to see that again.", "bot");
  addMessage(ONBOARDING_QUESTIONS[0].q, "bot");
  updateMeter(null);
});
