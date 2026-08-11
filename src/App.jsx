import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import CommandCenter from '@/pages/CommandCenter';
import Dashboard from '@/pages/Dashboard';
import BusinessDiscovery from '@/pages/BusinessDiscovery';
import Prospects from '@/pages/Prospects';
import ProspectDetail from '@/pages/ProspectDetail';
import Audits from '@/pages/Audits';
import SearchOpportunities from '@/pages/SearchOpportunities';
import Domains from '@/pages/Domains';
import ThrowTheBook from '@/pages/ThrowTheBook';
import Concepts from '@/pages/Concepts';
import BrandLab from '@/pages/BrandLab';
import WebsiteLab from '@/pages/WebsiteLab';
import MarketingLab from '@/pages/MarketingLab';
import CapabilityRegistry from '@/pages/CapabilityRegistry';
import GeneratorRegistry from '@/pages/GeneratorRegistry';
import SourceRegistry from '@/pages/SourceRegistry';
import VisualizerHub from '@/pages/VisualizerHub';
import BuildQueue from '@/pages/BuildQueue';
import PreviewFactory from '@/pages/PreviewFactory';
import QARepair from '@/pages/QARepair';
import ProposalFactory from '@/pages/ProposalFactory';
import TestLab from '@/pages/TestLab';
import Markets from '@/pages/Markets';
import NewMarket from '@/pages/NewMarket';
import MarketDetail from '@/pages/MarketDetail';
import SeoLaunchPad from '@/pages/SeoLaunchPad';
import SalesPipeline from '@/pages/SalesPipeline';
import Experiments from '@/pages/Experiments';
import IndustryDNA from '@/pages/IndustryDNA';
import WebsiteGenome from '@/pages/WebsiteGenome';
import Playbooks from '@/pages/Playbooks';
import Approvals from '@/pages/Approvals';
import Receipts from '@/pages/Receipts';
import Connectors from '@/pages/Connectors';
import Settings from '@/pages/Settings';
import Marketing from '@/pages/Marketing';
import Pricing from '@/pages/Pricing';
import ThankYou from '@/pages/ThankYou';
import SeoLanding from '@/pages/SeoLanding';
import CouponPage from '@/pages/CouponPage';
import FreeAuditPage from '@/pages/FreeAuditPage';
import Contacts from '@/pages/crm/Contacts';
import Accounts from '@/pages/crm/Accounts';
import Deals from '@/pages/crm/Deals';
import Activities from '@/pages/crm/Activities';
import Campaigns from '@/pages/crm/Campaigns';
import Quotes from '@/pages/crm/Quotes';
import EsignDocuments from '@/pages/esign/EsignDocuments';
import SignPortal from '@/pages/esign/SignPortal';
import Invoices from '@/pages/billing/Invoices';
import Expenses from '@/pages/billing/Expenses';
import BillingDashboard from '@/pages/billing/BillingDashboard';
import AutonomousSystem from '@/pages/AutonomousSystem';
import WebsiteFactory from '@/pages/WebsiteFactory';
import TemplateLibrary from '@/pages/TemplateLibrary';
import PromptLibrary from '@/pages/PromptLibrary';
import RankEngine from '@/pages/RankEngine';
import CloneStudio from '@/pages/CloneStudio';
import ClonePipeline from '@/pages/ClonePipeline';
import RebrandStudio from '@/pages/RebrandStudio';
import RaceToRank from '@/pages/RaceToRank';
import RankingMonitor from '@/pages/RankingMonitor';
import DomainPortfolio from '@/pages/DomainPortfolio';
import GscTraffic from '@/pages/GscTraffic';
import SeoAccelerator from '@/pages/SeoAccelerator';
import SeoStandard from '@/pages/SeoStandard';
import SeoAgent from '@/pages/SeoAgent';
import SerpBlueprint from '@/pages/SerpBlueprint';
import PipelineDashboard from '@/pages/PipelineDashboard';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Marketing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/ThankYou" element={<ThankYou />} />
      <Route path="/seo/:slug" element={<SeoLanding />} />
      <Route path="/coupon" element={<CouponPage />} />
      <Route path="/free-audit" element={<FreeAuditPage />} />
      <Route path="/sign/:token" element={<SignPortal />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/discovery" element={<BusinessDiscovery />} />
          <Route path="/prospects" element={<Prospects />} />
          <Route path="/prospects/:id" element={<ProspectDetail />} />
          <Route path="/audits" element={<Audits />} />
          <Route path="/opportunities" element={<SearchOpportunities />} />
          <Route path="/domains" element={<Domains />} />
          <Route path="/throw-the-book" element={<ThrowTheBook />} />
          <Route path="/concepts" element={<Concepts />} />
          <Route path="/brand-lab" element={<BrandLab />} />
          <Route path="/website-lab" element={<WebsiteLab />} />
          <Route path="/marketing-lab" element={<MarketingLab />} />
          <Route path="/capabilities" element={<CapabilityRegistry />} />
          <Route path="/generators" element={<GeneratorRegistry />} />
          <Route path="/sources" element={<SourceRegistry />} />
          <Route path="/visualizer-hub" element={<VisualizerHub />} />
          <Route path="/build-queue" element={<BuildQueue />} />
          <Route path="/preview-factory" element={<PreviewFactory />} />
          <Route path="/qa-repair" element={<QARepair />} />
          <Route path="/proposals" element={<ProposalFactory />} />
          <Route path="/test-lab" element={<TestLab />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/markets/new" element={<NewMarket />} />
          <Route path="/markets/:id" element={<MarketDetail />} />
          <Route path="/seo-launch-pad" element={<SeoLaunchPad />} />
          <Route path="/pipeline" element={<SalesPipeline />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/industry-dna" element={<IndustryDNA />} />
          <Route path="/website-genomes" element={<WebsiteGenome />} />
          <Route path="/playbooks" element={<Playbooks />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="/connectors" element={<Connectors />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/business-suite" element={<BillingDashboard />} />
          <Route path="/crm/contacts" element={<Contacts />} />
          <Route path="/crm/accounts" element={<Accounts />} />
          <Route path="/crm/deals" element={<Deals />} />
          <Route path="/crm/activities" element={<Activities />} />
          <Route path="/crm/campaigns" element={<Campaigns />} />
          <Route path="/crm/quotes" element={<Quotes />} />
          <Route path="/esign/documents" element={<EsignDocuments />} />
          <Route path="/billing/invoices" element={<Invoices />} />
          <Route path="/billing/expenses" element={<Expenses />} />
          <Route path="/autonomous-system" element={<AutonomousSystem />} />
          <Route path="/website-factory" element={<WebsiteFactory />} />
          <Route path="/template-library" element={<TemplateLibrary />} />
          <Route path="/prompt-library" element={<PromptLibrary />} />
          <Route path="/rank-engine" element={<RankEngine />} />
          <Route path="/clone-studio" element={<CloneStudio />} />
          <Route path="/clone-pipeline" element={<ClonePipeline />} />
          <Route path="/rebrand-studio" element={<RebrandStudio />} />
          <Route path="/race-to-rank" element={<RaceToRank />} />
          <Route path="/ranking-monitor" element={<RankingMonitor />} />
          <Route path="/domain-portfolio" element={<DomainPortfolio />} />
          <Route path="/gsc-traffic" element={<GscTraffic />} />
          <Route path="/seo-accelerator" element={<SeoAccelerator />} />
          <Route path="/seo-standard" element={<SeoStandard />} />
          <Route path="/seo-agent" element={<SeoAgent />} />
          <Route path="/serp-blueprint" element={<SerpBlueprint />} />
          <Route path="/pipeline-dashboard" element={<PipelineDashboard />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App