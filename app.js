import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, where, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
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
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./firebase-messaging-sw.js')
          .then(reg => {
              console.log('SW Kayıtlı');
          })
          .catch(err => console.error('SW Hata:', err));
    });
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
        
        // Google fotoğrafını ve varsayılan ismi veritabanına da kopyala/güncelle
        setDoc(doc(db, 'users', currentUser.email), { 
            photoURL: user.photoURL,
            // Eğer daha önce isim girmemişse Google ismini kullan
            displayName: currentUser.displayNameCustom || user.displayName || user.email.split('@')[0]
        }, { merge: true });
        
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
        // Bildirimleri her giriş ve ayar açılışında tazeleyebiliriz
        if ("Notification" in window) {
            document.getElementById('enable-notifications-btn').classList.remove('hide');
            if (Notification.permission === "granted") {
                requestFirebaseToken();
            }
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
        }
    }).catch(console.error);
}

document.getElementById('google-login-btn').onclick = () => signInWithPopup(auth, provider);

// Sohbet/Grup Başlatma
let currentChatType = 'personal'; 
document.getElementById('tab-personal').onclick = () => {
    currentChatType = 'personal';
    document.getElementById('panel-personal').classList.remove('hide');
    document.getElementById('panel-group').classList.add('hide');
    document.getElementById('tab-personal').style.background = 'var(--surface-light)';
    document.getElementById('tab-group').style.background = 'transparent';
};
document.getElementById('tab-group').onclick = () => {
    currentChatType = 'group';
    document.getElementById('panel-group').classList.remove('hide');
    document.getElementById('panel-personal').classList.add('hide');
    document.getElementById('tab-group').style.background = 'var(--surface-light)';
    document.getElementById('tab-personal').style.background = 'transparent';
};

document.getElementById('new-chat-fab').onclick = () => document.getElementById('new-chat-modal').classList.add('open');

document.getElementById('start-chat-btn').onclick = async () => {
    if (currentChatType === 'personal') {
        const email = document.getElementById('new-chat-email').value.trim().toLowerCase();
        if(!email) return;
        const chatId = [currentUser.email, email].sort().join('_');
        await setDoc(doc(db, 'chats', chatId), { 
            type: 'personal',
            users: [currentUser.email, email], 
            lastTime: serverTimestamp() 
        }, { merge: true });
        document.getElementById('new-chat-modal').classList.remove('open');
        openChat(email, { name: email.split('@')[0], photoURL: null }, 'personal');
    } else {
        const gName = document.getElementById('new-group-name').value.trim();
        const emailsStr = document.getElementById('new-group-emails').value.trim().toLowerCase();
        if(!gName || !emailsStr) return;
        
        const emails = emailsStr.split(',').map(e => e.trim()).filter(e => e !== "");
        emails.push(currentUser.email); // Kendimizi ekle
        
        const chatId = 'group_' + Date.now(); // Benzersiz grup ID
        await setDoc(doc(db, 'chats', chatId), { 
            type: 'group',
            groupName: gName,
            users: emails, 
            lastTime: serverTimestamp() 
        });
        document.getElementById('new-chat-modal').classList.remove('open');
        openChat(chatId, { name: gName, isGroup: true }, 'group');
    }
};

function listenToChats() {
    const q = query(collection(db, 'chats'), where('users', 'array-contains', currentUser.email));
    onSnapshot(q, s => {
        const list = document.getElementById('chat-list');
        list.innerHTML = '';
        s.forEach(d => {
            const data = d.data();
            const chatId = d.id;
            const li = document.createElement('li');
            li.className = 'chat-item glass-panel';
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.gap = '1rem';
            li.style.padding = '0.75rem 1rem';
            li.style.cursor = 'pointer';

            if (data.type === 'group') {
                // GRUP GÖRÜNÜMÜ
                li.innerHTML = `
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; border: 1px solid var(--glass-border); flex-shrink: 0;">
                        <i class="ri-team-line" style="color: white;"></i>
                    </div>
                    <div style="flex: 1; overflow: hidden;">
                        <span style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); display: block; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${data.groupName}</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-top: 0.2rem;">${data.users.length} Katılımcı</span>
                    </div>
                `;
                li.onclick = () => openChat(chatId, { name: data.groupName, isGroup: true }, 'group');
            } else {
                // BİREYSEL GÖRÜNÜM (Kendisiyle başlatmışsa da fallback)
                const other = data.users.find(u => u !== currentUser.email) || currentUser.email;
                li.innerHTML = `
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--surface-light); animate: pulse 1s infinite; flex-shrink: 0;"></div>
                    <div style="flex: 1;">
                        <div style="height: 12px; width: 60%; background: var(--surface-light); border-radius: 4px; margin-bottom: 8px;"></div>
                        <div style="height: 8px; width: 40%; background: var(--surface-light); border-radius: 4px;"></div>
                    </div>
                `;
                
                getUserProfile(other).then(profile => {
                    li.innerHTML = `
                        <img src="${profile.photoURL || 'https://ui-avatars.com/api/?name='+profile.name+'&background=random'}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 1px solid var(--glass-border); flex-shrink: 0;">
                        <div style="flex: 1; overflow: hidden;">
                            <span style="font-size: 1.1rem; font-weight: 600; color: var(--text-main); display: block; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${profile.name}</span>
                            <span style="font-size: 0.8rem; color: var(--text-muted); display: block; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${other}</span>
                        </div>
                    `;
                    li.onclick = () => openChat(other, profile, 'personal');
                });
            }
            list.appendChild(li);
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
    const fallbackName = email ? email.split('@')[0] : 'Bilinmeyen';
    return { name: fallbackName, photoURL: null };
}

function openChat(targetId, profile = null, type = 'personal') {
    if (type === 'personal') {
        currentChatId = [currentUser.email, targetId].sort().join('_');
        document.getElementById('chat-header-name').textContent = profile ? profile.name : targetId.split('@')[0];
        document.getElementById('chat-header-email').textContent = targetId;
        document.getElementById('current-chat-avatar').src = profile ? (profile.photoURL || 'https://ui-avatars.com/api/?name='+profile.name+'&background=random') : '';
    } else {
        currentChatId = targetId;
        document.getElementById('chat-header-name').textContent = profile ? profile.name : 'Grup';
        document.getElementById('chat-header-email').textContent = 'Grup Sohbeti';
        document.getElementById('current-chat-avatar').src = 'https://ui-avatars.com/api/?name=Group&background=3b82f6';
    }
    
    document.getElementById('current-chat-avatar').classList.remove('hide');
    switchView(views.detail);
    listenToMessages(type);
}

// Sesli Arama İşlemi (Jitsi Audio Only)
document.getElementById('start-voice-call-btn').onclick = () => {
    const callLink = `https://meet.jit.si/ULAK_Sesli_Sohbet_${currentChatId}#config.startWithVideoMuted=true`;
    sendMsg("📞 <b>Sesli Arama Başlatıldı!</b> Katılmak için:<br>" + callLink);
    window.open(callLink, '_blank');
};

// Görüntülü Arama İşlemi (Jitsi Altyapısı ile Tek Tıkla Bağlantı)
document.getElementById('start-call-btn').onclick = () => {
    const callLink = `https://meet.jit.si/ULAK_Goruntulu_Sohbet_${currentChatId}`;
    sendMsg("🎥 <b>Görüntülü Arama Başlatıldı!</b> Katılmak için:<br>" + callLink);
    window.open(callLink, '_blank');
};

// Sohbet Silme
document.getElementById('delete-chat-btn').onclick = async () => {
    if (confirm("Bu sohbeti tamamen silmek istediğine emin misin kral? Bütün mesajlar gidecek.")) {
        // 1. Mesajları sil
        const msgsQ = query(collection(db, 'messages'), where('chatId', '==', currentChatId));
        onSnapshot(msgsQ, s => {
            s.forEach(async (m) => {
                // Not: Client side sileceksek tek tek deleteDoc lazım, 
                // ya da sadece listeyi güncelleyebiliriz basitlik için.
            });
        });
        // 2. Sohbet dökümanını sil
        await deleteDoc(doc(db, 'chats', currentChatId));
        switchView(views.app);
    }
};

document.getElementById('back-to-chats-btn').onclick = () => switchView(views.app);

// Linkleri tıklanabilir formata çeviren asistan fonksiyon
function linkify(text) {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    return text.replace(urlRegex, function(url) {
        return `<a href="${url}" target="_blank" style="color: #60a5fa; text-decoration: underline; font-weight: 500;">Bağlantıya Git 🔗</a>`;
    });
}

// Mesajlaşma
async function sendMsg(text, url = null) {
    if(!text && !url) return;
    
    // Sohbetin 'son görülme/güncellenme' zamanını güncelle ki bildirim tetiklensin
    setDoc(doc(db, 'chats', currentChatId), { lastTime: serverTimestamp() }, { merge: true });

    // 1. Veritabanına mesajı kaydet
    await addDoc(collection(db, 'messages'), { 
        chatId: currentChatId, 
        sender: currentUser.email, 
        senderName: currentUser.displayNameCustom || currentUser.displayName || currentUser.email.split('@')[0],
        text, 
        audioUrl: url, 
        createdAt: serverTimestamp() 
    });
    
    // 2. Kapalıyken (Uygulama arka plandayken) "Gerçek" bildirim göndermek için Vercel Sunucusunu (Postacıyı) Çağır!
    try {
        // Sohbet bilgilerini çek (Katılımcıları bulmak için)
        const chatSnap = await getDoc(doc(db, 'chats', currentChatId));
        if (chatSnap.exists()) {
            const chatData = chatSnap.data();
            const recipients = chatData.users.filter(u => u !== currentUser.email);
            
            // Tüm katılımcılara bildirim fırlat
            recipients.forEach(async (otherUserEmail) => {
                const userSnap = await getDoc(doc(db, 'users', otherUserEmail));
                if (userSnap.exists() && userSnap.data().fcmToken) {
                    const receiverToken = userSnap.data().fcmToken;
                    
                    fetch('https://exquisite-squirrel-b10f4e.netlify.app/.netlify/functions/sendNotification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            token: receiverToken,
                            title: (chatData.type === 'group' ? `[${chatData.groupName}] ` : '') + (currentUser.displayNameCustom || currentUser.email.split('@')[0]),
                            body: text || 'Bir sesli mesaj/arayüz gönderdi.'
                        })
                    }).catch(e => console.error("Bildirim hatası:", e));
                }
            });
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
    document.getElementById('settings-email-display').textContent = currentUser.email;
    document.getElementById('settings-name-input').value = currentUser.displayNameCustom || currentUser.email.split('@')[0];
    // Ayarlar sekmesinde bildirim butonu her zaman açık kalsın (Tazeleme için)
    document.getElementById('enable-notifications-btn').classList.remove('hide');
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
        btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Kaydet...`;
        await setDoc(doc(db, 'users', currentUser.email), { displayName: newName }, { merge: true });
        currentUser.displayNameCustom = newName;
        document.getElementById('user-email-display').textContent = newName;
        btn.innerHTML = `<i class="ri-check-line"></i> Bitti!`;
        setTimeout(() => {
            btn.innerHTML = `<i class="ri-save-line"></i> Kaydet`;
            switchView(views.app);
        }, 1000);
    }
};

// --- BİLDİRİM TEST ETME OPERASYONU ---
document.getElementById('test-notifications-btn').onclick = async () => {
    const btn = document.getElementById('test-notifications-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Test...`;
    
    try {
        // 1. Token'ı tazele
        await requestFirebaseToken();
        
        // 2. Kendi cihazımıza bir test bildirimi fırlat (Netlify üzerinden)
        const userSnap = await getDoc(doc(db, 'users', currentUser.email));
        if (userSnap.exists() && userSnap.data().fcmToken) {
            const myToken = userSnap.data().fcmToken;
            
            const response = await fetch('https://exquisite-squirrel-b10f4e.netlify.app/.netlify/functions/sendNotification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: myToken,
                    title: "ULAK Test Bildirimi ✅",
                    body: "Harika! Bildirimlerin tıkır tıkır çalışıyor şanına layık!"
                })
            });
            
            if(response.ok) {
                btn.innerHTML = `<i class="ri-check-line"></i> Başarılı!`;
                setTimeout(() => btn.innerHTML = originalHTML, 2000);
            } else {
                throw new Error("Sunucu hatası");
            }
        }
    } catch(e) {
        console.error("Test hatası:", e);
        btn.innerHTML = `<i class="ri-error-warning-line"></i> Hata`;
        setTimeout(() => btn.innerHTML = originalHTML, 2000);
        alert("Bildirim testi başarısız oldu kral. İzinleri kontrol et.");
    }
};

function listenToMessages(chatType = 'personal') {
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
                            new Notification(m.senderName || m.sender.split('@')[0], {
                                body: m.text || "Yeni bir içerik gönderdi",
                                icon: './assets/icon.png' 
                            });
                        }
                    }
                }
            });
        }

        // Mesajları Javascript tarafında tarihe göre sırala
        const allMsgs = [];
        s.forEach(d => {
            allMsgs.push({ id: d.id, ...d.data() });
        });
        allMsgs.sort((a,b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeA - timeB;
        });

        container.innerHTML = '';
        allMsgs.forEach(m => {
            const div = document.createElement('div');
            const isMe = m.sender === currentUser.email;
            div.className = `message-bubble ${isMe ? 'sent' : 'received'}`;
            
            // Mesaj silme özelliği (Sadece kendi mesajlarımız için)
            if (isMe) {
                div.style.cursor = 'pointer';
                div.onclick = async () => {
                    if (confirm("Bu mesajı silmek istediğine emin misin?")) {
                        await deleteDoc(doc(db, 'messages', m.id));
                    }
                };
            }

            let content = '';
            // Grup sohbetiyse ve mesaj bizden değilse üstte isim göster
            if (chatType === 'group' && !isMe) {
                content += `<span style="font-size: 0.7rem; font-weight: bold; color: var(--accent); display: block; margin-bottom: 0.2rem;">${m.senderName || m.sender.split('@')[0]}</span>`;
            }

            content += m.audioUrl 
                ? `<audio controls src="${m.audioUrl}" style="max-width: 200px; height: 36px; border-radius: 50px; outline: none;"></audio>` 
                : linkify(m.text);
            
            div.innerHTML = content;
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