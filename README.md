Install Keycloak in Docker
```
docker-compose up -d
```


Build the Vue.js project
```
cd frontend
```


```
yarn install
```


Build for Development:
```
yarn electron:serve
```

Build for Prod:
```
yarn eletron:build 
```

## Login:

The keyclock config includes example users from Planet Express (the username is the same as the password, e.g. fry/fry and bender/bender).