# frozen_string_literal: true

require 'csv'

# CsvGenerator handles the conversion of Teamtailor API response to CSV format.
class CsvGenerator
  def initialize(api_response)
    @api_response = api_response
  end

  def generate
    CSV.generate do |csv|
      csv << %w[candidate_id first_name last_name email job_application_id job_application_created_at]

      @api_response['data'].each do |candidate|
        process_candidate(csv, candidate)
      end
    end
  end

  private

  def process_candidate(csv, candidate)
    candidate_data = extract_candidate_data(candidate)
    job_app_refs = candidate.dig('relationships', 'job-applications', 'data') || []

    if job_app_refs.empty?
      csv << (candidate_data + [nil, nil])
    else
      process_job_applications(csv, candidate_data, job_app_refs)
    end
  end

  def extract_candidate_data(candidate)
    [
      candidate['id'],
      candidate['attributes']['first-name'],
      candidate['attributes']['last-name'],
      candidate['attributes']['email']
    ]
  end

  def process_job_applications(csv, candidate_data, job_app_refs)
    job_app_refs.each do |app_ref|
      job_app = find_job_application(app_ref['id'])
      next unless job_app

      csv << (candidate_data + [job_app['id'], job_app['attributes']['created-at']])
    end
  end

  def find_job_application(app_id)
    included = @api_response['included'] || []
    included.find { |item| item['type'] == 'job-applications' && item['id'] == app_id }
  end
end
