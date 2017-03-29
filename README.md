# Wish CLI

A simple REPL based command line tool for accessing the Wish Core. 

Probably works with several different node.js versions, but if you encounter problems, try using v6.9.2.

More documetation will be added in good time.

## Install

```sh
npm install -g wish-cli
```

## Run

```sh
wish-cli
```

## Parameters

```sh
TCP=1                 # connect using plain tcp without encryption (default)
CORE=localhost:9090   # connect to core on localhost at port 9090, default is localhost:9094
WSID=cli              # set the service id WSID, defaults to cli.
```
