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
    attrs = candidate['attributes'] || {}
    [
      candidate['id'],
      attrs['first-name'] || '',
      attrs['last-name'] || '',
      attrs['email'] || ''
    ]
  rescue StandardError => e
    warn "[csv_generator] Error extracting candidate #{candidate['id']}: #{e.message}"
    [candidate['id'], '', '', '']
  end

  def process_job_applications(csv, candidate_data, job_app_refs)
    job_app_refs.each do |app_ref|
      job_app = find_job_application(app_ref['id'])
      unless job_app
        warn "[csv_generator] Warning: Job application #{app_ref['id']} not found in included data"
        next
      end

      created_at = job_app.dig('attributes', 'created-at') || ''
      csv << (candidate_data + [job_app['id'], created_at])
    end
  end

  def find_job_application(app_id)
    included = @api_response['included'] || []
    included.find { |item| item['type'] == 'job-applications' && item['id'] == app_id }
  end
end
