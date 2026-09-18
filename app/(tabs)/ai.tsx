// app/(tabs)/ai.tsx — AI tutor: text, voice, and image input.
//
// Text and image questions are answered by OpenRouter.
// Voice input is transcribed on-device by useVoiceRecorder(), then sent
// to OpenRouter as ordinary text.

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ErrorState } from "../../src/components/ErrorState";
import { ScreenBackground } from "../../src/components/ScreenBackground";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/hooks/useTheme";
import { useVoiceRecorder } from "../../src/hooks/useVoiceRecorder";
import { askAI, type Attachment, type ChatMessage } from "../../src/lib/ai";
import { pickImageAttachment } from "../../src/lib/attachments";
import { getAiHistory, saveAiMessage } from "../../src/lib/db";
import { space, type } from "../../src/themes";

const QUICK_PROMPTS: { text: string; icon: keyof typeof Ionicons.glyphMap }[] =
  [
    { text: "Explain neural networks like I'm 12", icon: "bulb-outline" },
    { text: "Quiz me on today's lesson", icon: "help-circle-outline" },
    { text: "Give me a 7-day study plan", icon: "calendar-outline" },
    { text: "What's overfitting?", icon: "layers-outline" },
  ];

interface Message extends ChatMessage {
  id: string;
  attachmentKind?: Attachment["kind"];
  createdAt?: number;
}

function labelForAttachment(a: Attachment) {
  if (a.kind === "image") return "[image]";
  return "";
}

function formatTime(ts?: number) {
  if (!ts) return null;
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Circular gradient badge used for the AI avatar and header mark. */
function GradientAvatar({
  colors,
  icon,
  size = 28,
}: {
  colors: [string, string];
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
}) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={Math.round(size * 0.55)} color="#fff" />
    </LinearGradient>
  );
}

/** Wraps a pressable in a subtle scale-down animation for a tactile feel. */
function ScalePress({
  onPress,
  disabled,
  style,
  children,
}: {
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
    }).start();
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

/** Three bouncing dots, used as the "thinking" indicator. */
function TypingDots({ color }: { color: string }) {
  const dots = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(d, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(d, {
            toValue: 0,
            duration: 320,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay((2 - i) * 140),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dots]);

  return (
    <View style={{ flexDirection: "row", gap: 4, paddingVertical: 3 }}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
            opacity: d.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                translateY: d.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -3],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

/** Pulsing recording indicator dot. */
function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scale]);

  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        transform: [{ scale }],
      }}
    />
  );
}

/** Fades and rises a message bubble in on mount. */
function FadeInMessage({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function AiScreen() {
  const { theme, isDark } = useTheme();
  const { user: authUser } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(
    null,
  );
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const listRef = useRef<FlatList>(null);
  const voice = useVoiceRecorder();

  const loadHistory = useCallback(async () => {
    if (!authUser) return;

    setLoadingHistory(true);
    setHistoryError(null);

    try {
      const history = await getAiHistory(authUser.uid);

      setMessages(
        history.map((h) => ({
          id: h.id,
          role: h.role as "user" | "model",
          content: h.content,
        })),
      );
    } catch (e) {
      console.error("AI history error:", e);

      setHistoryError(
        "Couldn't load your past conversation, but you can still chat.",
      );
    } finally {
      setLoadingHistory(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const send = async (rawText: string, attachment?: Attachment | null) => {
    const trimmed = rawText.trim();

    if ((!trimmed && !attachment) || sending || !authUser) return;

    const displayText =
      trimmed || (attachment ? labelForAttachment(attachment) : "");

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: displayText,
      attachmentKind: attachment?.kind,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPendingAttachment(null);
    setSending(true);

    try {
      await saveAiMessage(authUser.uid, "user", displayText);

      const reply = await askAI(
        messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        trimmed,
        attachment ?? undefined,
      );

      const modelMsg: Message = {
        id: `m-${Date.now()}`,
        role: "model",
        content: reply,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, modelMsg]);

      await saveAiMessage(authUser.uid, "model", reply);
    } catch (e) {
      console.error("OpenRouter AI error:", e);

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "model",
          content:
            "Sorry, I couldn't reach the AI tutor just now. Try again in a moment.",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setSending(false);

      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleMicPress = async () => {
    if (voice.isRecording) {
      const transcript = await voice.stop();

      if (transcript) {
        await send(transcript);
      }

      return;
    }

    if (voice.permissionDenied) {
      Alert.alert(
        "Microphone access needed",
        "Enable it in Settings to use voice input.",
      );
      return;
    }

    await voice.start();
  };

  const handleAttachPress = () => {
    Alert.alert("Add attachment", undefined, [
      {
        text: "Photo",
        onPress: async () => {
          const attachment = await pickImageAttachment();

          if (attachment) {
            setPendingAttachment(attachment);
          }
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const recordingSeconds = Math.floor(voice.durationMillis / 1000);
  const gradient: [string, string] = [theme.primary, theme.primaryLight];

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <View
          style={[
            s.header,
            {
              borderBottomColor: theme.border + "60",
              backgroundColor: isDark ? "rgba(12, 10, 18, 0.7)" : "transparent",
            },
          ]}
        >
          <View style={s.headerRow}>
            <GradientAvatar colors={gradient} icon="sparkles" size={36} />

            <View>
              <Text style={[s.kicker, { color: theme.textTertiary }]}>
                AI Tutor
              </Text>

              <Text style={[s.title, { color: theme.text }]}>NeuralTutor</Text>
            </View>
          </View>
        </View>

        {historyError && !loadingHistory && (
          <View
            style={{
              paddingHorizontal: space.md,
              paddingBottom: 6,
            }}
          >
            <ErrorState message={historyError} onRetry={loadHistory} compact />
          </View>
        )}

        {loadingHistory ? (
          <View style={s.center}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIconWrap}>
              <View
                style={[s.emptyGlow, { backgroundColor: theme.primary + "22" }]}
              />
              <GradientAvatar colors={gradient} icon="sparkles" size={64} />
            </View>

            <Text style={[s.emptyTitle, { color: theme.text }]}>
              Ask, talk, or share something
            </Text>

            <Text style={[s.emptySubtitle, { color: theme.textTertiary }]}>
              Type a question, use your voice, or share an image.
            </Text>

            <View style={s.promptGrid}>
              {QUICK_PROMPTS.map((p) => (
                <TouchableOpacity
                  key={p.text}
                  style={[
                    s.promptChip,
                    {
                      backgroundColor: theme.surfaceStrong + "CC",
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => send(p.text)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={p.icon} size={15} color={theme.primary} />

                  <Text style={[s.promptText, { color: theme.textSecondary }]}>
                    {p.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={s.list}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({
                animated: true,
              })
            }
            renderItem={({ item }) => {
              const isUser = item.role === "user";

              return (
                <FadeInMessage>
                  <View
                    style={[
                      s.msgRow,
                      isUser
                        ? { justifyContent: "flex-end" }
                        : { justifyContent: "flex-start" },
                    ]}
                  >
                    {!isUser && (
                      <GradientAvatar
                        colors={gradient}
                        icon="sparkles"
                        size={24}
                      />
                    )}

                    <View style={{ maxWidth: "78%" }}>
                      {isUser ? (
                        <LinearGradient
                          colors={gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[s.bubble, s.bubbleUser, s.shadowColored]}
                        >
                          {item.attachmentKind === "image" && (
                            <Ionicons
                              name="image"
                              size={13}
                              color="#fff"
                              style={{ marginBottom: 3, opacity: 0.85 }}
                            />
                          )}
                          <Text style={[s.bubbleText, { color: "#fff" }]}>
                            {item.content}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View
                          style={[
                            s.bubble,
                            s.bubbleModel,
                            s.shadowSoft,
                            {
                              backgroundColor: isDark
                                ? "rgba(24, 18, 32, 0.9)"
                                : theme.surfaceStrong + "E6",
                              borderColor: theme.border,
                              borderTopColor: theme.text + "12",
                            },
                          ]}
                        >
                          {item.attachmentKind === "image" && (
                            <Ionicons
                              name="image"
                              size={13}
                              color={theme.textTertiary}
                              style={{ marginBottom: 3 }}
                            />
                          )}
                          <Text style={[s.bubbleText, { color: theme.text }]}>
                            {item.content}
                          </Text>
                        </View>
                      )}

                      {item.createdAt && (
                        <Text
                          style={[
                            s.timestamp,
                            { color: theme.textTertiary },
                            isUser
                              ? { textAlign: "right" }
                              : { textAlign: "left" },
                          ]}
                        >
                          {formatTime(item.createdAt)}
                        </Text>
                      )}
                    </View>
                  </View>
                </FadeInMessage>
              );
            }}
          />
        )}

        {sending && (
          <View style={s.typingRow}>
            <GradientAvatar colors={gradient} icon="sparkles" size={24} />

            <View
              style={[
                s.bubble,
                s.bubbleModel,
                s.shadowSoft,
                {
                  backgroundColor: isDark
                    ? "rgba(24, 18, 32, 0.9)"
                    : theme.surfaceStrong + "E6",
                  borderColor: theme.border,
                  paddingVertical: 10,
                },
              ]}
            >
              <TypingDots color={theme.textTertiary} />
            </View>
          </View>
        )}

        {pendingAttachment && (
          <View
            style={[
              s.attachmentChip,
              {
                backgroundColor: isDark
                  ? "rgba(24, 18, 32, 0.9)"
                  : theme.surfaceStrong + "E6",
                borderColor: theme.border,
              },
            ]}
          >
            <Image
              source={{
                uri: `data:${pendingAttachment.mimeType};base64,${pendingAttachment.base64}`,
              }}
              style={s.attachmentThumb}
            />

            <Text style={[s.attachmentText, { color: theme.textSecondary }]}>
              Photo attached
            </Text>

            <TouchableOpacity
              onPress={() => setPendingAttachment(null)}
              style={s.attachmentRemove}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.textTertiary}
              />
            </TouchableOpacity>
          </View>
        )}

        {voice.isRecording ? (
          <View
            style={[
              s.inputBar,
              s.shadowSoft,
              {
                backgroundColor: isDark
                  ? "rgba(20, 15, 27, 0.96)"
                  : theme.surfaceStrong + "F2",
                borderColor: theme.danger + "80",
              },
            ]}
          >
            <View style={s.recordingRow}>
              <PulsingDot color={theme.danger} />

              <Text style={[s.recordingText, { color: theme.text }]}>
                Recording...{" "}
                {String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:
                {String(recordingSeconds % 60).padStart(2, "0")}
              </Text>
            </View>

            <ScalePress onPress={handleMicPress}>
              <View style={[s.sendButton, { backgroundColor: theme.danger }]}>
                <Ionicons name="stop" size={16} color="#fff" />
              </View>
            </ScalePress>
          </View>
        ) : (
          <View
            style={[
              s.inputBar,
              s.shadowSoft,
              {
                backgroundColor: isDark
                  ? "rgba(20, 15, 27, 0.96)"
                  : theme.surfaceStrong + "F2",
                borderColor: theme.border,
              },
            ]}
          >
            <TouchableOpacity
              style={[s.iconBtn, { backgroundColor: theme.text + "0A" }]}
              onPress={handleAttachPress}
            >
              <Ionicons name="add" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TextInput
              style={[s.input, { color: theme.text }]}
              placeholder="Ask your AI tutor..."
              placeholderTextColor={theme.textTertiary}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send(input, pendingAttachment)}
              returnKeyType="send"
              multiline
            />

            <ScalePress
              disabled={sending}
              onPress={() =>
                input.trim() || pendingAttachment
                  ? send(input, pendingAttachment)
                  : handleMicPress()
              }
            >
              <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.sendButton}
              >
                <Ionicons
                  name={input.trim() || pendingAttachment ? "arrow-up" : "mic"}
                  size={17}
                  color="#fff"
                />
              </LinearGradient>
            </ScalePress>
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },

  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  kicker: {
    fontSize: type.bodySmall,
  },

  title: {
    fontSize: type.display,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },

  emptyIconWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.md,
  },

  emptyGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  emptyTitle: {
    fontSize: type.h1,
    fontWeight: "700",
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: type.bodySmall,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },

  promptGrid: {
    marginTop: space.lg,
    gap: space.sm,
    width: "100%",
  },

  promptChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: space.md,
  },

  promptText: {
    fontSize: type.bodySmall,
    fontWeight: "500",
    flexShrink: 1,
  },

  list: {
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    gap: 12,
  },

  msgRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },

  bubble: {
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 15,
    maxWidth: "100%",
  },

  bubbleUser: {
    borderBottomRightRadius: 8,
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },

  bubbleModel: {
    borderWidth: 1,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomRightRadius: 18,
  },

  bubbleText: {
    fontSize: type.body,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  timestamp: {
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 4,
  },

  shadowSoft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  shadowColored: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: space.md,
    paddingBottom: 8,
  },

  attachmentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: space.md,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  attachmentThumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },

  attachmentText: {
    fontSize: type.caption,
    fontWeight: "500",
    flex: 1,
  },

  attachmentRemove: {
    padding: 2,
  },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderRadius: 26,
    borderWidth: 1,
    marginHorizontal: space.md,
    marginBottom: 82,
    padding: 7,
    paddingLeft: 10,
  },

  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    fontSize: type.body,
    maxHeight: 90,
    paddingVertical: 7,
  },

  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  recordingRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingLeft: 8,
  },

  recordingText: {
    fontSize: type.body,
    fontWeight: "600",
  },
});
