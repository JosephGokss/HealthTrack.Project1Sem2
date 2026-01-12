// ==================== LOGIN SYSTEM (UPDATE) ====================
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
        // Inisialisasi data user baru
        saveUserData(userName, getUserData(userName));
    } else {
        showNotification(`✅ Selamat datang kembali, ${userName}! 🎉`);
    }
    
    // Load data user
    loadData();
    checkLogin();
}

function handleLogout() {
    const currentUser = getCurrentUser();
    if (confirm(`Yakin ingin logout? Data ${currentUser} akan tetap tersimpan.`)) {
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
        
        // Reset tampilan dashboard
        document.getElementById('dashboard').classList.add('hidden');
        
        showNotification('👋 Anda telah logout. Sampai jumpa!');
        checkLogin();
    }
}
// ==================== THEME TOGGLE ====================
        const themeToggle = document.getElementById('themeToggle');
        const html = document.documentElement;
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        html.setAttribute('data-theme', savedTheme);
        themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌓';

        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌓';
            
            // Recreate chart with new theme
            if (healthChart) {
                updateChart();
            }
        });

        // ==================== DATA STORAGE ====================
// ==================== MULTI-USER DATA STORAGE ==================== 
// Struktur data: { "username1": {data}, "username2": {data} }

// Fungsi untuk mendapatkan semua users
function getAllUsers() {
    const users = localStorage.getItem('allUsers');
    return users ? JSON.parse(users) : {};
}

// Fungsi untuk menyimpan semua users
function saveAllUsers(users) {
    localStorage.setItem('allUsers', JSON.stringify(users));
}

// Fungsi untuk mendapatkan user yang sedang aktif
function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

// Fungsi untuk set user aktif
function setCurrentUser(username) {
    localStorage.setItem('currentUser', username);
}

// Fungsi untuk mendapatkan data user tertentu
function getUserData(username) {
    const users = getAllUsers();
    if (users[username]) {
        return users[username];
    }
    // Default data untuk user baru
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

// Fungsi untuk menyimpan data user tertentu
function saveUserData(username, data) {
    const users = getAllUsers();
    users[username] = data;
    saveAllUsers(users);
}

// Variable global untuk data user yang sedang aktif
let userData = {
    sleep: 0,
    water: 0,
    activity: '',
    bmi: 0,
    bmiCategory: ''
};

// ==================== LOAD & SAVE DATA (MULTI-USER) ====================
function loadData() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        userData = getUserData(currentUser);
        updateDashboard();
    }
}

function saveData() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        saveUserData(currentUser, userData);
    }
}

// ==================== WEEKLY DATA (MULTI-USER) ====================
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
    
    const userData = getUserData(currentUser);
    let weeklyData = userData.weeklyData || { dates: [], sleep: [], water: [], activity: [] };
    
    // Keep only last 7 days
    if (weeklyData.dates.length >= 7) {
        weeklyData.dates.shift();
        weeklyData.sleep.shift();
        weeklyData.water.shift();
        weeklyData.activity.shift();
    }
    
    weeklyData.dates.push(date);
    weeklyData.sleep.push(sleep);
    weeklyData.water.push(water);
    
    // Convert activity to number - UPDATE untuk aktivitas baru
    const activityMap = { 
        'ringan': 1, 
        'sedang': 2, 
        'berat': 3,
        'berjalan': 1.5,
        'berlari': 2.5,
        'belajar': 0.5,
        'sekolah': 0.5,
        'rutin': 0.5
    };
    weeklyData.activity.push(activityMap[activity] || 0);
    
    userData.weeklyData = weeklyData;
    saveUserData(currentUser, userData);
}

        // ==================== NOTIFICATION SYSTEM ====================
        function showNotification(message) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        // ==================== REMINDER SYSTEM ====================
        let reminderInterval;
        const reminderToggle = document.getElementById('reminderToggle');
        
        // Load reminder setting
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
                showNotification('✅ Pengingat diaktifkan! Anda akan mendapat notifikasi setiap 2 jam');
            } else {
                stopReminder();
                showNotification('❌ Pengingat dinonaktifkan');
            }
        });

        function startReminder() {
            // Check every 2 hours (7200000 ms)
            reminderInterval = setInterval(() => {
                const messages = [
                    '💧 Waktunya minum air! Jangan lupa hidrasi tubuhmu',
                    '🏃 Yuk bergerak! Luangkan waktu untuk stretching',
                    '💪 Sudah olahraga hari ini? Tubuh sehatmu menantimu!'
                ];
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                showNotification(randomMessage);
            }, 7200000); // 2 hours
        }

        function stopReminder() {
            if (reminderInterval) {
                clearInterval(reminderInterval);
            }
        }

        // ==================== CEK KESEHATAN HARIAN ====================
        document.getElementById('healthForm').addEventListener('submit', function(e) {
            
            e.preventDefault();
            
            const sleep = parseFloat(document.getElementById('sleep').value);
            const water = parseInt(document.getElementById('water').value);
            const activity = document.getElementById('activity').value;

            // VALIDASI INPUT - TAMBAHAN BARU
    // Validasi jam tidur
    if (sleep < 3) {
        showNotification('⚠️ Peringatan: Tidur kurang dari 3 jam sangat tidak sehat!');
        return;
    }
    
    // Validasi air minum
    if (water === 0) {
        showNotification('⚠️ Peringatan: Anda belum minum air hari ini! Segera hidrasi tubuhmu');
        return;
    }
    
    // Validasi aktivitas fisik
    if (!activity || activity === '') {
        showNotification('⚠️ Peringatan: Pilih jenis aktivitas fisik terlebih dahulu');
        return;
    }

            // Simpan data
            userData.sleep = sleep;
            userData.water = water;
            userData.activity = activity;
            saveData();
            
            // Save weekly data
            const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            saveWeeklyData(today, sleep, water, activity);

            // Evaluasi kesehatan
            let sleepStatus, waterStatus, activityStatus;
            let sleepClass, waterClass, activityClass;

            // Evaluasi tidur
            if (sleep >= 7 && sleep <= 9) {
                sleepStatus = 'Sangat Baik';
                sleepClass = 'status-good';
            } else if (sleep >= 6 && sleep < 7) {
                sleepStatus = 'Kurang';
                sleepClass = 'status-warning';
            } else {
                sleepStatus = 'Perlu Diperbaiki';
                sleepClass = 'status-danger';
            }

            // Evaluasi air minum
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

            // Evaluasi aktivitas
            const activityMap = {
                'ringan': { status: 'Baik, tingkatkan intensitas', class: 'status-warning' },
                'sedang': { status: 'Sangat Baik', class: 'status-good' },
                'berat': { status: 'Luar Biasa!', class: 'status-good' }
            };
            activityStatus = activityMap[activity].status;
            activityClass = activityMap[activity].class;

            // Tampilkan hasil
            const resultContent = document.getElementById('resultContent');
            resultContent.innerHTML = `
                <div class="result-item">
                    <span><strong>Jam Tidur:</strong> ${sleep} jam</span>
                    <span class="status-badge ${sleepClass}">${sleepStatus}</span>
                </div>
                <div class="result-item">
                    <span><strong>Air Minum:</strong> ${water} gelas</span>
                    <span class="status-badge ${waterClass}">${waterStatus}</span>
                </div>
                <div class="result-item">
                    <span><strong>Aktivitas Fisik:</strong> ${activity.charAt(0).toUpperCase() + activity.slice(1)}</span>
                    <span class="status-badge ${activityClass}">${activityStatus}</span>
                </div>
            `;

            document.getElementById('healthResult').classList.add('show');
            updateDashboard();
            updateChart();
            showNotification('✅ Data kesehatan berhasil disimpan!');
        });

        // ==================== KALKULATOR BMI ====================
        document.getElementById('bmiForm').addEventListener('submit', function(e) {
            
            e.preventDefault();
            
            const weight = parseFloat(document.getElementById('weight').value);
            const height = parseFloat(document.getElementById('height').value) / 100;

            const bmi = (weight / (height * height)).toFixed(1);
            userData.bmi = bmi;

            // Kategori BMI
            let category, advice, categoryClass;
            if (bmi < 18.5) {
                category = 'Kurus';
                advice = 'Anda perlu menambah berat badan. Konsumsi makanan bergizi seimbang dan konsultasi dengan ahli gizi.';
                categoryClass = 'status-warning';
            } else if (bmi >= 18.5 && bmi < 25) {
                category = 'Normal';
                advice = 'Berat badan Anda ideal! Pertahankan pola makan sehat dan rutin berolahraga.';
                categoryClass = 'status-good';
            } else if (bmi >= 25 && bmi < 30) {
                category = 'Kelebihan Berat Badan';
                advice = 'Anda perlu menurunkan berat badan. Kurangi makanan tinggi kalori dan perbanyak aktivitas fisik.';
                categoryClass = 'status-warning';
            } else {
                category = 'Obesitas';
                advice = 'Segera konsultasi dengan dokter atau ahli gizi untuk program penurunan berat badan yang aman.';
                categoryClass = 'status-danger';
            }

            userData.bmiCategory = category;
            saveData();

            // Tampilkan hasil
            const bmiContent = document.getElementById('bmiContent');
            bmiContent.innerHTML = `
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
            
            // Destroy existing chart
            if (healthChart) {
                healthChart.destroy();
            }

            const theme = html.getAttribute('data-theme');
            const textColor = theme === 'dark' ? '#ffffff' : '#1a1a1a';
            const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

            healthChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: weeklyData.dates.length > 0 ? weeklyData.dates : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
                    datasets: [
                        {
                            label: 'Jam Tidur',
                            data: weeklyData.sleep.length > 0 ? weeklyData.sleep : [7, 6, 8, 7, 6, 8, 7],
                            borderColor: '#00ff88',
                            backgroundColor: 'rgba(0, 255, 136, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Gelas Air',
                            data: weeklyData.water.length > 0 ? weeklyData.water : [8, 7, 9, 8, 6, 8, 9],
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
                                font: {
                                    size: 14
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: textColor
                            },
                            grid: {
                                color: gridColor
                            }
                        },
                        x: {
                            ticks: {
                                color: textColor
                            },
                            grid: {
                                color: gridColor
                            }
                        }
                    }
                }
            });
        }

        // ==================== UPDATE DASHBOARD ====================
        function updateDashboard() {
            const dashboardSection = document.getElementById('dashboard');
            const dashboardContent = document.getElementById('dashboardContent');

            // Hitung progress
            const sleepProgress = Math.min((userData.sleep / 8) * 100, 100);
            const waterProgress = Math.min((userData.water / 8) * 100, 100);

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
                    <div class="dashboard-value">${userData.activity ? userData.activity.charAt(0).toUpperCase() + userData.activity.slice(1) : '-'}</div>
                    <p>intensitas hari ini</p>
                </div>
                <div class="dashboard-card">
                    <h3>BMI</h3>
                    <div class="dashboard-value">${userData.bmi || '-'}</div>
                    <p>${userData.bmiCategory || 'Belum dihitung'}</p>
                </div>
            `;

            dashboardSection.classList.remove('hidden');
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

        // ==================== EXPORT DATA ====================
function exportData() {
    // Tampilkan notifikasi
    showNotification('📄 Menyiapkan laporan untuk dicetak...');
    
    // Tambahkan delay agar notifikasi terlihat
    setTimeout(() => {
        window.print();
    }, 500);
}

        // ==================== INITIALIZE ====================
        window.addEventListener('load', () => {
            loadData();
            updateChart();
        });

        // ==================== RESET DATA (PER USER) ====================
function resetUserData() {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        showNotification('⚠️ Anda harus login terlebih dahulu!');
        return;
    }
    
    // Konfirmasi reset
    if (confirm(`⚠️ PERINGATAN!\n\nSemua data kesehatan Anda (${currentUser}) akan dihapus secara permanen.\n\nLanjutkan reset?`)) {
        // Reset data user ke default
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
        
        // Simpan data default
        saveUserData(currentUser, defaultData);
        
        // Update userData global
        userData = defaultData;
        
        // Reset form inputs
        document.getElementById('sleep').value = '';
        document.getElementById('water').value = '';
        document.getElementById('activity').value = '';
        document.getElementById('weight').value = '';
        document.getElementById('height').value = '';
        
        // Sembunyikan hasil
        document.getElementById('healthResult').classList.remove('show');
        document.getElementById('bmiResult').classList.remove('show');
        
        // Update dashboard dan chart
        updateDashboard();
        updateChart();
        
        showNotification('✅ Data berhasil direset! Mulai tracking dari awal');
    }
}