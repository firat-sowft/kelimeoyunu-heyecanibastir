from flask import Flask, request, jsonify, make_response
from pymongo import MongoClient
import smtplib
from email.mime.text import MIMEText
import random
import string
from flask_cors import CORS
import re
from bson import ObjectId
import os

app = Flask(__name__)
CORS(app)

# MongoDB bağlantısı
client = MongoClient("mongodb+srv://mhmmdgymn:suskun1200@cluster0.uquyz.mongodb.net/WordGame?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true")
db = client.WordGame
play_collection = db.play
words_collection = db.words  # Yeni collection

# E-posta ayarları
sender_email = "kelimeoyunu.heyecnibastir@gmail.com"
sender_password = "qnon exwe vodo ducp"

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(to_email, code):
    msg = MIMEText(f'Doğrulama kodunuz: {code}')
    msg['Subject'] = 'Kelime Oyunu Doğrulama Kodu'
    msg['From'] = sender_email
    msg['To'] = to_email

    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)

def json_response(data, status=200):
    response = make_response(jsonify(data), status)
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response

@app.route('/send-verification', methods=['POST'])
def send_verification():
    data = request.json
    email = data.get('email')
    
    if not email:
        return json_response({'error': 'E-posta adresi gerekli'}, 400)

    verification_code = generate_verification_code()
    
    try:
        send_verification_email(email, verification_code)
        # Doğrulama kodunu geçici olarak sakla
        # Gerçek uygulamada bu kodu güvenli bir şekilde saklamalısınız
        return json_response({'success': True}, 200)
    except Exception as e:
        return json_response({'error': str(e)}, 500)

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        name = data.get('name')
        surname = data.get('surname')
        email = data.get('email')
        password = data.get('password')
        verification_code = data.get('verificationCode')

        if not all([name, surname, email, password, verification_code]):
            print("Missing required fields")
            return json_response({'error': 'Tüm alanlar gerekli'}, 400)

        if play_collection.find_one({'email': email}):
            print("Email already registered")
            return json_response({'error': 'Bu e-posta adresi zaten kayıtlı'}, 400)

        password_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,16}$'
        if not re.match(password_regex, password):
            print("Password does not meet criteria")
            return json_response({'error': 'Şifre en az 8, en fazla 16 karakter olmalı, bir büyük harf, bir küçük harf ve bir rakam içermelidir.'}, 400)

        # Log the received data for debugging
        print(f"Received data: {data}")

        # Doğrulama kodunu kontrol et (gerçek uygulamada bu kodu güvenli bir şekilde saklamalısınız)
        # if verification_code_is_invalid(verification_code):
        #     print("Invalid verification code")
        #     return json_response({'error': 'Geçersiz doğrulama kodu'}, 400)

        play_collection.insert_one({
            'name': name,
            'surname': surname,
            'email': email,
            'password': password
        })

        print(f"User {email} registered successfully.")
        return json_response({'success': True}, 200)
    except Exception as e:
        print(f"Error during registration: {e}")
        return json_response({'error': 'Internal Server Error'}, 500)

@app.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email')
    verification_code = data.get('verificationCode')
    new_password = data.get('newPassword')

    if not all([email, verification_code, new_password]):
        return json_response({'error': 'Tüm alanlar gerekli'}, 400)

    # Doğrulama kodunu kontrol et (gerçek uygulamada bu kodu güvenli bir şekilde saklamalısınız)
    # if verification_code_is_invalid(verification_code):
    #     return json_response({'error': 'Geçersiz doğrulama kodu'}, 400)

    result = play_collection.update_one(
        {'email': email},
        {'$set': {'password': new_password}}
    )

    if result.matched_count == 0:
        return json_response({'error': 'Kullanıcı bulunamadı'}, 404)

    return json_response({'success': True}, 200)

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return json_response({'error': 'E-posta ve şifre gerekli'}, 400)

    user = play_collection.find_one({'email': email, 'password': password})
    if user:
        return json_response({'user': {'name': user['name'], 'surname': user['surname']}}, 200)
    else:
        return json_response({'error': 'Geçersiz e-posta veya şifre'}, 401)

@app.route('/words', methods=['GET'])
def get_words():
    try:
        level = request.args.get('level', type=int)
        if not level:
            return json_response({'error': 'Level parametresi gerekli'}, 400)

        words = list(words_collection.find({'length': level}, {'_id': 0}))
        return json_response({'words': words}, 200)
    except Exception as e:
        return json_response({'error': str(e)}, 500)

@app.route('/words', methods=['POST'])
def add_word():
    try:
        data = request.json
        word = data.get('word').upper()
        hint = data.get('hint')
        
        if not word or not hint:
            return json_response({'error': 'Kelime ve ipucu gerekli'}, 400)

        # Aynı kelimeden var mı kontrol et
        existing_word = words_collection.find_one({'word': word})
        if existing_word:
            return json_response({'error': 'Bu kelime zaten mevcut'}, 400)

        words_collection.insert_one({
            'word': word,
            'hint': hint,
            'length': len(word)
        })
        
        return json_response({'success': True}, 200)
    except Exception as e:
        return json_response({'error': str(e)}, 500)

@app.route('/words/all', methods=['GET'])
def get_all_words():
    try:
        words = list(words_collection.find({}))
        # ObjectId'leri string'e çevir
        for word in words:
            word['_id'] = str(word['_id'])
        return json_response({'words': words}, 200)
    except Exception as e:
        return json_response({'error': str(e)}, 500)

@app.route('/words/<word_id>', methods=['PUT'])
def update_word(word_id):
    try:
        data = request.json
        word = data.get('word').upper()
        hint = data.get('hint')
        
        if not word or not hint:
            return json_response({'error': 'Kelime ve ipucu gerekli'}, 400)

        # Önce mevcut kelimeyi bul
        current_word = words_collection.find_one({'_id': ObjectId(word_id)})
        if not current_word:
            return json_response({'error': 'Kelime bulunamadı'}, 404)

        # Eğer kelime değiştirilmediyse, sadece ipucunu güncelle
        if current_word['word'] == word:
            result = words_collection.update_one(
                {'_id': ObjectId(word_id)},
                {'$set': {'hint': hint}}
            )
        else:
            # Kelime değiştiyse, aynı kelimeden var mı kontrol et
            existing_word = words_collection.find_one({
                'word': word,
                '_id': {'$ne': ObjectId(word_id)}
            })
            if existing_word:
                return json_response({'error': 'Bu kelime zaten mevcut'}, 400)
            
            # Kelime ve ipucunu güncelle
            result = words_collection.update_one(
                {'_id': ObjectId(word_id)},
                {'$set': {
                    'word': word,
                    'hint': hint,
                    'length': len(word)
                }}
            )

        if result.matched_count == 0:
            return json_response({'error': 'Kelime bulunamadı'}, 404)
        
        return json_response({'success': True}, 200)
    except Exception as e:
        return json_response({'error': str(e)}, 500)

@app.route('/words/<word_id>', methods=['DELETE'])
def delete_word(word_id):
    try:
        result = words_collection.delete_one({'_id': ObjectId(word_id)})
        
        if result.deleted_count == 0:
            return json_response({'error': 'Kelime bulunamadı'}, 404)
        
        return json_response({'success': True}, 200)
    except Exception as e:
        return json_response({'error': str(e)}, 500)

@app.route('/')
def health_check():
    return json_response({'status': 'healthy'}, 200)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)