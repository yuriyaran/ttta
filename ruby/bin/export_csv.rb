#!/usr/bin/env ruby
# frozen_string_literal: true

require 'json'
require_relative '../lib/csv_generator'

begin
  # Read JSON data from stdin
  input = $stdin.read

  if input.nil? || input.empty?
    warn 'Error: No input data provided via stdin'
    exit 1
  end

  data = JSON.parse(input)
  generator = CsvGenerator.new(data)
  csv = generator.generate

  puts csv
  exit 0
rescue JSON::ParserError => e
  warn "Error parsing JSON: #{e.message}"
  exit 1
rescue StandardError => e
  warn "Error: #{e.message}"
  exit 1
end
