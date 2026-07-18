"use client"
'use client'

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { getAdminStats, AdminStats } from "@/lib/api"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  useEffect(() => {
    getAdminStats().then((s) => setStats(s.data)).catch(() => {})
  }, [])
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Properties</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.pending_properties ?? "–"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Review
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Require review <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Moderation queue
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Verifications</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.pending_verifications ?? "–"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              IDs
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Identity queue <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Requires manual review
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Videos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.pending_videos ?? "–"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Videos
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Awaiting moderation <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Content safety</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Reservations (7d)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.new_reservations_7d ?? "–"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              7d
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Booking momentum <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Last 7 days</div>
        </CardFooter>
      </Card>
    </div>
  )
}
