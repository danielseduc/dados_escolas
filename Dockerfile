# Usa a imagem Node.js oficial
FROM node:22

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos necessários para o contêiner
COPY package*.json ./
COPY server.js ./
COPY .env ./
COPY public/ ./public

# Instala as dependências
RUN npm install

# Expõe a porta usada pelo backend
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"]
