# Wish CLI

A simple REPL based command line tool for accessing the Wish Core. 

This is bleeding egde software and WILL BREAK from time to time, you have been warned.

This package is dependent on the mist-api package, which currently is working with Linux x64/ia32, OSX x64 and Raspberry Pi, on nodejs v6.x only. To get it working you also need to run a Wish Core on the same host.


## Prerequisites

*If you ended up here by accident, you might not get this to work.*

1) Download and install `node.js` v.6.x. (tested on v6.9.2)

2) Download and run wish-core (https://mist.controlthings.fi/developer).

```sh
wget https://mist.controlthings.fi/dist/wish-core-v0.8.0-beta-2-x64-linux
chmod +x ./wish-core-v0.8.0-beta-2-x64-linux
./wish-core-v0.8.0-beta-2-x64-linux
```

## Install

```sh
npm install -g wish-cli
```

## Run

```sh
wish-cli
```

If everything is working correctly you should be greeted with something like this:

```sh
Welcome to Wish CLI vX.Y.Z
Not everything works as expected! You have been warned.
Connected to Wish Core v0.8.0-beta-2
wish> 
```

Brief API documentation is available 

```javascript
help()
```

Create an identity with `wish-cli`

```javascript
identity.create('John Andersson')
```

## Parameters

```sh
CORE=9090             # connect to core on localhost at port 9090, default is 9094
```
