# Wish CLI

A Command line interface for wish. Connects to the core as a WishApp.

## Install

```sh
npm install wish-cli
```

## Run

```sh
TCP=1 CORE=localhost:9094 node bin/cli
```

or

```sh
TCP=1 CORE=localhost:9094 node bin/cli
```

## Parameters

```sh
TCP=1                 # connect using plain tcp without encryption
CORE=localhost:9094   # connect to core on localhost at port 9094, default is localhost:9090
WSID=cli              # set the service id WSID, defaults to cli.
```
