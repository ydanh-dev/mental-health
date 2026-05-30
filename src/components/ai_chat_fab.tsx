import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  DeviceEventEmitter,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { aiChatContent, buildInitialAIChatMessages } from '../data/ai_chat_content';
import type { ScoreResult } from '../hooks/use_scoring';
import { AIChatMessage, requestAIChat } from '../services/ai_chat';
import { colors, spacing } from '../styles/theme';

const { conversationsStorageKey, storageKey } = aiChatContent;
const minimumAssistantDelayMs = 2000;

type AIChatConversation = {
  createdAt: number;
  id: string;
  messages: AIChatMessage[];
  title: string;
  updatedAt: number;
};

type AIChatFabProps = {
  scores?: ScoreResult | null;
};

export function AIChatFab({ scores }: AIChatFabProps) {
  const fabScale = useRef(new Animated.Value(1)).current;
  const panelProgress = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AIChatConversation[]>([]);
  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );
  const initialMessages = useMemo(() => buildInitialAIChatMessages(scores), [scores]);
  const messages = activeConversation?.messages ?? initialMessages;
  const canSend = draft.trim().length > 0 && !isSending;
  const hasSavedConversation = conversations.some((conversation) =>
    conversation.messages.some((message) => message.role === 'user'),
  );

  useEffect(() => {
    let active = true;

    Promise.all([
      AsyncStorage.getItem(conversationsStorageKey),
      AsyncStorage.getItem(storageKey),
    ])
      .then(([conversationValue, legacyValue]) => {
        if (!active) {
          return;
        }

        const storedConversations = conversationValue ? JSON.parse(conversationValue) : null;

        if (isConversationList(storedConversations) && storedConversations.length > 0) {
          const sortedConversations = sortConversations(storedConversations);
          setConversations(sortedConversations);
          setActiveConversationId(sortedConversations[0].id);
          return;
        }

        const legacyMessages = legacyValue ? JSON.parse(legacyValue) : null;
        const initialConversation = createConversation(
          isMessageList(legacyMessages) && legacyMessages.length > 0
            ? legacyMessages
            : initialMessages,
        );

        setConversations([initialConversation]);
        setActiveConversationId(initialConversation.id);
      })
      .catch(() => {
        setError(aiChatContent.errors.load);
      })
      .finally(() => {
        if (active) {
          setIsLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('open_ai_chat', () => {
      setIsOpen(true);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    AsyncStorage.setItem(conversationsStorageKey, JSON.stringify(conversations)).catch(() => {
      setError(aiChatContent.errors.save);
    });
  }, [conversations, isLoaded]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeoutId);
  }, [isOpen, isSending, messages.length, activeConversationId]);

  useEffect(() => {
    Animated.timing(panelProgress, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
      toValue: isOpen ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [isOpen, panelProgress]);

  useEffect(() => {
    if (!isOpen) {
      setIsHistoryOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!scores || !activeConversationId) {
      return;
    }

    setConversations((current) =>
      current.map((conversation) => {
        if (
          conversation.id !== activeConversationId ||
          conversation.messages.some((message) => message.role === 'user') ||
          conversation.messages[0]?.id !== 'welcome'
        ) {
          return conversation;
        }

        return {
          ...conversation,
          messages: buildInitialAIChatMessages(scores),
          updatedAt: Date.now(),
        };
      }),
    );
  }, [activeConversationId, scores]);

  const latestUserText = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'user')?.content,
    [messages],
  );

  const sendMessage = async () => {
    const content = draft.trim();

    if (!content || isSending) {
      return;
    }

    const userMessage: AIChatMessage = {
      content,
      id: createMessageId('user'),
      role: 'user',
    };
    const conversationId = activeConversationId ?? createMessageId('chat');
    const nextMessages = [...messages, userMessage];

    setDraft('');
    setError(null);
    setIsSending(true);
    updateConversationMessages(conversationId, nextMessages);

    try {
      const [response] = await Promise.all([
        requestAIChat(nextMessages, scores),
        wait(minimumAssistantDelayMs),
      ]);
      const responseText =
        response.riskLevel === 'crisis' && response.safetyMessage
          ? `${response.message}\n\n${response.safetyMessage}`
          : response.message;

      updateConversationMessages(conversationId, [
        ...nextMessages,
        {
          content: responseText,
          id: createMessageId('assistant'),
          role: 'assistant',
        },
      ]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : aiChatContent.errors.send);
      updateConversationMessages(
        conversationId,
        nextMessages.filter((message) => message.id !== userMessage.id),
      );
      setDraft(content);
    } finally {
      setIsSending(false);
    }
  };

  const startNewChat = () => {
    const nextConversation = createConversation(initialMessages);

    setDraft('');
    setError(null);
    setActiveConversationId(nextConversation.id);
    setConversations((current) => [nextConversation, ...current]);
  };

  const selectConversation = (conversationId: string) => {
    if (isSending) {
      return;
    }

    setDraft('');
    setError(null);
    setActiveConversationId(conversationId);
  };

  const updateConversationMessages = (
    conversationId: string,
    nextMessages: AIChatMessage[],
  ) => {
    setConversations((current) => {
      const existingConversation = current.find(
        (conversation) => conversation.id === conversationId,
      );
      const nextConversation = {
        ...(existingConversation ?? createConversation(initialMessages, conversationId)),
        messages: nextMessages,
        title: getConversationTitle(nextMessages),
        updatedAt: Date.now(),
      };
      const otherConversations = current.filter(
        (conversation) => conversation.id !== conversationId,
      );

      return sortConversations([nextConversation, ...otherConversations]);
    });
    setActiveConversationId(conversationId);
  };

  const handleFabPressIn = () => {
    Animated.timing(fabScale, {
      duration: 90,
      easing: Easing.out(Easing.quad),
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handleFabPressOut = () => {
    Animated.timing(fabScale, {
      duration: 120,
      easing: Easing.out(Easing.quad),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const panelAnimatedStyle = {
    opacity: panelProgress,
    transform: [
      {
        translateY: panelProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
      {
        scale: panelProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.995, 1],
        }),
      },
    ],
  };

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      {isOpen && (
        <Animated.View style={[styles.backdrop, { opacity: panelProgress }]}>
          <Pressable style={styles.backdropPressable} onPress={() => setIsOpen(false)} />
        </Animated.View>
      )}
      {isOpen && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
          style={styles.panelWrap}
        >
          <Animated.View style={[styles.panel, panelAnimatedStyle]}>
            <View style={styles.panelHeader}>
              <View style={styles.headerIdentity}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>AI</Text>
                </View>
                <View style={styles.headerCopy}>
                  {/* <Text numberOfLines={1} style={styles.panelEyebrow}>
                    {aiChatContent.header.eyebrow}
                  </Text> */}
                  <Text numberOfLines={1} style={styles.panelTitle}>
                    {aiChatContent.header.title}
                  </Text>
                  {/* <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, hasSavedConversation && styles.statusDotActive]} />
                    <Text numberOfLines={2} style={styles.panelStatus}>
                      {hasSavedConversation
                        ? aiChatContent.header.savedStatus
                        : aiChatContent.header.emptyStatus}
                    </Text>
                  </View> */}
                </View>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Lịch sử trò chuyện"
                  onPress={() => setIsHistoryOpen((prev) => !prev)}
                  style={styles.closeButton}
                >
                  <View style={styles.folderGlyph}>
                    <View style={[styles.folderTab, isHistoryOpen && styles.folderTabActive]} />
                    <View style={[styles.folderBody, isHistoryOpen && styles.folderBodyActive]} />
                  </View>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setIsOpen(false)} style={styles.closeButton}>
                  <View style={styles.panelCloseGlyph}>
                    <View style={[styles.panelCloseGlyphLine, styles.closeGlyphLineForward]} />
                    <View style={[styles.panelCloseGlyphLine, styles.closeGlyphLineBack]} />
                  </View>
                </Pressable>
              </View>
            </View>

            {isHistoryOpen ? (
              <View style={styles.historyContainer}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyLabel}>Lịch sử trò chuyện</Text>
                  <Text style={styles.historySublabel}>
                    {conversations.length} cuộc hội thoại được lưu
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  disabled={isSending}
                  onPress={() => {
                    startNewChat();
                    setIsHistoryOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.newChatCard,
                    pressed && !isSending && styles.pressed,
                    isSending && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.newChatCardText}>+ Bắt đầu đoạn chat mới</Text>
                </Pressable>

                <ScrollView
                  contentContainerStyle={styles.historyList}
                  showsVerticalScrollIndicator={false}
                >
                  {sortConversations(conversations).map((conversation) => {
                    const selected = conversation.id === activeConversationId;
                    const lastMessage = conversation.messages[conversation.messages.length - 1];
                    const dateStr = new Date(conversation.updatedAt).toLocaleDateString('vi-VN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <Pressable
                        key={conversation.id}
                        onPress={() => {
                          selectConversation(conversation.id);
                          setIsHistoryOpen(false);
                        }}
                        style={[
                          styles.historyItem,
                          selected && styles.historyItemSelected,
                        ]}
                      >
                        <View style={styles.historyItemHeader}>
                          <View style={styles.historyIconBox}>
                            <Text style={styles.historyIconText}>💬</Text>
                          </View>
                          <Text style={styles.historyItemDate}>{dateStr}</Text>
                        </View>
                        <Text numberOfLines={1} style={[
                          styles.historyItemTitle,
                          selected && styles.historyItemTitleSelected,
                        ]}>
                          {conversation.title || 'Cuộc trò chuyện mới'}
                        </Text>
                        <Text numberOfLines={2} style={styles.historyItemSnippet}>
                          {lastMessage?.content || 'Chưa có tin nhắn...'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIsHistoryOpen(false)}
                  style={styles.backToChatButton}
                >
                  <Text style={styles.backToChatButtonText}>Quay lại cuộc trò chuyện</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <ScrollView
                  contentContainerStyle={styles.messageList}
                  onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                  ref={scrollViewRef}
                  showsVerticalScrollIndicator={false}
                >
                  {messages.map((message) => (
                    <View
                      key={message.id}
                      style={[
                        styles.messageBubble,
                        message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          message.role === 'user' && styles.userMessageText,
                        ]}
                      >
                        {message.content}
                      </Text>
                    </View>
                  ))}
                  {isSending && (
                    <View style={[styles.messageBubble, styles.assistantBubble]}>
                      <View style={styles.typingRow}>
                        <View style={styles.typingDot} />
                        <View style={styles.typingDot} />
                        <View style={styles.typingDot} />
                      </View>
                    </View>
                  )}
                </ScrollView>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <View style={styles.composer}>
                  <TextInput
                    multiline
                    onChangeText={setDraft}
                    placeholder={
                      latestUserText
                        ? aiChatContent.composer.continuePlaceholder
                        : aiChatContent.composer.startPlaceholder
                    }
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    textAlignVertical="top"
                    value={draft}
                  />
                  <Pressable
                    accessibilityRole="button"
                    disabled={!canSend}
                    onPress={sendMessage}
                    style={({ pressed }) => [
                      styles.sendButton,
                      canSend && styles.sendButtonReady,
                      pressed && styles.pressed,
                      !canSend && styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.sendButtonText}>↑</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      )}

      <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: isOpen }}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          onPress={() => setIsOpen((current) => !current)}
          style={[styles.fab, isOpen && styles.fabOpen]}
        >
          <View style={[styles.fabIcon, isOpen && styles.fabIconOpen]}>
            {isOpen ? (
              <View style={styles.closeGlyph}>
                <View style={[styles.closeGlyphLine, styles.closeGlyphLineForward, styles.closeGlyphLineOpen]} />
                <View style={[styles.closeGlyphLine, styles.closeGlyphLineBack, styles.closeGlyphLineOpen]} />
              </View>
            ) : (
              <View style={styles.chatGlyph}>
                <View style={styles.chatGlyphLine} />
                <View style={[styles.chatGlyphLine, styles.chatGlyphLineShort]} />
                <View style={styles.chatGlyphTail} />
              </View>
            )}
          </View>
          {!isOpen && hasSavedConversation && <View style={styles.fabBadge} />}
          {!isOpen && <Text style={styles.fabLabel}>AI</Text>}
        </Pressable>
      </Animated.View>
    </View>
  );
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function wait(durationMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function createConversation(
  messages: AIChatMessage[] = buildInitialAIChatMessages(),
  id = createMessageId('chat'),
): AIChatConversation {
  const now = Date.now();

  return {
    createdAt: now,
    id,
    messages,
    title: getConversationTitle(messages),
    updatedAt: now,
  };
}

function getConversationTitle(messages: AIChatMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === 'user')?.content.trim();

  if (!firstUserMessage) {
    return aiChatContent.header.untitledChat;
  }

  return firstUserMessage.length > 28
    ? `${firstUserMessage.slice(0, 28).trim()}...`
    : firstUserMessage;
}

function isMessageList(value: unknown): value is AIChatMessage[] {
  return (
    Array.isArray(value) &&
    value.every(
      (message) =>
        message &&
        typeof message.id === 'string' &&
        typeof message.content === 'string' &&
        (message.role === 'assistant' || message.role === 'user'),
    )
  );
}

function isConversationList(value: unknown): value is AIChatConversation[] {
  return (
    Array.isArray(value) &&
    value.every(
      (conversation) =>
        conversation &&
        typeof conversation.id === 'string' &&
        typeof conversation.title === 'string' &&
        typeof conversation.createdAt === 'number' &&
        typeof conversation.updatedAt === 'number' &&
        isMessageList(conversation.messages),
    )
  );
}

function sortConversations(conversations: AIChatConversation[]) {
  return [...conversations].sort((first, second) => second.updatedAt - first.updatedAt);
} const styles = StyleSheet.create({
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
    borderRadius: 8,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 2.5, width: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginVertical: 6,
    maxWidth: '85%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginLeft: 4,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
    borderRadius: 6,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 17,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    borderWidth: 1.5,
    height: 36,
    justifyContent: 'center',
    padding: 0,
    width: 36,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 1, width: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: '100%',
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 2, width: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 0,
  },
  disabledButton: {
    opacity: 0.55,
  },
  errorText: {
    color: colors.clay,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  historyContainer: {
    flex: 1,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  historyHeader: {
    marginBottom: spacing.xxs,
  },
  historyLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  historySublabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  newChatCard: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    borderRadius: 8,
    borderWidth: 1.5,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 1.5, width: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    marginBottom: spacing.xs,
  },
  newChatCardText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  historyList: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  historyItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
    borderRadius: 8,
    padding: spacing.md,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 2, width: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 0,
  },
  historyItemSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderStrong,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 3, width: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  historyIconBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIconText: {
    fontSize: 12,
  },
  historyItemDate: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  historyItemTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  historyItemTitleSelected: {
    color: colors.accent,
  },
  historyItemSnippet: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  backToChatButton: {
    backgroundColor: colors.primary,
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 2, width: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  backToChatButtonText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '900',
  },
  folderGlyph: {
    width: 18,
    height: 14,
    position: 'relative',
  },
  folderTab: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    height: 3,
    left: 2,
    position: 'absolute',
    top: 0,
    width: 6,
  },
  folderBody: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: 3,
    bottom: 0,
    height: 11,
    left: 0,
    position: 'absolute',
    width: 18,
  },
  folderTabActive: {
    backgroundColor: colors.accent,
  },
  folderBodyActive: {
    borderColor: colors.accent,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.borderStrong,
    borderRadius: 24,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 56,
    justifyContent: 'center',
    minWidth: 56,
    overflow: 'visible',
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 2, width: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  fabOpen: {
    paddingLeft: 0,
    paddingRight: 0,
    width: 56,
    borderRadius: 28,
    backgroundColor: colors.clay,
    borderColor: colors.borderStrong,
  },
  fabBadge: {
    backgroundColor: colors.teal,
    borderColor: colors.onPrimary,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    position: 'absolute',
    right: -1,
    top: -1,
    width: 12,
  },
  closeGlyph: {
    alignItems: 'center',
    height: 18,
    justifyContent: 'center',
    position: 'relative',
    width: 18,
  },
  closeGlyphLine: {
    backgroundColor: colors.primary,
    borderRadius: 2,
    height: 3,
    left: 1,
    position: 'absolute',
    top: 7.5,
    width: 16,
  },
  closeGlyphLineOpen: {
    backgroundColor: colors.onPrimary,
  },
  closeGlyphLineBack: {
    transform: [{ rotate: '-45deg' }],
  },
  closeGlyphLineForward: {
    transform: [{ rotate: '45deg' }],
  },
  chatGlyph: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    height: 20,
    justifyContent: 'center',
    paddingHorizontal: 4,
    width: 24,
  },
  chatGlyphLine: {
    backgroundColor: colors.onPrimary,
    borderRadius: 1,
    height: 2,
    marginVertical: 1.5,
    width: 12,
  },
  chatGlyphLineShort: {
    width: 8,
  },
  chatGlyphTail: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 4,
    borderTopColor: colors.borderStrong,
    borderTopWidth: 5,
    bottom: -5,
    height: 0,
    left: 4,
    position: 'absolute',
    width: 0,
  },
  fabIcon: {
    alignItems: 'center',
    backgroundColor: colors.onPrimary,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
  },
  fabIconOpen: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
  },
  fabIconText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    includeFontPadding: false,
    lineHeight: 15,
  },
  fabLabel: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: 15,
    paddingRight: 1,
  },
  fabWrap: {
    bottom: spacing.xl,
    elevation: 32,
    position: 'absolute',
    right: spacing.xl,
    zIndex: 32,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  headerCopy: {
    flex: 1,
    flexShrink: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  headerIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
    flex: 1,
  },
  input: {
    color: colors.textPrimary,
    flex: 1,
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 21,
    maxHeight: 92,
    minHeight: 44,
    minWidth: 0,
    padding: 0,
  },
  layer: {
    bottom: 0,
    elevation: 30,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 30,
  },
  backdrop: {
    backgroundColor: 'rgba(28, 25, 23, 0.52)',
    bottom: 0,
    elevation: 30,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 30,
  },
  backdropPressable: {
    flex: 1,
  },
  messageBubble: {
    borderRadius: 8,
    borderWidth: 1.5,
    maxWidth: '85%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageList: {
    gap: spacing.sm,
    paddingHorizontal: 4,
    paddingVertical: spacing.md,
  },
  messageText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 2,
    gap: spacing.md,
    maxHeight: 560,
    minHeight: 420,
    overflow: 'hidden',
    padding: spacing.md,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 4, width: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  panelEyebrow: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    paddingBottom: spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  statusDotActive: {
    backgroundColor: colors.teal,
  },
  panelStatus: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  panelTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.2,
    lineHeight: 24,
    minWidth: 0,
  },
  panelWrap: {
    bottom: 92,
    elevation: 31,
    left: spacing.md,
    position: 'absolute',
    right: spacing.md,
    zIndex: 31,
  },
  panelCloseGlyph: {
    alignItems: 'center',
    height: 14,
    justifyContent: 'center',
    position: 'relative',
    width: 14,
  },
  panelCloseGlyphLine: {
    backgroundColor: colors.textPrimary,
    borderRadius: 2,
    height: 2,
    left: 0,
    position: 'absolute',
    top: 6,
    width: 14,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1.5,
    height: 38,
    minHeight: 38,
    justifyContent: 'center',
    width: 38,
  },
  sendButtonReady: {
    backgroundColor: colors.accent,
    borderColor: colors.borderStrong,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 1.5, width: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  sendButtonText: {
    color: colors.onPrimary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 20,
  },
  smallButton: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    borderWidth: 1.5,
    flex: 1,
    maxWidth: 130,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 1.5, width: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  typingDot: {
    backgroundColor: colors.textMuted,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  typingRow: {
    flexDirection: 'row',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  smallButtonText: {
    color: colors.textPrimary,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 14,
    textAlign: 'center',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
    borderRadius: 8,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 2.5, width: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginVertical: 6,
    maxWidth: '85%',
    marginRight: 4,
  },
  userMessageText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
