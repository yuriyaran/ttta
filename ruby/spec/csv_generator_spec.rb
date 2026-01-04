# frozen_string_literal: true

require 'spec_helper'
require 'json'
require_relative '../lib/csv_generator'

RSpec.describe CsvGenerator do
  let(:fixture_path) { File.join(__dir__, 'fixtures', 'candidates_response.json') }
  let(:api_response) { JSON.parse(File.read(fixture_path)) }
  let(:generator) { described_class.new(api_response) }

  describe '#generate' do
    it 'returns a CSV string' do
      csv = generator.generate

      expect(csv).to be_a(String)
    end

    it 'includes expected CSV headers' do
      csv = generator.generate

      expect(csv).to include('candidate_id,first_name,last_name,email,job_application_id,job_application_created_at')
    end

    it 'includes CSV header row' do
      csv = generator.generate
      lines = csv.split("\n")

      expect(lines.first).to eq('candidate_id,first_name,last_name,email,job_application_id,job_application_created_at')
    end

    it 'generates correct number of rows' do
      csv = generator.generate
      lines = csv.split("\n")

      # Header + 1 (Amos with 1 app) + 1 (Randy with 0 apps) + 2 (Sarah with 2 apps) = 5
      expect(lines.length).to eq(5)
    end

    it 'includes candidate with one job application' do
      csv = generator.generate

      expect(csv).to include('1,Amos,Marvin,applicant1@example.com,101,2020-11-01T09:00:00.000+01:00')
    end

    it 'includes candidate without job application with empty fields' do
      csv = generator.generate
      lines = csv.split("\n")

      candidate_2_row = lines.find { |line| line.include?('Randy') }
      expect(candidate_2_row).to eq('2,Randy,Hyatt,applicant2@example.com,,')
    end

    it 'includes first job application for candidate with multiple applications' do
      csv = generator.generate

      expect(csv).to include('3,Sarah,Chen,sarah.chen@example.com,102,2020-11-06T10:15:00.000+01:00')
    end

    it 'includes second job application for candidate with multiple applications' do
      csv = generator.generate

      expect(csv).to include('3,Sarah,Chen,sarah.chen@example.com,103,2020-11-10T16:30:00.000+01:00')
    end
  end
end
