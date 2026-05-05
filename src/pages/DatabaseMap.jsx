import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Users, Building2, Target, Calendar, Mail, Share2, Globe, Search,
  Shield, DollarSign, Scale, Heart, Briefcase, FileText, MessageSquare,
  BarChart3, Zap, Package, Folder, Settings, ChevronDown, ChevronRight,
  Network, Database, ArrowRight, X, Filter, Code2
} from 'lucide-react';
import RailsIntegrationGuide from '@/components/database/RailsIntegrationGuide';

const DOMAINS = [
  {
    id: 'crm',
    label: 'CRM / Sales',
    icon: Users,
    color: 'blue',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    entities: [
      { name: 'Contact', pages: ['Contacts', 'ContactDetail', 'LeadEnrichment', 'SalesHub'], functions: ['sendContactEmail', 'enrichCompanyData', 'cleanupDuplicateContacts', 'executeContactAutomation'], links: ['Company', 'Deal', 'Activity', 'EmailLog', 'LeadScore'] },
      { name: 'Company', pages: ['CompaniesModule', 'AerospaceScanner', 'ContactDetail'], functions: ['enrichCompanyData', 'enrichCompanyIntelligence', 'findCompanyWebsite'], links: ['Contact', 'Deal'] },
      { name: 'Deal', pages: ['Deals', 'SalesHub', 'CRMDashboard'], functions: ['executeWorkflow'], links: ['Contact', 'Company', 'Pipeline', 'Activity'] },
      { name: 'Activity', pages: ['Activities', 'CRMDashboard', 'ContactDetail'], functions: ['createAuditLog'], links: ['Contact', 'Deal'] },
      { name: 'Opportunity', pages: ['Opportunities'], functions: ['executeOpportunityAutomation'], links: ['Contact', 'Company'] },
      { name: 'Pipeline', pages: ['Deals', 'WorkflowBuilder'], functions: [], links: ['Deal'] },
      { name: 'SalesCall', pages: ['SalesHub', 'CallsModule'], functions: [], links: ['Contact'] },
      { name: 'SalesSequence', pages: ['SalesSequences'], functions: [], links: ['Contact', 'SequenceEnrollment'] },
      { name: 'SequenceEnrollment', pages: ['SalesSequences'], functions: [], links: ['SalesSequence', 'Contact'] },
      { name: 'SalesForecast', pages: ['SalesDashboard'], functions: [], links: [] },
      { name: 'SalesQuota', pages: ['SalesQuotas'], functions: [], links: [] },
      { name: 'MeetingLink', pages: ['MeetingScheduler'], functions: [], links: ['MeetingBooking'] },
      { name: 'MeetingBooking', pages: ['MeetingScheduler'], functions: [], links: ['MeetingLink', 'Contact'] },
      { name: 'Proposal', pages: ['Proposals'], functions: ['generateProposalPdf', 'emailProposal'], links: ['Contact', 'Deal'] },
      { name: 'SalesEmail', pages: ['SalesInbox'], functions: ['receiveSalesEmail', 'sendTrackedEmail'], links: ['Contact'] },
      { name: 'LeadScore', pages: ['LeadEnrichment'], functions: ['generatePredictiveScores'], links: ['Contact'] },
      { name: 'LeadScoreRule', pages: ['Automation'], functions: [], links: [] },
      { name: 'AutomationRule', pages: ['Automation'], functions: ['executeContactAutomation'], links: [] },
      { name: 'DealWorkflow', pages: ['WorkflowBuilder'], functions: [], links: ['Deal'] },
      { name: 'WorkflowExecution', pages: ['WorkflowEngine'], functions: ['executeWorkflow'], links: ['DealWorkflow'] },
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing / Email',
    icon: Mail,
    color: 'violet',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-700',
    text: 'text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    entities: [
      { name: 'Campaign', pages: ['Campaigns', 'MarketingHub'], functions: [], links: ['Contact', 'EmailCampaign'] },
      { name: 'EmailCampaign', pages: ['EmailMarketing'], functions: ['sendCampaignEmail'], links: ['EmailTemplate', 'Contact', 'EmailLog'] },
      { name: 'EmailTemplate', pages: ['EmailMarketing', 'HRISEmailTemplates'], functions: [], links: [] },
      { name: 'EmailLog', pages: ['EmailMarketing', 'EmailTracking'], functions: ['trackEmailOpen', 'trackEmailClick'], links: ['Contact'] },
      { name: 'EmailDripCampaign', pages: ['MarketingHub'], functions: [], links: ['Contact', 'DripEnrollment'] },
      { name: 'DripEnrollment', pages: ['MarketingHub'], functions: [], links: ['EmailDripCampaign', 'Contact'] },
      { name: 'UTMTracking', pages: ['MarketingHub', 'TrafficAnalytics'], functions: [], links: [] },
      { name: 'ABTest', pages: ['MarketingHub'], functions: [], links: [] },
      { name: 'Referral', pages: ['MarketingHub'], functions: [], links: ['Contact'] },
      { name: 'MarketingEvent', pages: ['MarketingEventsModule'], functions: [], links: ['EventRegistration'] },
      { name: 'EventRegistration', pages: ['MarketingEventsModule'], functions: [], links: ['MarketingEvent', 'Contact'] },
    ]
  },
  {
    id: 'social',
    label: 'Social Media',
    icon: Share2,
    color: 'pink',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-700',
    text: 'text-pink-700 dark:text-pink-300',
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    entities: [
      { name: 'SocialAccount', pages: ['SocialAccounts', 'SocialDashboard'], functions: ['autoSyncSocial', 'autoPostToSocial'], links: ['CalendarPost', 'SocialPost', 'SocialPerformance'] },
      { name: 'SocialPost', pages: ['SocialMedia', 'AllChannels'], functions: [], links: ['SocialAccount'] },
      { name: 'CalendarPost', pages: ['SocialCalendar'], functions: ['autoPopulateCalendar', 'checkScheduledPosts', 'autoPostToSocial'], links: ['SocialAccount', 'HashtagPool'] },
      { name: 'ScheduledPost', pages: ['SocialCalendar'], functions: ['quickPostToSocial'], links: ['SocialAccount'] },
      { name: 'HashtagPool', pages: ['HashtagManager'], functions: [], links: [] },
      { name: 'SocialTag', pages: ['SocialTags'], functions: [], links: ['CalendarPost'] },
      { name: 'SocialLead', pages: ['SocialLeads'], functions: [], links: ['Contact'] },
      { name: 'SocialListening', pages: ['SocialListening'], functions: ['monitorBrandMentions'], links: ['ListeningMention'] },
      { name: 'ListeningMention', pages: ['SocialListening'], functions: [], links: ['SocialListening'] },
      { name: 'PostTemplate', pages: ['ContentStudio'], functions: [], links: [] },
      { name: 'ApprovedCopy', pages: ['SocialApprovals'], functions: [], links: [] },
      { name: 'CampaignBrief', pages: ['SocialApprovals'], functions: [], links: [] },
      { name: 'ContentInsight', pages: ['SocialDashboard'], functions: [], links: ['SocialAccount'] },
      { name: 'SocialAudience', pages: ['SocialMedia'], functions: ['analyzeSocialAudience'], links: ['SocialAccount'] },
    ]
  },
  {
    id: 'seo',
    label: 'SEO / Web',
    icon: Search,
    color: 'lime',
    bg: 'bg-lime-50 dark:bg-lime-900/20',
    border: 'border-lime-200 dark:border-lime-700',
    text: 'text-lime-700 dark:text-lime-300',
    badge: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',
    entities: [
      { name: 'Website', pages: ['SEODashboard', 'SEOTools', 'SEOAudit'], functions: [], links: ['Keyword', 'Backlink', 'SEOAudit'] },
      { name: 'Keyword', pages: ['Keywords', 'SEODashboard'], functions: ['generateSEORecommendations'], links: ['Website', 'KeywordHistory'] },
      { name: 'Backlink', pages: ['Backlinks'], functions: ['analyzeBacklinkOpportunities'], links: ['Website'] },
      { name: 'SEOAudit', pages: ['SEOAudit'], functions: [], links: ['Website', 'SEOCheck'] },
      { name: 'SEOCheck', pages: ['SEOAudit'], functions: [], links: ['SEOAudit'] },
      { name: 'TrafficData', pages: ['TrafficAnalytics'], functions: ['fetchGA4Data'], links: ['Website'] },
      { name: 'PagePerformance', pages: ['WebAnalyticsAdvanced'], functions: ['analyzePagePerformance'], links: ['Website'] },
      { name: 'ConversionFunnel', pages: ['WebAnalyticsAdvanced'], functions: ['analyzeFunnelData'], links: [] },
      { name: 'VisitorSession', pages: ['VisitorProfiles'], functions: ['trackVisitor'], links: [] },
      { name: 'WebCrawlResult', pages: ['WebCrawler'], functions: [], links: [] },
      { name: 'KeywordOpportunity', pages: ['SEOOpportunities'], functions: ['analyzeSEOOpportunities'], links: ['Keyword'] },
      { name: 'BacklinkOpportunity', pages: ['SEOOpportunities'], functions: [], links: ['Backlink'] },
      { name: 'RankTracking', pages: ['SEODashboard'], functions: [], links: ['Keyword'] },
    ]
  },
  {
    id: 'hris',
    label: 'HRIS / People',
    icon: Heart,
    color: 'fuchsia',
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
    border: 'border-fuchsia-200 dark:border-fuchsia-700',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
    badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
    entities: [
      { name: 'HRISEmployee', pages: ['HRISEmployees', 'HRISDashboard', 'HRISPayroll'], functions: [], links: ['HRISDepartment', 'HRISTimeOffRequest', 'HRISPayroll', 'HRISBenefitEnrollment'] },
      { name: 'HRISDepartment', pages: ['HRISDepartments', 'HRISOrgChart'], functions: [], links: ['HRISEmployee'] },
      { name: 'HRISTimeOffRequest', pages: ['HRISTimeOff'], functions: [], links: ['HRISEmployee'] },
      { name: 'HRISPayroll', pages: ['HRISPayroll'], functions: [], links: ['HRISEmployee'] },
      { name: 'HRISBenefit', pages: ['HRISBenefits'], functions: [], links: ['HRISBenefitEnrollment'] },
      { name: 'HRISBenefitEnrollment', pages: ['HRISBenefits'], functions: [], links: ['HRISEmployee', 'HRISBenefit'] },
      { name: 'HRISPerformanceReview', pages: ['HRISPerformance'], functions: [], links: ['HRISEmployee', 'HRISPerformanceGoal'] },
      { name: 'HRISJobPosting', pages: ['HRISHiring'], functions: [], links: ['HRISCandidate'] },
      { name: 'HRISCandidate', pages: ['HRISHiring'], functions: [], links: ['HRISJobPosting'] },
      { name: 'HRISOnboardingTask', pages: ['HRISOnboarding'], functions: [], links: ['HRISEmployee'] },
      { name: 'HRISContract', pages: ['HRISContracts'], functions: [], links: ['HRISEmployee'] },
      { name: 'HRISAnnouncement', pages: ['HRISAnnouncements'], functions: [], links: [] },
      { name: 'HRISRecognition', pages: ['HRISRecognition'], functions: [], links: ['HRISEmployee'] },
      { name: 'TalentTraining', pages: ['TalentTraining'], functions: [], links: ['HRISEmployee'] },
      { name: 'TalentSkill', pages: ['TalentSkills'], functions: [], links: ['HRISEmployee'] },
      { name: 'TalentSurvey', pages: ['TalentSurveys'], functions: [], links: ['HRISEmployee'] },
      { name: 'EquityGrant', pages: ['Equity'], functions: [], links: ['HRISEmployee', 'EquityPool'] },
    ]
  },
  {
    id: 'legal',
    label: 'Legal / Compliance',
    icon: Scale,
    color: 'orange',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-700',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    entities: [
      { name: 'LegalMatter', pages: ['LegalMatters'], functions: [], links: ['LegalDocument', 'LegalCounsel'] },
      { name: 'LegalDocument', pages: ['LegalDocuments', 'DataRooms'], functions: [], links: ['LegalMatter', 'DataRoom'] },
      { name: 'LegalObligation', pages: ['LegalObligations'], functions: [], links: ['LegalMatter'] },
      { name: 'IPAsset', pages: ['LegalIP'], functions: [], links: [] },
      { name: 'Litigation', pages: ['LegalLitigation'], functions: [], links: ['LegalMatter', 'LegalCounsel'] },
      { name: 'LegalCounsel', pages: ['LegalCounsel'], functions: [], links: [] },
      { name: 'LegalEntity', pages: ['LegalEntities'], functions: [], links: [] },
      { name: 'CompliancePolicy', pages: ['CompliancePolicies'], functions: [], links: ['ComplianceTraining'] },
      { name: 'ComplianceTraining', pages: ['ComplianceTraining'], functions: [], links: ['CompliancePolicy', 'HRISEmployee'] },
      { name: 'ComplianceIncident', pages: ['ComplianceIncidents'], functions: [], links: [] },
      { name: 'ComplianceAudit', pages: ['ComplianceAudits'], functions: [], links: [] },
      { name: 'ComplianceRisk', pages: ['ComplianceRisk'], functions: [], links: [] },
      { name: 'ExportControlProgram', pages: ['ExportControl'], functions: [], links: ['ExportViolation', 'DeemedExport'] },
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    color: 'yellow',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-700',
    text: 'text-yellow-700 dark:text-yellow-300',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    entities: [
      { name: 'FinanceBudget', pages: ['FinanceBudgets'], functions: [], links: ['FinanceTransaction'] },
      { name: 'FinanceTransaction', pages: ['FinanceTransactions'], functions: [], links: ['FinanceBudget'] },
      { name: 'FinanceForecast', pages: ['FinanceForecast'], functions: [], links: [] },
      { name: 'Vendor', pages: ['VendorSpace'], functions: [], links: ['VendorProduct', 'Invoice'] },
      { name: 'VendorProduct', pages: ['VendorSpace'], functions: [], links: ['Vendor'] },
      { name: 'Invoice', pages: ['InvoicesModule'], functions: [], links: ['Contact', 'Vendor'] },
      { name: 'Payment', pages: ['Payments'], functions: [], links: ['Invoice', 'Contact'] },
    ]
  },
  {
    id: 'success',
    label: 'Customer Success',
    icon: Award,
    color: 'purple',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-700',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    entities: [
      { name: 'CustomerHealth', pages: ['CustomerSuccess', 'CustomerSuccessDashboard'], functions: ['predictiveChurn'], links: ['Contact', 'Company'] },
      { name: 'CustomerOnboarding', pages: ['CustomerSuccess'], functions: [], links: ['Contact'] },
      { name: 'CustomerInteraction', pages: ['CustomerSuccess'], functions: [], links: ['Contact'] },
      { name: 'SatisfactionSurvey', pages: ['FeedbackManagement'], functions: ['analyzeFeedback'], links: ['Contact'] },
      { name: 'UpsellOpportunity', pages: ['CustomerSuccess'], functions: [], links: ['Contact', 'Deal'] },
      { name: 'CSMTask', pages: ['CustomerSuccess'], functions: [], links: [] },
    ]
  },
  {
    id: 'collab',
    label: 'Collaboration / Docs',
    icon: MessageSquare,
    color: 'teal',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-700',
    text: 'text-teal-700 dark:text-teal-300',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    entities: [
      { name: 'Project', pages: ['Projects', 'ProjectsDashboard'], functions: [], links: ['ProjectMilestone', 'ProjectTask', 'Sprint'] },
      { name: 'ProjectTask', pages: ['ProjectDetail', 'Projects'], functions: [], links: ['Project'] },
      { name: 'Sprint', pages: ['Projects'], functions: [], links: ['Project', 'ProjectTask'] },
      { name: 'Space', pages: ['Spaces', 'SpaceDetail'], functions: [], links: ['WikiPage'] },
      { name: 'WikiPage', pages: ['WikiPageEditor', 'Spaces'], functions: [], links: ['Space', 'WikiPageVersion'] },
      { name: 'Channel', pages: ['ICS'], functions: [], links: ['Message'] },
      { name: 'Message', pages: ['ICS', 'Inbox'], functions: [], links: ['Channel'] },
      { name: 'DataRoom', pages: ['DataRooms'], functions: ['createDataRoomPortal'], links: ['LegalDocument', 'DataRoomPortal'] },
      { name: 'MediaAsset', pages: ['MediaLibrary'], functions: [], links: [] },
      { name: 'Note', pages: ['NotesModule'], functions: [], links: ['Contact'] },
    ]
  },
  {
    id: 'system',
    label: 'System / Platform',
    icon: Settings,
    color: 'gray',
    bg: 'bg-gray-50 dark:bg-gray-800/40',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    entities: [
      { name: 'User', pages: ['Settings', 'Permissions'], functions: ['updateUserProfile'], links: ['Notification', 'UserOnboarding'] },
      { name: 'UserOnboarding', pages: ['Layout'], functions: [], links: ['User'] },
      { name: 'Notification', pages: ['NotificationCenter'], functions: ['createNotification'], links: ['User'] },
      { name: 'FeatureSettings', pages: ['Features'], functions: [], links: [] },
      { name: 'CompanySettings', pages: ['CompanySettings'], functions: [], links: [] },
      { name: 'AuditLog', pages: ['ActivityLogs'], functions: ['createAuditLog'], links: ['User'] },
      { name: 'RolePermission', pages: ['Permissions'], functions: [], links: ['User'] },
      { name: 'APIUsage', pages: ['Settings'], functions: ['trackAPIUsage'], links: [] },
      { name: 'ScheduledTask', pages: ['Settings'], functions: [], links: [] },
      { name: 'ContactForm', pages: ['ContactForms'], functions: ['formSubmit'], links: ['FormSubmission', 'Contact'] },
      { name: 'FormSubmission', pages: ['ContactForms'], functions: [], links: ['ContactForm'] },
      { name: 'Business', pages: ['BusinessManagement'], functions: [], links: [] },
    ]
  },
];

// Flatten all entities for cross-domain link lookup
const ALL_ENTITIES = DOMAINS.flatMap(d => d.entities.map(e => ({ ...e, domain: d.id, domainLabel: d.label, domainColor: d.color })));

function getDomainForEntity(name) {
  return ALL_ENTITIES.find(e => e.name === name);
}

const COLOR_CLASSES = {
  blue: { pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200', dot: 'bg-blue-500' },
  violet: { pill: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200', dot: 'bg-violet-500' },
  pink: { pill: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200', dot: 'bg-pink-500' },
  lime: { pill: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300 border-lime-200', dot: 'bg-lime-500' },
  fuchsia: { pill: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300 border-fuchsia-200', dot: 'bg-fuchsia-500' },
  orange: { pill: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200', dot: 'bg-orange-500' },
  yellow: { pill: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200', dot: 'bg-yellow-500' },
  purple: { pill: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200', dot: 'bg-purple-500' },
  teal: { pill: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200', dot: 'bg-teal-500' },
  gray: { pill: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200', dot: 'bg-gray-500' },
};

function EntityDetailPanel({ entity, domain, onClose, onSelectEntity }) {
  const linkedEntities = (entity.links || []).map(name => getDomainForEntity(name)).filter(Boolean);
  const referencedBy = ALL_ENTITIES.filter(e => e.links?.includes(entity.name));
  const colors = COLOR_CLASSES[domain.color] || COLOR_CLASSES.gray;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 shadow-2xl z-50 flex flex-col">
      <div className={`p-5 border-b border-gray-100 dark:border-slate-700 ${domain.bg}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{domain.label}</span>
            </div>
            <h2 className={`text-xl font-bold ${domain.text}`}>{entity.name}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Pages */}
        {entity.pages?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Used on Pages
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {entity.pages.map(p => (
                <span key={p} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Functions */}
        {entity.functions?.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Backend Functions
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {entity.functions.map(f => (
                <span key={f} className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-mono border border-amber-200 dark:border-amber-800">{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Links to */}
        {linkedEntities.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" /> Links To
            </h3>
            <div className="space-y-1.5">
              {linkedEntities.map(le => {
                const lc = COLOR_CLASSES[le.domainColor] || COLOR_CLASSES.gray;
                return (
                  <button key={le.name} onClick={() => onSelectEntity(le)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left hover:opacity-80 transition-opacity ${lc.pill}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${lc.dot}`} />
                    <span className="font-medium text-sm">{le.name}</span>
                    <span className="text-xs opacity-60 ml-auto">{le.domainLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Referenced By */}
        {referencedBy.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5" /> Referenced By
            </h3>
            <div className="space-y-1.5">
              {referencedBy.map(re => {
                const rc = COLOR_CLASSES[re.domainColor] || COLOR_CLASSES.gray;
                return (
                  <button key={re.name} onClick={() => onSelectEntity(re)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left hover:opacity-80 transition-opacity ${rc.pill}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rc.dot}`} />
                    <span className="font-medium text-sm">{re.name}</span>
                    <span className="text-xs opacity-60 ml-auto">{re.domainLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DomainCard({ domain, onSelectEntity, selectedEntity, search }) {
  const [collapsed, setCollapsed] = useState(false);
  const Icon = domain.icon;
  const colors = COLOR_CLASSES[domain.color] || COLOR_CLASSES.gray;

  const filtered = search
    ? domain.entities.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.pages?.some(p => p.toLowerCase().includes(search.toLowerCase())) ||
        e.functions?.some(f => f.toLowerCase().includes(search.toLowerCase()))
      )
    : domain.entities;

  if (search && filtered.length === 0) return null;

  return (
    <div className={`rounded-2xl border ${domain.border} overflow-hidden`}>
      {/* Domain Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`w-full flex items-center justify-between px-5 py-4 ${domain.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-white/60 dark:bg-black/20`}>
            <Icon className={`w-5 h-5 ${domain.text}`} />
          </div>
          <div className="text-left">
            <h2 className={`text-base font-bold ${domain.text}`}>{domain.label}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{domain.entities.length} entities</p>
          </div>
        </div>
        {collapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {/* Entities Grid */}
      {!collapsed && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-white dark:bg-slate-900/50">
          {filtered.map(entity => {
            const isSelected = selectedEntity?.name === entity.name;
            return (
              <button
                key={entity.name}
                onClick={() => onSelectEntity({ ...entity, domain: domain.id, domainLabel: domain.label, domainColor: domain.color })}
                className={`text-left px-3 py-2.5 rounded-xl border transition-all duration-150 ${
                  isSelected
                    ? `${domain.bg} ${domain.border} ring-2 ring-offset-1`
                    : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{entity.name}</span>
                  {entity.links?.length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors.pill} border`}>
                      {entity.links.length}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                  {entity.pages?.length > 0 && <span>{entity.pages.length} page{entity.pages.length !== 1 ? 's' : ''}</span>}
                  {entity.functions?.length > 0 && <span className="text-amber-500">⚡ {entity.functions.length} fn</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Need to import Award separately since it wasn't in the top imports
import { Award } from 'lucide-react';

export default function DatabaseMap() {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState('all');
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'rails'

  const selectedDomain = selectedEntity
    ? DOMAINS.find(d => d.id === selectedEntity.domain)
    : null;

  const totalEntities = DOMAINS.reduce((sum, d) => sum + d.entities.length, 0);
  const totalLinks = ALL_ENTITIES.reduce((sum, e) => sum + (e.links?.length || 0), 0);
  const totalFunctions = [...new Set(ALL_ENTITIES.flatMap(e => e.functions || []))].length;

  const visibleDomains = filterDomain === 'all' ? DOMAINS : DOMAINS.filter(d => d.id === filterDomain);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className={`transition-all duration-300 ${selectedEntity ? 'mr-96' : ''}`}>
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-5 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/40">
                  <Database className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Database Connection Map</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {totalEntities} entities · {totalLinks} connections · {totalFunctions} backend functions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${activeTab === 'map' ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'}`}
                >
                  <Database className="w-3.5 h-3.5" /> Entity Map
                </button>
                <button
                  onClick={() => setActiveTab('rails')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${activeTab === 'rails' ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'}`}
                >
                  <Code2 className="w-3.5 h-3.5" /> Rails Guide
                </button>
              </div>
              <div className={`flex items-center gap-3 flex-1 max-w-xl ${activeTab === 'rails' ? 'hidden' : ''}`}>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search entities, pages, functions..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}
                </div>
                <select
                  value={filterDomain}
                  onChange={e => setFilterDomain(e.target.value)}
                  className="h-9 px-3 text-sm rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200"
                >
                  <option value="all">All Domains</option>
                  {DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
            </div>

            {/* Stats — only on map tab */}
            <div className={`flex gap-4 mt-4 flex-wrap ${activeTab === 'rails' ? 'hidden' : ''}`}>
              {DOMAINS.map(d => {
                const Icon = d.icon;
                return (
                  <button
                    key={d.id}
                    onClick={() => setFilterDomain(filterDomain === d.id ? 'all' : d.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      filterDomain === d.id ? `${d.bg} ${d.border} ${d.text}` : 'border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {d.label}
                    <span className="opacity-60">({d.entities.length})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
          {activeTab === 'map' ? (
            visibleDomains.map(domain => (
              <DomainCard
                key={domain.id}
                domain={domain}
                onSelectEntity={setSelectedEntity}
                selectedEntity={selectedEntity}
                search={search}
              />
            ))
          ) : (
            <RailsIntegrationGuide selectedEntity={selectedEntity} />
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedEntity && selectedDomain && (
        <EntityDetailPanel
          entity={selectedEntity}
          domain={selectedDomain}
          onClose={() => setSelectedEntity(null)}
          onSelectEntity={setSelectedEntity}
        />
      )}
    </div>
  );
}