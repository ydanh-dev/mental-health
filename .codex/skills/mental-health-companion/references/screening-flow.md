# Structured Screening Flow

Use this reference when building a mental-health check-in for users who feel that "something is not right." The flow gathers structured signals first, then hands off to an adaptive companion conversation. Keep the experience non-diagnostic: reflect patterns, do not label disorders, and do not present scores to the user unless explicitly requested.

## Product Shape

Build two phases:

1. Screening: present WHO-5 first, then conditionally PHQ-9 and GAD-7, as natural chat bubbles rather than a form.
2. Adaptive conversation: after enough signal is collected, reflect gently and ask one context-aware open question.

Recommended stack for this app context:

- React Native with Expo and TypeScript.
- Local state only until privacy policy and consent are clear: AsyncStorage, Zustand, or equivalent.
- Groq Chat Completions API with `llama-3.3-70b-versatile` may drive the adaptive conversation.
- Groq uses an OpenAI-compatible chat-completions format, so keep the service wrapper easy to swap later if the model/provider changes.
- Read current Groq pricing and rate limits from `https://console.groq.com` or Groq docs before promising limits in product copy.

For Expo code in `/Users/bunny/mental-health`, first read the exact versioned Expo docs required by `AGENTS.md`: `https://docs.expo.dev/versions/v56.0.0/`.

## Screening Order

Run this decision tree:

```text
Start -> WHO-5, 5 questions
      -> WHO-5 percentage < 50?
         -> yes: run PHQ-9 and GAD-7, interleaving questions
         -> no: move to adaptive conversation with signal "user seems broadly okay but wants to share"

If PHQ-9 item 9 is answered "several_days" or higher:
  set flags.isCrisis = true immediately
  show the crisis banner immediately
  continue the flow unless the product requirement says otherwise
```

Interleave PHQ-9 and GAD-7 after WHO-5 when deep screening is needed. Keep a muted progress indicator such as `3 / 9`; do not gamify or emphasize scores.

## State Shape

```ts
interface ScreeningState {
  currentInstrument: 'who5' | 'phq9' | 'gad7' | 'done'
  currentQuestionIndex: number
  answers: Record<string, string>
  scores: {
    who5?: number
    phq9?: number
    gad7?: number
    who5_percentage?: number
  }
  flags: {
    isCrisis: boolean
    needsDeepScreening: boolean
  }
  completedAt?: Date
}
```

Persist locally only. Avoid sending raw screening answers to a server unless the app has explicit consent, privacy policy coverage, and a clear retention policy.

## Question Data

Store screening content in data, not components, so it can be localized later. Prefer `src/data/screening.json`.

Use these instruments and scale ids:

- `who5`: 5 items, `scale: "frequency"`, timeframe `2 tuần gần đây`, scoring values `always: 5`, `most_of_time: 4`, `more_than_half: 3`, `less_than_half: 2`, `some_of_time: 1`, `never: 0`, `max_raw: 25`, `percentage_multiply: 4`, `threshold_low: 50`.
- `phq9`: 9 items, `scale: "frequency_4"`, timeframe `2 tuần gần đây`, scoring values `not_at_all: 0`, `several_days: 1`, `more_than_half: 2`, `nearly_every_day: 3`, `max_raw: 27`. Mark item `phq9_9` as `sensitive: true`, `crisis_trigger: true`, and weight `2` only as a signal priority, not for PHQ-9 scoring.
- `gad7`: 7 items, `scale: "frequency_4"`, timeframe `2 tuần gần đây`, same 0-3 scale values, `max_raw: 21`.

Scale labels:

```json
{
  "frequency": [
    ["always", "Luôn luôn"],
    ["most_of_time", "Hầu hết thời gian"],
    ["more_than_half", "Hơn nửa thời gian"],
    ["less_than_half", "Dưới nửa thời gian"],
    ["some_of_time", "Thỉnh thoảng"],
    ["never", "Không bao giờ"]
  ],
  "frequency_4": [
    ["not_at_all", "Không hề"],
    ["several_days", "Vài ngày"],
    ["more_than_half", "Hơn nửa số ngày"],
    ["nearly_every_day", "Gần như mỗi ngày"]
  ]
}
```

Question text:

```text
who5_1: Bạn có cảm thấy vui vẻ và tâm trạng tốt không?
who5_2: Bạn có cảm thấy bình yên và thư giãn không?
who5_3: Bạn có cảm thấy năng động và tràn đầy sức sống không?
who5_4: Bạn có thức dậy với cảm giác tươi tỉnh và được nghỉ ngơi đủ không?
who5_5: Cuộc sống hàng ngày của bạn có nhiều điều thú vị không?

phq9_1: Bạn có ít hứng thú hoặc niềm vui trong những việc thường ngày không?
phq9_2: Bạn có cảm thấy buồn chán, trống rỗng hoặc tuyệt vọng không?
phq9_3: Bạn có gặp khó khăn khi ngủ, ngủ không ngon, hoặc ngủ quá nhiều không?
phq9_4: Bạn có cảm thấy mệt mỏi hoặc thiếu năng lượng không?
phq9_5: Bạn có ăn kém ngon hoặc ăn quá nhiều không?
phq9_6: Bạn có cảm thấy tệ về bản thân - như mình thất bại hoặc đã làm gia đình thất vọng không?
phq9_7: Bạn có khó tập trung vào những việc như đọc sách hoặc xem TV không?
phq9_8: Bạn có di chuyển hoặc nói chuyện chậm hơn mức mọi người có thể nhận ra không? Hoặc ngược lại - bồn chồn, đứng ngồi không yên?
phq9_9: Bạn có có suy nghĩ rằng tốt hơn là nên chết đi, hoặc tự làm hại bản thân không?

gad7_1: Bạn có cảm thấy lo lắng, bất an hoặc căng thẳng không?
gad7_2: Bạn có không thể ngừng lo lắng hoặc kiểm soát sự lo lắng không?
gad7_3: Bạn có lo lắng quá mức về nhiều thứ khác nhau không?
gad7_4: Bạn có khó thư giãn không?
gad7_5: Bạn có bồn chồn đến mức khó ngồi yên không?
gad7_6: Bạn có dễ bực bội hoặc cáu gắt không?
gad7_7: Bạn có sợ hãi như thể điều gì tệ sắp xảy ra không?
```

## Chat UI

Present each question as an AI chat bubble with a small timeframe badge. Put answer options below as horizontally scrollable chips if there are more than four options. After selection:

- Highlight the chosen option.
- Wait 300-500ms before showing the next question.
- Show a typing indicator during the delay if it fits the existing UI.
- Keep progress subtle.

Do not use streaks, badges, reward language, or score-based achievement framing.

## Crisis Handling

If `flags.isCrisis` is true, show a fixed, non-blocking banner above the chat for the rest of the session:

```text
Nếu bạn đang nghĩ đến việc tự làm hại bản thân, bạn không phải một mình.
Đường dây hỗ trợ: 1800 599 920 (miễn phí)
[Gọi ngay]
```

Prioritize immediate safety in copy and assistant prompts. Encourage contacting emergency services, a trusted person, or a local crisis line when there is imminent danger. Do not make the banner a modal unless the product explicitly requires blocking behavior.

## Adaptive Conversation With Groq

Build the system prompt from scores and flags, but do not reveal raw scores to the user. Keep the opening turn reflective and ask at most one question.

Separate deterministic scoring from AI interpretation:

- Use `src/hooks/use_scoring.ts` for fixed scoring from `screening.json`; do not use AI for scores.
- Use `src/utils/time_context.ts` for implicit time-of-day tone context; do not show or log it.
- Use `src/services/groq.ts` for Groq API calls, pattern-aware system prompts, and response generation.
- Use `src/hooks/use_conversation.ts` for post-screening conversation state.

### Deterministic Scoring Layer

Create `src/hooks/use_scoring.ts` when the app needs a reusable score result after screening.

```ts
export interface ScoreResult {
  who5_raw: number
  who5_pct: number
  phq9: number
  gad7: number
  isCrisis: boolean
  needsDeepScreen: boolean
  highItems: string[]
  severity: {
    phq9: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe'
    gad7: 'minimal' | 'mild' | 'moderate' | 'severe'
  }
}
```

Implement `calculateScores(answers: Record<string, string>): ScoreResult` with these rules:

- Read `scale_values` and `thresholds` directly from `screening.json`; do not hardcode scoring numbers in the hook.
- Treat missing answers as score `0`.
- Compute `who5_pct = who5_raw * percentage_multiply`.
- Set `needsDeepScreen = who5_pct < threshold_low`.
- If `needsDeepScreen` is false, leave `phq9` and `gad7` at `0` and avoid interpreting their severity as user-facing data.
- Set `isCrisis = answers.phq9_9 !== 'not_at_all'` when `phq9_9` exists and is not empty.
- Include `highItems` for answers equal to `nearly_every_day` or `most_of_time`.
- Respect `weight` in `screening.json`; `phq9_9` may have weight `2` in product data.
- Export `getSeverityLabel(instrument: string, score: number): string` using JSON thresholds.

Do not log raw `answers` or score objects in production builds.

### Time Context Signal

Create `src/utils/time_context.ts` when the AI companion should adapt tone to when the user opens the app. This is an implicit signal only: do not ask the user, do not show the period in UI, and do not log it in production.

Use these buckets:

```ts
export type TimePeriod =
  | 'late_night'
  | 'early_morning'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'night'

export interface TimeContext {
  hour: number
  period: TimePeriod
  note: string
  isOffHours: boolean
}
```

Period rules:

- `late_night`: 0-4, possible insomnia or circular thoughts.
- `early_morning`: 5-8, possible worry before the day.
- `morning`: 9-11, starting the day, more alert.
- `midday`: 12-13, possible midday fatigue.
- `afternoon`: 14-17, accumulated tiredness.
- `evening`: 18-21, reflection after the day.
- `night`: 22-23, loneliness or difficulty letting thoughts go.

Set `isOffHours = hour < 7 || hour >= 22`.

Call `getTimeContext()` inside `buildSystemPrompt()` so each new AI session uses the current time. Add the note as hidden context:

```text
Bối cảnh thời gian (dùng để điều chỉnh tone, KHÔNG đề cập trực tiếp với user):
${timeCtx.note}
```

When `isOffHours` is true, instruct the AI to be shorter, less probing, and more present. During normal hours, allow one gentle follow-up question.

### Pattern Labels

Use concise Vietnamese labels when building AI context from high items:

```ts
const ITEM_LABELS: Record<string, string> = {
  phq9_1: 'mất hứng thú với mọi thứ',
  phq9_2: 'cảm thấy buồn hoặc tuyệt vọng',
  phq9_3: 'khó ngủ hoặc ngủ quá nhiều',
  phq9_4: 'mệt mỏi, thiếu năng lượng',
  phq9_5: 'ăn uống thất thường',
  phq9_6: 'tự trách bản thân',
  phq9_7: 'khó tập trung',
  phq9_8: 'di chuyển hoặc nói chậm hơn / bồn chồn',
  phq9_9: 'suy nghĩ tự làm hại bản thân',
  gad7_1: 'cảm thấy lo lắng, bất an',
  gad7_2: 'không kiểm soát được lo lắng',
  gad7_3: 'lo lắng quá mức về nhiều thứ',
  gad7_4: 'khó thư giãn',
  gad7_5: 'bồn chồn, không ngồi yên được',
  gad7_6: 'dễ cáu gắt',
  gad7_7: 'sợ hãi như sắp có chuyện xấu',
  who5_1: 'ít cảm thấy vui vẻ',
  who5_2: 'ít cảm thấy bình yên',
  who5_3: 'ít cảm thấy có năng lượng',
  who5_4: 'thức dậy không tươi tỉnh',
  who5_5: 'cuộc sống ít thú vị',
}
```

### Groq Prompt Layer

Use a `src/services/groq.ts` service rather than `anthropic.ts`. Build the system prompt from `ScoreResult`, not raw answers. Include wellbeing bucket, high-item labels, cross-instrument patterns, and crisis flag, but do not reveal scores or clinical labels to the user.

Also include `getTimeContext()` hidden context to adjust tone. Do not mention the actual hour, period, or time inference to the user unless the user brings it up.

Cross-instrument heuristic: when `phq9 > 9` and `gad7 > 9`, treat the context as a mixed low-mood/high-worry pattern. Describe it in everyday language, not as a diagnosis.

```ts
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY

export type ConversationMessage = {
  role: 'user' | 'assistant'
  content: string
}

function buildSystemPrompt(scores: ScoreResult): string {
  return `
Bạn là một người bạn đồng hành cảm xúc - ấm áp, không phán xét, lắng nghe thật sự.

Ngữ cảnh nội bộ từ screening (KHÔNG tiết lộ số liệu hoặc tên thang đo cho user):
- Wellbeing chung: ${scores.who5_pct < 50 ? 'thấp' : scores.who5_pct <= 72 ? 'trung bình' : 'tốt'}
- Tín hiệu nổi bật: ${scores.highItems.map((id) => ITEM_LABELS[id]).filter(Boolean).join(', ') || 'chưa rõ'}
- Pattern phối hợp: ${scores.phq9 > 9 && scores.gad7 > 9 ? 'vừa có sắc thái xuống năng lượng, vừa có nhiều lo lắng' : 'không có pattern phối hợp rõ'}
- Có dấu hiệu khủng hoảng: ${scores.isCrisis ? 'CÓ - cần ưu tiên an toàn' : 'Không'}

Nguyên tắc:
1. KHÔNG chẩn đoán, KHÔNG dùng tên bệnh, KHÔNG nói "bạn bị lo âu"
2. KHÔNG nói con số điểm, KHÔNG nhắc tên PHQ-9/GAD-7/WHO-5 với user
3. Hỏi tối đa 1 câu mỗi lượt, không hỏi dồn
4. Nếu isCrisis = true: ưu tiên hỏi về sự an toàn, nhẹ nhàng gợi ý đường dây hỗ trợ
5. Gợi ý hành động nhỏ phù hợp văn hoá Việt (gọi điện cho người thân, ra ngoài, ăn gì đó...)
6. Toàn bộ output bằng tiếng Việt

Câu mở đầu đầu tiên: hãy phản chiếu nhẹ nhàng những gì bạn đọc được từ data,
rồi hỏi một câu mở để user tự kể thêm.
  `.trim()
}

async function sendMessage(
  messages: ConversationMessage[],
  scores: ScoreResult
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GROQ_API_KEY')
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt(scores) },
        ...messages,
      ],
      max_tokens: 512,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    throw new Error(`Groq request failed: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}
```

### Conversation Hook

Create `src/hooks/use_conversation.ts` when the app needs a reusable post-screening conversation state.

Expose:

- `messages: ConversationMessage[]`
- `isLoading: boolean`
- `error: string | null`
- `sendUserMessage(text: string): Promise<void>`
- `initConversation(): Promise<void>`

Implementation rules:

- `sendUserMessage` appends the user message, calls `sendMessage(nextMessages, scores)`, then appends the assistant response.
- `initConversation` calls `sendMessage([], scores)` so Groq writes the first reflective opening from the score context.
- Keep all user-facing error text in Vietnamese.
- Do not log scores or raw answers.

## Suggested Files

```text
src/data/screening.json
src/types/screening.ts
src/hooks/use_screening.ts
src/screens/check_in_screen.tsx
src/screens/screening_screen.tsx
src/screens/conversation_screen.tsx
src/components/chat_bubble.tsx
src/components/option_picker.tsx
src/components/crisis_banner.tsx
src/components/typing_indicator.tsx
src/services/groq.ts
```

Keep component strings out of code where practical. Put Vietnamese labels and question text in JSON or i18n resources.
