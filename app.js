import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, where, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyB3HwVPpJ2Qz2Su5s7swqf5_55ZrsqzB5E",
  authDomain: "ulak-b4965.firebaseapp.com",
  projectId: "ulak-b4965",
  storageBucket: "ulak-b4965.firebasestorage.app",
  messagingSenderId: "47685919953",
  appId: "1:47685919953:web:889c3dd87924dcf2ad51f0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();
const messaging = getMessaging(app);

// Elementler
const views = { auth: 'auth-view', app: 'app-view', detail: 'chat-detail-view', settings: 'settings-view' };
let currentUser = null;
let currentChatId = null;
const userCache = {}; // E-posta adresine karşılık isimleri tutmak için

// Service Worker (PWA) Kaydı (Ana Ekrana Ekleme için şart)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker başarıyla kaydedildi.', reg.scope))
      .catch(err => console.error('Service Worker kayıt hatası:', err));
}

function switchView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
    document.getElementById(id).classList.add('active-view');
}

// Auth Akışı
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('user-avatar').src = user.photoURL;
        document.getElementById('user-avatar').classList.remove('hide');
        
        // Google fotoğrafını veritabanına da kopyala (Görüntülenebilmesi için)
        setDoc(doc(db, 'users', currentUser.email), { photoURL: user.photoURL }, { merge: true });
        
        // Profil ismini çek
        getDoc(doc(db, 'users', currentUser.email)).then(snap => {
            if(snap.exists() && snap.data().displayName) {
                currentUser.displayNameCustom = snap.data().displayName;
                document.getElementById('user-email-display').textContent = snap.data().displayName;
            } else {
                document.getElementById('user-email-display').textContent = user.email.split('@')[0]; // İsmi yoksa e-postayı kırp
            }
        });
        
        switchView(views.app);
        
        // PWA'larda ve modern tarayıcılarda izinler genellikle KULLANICI TIKLAMASI gerektirir.
        // Bu yüzden sessizce istemek yerine, butonu aktifleştir.
        if ("Notification" in window && Notification.permission !== "granted") {
            document.getElementById('enable-notifications-btn').classList.remove('hide');
        } else if ("Notification" in window && Notification.permission === "granted") {
            // Zaten izin verilmişse token'ı güncelle
            requestFirebaseToken();
        }
        
        listenToChats();
    } else {
        switchView(views.auth);
    }
});

// Bildirim izin ve Token işlemi (Ayrı fonksiyon, tıklamayla da tetiklenebilir)
function requestFirebaseToken() {
    getToken(messaging, { 
        vapidKey: 'BL8e0LxDTtbuiyjv2hxbmWVlYXkUka8KXKVI5loqqNmqSjEtKPYq5Iqwwhf8LDwTZPr9msrL95HG0TAKIDCjinI' 
    }).then((token) => {
        if (token) {
            console.log("Cihaz Token'ı Alındı:", token);
            setDoc(doc(db, 'users', currentUser.email), { fcmToken: token }, { merge: true });
            document.getElementById('enable-notifications-btn').classList.add('hide'); // Butonu gizle
        }
    }).catch(console.error);
}

document.getElementById('google-login-btn').onclick = () => signInWithPopup(auth, provider);

// Sohbet Başlatma
document.getElementById('new-chat-fab').onclick = () => document.getElementById('new-chat-modal').classList.add('open');
document.getElementById('start-chat-btn').onclick = async () => {
    const email = document.getElementById('new-chat-email').value.trim().toLowerCase();
    if(!email) return;
    const chatId = [currentUser.email, email].sort().join('_');
    await setDoc(doc(db, 'chats', chatId), { users: [currentUser.email, email], lastTime: serverTimestamp() }, { merge: true });
    document.getElementById('new-chat-modal').classList.remove('open');
    openChat(email);
};

function listenToChats() {
    const q = query(collection(db, 'chats'), where('users', 'array-contains', currentUser.email));
    onSnapshot(q, s => {
        const list = document.getElementById('chat-list');
        list.innerHTML = '';
        s.forEach(d => {
            const other = d.data().users.find(u => u !== currentUser.email);
            const li = document.createElement('li');
            li.className = 'chat-item glass-panel';
            li.innerHTML = `<span style="padding: 1rem;">Yükleniyor...</span>`;
            li.onclick = () => openChat(other);
            list.appendChild(li);
            
            // İsmi ve resmi arka planda çek ve güncelle
            getUserProfile(other).then(profile => {
                li.style.display = 'flex';
                li.style.alignItems = 'center';
                li.style.gap = '1rem';
                li.style.padding = '0.75rem 1rem';
                li.style.cursor = 'pointer';
                li.innerHTML = `
                    <img src="${profile.photoURL || 'https://ui-avatars.com/api/?name='+profile.name+'&background=random'}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 1px solid var(--glass-border);">
                    <div style="flex: 1; overflow: hidden;">
                        <span style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); display: block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${profile.name}</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-top: 0.2rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${other}</span>
                    </div>
                `;
                li.onclick = () => openChat(other, profile);
            });
        });
    });
}

// E-posta adresinden profil ismini ve resmini getiren fonksiyon
async function getUserProfile(email) {
    if (userCache[email]) return userCache[email];
    try {
        const snap = await getDoc(doc(db, 'users', email));
        if (snap.exists()) {
            const data = snap.data();
            const profile = { name: data.displayName || email.split('@')[0], photoURL: data.photoURL || null };
            userCache[email] = profile;
            return profile;
        }
    } catch(e) { console.error(e); }
    return { name: email.split('@')[0], photoURL: null };
}

function openChat(email, profile = null) {
    currentChatId = [currentUser.email, email].sort().join('_');
    const nameToDisplay = profile ? profile.name : email.split('@')[0];
    const photoToDisplay = profile && profile.photoURL ? profile.photoURL : 'https://ui-avatars.com/api/?name='+nameToDisplay+'&background=random';
    
    document.getElementById('chat-header-name').textContent = nameToDisplay;
    document.getElementById('chat-header-email').textContent = email;
    document.getElementById('current-chat-avatar').src = photoToDisplay;
    document.getElementById('current-chat-avatar').classList.remove('hide');
    
    switchView(views.detail);
    listenToMessages();
}

// Görüntülü Arama İşlemi (Jitsi Altyapısı ile Tek Tıkla Bağlantı)
document.getElementById('start-call-btn').onclick = () => {
    // Sohbet için gizli bir yayın linki oluştur ve mektuba ekle
    const callLink = `https://meet.jit.si/ULAK_Ozel_Sohbet_${currentChatId}`;
    sendMsg("🎥 <b>Görüntülü Arama Başlatıldı!</b><br>Katılmak için aşağıdaki linke tıklayın:<br>" + callLink);
    // Kendi penceresinde aramayı aç
    window.open(callLink, '_blank');
};

document.getElementById('back-to-chats-btn').onclick = () => switchView(views.app);

// Linkleri tıklanabilir formata çeviren asistan fonksiyon
function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    return text.replace(urlRegex, function(url) {
        return `<a href="${url}" target="_blank" style="color: #60a5fa; text-decoration: underline; font-weight: 500;">Bağlantıya Git 🔗</a>`;
    });
}

// Mesajlaşma
async function sendMsg(text, url = null) {
    if(!text && !url) return;
    
    // 1. Veritabanına mesajı kaydet
    await addDoc(collection(db, 'messages'), { chatId: currentChatId, sender: currentUser.email, text, audioUrl: url, createdAt: serverTimestamp() });
    
    // 2. Kapalıyken (Uygulama arka plandayken) "Gerçek" bildirim göndermek için Vercel Sunucusunu (Postacıyı) Çağır!
    try {
        // Karşı tarafın epostasını sohbet idsinden bul
        const otherUserEmail = currentChatId.split('_').find(e => e !== currentUser.email);
        
        // Veritabanından karşı tarafın kayıtlı cihaz kimliğini (Token) çek
        const snap = await getDoc(doc(db, 'users', otherUserEmail));
        if (snap.exists() && snap.data().fcmToken) {
            const receiverToken = snap.data().fcmToken;
            
            // Postacıya bilgileri paketleyip ilet (Netlify Tam URL)
            fetch('https://exquisite-squirrel-b10f4e.netlify.app/.netlify/functions/sendNotification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: receiverToken,
                    title: currentUser.displayNameCustom || currentUser.email.split('@')[0],
                    body: text || 'Sana bir resimli/sesli mesaj gönderdi.'
                })
            }).catch(e => console.error("Postacı çağrısı başarısız:", e));
        }
    } catch(err) {
        console.error("Bildirim gönderme sürecinde hata:", err);
    }
}

document.getElementById('send-btn').onclick = () => {
    const input = document.getElementById('message-input');
    sendMsg(input.value);
    input.value = '';
};

// Bas Konuş (Ses Kaydetme) İşlemleri
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
const micBtn = document.getElementById('mic-btn');
const recordingIndicator = document.getElementById('recording-indicator');

micBtn.onclick = async () => {
    if (!isRecording) {
        // Kaydı Başlat
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const fileName = `audios/${Date.now()}_${currentUser.uid}.webm`;
                const storageRef = ref(storage, fileName);
                
                recordingIndicator.innerHTML = "<i class='ri-loader-4-line ri-spin'></i> Fırlatılıyor...";
                
                try {
                    await uploadBytes(storageRef, audioBlob);
                    const url = await getDownloadURL(storageRef);
                    await sendMsg('', url); // Metin boş, url dolu yolla
                } catch(e) {
                    console.error("Ses yükleme hatası", e);
                }
                
                recordingIndicator.classList.add('hide');
                recordingIndicator.innerHTML = "<i class='ri-record-circle-line pulse-glow'></i> Ses kaydediliyor...";
            };
            
            mediaRecorder.start();
            isRecording = true;
            micBtn.style.color = '#ef4444'; // Mikrofon kırmızı olsun
            micBtn.innerHTML = '<i class="ri-stop-circle-fill pulse-glow"></i>';
            recordingIndicator.classList.remove('hide');
        } catch (err) {
            console.error('Mikrofon izni alınamadı:', err);
            alert("Ses gönderebilmek için mikrofon izni vermeniz şart kral!");
        }
    } else {
        // Kaydı Durdur ve Yolla
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(t => t.stop()); // Kaynağı bırak
        isRecording = false;
        micBtn.style.color = 'var(--text-muted)';
        micBtn.innerHTML = '<i class="ri-mic-fill"></i>';
    }
};

// Ayarlar Sayfası İşlemleri
document.getElementById('open-settings-btn').onclick = () => {
    switchView(views.settings);
    document.getElementById('settings-avatar').src = currentUser.photoURL;
    document.getElementById('settings-name-input').value = currentUser.displayNameCustom || currentUser.email.split('@')[0];
    // Ayarlar sekmesine girince, eğer bildirim kapalıysa butonu tekrar garanti olsun diye göster
    if ("Notification" in window && Notification.permission !== "granted") {
        document.getElementById('enable-notifications-btn').classList.remove('hide');
    }
};

document.getElementById('enable-notifications-btn').onclick = () => {
    if ("Notification" in window) {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                requestFirebaseToken();
                alert("Bildirimler başarıyla aktifleştirildi!");
            } else {
                alert("Bildirim izni reddedildi. Tarayıcı ayarlarınızdan izin vermeniz gerekebilir.");
            }
        });
    }
};

document.getElementById('back-from-settings-btn').onclick = () => switchView(views.app);

document.getElementById('save-settings-btn').onclick = async () => {
    const btn = document.getElementById('save-settings-btn');
    const newName = document.getElementById('settings-name-input').value.trim();
    if (newName) {
        btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Kaydediliyor...`;
        await setDoc(doc(db, 'users', currentUser.email), { displayName: newName }, { merge: true });
        currentUser.displayNameCustom = newName;
        document.getElementById('user-email-display').textContent = newName;
        btn.innerHTML = `<i class="ri-check-line"></i> Kaydedildi!`;
        setTimeout(() => {
            btn.innerHTML = `<i class="ri-save-line"></i> Kaydet`;
            switchView(views.app);
        }, 1000);
    }
};

function listenToMessages() {
    // Firestore composite index hatası almamak için orderBy'ı buradan kaldırdık
    const q = query(collection(db, 'messages'), where('chatId', '==', currentChatId));
    onSnapshot(q, s => {
        const container = document.getElementById('chat-messages');
        
        // Yeni mesaj var mı kontrolü (İlk yüklemede bildirim atmasın diye)
        if (container.childElementCount > 0) {
            s.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const m = change.doc.data();
                    
                    // Mesaj bizden değilse
                    if (m.sender !== currentUser.email) {
                        // Şık ve yumuşak bir Whatsapp tarzı ses çal!
                        const popSound = new Audio('https://actions.google.com/sounds/v1/water/water_drop.ogg');
                        popSound.play().catch(e => console.log('Sessiz mod', e));
                        
                        // Site arka plandaysa görsel sistem bildirimi gönder
                        if (document.hidden && "Notification" in window && Notification.permission === "granted") {
                            new Notification(m.sender.split('@')[0] + " sana yazdı", {
                                body: m.text || "Sesli veya görüntülü arama gönderdi",
                                icon: './assets/icon.png' 
                            });
                        }
                    }
                }
            });
        }

        // Mesajları Javascript tarafında tarihe göre sırala
        const allMsgs = [];
        s.forEach(d => allMsgs.push(d.data()));
        allMsgs.sort((a,b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeA - timeB;
        });

        container.innerHTML = '';
        allMsgs.forEach(m => {
            const div = document.createElement('div');
            div.className = `message-bubble ${m.sender === currentUser.email ? 'sent' : 'received'}`;
            // Ses dosyası varsa ses oynatıcı render et, yoksa text içine link bağlayıcı ekle
            div.innerHTML = m.audioUrl 
                ? `<audio controls src="${m.audioUrl}" style="max-width: 200px; height: 36px; border-radius: 50px; outline: none;"></audio>` 
                : linkify(m.text);
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    });
}

// Modal Kapatma
document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.onclick = () => document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
});
document.getElementById('info-btn').onclick = () => document.getElementById('info-modal').classList.add('open');
document.getElementById('auth-info-btn').onclick = () => document.getElementById('info-modal').classList.add('open');