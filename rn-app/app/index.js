import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Modal,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GROUPS, shuffle } from '../utils/gameLogic';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function App() {
    const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'main_menu' | 'map' | 'game'
    const [players, setPlayers] = useState([{ name: 'Oyuncu 1', score: 0 }]);
    const [currentTurn, setCurrentTurn] = useState(0);
    const [unlockedLevel, setUnlockedLevel] = useState(1);
    const [selectedLevel, setSelectedLevel] = useState(0); // 0 index
    const [inProgress, setInProgress] = useState(false);
    const [lives, setLives] = useState(6);
    const [storeVisible, setStoreVisible] = useState(false);
    const [howToPlayVisible, setHowToPlayVisible] = useState(false);
    const [isUnlimited, setIsUnlimited] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);

    const [setupVisible, setSetupVisible] = useState(false);
    const [playerCountStr, setPlayerCountStr] = useState('1');
    const [tempPlayerNames, setTempPlayerNames] = useState(['Oyuncu 1']);
    const [extraTimeModalVisible, setExtraTimeModalVisible] = useState(false);

    // Leaderboard State
    const [leaderboardVisible, setLeaderboardVisible] = useState(false);
    const [leaderboardTab, setLeaderboardTab] = useState('daily'); // 'daily' | 'weekly' | 'monthly'

    // Ad logic variables
    const [gamesPlayed, setGamesPlayed] = useState(0);
    const [showAd, setShowAd] = useState(false);

    const [currentGroup, setCurrentGroup] = useState(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [revealCount, setRevealCount] = useState(1);
    const [guess, setGuess] = useState('');
    const [chainList, setChainList] = useState([]);
    const [feedback, setFeedback] = useState('');
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameResult, setGameResult] = useState('');
    const [hasMadeMistake, setHasMadeMistake] = useState(false);

    const timerRef = useRef(null);
    const guessInputRef = useRef(null);



    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Splash
    const splashLine = useRef(new Animated.Value(300)).current;
    const splashText = useRef(new Animated.Value(0)).current;
    const splashOpacity = useRef(new Animated.Value(1)).current;
    const menuOpacity = useRef(new Animated.Value(0)).current;



    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const storedGames = await AsyncStorage.getItem('@games_played');
                if (storedGames !== null) {
                    setGamesPlayed(parseInt(storedGames, 10));
                }
            } catch (e) {
                console.log("Failed to load gamesPlayed.", e);
            }
        };
        loadData();


    }, []);

    useEffect(() => {
        if (currentScreen === 'home') {
            splashLine.setValue(300);
            splashText.setValue(0);
            splashOpacity.setValue(1);

            Animated.sequence([
                Animated.timing(splashLine, {
                    toValue: 0,
                    duration: 1200,
                    useNativeDriver: false,
                }),
                Animated.timing(splashText, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(splashOpacity, {
                    toValue: 0,
                    duration: 400,
                    delay: 200,
                    useNativeDriver: true,
                })
            ]).start(() => {
                setCurrentScreen('main_menu');
            });
        } else if (currentScreen === 'main_menu') {
            Animated.timing(menuOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        } else {
            menuOpacity.setValue(1);
        }
    }, [currentScreen]);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, [inProgress, stepIndex]);

    useEffect(() => {
        if (inProgress && timeLeft > 0) {
            timerRef.current = setTimeout(() => {
                setTimeLeft(t => t - 1);
            }, 1000);
        } else if (inProgress && timeLeft === 0) {
            setInProgress(false);
            setExtraTimeModalVisible(true);
        }
        return () => clearTimeout(timerRef.current);
    }, [inProgress, timeLeft]);

    const toTRUpper = (s) => (s ? s.toLocaleUpperCase('tr-TR') : '');
    const normalize = (s) => toTRUpper(s.trim().replace(/\s+/g, ' '));
    const maxRevealable = (word) => {
        if (!word) return 0;
        let cnt = 0;
        for (let ch of toTRUpper(word)) {
            if (ch !== ' ' && ch !== '-') cnt++;
        }
        return cnt;
    };
    const makeProgressiveHint = (word, count) => {
        if (!word) return '';
        let opened = 0, out = '';
        for (let ch of toTRUpper(word)) {
            if (ch === ' ' || ch === '-') { out += ch; continue; }
            if (opened < count) { out += ch; opened++; } else { out += ' _ '; }
        }
        return out.trim();
    };

    const handleOpenSetup = () => {
        setPlayerCountStr(String(players.length));
        setTempPlayerNames(players.map(p => p.name));
        setSetupVisible(true);
    };
    const handlePlayerCountChange = (text) => {
        setPlayerCountStr(text);
        const n = Math.max(1, Math.min(8, parseInt(text) || 1));
        const newNames = [];
        for (let i = 0; i < n; i++) newNames.push(tempPlayerNames[i] || `Oyuncu ${i + 1}`);
        setTempPlayerNames(newNames);
    };
    const confirmSetup = () => {
        const newPlayers = tempPlayerNames.map(n => ({ name: n.trim(), score: 0 }));
        setPlayers(newPlayers);
        setSetupVisible(false);
        startRoundForCurrentPlayer(newPlayers, 0);
    };
    const handleDailyChain = () => {
        const today = new Date();
        const timeZoneOffset = today.getTimezoneOffset() * 60 * 1000;
        const localTime = today.getTime() - timeZoneOffset;
        const daysSinceEpoch = Math.floor(localTime / (1000 * 60 * 60 * 24));
        const dailyIndex = daysSinceEpoch % GROUPS.length;
        // Opsiyonel olarak gün indeksine bir 'salt' ekleyebiliriz (örn: +102) ama gerek yok
        handleStartGame(dailyIndex);
    };

    const handleStartGame = (levelIndex) => {
        if (!isUnlimited && lives < 2) {
            setStoreVisible(true);
            return;
        }
        if (!isUnlimited) {
            setLives(prev => prev - 2);
        }
        setSelectedLevel(levelIndex);
        setCurrentScreen('game');
        startRoundForCurrentPlayer(levelIndex);
    };

    const startRoundForCurrentPlayer = (levelIndex = selectedLevel) => {
        const groupIndex = levelIndex % GROUPS.length;
        setCurrentGroup(GROUPS[groupIndex]);
        setStepIndex(0);
        setRevealCount(1);
        setChainList([]);
        setFeedback('');
        setGuess('');
        setGameResult('');
        setIsGameOver(false);
        setHasMadeMistake(false);
        setTimeLeft(60);
        setInProgress(true);
        fadeAnim.setValue(0);
        setTimeout(() => guessInputRef.current?.focus(), 100);
    };

    const endGame = async (completed) => {
        setInProgress(false);
        clearTimeout(timerRef.current);
        let newPlayers = [...players];
        const active = newPlayers[currentTurn];

        if (completed) {
            active.score += 20 + timeLeft;
        }

        setPlayers(newPlayers);

        let resultTxt = `Süre Bitti!\nZaman Bonusu: 0 Puan\nZincir Uzunluğu: ${chainList.length}`;
        if (completed) {
            resultTxt = `Tebrikler!\nZaman Bonusu: ${timeLeft} Puan\nZincir Uzunluğu: ${chainList.length}`;
            if (!hasMadeMistake) {
                if (!isUnlimited) setLives(l => l + 1);
                resultTxt += `\n\n🎯 Hatasız Zincir!\n+1 Can İadesi!`;
            }
        }
        setGameResult(resultTxt);
        setIsGameOver(true);

        // Reklam (Ad) Mantığı
        try {
            const newCount = gamesPlayed + 1;
            setGamesPlayed(newCount);
            await AsyncStorage.setItem('@games_played', newCount.toString());

            // Eğer yeni oyuncuysa ilk 3 oyunda reklam çıkmıyor (newCount > 3 ise çıkıyor)
            // Ya da önceden 3'ü geçmişse zaten çıkıyor. Ek olarak VIP (isUnlimited) ise hiç çıkmaz.
            if (!isUnlimited && newCount > 3) {
                setTimeout(() => setShowAd(true), 1500); // Popup belirdikten az sonra gelsin
            }
        } catch (e) {
            console.log("Failed to save gamesPlayed", e);
        }
    };

    const handleSubmit = () => {
        if (!inProgress || !currentGroup) return;
        const val = normalize(guess);
        if (!val) return;
        const step = currentGroup.steps[stepIndex];
        const currentWord = stepIndex === 0 ? currentGroup.start : currentGroup.steps[stepIndex - 1].root;
        if (val === normalize(step.phrase) || val === normalize(`${currentWord} ${step.phrase}`)) {
            setFeedback('Harika! Doğru Tahmin 🎉');
            let newPlayers = [...players];
            newPlayers[currentTurn].score += 5;
            setPlayers(newPlayers);
            let newChain = [...chainList, step.phrase];
            if (step.root) newChain.push(step.root);
            setChainList(newChain);
            const nextIdx = stepIndex + 1;
            setStepIndex(nextIdx);
            setRevealCount(1);
            setGuess('');
            fadeAnim.setValue(0);
            if (nextIdx >= currentGroup.steps.length) {
                // Eğer rekor bölümdeyse ve rekorunu geçiyorsa
                if (selectedLevel + 1 === unlockedLevel) {
                    setUnlockedLevel(prev => prev + 1);
                }
                endGame(true);
            }
        } else {
            setHasMadeMistake(true);
            setFeedback('Yanlış, Tekrar Dene!');
        }
    };

    const handleCustomLetter = () => {
        if (!inProgress || !currentGroup) return;
        const step = currentGroup.steps[stepIndex];
        const maxOpen = maxRevealable(step?.root || step?.phrase || '');
        if (revealCount >= maxOpen) return;
        setHasMadeMistake(true);
        let newPlayers = [...players];
        newPlayers[currentTurn].score -= 2;
        setPlayers(newPlayers);
        setRevealCount(r => r + 1);
    };

    const handleNextPlayer = () => {
        setIsGameOver(false);
        if (currentTurn + 1 < players.length) {
            setCurrentTurn(t => t + 1);
            startRoundForCurrentPlayer(players, currentTurn + 1);
        } else {
            setGameResult('Oyun Sonlandı!\nTebrikler!');
        }
    };

    const step = currentGroup?.steps[stepIndex];
    const currentWordDisplay = currentGroup ? (stepIndex === 0 ? currentGroup.start : currentGroup.steps[stepIndex - 1].root) : 'KELİME';
    const hintWord = step?.root || step?.phrase || '';
    const hintDisplay = inProgress ? makeProgressiveHint(hintWord, revealCount) : '—';
    const customLetterDisabled = !inProgress || revealCount >= maxRevealable(hintWord);

    if (currentScreen === 'home') {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={['#0f172a', '#1e1b4b', '#000000']} style={StyleSheet.absoluteFillObject} />

                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Animated.View style={{ alignItems: 'center', opacity: splashOpacity }}>
                        <Svg width={140} height={70} viewBox="-10 -10 120 70">
                            <AnimatedPath
                                d="M 50,25 C 35,-5 0,-5 0,25 C 0,55 35,55 50,25 C 65,-5 100,-5 100,25 C 100,55 65,55 50,25 Z"
                                fill="none"
                                stroke="#a855f7"
                                strokeWidth="5"
                                strokeDasharray="300"
                                strokeDashoffset={splashLine}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </Svg>

                        <Animated.View style={{ opacity: splashText, alignItems: 'center', marginTop: 30 }}>
                            <Text style={[styles.mainTitle, { fontSize: 42, marginBottom: 5 }]}>KELİME</Text>
                            <Text style={[styles.mainTitle, { fontSize: 42, color: '#38bdf8' }]}>ZİNCİRİ</Text>
                        </Animated.View>
                    </Animated.View>
                </View>
            </View>
        );
    }

    const renderHowToPlayModal = () => (
        <Modal visible={howToPlayVisible} transparent animationType="slide">
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ width: '100%', maxHeight: '85%', backgroundColor: '#1e293b', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>🎮 Nasıl Oynanır?</Text>
                            <TouchableOpacity onPress={() => setHowToPlayVisible(false)} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 20 }}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ color: '#38bdf8', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>🧩 Oyunun Amacı</Text>
                                <Text style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 22 }}>Verilen başlangıç kelimesinden yola çıkarak, her adımda bir önceki kelimeyle anlamlı bir isim tamlaması oluştur.{'\n\n'}Her yeni kelime zinciri mantıklı şekilde devam ettirmelidir.</Text>
                            </View>

                            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 24 }} />

                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ color: '#a855f7', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>🔗 Oyun Mantığı</Text>
                                <Text style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 24 }}>
                                    1. Sana bir başlangıç kelimesi verilir.{'\n'}
                                    2. Bu kelimeyle anlamlı bir tamlama oluşturursun.{'\n'}
                                    3. Yazdığın kelimenin kökünden yeni bir tamlama üretirsin.{'\n'}
                                    4. Zincir bu şekilde devam eder.
                                </Text>
                            </View>

                            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 24 }} />

                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ color: '#10b981', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>✅ Örnek</Text>
                                <Text style={{ color: '#cbd5e1', fontSize: 15, marginBottom: 8 }}>Başlangıç kelimesi: <Text style={{ fontWeight: 'bold', color: '#fff' }}>DENİZ</Text></Text>
                                <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12 }}>
                                    <Text style={{ color: '#94a3b8', fontSize: 15, lineHeight: 24 }}>
                                        • <Text style={{ color: '#fff', fontWeight: 'bold' }}>DENİZ</Text> kızı{'\n'}
                                        • <Text style={{ color: '#fff', fontWeight: 'bold' }}>KIZ</Text> tavlası{'\n'}
                                        • <Text style={{ color: '#fff', fontWeight: 'bold' }}>TAVLA</Text> oyunu{'\n'}
                                        • <Text style={{ color: '#fff', fontWeight: 'bold' }}>OYUN</Text> kartı{'\n'}
                                        • <Text style={{ color: '#fff', fontWeight: 'bold' }}>KART</Text> koleksiyonu
                                    </Text>
                                </View>
                                <Text style={{ color: '#cbd5e1', fontSize: 14, marginTop: 8, fontStyle: 'italic' }}>Her adım bir önceki kelimeyle anlamlı bir tamlama oluşturur.</Text>
                            </View>

                            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 24 }} />

                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ color: '#f59e0b', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>📌 Kurallar</Text>
                                <Text style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 24 }}>
                                    • Her kelime bir öncekiyle anlamlı bir isim tamlaması oluşturmalıdır.{'\n'}
                                    • Aynı kelime tekrar kullanılamaz.{'\n'}
                                    • Uydurma kelime kabul edilmez.{'\n'}
                                    • Zincir doğal ve akıcı olmalıdır.
                                </Text>
                            </View>

                            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 24 }} />

                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>❤️ Can Sistemi</Text>
                                <Text style={{ color: '#cbd5e1', fontSize: 15, lineHeight: 24 }}>
                                    • Her oyuna başladığında 2 can kullanılır.{'\n'}
                                    • <Text style={{ color: '#10b981', fontWeight: 'bold' }}>Hatasız zincir yaparsan 1 can iade edilir! 🎯</Text>{'\n'}
                                    • Günlük 6 ücretsiz can hakkın vardır.{'\n'}
                                    • Canların bittiğinde yeni oyun başlatamazsın.{'\n'}
                                    • Canlar her gün yenilenir.
                                </Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );

    // Dummy data for leaderboard
    const DUMMY_LEADERBOARD = {
        daily: [
            { name: 'Oyuncu 1', score: 2450 }, { name: 'Ahmet Y.', score: 1800 },
            { name: 'KelimGenius', score: 1550 }, { name: 'Ayşe', score: 1200 },
            { name: 'Burak99', score: 950 }, { name: 'Zeynep', score: 800 }
        ],
        weekly: [
            { name: 'ProPlayer', score: 12450 }, { name: 'KelimeBükücü', score: 11800 },
            { name: 'Oyuncu 1', score: 8550 }, { name: 'Berkcan', score: 7200 },
            { name: 'Ceren', score: 6950 }, { name: 'Caner', score: 5800 }
        ],
        monthly: [
            { name: 'Efsane', score: 45450 }, { name: 'Cemre', score: 41800 },
            { name: 'SözlükBey', score: 38550 }, { name: 'Gizem', score: 34200 },
            { name: 'Buse', score: 29950 }, { name: 'Oyuncu 1', score: 25800 }
        ]
    };

    const renderLeaderboardModal = () => (
        <Modal visible={leaderboardVisible} transparent animationType="slide">
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ width: '100%', maxHeight: '85%', backgroundColor: '#1e293b', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="trophy" size={28} color="#f59e0b" style={{ marginRight: 10 }} />
                                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>Sıralama</Text>
                            </View>
                            <TouchableOpacity onPress={() => setLeaderboardVisible(false)} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 20 }}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Tabs */}
                        <View style={{ flexDirection: 'row', marginVertical: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 4 }}>
                            {['daily', 'weekly', 'monthly'].map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: leaderboardTab === tab ? 'rgba(255,255,255,0.15)' : 'transparent' }}
                                    onPress={() => setLeaderboardTab(tab)}
                                >
                                    <Text style={{ color: leaderboardTab === tab ? '#fff' : '#94a3b8', fontWeight: leaderboardTab === tab ? 'bold' : 'normal', fontSize: 13 }}>
                                        {tab === 'daily' ? 'GÜNLÜK' : tab === 'weekly' ? 'HAFTALIK' : 'AYLIK'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* List */}
                        <ScrollView style={{ width: '100%', marginTop: 10 }} showsVerticalScrollIndicator={false}>
                            {DUMMY_LEADERBOARD[leaderboardTab].map((item, index) => {
                                let rankColor = '#64748b'; // default gray
                                if (index === 0) rankColor = '#fbbf24'; // gold
                                else if (index === 1) rankColor = '#94a3b8'; // silver
                                else if (index === 2) rankColor = '#b45309'; // bronze

                                const isMe = item.name.includes("Oyuncu 1");

                                return (
                                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, marginBottom: 8, backgroundColor: isMe ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: isMe ? 'rgba(56, 189, 248, 0.4)' : 'transparent' }}>
                                        <Text style={{ color: rankColor, fontSize: 18, fontWeight: '900', width: 30 }}>{index + 1}.</Text>
                                        <View style={{ flex: 1, paddingLeft: 10 }}>
                                            <Text style={{ color: isMe ? '#38bdf8' : '#e2e8f0', fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
                                        </View>
                                        <Text style={{ color: '#10b981', fontSize: 15, fontWeight: '800' }}>{item.score} Pts</Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );

    if (currentScreen === 'main_menu') {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={['#0f172a', '#1e1b4b', '#000000']} style={StyleSheet.absoluteFillObject} />


                <Animated.View style={{ flex: 1, opacity: menuOpacity }}>
                    <SafeAreaView style={[styles.safeArea, { alignItems: 'center', justifyContent: 'center' }]}>

                        {/* Üst Bar: Geri, Sıralama ve Can */}
                        <View style={{ position: 'absolute', top: Platform.OS === 'android' ? 40 : 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 }}>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity onPress={() => setLeaderboardVisible(true)} activeOpacity={0.7}>
                                    <BlurView intensity={40} tint="dark" style={[styles.glassPill, { paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' }]}>
                                        <Ionicons name="trophy" size={18} color="#f59e0b" style={{ marginRight: 6 }} />
                                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Sıralama</Text>
                                    </BlurView>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => setStoreVisible(true)} activeOpacity={0.7}>
                                <BlurView intensity={40} tint="dark" style={[styles.glassPill, { paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' }]}>
                                    <Ionicons name="heart" size={20} color="#ef4444" style={{ marginRight: 6 }} />
                                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{isUnlimited ? '∞' : lives}</Text>
                                    <Ionicons name="add-circle" size={18} color="#10b981" style={{ marginLeft: 6, marginRight: -4 }} />
                                </BlurView>
                            </TouchableOpacity>
                        </View>

                        {/* Mağaza Modalı */}
                        <Modal visible={storeVisible} animationType="slide" transparent>
                            <BlurView intensity={90} tint="dark" style={styles.modalBg}>
                                <View style={[styles.modalBox, { padding: 20, width: '90%' }]}>
                                    <TouchableOpacity style={{ alignSelf: 'flex-end', padding: 5, zIndex: 10 }} onPress={() => setStoreVisible(false)}>
                                        <Ionicons name="close" size={28} color="#94a3b8" />
                                    </TouchableOpacity>

                                    <Ionicons name="cart" size={48} color="#f59e0b" style={{ marginTop: -20, marginBottom: 10 }} />
                                    <Text style={[styles.modalTitle, { fontSize: 24, marginBottom: 10 }]}>MARKET</Text>
                                    <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 }}>Her oyun girişinde 2 Can harcanır. Oyununa kesintisiz devam etmek için can paketi al!</Text>

                                    {/* Restore Purchases / Satın Alımları Geri Yükle */}
                                    <TouchableOpacity
                                        style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.4)', marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                                        onPress={() => alert("Apple ID kontrol ediliyor...\nSatın alımlarınız başarıyla geri yüklendi! (Simülasyon)")}
                                    >
                                        <Ionicons name="refresh-circle" size={20} color="#38bdf8" style={{ marginRight: 8 }} />
                                        <Text style={{ color: '#38bdf8', fontSize: 14, fontWeight: 'bold' }}>Geçmiş Satın Alımları Geri Yükle</Text>
                                    </TouchableOpacity>

                                    <ScrollView style={{ width: '100%', maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                                        <Text style={{ color: '#38bdf8', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 10, marginTop: 10 }}>BEDAVA CAN KAZAN</Text>

                                        <TouchableOpacity
                                            style={[styles.storeCard, { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' }]}
                                            onPress={() => {
                                                alert("Reklam izleniyor... (Simülasyon)\n+2 Can Kazandınız!");
                                                setLives(prev => prev + 2);
                                                setStoreVisible(false);
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name="play-circle" size={24} color="#f59e0b" style={{ marginRight: 10 }} />
                                                <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Reklam İzle</Text>
                                            </View>
                                            <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '900' }}>+2 Can</Text>
                                        </TouchableOpacity>

                                        <Text style={{ color: '#38bdf8', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 10, marginTop: 20 }}>TEKLİ PAKETLER</Text>

                                        {[
                                            { qty: 1, price: '2.99 ₺', color: '#6366f1' },
                                            { qty: 2, price: '5.00 ₺', color: '#8b5cf6' },
                                            { qty: 5, price: '10.00 ₺', color: '#d946ef' },
                                            { qty: 10, price: '17.99 ₺', color: '#f43f5e' }
                                        ].map((item, idx) => (
                                            <TouchableOpacity
                                                key={`tekli-${idx}`}
                                                style={styles.storeCard}
                                                onPress={() => {
                                                    setLives(prev => prev + item.qty);
                                                    alert(`+${item.qty} Can başarıyla eklendi!`);
                                                    setStoreVisible(false);
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Ionicons name="heart" size={24} color={item.color} style={{ marginRight: 10 }} />
                                                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{item.qty} Can</Text>
                                                </View>
                                                <Text style={{ color: '#f59e0b', fontSize: 16, fontWeight: '900' }}>{item.price}</Text>
                                            </TouchableOpacity>
                                        ))}

                                        <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 10, marginTop: 20 }}>SINIRSIZ ABONELİK</Text>

                                        {[
                                            { title: 'Haftalık', price: '45.00 ₺' },
                                            { title: 'Aylık', price: '99.00 ₺' },
                                            { title: 'Yıllık', price: '499.00 ₺' }
                                        ].map((item, idx) => (
                                            <TouchableOpacity
                                                key={`abone-${idx}`}
                                                style={styles.storeCard}
                                                onPress={() => {
                                                    setIsUnlimited(true);
                                                    alert(`${item.title} Sınırsız Can paketi aktifleştirildi! Artık dilediğin kadar oynayabilirsin.`);
                                                    setStoreVisible(false);
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Ionicons name="infinite" size={24} color="#10b981" style={{ marginRight: 10 }} />
                                                    <View>
                                                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{item.title} VIP</Text>
                                                        <Text style={{ color: '#ecfdf5', fontSize: 12, marginTop: 2 }}>+ Reklamsız</Text>
                                                    </View>
                                                </View>
                                                <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '900' }}>{item.price}</Text>
                                            </TouchableOpacity>
                                        ))}
                                        <View style={{ height: 20 }} />
                                    </ScrollView>
                                </View>
                            </BlurView>
                        </Modal>
                        {/* Nasıl Oynanır Modalı */}
                        {renderHowToPlayModal()}

                        {/* Leaderboard Modalı */}
                        {renderLeaderboardModal()}

                        <Text style={[styles.mainTitle, { fontSize: 32, marginBottom: 20, marginTop: 40 }]}>KELİME ZİNCİRİ</Text>

                        <View style={{ width: '85%', gap: 16 }}>

                            {/* 1. Kronos Haritası (Ortada Geniş Pencere) */}
                            <TouchableOpacity
                                activeOpacity={0.9}
                                style={{ width: '100%', height: 260, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 6 } }}
                                onPress={() => setCurrentScreen('map')}
                            >
                                <LinearGradient colors={['#0f172a', '#1e293b']} style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <View>
                                            <Text style={{ color: '#38bdf8', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>KRONOS HARİTASI</Text>
                                            <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Mevcut İlerlemen</Text>
                                        </View>
                                        <BlurView intensity={20} tint="light" style={{ padding: 8, borderRadius: 12 }}>
                                            <Ionicons name="map" size={24} color="#38bdf8" />
                                        </BlurView>
                                    </View>

                                    <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(56, 189, 248, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#38bdf8', shadowColor: '#38bdf8', shadowOpacity: 0.8, shadowRadius: 20 }}>
                                            <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900' }}>{unlockedLevel}</Text>
                                            <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: '800', marginTop: -2, letterSpacing: 1 }}>BÖLÜM</Text>
                                        </View>
                                    </View>

                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 }}>HARİTAYA GİT</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* 2. Rastgele Oyna (İnce Yatay Widget) */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={{ width: '100%', height: 75, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 6 } }}
                                onPress={() => {
                                    const randomLvl = Math.floor(Math.random() * GROUPS.length);
                                    handleStartGame(randomLvl);
                                }}
                            >
                                <LinearGradient colors={['#a855f7', '#8b5cf6']} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 16, marginRight: 15 }}>
                                            <Ionicons name="shuffle" size={22} color="#fff" />
                                        </View>
                                        <View>
                                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>RASTGELE OYNA</Text>
                                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>Limitsiz kelime avı</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* 3. Günün Zinciri (İnce Widget) */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={{ width: '100%', height: 75, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 6 } }}
                                onPress={handleDailyChain}
                            >
                                <LinearGradient colors={['#10b981', '#059669']} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 16, marginRight: 15 }}>
                                            <Ionicons name="calendar" size={22} color="#fff" />
                                        </View>
                                        <View>
                                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>GÜNÜN ZİNCİRİ</Text>
                                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>Sadece bugüne özel</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Nasıl Oynanır Butonu */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={{ alignSelf: 'center', marginTop: 10, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}
                                onPress={() => setHowToPlayVisible(true)}
                            >
                                <Ionicons name="help-circle-outline" size={18} color="#94a3b8" style={{ marginRight: 6 }} />
                                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}>Nasıl Oynanır?</Text>
                            </TouchableOpacity>

                        </View>
                    </SafeAreaView>
                </Animated.View>
            </View>
        );
    }

    if (currentScreen === 'map') {
        const totalLevels = Math.min(GROUPS.length, 50);

        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <LinearGradient colors={['#020617', '#0f172a', '#1e1b4b']} style={StyleSheet.absoluteFillObject} />

                <SafeAreaView style={styles.safeArea}>

                    {/* Harita Geri Butonu */}
                    <View style={{ position: 'absolute', top: Platform.OS === 'android' ? 40 : 50, left: 20, zIndex: 10 }}>
                        <TouchableOpacity onPress={() => setCurrentScreen('main_menu')} activeOpacity={0.7}>
                            <BlurView intensity={40} tint="dark" style={[styles.glassPill, { paddingHorizontal: 12 }]}>
                                <Ionicons name="chevron-back" size={24} color="#fff" />
                            </BlurView>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.mapHeader}>
                        <Text style={styles.mapHeaderTitle}>KRONOS</Text>
                        <Text style={styles.mapHeaderSub}>SEVİYE {unlockedLevel - 1} / {totalLevels}</Text>
                    </View>

                    <ScrollView contentContainerStyle={styles.mapScroll} showsVerticalScrollIndicator={false}>
                        <LinearGradient
                            colors={['transparent', '#a855f7', '#38bdf8', 'transparent']}
                            style={styles.centerSpine}
                        />

                        {Array.from({ length: totalLevels }).map((_, index) => {
                            const levelNum = index + 1;
                            const isLocked = levelNum > unlockedLevel;
                            const isCurrent = levelNum === unlockedLevel;
                            const isPassed = levelNum < unlockedLevel;
                            const isOdd = index % 2 !== 0;

                            return (
                                <View key={index} style={styles.levelRow}>

                                    <View style={[styles.levelSide, { alignItems: 'flex-end', paddingRight: 20 }]}>
                                        {isOdd && (
                                            <BlurView intensity={isLocked ? 10 : 30} tint="light" style={styles.levelInfoBox}>
                                                <Text style={[styles.levelInfoTitle, isLocked && { color: '#64748b' }]}>BÖLÜM {levelNum}</Text>
                                                <Text style={[styles.levelInfoStatus, isLocked && { color: '#475569' }, isCurrent && { color: '#38bdf8' }]}>
                                                    {isLocked ? 'Gizemli Seviye' : isPassed ? 'Tamamlandı' : 'Sıradaki Görev'}
                                                </Text>
                                            </BlurView>
                                        )}
                                    </View>

                                    <View style={styles.nodeContainer}>
                                        {isCurrent && (
                                            <Animated.View style={[styles.nodeAura, { transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.3] }) }] }]} />
                                        )}
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            disabled={isLocked}
                                            onPress={() => {
                                                handleStartGame(index);
                                            }}
                                        >
                                            <LinearGradient
                                                colors={isLocked ? ['#1e293b', '#0f172a'] : isCurrent ? ['#38bdf8', '#3b82f6'] : ['#a855f7', '#6d28d9']}
                                                style={[styles.nodeCircle, isCurrent && styles.nodeCircleCurrent]}
                                            >
                                                {isLocked ? (
                                                    <Ionicons name="lock-closed" size={20} color="#475569" />
                                                ) : isPassed ? (
                                                    <Ionicons name="checkmark-done" size={24} color="#fff" />
                                                ) : (
                                                    <Ionicons name="play" size={26} color="#fff" style={{ marginLeft: 4 }} />
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={[styles.levelSide, { alignItems: 'flex-start', paddingLeft: 20 }]}>
                                        {!isOdd && (
                                            <BlurView intensity={isLocked ? 10 : 30} tint="light" style={styles.levelInfoBox}>
                                                <Text style={[styles.levelInfoTitle, isLocked && { color: '#64748b' }]}>BÖLÜM {levelNum}</Text>
                                                <Text style={[styles.levelInfoStatus, isLocked && { color: '#475569' }, isCurrent && { color: '#38bdf8' }]}>
                                                    {isLocked ? 'Gizemli Seviye' : isPassed ? 'Tamamlandı' : 'Sıradaki Görev'}
                                                </Text>
                                            </BlurView>
                                        )}
                                    </View>

                                </View>
                            )
                        })}
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0f172a', '#1e1b4b', '#000000']} style={StyleSheet.absoluteFillObject} />

            <SafeAreaView style={styles.safeArea}>
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setCurrentScreen('main_menu')} activeOpacity={0.7}>
                        <BlurView intensity={40} tint="dark" style={[styles.glassPill, { paddingHorizontal: 12 }]}>
                            <Ionicons name="map-outline" size={24} color="#fff" />
                        </BlurView>
                    </TouchableOpacity>

                    <Text style={[styles.mainTitle, { fontSize: 20 }]}>BÖLÜM {selectedLevel + 1}</Text>

                    <TouchableOpacity onPress={inProgress ? () => endGame(false) : handleOpenSetup} activeOpacity={0.7}>
                        <LinearGradient colors={inProgress ? ['#ef4444', '#b91c1c'] : ['#22c55e', '#16a34a']} style={styles.actionBtn}>
                            <Ionicons name={inProgress ? "stop" : "play"} size={18} color="#fff" />
                            <Text style={styles.actionBtnText}>{inProgress ? "Bitir" : "Başla"}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* TOP SCOREBOARD */}
                <View style={styles.scoreContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15, justifyContent: 'center' }}>
                        <BlurView intensity={40} tint="dark" style={[styles.glassPill, { borderColor: '#38bdf8' }]}>
                            <Ionicons name="timer-outline" size={20} color="#38bdf8" />
                            <Text style={styles.timerText}>{timeLeft}s</Text>
                        </BlurView>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}>
                        {players.map((p, i) => (
                            <BlurView key={i} intensity={30} tint="light" style={[styles.playerTab, i === currentTurn && styles.activePlayerTab]}>
                                <Text style={[styles.playerName, i === currentTurn && styles.activePlayerText]}>{p.name}</Text>
                                <Text style={[styles.playerScore, i === currentTurn && styles.activePlayerText]}>{p.score} 🏆</Text>
                            </BlurView>
                        ))}
                    </ScrollView>
                </View>

                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                        {/* STAGE AREA */}
                        <Animated.View style={[styles.glassCard, { opacity: fadeAnim, transform: [{ scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
                            <Text style={styles.preTitle}>ŞU ANKİ KELİME</Text>
                            <Text style={styles.bigWord}>{currentWordDisplay}</Text>

                            <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.0)']} style={styles.divider} />

                            <Text style={styles.preTitle}>SIRADAKİ TAMLAMA İPUCU</Text>
                            <Text style={styles.hintWord}>{hintDisplay}</Text>

                            <TouchableOpacity
                                style={[styles.letterBtnOutline, customLetterDisabled && { opacity: 0.4 }]}
                                onPress={handleCustomLetter}
                                disabled={customLetterDisabled}
                                activeOpacity={0.6}
                            >
                                <Ionicons name="bulb-outline" size={18} color="#38bdf8" />
                                <Text style={styles.letterBtnText}>Bir Harf Aç (-2 Puan)</Text>
                            </TouchableOpacity>

                            <TextInput
                                ref={guessInputRef}
                                style={[styles.inputGlass, !inProgress && { opacity: 0.5 }]}
                                placeholder={inProgress ? "Tamlamayı tahmin et..." : "Başlamak için Ayar yapın"}
                                placeholderTextColor="#9ca3af"
                                value={guess}
                                onChangeText={setGuess}
                                onSubmitEditing={handleSubmit}
                                editable={inProgress}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                returnKeyType="send"
                                keyboardAppearance="dark"
                            />
                            {feedback !== '' && (
                                <Animated.Text style={[
                                    styles.feedbackText,
                                    feedback.includes('Doğru') ? { color: '#4ade80' } : { color: '#f87171' }
                                ]}>
                                    {feedback}
                                </Animated.Text>
                            )}
                        </Animated.View>

                        {/* CHAIN LIST */}
                        <View style={styles.chainTitleRow}>
                            <Ionicons name="link-outline" size={24} color="#a855f7" />
                            <Text style={styles.chainTitle}> OLUŞAN ZİNCİR</Text>
                        </View>

                        <View style={styles.chainContainer}>
                            {chainList.map((c, i) => (
                                <BlurView intensity={20} tint="light" key={i} style={styles.chainBubble}>
                                    <Text style={styles.chainBubbleText}>{c}</Text>
                                </BlurView>
                            ))}
                            {chainList.length === 0 && <Text style={styles.emptyText}>Henüz tahmin yapılmadı.</Text>}
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>

                {/* SETUP MODAL */}
                <Modal visible={setupVisible} animationType="slide" transparent>
                    <BlurView intensity={90} tint="dark" style={styles.modalBg}>
                        <View style={styles.modalBox}>
                            <Ionicons name="people-circle" size={48} color="#a855f7" style={{ marginBottom: 10 }} />
                            <Text style={styles.modalTitle}>Oyuncu Ayarları</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={playerCountStr}
                                onChangeText={handlePlayerCountChange}
                                keyboardType="number-pad"
                                keyboardAppearance='dark'
                                placeholder='Oyuncu Sayısı'
                            />
                            <ScrollView style={{ maxHeight: 250, width: '100%', marginVertical: 10 }}>
                                {tempPlayerNames.map((name, idx) => (
                                    <TextInput
                                        key={idx}
                                        style={styles.modalInput}
                                        value={name}
                                        onChangeText={(t) => {
                                            let arr = [...tempPlayerNames];
                                            arr[idx] = t;
                                            setTempPlayerNames(arr);
                                        }}
                                        keyboardAppearance='dark'
                                    />
                                ))}
                            </ScrollView>
                            <Text style={styles.infoText}>Zinciri tamamlayan +20 Puan kazanır.</Text>
                            <TouchableOpacity onPress={confirmSetup}>
                                <LinearGradient colors={['#a855f7', '#6366f1']} style={styles.bigNeonBtn}>
                                    <Text style={styles.bigNeonText}>OYUNA BAŞLA</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Modal>

                {/* GAME OVER MODAL */}
                <Modal visible={isGameOver} animationType="fade" transparent>
                    <BlurView intensity={100} tint="dark" style={styles.modalBg}>
                        <View style={styles.modalBox}>
                            <Ionicons name="trophy" size={56} color="#fbbf24" style={{ marginBottom: 10 }} />
                            <Text style={styles.modalTitle}>Tebrikler!</Text>
                            <Text style={styles.resultText}>{gameResult}</Text>
                            <Text style={styles.nextTurnText}>
                                {gameResult.includes('Bitti') ? `Kazanılan Puan: ${players[currentTurn].score}` : 'Harika bir performans!'}
                            </Text>
                            <TouchableOpacity onPress={() => setCurrentScreen('main_menu')}>
                                <LinearGradient colors={['#a855f7', '#6366f1']} style={styles.bigNeonBtn}>
                                    <Text style={styles.bigNeonText}>MENÜYE DÖN</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Modal>
                {/* EXTRA TIME MODAL */}
                <Modal visible={extraTimeModalVisible} animationType="slide" transparent>
                    <BlurView intensity={90} tint="dark" style={styles.modalBg}>
                        <View style={[styles.modalBox, { padding: 20, width: '90%' }]}>
                            <Ionicons name="time" size={64} color="#f59e0b" style={{ marginBottom: 10 }} />
                            <Text style={[styles.modalTitle, { fontSize: 28, marginBottom: 10, color: '#f59e0b' }]}>SÜRENİZ BİTTİ!</Text>
                            <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>Zinciri tamamlamak için son bir şansa ihtiyacın var mı? Ekstra 30 saniye alabilirsin.</Text>

                            <TouchableOpacity style={[styles.storeCard, { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' }]} onPress={() => {
                                alert("Reklam izleniyor... (Simülasyon)\n+30 Saniye Kazandınız!");
                                setExtraTimeModalVisible(false);
                                setTimeLeft(30);
                                setInProgress(true);
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="play-circle" size={24} color="#f59e0b" style={{ marginRight: 10 }} />
                                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Reklam İzle</Text>
                                </View>
                                <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '900' }}>+30 Süre</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.storeCard, { opacity: (isUnlimited || lives >= 1) ? 1 : 0.5 }]}
                                disabled={!isUnlimited && lives < 1}
                                onPress={() => {
                                    if (!isUnlimited) setLives(l => l - 1);
                                    setExtraTimeModalVisible(false);
                                    setTimeLeft(30);
                                    setInProgress(true);
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="heart" size={24} color="#ef4444" style={{ marginRight: 10 }} />
                                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>1 Can Kullan</Text>
                                </View>
                                <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '900' }}>+30 Süre</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={{ marginTop: 20, padding: 10 }} onPress={() => { setExtraTimeModalVisible(false); endGame(false); }}>
                                <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Hayır, Oyunu Bitir</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Modal>

                {/* Reklam (Simülasyon) Modalı */}
                <Modal visible={showAd} animationType="fade" transparent>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity style={{ position: 'absolute', top: 60, right: 30, padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }} onPress={() => setShowAd(false)}>
                            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Geç (X)</Text>
                        </TouchableOpacity>
                        <Ionicons name="play-circle" size={120} color="#a855f7" />
                        <Text style={{ color: '#fff', fontSize: 32, fontWeight: '900', marginTop: 20 }}>REKLAM</Text>
                        <Text style={{ color: '#94a3b8', fontSize: 16, marginTop: 10 }}>(Simülasyon)</Text>
                    </View>
                </Modal>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 30 : 0 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    glassPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    timerText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 6 },
    mainTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 4, textShadowColor: '#a855f7', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
    actionBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },

    scoreContainer: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    playerTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    activePlayerTab: { borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.2)' },
    playerName: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
    playerScore: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 2 },
    activePlayerText: { color: '#fff' },

    scrollContent: { padding: 20, paddingBottom: 60 },
    glassCard: { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
    preTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
    bigWord: { color: '#fff', fontSize: 42, fontWeight: '900', textAlign: 'center', letterSpacing: 2, textShadowColor: 'rgba(255,255,255,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
    divider: { height: 1, marginVertical: 20, borderRadius: 1 },
    hintWord: { color: '#38bdf8', fontSize: 32, letterSpacing: 6, textAlign: 'center', fontWeight: '700', marginBottom: 20 },

    letterBtnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.4)', backgroundColor: 'rgba(56, 189, 248, 0.1)', marginBottom: 20 },
    letterBtnText: { color: '#38bdf8', fontWeight: '700', fontSize: 15, marginLeft: 8 },

    inputGlass: { backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff', fontSize: 18, fontWeight: '600', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', textAlign: 'center' },
    feedbackText: { textAlign: 'center', marginTop: 12, fontSize: 16, fontWeight: '700' },

    chainTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 15 },
    chainTitle: { color: '#e2e8f0', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
    chainContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chainBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    chainBubbleText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    emptyText: { color: '#64748b', fontStyle: 'italic', fontSize: 15 },

    modalBg: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalBox: { width: '100%', backgroundColor: 'rgba(15, 23, 42, 0.95)', padding: 30, borderRadius: 30, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOpacity: 1, shadowRadius: 30 },
    modalTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 20 },
    modalInput: { width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: 16, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
    infoText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
    bigNeonBtn: { paddingVertical: 18, paddingHorizontal: 20, borderRadius: 20, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    bigNeonText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
    resultText: { color: '#e2e8f0', fontSize: 18, textAlign: 'center', lineHeight: 28, marginVertical: 15, fontWeight: '600' },
    nextTurnText: { color: '#a855f7', fontSize: 16, fontWeight: '700', marginBottom: 25 },

    mapHeader: { alignItems: 'center', marginVertical: 20 },
    mapHeaderTitle: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 6, textShadowColor: 'rgba(56, 189, 248, 0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
    mapHeaderSub: { color: '#94a3b8', fontSize: 14, fontWeight: '700', letterSpacing: 2, marginTop: 5 },
    mapScroll: { paddingVertical: 50, alignItems: 'center' },
    centerSpine: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, marginLeft: -1, opacity: 0.5 },

    levelRow: { flexDirection: 'row', width: '100%', height: 120, alignItems: 'center' },
    levelSide: { flex: 1, justifyContent: 'center' },
    nodeContainer: { width: 80, alignItems: 'center', justifyContent: 'center' },
    nodeAura: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(56, 189, 248, 0.3)', zIndex: -1 },
    nodeCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
    nodeCircleCurrent: { width: 70, height: 70, borderRadius: 35, borderColor: 'rgba(255,255,255,0.8)', shadowColor: '#38bdf8', shadowOpacity: 0.8, shadowRadius: 20 },

    levelInfoBox: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', minWidth: 120 },
    levelInfoTitle: { color: '#f8fafc', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
    levelInfoStatus: { color: '#a855f7', fontSize: 11, fontWeight: '600', marginTop: 4, letterSpacing: 0.5 },

    menuBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } },
    menuBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },

    widgetGrid: { width: '85%', gap: 16 },
    widgetRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
    widgetHalf: { flex: 1, aspectRatio: 1 }, // Kare olması için
    widgetFull: { width: '100%', height: 130 },
    widgetBox: { flex: 1, borderRadius: 28, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 6 } },
    widgetTitleSm: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    widgetSubSm: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', marginTop: 4 },
    widgetTitleLg: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
    widgetSubLg: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18, fontWeight: '500' },

    storeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }
});
