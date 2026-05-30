---
name: mental-health-companion
description: Guide mental-health and emotional check-in app work with compassionate, non-clinical language, safe reflection flows, emotion signal taxonomies, screening flows, scoring layers, implicit context signals, Groq-powered adaptive companion conversations, crisis-aware UX, healing microcopy, and i18n-ready content. Use when creating or revising mental-health app screens, onboarding, PHQ-9/GAD-7/WHO-5 style check-ins, deterministic screening scoring, time-aware AI tone, Groq chat API handoff, reflection prompts, mood labels, coping-action copy, Vietnamese/English wording, or JSON localization for a wellness product.
---

# Mental Health Companion

## Core Rule

Use gentle, validating language that helps users notice their state without diagnosing them. Prefer everyday emotional signals over medicalized labels, and keep the app voice calm, grounded, and choice-based.

Avoid urgent or pathologizing labels unless the user explicitly asks for clinical content. For example, prefer `Racing Thoughts` over `Anxiety Attack` when describing a common mind-state option.

## Workflow

1. Identify the content surface: check-in labels, reflection screen, action button, onboarding, empty state, notification, or i18n JSON.
2. Choose the matching model:
   - Use `Emotion Check App Concept` for direct self-awareness categories.
   - Use `Emotion Signal Layers` for reflection flows that combine causes, needs, energy, and next steps.
   - Use `Structured Screening Flow` for WHO-5, PHQ-9, GAD-7, deterministic scoring, implicit time context, Groq adaptive conversation, or crisis-aware check-in implementation.
3. Write short, concrete copy. Keep labels scannable and prompts supportive.
4. Provide Vietnamese and English pairs when localization is useful.
5. For implementation tasks, output stable i18n keys and JSON-shaped content.
6. Include a safety-aware disclaimer only when the content approaches crisis, self-harm, diagnosis, or treatment advice.

## Emotion Check App Concept

Use three layers for a simple check-in:

- `Physical Signs`: body signals such as `Muscle Tension`, `Restlessness`, `Fatigue`.
- `Mind State`: cognitive signals such as `Racing Thoughts`, `Brain Fog`, `Overthinking`.
- `Emotional Tone`: core feelings such as `Overwhelmed`, `Unsettled`, `Disconnected`.

Keep labels neutral and self-observable. Do not imply that selecting a signal proves a condition.

## Emotion Signal Layers

Use four input blocks that converge into reflection:

- `Internal Triggers`: inner experiences such as thoughts, memories, pressure, expectations.
- `External Factors`: outside context such as work, relationships, noise, deadlines, social input.
- `Current Needs`: immediate needs such as rest, clarity, reassurance, food, space, connection.
- `Energy Reserves`: available capacity such as low, steady, stretched, depleted.

Use `My Reflection` as the safe central checkpoint. Close with one gentle action such as `Take a Mindful Step` or `Soothe & Release`.

## Microcopy Style

Write microcopy that sounds like a supportive companion, not a clinician.

- Use: "Take a moment to notice what's here."
- Use: "You do not need to solve everything right now."
- Use: "Choose one small step that feels possible."
- Avoid: "Your symptoms indicate..."
- Avoid: "You are experiencing an attack."
- Avoid: "Fix your anxiety now."

When uncertain, reduce intensity. Use verbs like `notice`, `name`, `pause`, `soften`, `release`, `choose`, and `return`.

## References

Read `references/content-system.md` when you need exact category tables, bilingual label pairs, example prompts, or i18n JSON structure.

Read `references/screening-flow.md` when building a structured chat-style screening flow, scoring WHO-5/PHQ-9/GAD-7 signals, handling PHQ-9 item 9, analyzing high-item patterns, adding implicit time context, or handing off into a Groq-powered adaptive AI companion conversation.
