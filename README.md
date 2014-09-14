# angular-oniyi-configurator
This package provides a configurationLoader as injectable to your Angular project.
It helps you to maintain your configuration in JSON-formatted files on the server and require them from your application as needed.
Additionally, it makes it very easy to overload / extend your main configuration with environment specific values.

That said, you can have a general / main configuration extended by environment specific sub-sets of the same configuration properties.

### Installation

```
$ bower install angular-oniyi-configurator
```

# Usage

To load a component's configuration from within e.g. a factory, do the following:
```javascript
    angular
        .module('myApp', [
            'oniyi.configurator' // injecting this module into your applications
        ])
        .config(function(configServiceProvider) {
            configServiceProvider.setEnvironment('development');
        })
        .factory('myFactory', function($q, $http, configService) { //inject the configService from oniyi.configurator
            function loadSomething(){
                var deferred = $q.defer();
                // load our configuration from the server
                configService.get('myApp').then(function(config){
                    // configuration was loaded successfully, use it in subsequent code
                    $http.get(config.url)
                        .success(function(data){
                            deferred.resolve(data);
                        })
                        .error(deferred.reject);
                }, function(reason){
                    // an error occured while loading the configuration. handle it accordingly
                    $log.warn('Failed to load configuration for "myApp"');
                    $log.debug(reason);
                    deferred.reject(reason);
                });
                return deferred.promise;
            }

            return {
                something: loadSomething
            };
        })
```

The code above will load a JSON formatted text file from `configurations/myApp.json` and another one from `configurations/env/development/myApp.json`, parse both into javaScript objects, merge them and provide the result as parameter in a deferred object's success functions.
Properties in environment specific configuration files will superseed properties with the same name / path from the general configuration file (`configurations/myApp.json`).
Once the configuration for a component has been loaded successfully, it will be held in memory (future plans consider leverage of localStorage). Subsequent config requests for the same component will not result in outgoing http calls but be resolved locally.

You can also request for multiple component's configurations in one shot:

    configService.get('componentOne,componentTwo').then(function(config){
        // in this case, config will be an object with the requested component names as keys
        $log.info(config.componentOne.foo);
        $log.info(config.componentTwo.bar);
    })


# configuration options

### setRootPath
Define the root path to the folder holding your configuration files

**defaults to:** `configurations/`

    angular
        .module('myApp', [
            'oniyi.configurator'
        ])
        .config(function(configServiceProvider) {
            configServiceProvider.setRootPath('/configurations/');
        })

### setEnvPath
Define the path to the folder holding your environment specific configuration files.
This folder has to be a sub-folder of `rootPath`.

**defaults to:** `env/`

    angular
        .module('myApp', [
            'oniyi.configurator'
        ])
        .config(function(configServiceProvider) {
            configServiceProvider.setEnvPath('environments/');
        })

will point to `/configurations/environments/` on your webserver

### setFilePostFix
Use this provider function to change the filename extension for configuration files.

**defaults to:** `.json`

    angular
        .module('myApp', [
            'oniyi.configurator'
        ])
        .config(function(configServiceProvider) {
            configServiceProvider.setFilePostFix('.js');
        })

### setEnvironment
Use this provider function to set the environment folder you want to load configuration files from.
If you don't want to load any environment specific configuration, use `disableEnvironmentConfig()` to disable this feature.
If you require to have hostname specific configurations (use the location's host portion as environment value), activate that behavior by calling `useHostnameAsEnvironment()` on this provider.
If you call this function after you called `disableEnvironmentConfig()`, the loading of environment configurations will be enabled again.

**defaults to:** `.json`

    angular
        .module('myApp', [
            'oniyi.configurator'
        ])
        .config(function(configServiceProvider) {
            configServiceProvider.setEnvironment('development');
        })

will load environment specific configurations from `/configurations/environments/development/<<componentName>>.js`

### disableEnvironmentConfig
Use this provider function to set disable loading of environment specific configurations. By doing so, only configurations from the `rootPath` will be loaded.

    angular
        .module('myApp', [
            'oniyi.configurator'
        ])
        .config(function(configServiceProvider) {
            configServiceProvider.disableEnvironmentConfig();
        })

### useHostnameAsEnvironment
Use this provider function to enable environment specific configuration file loading based on the browser's location's host part.
You MUST either use `setEnvironment('<<yourEnvironment>>')`, `disableEnvironmentConfig()` or this function.

    angular
        .module('myApp', [
            'oniyi.configurator'
        ])
        .config(function(configServiceProvider) {
            configServiceProvider.useHostnameAsEnvironment();
        })


### setComponentNameSeparator
Use this provider to change the componentNameSeparator. This separator is used to split a string provided as argument to `configService.get()` in case you want to receive multiple component configurations with one single call to this module.

**defaults to:** `,`

    angular
        .module('myApp', [
            'oniyi.configurator'
        ])
        .config(function(configServiceProvider) {
            configServiceProvider.setComponentNamesSeparator('+');
        })