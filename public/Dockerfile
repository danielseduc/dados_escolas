# Usa uma imagem do NGINX para servir os arquivos estáticos
FROM nginx:stable-alpine

# Copia os arquivos do frontend para o contêiner NGINX
COPY . /usr/share/nginx/html

# Expõe a porta padrão do NGINX
EXPOSE 80

# Comando padrão para iniciar o NGINX
CMD ["nginx", "-g", "daemon off;"]
