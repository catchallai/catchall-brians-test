import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Companies from './pages/Companies';
import Deals from './pages/Deals';
import Activities from './pages/Activities';
import SEODashboard from './pages/SEODashboard';
import Keywords from './pages/Keywords';
import Backlinks from './pages/Backlinks';
import SEOAudit from './pages/SEOAudit';


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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
};