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
import Marketing from '@/pages/Marketing';
import Pricing from '@/pages/Pricing';
import ThankYou from '@/pages/ThankYou';
import SeoLanding from '@/pages/SeoLanding';
import CouponPage from '@/pages/CouponPage';
import FreeAuditPage from '@/pages/FreeAuditPage';
import Connect from '@/pages/Connect';
import OAuthConsent from '@/pages/OAuthConsent';
import FreeTools from '@/pages/FreeTools';
import FloorVisualizer from '@/pages/FloorVisualizer';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import SignPortal from '@/pages/esign/SignPortal';
import WalkthroughView from '@/pages/WalkthroughView';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import BusinessGenerator from '@/pages/BusinessGenerator';
import OnboardingAssistant from '@/pages/OnboardingAssistant';
import Projects from '@/pages/Projects';
import StrategyReview from '@/pages/StrategyReview';
import PackInbox from '@/pages/PackInbox';
import MassWebsiteFactory from '@/pages/MassWebsiteFactory';
import RankingMonitor from '@/pages/RankingMonitor';
import VideoGenerator from '@/pages/VideoGenerator';
import GptSync from '@/pages/GptSync';
import PipelineFlow from '@/pages/PipelineFlow';
import SkipTracePortal from '@/pages/SkipTracePortal';
import ClientOnboarding from '@/pages/ClientOnboarding';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <BrandLoader />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated && new URLSearchParams(window.location.search).get('view') !== 'site' ? <Navigate to="/onboarding" replace /> : <Marketing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/ThankYou" element={<ThankYou />} />
      <Route path="/seo/:slug" element={<SeoLanding />} />
      <Route path="/coupon" element={<CouponPage />} />
      <Route path="/free-audit" element={<FreeAuditPage />} />
      <Route path="/connect" element={<Connect />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route path="/free-tools" element={<FreeTools />} />
      <Route path="/visualizer" element={<FloorVisualizer />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/sign/:token" element={<SignPortal />} />
      <Route path="/walkthrough/:token" element={<WalkthroughView />} />
      <Route path="/onboarding-form" element={<ClientOnboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/onboarding" element={<OnboardingAssistant />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/video-generator" element={<VideoGenerator />} />
        <Route path="/gpt-sync" element={<GptSync />} />
      <Route path="/pipeline-flow" element={<PipelineFlow />} />
      <Route path="/skip-trace-portal" element={<SkipTracePortal />} />
        <Route element={<Layout />}>
          <Route path="/client-portal" element={<Dashboard />} />
          <Route path="/business-generator" element={<BusinessGenerator />} />

          <Route path="/strategy-review" element={<StrategyReview />} />
          <Route path="/pack-inbox" element={<PackInbox />} />
          <Route path="/mass-website-factory" element={<MassWebsiteFactory />} />
          <Route path="/ranking-monitor" element={<RankingMonitor />} />
        </Route>
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