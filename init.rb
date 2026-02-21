# frozen_string_literal: true

require 'redmine'

# Tell Zeitwerk to ignore this plugin's lib directory
plugin_lib = File.join(File.dirname(__FILE__), 'lib')
Rails.autoloaders.each { |loader| loader.ignore(plugin_lib) }

# Require plugin files
require File.join(plugin_lib, 'toggl_2_redmine')
require File.join(plugin_lib, 'toggl_2_redmine/patches/time_entry_patch')

Redmine::Plugin.register :toggl2redmine do
  # Package info.
  name 'Toggl 2 Redmine'
  author 'Jigarius'
  description 'Imports time entries from Toggl into Redmine.'
  version Toggl2Redmine::VERSION
  url 'https://github.com/jigarius/toggl2redmine'
  author_url 'https://jigarius.com/'

  # Menu items.
  menu :application_menu,
       :toggl2redmine,
       { controller: 't2r_import', action: 'index' },
       caption: 'Toggl'
end
