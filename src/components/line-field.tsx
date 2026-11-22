import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { palette } from "@/theme/palette";

interface LineFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboard?: TextInputProps["keyboardType"];
  selectOnFocus?: boolean;
}

export function LineField({
  label,
  value,
  onChangeText,
  keyboard = "default",
  selectOnFocus = false,
}: LineFieldProps) {
  const numeric = keyboard !== "default";
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={numeric ? "none" : "sentences"}
        autoCorrect={!numeric}
        keyboardType={keyboard}
        onChangeText={onChangeText}
        placeholderTextColor={palette.quiet}
        selectTextOnFocus={selectOnFocus}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: 18,
  },
  label: {
    color: palette.quiet,
    fontFamily: "Figtree_500Medium",
    fontSize: 14,
  },
  input: {
    color: palette.ink,
    fontFamily: "Figtree_400Regular",
    fontSize: 18,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
});
