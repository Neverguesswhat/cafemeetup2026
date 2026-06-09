"use client";

import { useAppState, NotificationItem } from "@/lib/state";
import { TabBar } from "@/components/layout/TabBar";
import { Badge } from "@/components/ui/badge";

export default function MessagesPage() {
  const { state } = useAppState();

  const getBadgeType = (type: NotificationItem["type"]) => {
    switch (type) {
      case "sms":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs rounded-full">SMS Alert</Badge>;
      case "push":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs rounded-full">Push Notification</Badge>;
      case "system":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs rounded-full">System</Badge>;
    }
  };

  return (
    <div className="absolute inset-0 bg-background flex flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-1">Messages & Alerts</h1>
        <p className="text-base text-muted-foreground mb-6">Live notifications, SMS duplicates, and system messages</p>

        <div className="flex flex-col gap-3">
          {(state?.notifications || []).length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No alerts logged.</div>
          ) : (
            (state?.notifications || []).map((item) => (
              <div key={item.id} className="p-4 rounded-3xl border border-border bg-slate-50 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  {getBadgeType(item.type)}
                  <span className="text-xs text-slate-400 font-mono">{item.timestamp}</span>
                </div>
                <h3 className="font-bold text-base text-slate-800 leading-snug">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            ))
          )}
        </div>
      </main>

      <TabBar />
    </div>
  );
}
