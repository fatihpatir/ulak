const admin = require('firebase-admin');

// --- AŞAĞIDAKİ KIVIRCIK PARANTEZLERİN İÇİNE, FIREBASE'DEN İNDİRDİĞİN JSON DOSYASININ İÇERİĞİNİ KOMPLE YAPIŞTIR! ---
const serviceAccount = {
  "type": "service_account",
  "project_id": "ulak-b4965",
  "private_key_id": "4bc3af3b7d25fc1e3545f03ca299def1643e54aa",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC5cGA2ggXLiUQI\nS7OELGNzUErkTaXWUcuLiL4dMd6yMCtvbGhd1EcKH1YT2yCLjuNBUi7uidQdvUvG\nKn/ltmAXRZCMewCtz7apm02mokDbG1YK91k59DzLFiyHHTsSXCsVebsFPWAH1Yt5\nRLT8bwxhzP6ay1DLXzISC4t1G2SOkiFUKs7nW7mGicFeAyUTnybp1sSWS95tUYOS\nzH26JIRfJrvYlpWkhwhNwlUeJgRbCOWZAzMtlv/7AGUfDne0wAP4zOdwjUk+V6+K\n3GyaCg4oV6x3gqXGTaPkcSP8cOCK1In99Bia5FLvXMR04pkTUNh3lQI8MUaxTHBd\n6sc1RMCLAgMBAAECggEAGNT7jVEMBZ10BshcWa64ApEV9kyPkIuTfjPpgW9UKvhY\nWKtjrmzmtmxL0ozdZtLTi8O9lSPPy8u1gevfBJvPck5WdPljteLCyyOI2m+Pz8dx\nVjaZNDGIkol9nPpFFshQ3KdYa/M0ENh/vNV+hu838UDKN2BSiWlOAyyYmC364Txl\nucdbZao4F1FS5H88BNfSJ3KKMJjmlZQShn18IYcOCGlROh1bnEc6x3UlXmkNsn7q\nrz1UKzP9KtIx2YNSCXm3FHF36OOVAZ8Vzv4N5AIQf9X6HlV+KwYI09jIX+3G3TQR\ndg70diXPf8PCDwd8WRoglIswYy7fk1XPLJ/+6k2zAQKBgQDtMBE0sIZL2OCbaSRQ\ndfacQscNrayYcWgXl8cQdqXHyC7yDjaD3yJMr0gEkdOLuYSouUuLtFjgPyu2zwiz\nb0CuoHUg/hTQwd3X91Tdm5ifkqn3lpnTXrLdpvBGvQWjEins5Eb6Rm5q66rd89IO\neAeia2QBx5hbIhcsDn57L/P1cQKBgQDIJZXVk1C1vjAzjiDbf3FDf3xqCl6nzsuM\nV+ZQHzsS8yphYHgsF+vgwx46ghmk3dK68a+e0tmIjHn/4blaavWh8S4cBdrHNh02\nnISdoruCmTkzeCP3BxpP3rXyskmrw/UYfNf74GmbTvn05DL7EhzSrGb/kcoUVWkA\nGNcTA1BnuwKBgQCYFlVCCtriMZu8K0wcx7cs9Wi7rZxZV4aecjUzqlCc7RClJ1Xv\ncxmEQHSWcYdLNdcJdV8qoqbGi9sU6mYy4GiCUOMqF6HzRgxhGffx7X6M+7c+yfOy\n5CsfE5dIVJYTvWbivnGAs77Dkn/KuDf+DRsgG2pR9dEMxqxDFLwnc1UkEQKBgD49\nUebktMiPqDWgER+w9evjjTD8oIrWh/3Qp9Jqo9g0vg0iDrzHg5aVlqTjKE5YnNt9\npPti3jrUVGv6KcWwVUpS0d/tAifI8DS3X5YVsPHf7CXRSn3bO5dyzmn2f2pmuaUv\nzYqKMs0VNi2teR0SeNwauLzo/UptdQWOs/M5qJtZAoGBAK5NcIGzUBniySsOH3RK\nyfeqOJAoU3nZ+Bofo8M4m2AxBVUeCCWQlwk3fq8r+2T+rzFUVlgHFc3TVpYMtWbJ\nzNBSmRIb/6zr71b/uG6nrMjv6uXUWi5pOIdpqBGMDxMqry+yoGMHcypmiVKc3hdE\n8cIHRsfTUv6YI5qSu56JmVo+\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@ulak-b4965.iam.gserviceaccount.com",
  "client_id": "112704420866753098514",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40ulak-b4965.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};
// -------------------------------------------------------------------------------------------------------------

// Sunucu (Netlify) her çalıştığında Firebase'in defalarca başlatılmasını engeller
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

exports.handler = async function (event, context) {
  // CORS (Çapraz Site) İzinleri (Github ile Netlify'ın sorunsuz konuşması için eklendi)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS, POST'
  };

  // Uç kontrol isteklerine (OPTIONS) anında yeşil ışık yak
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Sadece POST isteklerini kabul ediyoruz
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Sadece POST metoduna izin verilir' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { token, title, body } = data;

    // Cihaz kimliği yoksa bildirim yollayamayız
    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'FCM Token eksik' })
      };
    }

    // Gönderilecek Push Notification (Bildirim) Şablonu
    const message = {
      notification: {
        title: title || 'Yeni Mesaj',
        body: body || 'Sana bir mesaj gönderdi.',
      },
      webpush: {
        headers: {
          Urgency: 'high',
          TTL: '86400',
        },
        notification: {
          title: title || 'Yeni Mesaj',
          body: body || 'Sana bir mesaj gönderdi.',
          icon: 'https://fatihpatir.github.io/ulak/assets/icon.png',
          badge: 'https://fatihpatir.github.io/ulak/assets/icon.png',
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: 'https://fatihpatir.github.io/ulak/',
        },
      },
      token: token,
    };

    // Firebase Cloud Messaging üzerinden mektubu postala!
    const response = await admin.messaging().send(message);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, messageId: response })
    };

  } catch (error) {
    console.error('Bildirim gönderme hatası:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Bildirim gönderilemedi', details: error.message })
    };
  }
};
