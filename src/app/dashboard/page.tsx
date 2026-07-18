import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { DeviceAnalyticsCard } from "@/components/device-analytics"
import { DeviceDailyUsageCard } from "@/components/device-daily-usage"

import data from "./data.json"

export default function Page() {
    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
                <DeviceAnalyticsCard />
            </div>
            <div className="px-4 lg:px-6">
                <DeviceDailyUsageCard />
            </div>
            <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
            </div>
            <DataTable data={data} />
        </div>
    )
}
