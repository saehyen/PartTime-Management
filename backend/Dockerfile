FROM node:18-alpine

# 한국 시간(KST) 타임존 설정
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
    echo "Asia/Seoul" > /etc/timezone && \
    apk del tzdata

ENV TZ=Asia/Seoul

WORKDIR /app

# Python과 빌드 도구 설치 (better-sqlite3 컴파일용)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install --production

COPY . .

# 데이터 디렉토리 생성
RUN mkdir -p /app/data

EXPOSE 15000

CMD ["node", "server.js"]
