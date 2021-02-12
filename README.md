![stability-stable](https://img.shields.io/badge/stability-stable-green.svg)
![version](https://img.shields.io/badge/version-1.0.0-green.svg)
![maintained](https://img.shields.io/maintenance/yes/2021.svg)
[![maintainer](https://img.shields.io/badge/maintainer-daniel%20sörlöv-blue.svg)](https://github.com/DSorlov)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://img.shields.io/github/license/DSorlov/express-versioned-router)

# express-versioned-router
Simple node module that provides versioning for express routes commonly used api.

## Install
`npm install express-versioned-routes`

## Usage

Follows semver versioning format. See https://github.com/npm/node-semver for more info about the format. This module however does not rely on that or any other module.

```
    const app = require('express')();
    const versionedRouter = require('express-versioned-router');
    app.listen(3000);
    app.use(versionedRouter.InitByHeader());

    app.get('/test', versionedRouter.Process({
        "1.0.0": v1Handler,
        "~2.1.0": v2Handler
    }, (req,res,next) => {
        res.status(404).send("version not found");
    }));

    // curl -s -H 'x-api-version: 1.0.0' localhost:3000/test
    // version 1.0.0 or 1.0 or 1 !
    function v1Handler(req, res, next) {
       res.status(200).send('serving version 1.0');
    }

    //curl -s -H 'x-api-version: 2.1.3' localhost:3000/test
    //Anything from 2.1.0 to 2.1.9
    function v2Handler(req, res, next) {
       res.status(200).send('serving version 2.1');
    }
```

## Methods

`Process(object,default)`

Is the main worker that does the magic rouing, requires atleast one of the init methods to be called first or the `requested_version` on the request object to be set.

***object***: A simple key/value object containing the version string and the function to call (`{"version": method, "anotherversion": anothermethod}`)

***default***: Either a version number that will be the default, or a function to handle default cases (`(req, res, next) => {}`)

`InitByHeader(header)`

Initializes the `requested_version` field on the request object if not already initialized, will not overwrite. Used by `Process`. Will by default look in the `x-api-version` and `accept-version` headers of the incomming request.

***header*** (optional): If using another header than the two defaults, it may be specified as string.

`InitByQuery(parameter)`

Initializes the `requested_version` field on the request object if not already initialized, will not overwrite. Used by `Process`. Will by default look in the `api-version` and `version` query parameter of the incomming request.

***parameter*** (optional): If using another parameter than the two defaults, it may be specified as string.

`InitByAccept()`

Initializes the `requested_version` field on the request object if not already initialized, will not overwrite. Look in the `Accept` header. Used by `Process`.

`InitByValue(version)`

Initializes the `requested_version` field on the request object if not already initialized, will not overwrite. For troubleshooting or other static usages. Used by `Process`.

***version***: A version string to set.
