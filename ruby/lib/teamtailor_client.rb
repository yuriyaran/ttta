# frozen_string_literal: true

require 'httparty'
require 'json'

# TeamtailorClient is a wrapper for the Teamtailor API.
class TeamtailorClient
  include HTTParty

  base_uri 'https://api.teamtailor.com/v1'

  def initialize(api_key)
    @api_key = api_key
    raise StandardError, 'API key is required' if @api_key.nil? || @api_key.empty?
  end

  def fetch_candidates
    response = self.class.get(
      '/candidates',
      query: { include: 'job-applications', page: { size: 30 } },
      headers: headers
    )

    raise StandardError, "API request failed with status #{response.code}" unless response.success?

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
