import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInDays, startOfDay } from 'date-fns';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import ConfettiCannon from 'react-native-confetti-cannon';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const QUOTES = [
  "Believe you can and you're halfway there.",
  "Your potential is endless.",
  "Small steps lead to big changes.",
  "You are stronger than you think.",
  "Make today amazing!",
  "Difficult roads lead to beautiful destinations."
];

export default function Index() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("");
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const scrollViewRef = useRef();

  const GROQ_API_KEY = "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";
  const MODEL_NAME = "llama-3.3-70b-versatile";

  useEffect(() => {
    loadData();
    setupNotifications();
    setCurrentQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const loadData = async () => {
    const savedChat = await AsyncStorage.getItem('chat_history');
    const savedXp = await AsyncStorage.getItem('user_xp');
    const savedLvl = await AsyncStorage.getItem('user_level');
    const savedBadges = await AsyncStorage.getItem('user_badges');
    const savedStreak = await AsyncStorage.getItem('user_streak');

    if (savedChat) setMessages(JSON.parse(savedChat));
    else setMessages([{ id: 1, text: "Hey! I'm your Emotion Beater. How are you feeling?", sender: "ai" }]);

    if (savedXp) setXp(parseInt(savedXp));
    if (savedLvl) setLevel(parseInt(savedLvl));
    if (savedBadges) setBadges(JSON.parse(savedBadges));

    checkStreak(savedStreak);
  };

  const checkStreak = async (savedStreak) => {
    const lastLoginStr = await AsyncStorage.getItem('last_login_date');
    const today = startOfDay(new Date());
    let currentStreak = parseInt(savedStreak) || 0;

    if (lastLoginStr) {
      const lastLogin = startOfDay(new Date(lastLoginStr));
      const diff = differenceInDays(today, lastLogin);

      if (diff === 1) {
        currentStreak += 1;
        Alert.alert("Daily Streak! 🔥", `You've come back for ${currentStreak} days! +50 XP Reward!`);
        gainXP(50);
      } else if (diff > 1) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    setStreak(currentStreak);
    await AsyncStorage.setItem('user_streak', currentStreak.toString());
    await AsyncStorage.setItem('last_login_date', today.toISOString());
  };

  const setupNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Emotion Beater 🧘",
          body: `Don't lose your ${streak} day streak! Time for a daily check-in?`,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 10,
          minute: 0
        },
      });
    }
  };

  const clearChat = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Clear History?", "Delete all messages?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear", style: "destructive", onPress: async () => {
          await AsyncStorage.removeItem('chat_history');
          setMessages([{ id: Date.now(), text: "Chat history cleared.", sender: "ai" }]);
        }
      }
    ]);
  };

  const gainXP = async (amount) => {
    let newXp = xp + amount;
    let newLevel = level;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (newXp >= 100) {
      newXp -= 100;
      newLevel += 1;
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("LEVEL UP! 🎉", `Your Avatar evolved to Level ${newLevel}!`);
    }

    setXp(newXp);
    setLevel(newLevel);
    await AsyncStorage.setItem('user_xp', newXp.toString());
    await AsyncStorage.setItem('user_level', newLevel.toString());
  };

  const getAvatar = () => {
    if (level < 3) return { icon: "🌱", name: "Sprout" };
    if (level < 7) return { icon: "🌿", name: "Grower" };
    if (level < 12) return { icon: "🌳", name: "Guardian" };
    return { icon: "🧘", name: "Zen Master" };
  };

  const awardBadge = async (badgeName) => {
    if (badges.includes(badgeName)) return;
    const newBadges = [...badges, badgeName];
    setBadges(newBadges);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem('user_badges', JSON.stringify(newBadges));
    Alert.alert("🏆 BADGE UNLOCKED", `You earned: ${badgeName}`);
  };

  const sendMessage = async () => {
    if (!userInput.trim() || loading) return;
    const userMsg = { id: Date.now(), text: userInput, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setUserInput("");
    setLoading(true);

    let emotionTag = "none";
    const text = userInput.toLowerCase();
    if (text.match(/happy|good|great|joy/)) {
      emotionTag = "happy";
      awardBadge("First Steps");
    } else if (text.match(/sad|low|bad|cry/)) {
      emotionTag = "sad";
    } else if (text.match(/stress|anxious|tired/)) {
      emotionTag = "stressed";
      awardBadge("Stress Buster");
    } else if (text.match(/angry|mad/)) {
      emotionTag = "angry";
    } else if (text.match(/bored|nothing to do/)) {
      emotionTag = "bored";
    } else if (text.match(/excited|amazing|wow/)) {
      emotionTag = "excited";
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [{ role: "system", content: "Brief, supportive friend. Max 2 sentences." }, { role: "user", content: userInput }],
        }),
      });
      const data = await response.json();
      const aiMsg = { id: Date.now() + 1, text: data.choices[0].message.content, sender: "ai", emotion: emotionTag };
      setMessages((prev) => [...prev, aiMsg]);
      await gainXP(10);
      await AsyncStorage.setItem('chat_history', JSON.stringify([...messages, userMsg, aiMsg]));
    } catch (e) { Alert.alert("Connection Error", "Check Wi-Fi."); } finally { setLoading(false); }
  };

  const renderButtons = (emotion) => {
    const btnStyle = styles.bigBtn;
    if (emotion === "happy") return (
      <View style={styles.btnColumn}>
        <TouchableOpacity style={[btnStyle, { borderColor: '#ff9800' }]} onPress={() => Linking.openURL('https://poki.com/en/g/basketball-stars')}><Text style={styles.btnText}>🏀 Hoops</Text></TouchableOpacity>
        <TouchableOpacity style={[btnStyle, { borderColor: '#8bc34a' }]} onPress={() => Linking.openURL('https://poki.com/en/g/ludo-hero')}><Text style={styles.btnText}>🎲 Ludo</Text></TouchableOpacity>
      </View>
    );
    if (emotion === "sad") return (
      <View style={styles.btnColumn}>
        <TouchableOpacity style={[btnStyle, { borderColor: '#64b5f6' }]} onPress={() => Linking.openURL('https://poki.com/en/g/bubble-shooter-ludigames')}><Text style={styles.btnText}>✨ Bubbles</Text></TouchableOpacity>
      </View>
    );
    if (emotion === "stressed") return (
      <View style={styles.btnColumn}>
        <TouchableOpacity style={[btnStyle, { borderColor: '#4db6ac' }]} onPress={() => Linking.openURL('https://poki.com/en/g/pop-it-master')}><Text style={styles.btnText}>🫧 Pop-It</Text></TouchableOpacity>
      </View>
    );
    if (emotion === "angry") return (
      <View style={styles.btnColumn}>
        <TouchableOpacity style={[btnStyle, { borderColor: '#ff4757' }]} onPress={() => Linking.openURL('https://poki.com/en/g/drive-mad')}><Text style={styles.btnText}>🏎️ Drive Mad</Text></TouchableOpacity>
      </View>
    );
    if (emotion === "bored") return (
      <View style={styles.btnColumn}>
        <Text style={styles.askText}>Boredom beater! Try these classics:</Text>
        <TouchableOpacity style={[btnStyle, { borderColor: '#9c27b0' }]} onPress={() => Linking.openURL('https://poki.com/en/g/subway-surfers')}><Text style={styles.btnText}>🏃 Subway Surfers</Text></TouchableOpacity>
        <TouchableOpacity style={[btnStyle, { borderColor: '#3f51b5' }]} onPress={() => Linking.openURL('https://poki.com/en/g/retro-bowl')}><Text style={styles.btnText}>🏈 Retro Bowl</Text></TouchableOpacity>
      </View>
    );
    if (emotion === "excited") return (
      <View style={styles.btnColumn}>
        <Text style={styles.askText}>Match your energy with these!</Text>
        <TouchableOpacity style={[btnStyle, { borderColor: '#e91e63' }]} onPress={() => Linking.openURL('https://poki.com/en/g/vectaria-io')}><Text style={styles.btnText}>⚔️ Vectaria.io</Text></TouchableOpacity>
        <TouchableOpacity style={[btnStyle, { borderColor: '#00bcd4' }]} onPress={() => Linking.openURL('https://poki.com/en/g/monkey-mart')}><Text style={styles.btnText}>🐒 Monkey Mart</Text></TouchableOpacity>
      </View>
    );
    return null;
  };

  const avatar = getAvatar();

  return (
    <View style={styles.container}>
      {showConfetti && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} fallSpeed={3000} />}

      <View style={styles.topBar}>
        <TouchableOpacity onPress={clearChat}><Text style={styles.clearBtn}>🗑️ Clear</Text></TouchableOpacity>
        <Text style={styles.header}>Emotion Beater</Text>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.push('/analytics')}><Text style={styles.topLink}>📈</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/badges')}><Text style={[styles.topLink, { marginLeft: 15 }]}>🏆</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.avatarSection}>
        <Text style={styles.avatarIcon}>{avatar.icon}</Text>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.avatarName}>{avatar.name} (Lvl {level})</Text>
          <Text style={styles.streakText}>🔥 {streak} Day Streak</Text>
        </View>
      </View>

      <View style={styles.xpSection}>
        <View style={styles.xpBack}><View style={[styles.xpFill, { width: `${xp}%` }]} /></View>
        <Text style={styles.xpNum}>{xp}/100 XP</Text>
      </View>

      <View style={styles.quoteBar}><Text style={styles.quoteText}>"{currentQuote}"</Text></View>

      <ScrollView ref={scrollViewRef} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })} style={styles.chatArea}>
        {messages.map((m) => (
          <View key={m.id} style={{ marginBottom: 15 }}>
            <View style={[styles.bubble, m.sender === "user" ? styles.userBubble : styles.aiBubble]}>
              <Text style={styles.msgText}>{m.text}</Text>
            </View>
            <View style={{ marginTop: 5 }}>{renderButtons(m.emotion)}</View>
          </View>
        ))}
        {loading && <ActivityIndicator color="#00d2ff" style={{ marginTop: 10 }} />}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput style={styles.input} placeholder="Talk to me..." placeholderTextColor="#999" value={userInput} onChangeText={setUserInput} />
        <TouchableOpacity style={styles.sendBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); sendMessage(); }}><Text style={styles.sendText}>➔</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 50 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15, alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  clearBtn: { color: '#ff4757', fontWeight: 'bold', fontSize: 14 },
  navRow: { flexDirection: 'row' },
  topLink: { color: '#00d2ff', fontSize: 20 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
  avatarIcon: { fontSize: 50 },
  avatarName: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  streakText: { color: '#ff9800', fontWeight: 'bold' },
  xpSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
  xpBack: { flex: 1, height: 10, backgroundColor: '#222', borderRadius: 5, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: '#00d2ff' },
  xpNum: { color: '#888', fontSize: 12, marginLeft: 10 },
  quoteBar: { backgroundColor: '#111', marginHorizontal: 20, padding: 12, borderRadius: 10, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#00d2ff' },
  quoteText: { color: '#bbb', fontStyle: 'italic', fontSize: 13, textAlign: 'center' },
  chatArea: { flex: 1, paddingHorizontal: 15 },
  bubble: { padding: 15, borderRadius: 20, maxWidth: '85%' },
  userBubble: { backgroundColor: '#3f6c9cff', alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: '#1a1a1a', alignSelf: 'flex-start' },
  msgText: { color: 'white', fontSize: 16 },
  btnColumn: { gap: 10, marginTop: 5 },
  bigBtn: { padding: 12, borderRadius: 12, backgroundColor: '#080808', borderWidth: 2, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  askText: { color: '#888', fontStyle: 'italic', marginBottom: 5 },
  inputRow: { flexDirection: 'row', padding: 15, backgroundColor: '#0a0a0a', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 25, paddingHorizontal: 20, color: 'white', height: 45 },
  sendBtn: { marginLeft: 10, backgroundColor: '#007AFF', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  sendText: { color: 'white', fontSize: 20 }
});