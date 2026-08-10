import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { PendingModerationPanel } from "@/components/pending-moderation-panel"
import { SectionCards } from "@/components/section-cards"
import { DeviceAnalyticsCard } from "@/components/device-analytics"
import { DeviceDailyUsageCard } from "@/components/device-daily-usage"
import { MobileAIInsightsCard } from "@/components/mobile-ai-insights"
import { NewHomesNotificationInsightsCard } from "@/components/new-homes-notification-insights"
import { TodayDeviceOpensCard } from "@/components/today-device-opens-card"
import { ListingEmailTestCard } from "@/components/listing-email-test-card"

import data from "./data.json"

export default function Page() {
    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
                <ListingEmailTestCard />
            </div>
            <div className="px-4 lg:px-6">
                <TodayDeviceOpensCard />
            </div>
            <PendingModerationPanel />
            <SectionCards />
            <div className="px-4 lg:px-6">
                <MobileAIInsightsCard />
            </div>
            <div className="px-4 lg:px-6">
                <DeviceAnalyticsCard />
            </div>
            <div className="px-4 lg:px-6">
                <DeviceDailyUsageCard />
            </div>
            <div className="px-4 lg:px-6">
                <NewHomesNotificationInsightsCard />
            </div>
            <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
            </div>
            <DataTable data={data} />
        </div>
    )
}
