# Node.js resmi imajını kullan
FROM node:20

# Çalışma dizini oluştur
WORKDIR /app

# package.json ve package-lock.json'ı kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Projenin tüm dosyalarını kopyala
COPY . .

# Uygulamayı başlat
CMD ["npm", "start"]
