# CalmSpace

A rule based stress relief chat companion built as a portfolio project. It
holds a short, adaptive text conversation that keeps itself going rather
than just waiting silently, tracks an estimated stress level in real time
on an in-app dashboard, and offers a guided breathing exercise plus two
small games (bubble pop and color match) to help someone reset for a
minute. The whole app leans into a bright, colorful, animated look meant
to feel approachable to a younger audience rather than clinical.

Important: this is a demo project, not a mental health product. It does not
diagnose anything, it is not reviewed by a clinician, and it is not a
substitute for a real person or a professional. The app says this to the
user directly and again if certain crisis-related language is detected.

## How it works

There is no language model behind the chat. Every reply is chosen from
hand written response templates using two simple, transparent signals:

1. **A stress lexicon.** A dictionary of common stress-related and
   calm-related words and phrases, each with a hand assigned weight (for
   example "overwhelmed" is +9, "relaxed" is -8). Every message is scanned
   for these phrases, plus signals like exclamation marks and ALL CAPS
   words, to produce a delta for that single message.
2. **An exponential moving average.** The running "stress score" (0 to
   100) blends 60% of its previous value with 40% of the new message's
   effect, so the meter reacts to what you just said without swinging
   wildly on a single word.

The reply picked for each message first checks for a small list of crisis
related phrases (overriding everything else with a serious, resource
pointing message), then checks whether the message itself was clearly
calming (so "I feel better now" gets acknowledged immediately rather than
waiting for the overall session average to catch up), then falls back to a
tone matched to the current score band: calmer and more grounding as the
score rises, lighter and more affirming as it falls. Several reply options
exist per band and are picked at random so the conversation does not
visibly repeat itself turn after turn.

An onboarding step asks five general 1 to 5 questions before the chat
starts, and their average becomes the starting score, so the meter has a
real baseline rather than opening at an arbitrary number.

## Keeping the conversation going

Real chat does not stop dead the instant one side finishes a sentence, so
the bot does not either. After some replies it follows up with a short,
related question a beat later instead of going quiet and waiting. If the
person goes quiet for a while, the bot checks in with a light, low
pressure nudge ("Still there? No rush, just checking in.") rather than
sitting frozen, and a small idle animation on the companion character
keeps the screen feeling alive between messages. None of this is pushy:
it always backs off immediately once the person starts typing again.

## The dashboard

The "Dashboard" button opens a panel inside the same page, styled like a
BI report: KPI cards (current score, baseline, session average, peak,
messages sent, bubbles popped, chat rating), a live line chart of the
stress score over the conversation, and a doughnut chart of how much of
the session fell into calm, moderate, or high stress bands. It is built
with Chart.js, vendored locally in `vendor/` rather than loaded from a
CDN, so the page works even fully offline and does not depend on an
external service or account (there is no real Power BI integration here,
by design, the goal was a dashboard that feels native to the chat, not a
separate report you have to leave the page to see).

## The animated companion

A small blob character sits in the corner, drawn as inline SVG with a few
swappable face states (neutral, happy, laughing, concerned) controlled by
plain CSS rules keyed off a `data-emotion` attribute, plus CSS keyframe
animations for an idle bob, a periodic wiggle so it never looks frozen,
and a bounce reaction. Clicking it triggers a short, randomly picked
reaction and speech bubble. Its expression follows whichever signal is
more specific: a clearly calming message overrides the general mood with
a happy face even if the overall session score is still elevated, popping
a bubble makes it laugh, and otherwise it reflects the current stress band
(concerned when the score is high, happy when it is low).

## Take a breather

A second panel offers three low effort ways to reset, in tabs:

- **Breathing.** A guided box breathing visual (4 seconds in, hold, out,
  hold, on a loop).
- **Bubble pop.** Glowing, colorful bubbles float up the screen; popping
  one gives a small satisfying animation and nudges the stress meter down
  slightly, framed as a reward rather than a real physiological
  measurement.
- **Color match.** A quick reflex game: tap the tile matching the named
  color before it gets tricky, with a playful shake on a wrong tap and a
  confetti burst on a streak. Same purpose as the breathing exercise and
  bubble pop, just a different kind of quick, low stakes distraction.

## Visual style

The interface uses a bright, animated gradient background, gradient
accented text and buttons, pop in message bubbles, sparkle and confetti
bursts on positive moments (an improving message, a bubble pop, a five
star rating), and a small animated companion that reacts to what is
happening. The goal was something that reads as fun and welcoming to a
younger audience rather than a clinical or corporate looking tool, while
keeping the actual data (the dashboard's KPIs and charts) easy to read.

## Known limitations

This is intentionally simple and the README says so on purpose:

- **Keyword matching, not understanding.** Like any bag-of-words style
  system, it can miss sarcasm, negation ("not stressed at all" still
  matches "stressed"), and anything phrased in a way the lexicon does not
  anticipate.
- **No memory between sessions.** State lives in memory for the current
  page load only. Refreshing the page resets everything. Adding
  `localStorage` or a small backend would be a natural next step if this
  were taken further.
- **Not a clinical or diagnostic tool.** The 0 to 100 score is a rough,
  self-report-based estimate for engagement purposes only, never a
  measurement of someone's actual mental state, and it is described to
  the user that way in the first message.

## Project structure

```
stress-relief-chatbot/
  index.html       # page structure
  style.css        # all styling, dark theme, companion, dashboard, game
  script.js        # stress lexicon, reply logic, state, DOM wiring
  vendor/
    chart.umd.min.js   # Chart.js, vendored so the page works offline
  screenshots/
```

## Running it

No build step and no dependencies to install. From inside the folder:

```
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser. Opening `index.html`
directly by double-clicking usually also works, since everything is
plain HTML, CSS, and JS with no server-side code.

## Author

Built by Alan Sha as a portfolio project applying front-end JavaScript,
lightweight rule based NLP, and dashboard/data-visualisation skills to a
self-contained, no-backend web app.
