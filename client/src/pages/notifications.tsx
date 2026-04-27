import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Calendar, CreditCard, ShieldCheck, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Notification } from "@shared/schema";

const typeIcon: Record<string, any> = {
  appointment: Calendar,
  credits: CreditCard,
  verification: ShieldCheck,
  welcome: Bell,
  info: Info,
};

const typeColor: Record<string, string> = {
  appointment: "bg-primary/10 text-primary",
  credits: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  verification: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  welcome: "bg-primary/10 text-primary",
  info: "bg-secondary text-secondary-foreground",
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: notifs = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const readAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/read-all", {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const readOneMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge className="text-xs">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-0.5">Stay up to date with your activity.</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
            className="gap-1.5"
            data-testid="button-mark-all-read"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No notifications yet</h3>
          <p className="text-sm text-muted-foreground">You'll see notifications here when activity happens.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((notif) => {
            const Icon = typeIcon[notif.type] || Info;
            const color = typeColor[notif.type] || typeColor.info;
            return (
              <Card
                key={notif.id}
                className={`transition-colors cursor-pointer ${!notif.isRead ? "border-primary/20 bg-primary/[0.02]" : ""}`}
                onClick={() => !notif.isRead && readOneMutation.mutate(notif.id)}
                data-testid={`notif-${notif.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {format(new Date(notif.createdAt), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
