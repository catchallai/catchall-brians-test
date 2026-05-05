import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

function CodeBlock({ code, language = 'ruby' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-950">
        <span className="text-xs font-mono text-slate-400">{language}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-slate-900 text-slate-100 text-sm p-4 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({ title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left"
      >
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-base">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-6 py-5 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

function Note({ type = 'info', children }) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
    warn: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200',
  };
  return (
    <div className={`text-sm px-4 py-3 rounded-xl border ${styles[type]}`}>{children}</div>
  );
}

const DOMAIN_MODELS = [
  {
    domain: 'CRM / Sales',
    models: [
      { entity: 'Contact', rails: 'Contact', table: 'contacts', fields: 'first_name, last_name, email, phone, status, company_id, owner_email', assoc: 'belongs_to :company; has_many :deals; has_many :activities' },
      { entity: 'Company', rails: 'Company', table: 'companies', fields: 'name, website, industry, tier, country, hq_city', assoc: 'has_many :contacts; has_many :deals' },
      { entity: 'Deal', rails: 'Deal', table: 'deals', fields: 'title, value, stage, probability, expected_close_date, contact_id, company_id', assoc: 'belongs_to :contact; belongs_to :company; has_many :activities' },
      { entity: 'Activity', rails: 'Activity', table: 'activities', fields: 'entity_type, entity_id, activity_type, title, description, performed_by', assoc: 'belongs_to :contact, polymorphic: true' },
      { entity: 'Proposal', rails: 'Proposal', table: 'proposals', fields: 'title, status, contact_id, deal_id', assoc: 'belongs_to :contact; belongs_to :deal' },
    ]
  },
  {
    domain: 'HRIS / People',
    models: [
      { entity: 'HRISEmployee', rails: 'Employee', table: 'employees', fields: 'first_name, last_name, email, department_id, job_title, status, start_date', assoc: 'belongs_to :department; has_many :time_off_requests; has_many :payrolls' },
      { entity: 'HRISDepartment', rails: 'Department', table: 'departments', fields: 'name, description, manager_id', assoc: 'has_many :employees' },
      { entity: 'HRISTimeOffRequest', rails: 'TimeOffRequest', table: 'time_off_requests', fields: 'employee_id, start_date, end_date, type, status', assoc: 'belongs_to :employee' },
      { entity: 'HRISPayroll', rails: 'Payroll', table: 'payrolls', fields: 'employee_id, period, gross_pay, net_pay, status', assoc: 'belongs_to :employee' },
    ]
  },
  {
    domain: 'Finance',
    models: [
      { entity: 'FinanceBudget', rails: 'Budget', table: 'budgets', fields: 'name, amount, period, category', assoc: 'has_many :transactions' },
      { entity: 'FinanceTransaction', rails: 'Transaction', table: 'transactions', fields: 'amount, type, description, date, budget_id', assoc: 'belongs_to :budget' },
      { entity: 'Invoice', rails: 'Invoice', table: 'invoices', fields: 'contact_id, amount, status, due_date', assoc: 'belongs_to :contact; has_many :payments' },
      { entity: 'Vendor', rails: 'Vendor', table: 'vendors', fields: 'name, website, contact_email, status', assoc: 'has_many :vendor_products' },
    ]
  },
  {
    domain: 'Legal / Compliance',
    models: [
      { entity: 'LegalMatter', rails: 'LegalMatter', table: 'legal_matters', fields: 'title, type, status, description, assigned_counsel_id', assoc: 'belongs_to :legal_counsel; has_many :legal_documents' },
      { entity: 'CompliancePolicy', rails: 'CompliancePolicy', table: 'compliance_policies', fields: 'title, category, status, effective_date', assoc: 'has_many :compliance_trainings' },
    ]
  },
];

export default function RailsIntegrationGuide({ selectedEntity }) {
  const entityName = selectedEntity?.name;

  const gemfileCode = `# Gemfile
gem 'httparty'        # HTTP client for Base44 REST API
gem 'dotenv-rails'    # Manage BASE44_APP_ID, BASE44_SERVICE_TOKEN`;

  const initializerCode = `# config/initializers/base44.rb
require 'httparty'

module Base44
  BASE_URL = "https://api.base44.com/api/apps/\#{ENV['BASE44_APP_ID']}/entities"

  def self.headers
    {
      'Content-Type'  => 'application/json',
      'x-api-key'     => ENV['BASE44_SERVICE_TOKEN']
    }
  end

  def self.list(entity, filters: {}, sort: nil, limit: 50)
    params = { _limit: limit }
    params[:_sort] = sort if sort
    params.merge!(filters)
    response = HTTParty.get("\#{BASE_URL}/\#{entity}", headers: headers, query: params)
    response.parsed_response
  end

  def self.get(entity, id)
    response = HTTParty.get("\#{BASE_URL}/\#{entity}/\#{id}", headers: headers)
    response.parsed_response
  end

  def self.create(entity, data)
    response = HTTParty.post("\#{BASE_URL}/\#{entity}", headers: headers, body: data.to_json)
    response.parsed_response
  end

  def self.update(entity, id, data)
    response = HTTParty.put("\#{BASE_URL}/\#{entity}/\#{id}", headers: headers, body: data.to_json)
    response.parsed_response
  end

  def self.delete(entity, id)
    HTTParty.delete("\#{BASE_URL}/\#{entity}/\#{id}", headers: headers)
  end
end`;

  const envCode = `# .env
BASE44_APP_ID=your_app_id_here
BASE44_SERVICE_TOKEN=your_service_token_here`;

  const contactModelCode = `# app/models/concerns/base44_syncable.rb
module Base44Syncable
  extend ActiveSupport::Concern

  included do
    after_create  :sync_to_base44_create
    after_update  :sync_to_base44_update
    after_destroy :sync_to_base44_delete
  end

  private

  def sync_to_base44_create
    Base44.create(self.class.base44_entity, base44_payload)
  rescue => e
    Rails.logger.error "Base44 sync create failed: \#{e.message}"
  end

  def sync_to_base44_update
    return unless base44_id.present?
    Base44.update(self.class.base44_entity, base44_id, base44_payload)
  rescue => e
    Rails.logger.error "Base44 sync update failed: \#{e.message}"
  end

  def sync_to_base44_delete
    return unless base44_id.present?
    Base44.delete(self.class.base44_entity, base44_id)
  rescue => e
    Rails.logger.error "Base44 sync delete failed: \#{e.message}"
  end
end

# app/models/contact.rb
class Contact < ApplicationRecord
  include Base44Syncable

  def self.base44_entity = 'Contact'

  def base44_payload
    {
      first_name: first_name,
      last_name:  last_name,
      email:      email,
      phone:      phone,
      status:     status,
      company_id: company&.base44_id
    }
  end

  # Pull all contacts FROM Base44 into Rails
  def self.import_from_base44(filters: {})
    records = Base44.list('Contact', filters: filters, limit: 200)
    records.each do |r|
      find_or_initialize_by(email: r['email']).tap do |c|
        c.first_name = r['first_name']
        c.last_name  = r['last_name']
        c.phone      = r['phone']
        c.status     = r['status']
        c.base44_id  = r['id']
        c.save!
      end
    end
  end
end`;

  const migrationCode = `# db/migrate/TIMESTAMP_add_base44_id_to_all_tables.rb
class AddBase44IdToAllTables < ActiveRecord::Migration[7.1]
  TABLES = %i[
    contacts companies deals activities proposals
    employees departments time_off_requests payrolls
    budgets transactions invoices vendors
    legal_matters compliance_policies
  ]

  def change
    TABLES.each do |table|
      add_column table, :base44_id, :string, index: true unless
        column_exists?(table, :base44_id)
    end
  end
end`;

  const webhookCode = `# config/routes.rb
post '/webhooks/base44', to: 'webhooks#base44'

# app/controllers/webhooks_controller.rb
class WebhooksController < ApplicationController
  skip_before_action :verify_authenticity_token

  def base44
    payload = JSON.parse(request.body.read)
    entity  = payload.dig('event', 'entity_name')
    type    = payload.dig('event', 'type')      # create / update / delete
    data    = payload['data']

    case entity
    when 'Contact'
      handle_contact(type, data)
    when 'Deal'
      handle_deal(type, data)
    when 'HRISEmployee'
      handle_employee(type, data)
    end

    head :ok
  end

  private

  def handle_contact(type, data)
    contact = Contact.find_or_initialize_by(base44_id: data['id'])
    if type == 'delete'
      contact.destroy
    else
      contact.update!(
        first_name: data['first_name'],
        last_name:  data['last_name'],
        email:      data['email'],
        status:     data['status'],
        base44_id:  data['id']
      )
    end
  end

  def handle_deal(type, data)
    deal = Deal.find_or_initialize_by(base44_id: data['id'])
    type == 'delete' ? deal.destroy : deal.update!(
      title: data['title'], value: data['value'],
      stage: data['stage'], base44_id: data['id']
    )
  end

  def handle_employee(type, data)
    employee = Employee.find_or_initialize_by(base44_id: data['id'])
    type == 'delete' ? employee.destroy : employee.update!(
      first_name: data['first_name'], last_name: data['last_name'],
      email: data['email'], base44_id: data['id']
    )
  end
end`;

  const selectedEntityCode = entityName ? `# Fetching "${entityName}" from Base44 in Rails
records = Base44.list('${entityName}', filters: { status: 'active' }, limit: 50)

# Create a single record
new_record = Base44.create('${entityName}', {
  # fill in your fields here
})

# Update a record
Base44.update('${entityName}', record_id, { status: 'updated' })

# Delete a record
Base44.delete('${entityName}', record_id)

# Rails model example for ${entityName}
class ${entityName} < ApplicationRecord
  def self.base44_entity = '${entityName}'

  def self.import_from_base44
    Base44.list('${entityName}', limit: 500).each do |r|
      find_or_initialize_by(base44_id: r['id']).tap do |record|
        # Map Base44 fields to your Rails columns
        record.base44_id = r['id']
        record.save!
      end
    end
  end
end` : null;

  return (
    <div className="space-y-4">
      {/* Intro */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-sm">⬡</div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ruby on Rails Integration Guide</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This guide shows how to connect your Ruby on Rails application to this Base44 platform via the REST API.
          All entities communicate through <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded text-red-700 dark:text-red-300 text-xs">Base44.list / create / update / delete</code> helpers.
          Use the two-way sync pattern to keep Rails and Base44 in sync.
        </p>
      </div>

      {/* Selected entity shortcut */}
      {selectedEntityCode && (
        <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-violet-700 dark:text-violet-300 mb-1">
            ✦ Quick Reference — <span className="font-mono">{entityName}</span>
          </h3>
          <p className="text-xs text-violet-600 dark:text-violet-400 mb-2">Generated from your selected entity</p>
          <CodeBlock code={selectedEntityCode} language="ruby" />
        </div>
      )}

      {/* Step 1 */}
      <Section title="Step 1 — Setup: Gemfile & Environment" subtitle="Install dependencies and configure credentials" defaultOpen={true}>
        <Note type="info">Add to your <code>.env</code> file — never commit tokens to source control.</Note>
        <CodeBlock code={envCode} language="bash" />
        <CodeBlock code={gemfileCode} language="ruby" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Run <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">bundle install</code> after updating the Gemfile.</p>
      </Section>

      {/* Step 2 */}
      <Section title="Step 2 — Base44 Client Module" subtitle="A reusable module wrapping all API calls">
        <Note type="info">Place this in <code>config/initializers/base44.rb</code> — it's auto-loaded by Rails.</Note>
        <CodeBlock code={initializerCode} language="ruby" />
      </Section>

      {/* Step 3 */}
      <Section title="Step 3 — Add base44_id to Your Tables" subtitle="Migration to track which Rails records map to which Base44 records">
        <Note type="warn">Run this migration on all tables you want to sync with Base44.</Note>
        <CodeBlock code={migrationCode} language="ruby" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Run with: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">rails db:migrate</code></p>
      </Section>

      {/* Step 4 */}
      <Section title="Step 4 — Syncable Concern + Contact Model Example" subtitle="Auto-sync Rails records to Base44 on create/update/delete">
        <CodeBlock code={contactModelCode} language="ruby" />
        <Note type="success">The <code>Base44Syncable</code> concern can be included in any Rails model — just define <code>base44_entity</code> and <code>base44_payload</code>.</Note>
      </Section>

      {/* Step 5 */}
      <Section title="Step 5 — Webhook Handler (Base44 → Rails)" subtitle="Receive real-time events when Base44 data changes">
        <Note type="info">Register your Rails endpoint as a webhook URL in your Base44 backend function automations.</Note>
        <CodeBlock code={webhookCode} language="ruby" />
      </Section>

      {/* Step 6 — Entity Model Map */}
      <Section title="Step 6 — Entity → Rails Model Mapping" subtitle="Suggested table names, fields, and associations per domain">
        {DOMAIN_MODELS.map(group => (
          <div key={group.domain} className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{group.domain}</h4>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300">Base44 Entity</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300">Rails Model</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300">Table</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 hidden lg:table-cell">Key Fields</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 hidden xl:table-cell">Associations</th>
                  </tr>
                </thead>
                <tbody>
                  {group.models.map((m, i) => (
                    <tr key={m.entity} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/50 dark:bg-slate-800/40'}>
                      <td className="px-3 py-2 font-mono text-violet-600 dark:text-violet-400 font-medium">{m.entity}</td>
                      <td className="px-3 py-2 font-mono text-blue-600 dark:text-blue-400">{m.rails}</td>
                      <td className="px-3 py-2 font-mono text-gray-500 dark:text-gray-400">{m.table}</td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{m.fields}</td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400 hidden xl:table-cell font-mono text-[10px]">{m.assoc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </Section>

      {/* Step 7 */}
      <Section title="Step 7 — Testing the Connection" subtitle="Quick smoke test in Rails console">
        <CodeBlock code={`# In rails console
contacts = Base44.list('Contact', filters: { status: 'lead' }, limit: 5)
puts contacts.map { |c| c['email'] }

# Create a test contact
result = Base44.create('Contact', {
  first_name: 'Test',
  last_name:  'User',
  email:      'test@example.com',
  status:     'lead'
})
puts result['id']`} language="ruby" />
        <Note type="success">If you see IDs returned, your Rails ↔ Base44 connection is working.</Note>
      </Section>
    </div>
  );
}