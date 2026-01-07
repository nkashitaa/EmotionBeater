import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from "react-native-chart-kit";

export default function AnalyticsScreen() {
    const router = useRouter();
    const [chartData, setChartData] = useState([0, 0, 0, 0, 0, 0, 0]);
    const [moodStats, setMoodStats] = useState({ happy: 0, sad: 0, stressed: 0, angry: 0, bored: 0 });
    const [dailyGoal, setDailyGoal] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            const savedMoods = await AsyncStorage.getItem('mood_calendar');
            const savedChatCount = await AsyncStorage.getItem('daily_chat_count') || "0";
            setDailyGoal(parseInt(savedChatCount));

            if (savedMoods) {
                const parsed = JSON.parse(savedMoods);
                const moodMap = { "happy": 4, "excited": 4, "none": 3, "stressed": 2, "sad": 1, "angry": 0, "bored": 1 };
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
                }).reverse();

                const dataPoints = last7Days.map(date => moodMap[parsed[date]] ?? 1);
                setChartData(dataPoints);

                const stats = { happy: 0, sad: 0, stressed: 0, angry: 0, bored: 0 };
                Object.values(parsed).forEach((m: any) => { if (stats[m] !== undefined) stats[m]++; });
                setMoodStats(stats);
            }
        };
        fetchData();
    }, []);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Private Analytics</Text>

            <LineChart
                data={{
                    labels: ["6d", "5d", "4d", "3d", "2d", "1d", "Now"],
                    datasets: [{ data: chartData }]
                }}
                width={Dimensions.get("window").width - 40}
                height={200}
                chartConfig={{
                    backgroundColor: "#000",
                    backgroundGradientFrom: "#1a1a1a",
                    backgroundGradientTo: "#000",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 210, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                bezier
                style={styles.chart}
            />

            <View style={styles.goalSection}>
                <Text style={styles.subTitle}>Daily Mission</Text>
                <View style={styles.goalCard}>
                    <Text style={styles.goalText}>Messages Today: {dailyGoal} / 5</Text>
                    <View style={styles.goalBarBack}><View style={[styles.goalFill, { width: `${Math.min((dailyGoal / 5) * 100, 100)}%` }]} /></View>
                    <Text style={styles.rewardText}>{dailyGoal >= 5 ? "✅ Mission Complete! +50 XP Earned" : "Reach 5 to get a bonus!"}</Text>
                </View>
            </View>

            <View style={styles.mapSection}>
                <Text style={styles.subTitle}>Mood Frequency</Text>
                <View style={styles.statRow}>
                    <View style={[styles.statBox, { borderColor: '#8bc34a' }]}>
                        <Text style={styles.statEmoji}>😊</Text>
                        <Text style={styles.statNum}>{moodStats.happy}</Text>
                    </View>
                    <View style={[styles.statBox, { borderColor: '#64b5f6' }]}>
                        <Text style={styles.statEmoji}>😢</Text>
                        <Text style={styles.statNum}>{moodStats.sad}</Text>
                    </View>
                    <View style={[styles.statBox, { borderColor: '#ffeb3b' }]}>
                        <Text style={styles.statEmoji}>🤯</Text>
                        <Text style={styles.statNum}>{moodStats.stressed}</Text>
                    </View>
                </View>
            </View>

            {/* DEVELOPER CREDITS SECTION */}
            <View style={styles.creditsSection}>
                <Text style={styles.creditTitle}>Emotion Beater v1.0</Text>
                <Text style={styles.creditText}>Designed & Developed by</Text>
                <Text style={styles.devName}>KASHITAA</Text>
                <Text style={styles.copyright}>© 2026 All Rights Reserved</Text>
            </View>

            <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                <Text style={styles.backT}>Back to App</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 },
    title: { fontSize: 26, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 20 },
    chart: { borderRadius: 16, marginVertical: 10 },
    goalSection: { marginTop: 20 },
    goalCard: { backgroundColor: '#1a1a1a', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#00d2ff' },
    goalText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    goalBarBack: { height: 10, backgroundColor: '#333', borderRadius: 5, overflow: 'hidden' },
    goalFill: { height: '100%', backgroundColor: '#00d2ff' },
    rewardText: { color: '#888', fontSize: 12, marginTop: 10 },
    mapSection: { marginTop: 30 },
    subTitle: { fontSize: 20, fontWeight: 'bold', color: '#00d2ff', marginBottom: 15 },
    statRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { width: '30%', backgroundColor: '#111', padding: 15, borderRadius: 15, borderWidth: 1, alignItems: 'center' },
    statEmoji: { fontSize: 24, marginBottom: 5 },
    statNum: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    creditsSection: { marginTop: 50, padding: 20, borderTopWidth: 1, borderTopColor: '#222', alignItems: 'center' },
    creditTitle: { color: '#00d2ff', fontWeight: 'bold', fontSize: 16 },
    creditText: { color: '#888', fontSize: 12, marginTop: 5 },
    devName: { color: 'white', fontWeight: 'bold', fontSize: 18, marginTop: 2 },
    copyright: { color: '#444', fontSize: 10, marginTop: 10 },
    back: { marginVertical: 40, alignSelf: 'center' },
    backT: { color: '#555', fontSize: 14 }
});