#!/usr/bin/env ruby
# frozen_string_literal: true

require 'json'
require_relative '../lib/teamtailor_client'

begin
  api_key = ENV.fetch('API_KEY', nil)

  if api_key.nil? || api_key.empty?
    warn 'Error: API_KEY environment variable is required'
    exit 1
  end

  client = TeamtailorClient.new(api_key)
  result = client.fetch_candidates

  puts JSON.generate(result)
  exit 0
rescue StandardError => e
  warn "Error: #{e.message}"
  exit 1
end
