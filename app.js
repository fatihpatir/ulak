import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3HwVPpJ2Qz2Su5s7swqf5_55ZrsqzB5E",
  authDomain: "ulak-b4965.firebaseapp.com",
  projectId: "ulak-b4965",
  storageBucket: "ulak-b4965.firebasestorage.app",
  messagingSenderId: "47685919953",
  appId: "1:47685919953:web:889c3dd87924dcf2ad51f0",
  measurementId: "G-1LDW0F6FKG"
};

// Uygulamayı başlat (Config boşsa uyarı veriyoruz)
let app, auth, provider, analytics;
try {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
} catch (error) {
    console.warn("Firebase config eksik veya hatalı, lütfen güncelleyin.", error);
}

// DOM Elements
const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');
const googleLoginBtn = document.getElementById('google-login-btn');
const userAvatar = document.getElementById('user-avatar');

// Modal Elements
const infoBtn = document.getElementById('info-btn');
const newChatFab = document.getElementById('new-chat-fab');
const infoModal = document.getElementById('info-modal');
const newChatModal = document.getElementById('new-chat-modal');
const closeBtns = document.querySelectorAll('.close-modal-btn');
const startChatBtn = document.getElementById('start-chat-btn');
const newChatEmail = document.getElementById('new-chat-email');

// UI State Management
function showApp(user) {
    authView.classList.remove('active-view');
    appView.classList.add('active-view');
    
    // Set Avatar if available
    if (user && user.photoURL) {
        userAvatar.src = user.photoURL;
        userAvatar.classList.remove('hide');
        userAvatar.title = user.displayName || user.email;
    }
}

function showAuth() {
    appView.classList.remove('active-view');
    authView.classList.add('active-view');
    userAvatar.classList.add('hide');
    userAvatar.src = "";
}

// Auth State Observer
if (auth) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            console.log("Giriş yapıldı:", user.displayName);
            showApp(user);
        } else {
            // User is signed out
            showAuth();
        }
    });
} else {
    // Fallback UI preview state
    googleLoginBtn.addEventListener('click', () => {
        showApp({ photoURL: 'https://ui-avatars.com/api/?name=Fatih+P&background=3b82f6&color=fff', displayName: "Demo User" });
    });
}

// Google Login Trigger
if (auth && provider) {
    googleLoginBtn.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Giriş hatası:", error);
            alert("Giriş başarısız: " + error.message);
        }
    });
}

// Avatar Click -> Çıkış Yap
userAvatar.addEventListener('click', async () => {
    if (confirm("Çıkış yapmak istiyor musunuz?")) {
        if (auth) {
            await signOut(auth);
        } else {
             showAuth();
        }
    }
});

// Modals Logic
function openModal(modal) {
    modal.classList.add('open');
}

function closeModal(modal) {
    modal.classList.remove('open');
}

infoBtn.addEventListener('click', () => {
    openModal(infoModal);
});

newChatFab.addEventListener('click', () => {
    openModal(newChatModal);
    setTimeout(() => {
        newChatEmail.focus();
    }, 100);
});

closeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // En yakın modal divini bul ondan çıkar
        const parentModal = e.target.closest('.modal-overlay');
        if (parentModal) closeModal(parentModal);
    });
});

// Modal Overlay Click to Close
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal(overlay);
        }
    });
});

// Yeni Sohbet Başlat Butonu Animasyonu ve Mantığı
startChatBtn.addEventListener('click', () => {
    const email = newChatEmail.value.trim();
    if (!email) {
        alert("Lütfen bir e-posta adresi girin.");
        return;
    }
    
    // Eşleşme Mantığı Simülasyonu
    startChatBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Aranıyor...';
    startChatBtn.disabled = true;
    
    setTimeout(() => {
        alert(`"${email}" adresine sahip kullanıcı ile sohbet başlatıldı!`);
        startChatBtn.innerHTML = "Sohbeti Başlat";
        startChatBtn.disabled = false;
        newChatEmail.value = "";
        closeModal(newChatModal);
        
        // Ekrana Sahte Bir Sohbet Kartı Ekle
        addMockChatCard(email);
    }, 1200);
});

// Mock Chat Card Ekleme (Arayüzde Görsellik İçin)
function addMockChatCard(email) {
    const chatList = document.getElementById('chat-list');
    const emptyState = document.querySelector('.empty-state');
    
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    const li = document.createElement('li');
    li.className = 'chat-item glass-panel';
    li.style.margin = "0.5rem 0";
    li.style.padding = "1rem";
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "1rem";
    li.style.cursor = "pointer";
    li.style.transition = "transform 0.2s ease";
    
    const initial = email.charAt(0).toUpperCase();
    
    li.innerHTML = `
        <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">${initial}</div>
        <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 1rem;">${email.split('@')[0]}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">Yeni bir sohbet başlattınız.</div>
        </div>
        <div style="color: var(--text-muted); font-size: 0.75rem;">Şimdi</div>
    `;
    
    li.addEventListener('mouseover', () => li.style.transform = "translateX(5px)");
    li.addEventListener('mouseout', () => li.style.transform = "none");
    
    chatList.prepend(li);
}
