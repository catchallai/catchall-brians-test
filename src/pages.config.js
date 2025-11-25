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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};