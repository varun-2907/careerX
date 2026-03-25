async function callApi(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'AI is unavailable right now. Please try again later.')
  }
  return response.json()
}

export async function invokeLLM(type, payload) {
  await new Promise((resolve) => setTimeout(resolve, 900))

  try {
    if (type === 'career-recommendation') {
      return await callApi('/api/recommendation', payload)
    }

    if (type === 'summary') {
      return await callApi('/api/summary', payload)
    }

    if (type === 'chat') {
      const response = await callApi('/api/chat', { messages: payload.messages })
      return { reply: response.reply, model: response.model }
    }

    if (type === 'skill-assessment') {
      return await callApi('/api/skill-assessment', payload)
    }

    if (type === 'job-search') {
      return await callApi('/api/job-search', payload)
    }

    throw new Error('Unsupported invokeLLM type')
  } catch (error) {
    throw new Error(error.message || 'AI is unavailable right now. Please try again later.')
  }
}