document.addEventListener('DOMContentLoaded', () => {
    // Splash screen'i 3 saniye sonra gizle
    setTimeout(() => {
        document.getElementById('splash-screen').classList.add('hidden');
        document.getElementById('login-page').classList.remove('hidden');
    }, 3000);

    // Sayfa geçişleri
    document.getElementById('register-btn').addEventListener('click', () => {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('register-page').classList.remove('hidden');
    });

    document.getElementById('back-to-login').addEventListener('click', () => {
        document.getElementById('register-page').classList.add('hidden');
        document.getElementById('login-page').classList.remove('hidden');
    });

    document.getElementById('forgot-password').addEventListener('click', () => {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('forgot-password-page').classList.remove('hidden');
    });

    function showNotification(message, isError = false) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.classList.remove('hidden');
        notification.classList.toggle('error', isError);
        notification.style.display = 'block';

        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    function showConfirmation(message, onConfirm) {
        // Var olan bildirimi kaldır
        const existingNotif = document.querySelector('.confirmation-popup');
        if (existingNotif) {
            existingNotif.remove();
        }

        // Yeni bildirim oluştur
        const notification = document.createElement('div');
        notification.className = 'confirmation-popup';
        notification.innerHTML = `
            <div class="confirmation-content">
                <p>${message}</p>
                <div class="confirmation-buttons">
                    <button class="confirm-btn">Sil</button>
                    <button class="cancel-btn">İptal</button>
                </div>
            </div>
        `;

        // Bildirimi sayfaya ekle
        document.body.appendChild(notification);

        // Buton olaylarını ekle
        const confirmBtn = notification.querySelector('.confirm-btn');
        const cancelBtn = notification.querySelector('.cancel-btn');

        confirmBtn.addEventListener('click', () => {
            onConfirm();
            notification.remove();
        });

        cancelBtn.addEventListener('click', () => {
            notification.remove();
        });
    }

    // Doğrulama kodu gönderme işlemleri
    document.getElementById('send-code-register').addEventListener('click', async () => {
        const email = document.getElementById('register-email').value;
        console.log(`Sending verification code to ${email}`);
        const response = await fetch('http://localhost:5000/send-verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        if (response.ok) {
            showNotification('Doğrulama kodu gönderildi!');
            document.getElementById('verification-section-register').classList.remove('hidden');
        } else {
            const errorData = await response.json();
            showNotification(`Doğrulama kodu gönderilemedi: ${errorData.error}`, true);
        }
    });

    document.getElementById('send-code-forgot').addEventListener('click', async () => {
        const email = document.getElementById('forgot-email').value;
        console.log(`Sending verification code to ${email}`);
        const response = await fetch('http://localhost:5000/send-verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        if (response.ok) {
            document.getElementById('verification-section-forgot').classList.remove('hidden');
        }
    });

    document.getElementById('save-register').addEventListener('click', async () => {
        const name = document.getElementById('register-name').value;
        const surname = document.getElementById('register-surname').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        const verificationCode = document.getElementById('verification-code-register').value;

        if (password !== passwordConfirm) {
            showNotification('Şifreler aynı olmalı.', true);
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,16}$/;
        if (!passwordRegex.test(password)) {
            showNotification('Şifre en az 8, en fazla 16 karakter olmalı, bir büyük harf, bir küçük harf ve bir rakam içermelidir.', true);
            return;
        }

        const response = await fetch('http://localhost:5000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, surname, email, password, verificationCode })
        });

        if (response.ok) {
            showNotification('Hesap başarıyla oluşturuldu!');
            document.getElementById('register-page').classList.add('hidden');
            document.getElementById('login-page').classList.remove('hidden');
        } else {
            const errorData = await response.json();
            showNotification(`Kayıt başarısız: ${errorData.error}`, true);
        }
    });

    document.getElementById('change-password').addEventListener('click', async () => {
        const email = document.getElementById('forgot-email').value;
        const verificationCode = document.getElementById('verification-code-forgot').value;
        const newPassword = document.getElementById('new-password').value;

        const response = await fetch('http://localhost:5000/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, verificationCode, newPassword })
        });

        if (response.ok) {
            showNotification('Şifre başarıyla değiştirildi!');
            document.getElementById('forgot-password-page').classList.add('hidden');
            document.getElementById('login-page').classList.remove('hidden');
        } else {
            showNotification('Şifre değiştirme başarısız. Lütfen tekrar deneyin.', true);
        }
    });

    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Admin hesabı kontrolü - hardcoded admin bilgileri
        if (email === 'goymenmhmd@gmail.com') {
            const adminHtml = `
                <div class="admin-container">
                    <h1>Kelime Yönetimi</h1>
                    <div class="add-word-container">
                        <button id="show-add-form">Yeni Kelime Ekle</button>
                        <div id="add-word-form" class="hidden">
                            <input type="text" id="new-word" placeholder="Kelime">
                            <input type="text" id="new-hint" placeholder="İpucu">
                            <button id="add-word-btn">Ekle</button>
                        </div>
                    </div>
                    <div class="words-list"></div>
                </div>
            `;

            // Mevcut içeriği admin paneli ile değiştir
            document.body.innerHTML = adminHtml;

            // Admin panel stillerini ekle
            const style = document.createElement('style');
            style.textContent = `
                .admin-container {
                    max-width: 800px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .word-item {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                }
                .word-info { flex-grow: 1; }
                .word-actions { display: flex; gap: 10px; }
                .edit-btn { background-color: #2196F3; }
                .delete-btn { background-color: #f44336; }
            `;
            document.head.appendChild(style);

            // Admin fonksiyonlarını ekle
            setupAdminFunctions();
            return;
        }

        // Normal kullanıcı girişi için mevcut kod
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'game.html';
        } else {
            const errorData = await response.json();
            showNotification(`Giriş başarısız: ${errorData.error}`, true);
        }
    });
});

function setupAdminFunctions() {
    // Global değişkenler
    window.isEditing = false;
    window.currentEditId = null;

    // Confirmation popup fonksiyonu
    window.deleteConfirmation = function(wordId) {
        const notification = document.createElement('div');
        notification.className = 'confirmation-popup';
        notification.innerHTML = `
            <div class="confirmation-content">
                <p>Bu kelimeyi silmek istediğinizden emin misiniz?</p>
                <div class="confirmation-buttons">
                    <button class="confirm-btn" onclick="confirmDelete('${wordId}')">Sil</button>
                    <button class="cancel-btn" onclick="this.closest('.confirmation-popup').remove()">İptal</button>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
    }

    // Kelime ekleme formunu göster/gizle
    document.getElementById('show-add-form').addEventListener('click', () => {
        document.getElementById('add-word-form').classList.toggle('hidden');
    });

    // Kelime ekleme butonu
    document.getElementById('add-word-btn').addEventListener('click', addNewWord);

    // Kelimeleri yükle
    loadWords();
}

// Silme işlemini gerçekleştiren fonksiyonları güncelle
window.deleteWord = function(wordId) {
    const notification = document.createElement('div');
    notification.className = 'confirmation-popup';
    notification.innerHTML = `
        <div class="confirmation-content">
            <p>Bu kelimeyi silmek istediğinizden emin misiniz?</p>
            <div class="confirmation-buttons">
                <button onclick="confirmDelete('${wordId}')" class="confirm-btn">Sil</button>
                <button onclick="this.closest('.confirmation-popup').remove()" class="cancel-btn">İptal</button>
            </div>
        </div>
    `;
    document.body.appendChild(notification);
};

window.confirmDelete = async function(wordId) {
    try {
        const response = await fetch(`http://localhost:5000/words/${wordId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const popup = document.querySelector('.confirmation-popup');
            if (popup) popup.remove();
            loadWords(); // Listeyi yenile
        } else {
            alert('Kelime silinirken bir hata oluştu');
        }
    } catch (error) {
        console.error('Kelime silinirken hata:', error);
        alert('Kelime silinirken bir hata oluştu');
    }
};

async function loadWords() {
    try {
        const response = await fetch('http://localhost:5000/words/all');
        const data = await response.json();
        displayWords(data.words);
    } catch (error) {
        console.error('Kelimeler yüklenirken hata:', error);
    }
}

function displayWords(words) {
    const container = document.querySelector('.words-list');
    container.innerHTML = '';

    words.sort((a, b) => a.length - b.length).forEach(word => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word-item';
        wordDiv.innerHTML = `
            <div class="word-info" data-word-id="${word._id}">
                <p><strong>Kelime:</strong> ${word.word} (${word.length} harf)</p>
                <p><strong>İpucu:</strong> ${word.hint}</p>
            </div>
            <div class="word-actions">
                <button class="edit-btn" onclick="editWord('${word._id}')">Düzelt</button>
                <button class="delete-btn" onclick="deleteWord('${word._id}')">Sil</button>
            </div>
        `;
        container.appendChild(wordDiv);
    });
}

function editWord(wordId) {
    if (window.isEditing) {
        alert('Lütfen önce mevcut düzenlemeyi tamamlayın');
        return;
    }

    window.isEditing = true;
    window.currentEditId = wordId;

    const wordInfo = document.querySelector(`[data-word-id="${wordId}"]`);
    const currentWord = wordInfo.querySelector('p:first-child').textContent.split(':')[1].trim().split('(')[0].trim();
    const currentHint = wordInfo.querySelector('p:last-child').textContent.split(':')[1].trim();

    wordInfo.innerHTML = `
        <div class="edit-form">
            <input type="text" value="${currentWord}" class="edit-word">
            <input type="text" value="${currentHint}" class="edit-hint">
            <button onclick="saveEdit('${wordId}')" class="save-btn">Değiştir</button>
            <button onclick="cancelEdit()" class="cancel-btn">İptal</button>
        </div>
    `;
}

function cancelEdit() {
    window.isEditing = false;
    window.currentEditId = null;
    loadWords(); // Listeyi yeniden yükle
}

async function saveEdit(wordId) {
    const editForm = document.querySelector(`[data-word-id="${wordId}"] .edit-form`);
    const newWord = editForm.querySelector('.edit-word').value.trim().toUpperCase();
    const newHint = editForm.querySelector('.edit-hint').value.trim();

    if (!newWord || !newHint) {
        alert('Kelime ve ipucu alanları boş bırakılamaz');
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/words/${wordId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ word: newWord, hint: newHint })
        });

        if (response.ok) {
            window.isEditing = false;
            window.currentEditId = null;
            loadWords(); // Listeyi yeniden yükle
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Kelime güncellenirken bir hata oluştu');
        }
    } catch (error) {
        console.error('Kelime güncellenirken hata:', error);
        alert('Kelime güncellenirken bir hata oluştu');
    }
}

async function addNewWord() {
    const word = document.getElementById('new-word').value.trim().toUpperCase();
    const hint = document.getElementById('new-hint').value.trim();

    if (!word || !hint) {
        alert('Kelime ve ipucu alanları boş bırakılamaz');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/words', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ word, hint })
        });

        if (response.ok) {
            document.getElementById('new-word').value = '';
            document.getElementById('new-hint').value = '';
            document.getElementById('add-word-form').classList.add('hidden');
            loadWords();
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'Kelime eklenirken bir hata oluştu');
        }
    } catch (error) {
        console.error('Kelime eklenirken hata:', error);
        alert('Kelime eklenirken bir hata oluştu');
    }
}

// "Yeni Kelime Ekle" butonuna tıklandığında
document.getElementById('show-add-form').addEventListener('click', () => {
    if (window.isEditing) {
        alert('Lütfen önce mevcut düzenlemeyi tamamlayın');
        return;
    }
    document.getElementById('add-word-form').classList.toggle('hidden');
    document.getElementById('new-word').value = '';
    document.getElementById('new-hint').value = '';
    const addButton = document.getElementById('add-word-btn');
    addButton.textContent = 'Ekle';
    addButton.onclick = addNewWord;
});