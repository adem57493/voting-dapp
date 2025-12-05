# Decentralized Voting Application

Ethereum Blockchain üzerinde çalışan merkezi olmayan, güvenli ve şeffaf oylama sistemi.

![Voting DApp](https://img.shields.io/badge/Blockchain-Ethereum-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.19-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Özellikler

- ✅ **Merkezi Olmayan**: Tüm veriler blockchain üzerinde
- ✅ **Şeffaf**: Herkes sonuçları görebilir
- ✅ **Güvenli**: Değiştirilemez kayıtlar
- ✅ **Anonim**: Gizli oy kullanma
- ✅ **Gerçek Zamanlı**: Anlık sonuç takibi
- ✅ **Admin Paneli**: Seçim yönetimi

## 🛠️ Teknolojiler

- **Smart Contract**: Solidity 0.8.19
- **Blockchain**: Ethereum (veya uyumlu ağlar)
- **Development**: Hardhat
- **Backend**: Express.js
- **Frontend**: Vanilla JS, CSS3
- **Web3**: ethers.js

## 📁 Proje Yapısı

```
voting-dapp/
├── contracts/
│   └── Voting.sol          # Ana smart contract
├── scripts/
│   └── deploy.js           # Deployment script
├── public/
│   ├── index.html          # Oylama sayfası
│   ├── admin.html          # Admin paneli
│   ├── 404.html            # Hata sayfası
│   ├── css/
│   │   ├── main.css        # Ana stiller
│   │   ├── voting.css      # Oylama stilleri
│   │   └── admin.css       # Admin stilleri
│   └── js/
│       ├── config.js       # Konfigürasyon
│       ├── web3Helper.js   # Web3 yardımcı sınıf
│       ├── voting.js       # Oylama mantığı
│       └── admin.js        # Admin mantığı
├── index.js                # Express server
├── hardhat.config.js       # Hardhat config
├── package.json            # Dependencies
├── .env.example            # Env template
└── README.md               # Bu dosya
```

## 🚀 Kurulum

### 1. Gereksinimleri Yükle

```bash
# Node.js (v16+) gerekli
node --version

# Projeye git
cd voting-dapp

# Bağımlılıkları yükle
npm install
```

### 2. Environment Değişkenleri

```bash
# .env dosyası oluştur
cp .env.example .env

# .env dosyasını düzenle
# PRIVATE_KEY ve diğer değerleri gir
```

### 3. Smart Contract Derle

```bash
npx hardhat compile
```

### 4. Contract Deploy Et

**Yerel Ağ (Hardhat):**
```bash
# Terminal 1 - Yerel blockchain başlat
npx hardhat node

# Terminal 2 - Deploy et
npx hardhat run --network localhost scripts/deploy.js
```

**Volta Testnet:**
```bash
npx hardhat run --network volta scripts/deploy.js
```

### 5. Contract Adresini Kaydet

Deploy sonrası gösterilen contract adresini `.env` dosyasına ekle:
```
CONTRACT_ADDRESS=0x...
```

### 6. Sunucuyu Başlat

```bash
npm start
```

### 7. Tarayıcıda Aç

```
http://localhost:3000        # Oylama sayfası
http://localhost:3000/admin  # Admin paneli
```

## 📱 MetaMask Kurulumu

1. [MetaMask](https://metamask.io/) yükle
2. Cüzdan oluştur veya içe aktar
3. Ağ ekle (Hardhat için):
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

## 👨‍💼 Admin İşlemleri

### Aday Ekleme
1. Admin paneline git
2. Admin cüzdanı ile bağlan
3. "Aday Ekle" formunu doldur
4. İşlemi onayla

### Oylamayı Başlatma
1. En az 2 aday ekle
2. Süre belirle (dakika)
3. "Oylamayı Başlat" butonuna tıkla

### Oylamayı Sonlandırma
- Manuel olarak sonlandır veya
- Süre dolana kadar bekle

## 🗳️ Oy Kullanma

1. MetaMask ile bağlan
2. "Seçmen Olarak Kayıt Ol" butonuna tıkla
3. İşlemi onayla
4. Aday seç ve "Oy Ver"
5. İşlemi onayla

## 📜 Smart Contract API

### Okuma Fonksiyonları
```solidity
getElectionStatus()     // Seçim durumu
getAllCandidates()      // Tüm adaylar
getVoterStatus(address) // Seçmen durumu
getRemainingTime()      // Kalan süre
getWinner()             // Kazanan (seçim bitince)
```

### Yazma Fonksiyonları
```solidity
registerVoter()                           // Seçmen kaydı
vote(candidateId)                         // Oy ver
addCandidate(name, party, imageUrl)       // Aday ekle (admin)
startVoting(durationInMinutes)            // Başlat (admin)
endVoting()                               // Bitir (admin)
resetElection(newName, newDescription)    // Sıfırla (admin)
```

## 🌐 API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/contract` | Contract bilgileri |
| GET | `/api/election/status` | Seçim durumu |
| GET | `/api/candidates` | Aday listesi |
| GET | `/api/election/time` | Kalan süre |
| GET | `/api/election/winner` | Kazanan |

## 🔧 Konfigürasyon

### Hardhat Networks

```javascript
// hardhat.config.js
networks: {
    localhost: { url: "http://127.0.0.1:8545" },
    ganache: { url: "http://127.0.0.1:7545" },
    volta: { url: "https://volta-rpc.energyweb.org" },
    sepolia: { url: "https://sepolia.infura.io/v3/..." }
}
```

## 🧪 Test

```bash
npx hardhat test
```

## 📝 Lisans

MIT

## 🤝 Katkıda Bulunma

1. Fork et
2. Feature branch oluştur (`git checkout -b feature/amazing`)
3. Commit et (`git commit -m 'Add amazing feature'`)
4. Push et (`git push origin feature/amazing`)
5. Pull Request aç

## ⚠️ Önemli Notlar

- Bu proje eğitim amaçlıdır
- Production için ek güvenlik önlemleri alın
- Private key'leri asla paylaşmayın
- Testnet'te test edin, sonra mainnet'e geçin

## 📞 İletişim

Sorularınız için issue açabilirsiniz.

---


