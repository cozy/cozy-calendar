{exec} = require 'child_process'
fs     = require 'fs'
logger = require('printit')
            date: false
            prefix: 'cake'

option '-f', '--file [FILE*]' , 'List of test files to run'
option '-d', '--dir [DIR*]' , 'Directory of test files to run'
option '-e' , '--env [ENV]', 'Run tests with NODE_ENV=ENV. Default is test'
option '' , '--use-js', 'If enabled, tests will run with the built files'

options =  # defaults, will be overwritten by command line options
    file        : no
    dir         : no

# Grab test files of a directory recursively
walk = (dir, excludeElements = []) ->
    fileList = []
    list = fs.readdirSync dir
    if list
        for file in list
            if file and file not in excludeElements
                filename = "#{dir}/#{file}"
                stat = fs.statSync filename
                if stat and stat.isDirectory()
                    fileList2 = walk filename, excludeElements
                    fileList = fileList.concat fileList2
                else if filename.substr(-6) is "coffee"
                    fileList.push filename
    return fileList

taskDetails = '(default: ./tests, use -f or -d to specify files and directory)'
task 'tests', "Run tests #{taskDetails}", (opts) ->
    logger.options.prefix = 'cake:tests'
    files = []
    options = opts

    if options.dir
        dirList   = options.dir
        files = walk(dir, files) for dir in dirList
    if options.file
        files  = files.concat options.file
    unless options.dir or options.file
        files = walk "test"


    env = if options['env'] then "NODE_ENV=#{options.env}" else "NODE_ENV=test"
    env += " USE_JS=true" if options['use-js']? and options['use-js']
    env += " PORT=4444"
    logger.info "Running tests with #{env}..."
    command = "#{env} mocha " + files.join(" ") + " --reporter spec --colors "
    command += "--globals setImmediate,clearImmediate "
    command += "--compilers coffee:coffee-script/register"
    exec command, (err, stdout, stderr) ->
        console.log stdout
        console.log stderr
        if err
            err = err
            logger.error "Running mocha caught exception:\n" + err
            process.exit 1
        else
            logger.info "Tests succeeded!"
            process.exit 0

task "lint", "Run Coffeelint", ->
    process.env.TZ = "Europe/Paris"
    command = "coffeelint "
    files = walk 'server/'
    files = files.concat walk 'client/app', ['fr.coffee', 'en.coffee']
    command += " -f coffeelint.json #{files.join ' '}"
    logger.options.prefix = 'cake:lint'
    logger.info 'Start linting...'
    exec command, (err, stdout, stderr) ->
        if err
            logger.error err
        else
            logger.info stdout

task 'build', 'Build CoffeeScript to Javascript', ->
    logger.options.prefix = 'cake:build'
    logger.info "Start compilation..."
    command = "coffee -cb --output build/server server && " + \
              "coffee -cb --output build/ server.coffee && " + \
              "rm -rf build/server/mails/en && " + \
              "rm -rf build/server/mails/fr && " + \
              "mkdir build/server/mails/en && " + \
              "mkdir build/server/mails/fr && " + \
              "cp server/mails/fr/*.jade build/server/mails/en/ && " + \
              "cp server/mails/en/*.jade build/server/mails/fr/ && " + \
              "rm -rf build/client && mkdir build/client && " + \
              "coffee -cb --output build/client/app/locales client/app/locales && " + \
              "cp -R client/*.jade build/client/ && " + \
              "cp -R client/public build/client/"
    exec command, (err, stdout, stderr) ->
        if err
            logger.error "An error has occurred while compiling:\n" + err
            process.exit 1
        else
            logger.info "Compilation succeeded."
            process.exit 0
