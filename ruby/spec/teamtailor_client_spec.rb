# frozen_string_literal: true

require_relative 'spec_helper'
require 'webmock/rspec'
require 'json'
require_relative '../lib/teamtailor_client'

RSpec.describe TeamtailorClient do
  let(:api_key) { 'test_api_key_123' }
  let(:client) { described_class.new(api_key) }
  let(:api_url) { 'https://api.teamtailor.com/v1/candidates' }
  let(:mock_response) { JSON.parse(File.read(fixture_path)) }

  def fixture_path
    File.join(__dir__, 'fixtures', 'candidates_response.json')
  end

  before do
    WebMock.disable_net_connect!
    # Stub Time.now to return a consistent date for testing
    allow(Time).to receive(:now).and_return(Time.new(2026, 1, 2))
  end

  describe '#fetch_candidates' do
    let(:test_date) { '20260102' }

    context 'when API call is successful' do
      before do
        # Stub must match all query parameters sent by the client
        stub_request(:get, api_url)
          .with(
            query: {
              'include' => 'job-applications',
              'page[size]' => '30',
              'fields[candidates]' => 'first-name,last-name,email,job-applications',
              'fields[job-applications]' => 'created-at'
            },
            headers: {
              'Authorization' => "Token token=#{api_key}",
              'X-Api-Version' => test_date
            }
          )
          .to_return(
            status: 200,
            body: mock_response.to_json,
            headers: { 'Content-Type' => 'application/json' }
          )
      end

      it 'fetches candidates from Teamtailor API' do
        result = client.fetch_candidates

        expect(result).to be_a(Hash)
      end

      it 'returns data key' do
        result = client.fetch_candidates

        expect(result).to have_key('data')
      end

      it 'returns included key' do
        result = client.fetch_candidates

        expect(result).to have_key('included')
      end

      it 'includes job-applications in the request' do
        client.fetch_candidates

        expect(WebMock).to have_requested(:get, api_url)
          .with(query: hash_including('include' => 'job-applications'))
      end

      it 'sends correct authorization header' do
        client.fetch_candidates

        expect(WebMock).to have_requested(:get, api_url)
          .with(query: hash_including('include' => 'job-applications'))
      end

      it 'returns candidates with correct type' do
        result = client.fetch_candidates
        first_candidate = result['data'].first

        expect(first_candidate['type']).to eq('candidates')
      end

      it 'returns candidate attributes with first-name' do
        result = client.fetch_candidates
        first_candidate = result['data'].first

        expect(first_candidate['attributes']).to have_key('first-name')
      end

      it 'returns candidate attributes with last-name' do
        result = client.fetch_candidates
        first_candidate = result['data'].first

        expect(first_candidate['attributes']).to have_key('last-name')
      end

      it 'returns candidate attributes with email' do
        result = client.fetch_candidates
        first_candidate = result['data'].first

        expect(first_candidate['attributes']).to have_key('email')
      end

      it 'returns included job-applications' do
        result = client.fetch_candidates
        job_apps = result['included'].select { |item| item['type'] == 'job-applications' }

        expect(job_apps).not_to be_empty
      end

      it 'includes created-at in job-application attributes' do
        result = client.fetch_candidates
        job_apps = result['included'].select { |item| item['type'] == 'job-applications' }

        expect(job_apps.first['attributes']).to have_key('created-at')
      end
    end

    context 'when API call fails' do
      before do
        stub_request(:get, api_url)
          .with(
            query: {
              'include' => 'job-applications',
              'page[size]' => '30',
              'fields[candidates]' => 'first-name,last-name,email,job-applications',
              'fields[job-applications]' => 'created-at'
            }
          )
          .to_return(status: 401, body: { error: 'Unauthorized' }.to_json)
      end

      it 'raises an error with meaningful message' do
        expect { client.fetch_candidates }.to raise_error(StandardError, /401/)
      end
    end

    context 'when API key is missing' do
      let(:client) { described_class.new(nil) }

      it 'raises an error' do
        expect { client.fetch_candidates }.to raise_error(StandardError, /API key/)
      end
    end
  end
end
