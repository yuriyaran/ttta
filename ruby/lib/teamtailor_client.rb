# frozen_string_literal: true

require 'httparty'
require 'json'

# wrapper for the Teamtailor API
class TeamtailorClient
  include HTTParty

  base_uri 'https://api.teamtailor.com/v1'

  def initialize(api_key)
    @api_key = api_key
    raise StandardError, 'API key is required' if @api_key.nil? || @api_key.empty?
  end

  def fetch_candidates(pageAfter: nil)
    page = { size: 30 }
    after  = pageAfter.to_s.strip
    page[:after]  = after  unless after.empty?

    response = self.class.get(
      '/candidates',
      query: {
        include: 'job-applications',
        page: page,
        fields: {
          candidates: 'first-name,last-name,email,job-applications',
          'job-applications': 'created-at'
        },
      },
      headers: headers
    )

    unless response.success?
      error_body = response.body[0..500] rescue 'Unable to read response body'
      raise StandardError, "API request failed with status #{response.code}. Response: #{error_body}"
    end

    JSON.parse(response.body)
  end

  private

  def headers
    {
      'Authorization' => "Token token=#{@api_key}",
      'X-Api-Version' => Time.now.strftime('%Y%m%d'),
      'Content-Type' => 'application/json'
    }
  end
end
