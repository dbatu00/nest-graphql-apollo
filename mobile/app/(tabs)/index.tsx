import { View, Text, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { commonStyles } from '../../styles/common';

export default function Page() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[commonStyles.container, commonStyles.center]}>
        <Text style={commonStyles.title}>Demo App</Text>

        <View style={commonStyles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              commonStyles.button,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => router.push('/users')}
          >
            <Text style={commonStyles.buttonText}>Users</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              commonStyles.button,
              pressed && { opacity: 0.85 },
            ]}  
            onPress={() => router.push('/posts')}
          >
            <Text style={commonStyles.buttonText}>Posts</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
