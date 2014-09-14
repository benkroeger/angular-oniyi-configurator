(function(utils) {
  'use strict';
  angular.module('oniyi.configurator', [])
    .provider('configService', function configurationServiceProvider() {
      var config = {
          rootPath: 'configurations/',
          envPath: 'env/',
          filePostFix: '.json',
          componentNamesSeparator: ',',
          useHostnameAsEnvironment: false,
          loadEnvConfig: true
        },
        configCatalog = {},
        componentPromises = {};

      function _setConfigProperty(name, value) {
        if (name && !angular.isUndefined(value)) {
          config[name] = value;
          return config[name];
        }
        return false;
      }

      this.setRootPath = function(value) {
        return _setConfigProperty('rootPath', value);
      };

      this.setEnvPath = function(value) {
        return _setConfigProperty('envPath', value);
      };

      this.setFilePostFix = function(value) {
        return _setConfigProperty('filePostFix', value);
      };

      this.setEnvironment = function(value) {
        _setConfigProperty('loadEnvConfig', true);
        return _setConfigProperty('environment', value);
      };

      this.setComponentNamesSeparator = function(value) {
        return _setConfigProperty('componentNamesSeparator', value);
      };

      this.useHostnameAsEnvironment = function() {
        _setConfigProperty('loadEnvConfig', true);
        return _setConfigProperty('useHostnameAsEnvironment', true);
      };

      this.disableEnvironmentConfig = function() {
        return _setConfigProperty('loadEnvConfig', false);
      };

      this.$get = function configurationServiceFactory($q, $http, $location, $log) {
        function _loadConfiguration(componentName) {
          var deferred = $q.defer();
          if (angular.isString(componentName)) {
            configCatalog[componentName] = configCatalog[componentName] || {};
            componentPromises[componentName] = deferred.promise;
            $http.get(config.rootPath + componentName + config.filePostFix)
              .success(function(mainConfig) {
                utils.extend(true, configCatalog[componentName], mainConfig);
                if (config.loadEnvConfig) {
                  var env = (config.useHostnameAsEnvironment) ? $location.host() : config.environment;
                  if (angular.isString(env)) {
                    $http.get(config.rootPath + config.envPath + env + '/' + componentName + config.filePostFix)
                      .success(function(envConfig) {
                        utils.extend(true, configCatalog[componentName], envConfig);
                        deferred.resolve(configCatalog[componentName]);
                      })
                      .error(function(data, status) {
                        $log.warn('Failed to load environment configuration for component {' + componentName + '}');
                        $log.debug(status);
                        deferred.resolve(configCatalog[componentName]);
                      });
                  } else {
                    $log.warn('no environment configured');
                    deferred.resolve(configCatalog[componentName]);
                  }
                } else {
                  deferred.resolve(configCatalog[componentName]);
                }
              })
              .error(function(data, status, headers, config) {
                $log.error('Failed to load configuration for component {' + componentName + '}');
                $log.debug(status);
                $log.debug(config);
                deferred.reject(status);
              });
          } else {
            deferred.reject('requested component is not valid');
            $log.error('invalid component configuration requested');
            $log.debug(componentName);
          }
          return deferred.promise;
        }

        function _getConfigurations(componentNames) {
          var deferred = $q.defer();
          if (angular.isString(componentNames)) {
            componentNames = componentNames.split(config.componentNamesSeparator);
          }
          if (angular.isArray(componentNames)) {
            if (componentNames.length > 1) {
              var promises = {};
              for (var i = 0; i < componentNames.length; i++) {
                var name = componentNames[i].trim();
                promises[name] = (angular.isUndefined(componentPromises[name])) ? _loadConfiguration(name) : componentPromises[name];
              }
              $q.all(promises).then(function(componentConfigs) {
                deferred.resolve(componentConfigs);
              }, function(reason) {
                $log.debug(reason);
                deferred.reject('at least one of the requested config files was not loaded successfully');
              });
            } else {
              var name = componentNames[0].trim();
              deferred.resolve((angular.isUndefined(componentPromises[name])) ? _loadConfiguration(name) : componentPromises[name]);
            }
          } else {
            deferred.reject('illegal componentNames');
          }
          return deferred.promise;
        }

        return {
          get: function(componentNames) {
            if (angular.isUndefined(componentNames)) {
              return $q.defer().resolve(configCatalog);
            }
            return _getConfigurations(componentNames);
          }
        };
      };
    });
})(oniyi.utils);