import { router } from "expo-router";

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
                />

                <HeaderLanguageMenu style={styles.languageMiddleMargin} />

                <FeedLogoutButton onPress={handleLogout} />
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
                />

                {isOwnProfile && (
                    <UserSettingsButton
                        onPress={handleGoSettings}
                        minWidth={70}
                        borderColor="rgba(255, 255, 255, 0.92)"
                        style={styles.logoutMargin}
                    />
                )}

                <HeaderLanguageMenu style={styles.languageMiddleMargin} />

                <FeedLogoutButton
                    onPress={handleLogout}
                    minWidth={70}
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
            />

            <UserSettingsButton
                onPress={handleGoProfile}
                minWidth={70}
                borderColor="rgba(255, 255, 255, 0.92)"
                label={t("common.profile")}
                iconName="person-circle-outline"
                style={styles.logoutMargin}
            />

            <HeaderLanguageMenu style={styles.languageMiddleMargin} />

            <FeedLogoutButton
                onPress={handleLogout}
                minWidth={70}
            />
        </>
    );
}