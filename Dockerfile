# Dockerfile
FROM node:18-alpine

WORKDIR /app

# ติดตั้ง deps ก่อน (cache-friendly)
COPY package*.json ./
RUN npm ci --omit=dev

# คัดลอกซอร์ส
COPY . .

# สำหรับ sharp บางเครื่องต้องมี libvips อยู่แล้วใน alpine ของ node:18-alpine (โอเค)
# ถ้า build ล้ม ให้เปลี่ยนเป็น node:18-bookworm หรือเพิ่ม apk add build-base python3 vips-dev

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
