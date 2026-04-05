# EntregaDRAProyecto

Este proyecto consiste en una aplicacion web full-stack de busqueda de inmuebles y pisos en la region de Almeria, compuesta por un Frontend desarrollado en Angular y un Backend. Se han realizado diversas integraciones y dockerizado los diferentes servicios para facilitar su despliegue y ejecucion de forma automatizada mediante Docker Compose.

## Como ejecutar el proyecto

Para ejecutar el proyecto de forma completa, es necesario tener instalado Docker y Docker Compose en tu sistema.
Sigue los pasos a continuacion:

1. Clona el repositorio a tu maquina local.
2. Abre una terminal en el directorio raiz del proyecto.
3. Ejecuta el siguiente comando para levantar todos los servicios:

```bash
docker-compose up --build
```

Esto iniciara automaticamente la base de datos, el backend y el frontend. Una vez que los contenedores esten en ejecucion, podras acceder a la aplicacion web desde tu navegador de preferencia. La interfaz grafica (Frontend) se expondra en el puerto 4200 por defecto. Podras acceder desde: http://localhost:4200

Para detener la ejecucion, puedes pulsar Ctrl+C en la terminal o ejecutar el siguiente comando en otra terminal estando en el directorio raiz:

```bash
docker-compose down
```

## Estructura del proyecto

- `frontend`: Contiene la aplicacion Angular con la interfaz de usuario, donde los usuarios pueden buscar inmuebles, aplicar filtros (incluyendo busqueda por barrio) y ver los detalles. 
- `backend`: Contiene la logica del servidor para interactuar con la base de datos (u origenes de datos JSON) y exponer la informacion mediante APIs o sockets.
- `Scripts`: Scripts auxiliares de desarrollo y utilidades.