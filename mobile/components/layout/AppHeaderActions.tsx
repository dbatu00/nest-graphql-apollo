import { router } from "expo-router";

import { FeedLogoutButton } from "@/components/common/LogoutButton";
import { UserSettingsButton } from "@/components/common/SettingsButton";
import { useAuth } from "@/hooks/useAuth";
import { headerStyles as styles } from "@/styles";

type HeaderMode = "feed" | "profile" | "settings";

type Props = {
    mode: HeaderMode;
    username?: string;
    isOwnProfile?: boolean;
};

export function AppHeaderActions({ mode, username, isOwnProfile = false }: Props) {
    const { user, logout } = useAuth();

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
                    label="Profile"
                    iconName="person-circle-outline"
                />

                <FeedLogoutButton onPress={handleLogout} style={styles.logoutMargin} />
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
                    label="Home"
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

                <FeedLogoutButton
                    onPress={handleLogout}
                    style={styles.logoutMargin}
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
                label="Home"
                iconName="home-outline"
            />

            <UserSettingsButton
                onPress={handleGoProfile}
                minWidth={70}
                borderColor="rgba(255, 255, 255, 0.92)"
                label="Profile"
                iconName="person-circle-outline"
                style={styles.logoutMargin}
            />

            <FeedLogoutButton
                onPress={handleLogout}
                style={styles.logoutMargin}
                minWidth={70}
            />
        </>
    );
}