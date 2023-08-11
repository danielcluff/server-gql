# Server - GraphQL

Boilerplate for typescript graphql backend

### create init migration for backend script

npx typeorm migration:generate Initial -d dist/dataSource.js

### Docker stuff

terminal
docker-compose -f DockerCompose.yaml up
docker-compose -f DockerCompose.yaml down

docker build -t my-app:1.0 .
when you adjust the file you rebuild the image
docker rmi imageid
to delete
docker rm
container delete
