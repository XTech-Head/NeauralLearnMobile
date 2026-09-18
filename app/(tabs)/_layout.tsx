// app/(tabs)/_layout.tsx — bottom tab bar, theme-aware
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../src/hooks/useTheme";

function TabIcon({
  glyph,
  focused,
  color,
  inactive,
  isDark,
}: {
  glyph: string;
  focused: boolean;
  color: string;
  inactive: string;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        tab.wrap,
        {
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: focused
            ? isDark
              ? color + "26"
              : color + "18"
            : "transparent",
        },
      ]}
    >
      <Ionicons
        name={glyph as any}
        size={20}
        color={focused ? color : inactive}
      />
    </View>
  );
}

const tab = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function TabsLayout() {
  const { theme, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 12,
          height: 66,
          borderRadius: 24,
          borderTopWidth: 0,
          borderWidth: 1,
          backgroundColor: isDark
            ? "rgba(10, 8, 15, 0.92)"
            : "rgba(255, 255, 255, 0.94)",
          borderColor: isDark ? "rgba(196, 181, 253, 0.16)" : theme.border,
          shadowColor: isDark ? "#000000" : "#000000",
          shadowOpacity: isDark ? 0.34 : 0.08,
          shadowRadius: isDark ? 22 : 16,
          shadowOffset: { width: 0, height: isDark ? 12 : 8 },
          elevation: isDark ? 12 : 6,
          paddingBottom: 6,
          paddingTop: 6,
          paddingHorizontal: 10,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          height: 52,
          borderRadius: 16,
          marginHorizontal: 1,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              glyph="home"
              focused={focused}
              color={theme.primary}
              inactive={theme.textTertiary}
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              glyph="flash"
              focused={focused}
              color={theme.primary}
              inactive={theme.textTertiary}
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              glyph="compass"
              focused={focused}
              color={theme.primary}
              inactive={theme.textTertiary}
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              glyph="sparkles"
              focused={focused}
              color={theme.primary}
              inactive={theme.textTertiary}
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              glyph="stats-chart"
              focused={focused}
              color={theme.primary}
              inactive={theme.textTertiary}
              isDark={isDark}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              glyph="person"
              focused={focused}
              color={theme.primary}
              inactive={theme.textTertiary}
              isDark={isDark}
            />
          ),
        }}
      />
    </Tabs>
  );
}
