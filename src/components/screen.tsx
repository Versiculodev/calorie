import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { palette } from "@/theme/palette";

interface ScreenProps {
  children: ReactNode;
  footer?: ReactNode;
}

export function Screen({ children, footer }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.paper}>
      <View style={styles.frame}>
        <View style={styles.body}>{children}</View>
        {footer ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    flex: 1,
    backgroundColor: palette.paper,
  },
  frame: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: palette.paper,
  },
  body: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
});
