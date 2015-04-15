module.exports = function (grunt) {
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        less: {
            options:{
                paths: ["app/styles"]
            },

            dist: {
                files: {
                    "app/styles/build/bundle.css": "app/styles/less/index.less"
                }
            }
        },

        browserify: {
            options:{
              browserifyOptions:{
                debug: true
              }
            },
            dist: {
              files: {
                'app/js/build/bundle.js': 'app/js/app.js'
              }
            }
        },

        react: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: "app/js",
                        src: [ "components/*.react.jsx" ],
                        dest: "app/js",
                        ext: ".react.js"
                    }
                ]
            }
        },

        watch: {
            js: {
                files: [
                    'app/js/**/*.js'
                ],
                tasks: ['react:dist', 'browserify:dist']
            },
            styles: {
                files: [
                    'app/styles/less/**/*.less'
                ],
                tasks: ['less:dist']
            }
        }
    });
};