<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

1. clone this repo

2. `yarn install`

3. change `.env.template` to `.env`

4. turn up the database

```
docker-compose up
```

4. execute the seed

```
http://localhost:3000/api/executeseed
```

6. `yarn start:dev`

## Proyecto

NestShop es una API REST para una tienda en línea desarrollada con NestJS, TypeScript, PostgreSQL y TypeORM. El proyecto permite administrar productos, imágenes, usuarios y autenticación, incluyendo operaciones CRUD, paginación, búsqueda por título, slug o identificador, validación de datos y manejo de errores.

También incorpora comunicación en tiempo real mediante WebSockets para el intercambio de mensajes entre clientes conectados. La arquitectura está organizada por módulos y utiliza DTOs, servicios, controladores, repositorios y transacciones para mantener un código escalable y fácil de mantener.

Se puede usar como template para dar inicio aun proyecto

## Configuración de base de datos

En desarrollo se puede utilizar `SYNC=true` para que TypeORM sincronice las entidades automáticamente. En producción debe utilizarse:

```env
SYNC=false
```

La configuración que utiliza el CLI de TypeORM se encuentra en [`src/database/data-source.ts`](./src/database/data-source.ts). Esta configuración tiene `synchronize: false` y registra las entidades y migraciones del proyecto.

## Migraciones

Las migraciones crean y modifican la estructura de la base de datos. No se debe depender de `synchronize` en producción.

### Crear la migración inicial

La migración inicial debe generarse comparando las entidades contra una base de datos vacía o contra una base controlada:

```bash
yarn migration:generate -- src/database/migrations/InitialSchema
```

El comando genera un archivo dentro de `src/database/migrations/`. Revisa ese archivo antes de subirlo al repositorio.

### Ejecutar migraciones

```bash
yarn migration:run
```

El comando compila el proyecto y ejecuta las migraciones pendientes usando la conexión definida en `.env`. TypeORM registra las migraciones ejecutadas en la tabla `typeorm_migrations`.

### Crear una migración para un cambio nuevo

Después de modificar una entidad, genera una migración con un nombre descriptivo:

```bash
yarn migration:generate -- src/database/migrations/AddPayPalAndPurchaseStatus
yarn migration:run
```

Otros ejemplos:

```bash
yarn migration:generate -- src/database/migrations/AddPurchasePagination
yarn migration:generate -- src/database/migrations/AddShippingAddress
```

### Revertir la última migración

Solo debe utilizarse con cuidado y después de verificar el impacto:

```bash
yarn migration:revert
```

### Despliegue en producción

El orden recomendado es:

```bash
yarn install --frozen-lockfile
yarn build
yarn migration:run:prod
yarn start:prod
```

```

La variable `SYNC` debe permanecer en `false`. Las migraciones deben ejecutarse como un paso explícito del despliegue, antes de iniciar la aplicación.

Si la base de producción ya fue creada anteriormente con `SYNC=true`, no ejecutes directamente una migración inicial que intente crear tablas que ya existen. Primero realiza una estrategia de baseline o genera la migración desde una base limpia y verifica el estado de la base existente.

## Seed de datos

El seed disponible en [`src/seed/seed.service.ts`](./src/seed/seed.service.ts) es únicamente para desarrollo: elimina usuarios y productos antes de insertar los datos iniciales. No debe ejecutarse en producción.

Las migraciones deben utilizarse para cambios de esquema. Para datos iniciales de producción se recomienda un seed no destructivo, una migración específica de datos o una carga manual desde un panel administrativo.
```
