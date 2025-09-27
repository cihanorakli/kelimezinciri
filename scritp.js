// Kelime Zinciri - Oyun Mantığı (Tamlamalı sürüm, çoklu grup)

// Kullanıcıdan gelen gruplar: Her grup bir başlangıç kelimesi (start) ve
// ardışık tamlamalar (phrase) ile bu tamlamalardan çıkan kökler (root) içerir.
const GROUPS = [
  {
    start: "DENİZ",
    steps: [
      { phrase: "KIZI", root: "KIZ" },
      { phrase: "TAVLASI", root: "TAVLA" },
      { phrase: "OYUNU", root: "OYUN" },
      { phrase: "KARTI", root: "KART" },
      { phrase: "KOLEKSİYONU", root: null }
    ]
  },
  {
    start: "YAZ",
    steps: [
      { phrase: "TATİLİ", root: "TATİL" },
      { phrase: "KÖYÜ", root: "KÖY" },
      { phrase: "EVİ", root: "EV" },
      { phrase: "ANAHTARI", root: "ANAHTAR" },
      { phrase: "KİLİDİ", root: null }
    ]
  },
  {
    start: "BİLGİSAYAR",
    steps: [
      { phrase: "MÜHENDİSİ", root: "MÜHENDİS" },
      { phrase: "ODASI", root: "ODA" },
      { phrase: "KAPISI", root: "KAPI" },
      { phrase: "KOLU", root: "KOL" },
      { phrase: "ÇANTASI", root: null }
    ]
  },
  {
    start: "PİZZA",
    steps: [
      { phrase: "DİLİMİ", root: "DİLİM" },
      { phrase: "EKMEK", root: "EKMEK" },
      { phrase: "FIRINI", root: "FIRIN" },
      { phrase: "TEPSİSİ", root: "TEPSİ" },
      { phrase: "YEMEĞİ", root: null }
    ]
  },
  {
    start: "ÇOCUK",
    steps: [
      { phrase: "PARKI", root: "PARK" },
      { phrase: "ALANI", root: "ALAN" },
      { phrase: "HESABI", root: "HESAP" },
      { phrase: "MAKİNESİ", root: "MAKİNE" },
      { phrase: "PARÇASI", root: null }
    ]
  },
  {
    start: "TREN",
    steps: [
      { phrase: "İSTASYONU", root: "İSTASYON" },
      { phrase: "GİRİŞİ", root: "GİRİŞ" },
      { phrase: "KARTI", root: "KART" },
      { phrase: "NUMARASI", root: "NUMARA" },
      { phrase: "LİSTESİ", root: null }
    ]
  },
  {
    start: "AYAKKABI",
    steps: [
      { phrase: "DÜKKANI", root: "DÜKKAN" },
      { phrase: "VİTRİNİ", root: "VİTRİN" },
      { phrase: "CAMI", root: "CAM" },
      { phrase: "TEMİZLİĞİ", root: "TEMİZLİK" },
      { phrase: "BEZİ", root: null }
    ]
  },
  {
    start: "GÜL",
    steps: [
      { phrase: "KOKUSU", root: "KOKU" },
      { phrase: "ŞİŞESİ", root: "ŞİŞE" },
      { phrase: "ETİKETİ", root: "ETİKET" },
      { phrase: "FİYATI", root: "FİYAT" },
      { phrase: "LİSTESİ", root: null }
    ]
  },
  {
    start: "KARANLIK",
    steps: [
      { phrase: "GECE", root: "GECE" },
      { phrase: "YARISI", root: "YARI" },
      { phrase: "FİNAL", root: "FİNAL" },
      { phrase: "SAHNESİ", root: "SAHNE" },
      { phrase: "IŞIĞI", root: null }
    ]
  },
  {
    start: "KÖY",
    steps: [
      { phrase: "OKULU", root: "OKUL" },
      { phrase: "MÜDÜRÜ", root: "MÜDÜR" },
      { phrase: "ODASI", root: "ODA" },
      { phrase: "PENCERESİ", root: "PENCERE" },
      { phrase: "CAMI", root: null }
    ]
  },
  {
    start: "DENİZ",
    steps: [
      { phrase: "YILDIZI", root: "YILDIZ" },
      { phrase: "TAKIMI", root: "TAKIM" },
      { phrase: "ELBİSE", root: "ELBİSE" },
      { phrase: "DOLABI", root: "DOLAP" },
      { phrase: "KAPAĞI", root: null }
    ]
  },
  {
    start: "KÖMÜR",
    steps: [
      { phrase: "MADENİ", root: "MADEN" },
      { phrase: "OCAĞI", root: "OCAK" },
      { phrase: "AYI", root: "AY" },
      { phrase: "TAKVİMİ", root: "TAKVİM" },
      { phrase: "YAPRAĞI", root: null }
    ]
  },
  {
    start: "ÇİLEK",
    steps: [
      { phrase: "BAHÇESİ", root: "BAHÇE" },
      { phrase: "KAPISI", root: "KAPI" },
      { phrase: "KOLU", root: "KOL" },
      { phrase: "SAATİ", root: "SAAT" },
      { phrase: "KULESİ", root: null }
    ]
  },
  {
    start: "UZAY",
    steps: [
      { phrase: "GEMİSİ", root: "GEMİ" },
      { phrase: "TAYFASI", root: "TAYFA" },
      { phrase: "ODASI", root: "ODA" },
      { phrase: "KAPISI", root: "KAPI" },
      { phrase: "ZİLİ", root: null }
    ]
  },
  {
    start: "EKMEK",
    steps: [
      { phrase: "FIRINI", root: "FIRIN" },
      { phrase: "TEPSİSİ", root: "TEPSİ" },
      { phrase: "YEMEĞİ", root: "YEMEK" },
      { phrase: "TARİFİ", root: "TARİF" },
      { phrase: "DEFTERİ", root: null }
    ]
  },
  {
    start: "FUTBOL",
    steps: [
      { phrase: "TOPU", root: "TOP" },
      { phrase: "SAHASI", root: "SAHA" },
      { phrase: "ÇİZGİSİ", root: "ÇİZGİ" },
      { phrase: "FİLM", root: "FİLM" },
      { phrase: "AFİŞİ", root: null }
    ]
  },
  {
    start: "KAHVALTI",
    steps: [
      { phrase: "MASASI", root: "MASA" },
      { phrase: "LAMBASI", root: "LAMBA" },
      { phrase: "IŞIĞI", root: "IŞIK" },
      { phrase: "HIZI", root: "HIZ" },
      { phrase: "TESTİ", root: null }
    ]
  },
  {
    start: "YATAK",
    steps: [
      { phrase: "ODASI", root: "ODA" },
      { phrase: "KAPISI", root: "KAPI" },
      { phrase: "ZİLİ", root: "ZİL" },
      { phrase: "SESİ", root: "SES" },
      { phrase: "KAYDI", root: null }
    ]
  },
  {
    start: "CEP",
    steps: [
      { phrase: "TELEFONU", root: "TELEFON" },
      { phrase: "KULÜBESİ", root: "KULÜBE" },
      { phrase: "ÇATISI", root: "ÇATI" },
      { phrase: "KATI", root: "KAT" },
      { phrase: "ARASI", root: null }
    ]
  },
  {
    start: "OKUL",
    steps: [
      { phrase: "TAHTASI", root: "TAHTA" },
      { phrase: "KALEMİ", root: "KALEM" },
      { phrase: "UCU", root: "UÇ" },
      { phrase: "NOKTASI", root: "NOKTA" },
      { phrase: "ATIŞI", root: null }
    ]
  },
  {
    start: "TELEVİZYON",
    steps: [
      { phrase: "KUMANDASI", root: "KUMANDA" },
      { phrase: "TUŞU", root: "TUŞ" },
      { phrase: "TAKIMI", root: "TAKIM" },
      { phrase: "ELBİSE", root: "ELBİSE" },
      { phrase: "DOLABI", root: null }
    ]
  },
  {
    start: "BİSİKLET",
    steps: [
      { phrase: "ZİLİ", root: "ZİL" },
      { phrase: "SESİ", root: "SES" },
      { phrase: "CİHAZI", root: "CİHAZ" },
      { phrase: "KUTUSU", root: "KUTU" },
      { phrase: "KAPAĞI", root: null }
    ]
  }
];

// Grupları tekrar etmeden seçmek için deste (shuffle without replacement)
let groupDeck = [];
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function refillGroupDeck() {
  groupDeck = Array.from({ length: GROUPS.length }, (_, i) => i);
  shuffle(groupDeck);
}
function drawNextGroup() {
  if (!groupDeck || groupDeck.length === 0) refillGroupDeck();
  const idx = groupDeck.pop();
  return GROUPS[idx];
}

// DOM referansları
const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const currentWordEl = document.getElementById('currentWord');
const hintEl = document.getElementById('hint');
const guessInput = document.getElementById('guessInput');
const feedbackEl = document.getElementById('feedback');
const chainListEl = document.getElementById('chainList');
const resultEl = document.getElementById('result');
const scoreBoardEl = document.getElementById('scoreBoard');
// Multiplayer elements
const currentPlayerEl = document.getElementById('currentPlayer');
const setupModal = document.getElementById('setupModal');
const playerCountInput = document.getElementById('playerCount');
const playerNamesWrap = document.getElementById('playerNames');
const setupCancelBtn = document.getElementById('setupCancel');
const setupConfirmBtn = document.getElementById('setupConfirm');
// Next player modal
const nextModal = document.getElementById('nextModal');
const nextPlayerNameEl = document.getElementById('nextPlayerName');
const nextStartBtn = document.getElementById('nextStartBtn');
// Podium modal
const podiumModal = document.getElementById('podiumModal');
const podiumCloseBtn = document.getElementById('podiumCloseBtn');
const podium1Name = document.getElementById('podium1Name');
const podium1Score = document.getElementById('podium1Score');
const podium2Name = document.getElementById('podium2Name');
const podium2Score = document.getElementById('podium2Score');
const podium3Name = document.getElementById('podium3Name');
const podium3Score = document.getElementById('podium3Score');
const podiumOthers = document.getElementById('podiumOthers');
// Harf iste butonu
const askLetterBtn = document.getElementById('askLetterBtn');

// Oyun durumu
let timeLeft = 60;
let timerId = null;
let stepIndex = 0; // seçilen grup içinde konum
let inProgress = false;
let currentGroup = null; // { start, steps }
// Multiplayer state
let players = []; // [{ name: string, score: number }]
let currentTurn = 0; // aktif oyuncu indexi
// İpucu ilerletme durumu (her adım için)
let revealCount = 1; // kaç karakter açıldı (boşluk ve '-' hariç)

function toTRUpper(s) {
  return s.toLocaleUpperCase('tr-TR');
}

function normalizeAnswer(s) {
  return toTRUpper(s.trim().replace(/\s+/g, ' '));
}

function makeDotsHintFromWord(word) {
  if (!word) return '';
  const up = toTRUpper(word);
  if (up.length === 0) return '';
  return up[0] + ('.'.repeat(Math.max(0, up.length - 1)));
}

// Tam kontrol: belirtilen sayıda karakteri (boşluk ve '-' hariç) baştan itibaren aç
function makeProgressiveHint(word, count) {
  if (!word) return '';
  const up = toTRUpper(word);
  let opened = 0;
  let out = '';
  for (const ch of up) {
    if (ch === ' ' || ch === '-') { out += ch; continue; }
    if (opened < count) { out += ch; opened++; } else { out += '.'; }
  }
  return out;
}

function maxRevealable(word) {
  if (!word) return 0;
  const up = toTRUpper(word);
  let cnt = 0;
  for (const ch of up) { if (ch !== ' ' && ch !== '-') cnt++; }
  return cnt;
}

function resetUI() {
  chainListEl.innerHTML = '';
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  resultEl.textContent = '';
  currentWordEl.textContent = '—';
  hintEl.textContent = '—';
  guessInput.value = '';
  updateScoreBoard();
  updateTurnLabel();
}

function updateScoreBoard() {
  if (!scoreBoardEl) return;
  if (players.length === 0) {
    scoreBoardEl.textContent = 'Skor: 0';
    return;
  }
  // Çok oyunculu: her oyuncunun skorunu göster, aktif oyuncuyu vurgula
  scoreBoardEl.innerHTML = players
    .map((p, idx) => {
      const mark = idx === currentTurn ? '➡️ ' : '';
      return `${mark}${p.name}: ${p.score}`;
    })
    .join(' \u2022 ');
}

function updateTurnLabel() {
  if (!currentPlayerEl) return;
  if (players.length > 0) {
    currentPlayerEl.textContent = players[currentTurn].name;
  } else {
    currentPlayerEl.textContent = '—';
  }
}

function openSetupModal() {
  if (!setupModal) return;
  setupModal.classList.remove('hidden');
  renderNameInputs();
}

function closeSetupModal() {
  if (!setupModal) return;
  setupModal.classList.add('hidden');
}

function renderNameInputs() {
  if (!playerNamesWrap || !playerCountInput) return;
  const n = Math.max(1, Math.min(8, parseInt(playerCountInput.value || '1', 10)));
  playerNamesWrap.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Oyuncu ${i + 1} adı`;
    input.value = players[i]?.name || `Oyuncu ${i + 1}`;
    input.dataset.index = String(i);
    playerNamesWrap.appendChild(input);
  }
}

function commitPlayersFromInputs() {
  if (!playerNamesWrap) return false;
  const inputs = Array.from(playerNamesWrap.querySelectorAll('input'));
  const newPlayers = inputs.map((inp, i) => ({ name: (inp.value || `Oyuncu ${i + 1}`).trim(), score: 0 }));
  players = newPlayers;
  currentTurn = 0;
  updateScoreBoard();
  updateTurnLabel();
  return true;
}

function startTimer() {
  timeLeft = 60;
  timerEl.textContent = String(timeLeft);
  timerId = setInterval(() => {
    timeLeft -= 1;
    timerEl.textContent = String(Math.max(0, timeLeft));
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function setHintForCurrentStep() {
  const step = currentGroup.steps[stepIndex];
  // Kök (root) varsa onun ilk harfi + noktalar; yoksa son adımda tamlamanın (phrase) ilk harfi + noktalar
  const hintWord = step.root || step.phrase;
  // ipucu, açılan harf sayısına göre
  revealCount = Math.max(1, revealCount);
  hintEl.textContent = hintWord ? makeProgressiveHint(hintWord, revealCount) : '';
  // buton durumunu ayarla
  const maxOpen = maxRevealable(hintWord || '');
  if (askLetterBtn) {
    askLetterBtn.disabled = !inProgress || revealCount >= maxOpen;
  }
}

function startRoundForCurrentPlayer() {
  // yeni grup seç (tekrar etmeden deste mantığıyla)
  currentGroup = drawNextGroup();
  // adımı sıfırla ve UI hazırla
  stepIndex = 0;
  resetUI();
  updateTurnLabel();
  // ipucu sayacını sıfırla ve butonu etkinleştir
  revealCount = 1;
  if (askLetterBtn) askLetterBtn.disabled = false;

  // ilk kelimeyi göster
  currentWordEl.textContent = currentGroup.start;

  // input aktif
  guessInput.disabled = false;
  guessInput.focus();

  // ipucu
  setHintForCurrentStep();

  // sayaç başlat (her oyuncu için 60 sn)
  stopTimer();
  startTimer();
}

function startGame() {
  if (inProgress) return;
  inProgress = true;
  startBtn.disabled = true;

  // durumları sıfırla
  stepIndex = 0;
  resetUI();
  // skorları sıfırla (mevcut oyuncuları koru)
  players = players.map(p => ({ ...p, score: 0 }));
  currentTurn = 0;
  updateScoreBoard();
  updateTurnLabel();

  // ilk oyuncu için turu başlat
  startRoundForCurrentPlayer();
}

function endGame(completed = false) {
  stopTimer();
  inProgress = false;
  startBtn.disabled = false;
  guessInput.disabled = true;
  if (askLetterBtn) askLetterBtn.disabled = true;

  // +1 puan: kalan her saniye (aktif oyuncuya)
  const active1 = getActivePlayer();
  if (active1 && timeLeft > 0) {
    active1.score += timeLeft;
    console.debug('[scoring] +timeLeft', { player: active1.name, add: timeLeft });
  }
  // +20 bonus: zinciri tamamen bitirdiyse (son doğruyu yapan aktif oyuncuya)
  if (active1 && completed) {
    active1.score += 20;
    console.debug('[scoring] +20 bonus', { player: active1.name });
  }
  updateScoreBoard();

  // zincir uzunluğu: listede görünen ögelerin sayısı
  const chainLen = chainListEl.children.length;
  let message = `Oyun bitti! Zincir uzunluğu: ${chainLen}`;
  if (players.length > 0) {
    const scores = players.map(p => `${p.name}: ${p.score}`).join(' | ');
    message += ` | Skorlar: ${scores}`;
  }
  resultEl.textContent = message;

  // Sıradaki oyuncu varsa modal göster; yoksa tüm oyun biter
  if (players.length > 0) {
    const nextIndex = currentTurn + 1;
    if (nextIndex < players.length) {
      // Show next player modal and wait for user to start
      openNextPlayerModal(players[nextIndex].name);
    } else {
      // tüm oyuncular oynadı
      startBtn.disabled = false; // tekrar oyna için
      showPodium();
    }
  }
}

function handleGuessSubmit() {
  if (!inProgress || !currentGroup) return;
  const val = normalizeAnswer(guessInput.value);
  if (!val) return;

  const step = currentGroup.steps[stepIndex];
  const expected = normalizeAnswer(step.phrase);
  // Uyum için hem sadece ek (suffix) hem de tam tamlamayı (mevcut kelime + ek) kabul et
  const expectedFull = normalizeAnswer(`${currentWordEl.textContent} ${step.phrase}`);

  if (val === expected || val === expectedFull) {
    // doğru tamlama
    feedbackEl.textContent = 'Doğru!';
    feedbackEl.className = 'feedback ok';

    // +5 puan: her doğru tamlama (yalnızca aktif oyuncu)
    const active = getActivePlayer();
    if (active) {
      active.score += 5;
      console.debug('[scoring] +5 phrase', { player: active.name });
      updateScoreBoard();
    }

    // zincire ekle: önce tamlama
    const liPhrase = document.createElement('li');
    liPhrase.textContent = step.phrase;
    chainListEl.appendChild(liPhrase);

    // sonra kök (varsa)
    if (step.root) {
      const liRoot = document.createElement('li');
      liRoot.textContent = step.root;
      chainListEl.appendChild(liRoot);
      // üstte gösterilen kelimeyi kökle güncelle
      currentWordEl.textContent = step.root;
    }

    // ilerle
    stepIndex += 1;
    guessInput.value = '';

    // yeni adım için ipucu sayacını sıfırla
    revealCount = 1;

    if (stepIndex >= currentGroup.steps.length) {
      // adımlar bitti
      hintEl.textContent = 'Bitti!';
      endGame(true);
      return;
    }

    // sıradaki ipucu
    setHintForCurrentStep();
    guessInput.focus();
  } else {
    // yanlış
    feedbackEl.textContent = 'Tekrar dene!';
    feedbackEl.className = 'feedback err';
  }
}

// Etkinlikler
startBtn.addEventListener('click', () => {
  // Oyuncular tanımlı değilse modal aç
  if (!players || players.length === 0) {
    openSetupModal();
    return;
  }
  startGame();
});

guessInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    handleGuessSubmit();
  }
});

guessInput.addEventListener('click', () => guessInput.focus());

// Setup modal eventleri
if (playerCountInput) {
  playerCountInput.addEventListener('input', renderNameInputs);
}
if (setupCancelBtn) {
  setupCancelBtn.addEventListener('click', () => {
    closeSetupModal();
    startBtn.disabled = false;
  });
}
if (setupConfirmBtn) {
  setupConfirmBtn.addEventListener('click', () => {
    commitPlayersFromInputs();
    closeSetupModal();
    startGame();
  });
}

// Next player modal logic
function openNextPlayerModal(name) {
  if (!nextModal) return;
  if (nextPlayerNameEl) nextPlayerNameEl.textContent = name || '—';
  nextModal.classList.remove('hidden');
}
function closeNextPlayerModal() {
  if (!nextModal) return;
  nextModal.classList.add('hidden');
}
if (nextStartBtn) {
  nextStartBtn.addEventListener('click', () => {
    // advance to next player and start their round
    const nextIndex = currentTurn + 1;
    if (players.length > 0 && nextIndex < players.length) {
      currentTurn = nextIndex;
      closeNextPlayerModal();
      inProgress = true;
      startBtn.disabled = true;
      startRoundForCurrentPlayer();
    } else {
      closeNextPlayerModal();
    }
  });
}

function getActivePlayer() {
  if (!Array.isArray(players) || players.length === 0) return null;
  if (typeof currentTurn !== 'number' || currentTurn < 0 || currentTurn >= players.length) return null;
  return players[currentTurn];
}

function showPodium() {
  if (!players || players.length === 0) return;
  const ranking = [...players].sort((a, b) => b.score - a.score);
  const [p1, p2, p3] = [ranking[0], ranking[1], ranking[2]];
  if (p1) { podium1Name.textContent = p1.name; podium1Score.textContent = String(p1.score); }
  if (p2) { podium2Name.textContent = p2.name; podium2Score.textContent = String(p2.score); }
  if (p3) { podium3Name.textContent = p3.name; podium3Score.textContent = String(p3.score); }
  // Others list
  if (podiumOthers) {
    podiumOthers.innerHTML = '';
    for (let i = 3; i < ranking.length; i++) {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<span>${i + 1}. ${ranking[i].name}</span><span>${ranking[i].score}</span>`;
      podiumOthers.appendChild(row);
    }
  }
  if (podiumModal) podiumModal.classList.remove('hidden');
}

if (podiumCloseBtn) {
  podiumCloseBtn.addEventListener('click', () => {
    if (podiumModal) podiumModal.classList.add('hidden');
  });
}

// Harf iste: bir harf daha aç, aktif oyuncudan 2 puan düş
if (askLetterBtn) {
  askLetterBtn.addEventListener('click', () => {
    if (!inProgress || !currentGroup) return;
    const step = currentGroup.steps[stepIndex];
    const hintWord = (step && (step.root || step.phrase)) || '';
    const maxOpen = maxRevealable(hintWord);
    if (revealCount >= maxOpen) {
      askLetterBtn.disabled = true;
      return;
    }
    // skor cezası uygula
    const active = getActivePlayer();
    if (active) {
      active.score -= 2;
      console.debug('[scoring] -2 letter', { player: active.name });
      updateScoreBoard();
    }
    // bir harf daha aç
    revealCount += 1;
    hintEl.textContent = makeProgressiveHint(hintWord, revealCount);
    // buton durumunu güncelle
    askLetterBtn.disabled = revealCount >= maxOpen;
  });
}

// Sayfa ilk geldiğinde UI sakin
resetUI();
