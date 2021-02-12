'use strict'

class expressVersionedRouter {
   
  static Process(routes,defaultRoute=undefined) {

    var getHighestVersion = (versions) => {
        versions.sort(function(v1, v2) {
            var v1Parts = v1.split('.');
            var v2Parts = v2.split('.');
            v1Parts[0] = v1Parts[0].replace('^', '');
            v1Parts[0] = v1Parts[0].replace('~', '');
            v2Parts[0] = v2Parts[0].replace('^', '');
            v2Parts[0] = v2Parts[0].replace('~', '');
    
            for (var i = 0; i < 2; i ++) {
                if(!v1Parts[i]) {
                    v1Parts[i] = 0;
                }
                if(!v2Parts[i]) {
                    v2Parts[i] = 0;
                }
            }
            if (isNaN(v2Parts[0]) || v1Parts[0] > v2Parts[0]) {
                return 1;
            } else if (isNaN(v1Parts[0]) || v1Parts[0] < v2Parts[0]) {
                return -1;
            } else if (isNaN(v2Parts[1]) || v1Parts[1] > v2Parts[1]){
                return 1;
            } else if (isNaN(v1Parts[1]) || v1Parts[1] < v2Parts[1]) {
                return -1;
            } else if (isNaN(v2Parts[2]) || v1Parts[2] > v2Parts[2]) {
                return 1;
            } else if (isNaN(v1Parts[2]) || v1Parts[2] < v2Parts[2]) {
                return -1;
            } else {
                return 0;
            }
        });
        return versions[versions.length -1];
    };

    var findRoute = (availableVersions, requestedVersion) => {
        for (var i = 0; i < availableVersions.length; i++) {
            var checkVersion = availableVersions[i];
            var requestedVersionParts = requestedVersion.split('.');
            var workingVersion = '';
            var compareVersion = '';

            if (checkVersion[0] === '~') {
                workingVersion = checkVersion.substr(1);
                workingVersion = workingVersion.split('.').slice(0, 2).join('.');
                requestedVersionParts[1] = requestedVersionParts[1] || 0;
                compareVersion = requestedVersionParts.slice(0, 2).join('.');
            } else if (checkVersion[0] === '^') {
                workingVersion = checkVersion.substr(1);
                workingVersion = workingVersion.split('.').slice(0, 1).join('.');
                compareVersion = requestedVersionParts.slice(0, 1).join('.');
            } else {
                workingVersion = checkVersion;
                requestedVersionParts[1] = requestedVersionParts[1] || 0;
                requestedVersionParts[2] = requestedVersionParts[2] || 0;
                compareVersion = requestedVersionParts.join('.');
            }
            if (workingVersion === compareVersion) {
                return checkVersion;
            }
        }

        return;
    };

    var versions = Object.keys(routes);
    if (!defaultRoute) {
        defaultRoute = getHighestVersion(versions);
    }

    return (req, res, next) => {

        if (!req.requested_version) {                  
            if (typeof defaultRoute === 'function') {
                defaultRoute.call(this, req, res, next);
            } else {
                req.resolved_version = defaultRoute;
                routes[defaultRoute].call(this, req, res, next);    
            }
        } else {
            var useRoute = findRoute(versions,req.requested_version);
            if (useRoute) {
                req.resolved_version = useRoute;
                routes[useRoute].call(this, req, res, next);
            } else {
                if (typeof defaultRoute === 'function') {
                    defaultRoute.call(this, req, res, next);
                } else {
                    req.api_resolved_version = defaultRoute;
                    routes[defaultRoute].call(this, req, res, next);    
                }
                }
        }
    }

  }

  //Set default version if not already specified
  static InitByValue(version) {
    return (req, res, next) => {
      if (!req.requested_version) req.requested_version = this.formatVersion(version)
      next()
    }
  }  

    //Method for setting the version by default or specified header names
  static InitByHeader(header) {   
    var parse = (h,r) => { return r && r.headers && r.headers[h] ? r.headers[h] : undefined; };
    return (req, res, next) => {
      if (!req.requested_version) req.requested_version = this.formatVersion(header ? parse(header,req) : parse('x-api-version',req) || parse('accept-version',req));
      next();
    }
  }

  // Method for setting the version by default or specified querystring parameter
  static InitByQuery(param) {
    var parse = (q,r) => { return r && r.query && r.query[q] ? r.query[q] : undefined; };
    return (req, res, next) => {
        if (!req.requested_version) req.requested_version = this.formatVersion(param ? parse(param,req) : parse('api-version',req) || parse('version',req));
        next();
    }
  }

  // Method for setting the version by the accept header
  static InitByAccept() {
    var removeWhitespaces = (str) => { if (typeof str === 'string') { return str.replace(/\s/g, '') } else return '' };

    return (req, res, next) => {

        if (!req.requested_version && req && req.headers && req.headers.accept) {
            const acceptHeader = String(req.headers.accept);

            // First try and use method 1
            const params = acceptHeader.split(';')[1]
            const paramMap = {}
            if (params) {
                for (let i of params.split(',')) {
                const keyValue = i.split('=')
                if (typeof keyValue === 'object' && keyValue[0] && keyValue[1]) {
                    paramMap[removeWhitespaces(keyValue[0]).toLowerCase()] = removeWhitespaces(keyValue[1]);
                }
                }
                req.requested_version = this.formatVersion(paramMap.version)
            }

            // if method 1 did not yeild results try method 2
            if (req.requested_version === undefined) {
                const header = removeWhitespaces(acceptHeader);
                let start = header.indexOf('-v');
                if (start === -1) {
                    start = header.indexOf('.v');
                }
                const end = header.indexOf('+');
                if (start !== -1 && end !== -1) {
                    req.requested_version = this.formatVersion(header.slice(start + 2, end));
                }
            }                
        } else {
            req.requested_version = undefined;
        }

        next();
    }
  }

  static formatVersion(version) {
    if (!version || typeof version === 'function' || version === true) {
      return undefined
    }
    if (typeof version === 'object') {
      return JSON.stringify(version)
    }
    let ver = version.toString()
    let split = ver.split('.')
    if (split.length === 3) {
      return ver
    }
    if (split.length < 3) {
      for (let i = split.length; i < 3; i++) {
        ver += '.0'
      }
      return ver
    }
    if (split.length > 3) {
      return split.slice(0, 3).join('.')
    }
  }
}

module.exports = expressVersionedRouter