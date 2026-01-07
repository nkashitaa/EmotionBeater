import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StressScreen() {
    const router = useRouter();
    const [text, setText] = useState("Ready?");
    const scale = useRef(new Animated.Value(1)).current;

    const runAnimation = () => {
        setText("Inhale...");
        Animated.sequence([
            Animated.timing(scale, { toValue: 2, duration: 4000, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 4000, useNativeDriver: true })
        ]).start(() => {
            setText("Exhale...");
            runAnimation();
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.instruction}>{text}</Text>
            <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
            <TouchableOpacity style={styles.btn} onPress={runAnimation}>
                <Text style={styles.btnText}>Start Breathing</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()}><Text style={{ color: 'white', marginTop: 30 }}>Exit</Text></TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
    instruction: { fontSize: 28, color: 'white', marginBottom: 40, fontWeight: 'bold' },
    circle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ff4757', opacity: 0.8 },
    btn: { marginTop: 60, backgroundColor: '#007AFF', padding: 20, borderRadius: 15 },
    btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});