# Mental Health Content System

## Tone of Voice

Use compassionate, non-clinical wording. Help users recognize emotional signals without making them feel labeled, broken, or diagnosed.

Preferred patterns:

- "I notice..." instead of "I have..."
- "This may be a signal..." instead of "This means..."
- "A small next step" instead of "a solution"
- "Racing Thoughts" instead of "Anxiety Attack"
- "Unsettled" instead of "Panic"
- "Brain Fog" instead of "Cognitive dysfunction"

## Emotion Check App Concept

| Layer | English Label | Vietnamese Label | Use |
| --- | --- | --- | --- |
| Physical Signs | Muscle Tension | Cang co | Body feels tight or braced |
| Physical Signs | Restlessness | Bon chon | Body wants to move or cannot settle |
| Physical Signs | Fatigue | Met moi | Energy feels low or heavy |
| Mind State | Racing Thoughts | Suy nghi don dap | Thoughts move quickly or feel hard to slow |
| Mind State | Brain Fog | Mo ho / Suong mu nao | Mind feels cloudy or unclear |
| Mind State | Overthinking | Suy dien | Mind loops through possibilities |
| Emotional Tone | Overwhelmed | Ngop | Too much feels present at once |
| Emotional Tone | Unsettled | Bat an | Something feels off or unsafe |
| Emotional Tone | Disconnected | Mat ket noi | Feeling distant from self, others, or surroundings |

## Emotion Signal Layers

| Block | Vietnamese | Prompt |
| --- | --- | --- |
| Internal Triggers | Ben trong | What has been active inside me lately? |
| External Factors | Ben ngoai | What around me may be adding pressure? |
| Current Needs | Nhu cau thuc | What might I need right now? |
| Energy Reserves | Nang luong du tru | How much capacity do I have today? |
| My Reflection | Tram chiem nghiem an toan | What feels most true in this moment? |
| Take a Mindful Step | Buoc di tinh thuc | What is one small step I can take gently? |
| Soothe & Release | Xoa diu va buong bo | What can I soften, release, or set down for now? |

## Microcopy Examples

### Check-in Openers

- "Take a moment to notice what's here."
- "There is no right answer. Choose what feels closest."
- "Your body and mind may be sending signals. Let's name them gently."

### Reflection Prompts

- "What feels loudest right now?"
- "What might this feeling be asking for?"
- "What would feel 5% lighter?"
- "What can wait until later?"

### Action Copy

- "Take a Mindful Step"
- "Soothe & Release"
- "Pause for One Breath"
- "Name What Is Here"
- "Choose a Gentle Next Step"

### Vietnamese Copy

- "Hay cham lai mot chut de nhan ra dieu dang co mat."
- "Khong co cau tra loi dung hay sai. Hay chon dieu gan voi ban nhat."
- "Co the co the va tam tri dang gui tin hieu. Minh cung goi ten chung nhe."
- "Dieu gi dang ro nhat luc nay?"
- "Cam xuc nay co the dang can dieu gi?"
- "Dieu gi co the nhe hon 5%?"
- "Dieu gi co the de lai sau?"

## i18n JSON Shape

Use stable keys organized by feature and content type:

```json
{
  "emotionCheck": {
    "title": "Take a moment to notice what's here.",
    "layers": {
      "physicalSigns": {
        "title": "Physical Signs",
        "options": {
          "muscleTension": "Muscle Tension",
          "restlessness": "Restlessness",
          "fatigue": "Fatigue"
        }
      },
      "mindState": {
        "title": "Mind State",
        "options": {
          "racingThoughts": "Racing Thoughts",
          "brainFog": "Brain Fog",
          "overthinking": "Overthinking"
        }
      },
      "emotionalTone": {
        "title": "Emotional Tone",
        "options": {
          "overwhelmed": "Overwhelmed",
          "unsettled": "Unsettled",
          "disconnected": "Disconnected"
        }
      }
    }
  },
  "reflection": {
    "inputs": {
      "internalTriggers": "Internal Triggers",
      "externalFactors": "External Factors",
      "currentNeeds": "Current Needs",
      "energyReserves": "Energy Reserves"
    },
    "center": "My Reflection",
    "actions": {
      "takeMindfulStep": "Take a Mindful Step",
      "sootheRelease": "Soothe & Release"
    }
  }
}
```

For Vietnamese, keep the same keys and localize values only.

## Safety Notes

Do not present the app as diagnosing, treating, or replacing professional care. If copy mentions crisis, self-harm, or immediate danger, include clear guidance to contact local emergency services or a trusted person right away.
