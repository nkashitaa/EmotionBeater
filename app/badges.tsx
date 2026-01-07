import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ALL_BADGES = [
    { name: "First Steps", icon: "🌱", desc: "Started your journey" },
    { name: "Stress Buster", icon: "🧘", desc: "Used breathing 5 times" },
    { name: "Joy Maker", icon: "🎈", desc: "Score 50 in Joy Game" },
    { name: "Night Owl", icon: "🦉", desc: "Used the app after midnight" },
    { name: "Consistent", icon: "🔥", desc: "3-day mood streak" }
];

export default function BadgesScreen() {
    const router = useRouter();
    const [earnedBadges, setEarnedBadges] = useState([]);

    useEffect(() => {
        const load = async () => {
            const saved = await AsyncStorage.getItem('user_badges');
            if (saved) setEarnedBadges(JSON.parse(saved));
        };
        load();
    }, []);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>🏆 Trophy Room</Text>
            <View style={styles.grid}>
                {ALL_BADGES.map((badge, i) => {
                    const isEarned = earnedBadges.includes(badge.name);
                    return (
                        <View key={i} style={[styles.card, !isEarned && styles.lockedCard]}>
                            <Text style={[styles.icon, !isEarned && styles.lockedText]}>{badge.icon}</Text>
                            <Text style={styles.name}>{badge.name}</Text>
                            <Text style={styles.desc}>{badge.desc}</Text>
                        </View>
                    );
                })}
            </View>
            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                <Text style={styles.backT}>Back to App</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 },
    title: { fontSize: 32, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 30 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    card: { backgroundColor: '#1a1a1a', width: '47%', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#ffd700' },
    lockedCard: { opacity: 0.3, borderColor: '#333' },
    icon: { fontSize: 40, marginBottom: 10 },
    lockedText: { grayscale: 1 },
    name: { color: 'white', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
    desc: { color: '#888', fontSize: 10, textAlign: 'center', marginTop: 5 },
    back: { marginTop: 20, alignSelf: 'center', paddingBottom: 50 },
    backT: { color: '#00d2ff', fontSize: 16, fontWeight: 'bold' }
});