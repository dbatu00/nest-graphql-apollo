import { router } from "expo-router";
import { Platform, useWindowDimensions } from "react-native";

import { FeedLogoutButton } from "@/components/common/LogoutButton";
import { HeaderLanguageMenu } from "@/components/common/LanguageMenu";
import { UserSettingsButton } from "@/components/common/SettingsButton";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { headerStyles as styles } from "@/styles";

type HeaderMode = "feed" | "profile" | "settings";

type Props = {
    mode: HeaderMode;
    username?: string;
    isOwnProfile?: boolean;
};

export function AppHeaderActions({ mode, username, isOwnProfile = false }: Props) {
    const { user, logout } = useAuth();
    const { t } = useI18n();
    const { width } = useWindowDimensions();
    const isMobileBrowser = Platform.OS === "web" && width < 768;

    const handleLogout = async () => {
        await logout();
    };

    const handleGoFeed = () => {
        router.push("/feed");
    };

    const handleGoProfile = () => {
        const targetUsername = username ?? user?.username;
        if (!targetUsername) return;

        router.push({
            pathname: "/profile/[username]",
            params: { username: targetUsername },
        });
    };

    const handleGoSettings = () => {
        if (!username) return;

        router.push({
            pathname: "/profile/[username]/settings",
            params: { username },
        });
    };

    if (mode === "feed") {
        return (
            <>
                <UserSettingsButton
                    onPress={handleGoProfile}
                    minWidth={80}
                    label={t("common.profile")}
                    iconName="person-circle-outline"
                    hideText={isMobileBrowser}
                />

                <HeaderLanguageMenu />

                <FeedLogoutButton onPress={handleLogout} hideText={isMobileBrowser} />
            </>
        );
    }

    if (mode === "profile") {
        return (
            <>
                <UserSettingsButton
                    onPress={handleGoFeed}
                    minWidth={70}
                    borderColor="rgba(255, 255, 255, 0.92)"
                    label={t("common.home")}
                    iconName="home-outline"
                    hideText={isMobileBrowser}
                />

                {isOwnProfile && (
                    <UserSettingsButton
                        onPress={handleGoSettings}
                        minWidth={70}
                        borderColor="rgba(255, 255, 255, 0.92)"
                        hideText={isMobileBrowser}
                    />
                )}

                <HeaderLanguageMenu />

                <FeedLogoutButton
                    onPress={handleLogout}
                    minWidth={70}
                    hideText={isMobileBrowser}
                />
            </>
        );
    }

    return (
        <>
            <UserSettingsButton
                onPress={handleGoFeed}
                minWidth={70}
                borderColor="rgba(255, 255, 255, 0.92)"
                label={t("common.home")}
                iconName="home-outline"
                hideText={isMobileBrowser}
            />

            <UserSettingsButton
                onPress={handleGoProfile}
                minWidth={70}
                borderColor="rgba(255, 255, 255, 0.92)"
                label={t("common.profile")}
                iconName="person-circle-outline"
                hideText={isMobileBrowser}
            />

            <HeaderLanguageMenu />

            <FeedLogoutButton
                onPress={handleLogout}
                minWidth={70}
                hideText={isMobileBrowser}
            />
        </>
    );
}