# Usa a imagem oficial do NGINX
FROM nginx:stable-alpine

# Copia os arquivos do frontend para o diretório padrão do NGINX
COPY public /usr/share/nginx/html

# Exposição da porta padrão do NGINX
EXPOSE 80

# Comando padrão do NGINX
CMD ["nginx", "-g", "daemon off;"]
