let currentUsername = '';
const gameContainer = document.querySelector('.game-container');
const loginScreen = document.querySelector('#login-screen');
const usernameInput = document.querySelector('#username-input');
const startGameButton = document.querySelector('#start-game');
const loginError = document.querySelector('#login-error');

// Yeni rewards objesi (videosuz):
const rewards = {
    1: { points: 1, name: 'Bigger Bass Splash oyununda \n25 Free Spin Kazandınız!' },
    2: { points: 2, name: 'Bigger Bass Splash oyununda \n50 Free Spin Kazandınız!' },
    3: { points: 3, name: 'Bigger Bass Splash oyununda \n75 Free Spin Kazandınız!' }
};

// Şans hesaplama fonksiyonu
function selectRandomReward() {
    const random = Math.random() * 100;
    if (random <= 50) return 1; // Bronz
    if (random <= 80) return 2; // Gümüş
    return 3; // Altın
}

// Kullanıcı kontrolü fonksiyonu
async function checkUser(username) {
    const checkUrl = 'https://prizerz.vipmobilapp.workers.dev/check-user?username=' + encodeURIComponent(username);
    console.log('Kontrol edilen URL:', checkUrl);

    try {
        const response = await fetch(checkUrl);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Sunucu yanıtı:', errorText);
            throw new Error('Sunucu hatası');
        }

        const data = await response.json();
        console.log('Sunucu yanıtı:', data);
        return data.canPlay;
    } catch (error) {
        console.error('Hata:', error);
        throw error;
    }
}

// Background video kontrolü
const bgVideo = document.getElementById('bg-video');

// Start game butonunun event listener'ı
startGameButton.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const loginError = document.querySelector('#login-error');
    
    // Reset error message
    loginError.textContent = '';
    loginError.style.display = 'none';
    
    if (username.length < 3) {
        showError('Kullanıcı adı en az 3 karakter olmalıdır');
        return;
    }

    try {
        const canPlay = await checkUser(username);
        
        if (!canPlay) {
            showError('Bu kullanıcı adı ile daha önce oynanmış!');
            return;
        }

        currentUsername = username;
        localStorage.setItem('username', username);
        
        const usernameDisplay = document.getElementById('displayed-username');
        usernameDisplay.textContent = username;
        usernameDisplay.style.display = 'block';
        
        document.querySelector('.login-container').style.backgroundImage = 'none';
        document.getElementById('login-screen').style.display = 'none';
        document.querySelector('.game-container').style.display = 'flex';
        document.querySelector('.username-warning').style.display = 'none';
        document.body.classList.add('game-started');
        document.querySelector('.login-container').style.zIndex = "1";

    } catch (error) {
        showError('Bir hata oluştu, lütfen tekrar deneyin');
        console.error('Hata detayı:', error);
    }
});

// HTML'e kırmızı overlay ekleyin
document.body.insertAdjacentHTML('beforeend', '<div class="red-overlay"></div>');

document.querySelectorAll('.heart').forEach(heart => {
    heart.addEventListener('click', handleHeartSelection);
    heart.addEventListener('touchstart', function(e) {
        e.preventDefault(); // Prevent double-firing
        handleHeartSelection.call(this, e);
    }, false);
});

function handleHeartSelection(e) {
    // Hide instruction text
    document.querySelector('.game-instruction').style.display = 'none';
    
    // Disable hearts
    document.querySelectorAll('.heart').forEach(h => h.style.pointerEvents = 'none');
    
    // Heart animation
    this.classList.add('selected');
    document.querySelectorAll('.heart').forEach(otherHeart => {
        if (otherHeart !== this) {
            otherHeart.classList.add('not-selected');
        }
    });

    new Promise(resolve => setTimeout(resolve, 400)).then(() => {
        // Play video
        const videoOverlay = document.querySelector('.video-overlay');
        const transitionVideo = document.querySelector('#transition-video');
        
        videoOverlay.classList.add('show');
        transitionVideo.currentTime = 0;
        transitionVideo.playbackRate = 1.2; // Speed up video
        transitionVideo.play();

        // Listen for video end
        transitionVideo.onended = async () => {
            videoOverlay.classList.remove('show');
            await processReward();
        };
    });
}

async function processReward() {
    try {
        const rewardId = selectRandomReward();
        await saveGameResult(currentUsername, rewardId);
        showMessage(rewardId);
    } catch (error) {
        console.error('Hata:', error);
    } finally {
        disableAllHearts();
    }
}

// Oyun sonucunu kaydetme fonksiyonu
async function saveGameResult(username, videoId) {
    try {
        const response = await fetch('https://prizerz.vipmobilapp.workers.dev/save-result', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                right: 0,        // Hak kullanıldı
                heart: videoId   // Çıkan video ID'si
            })
        });

        if (!response.ok) {
            throw new Error('Sonuç kaydedilemedi');
        }
    } catch (error) {
        throw error;
    }
}

function disableAllHearts() {
    document.querySelectorAll('.heart').forEach(heart => {
        heart.style.pointerEvents = 'none';
        heart.style.opacity = '0.5';
    });
}

function disableHeartButtons() {
    document.querySelectorAll('.heart').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    });
}

function enableHeartButtons() {
    document.querySelectorAll('.heart').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
}

function getUsername() {
    return currentUsername;
}

function getHeartNumber() {
    const clickedHeart = event.target;
    return clickedHeart.dataset.id;
}

function showMessage(rewardId) {
    const messageBox = document.querySelector('.message-box');
    const messages = document.querySelectorAll('.reward-message');
    
    // Hide all messages first
    messages.forEach(msg => msg.classList.remove('active'));
    
    // Show selected reward message
    const selectedMessage = document.querySelector(`.reward-message[data-reward="${rewardId}"]`);
    if (selectedMessage) {
        selectedMessage.classList.add('active');
    }
    
    messageBox.classList.add('show');
}

function showError(message) {
    const loginError = document.getElementById('login-error');
    loginError.textContent = message;
    loginError.style.display = 'block';
}

// Sayfa yüklendiğinde videoyu hazırla
document.addEventListener('DOMContentLoaded', () => {
    // Video yüklendiğinde otomatik oynatma için hazırla
    bgVideo.load();
    bgVideo.muted = true; // Tarayıcı politikaları gereği
});

document.getElementById('mainLogo').addEventListener('click', function() {
  const animatedLogo = document.getElementById('animatedLogo');
  animatedLogo.classList.add('show');
  
  // Hide animation after it completes (adjust timeout to match GIF duration)
  setTimeout(() => {
    animatedLogo.classList.remove('show');
  }, 3000); // 3 seconds
});

document.getElementById('mainLogo').addEventListener('click', function() {
    const video = document.getElementById('logoVideo');
    video.classList.add('active');
    video.currentTime = 0; // Reset video to start
    video.play();
    
    // Hide video when it ends
    video.onended = function() {
        video.classList.remove('active');
    };
});
