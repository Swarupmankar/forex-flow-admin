import { DashboardLayout } from "@/components/DashboardLayout";
import { PlatformOverview } from "@/components/PlatformOverview";
import { FinancialSummary } from "@/components/FinancialSummary";
import { QuickActions } from "@/components/QuickActions";
import { RecentActivity } from "@/components/RecentActivity";
import { TopTen } from "@/components/TopTen";

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
        
        {/* Top 10 rankings */}
        <TopTen />

        {/* Recent Activity Table */}
        <RecentActivity />
      </div>
    </DashboardLayout>
  );
};

export default Index;
