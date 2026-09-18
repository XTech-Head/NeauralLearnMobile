import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ScreenBackground } from "../src/components/ScreenBackground";
import { useTheme } from "../src/hooks/useTheme";
import { radius, space, type } from "../src/themes";

const YOUTUBE_SEARCH_URL = "https://www.youtube.com/results?search_query=";

export default function VideoSearchScreen() {
  const { query } = useLocalSearchParams<{ query?: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const searchTerm = useMemo(() => {
    const value = (query ?? "learning").trim();
    return value || "learning";
  }, [query]);

  const suggestions = useMemo(
    () => [
      `How to learn ${searchTerm}`,
      `${searchTerm} for beginners`,
      `${searchTerm} explained simply`,
      `${searchTerm} practice exercises`,
    ],
    [searchTerm],
  );

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.topRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[s.title, { color: theme.text }]}>Video tutorials</Text>
        </View>

        <View
          style={[
            s.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[s.label, { color: theme.textTertiary }]}>
            Searching for
          </Text>
          <Text style={[s.queryText, { color: theme.text }]}>{searchTerm}</Text>
        </View>

        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: theme.primary }]}
          onPress={() =>
            Linking.openURL(
              `${YOUTUBE_SEARCH_URL}${encodeURIComponent(searchTerm)}`,
            )
          }
        >
          <Text style={[s.primaryText, { color: theme.bg }]}>
            Open YouTube search
          </Text>
        </TouchableOpacity>

        <Text style={[s.sectionTitle, { color: theme.textTertiary }]}>
          Popular searches
        </Text>
        <View style={s.list}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                s.item,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              onPress={() =>
                Linking.openURL(
                  `${YOUTUBE_SEARCH_URL}${encodeURIComponent(item)}`,
                )
              }
            >
              <Ionicons
                name="play-circle-outline"
                size={18}
                color={theme.primary}
              />
              <Text style={[s.itemText, { color: theme.text }]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: space.md, paddingBottom: 40, gap: 12 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  title: { fontSize: type.h1, fontWeight: "800" },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: 14 },
  label: { fontSize: type.caption, fontWeight: "600" },
  queryText: { fontSize: type.body, fontWeight: "700", marginTop: 6 },
  primaryBtn: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { fontSize: type.body, fontWeight: "700" },
  sectionTitle: { fontSize: type.caption, fontWeight: "600", marginTop: 6 },
  list: { gap: 9 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 13,
  },
  itemText: { fontSize: type.bodySmall, flex: 1 },
});
