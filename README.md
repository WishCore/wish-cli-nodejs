# Wish CLI

A simple REPL based command line tool for accessing the Wish Core. 

Probably works with several different node.js versions, but if you encounter problems, try using v6.9.2.

## Install

```sh
npm install -g wish-cli
```

## Run

```sh
wish-cli
```

or

```sh
TCP=1 CORE=localhost:9094 wish-cli
```

## Parameters

```sh
TCP=1                 # connect using plain tcp without encryption
CORE=localhost:9094   # connect to core on localhost at port 9094, default is localhost:9090
WSID=cli              # set the service id WSID, defaults to cli.
```
