document.addEventListener('DOMContentLoaded', () => {
    const adminEmail = 'goymenmhmmd@gmail.com'; // Düzeltildi: goymenmhmd -> goymenmhmmd
    const adminPassword = 'Suskun1200';

    document.getElementById('admin-login-btn').addEventListener('click', () => {
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        if (email === adminEmail && password === adminPassword) {
            document.getElementById('login-container').classList.add('hidden');
            document.getElementById('admin-panel').classList.remove('hidden');
            loadWords();
        } else {
            document.getElementById('login-error').textContent = 'Geçersiz kullanıcı adı veya şifre';
        }
    });

    document.getElementById('show-add-form').addEventListener('click', () => {
        document.getElementById('add-word-form').classList.toggle('hidden');
    });

    document.getElementById('add-word-btn').addEventListener('click', addNewWord);
});

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
            alert('Kelime eklenirken bir hata oluştu');
        }
    } catch (error) {
        console.error('Kelime eklenirken hata:', error);
        alert('Kelime eklenirken bir hata oluştu');
    }
}

async function editWord(wordId) {
    const wordInfo = document.querySelector(`[data-word-id="${wordId}"]`);
    const currentWord = wordInfo.querySelector('p:first-child').textContent.split(':')[1].trim().split('(')[0].trim();
    const currentHint = wordInfo.querySelector('p:last-child').textContent.split(':')[1].trim();

    wordInfo.innerHTML = `
        <div class="edit-form">
            <input type="text" value="${currentWord}" class="edit-word">
            <input type="text" value="${currentHint}" class="edit-hint">
            <button onclick="saveEdit('${wordId}')">Kaydet</button>
            <button onclick="loadWords()">İptal</button>
        </div>
    `;
}

async function saveEdit(wordId) {
    const wordInfo = document.querySelector(`[data-word-id="${wordId}"]`);
    const newWord = wordInfo.querySelector('.edit-word').value.trim().toUpperCase();
    const newHint = wordInfo.querySelector('.edit-hint').value.trim();

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
            loadWords();
        } else {
            alert('Kelime güncellenirken bir hata oluştu');
        }
    } catch (error) {
        console.error('Kelime güncellenirken hata:', error);
        alert('Kelime güncellenirken bir hata oluştu');
    }
}

async function deleteWord(wordId) {
    if (!confirm('Bu kelimeyi silmek istediğinizden emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/words/${wordId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadWords();
        } else {
            alert('Kelime silinirken bir hata oluştu');
        }
    } catch (error) {
        console.error('Kelime silinirken hata:', error);
        alert('Kelime silinirken bir hata oluştu');
    }
}
