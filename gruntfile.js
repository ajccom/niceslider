module.exports = function(grunt) {
  'use strict'
  
  require('load-grunt-tasks')(grunt)
  
  require('time-grunt')(grunt)
  
  var config = {
    src: 'src',
    dest: 'dest'
  }
    
  grunt.initConfig({
    config: config,
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['<%= config.src %>/*.js', 'Gruntfile.js']
    },
    uglify: {
      'build': {
        src: '<%= config.src %>/*.js',
        expand: true,
        ext: '.min.js',
        extot: 'last'
      }
    }
  })
  grunt.registerTask('default', ['uglify'])
}