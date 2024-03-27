# ENS Gateway

## Start for UAT

### With Docker Compose

To start the Gateway, you can use Docker Compose:

```shell
docker compose up
```

### With Dockerfile

To start the Gateway, you can use build and run the Dockerfile:

```shell
docker build -t ens-gateway .
```

```shell
docker run -e L1_PROVIDER_URL=https://goerli.infura.io/v3/<INFURA_KEY> -e L2_PROVIDER_URL=https://linea-goerli.infura.io/v3/<INFURA_KEY> -e L2_RESOLVER_ADDRESS=<L2_RESOLVER_ADDRESS> ens-gateway
```

### Tests

Make sure to use the .env.example as your .env (Simply copy paste it and name it .env)

Run the following:

```shell
pnpm i
```

```shell
cd packages/gateway
pnpm compile
pnpm test
```