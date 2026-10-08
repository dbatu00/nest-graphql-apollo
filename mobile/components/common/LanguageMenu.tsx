import { useState } from "react";
import { Image, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Language } from "@/hooks/i18n.translations";
import { useI18n } from "@/hooks/useI18n";
import { headerStyles as styles } from "@/styles";

const LANGUAGE_OPTIONS: Language[] = ["en", "tr", "de"];
const LANGUAGE_LABELS: Record<Language, string> = {
    en: "English",
    tr: "Türkçe",
    de: "Deutsch",
};
const LANGUAGE_FLAGS: Record<Language, string> = {
    en: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f1fa-1f1f8.png",
    tr: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f1f9-1f1f7.png",
    de: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f1e9-1f1ea.png",
};

type Props = {
    style?: StyleProp<ViewStyle>;
};

export function HeaderLanguageMenu({ style }: Props) {
    const [open, setOpen] = useState(false);
    const { language, setLanguage } = useI18n();

    const handlePick = async (option: Language) => {
        await setLanguage(option);
        setOpen(false);
    };

    return (
        <View style={[styles.languageMenuRoot, style]}>
            <TouchableOpacity
                onPress={() => setOpen((prev) => !prev)}
                style={styles.languageIconPressable}
            >
                <Ionicons name="globe-outline" size={18} color="#fff" />
            </TouchableOpacity>

            {open && (
                <View style={styles.languageDropdown}>
                    {LANGUAGE_OPTIONS.map((option) => {
                        const active = option === language;

                        return (
                            <TouchableOpacity
                                key={option}
                                onPress={() => void handlePick(option)}
                                style={[styles.languageDropdownItem, active && styles.languageDropdownItemActive]}
                            >
                                <View style={styles.languageDropdownItemRow}>
                                    <Text style={[styles.languageDropdownItemText, active && styles.languageDropdownItemTextActive]}>
                                        {LANGUAGE_LABELS[option]}
                                    </Text>
                                    <Image
                                        source={{ uri: LANGUAGE_FLAGS[option] }}
                                        style={styles.languageDropdownFlag}
                                        resizeMode="contain"
                                    />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );
}