import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { AutoBuildProvider } from '@/lib/AutoBuildContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import BrandLoader from '@/components/BrandLoader';
import { ThemeProvider } from '@/lib/ThemeContext';
import { PreviewProvider } from '@/lib/PreviewContext';
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
import CreateMarket from '@/pages/CreateMarket';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
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
import PipelineCatalog from '@/pages/PipelineCatalog';
import WebsiteFactory from '@/pages/WebsiteFactory';
import BrandFactory from '@/pages/BrandFactory';
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
import DomainAcquisition from '@/pages/DomainAcquisition';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import BusinessGenerator from '@/pages/BusinessGenerator';
import Projects from '@/pages/Projects';
import Assistant from '@/pages/Assistant';
import Signatures from '@/pages/Signatures';
import BusinessProfile from '@/pages/BusinessProfile';
import Vision from '@/pages/Vision';
import Strategy from '@/pages/Strategy';
import BusinessNameStudio from '@/pages/BusinessNameStudio';
import WalkthroughStudio from '@/pages/WalkthroughStudio';
import WalkthroughView from '@/pages/WalkthroughView';
import ContentGenerator from '@/pages/ContentGenerator';
import LogoGenerator from '@/pages/LogoGenerator';
import BrandGenerator from '@/pages/BrandGenerator';
import DesignDirection from '@/pages/DesignDirection';
import SocialMediaGenerator from '@/pages/SocialMediaGenerator';
import SocialMediaStudio from '@/pages/SocialMediaStudio';
import VideoGenerator from '@/pages/VideoGenerator';
import YourDesigns from '@/pages/YourDesigns';
import Enhancements from '@/pages/Enhancements';
import AdminPackages from '@/pages/AdminPackages';
import AdminPromoCodes from '@/pages/AdminPromoCodes';
import AdminDomainPurchase from '@/pages/AdminDomainPurchase';
import ClientSetup from '@/pages/ClientSetup';
import FreeTools from '@/pages/FreeTools';
import AutoBuilder from '@/pages/AutoBuilder';
import SystemArchitecture from '@/pages/SystemArchitecture';
import DataModel from '@/pages/DataModel';
import UiSystem from '@/pages/UiSystem';
import Codegen from '@/pages/Codegen';
import Deploy from '@/pages/Deploy';
import SystemReview from '@/pages/SystemReview';
import IdeaDiscovery from '@/pages/IdeaDiscovery';
import SystemAlerts from '@/pages/SystemAlerts';
import SystemOptimization from '@/pages/SystemOptimization';
import VisionCortex from '@/pages/VisionCortex';
import Architect from '@/pages/Architect';
import EmployeePortal from '@/pages/EmployeePortal';
import EmployeeManagement from '@/pages/EmployeeManagement';
import ProductCatalog from '@/pages/ProductCatalog';
import LeadEngine from '@/pages/LeadEngine';
import CouncilChamber from '@/pages/CouncilChamber';
import { PortalStudioProvider } from '@/lib/PortalStudioContext';
import XtremeShell from '@/components/xtremeai/XtremeShell';
import PortalStudio from '@/pages/portalstudio/PortalStudio';
import PortalStudioStep from '@/pages/portalstudio/PortalStudioStep';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();

  // Show branded loader while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <BrandLoader />;
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
      <Route path="/" element={isAuthenticated ? <Navigate to="/business-generator" replace /> : <Marketing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/ThankYou" element={<ThankYou />} />
      <Route path="/seo/:slug" element={<SeoLanding />} />
      <Route path="/coupon" element={<CouponPage />} />
      <Route path="/free-audit" element={<FreeAuditPage />} />
      <Route path="/free-tools" element={<FreeTools />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/sign/:token" element={<SignPortal />} />
      <Route path="/walkthrough/:token" element={<WalkthroughView />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/client-portal" element={<Dashboard />} />
          <Route path="/business-generator" element={<BusinessGenerator />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/business-profile" element={<BusinessProfile />} />
          <Route path="/vision" element={<Vision />} />
          <Route path="/strategy" element={<Strategy />} />
          <Route path="/business-name-studio" element={<BusinessNameStudio />} />
          <Route path="/walkthrough-studio" element={<WalkthroughStudio />} />
          <Route path="/content-generator" element={<ContentGenerator />} />
          <Route path="/logo-generator" element={<LogoGenerator />} />
          <Route path="/brand-generator" element={<BrandGenerator />} />
          <Route path="/design-direction" element={<DesignDirection />} />
          <Route path="/social-media" element={<SocialMediaGenerator />} />
          <Route path="/social-media-studio" element={<SocialMediaStudio />} />
          <Route path="/video-generator" element={<VideoGenerator />} />
          <Route path="/your-designs" element={<YourDesigns />} />
          <Route path="/enhancements" element={<Enhancements />} />
          <Route path="/signatures" element={<Signatures />} />
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
          <Route path="/markets/new" element={<CreateMarket />} />
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
          <Route path="/pipeline-catalog" element={<PipelineCatalog />} />
          <Route path="/website-factory" element={<WebsiteFactory />} />
          <Route path="/brand-factory" element={<BrandFactory />} />
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
          <Route path="/domain-acquisition" element={<DomainAcquisition />} />
          <Route path="/admin-packages" element={<AdminPackages />} />
          <Route path="/admin-promo-codes" element={<AdminPromoCodes />} />
          <Route path="/admin-domain-purchase" element={<AdminDomainPurchase />} />
          <Route path="/client-setup" element={<ClientSetup />} />
          <Route path="/auto-builder" element={<AutoBuilder />} />
          <Route path="/system-architecture" element={<SystemArchitecture />} />
          <Route path="/data-model" element={<DataModel />} />
          <Route path="/ui-system" element={<UiSystem />} />
          <Route path="/codegen" element={<Codegen />} />
          <Route path="/deploy" element={<Deploy />} />
          <Route path="/system-review" element={<SystemReview />} />
          <Route path="/idea-discovery" element={<IdeaDiscovery />} />
          <Route path="/system-alerts" element={<SystemAlerts />} />
          <Route path="/system-optimization" element={<SystemOptimization />} />
          <Route path="/vision-cortex" element={<VisionCortex />} />
      <Route path="/architect" element={<Architect />} />
      <Route path="/employee-portal" element={<EmployeePortal />} />
      <Route path="/employee-management" element={<EmployeeManagement />} />
      <Route path="/product-catalog" element={<ProductCatalog />} />
      <Route path="/lead-engine" element={<LeadEngine />} />
      <Route path="/council-chamber" element={<CouncilChamber />} />
        </Route>
      </Route>
      {/* Xtreme AI — mobile device shell with bottom tab bar. Isolated
          clone of the client portal for refinement, hardening, and branding. */}
      <Route element={<PortalStudioProvider><XtremeShell /></PortalStudioProvider>}>
        <Route path="/portal-studio" element={<PortalStudio />} />
        <Route path="/portal-studio/welcome" element={<PortalStudioStep />} />
        <Route path="/portal-studio/business-name" element={<PortalStudioStep />} />
        <Route path="/portal-studio/business-profile" element={<PortalStudioStep />} />
        <Route path="/portal-studio/content" element={<PortalStudioStep />} />
        <Route path="/portal-studio/logo" element={<PortalStudioStep />} />
        <Route path="/portal-studio/brand" element={<PortalStudioStep />} />
        <Route path="/portal-studio/website" element={<PortalStudioStep />} />
        <Route path="/portal-studio/social" element={<PortalStudioStep />} />
        <Route path="/portal-studio/video" element={<PortalStudioStep />} />
        <Route path="/portal-studio/enhancements" element={<PortalStudioStep />} />
        <Route path="/portal-studio/your-designs" element={<PortalStudioStep />} />
        <Route path="/portal-studio/signatures" element={<PortalStudioStep />} />
        <Route path="/portal-studio/approvals" element={<PortalStudioStep />} />
        <Route path="/portal-studio/launch" element={<PortalStudioStep />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <ThemeProvider>
        <PreviewProvider>
          <AutoBuildProvider>
            <QueryClientProvider client={queryClientInstance}>
              <Router>
              <ScrollToTop />
              <AuthenticatedApp />
              </Router>
              <Toaster />
            </QueryClientProvider>
          </AutoBuildProvider>
        </PreviewProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App