# Iniciando nosso primeiro container

## No exemplo, vou criar um container para um projeto simples em NODEJS.

- Crie uma pasta no seu "workspace" chamada `node-docker-example-app`;
- Entre no diretorio `node-docker-example-app` e crie o `package.json`;

`package.json`
```
{
  "name": "docker",
  "version": "1.0.0",
  "description": "Node.js on Docker",
  "author": "João Pedro <pedro.abreu@catskillet.com>",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "nodemon index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.17.1",
    "mysql": "^2.18.1",
    "nodemon": "^2.0.7"
  }
}
```

- Depois rode: 
  ```npm install``` or ```yarn```
- Crie um arquivo `index.js` na raiz do projeto;

```
const express = require('express');

const PORT = 3000;
const HOST = '0.0.0.0';

const app = express();

app.get('/', (req, res) => {
  res.send('Olá mundo!');
});

app.listen(PORT, HOST);
```

## AGORA VAMOS PARA O TAL DO DOCKER :)

- Crie um arquivo chamado `Dockerfile` na raiz do projeto;

`Dockerfile`
```
# Imagem
FROM node:alpine

# Criando o diretorio do app
WORKDIR /usr/src/app

# Copia e instala todas as dependencias do projeto
COPY package*.json ./
RUN npm install

# Copiar todo o código fonte do projeto para dentro do container
COPY . .

# O app se liga à porta 3000, portanto, você usará a instrução EXPOSE para que seja mapeado pelo daemon do docker:
EXPOSE 3000

# Por último, mas não menos importante, defina o comando para executar seu aplicativo usando CMD, que define o inicio da aplicação. Aqui, usaremos o npm start para iniciar o nosso servidor:
CMD ["npm", "start"]
```

- Para não levar "lixo" gerado, como o `node_modules` ou `*.logs`, adicionaremos o `.dockerignore` na raiz do projeto;
`.dockerignore`
```
node_modules
*.log
```

## Agora construiremos nossa imagem Docker

```docker build . -t node-docker-example-app```

##### ps: A flag -t permite marcar sua imagem para que seja mais fácil encontrá-la posteriormente usando o comando:
  ```docker ps -a```

#### Depois do build rode a imagem
  ```docker run -p 3000:3000 -d node-docker-example-app```

## Comandos úteis
#### Imprime na tela todos containers
  ```docker ps -a```

#### Print os logs da aplicação
  ```docker logs <container_id>```
  ```docker logs -f <container_id>```

### Testando app de exemplo
Abra no browser o seguinte endereço: http://localhost:3000


## Nosso primeiro `docker-compose.yml`

`docker-compose.yml`
```
# Versão do docker-compose que será executado
version: "3.5"

# Volumes para armazenamento local de arquivos e banco de dados
volumes:
# Nome do volume
  node_base:
    driver: local

# Rede para compatilhameto de dados entre varios containers. Normalmente eles conversam entre si pelo o nome do "service", porém também é possível fazer pelo o IP do container.
# ps: Funciona como uma "lan house" onde todos os containers conseguem se ver e trocar dados um com os outros.
networks:
  node_base_network:
    driver: bridge

services:
  db:
    image: "mysql/mysql-server:latest"
    command: "--default-authentication-plugin=mysql_native_password --character-set-server=utf8 --collation-server=utf8_unicode_ci"
    container_name: "node_base"
    ports:
      - "3306:3306"
    environment:
      - MYSQL_DATABASE=node_base
      - MYSQL_ROOT_PASSWORD=secret
      - MYSQL_ROOT_HOST=%
      - MYSQL_USER_HOST=%
      - MYSQL_USER=docker
      - MYSQL_PASSWORD=secret
    healthcheck:
      test: [ "CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -u docker --password=secret" ]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - node_base:/var/lib/mysql
    networks:
      - node_base_network
  adminer:
    image: adminer
    container_name: adminer
    depends_on:
      - db
    ports:
      - 3001:8080
    networks:
      - node_base_network
  app:
    container_name: node_app
    build: .
    depends_on:
      - db
    command: npm start
    ports:
      - "3000:3000"
    volumes:
      - .:/usr/app
    networks:
      - node_base_network
```

#### Com isso feito, precisaremos mexer no nosso index.js para adicionarmos codigo para testar a conexão com o banco de dados.

`index.js`
```
const express = require('express');
var mysql = require('mysql');

const PORT = 3000;
const HOST = '0.0.0.0';

const app = express();

var connection = mysql.createConnection({
  host     : 'db',
  database : 'node_base',
  user     : 'root',
  password : 'secret',
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});

connection.end();

app.get('/', (req, res) => {
  res.send('Olá mundo!');
});

app.listen(PORT, HOST);
```

## Agora como faremos para subir esse novo ambiente?

#### Simples! Agora basta rodar o seguinte comando:
```docker-compose up```

#### Para rodar os containers em background e liberar o terminal
```docker-compose up -d```

## Comandos úteis:
#### Derruba todos os containers do docker-compose.yml
```docker-compose down```

#### Refaz o build do container (quando houver alteração no Dockerfile)
```docker-compose up --build```

#### Imprime informações do network, entre elas quais containers estão dentro dessa network
```docker-compose network inspect <nome_networ> # Definido no network docker-compose.yml```



