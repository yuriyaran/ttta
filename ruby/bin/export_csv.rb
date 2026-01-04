#!/usr/bin/env ruby
# frozen_string_literal: true

require 'json'
require_relative '../lib/csv_generator'

begin
  # Read JSON data from stdin
  input = $stdin.read

  if input.nil? || input.empty?
    warn '[export_csv] Error: No input data provided via stdin'
    exit 1
  end

  data = JSON.parse(input)
  
  # Validate input structure
  unless data.is_a?(Hash) && data.key?('data')
    warn '[export_csv] Error: Invalid JSON structure - missing "data" key'
    exit 1
  end
  
  generator = CsvGenerator.new(data)
  csv = generator.generate

  puts csv
  exit 0
rescue JSON::ParserError => e
  warn "[export_csv] Error parsing JSON: #{e.message}"
  warn "[export_csv] Input preview: #{input[0..200]}..."
  exit 1
rescue StandardError => e
  warn "[export_csv] Error: #{e.message}"
  warn "[export_csv] Backtrace: #{e.backtrace.first(3).join(' <- ')}" if e.backtrace
  exit 1
end
