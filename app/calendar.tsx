import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CalendarScreen() {
    const router = useRouter();
    const [data, setData] = useState({});
    const today = new Date();
    const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    useEffect(() => {
        const load = async () => {
            const saved = await AsyncStorage.getItem('mood_calendar');
            if (saved) setData(JSON.parse(saved));
        };
        load();
    }, []);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Mood History</Text>
            <View style={styles.grid}>
                {[...Array(days)].map((_, i) => {
                    const key = `${today.getFullYear()}-${today.getMonth() + 1}-${i + 1}`;
                    const mood = data[key] || "none";
                    return (
                        <View key={i} style={[styles.day, styles[mood]]}>
                            <Text style={{ color: 'white', fontSize: 10 }}>{i + 1}</Text>
                        </View>
                    );
                })}
            </View>
            <TouchableOpacity style={styles.back} onPress={() => router.back()}><Text style={styles.backT}>Back to App</Text></TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60 },
    title: { fontSize: 24, color: 'white', fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    day: { width: 45, height: 45, margin: 5, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' },
    happy: { backgroundColor: '#8bc34a' },
    sad: { backgroundColor: '#64b5f6' },
    stressed: { backgroundColor: '#ffeb3b' },
    back: { marginTop: 40, alignSelf: 'center', padding: 20 },
    backT: { color: '#00d2ff', fontWeight: 'bold' }
});