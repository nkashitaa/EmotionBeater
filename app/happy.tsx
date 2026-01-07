import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function HappyGame() {
    const router = useRouter();
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [emojis, setEmojis] = useState([]);

    useEffect(() => {
        const setup = async () => {
            const saved = await AsyncStorage.getItem('high_score');
            if (saved) setHighScore(parseInt(saved));
        };
        setup();
        const interval = setInterval(spawnEmoji, 1000);
        return () => clearInterval(interval);
    }, []);

    const spawnEmoji = () => {
        const id = Date.now();
        const newEmoji = { id, x: Math.random() * (width - 80) + 10, pos: new Animated.Value(height) };
        setEmojis((prev) => [...prev, newEmoji]);
        Animated.timing(newEmoji.pos, { toValue: -150, duration: 3000, useNativeDriver: true }).start();
    };

    const handleTap = async (id) => {
        const newScore = score + 1;
        setScore(newScore);
        setEmojis((prev) => prev.filter((e) => e.id !== id));

        if (newScore > highScore) {
            setHighScore(newScore);
            await AsyncStorage.setItem('high_score', newScore.toString());
        }

        // Badge Logic - FIXED (Moved inside function)
        if (newScore === 50) {
            const savedBadges = await AsyncStorage.getItem('user_badges');
            let badgeList = savedBadges ? JSON.parse(savedBadges) : [];
            if (!badgeList.includes("Joy Maker")) {
                badgeList.push("Joy Maker");
                await AsyncStorage.setItem('user_badges', JSON.stringify(badgeList));
                Alert.alert("ACHIEVEMENT UNLOCKED! 🎈", "You earned the Joy Maker badge!");
            }
        }

        const currentXp = await AsyncStorage.getItem('user_xp') || "0";
        await AsyncStorage.setItem('user_xp', (parseInt(currentXp) + 2).toString());
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Catch the Joy!</Text>
            <Text style={styles.high}>🏆 Best: {highScore}</Text>
            <View style={styles.scoreCircle}><Text style={styles.scoreText}>{score}</Text></View>
            <View style={styles.area}>
                {emojis.map((e) => (
                    <Animated.View key={e.id} style={[styles.emoji, { left: e.x, transform: [{ translateY: e.pos }] }]}>
                        <TouchableOpacity onPress={() => handleTap(e.id)}><Text style={{ fontSize: 60 }}>😄</Text></TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
            <TouchableOpacity style={styles.btn} onPress={() => router.back()}><Text style={styles.btnT}>Exit</Text></TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', paddingTop: 60, alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#8bc34a' },
    high: { color: '#ffd700', fontSize: 16, marginVertical: 10 },
    scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#8bc34a', justifyContent: 'center', alignItems: 'center' },
    scoreText: { color: 'white', fontSize: 30, fontWeight: 'bold' },
    area: { flex: 1, width: '100%' },
    emoji: { position: 'absolute' },
    btn: { marginBottom: 40, padding: 15, backgroundColor: '#222', borderRadius: 12 },
    btnT: { color: 'white', fontWeight: 'bold' }
});