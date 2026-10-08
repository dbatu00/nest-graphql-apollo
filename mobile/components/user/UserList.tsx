import { ActivityIndicator, Text, View } from "react-native";
import { UserRow } from "@/components/user/UserRow";
import { useFollow } from "@/hooks/useFollow";
import { useI18n } from "@/hooks/useI18n";
import { activityListStyles as styles } from "@/styles";

type Props = {
    follow: ReturnType<typeof useFollow>;
    currentUserId?: number;
    onProfileNavigate?: () => void;
    isCompact?: boolean;
};

export function UserList({
    follow,
    currentUserId,
    onProfileNavigate,
    isCompact = false,
}: Props) {
    const { t } = useI18n();

    return (
        <View>
            {follow.loading && (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            )}

            {follow.error && <Text>{follow.error}</Text>}

            {!follow.loading && !follow.error && follow.users.length === 0 && (
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>{t("feed.empty")}</Text>
                </View>
            )}

            {!follow.loading &&
                follow.users.map(user => (
                    <UserRow
                        key={user.id}
                        user={user}
                        currentUserId={currentUserId}
                        onToggleFollow={follow.toggleFollow}
                        isCompact={isCompact}
                        onProfileNavigate={onProfileNavigate}
                    />
                ))}
        </View>
    );
}
