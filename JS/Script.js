// ==================== LOGIN SYSTEM ====================
function checkLogin() {
    const userName = localStorage.getItem('currentUser');
    const loginOverlay = document.getElementById('loginOverlay');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const userGreeting = document.getElementById('userGreeting');
    
    if (userName) {
        // Sudah login
        loginOverlay.classList.add('hidden');
        heroSubtitle.classList.add('hidden');
        userGreeting.innerHTML = `
            <span class="user-greeting">👋 Halo, ${userName}!</span>
            <button class="logout-btn" onclick="handleLogout()">Logout</button>
        `;
        userGreeting.classList.remove('hidden');
    } else {
        // Belum login
        loginOverlay.classList.remove('hidden');
        heroSubtitle.classList.remove('hidden');
        userGreeting.classList.add('hidden');
    }
}

function handleLogin() {
    const userNameInput = document.getElementById('userName');
    const userName = userNameInput.value.trim();
    
    if (userName === '') {
        showNotification('⚠️ Nama tidak boleh kosong!');
        return;
    }
    
    // Set sebagai current user
    setCurrentUser(userName);
    
    // Cek apakah user baru atau sudah ada
    const users = getAllUsers();
    const isNewUser = !users[userName];
    
    if (isNewUser) {
        showNotification(`✅ Selamat datang, ${userName}! Akun baru telah dibuat 🎉`);
        saveUserData(userName, getUserData(userName));
    } else {
        showNotification(`✅ Selamat datang kembali, ${userName}! 🎉`);
    }
    
    loadData();
    checkLogin();
}

function handleLogout() {
    const currentUser = getCurrentUser();
    
    // Konfirmasi logout
    if (confirm(`👋 Logout dari akun "${currentUser}"?\n\n✅ Data Anda akan tetap tersimpan dan bisa diakses kembali saat login.`)) {
        // Hapus current user (logout)
        localStorage.removeItem('currentUser');
        
        // Reset userData ke default
        userData = {
            sleep: 0,
            water: 0,
            activity: '',
            bmi: 0,
            bmiCategory: ''
        };
        
        // Sembunyikan dashboard dan hasil
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('healthResult').classList.remove('show');
        document.getElementById('bmiResult').classList.remove('show');
        
        // Reset form inputs
        document.getElementById('sleep').value = '';
        document.getElementById('water').value = '';
        document.getElementById('activity').value = '';
        document.getElementById('weight').value = '';
        document.getElementById('height').value = '';
        
        // Tampilkan notifikasi
        showNotification(`👋 Anda telah logout dari akun "${currentUser}". Sampai jumpa!`);
        
        // Kembali ke halaman login
        checkLogin();
        
        // Scroll ke atas
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ==================== THEME TOGGLE ====================
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌓';

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌓';
    
    if (typeof healthChart !== 'undefined' && healthChart) {
        updateChart();
    }
});

// ==================== MULTI-USER DATA STORAGE ====================
function getAllUsers() {
    const users = localStorage.getItem('allUsers');
    return users ? JSON.parse(users) : {};
}

function saveAllUsers(users) {
    localStorage.setItem('allUsers', JSON.stringify(users));
}

function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

function setCurrentUser(username) {
    localStorage.setItem('currentUser', username);
}

function getUserData(username) {
    const users = getAllUsers();
    if (users[username]) {
        return users[username];
    }
    return {
        sleep: 0,
        water: 0,
        activity: '',
        bmi: 0,
        bmiCategory: '',
        weeklyData: {
            dates: [],
            sleep: [],
            water: [],
            activity: []
        }
    };
}

function saveUserData(username, data) {
    const users = getAllUsers();
    users[username] = data;
    saveAllUsers(users);
}

let userData = {
    sleep: 0,
    water: 0,
    activity: '',
    bmi: 0,
    bmiCategory: ''
};

// ==================== LOAD & SAVE DATA ====================
function loadData() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        userData = getUserData(currentUser);
        if (userData.sleep > 0 || userData.water > 0 || userData.bmi > 0) {
            updateDashboard();
        }
    }
}

function saveData() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        saveUserData(currentUser, userData);
    }
}

// ==================== WEEKLY DATA ====================
function getWeeklyData() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const data = getUserData(currentUser);
        return data.weeklyData || {
            dates: [],
            sleep: [],
            water: [],
            activity: []
        };
    }
    return { dates: [], sleep: [], water: [], activity: [] };
}

function saveWeeklyData(date, sleep, water, activity) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const currentUserData = getUserData(currentUser);
    let weeklyData = currentUserData.weeklyData || { dates: [], sleep: [], water: [], activity: [] };
    
    if (weeklyData.dates.length >= 7) {
        weeklyData.dates.shift();
        weeklyData.sleep.shift();
        weeklyData.water.shift();
        weeklyData.activity.shift();
    }
    
    weeklyData.dates.push(date);
    weeklyData.sleep.push(sleep);
    weeklyData.water.push(water);
    
    const activityMap = { 
        'ringan': 1, 'sedang': 2, 'berat': 3,
        'berjalan': 1.5, 'berlari': 2.5,
        'belajar': 0.5, 'sekolah': 0.5, 'rutin': 0.5
    };
    weeklyData.activity.push(activityMap[activity] || 0);
    
    currentUserData.weeklyData = weeklyData;
    saveUserData(currentUser, currentUserData);
}

// ==================== NOTIFICATION ====================
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ==================== REMINDER ====================
let reminderInterval;
const reminderToggle = document.getElementById('reminderToggle');

const reminderEnabled = localStorage.getItem('reminderEnabled') === 'true';
reminderToggle.checked = reminderEnabled;
if (reminderEnabled) {
    startReminder();
}

reminderToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    localStorage.setItem('reminderEnabled', enabled);
    
    if (enabled) {
        startReminder();
        showNotification('✅ Pengingat diaktifkan!');
    } else {
        stopReminder();
        showNotification('❌ Pengingat dinonaktifkan');
    }
});

function startReminder() {
    reminderInterval = setInterval(() => {
        const messages = [
            '💧 Waktunya minum air!',
            '🏃 Yuk bergerak!',
            '💪 Sudah olahraga hari ini?'
        ];
        showNotification(messages[Math.floor(Math.random() * messages.length)]);
    }, 7200000);
}

function stopReminder() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
    }
}

// ==================== CEK KESEHATAN ====================
document.getElementById('healthForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const sleep = parseFloat(document.getElementById('sleep').value);
    const water = parseInt(document.getElementById('water').value);
    const activity = document.getElementById('activity').value;

    if (sleep < 3) {
        showNotification('⚠️ Tidur kurang dari 3 jam sangat tidak sehat!');
        return;
    }
    
    if (water === 0) {
        showNotification('⚠️ Anda belum minum air hari ini!');
        return;
    }
    
    if (!activity) {
        showNotification('⚠️ Pilih jenis aktivitas fisik terlebih dahulu');
        return;
    }

    userData.sleep = sleep;
    userData.water = water;
    userData.activity = activity;
    saveData();
    
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    saveWeeklyData(today, sleep, water, activity);

    let sleepStatus, waterStatus, sleepClass, waterClass;

    if (sleep >= 7 && sleep <= 9) {
        sleepStatus = 'Sangat Baik';
        sleepClass = 'status-good';
    } else if (sleep >= 6) {
        sleepStatus = 'Kurang';
        sleepClass = 'status-warning';
    } else {
        sleepStatus = 'Perlu Diperbaiki';
        sleepClass = 'status-danger';
    }

    if (water >= 8) {
        waterStatus = 'Sangat Baik';
        waterClass = 'status-good';
    } else if (water >= 5) {
        waterStatus = 'Cukup';
        waterClass = 'status-warning';
    } else {
        waterStatus = 'Kurang';
        waterClass = 'status-danger';
    }

    const activityMap = {
        'ringan': { status: 'Baik, tingkatkan intensitas', class: 'status-warning', label: 'Ringan' },
        'sedang': { status: 'Sangat Baik', class: 'status-good', label: 'Sedang' },
        'berat': { status: 'Luar Biasa!', class: 'status-good', label: 'Berat' },
        'berjalan': { status: 'Baik, pertahankan!', class: 'status-good', label: 'Berjalan' },
        'berlari': { status: 'Sangat Baik!', class: 'status-good', label: 'Berlari' },
        'belajar': { status: 'Aktif belajar, tambahkan olahraga!', class: 'status-warning', label: 'Belajar' },
        'sekolah': { status: 'Aktif sekolah, tambahkan olahraga!', class: 'status-warning', label: 'Sekolah/Kuliah' },
        'rutin': { status: 'Sebaiknya tambahkan olahraga', class: 'status-danger', label: 'Aktivitas Rutin' }
    };

    const activityInfo = activityMap[activity];

    document.getElementById('resultContent').innerHTML = `
        <div class="result-item">
            <span><strong>Jam Tidur:</strong> ${sleep} jam</span>
            <span class="status-badge ${sleepClass}">${sleepStatus}</span>
        </div>
        <div class="result-item">
            <span><strong>Air Minum:</strong> ${water} gelas</span>
            <span class="status-badge ${waterClass}">${waterStatus}</span>
        </div>
        <div class="result-item">
            <span><strong>Aktivitas Fisik:</strong> ${activityInfo.label}</span>
            <span class="status-badge ${activityInfo.class}">${activityInfo.status}</span>
        </div>
    `;

    document.getElementById('healthResult').classList.add('show');
    updateDashboard();
    updateChart();
    showNotification('✅ Data kesehatan berhasil disimpan!');
});

// ==================== BMI ====================
document.getElementById('bmiForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value) / 100;
    const bmi = (weight / (height * height)).toFixed(1);
    
    userData.bmi = bmi;

    let category, advice, categoryClass;
    if (bmi < 18.5) {
        category = 'Kurus';
        advice = 'Anda perlu menambah berat badan.';
        categoryClass = 'status-warning';
    } else if (bmi < 25) {
        category = 'Normal';
        advice = 'Berat badan Anda ideal!';
        categoryClass = 'status-good';
    } else if (bmi < 30) {
        category = 'Kelebihan Berat Badan';
        advice = 'Anda perlu menurunkan berat badan.';
        categoryClass = 'status-warning';
    } else {
        category = 'Obesitas';
        advice = 'Segera konsultasi dengan dokter.';
        categoryClass = 'status-danger';
    }

    userData.bmiCategory = category;
    saveData();

    document.getElementById('bmiContent').innerHTML = `
        <div class="result-item">
            <span><strong>BMI Anda:</strong></span>
            <span style="font-size: 2rem; font-weight: bold; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${bmi}</span>
        </div>
        <div class="result-item">
            <span><strong>Kategori:</strong></span>
            <span class="status-badge ${categoryClass}">${category}</span>
        </div>
        <p style="margin-top: 1rem; padding: 1rem; background: var(--glass-bg); border-radius: 10px; border: 1px solid var(--card-border);">
            <strong>Saran:</strong> ${advice}
        </p>
    `;

    document.getElementById('bmiResult').classList.add('show');
    updateDashboard();
    showNotification('✅ BMI berhasil dihitung!');
});

// ==================== CHART ====================
let healthChart;

function updateChart() {
    const weeklyData = getWeeklyData();
    const ctx = document.getElementById('healthChart');
    
    if (!ctx) return;
    
    if (healthChart) {
        healthChart.destroy();
    }

    const theme = html.getAttribute('data-theme');
    const textColor = theme === 'dark' ? '#ffffff' : '#1a1a1a';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    healthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weeklyData.dates.length > 0 ? weeklyData.dates : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
            datasets: [
                {
                    label: 'Jam Tidur',
                    data: weeklyData.sleep.length > 0 ? weeklyData.sleep : [],
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Gelas Air',
                    data: weeklyData.water.length > 0 ? weeklyData.water : [],
                    borderColor: '#7df9ff',
                    backgroundColor: 'rgba(125, 249, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: { size: 14 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

// ==================== DASHBOARD ====================
function updateDashboard() {
    const dashboardSection = document.getElementById('dashboard');
    const dashboardContent = document.getElementById('dashboardContent');

    const sleepProgress = Math.min((userData.sleep / 8) * 100, 100);
    const waterProgress = Math.min((userData.water / 8) * 100, 100);
    
    const activityDisplayMap = {
        'ringan': 'Ringan', 'sedang': 'Sedang', 'berat': 'Berat',
        'berjalan': 'Berjalan', 'berlari': 'Berlari',
        'belajar': 'Belajar', 'sekolah': 'Sekolah/Kuliah', 'rutin': 'Aktivitas Rutin'
    };
    
    const activityDisplay = userData.activity ? activityDisplayMap[userData.activity] : '-';

    dashboardContent.innerHTML = `
        <div class="dashboard-card">
            <h3>Jam Tidur</h3>
            <div class="dashboard-value">${userData.sleep || '-'}</div>
            <p>dari 8 jam ideal</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${sleepProgress}%"></div>
            </div>
        </div>
        <div class="dashboard-card">
            <h3>Air Minum</h3>
            <div class="dashboard-value">${userData.water || '-'}</div>
            <p>dari 8 gelas ideal</p>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${waterProgress}%"></div>
            </div>
        </div>
        <div class="dashboard-card">
            <h3>Aktivitas Fisik</h3>
            <div class="dashboard-value">${activityDisplay}</div>
            <p>aktivitas hari ini</p>
        </div>
        <div class="dashboard-card">
            <h3>BMI</h3>
            <div class="dashboard-value">${userData.bmi || '-'}</div>
            <p>${userData.bmiCategory || 'Belum dihitung'}</p>
        </div>
    `;

    dashboardSection.classList.remove('hidden');
}

// ==================== EXPORT DATA ====================
function exportData() {
    showNotification('📄 Menyiapkan laporan untuk dicetak...');
    setTimeout(() => {
        window.print();
    }, 500);
}

// ==================== RESET DATA ====================
function resetUserData() {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        showNotification('⚠️ Anda harus login terlebih dahulu!');
        return;
    }
    
    if (confirm(`⚠️ PERINGATAN!\n\nSemua data kesehatan Anda (${currentUser}) akan dihapus secara permanen.\n\nLanjutkan reset?`)) {
        const defaultData = {
            sleep: 0,
            water: 0,
            activity: '',
            bmi: 0,
            bmiCategory: '',
            weeklyData: {
                dates: [],
                sleep: [],
                water: [],
                activity: []
            }
        };
        
        saveUserData(currentUser, defaultData);
        userData = defaultData;
        
        document.getElementById('sleep').value = '';
        document.getElementById('water').value = '';
        document.getElementById('activity').value = '';
        document.getElementById('weight').value = '';
        document.getElementById('height').value = '';
        
        document.getElementById('healthResult').classList.remove('show');
        document.getElementById('bmiResult').classList.remove('show');
        
        updateDashboard();
        updateChart();
        
        showNotification('✅ Data berhasil direset! Mulai tracking dari awal');
    }
}

// ==================== SMOOTH SCROLLING ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== INITIALIZE ====================
window.addEventListener('load', () => {
    checkLogin();
    loadData();
    updateChart();
});