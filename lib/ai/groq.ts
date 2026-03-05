import Groq from 'groq-sdk'

let groqClient: Groq | null = null

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqClient
}

export async function generateMatchReasoning(
  mentor: { full_name: string; skills: string[]; sdg_interests: string[]; bio: string },
  student: { full_name: string; skills: string[]; sdg_interests: string[]; bio: string },
  similarityScore: number
): Promise<string> {
  const groq = getGroqClient()

  const prompt = `You are a matchmaking assistant for a university innovation platform.
A mentor and student have been algorithmically matched with a ${Math.round(similarityScore * 100)}% compatibility score.

Mentor: ${mentor.full_name}
Skills: ${mentor.skills?.join(', ') || 'N/A'}
SDG Interests: ${mentor.sdg_interests?.join(', ') || 'N/A'}
Bio: ${mentor.bio || 'N/A'}

Student: ${student.full_name}
Skills: ${student.skills?.join(', ') || 'N/A'}
SDG Interests: ${student.sdg_interests?.join(', ') || 'N/A'}
Bio: ${student.bio || 'N/A'}

Write exactly 2 sentences explaining why this is a good match. Be specific, mentioning shared skills or overlapping SDG goals. Do not add any preamble.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.7,
  })

  return completion.choices[0]?.message?.content?.trim() ?? 'Strong compatibility based on shared interests and skills.'
}

export async function generateStartupGrowthInsight(
  startup: {
    name: string
    description: string
    stage: string
    domain: string
    sdg_tags: string[]
  },
  activitySummary: string
): Promise<string> {
  const groq = getGroqClient()

  const prompt = `You are an investment analyst on a campus innovation platform.
Analyze this startup and write a 3-sentence growth insight for an investor.

Startup: ${startup.name}
Description: ${startup.description}
Stage: ${startup.stage}
Domain: ${startup.domain}
SDG Tags: ${startup.sdg_tags?.join(', ') || 'N/A'}
Activity: ${activitySummary}

Write exactly 3 concise sentences covering: (1) the team's momentum, (2) the market opportunity, and (3) a forward-looking observation. No preamble.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: 0.7,
  })

  return completion.choices[0]?.message?.content?.trim() ?? 'Promising early-stage startup with strong fundamentals.'
}

export async function generateWeeklyEcosystemReport(ecosystemData: {
  totalStudents: number
  totalStartups: number
  topDomains: string[]
  stageCounts: Record<string, number>
  totalFunding: number
}): Promise<string> {
  const groq = getGroqClient()

  const prompt = `You are a strategic advisor for a university innovation ecosystem.
Based on this week's data, generate a strategic report for the administration.

Total Students: ${ecosystemData.totalStudents}
Total Startups: ${ecosystemData.totalStartups}
Top Domains: ${ecosystemData.topDomains.join(', ')}
Stage Distribution: ${JSON.stringify(ecosystemData.stageCounts)}
Total Funding Raised: $${ecosystemData.totalFunding.toLocaleString()}

Write a 3-paragraph strategic report covering:
1. Key highlights and wins this week
2. Gaps or bottlenecks identified
3. Concrete recommendations (e.g., workshops, mentor recruitment, funding drives)
Be specific and actionable. No bullet points, flowing paragraphs only.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 600,
    temperature: 0.8,
  })

  return completion.choices[0]?.message?.content?.trim() ?? 'Data insufficient for report generation.'
}
