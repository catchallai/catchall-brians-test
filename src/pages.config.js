import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Companies from './pages/Companies';
import Deals from './pages/Deals';
import Activities from './pages/Activities';
import SEODashboard from './pages/SEODashboard';
import Keywords from './pages/Keywords';
import Backlinks from './pages/Backlinks';
import SEOAudit from './pages/SEOAudit';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import Reports from './pages/Reports';
import EmailMarketing from './pages/EmailMarketing';
import Automation from './pages/Automation';
import SEOTools from './pages/SEOTools';
import SocialMedia from './pages/SocialMedia';
import SocialLeads from './pages/SocialLeads';
import HelpCenter from './pages/HelpCenter';
import SocialListening from './pages/SocialListening';
import SocialCalendar from './pages/SocialCalendar';
import Listings from './pages/Listings';
import PressMonitoring from './pages/PressMonitoring';
import WebCrawler from './pages/WebCrawler';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Contacts": Contacts,
    "Companies": Companies,
    "Deals": Deals,
    "Activities": Activities,
    "SEODashboard": SEODashboard,
    "Keywords": Keywords,
    "Backlinks": Backlinks,
    "SEOAudit": SEOAudit,
    "Campaigns": Campaigns,
    "CampaignDetail": CampaignDetail,
    "Reports": Reports,
    "EmailMarketing": EmailMarketing,
    "Automation": Automation,
    "SEOTools": SEOTools,
    "SocialMedia": SocialMedia,
    "SocialLeads": SocialLeads,
    "HelpCenter": HelpCenter,
    "SocialListening": SocialListening,
    "SocialCalendar": SocialCalendar,
    "Listings": Listings,
    "PressMonitoring": PressMonitoring,
    "WebCrawler": WebCrawler,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};