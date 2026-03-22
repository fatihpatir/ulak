// Sidebar Toggle Logic
const sidebar = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('openSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');
const navLinks = document.querySelectorAll('.nav-links a');

openSidebarBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
});

closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
});

// Close sidebar on link click (mobile)
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if(window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// Theme Toggle Logic
const themeToggleBtn = document.getElementById('themeToggle');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.setAttribute('data-theme', 'dark');
    themeToggleBtn.innerHTML = "<i class='bx bx-sun'></i>";
}

themeToggleBtn.addEventListener('click', () => {
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.innerHTML = "<i class='bx bx-moon'></i>";
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.innerHTML = "<i class='bx bx-sun'></i>";
    }
});

// PWA Installation
let deferredPrompt;
const installAppBtn = document.getElementById('installAppBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installAppBtn.classList.remove('hidden');
});

installAppBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installAppBtn.classList.add('hidden');
        }
        deferredPrompt = null;
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('ServiceWorker registered'))
            .catch((err) => console.log('ServiceWorker failed: ', err));
    });
}
