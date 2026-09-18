// src/styles/authStyles.ts — shared styling across sign-in / sign-up / verify
import { StyleSheet } from "react-native";
import { space, type } from "../themes";

export const authStyles = StyleSheet.create({
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: space.xl,
    paddingVertical: space.xl,
  },
  card: {
    gap: 4,
    borderRadius: 28,
    borderWidth: 1,
    padding: space.xl,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(167,139,250,0.18)",
  },
  title: {
    fontSize: type.display,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 10,
  },
  subtitle: { fontSize: type.bodySmall, marginTop: 5, marginBottom: space.lg },
  form: { gap: space.md },
  errorText: { fontSize: type.caption },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: space.lg,
  },
  footerText: { fontSize: type.bodySmall },
  footerLink: { fontSize: type.bodySmall, fontWeight: "700" },
});
