import Groq from 'groq-sdk'

let groqClient: Groq | null = null

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqClient
}

export interface DailyMission {
  title: string
  description: string
  xp_reward: number
}

export async function generateDailyMissions(context: {
  studentName: string
  startupStage: string
  startupName?: string
  skills: string[]
  innovationScore: number
}): Promise<DailyMission[]> {
  const groq = getGroqClient()

  const prompt = `You are a startup coach for a university innovation platform.
Generate exactly 3 short daily missions for a student.

Student: ${context.studentName}
Startup Stage: ${context.startupStage}
Startup Name: ${context.startupName ?? 'Not yet named'}
Skills: ${context.skills?.join(', ') || 'N/A'}
Innovation Score: ${context.innovationScore}

Rules:
- Each mission must be achievable in under 30 minutes.
- Missions must be relevant to their current startup stage.
- Keep descriptions to 1 clear sentence.
- Vary XP rewards between 25 and 100 based on difficulty.
- Return ONLY valid JSON in this exact format, no extra text:
[
  {"title": "...", "description": "...", "xp_reward": N},
  {"title": "...", "description": "...", "xp_reward": N},
  {"title": "...", "description": "...", "xp_reward": N}
]`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 400,
    temperature: 0.9,
  })

  const raw = completion.choices[0]?.message?.content?.trim() ?? '[]'

  try {
    // Extract JSON from response (in case there's surrounding text)
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? '[]') as DailyMission[]
    return parsed.slice(0, 3)
  } catch {
    return [
      {
        title: 'Update your startup description',
        description: 'Refine your one-line startup pitch to clearly state the problem you solve.',
        xp_reward: 50,
      },
      {
        title: 'Research one competitor',
        description: 'Find and summarise one direct competitor for your startup idea.',
        xp_reward: 50,
      },
      {
        title: 'Connect with a classmate',
        description: 'Share your startup idea with one classmate and collect their feedback.',
        xp_reward: 25,
      },
    ]
  }
}
