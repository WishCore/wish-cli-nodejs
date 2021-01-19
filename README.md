# Wish CLI

A simple REPL based command line tool for accessing the Wish Core. 

This is bleeding egde software and WILL BREAK from time to time, you have been warned.

## Prerequisites

If you are running on Linux x64 or OSX x64 everything should work out of the box according to the instructions below. Windows is not supported yet.

You will need to have an appropriate wish-core (the peer-to-peer identity based communication layer mist is based on). The source is available at: https://github.com/WishCore/wish-c99.

## Install

```sh
npm install -g @wishcore/wish-cli
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

## Commands

### Directory

There is a primitive directory implementation for publishing, finding and befriending identities.

`directory.find(search: string): [DirectoryEntry]`

`directory.publish(uid: Buffer(32))`

`direcotry.friendRequest(uid: Buffer(32), entry: DirectoryEntry)`

### Wish API

Wish Cli reads the available API from the core it connects to using the `methods` request. It is partially self documenting and can be enumerated using the `help()` command.

All commands have the form `some.command(arg1, arg2, argn, callback?: (err, data) => {})`, where `callback` is optional. If no callback is given the answer will be stored in the global variable `result`.

Example command sequence:

```javascript
identity.create('John Doe')
uid = result.uid // store uid for later use
directory.publish(uid)
direcotry.find('My Friend') // will print result, if any
directory.friendRequest(result[7])
```

#### Identity 

Create an identity with `wish-cli`

```javascript
identity.create('John Andersson')
```

```javascript
identity.list(): [Identity]
```

```javascript
identity.remove(uid: Buffer(32)): boolean
```

Update identity `alias` or meta data

```javascript
identity.update(uid, { alias: 'John Doe' });
```

```javascript
identity.update(uid, { telephone: '+358 80 123 1234', BCH: '1kdshfvnksdvjhnfsdkjfvnhsklf', dateOfBirth: '1982-05-05' });
```

Delete meta data. With an exception with `alias` which cannot be deleted.

```javascript
identity.update(uid, { dateOfBirth: null, telephone: null });
```

## Parameters

```sh
CORE=9090             # connect to core on localhost at port 9090, default is 9094
```
