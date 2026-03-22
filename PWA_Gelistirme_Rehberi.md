# PWA'ya Giriş: Modern Web, Mobil ve Oyun Geliştirme Rehberi

Bu rehber, **Fatih PATIR** (Nene Hatun MTAL Bilişim Teknolojileri Öğretmeni) tarafından, öğrencilerin modern yazılım dünyasına ilk adımlarını profesyonel standartlarda atabilmeleri için hazırlanmıştır.

## 1. TEMEL KAVRAMLAR VE ARAÇLAR
Yazılım geliştirme sürecinde kullanacağımız dijital yardımcıları tanıyalım:

*   **Yapay Zeka Asistanları (Gemini, ChatGPT, Claude vb.):** Senin kıdemli yazılım ortağındır. Kod yazar, hataları ayıklar ve tasarım fikirleri verir. Hangi aracı seçersen seç, ona ne kadar net komut verirsen o kadar iyi sonuç alırsın.
*   **GitHub:** Kodlarının dünyadaki evi. Projelerini yedeklediğin, versiyonlarını sakladığın ve ücretsiz olarak tüm dünyaya yayınladığın platformdur.
*   **PWA (Progressive Web App):** Web siteni, telefonlara "uygulama" gibi kurulabilmesini sağlayan teknolojidir. Bu sayede siten, tarayıcı çubuğu olmadan tam ekran çalışır ve ana ekranda bir simgeye sahip olur.

## 2. DOSYA TÜRLERİ VE GÖREVLERİ
Karmaşık bir projede her dosyanın ayrı bir görevi vardır. Kodları tek bir dosyada toplamak yerine ayırmak, yönetimi kolaylaştırır:

| Dosya Adı | Uzantısı | Görevi |
| :--- | :--- | :--- |
| `index.html` | `.html` | Uygulamanın iskeletidir. Metinler, butonlar ve giriş alanları burada bulunur. |
| `style.css` | `.css` | Görsel tasarımdır. Renkler, yazı tipleri, animasyonlar ve yerleşim burada belirlenir. |
| `script.js` | `.js` | Uygulamanın beynidir. Butona basınca ne olacağını, verilerin nasıl işleneceğini kontrol eder. |
| `manifest.json`| `.json` | PWA'nın kimlik kartıdır. Uygulama adı, tema rengi ve ikon bilgilerini içerir. |
| `sw.js` | `.js` | Service Worker dosyasıdır. Uygulamanın çevrimdışı çalışmasını sağlar. |
| `icon.png` | `.png` | Uygulamanın ana ekrandaki ve bildirimlerdeki görsel simgesidir. |
| `assets/` | (Klasör) | Resimler, sesler veya yazı tipi dosyalarını düzenli tutmak için kullanılan klasördür. |

## 3. ADIM ADIM GELİŞTİRME SÜRECİ

### A. Bilgisayar Hazırlığı (Zorunlu Ayar)
Kod yazarken dosya uzantısını görememek, yapılan en büyük hatadır.
1. Bilgisayarınızda herhangi bir klasörü açın.
2. Üst menüden **Görünüm (View)** sekmesine tıklayın.
3. **"Dosya adı uzantıları"** kutucuğunu işaretleyin. Böylece `index.html.txt` gibi hataların önüne geçersiniz.

### B. Proje Klasörü ve İkon Tasarımı
1. Masaüstünde her proje için yeni bir klasör açın (Örn: `Kelime-Oyunu`).
2. Yapay zekaya (Gemini veya ChatGPT) bir ikon tasarlatın: *"Bana bu proje konusuyla ilgili kare şeklinde, modern bir ikon oluştur."*
3. İkonu indirin, adını `icon.png` yapın ve klasörünüze atın.

### C. Kodlama: Yapay Zekadan Doğru İstek Yapma
Yapay zekadan kod isterken şu "Altın Komutu" kullanın:
> *"Bana [Proje Konusu] için bir PWA kodu hazırla. HTML, CSS ve JavaScript kodlarını ayrı dosyalarda ver. Sağ üstte bir 'i' butonu olsun ve tıklandığında popup penceresi açılsın. Manifest ve Service Worker ayarlarını da ekle. İkon olarak icon.png kullan."*

### D. Yerel (Local) Çalıştırma ve Test
1. Yapay zekanın verdiği her kod bloğunu, klasörünüzde oluşturduğunuz ilgili dosyalara (`index.html`, `style.css` vb.) yapıştırın.
2. `index.html` dosyasına çift tıklayarak tarayıcıda açın.
3. **Hata veya Değişiklik İsteği:** Eğer beğenmediğiniz bir yer olursa, yapay zekaya *"Şu kısmı şu şekilde değiştir ve bana ilgili dosyanın kodunun tamamını ver"* deyin.
4. **Kontrol:** Yerelde (kendi bilgisayarınızda) her şey tam istediğiniz gibi çalışana kadar GitHub aşamasına geçmeyin.

## 4. GİTHUB ÜZERİNDEN DÜNYAYA YAYINLAMA
Yerelde biten projeyi şimdi internete yüklüyoruz:

1. **Repository Oluşturma:** GitHub hesabınızda "New" diyerek yeni bir depo açın. İsim verin ve "Public" seçeneğini işaretleyin.
2. **Dosyaları Aktarma:** "uploading an existing file" seçeneğine tıklayın. Klasörünüzdeki tüm dosyaları (`html`, `css`, `js`, `json`, `png`) seçip buraya sürükleyin.
3. **Kaydetme:** Sayfanın altındaki "Commit changes" butonuna basın.
4. **Yayına Alma (GitHub Pages):**
   * Deponun içindeki **Settings (Ayarlar)** sekmesine gidin.
   * Sol menüden **Pages** kısmını seçin.
   * Build and deployment altındaki **"Branch"** kısmını `main` (veya `master`) yapıp **Save** deyin.
   * 1-2 dakika sonra sayfanın üstünde projenizin `https://kullaniciadi.github.io/proje-adi/` şeklindeki canlı linki belirecektir.

## 5. PROJE GÜNCELLEME DÖNGÜSÜ
Canlıdaki projenizde bir güncelleme yapmak istediğinizde şu yolu izleyin:

1. **AI ile Düzenle:** Yapay zekadan yeni kodu isteyin.
2. **Yerelde Güncelle:** Bilgisayarınızdaki ilgili dosyayı açın. `Ctrl+A` ile hepsini seçip silin, `Ctrl+V` ile yeni kodu yapıştırıp kaydedin.
3. **Yerelde Test Et:** Tarayıcıyı yenileyip değişikliği görün.
4. **GitHub'a Gönder:** GitHub deponuza gidip tekrar *Add file > Upload files* deyin. Değişen dosyayı tekrar yükleyin ve *Commit changes* butonuna basın. Siteniz saniyeler içinde güncellenecektir.

---
**Nene Hatun MTAL Korkuteli/Antalya Bilişim Teknolojileri Öğretmeni - Fatih PATIR**
