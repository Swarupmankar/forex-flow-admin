import { Routes, Route } from "react-router-dom";

// Pages
import Index from "@/pages/Index";
import Clients from "@/pages/Clients";
import ClientProfile from "@/pages/ClientProfile";
import DepositRequests from "@/pages/DepositRequests";
import Transactions from "@/pages/DepositHistory";
import Withdrawals from "@/pages/Withdrawals";
import SpreadProfiles from "@/pages/SpreadProfiles";
import AccountTypes from "@/pages/AccountTypes";
import Notifications from "@/pages/Notifications";
import Support from "@/pages/Support";
import Wallet from "@/pages/Wallet";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Login from "@/components/auth/Login";

// Route wrapper
import ProtectedRoute from "./ProtectedRoute";
import PaymentSetup from "@/pages/PaymentSetup";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Index />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientProfile />} />
        <Route path="/deposits" element={<DepositRequests />} />
        <Route path="/deposit-history" element={<Transactions />} />
        <Route path="/withdrawals" element={<Withdrawals />} />
        <Route path="/accounts" element={<SpreadProfiles />} />
        <Route path="/account-types" element={<AccountTypes />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/support" element={<Support />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/payment-setup" element={<PaymentSetup />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
