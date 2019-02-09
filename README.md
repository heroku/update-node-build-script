@heroku/update-node-build-script
==========================

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@heroku/update-node-build-script.svg)](https://www.npmjs.com/package/@heroku/update-node-build-script)

To make getting started with Node.js on Heroku easier we will begin executing the `build` script 
by default if it is defined in your `package.json`. This change will go live on **Monday, March 11, 2019**.
Read more about this change in [our FAQ](https://help.heroku.com/P5IMU3MP/heroku-node-js-build-script-change-faq).

For users with an existing `build` script that they may not want run during the build, this will
require some slight modifications to their `package.json`. The modifications are simple and mechanical,
and we have created this CLI tool to make that as easy as possible.

![hyper 2019-02-08 22-59-32](https://user-images.githubusercontent.com/175496/52517799-b549b800-2bf5-11e9-95db-187e7ecc1e54.png)

## Usage

You will need to make sure you are in your application's root directory, then run:

```
$ npx @heroku/update-node-build-script
```

`npx` is a tool that comes with the modern verions of `npm` bundled with Node. If for some reason, `npx` 
is not available on your system, you can install it with the following command:

```
$ npm install -g npx
```

or download and run this package directly:

```
$ cd $APP_DIRECTORY
$ npm install -g @heroku/update-node-build-script
$ update-node-build-script
```

and then you can uninstall it when you are finished:

```
$ npm uninstall -g @heroku/update-node-build-script
```

## What does this command do?

When it runs it will inspect the contents of your `package.json` file, note which `scripts` you have defined,
and suggest a modification that will opt you in to the new build rules while maintaining your existing build behavior.

It will make no changes without your explicit approval. You are also free to make the changes

![hyper 2019-02-08 22-59-32](https://user-images.githubusercontent.com/175496/52517799-b549b800-2bf5-11e9-95db-187e7ecc1e54.png)

Feel free to inspect [the source of this tool](https://github.com/heroku/update-node-build-script/blob/master/src/index.js).

## I don't want to run an npx command on my system

No problem! This tool is provided only as a convenience. The changes are documented in [this FAQ](https://help.heroku.com/P5IMU3MP/heroku-node-js-build-script-change-faq)
and are simple to perform manually.

