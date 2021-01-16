# frozen_string_literal: true

REDMINE_URL = 'http://localhost:3000'
MAILHOG_URL = 'http://localhost:8025'

desc "SSH into a service. Defaults to 'redmine'."
task :ssh, [:service, :rails_env] do |_t, args|
  args.with_defaults(service: 'redmine', rails_env: 'development')
  sh "docker-compose exec -e RAILS_ENV='#{args.rails_env}' #{args.service} bash"
end

desc 'Execute a Rails command'
task :rails do |_t, args|
  sh "docker-compose exec redmine rails #{args.extras.join(' ')}"
end

desc 'Launch MySQL'
task :mysql, [:user, :pass] do |_t, args|
  args.with_defaults(user: 'root', pass: 'root')
  sh "docker-compose exec mysql mysql -u#{args.user} -p#{args.pass}"
end

desc 'Prepare dev environment.'
task :prepare do
  puts 'Installing dev packages...'
  sleep(2)
  sh 'docker-compose exec redmine bundle install --with default development test'

  puts 'Preparing database...'
  sleep(2)
  sh 'docker-compose exec redmine rake db:seed'

  puts <<~RESULT
    ======
    Redmine is ready!
    ======
  RESULT

  Rake::Task[:info].invoke
end

desc 'Dev env info.'
task :info do
  puts <<~INFO
    Sample time entries exist for john.doe on Nov 03, 2012.

    USERS
    ----------------------------------------------------
    Login    | Email address        | Password
    ----------------------------------------------------
    admin    | admin@example.com    | toggl2redmine
    john.doe | john.doe@example.com | toggl2redmine
    ----------------------------------------------------

    URLS
    ----------------------------------------------------
    Redmine         | #{REDMINE_URL}/
    Toggl 2 Redmine | #{REDMINE_URL}/toggl2redmine
    Mailhog         | #{MAILHOG_URL}/
    ----------------------------------------------------
  INFO
end

desc 'Run Rubocop.'
task :rubocop do
  sh 'docker-compose exec redmine rubocop plugins/toggl2redmine'
end
