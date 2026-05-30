import { useCallback, useState } from 'react';

import { sendMessage, type ConversationMessage } from '../services/groq';
import type { ScoreResult } from './use_scoring';

export function useConversation(scores: ScoreResult) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendUserMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();

      if (!trimmedText || isLoading) {
        return;
      }

      const nextMessages: ConversationMessage[] = [
        ...messages,
        { content: trimmedText, role: 'user' },
      ];

      setMessages(nextMessages);
      setError(null);
      setIsLoading(true);

      try {
        const response = await sendMessage(nextMessages, scores);
        setMessages([...nextMessages, { content: response, role: 'assistant' }]);
      } catch (sendError) {
        setError(sendError instanceof Error ? sendError.message : 'Không gửi được tin nhắn.');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, scores],
  );

  const initConversation = useCallback(async () => {
    if (messages.length > 0 || isLoading) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await sendMessage([], scores);
      setMessages([{ content: response, role: 'assistant' }]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Không khởi tạo được trò chuyện.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages.length, scores]);

  return { error, initConversation, isLoading, messages, sendUserMessage };
}
