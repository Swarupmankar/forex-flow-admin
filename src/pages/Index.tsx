import { DashboardLayout } from "@/components/DashboardLayout";
import { PlatformOverview } from "@/components/PlatformOverview";
import { FinancialSummary } from "@/components/FinancialSummary";
import { QuickActions } from "@/components/QuickActions";
import { RecentActivity } from "@/components/RecentActivity";

const Index = () => {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Platform Overview Section */}
        <PlatformOverview />
        
        {/* Financial Summary Cards */}
        <FinancialSummary />
        
        {/* Quick Actions Section */}
        <QuickActions />
        
        {/* Recent Activity Table */}
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
};

export default Index;
