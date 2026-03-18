import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, where } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

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

// Elementler
const views = { auth: 'auth-view', app: 'app-view', detail: 'chat-detail-view' };
let currentUser = null;
let currentChatId = null;

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
        
        // Kullanıcı e-postasını başlığa yazdır
        document.getElementById('user-email-display').textContent = user.email;
        document.getElementById('user-email-display').classList.remove('hide');
        
        switchView(views.app);
        
        // Uygulama açıldığında tarayıcı bildirim izni iste
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
        
        listenToChats();
    } else {
        switchView(views.auth);
    }
});

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
            li.innerHTML = `<b>${other}</b>`;
            li.onclick = () => openChat(other);
            list.appendChild(li);
        });
    });
}

function openChat(email) {
    currentChatId = [currentUser.email, email].sort().join('_');
    document.getElementById('chat-header-name').textContent = email;
    switchView(views.detail);
    listenToMessages();
}

document.getElementById('back-to-chats-btn').onclick = () => switchView(views.app);

// Mesajlaşma
async function sendMsg(text, url = null) {
    if(!text && !url) return;
    await addDoc(collection(db, 'messages'), { chatId: currentChatId, sender: currentUser.email, text, audioUrl: url, createdAt: serverTimestamp() });
}

document.getElementById('send-btn').onclick = () => {
    const input = document.getElementById('message-input');
    sendMsg(input.value);
    input.value = '';
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
                    // Mesaj bizden değilse ve site arka plandaysa bildirim gönder
                    if (m.sender !== currentUser.email && document.hidden && "Notification" in window && Notification.permission === "granted") {
                        new Notification(m.sender + " sana yazdı", {
                            body: m.text || "Sesli mesaj",
                            icon: './assets/icon.png' // Varsa ikonunu kullanır, yoksa tarayıcı varsayılan
                        });
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
            div.innerHTML = m.audioUrl ? `<audio controls src="${m.audioUrl}"></audio>` : m.text;
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