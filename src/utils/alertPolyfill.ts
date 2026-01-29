import { Alert, Platform } from "react-native";

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export const customAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => {
  if (Platform.OS === "web") {
    if (!buttons || buttons.length === 0) {
      window.alert(`${title}\n\n${message || ""}`);
    } else if (buttons.length === 1) {
      window.alert(`${title}\n\n${message || ""}`);
      buttons[0].onPress?.();
    } else {
      const cancelButton = buttons.find((b) => b.style === "cancel");
      const confirmButton = buttons.find((b) => b.style !== "cancel");

      const confirmed = window.confirm(`${title}\n\n${message || ""}`);
      if (confirmed) {
        confirmButton?.onPress?.();
      } else {
        cancelButton?.onPress?.();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};
