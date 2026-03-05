const HF_API_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction/thenlper/gte-small'

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
  })

  if (!response.ok) {
    throw new Error(`Hugging Face embedding error: ${response.statusText}`)
  }

  const data = await response.json()

  // The API returns a nested array [[...numbers...]]; flatten it
  return Array.isArray(data[0]) ? (data[0] as number[]) : (data as number[])
}

export function buildEmbeddingText(profile: {
  full_name?: string
  skills?: string[]
  sdg_interests?: string[]
  bio?: string
  role?: string
}): string {
  const parts: string[] = []
  if (profile.full_name) parts.push(profile.full_name)
  if (profile.bio) parts.push(profile.bio)
  if (profile.skills?.length) parts.push(`Skills: ${profile.skills.join(', ')}`)
  if (profile.sdg_interests?.length) parts.push(`SDG interests: ${profile.sdg_interests.join(', ')}`)
  return parts.join('. ')
}

export function buildStartupEmbeddingText(startup: {
  name: string
  description?: string
  domain?: string
  sdg_tags?: string[]
}): string {
  const parts: string[] = [startup.name]
  if (startup.description) parts.push(startup.description)
  if (startup.domain) parts.push(`Domain: ${startup.domain}`)
  if (startup.sdg_tags?.length) parts.push(`SDGs: ${startup.sdg_tags.join(', ')}`)
  return parts.join('. ')
}
