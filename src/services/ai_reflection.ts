export type AIReflectionRequest = {
  journalText: string;
  locale: 'vi-VN';
  signals: {
    body?: string;
    feeling?: string;
    mind?: string;
    need?: string;
  };
};

export type AIReflectionResponse = {
  followUpQuestion: string;
  reflection: string;
  riskLevel: 'low' | 'medium' | 'high' | 'crisis';
  safetyMessage?: string;
  supportActions: Array<{
    body: string;
    nextQuestion: string;
    title: string;
  }>;
};

const endpoint = process.env.EXPO_PUBLIC_AI_REFLECTION_ENDPOINT;

export async function requestAIReflection(
  input: AIReflectionRequest,
): Promise<AIReflectionResponse> {
  if (!endpoint) {
    throw new Error('Chưa cấu hình EXPO_PUBLIC_AI_REFLECTION_ENDPOINT.');
  }

  const response = await fetch(endpoint, {
    body: JSON.stringify(input),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    throw new Error(`AI endpoint trả về lỗi ${response.status}${detail ? `: ${detail}` : ''}.`);
  }

  const data = await response.json();

  if (!isAIReflectionResponse(data)) {
    throw new Error('AI endpoint trả về dữ liệu không đúng định dạng.');
  }

  return data;
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (data && typeof data === 'object') {
      const error = 'error' in data && typeof data.error === 'string' ? data.error : '';
      const detail = 'detail' in data && typeof data.detail === 'string' ? data.detail : '';

      return [error, detail].filter(Boolean).join(' - ');
    }
  } catch {
    return '';
  }

  return '';
}

function isAIReflectionResponse(value: unknown): value is AIReflectionResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as AIReflectionResponse;

  return (
    typeof candidate.reflection === 'string' &&
    typeof candidate.followUpQuestion === 'string' &&
    ['low', 'medium', 'high', 'crisis'].includes(candidate.riskLevel) &&
    Array.isArray(candidate.supportActions) &&
    candidate.supportActions.every(
      (action) =>
        action &&
        typeof action.title === 'string' &&
        typeof action.body === 'string' &&
        typeof action.nextQuestion === 'string',
    )
  );
}
