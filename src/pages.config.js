import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Companies from './pages/Companies';
import Deals from './pages/Deals';
import Activities from './pages/Activities';


export const PAGES = {
    "Dashboard": Dashboard,
    "Contacts": Contacts,
    "Companies": Companies,
    "Deals": Deals,
    "Activities": Activities,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
};