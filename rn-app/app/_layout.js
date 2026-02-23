import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';

export default function RootLayout() {
    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" translucent />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#0f172a' },
                    animation: 'fade'
                }}
            />
        </>
    );
}
