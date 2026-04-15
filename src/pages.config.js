/**
 * pages.config.js - Page routing configuration
 *
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 *
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 *
 * Example file structure:
 *
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 *
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIDashboard from './pages/AIDashboard';
import AccountingDashboard from './pages/AccountingDashboard';
import Activities from './pages/Activities';
import ActivityLogs from './pages/ActivityLogs';
import AerospaceScanner from './pages/AerospaceScanner';
import AllChannels from './pages/AllChannels';
import Automation from './pages/Automation';
import Backlinks from './pages/Backlinks';
import BusinessDevDashboard from './pages/BusinessDevDashboard';
import BusinessManagement from './pages/BusinessManagement';
import CRMDashboard from './pages/CRMDashboard';
import CallsModule from './pages/CallsModule';
import CampaignDetail from './pages/CampaignDetail';
import Campaigns from './pages/Campaigns';
import Collaboration from './pages/Collaboration';
import CompaniesModule from './pages/CompaniesModule';
import CompetitorAnalysis from './pages/CompetitorAnalysis';
import ContactDetail from './pages/ContactDetail';
import ContactForms from './pages/ContactForms';
import Contacts from './pages/Contacts';
import ContentStrategy from './pages/ContentStrategy';
import ContentStudio from './pages/ContentStudio';
import CustomFieldsSettings from './pages/CustomFieldsSettings';
import CustomerSuccess from './pages/CustomerSuccess';
import CustomerSuccessDashboard from './pages/CustomerSuccessDashboard';
import Dashboard from './pages/Dashboard';
import DataRooms from './pages/DataRooms';
import Deals from './pages/Deals';
import DealsModule from './pages/DealsModule';
import DocuTrace from './pages/DocuTrace';
import Documentation from './pages/Documentation';
import EmailMarketing from './pages/EmailMarketing';
import EmailTracking from './pages/EmailTracking';
import EmailsModule from './pages/EmailsModule';
import EquipmentInventory from './pages/EquipmentInventory';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import FeedbackManagement from './pages/FeedbackManagement';
import GoogleCalendarCallback from './pages/GoogleCalendarCallback';
import HashtagManager from './pages/HashtagManager';
import HelpCenter from './pages/HelpCenter';
import Home from './pages/Home';
import ICS from './pages/ICS';
import ICSAdmin from './pages/ICSAdmin';
import Inbox from './pages/Inbox';
import InvoicesModule from './pages/InvoicesModule';
import Keywords from './pages/Keywords';
import LandingPageBuilder from './pages/LandingPageBuilder';
import LeadEnrichment from './pages/LeadEnrichment';
import LegalDocuments from './pages/LegalDocuments';
import Listings from './pages/Listings';
import LocalSEO from './pages/LocalSEO';
import MarketingDashboard from './pages/MarketingDashboard';
import MarketingEventsModule from './pages/MarketingEventsModule';
import MarketingHub from './pages/MarketingHub';
import MediaLibrary from './pages/MediaLibrary';
import MediaOutreach from './pages/MediaOutreach';
import MeetingScheduler from './pages/MeetingScheduler';
import MobileHub from './pages/MobileHub';
import NotesModule from './pages/NotesModule';
import Opportunities from './pages/Opportunities';
import OrdersModule from './pages/OrdersModule';
import Payments from './pages/Payments';
import PitchDeckAnalyzer from './pages/PitchDeckAnalyzer';
import PitchDeckCreator from './pages/PitchDeckCreator';
import PostalMailModule from './pages/PostalMailModule';
import PostApprovalView from './pages/PostApprovalView';
import PressMonitoring from './pages/PressMonitoring';
import ProductsModule from './pages/ProductsModule';
import ProjectCalendar from './pages/ProjectCalendar';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import ProjectsDashboard from './pages/ProjectsDashboard';
import ProjectsEnhanced from './pages/ProjectsEnhanced';
import Proposals from './pages/Proposals';
import PublicCallJoin from './pages/PublicCallJoin';
import PublicDataRoom from './pages/PublicDataRoom';
import PublicDocumentViewer from './pages/PublicDocumentViewer';
import PublicDocumentViewerWrapper from './pages/PublicDocumentViewerWrapper';
import PublicLandingPage from './pages/PublicLandingPage';
import PublicLandingPageWrapper from './pages/PublicLandingPageWrapper';
import PublicLegalDocumentSigner from './pages/PublicLegalDocumentSigner';
import QuotesModule from './pages/QuotesModule';
import Reports from './pages/Reports';
import ReportsDashboardPage from './pages/ReportsDashboardPage';
import Reservations from './pages/Reservations';
import SEOAudit from './pages/SEOAudit';
import SEODashboard from './pages/SEODashboard';
import SEODashboardPage from './pages/SEODashboardPage';
import SEOOpportunities from './pages/SEOOpportunities';
import SEOTools from './pages/SEOTools';
import SalesDashboard from './pages/SalesDashboard';
import SalesHub from './pages/SalesHub';
import SalesInbox from './pages/SalesInbox';
import SalesQuotas from './pages/SalesQuotas';
import SalesSequences from './pages/SalesSequences';
import Settings from './pages/Settings';
import SocialAccounts from './pages/SocialAccounts';
import SocialApprovals from './pages/SocialApprovals';
import SocialCalendar from './pages/SocialCalendar';
import SocialDashboard from './pages/SocialDashboard';
import SocialLeads from './pages/SocialLeads';
import SocialListening from './pages/SocialListening';
import SocialMedia from './pages/SocialMedia';
import SocialPerformance from './pages/SocialPerformance';
import SocialTags from './pages/SocialTags';
import SpaceDetail from './pages/SpaceDetail';
import SpaceTemplates from './pages/SpaceTemplates';
import Spaces from './pages/Spaces';
import SubscriptionsModule from './pages/SubscriptionsModule';
import TakeDownRequestor from './pages/TakeDownRequestor';
import TeamCollaboration from './pages/TeamCollaboration';
import TicketsModule from './pages/TicketsModule';
import TrafficAnalytics from './pages/TrafficAnalytics';
import UserProfile from './pages/UserProfile';
import UserSettings from './pages/UserSettings';
import VisitorProfiles from './pages/VisitorProfiles';
import WebAnalyticsAdvanced from './pages/WebAnalyticsAdvanced';
import WebCrawler from './pages/WebCrawler';
import WebDashboard from './pages/WebDashboard';
import WikiPageEditor from './pages/WikiPageEditor';
import WorkflowBuilder from './pages/WorkflowBuilder';
import WorkflowEngine from './pages/WorkflowEngine';
import __Layout from './Layout.jsx';

export const PAGES = {
  AIDashboard: AIDashboard,
  AccountingDashboard: AccountingDashboard,
  Activities: Activities,
  ActivityLogs: ActivityLogs,
  AerospaceScanner: AerospaceScanner,
  AllChannels: AllChannels,
  Automation: Automation,
  Backlinks: Backlinks,
  BusinessDevDashboard: BusinessDevDashboard,
  BusinessManagement: BusinessManagement,
  CRMDashboard: CRMDashboard,
  CallsModule: CallsModule,
  CampaignDetail: CampaignDetail,
  Campaigns: Campaigns,
  Collaboration: Collaboration,
  CompaniesModule: CompaniesModule,
  CompetitorAnalysis: CompetitorAnalysis,
  ContactDetail: ContactDetail,
  ContactForms: ContactForms,
  Contacts: Contacts,
  ContentStrategy: ContentStrategy,
  ContentStudio: ContentStudio,
  CustomFieldsSettings: CustomFieldsSettings,
  CustomerSuccess: CustomerSuccess,
  CustomerSuccessDashboard: CustomerSuccessDashboard,
  Dashboard: Dashboard,
  DataRooms: DataRooms,
  Deals: Deals,
  DealsModule: DealsModule,
  DocuTrace: DocuTrace,
  Documentation: Documentation,
  EmailMarketing: EmailMarketing,
  EmailTracking: EmailTracking,
  EmailsModule: EmailsModule,
  EquipmentInventory: EquipmentInventory,
  ExecutiveDashboard: ExecutiveDashboard,
  FeedbackManagement: FeedbackManagement,
  GoogleCalendarCallback: GoogleCalendarCallback,
  HashtagManager: HashtagManager,
  HelpCenter: HelpCenter,
  Home: Home,
  ICS: ICS,
  ICSAdmin: ICSAdmin,
  Inbox: Inbox,
  InvoicesModule: InvoicesModule,
  Keywords: Keywords,
  LandingPageBuilder: LandingPageBuilder,
  LeadEnrichment: LeadEnrichment,
  LegalDocuments: LegalDocuments,
  Listings: Listings,
  LocalSEO: LocalSEO,
  MarketingDashboard: MarketingDashboard,
  MarketingEventsModule: MarketingEventsModule,
  MarketingHub: MarketingHub,
  MediaLibrary: MediaLibrary,
  MediaOutreach: MediaOutreach,
  MeetingScheduler: MeetingScheduler,
  MobileHub: MobileHub,
  NotesModule: NotesModule,
  Opportunities: Opportunities,
  OrdersModule: OrdersModule,
  Payments: Payments,
  PitchDeckAnalyzer: PitchDeckAnalyzer,
  PitchDeckCreator: PitchDeckCreator,
  PostalMailModule: PostalMailModule,
  PostApprovalView: PostApprovalView,
  PressMonitoring: PressMonitoring,
  ProductsModule: ProductsModule,
  ProjectCalendar: ProjectCalendar,
  ProjectDetail: ProjectDetail,
  Projects: Projects,
  ProjectsDashboard: ProjectsDashboard,
  ProjectsEnhanced: ProjectsEnhanced,
  Proposals: Proposals,
  PublicCallJoin: PublicCallJoin,
  PublicDataRoom: PublicDataRoom,
  PublicDocumentViewer: PublicDocumentViewer,
  PublicDocumentViewerWrapper: PublicDocumentViewerWrapper,
  PublicLandingPage: PublicLandingPage,
  PublicLandingPageWrapper: PublicLandingPageWrapper,
  PublicLegalDocumentSigner: PublicLegalDocumentSigner,
  QuotesModule: QuotesModule,
  Reports: Reports,
  ReportsDashboardPage: ReportsDashboardPage,
  Reservations: Reservations,
  SEOAudit: SEOAudit,
  SEODashboard: SEODashboard,
  SEODashboardPage: SEODashboardPage,
  SEOOpportunities: SEOOpportunities,
  SEOTools: SEOTools,
  SalesDashboard: SalesDashboard,
  SalesHub: SalesHub,
  SalesInbox: SalesInbox,
  SalesQuotas: SalesQuotas,
  SalesSequences: SalesSequences,
  Settings: Settings,
  SocialAccounts: SocialAccounts,
  SocialApprovals: SocialApprovals,
  SocialCalendar: SocialCalendar,
  SocialDashboard: SocialDashboard,
  SocialLeads: SocialLeads,
  SocialListening: SocialListening,
  SocialMedia: SocialMedia,
  SocialPerformance: SocialPerformance,
  SocialTags: SocialTags,
  SpaceDetail: SpaceDetail,
  SpaceTemplates: SpaceTemplates,
  Spaces: Spaces,
  SubscriptionsModule: SubscriptionsModule,
  TakeDownRequestor: TakeDownRequestor,
  TeamCollaboration: TeamCollaboration,
  TicketsModule: TicketsModule,
  TrafficAnalytics: TrafficAnalytics,
  UserProfile: UserProfile,
  UserSettings: UserSettings,
  VisitorProfiles: VisitorProfiles,
  WebAnalyticsAdvanced: WebAnalyticsAdvanced,
  WebCrawler: WebCrawler,
  WebDashboard: WebDashboard,
  WikiPageEditor: WikiPageEditor,
  WorkflowBuilder: WorkflowBuilder,
  WorkflowEngine: WorkflowEngine,
};

export const pagesConfig = {
  mainPage: 'Dashboard',
  Pages: PAGES,
  Layout: __Layout,
};
