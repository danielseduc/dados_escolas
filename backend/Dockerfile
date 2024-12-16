FROM node:22

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos necessários para o contêiner
COPY package*.json ./
COPY . .

# Instala as dependências
RUN npm install

# Expõe a porta do backend
EXPOSE 3000

# Inicia o servidor com nodemon para desenvolvimento
CMD ["npx", "nodemon", "server.js"]
