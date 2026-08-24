import {
  BarChartIcon,
  BookOpenIcon,
  Building2Icon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  HomeIcon,
  LayoutDashboard,
  MessageCircleIcon,
  Settings2Icon,
  ShipIcon,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "../components/ui/sidebar";
import { cn } from "../lib/utils";
import { useMarina } from "../store/marina-store";
import { UserMenu } from "./user-menu";

type SubItem = {
  title: string;
  url: string;
  live?: boolean;
  badge?: string;
};

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  items?: SubItem[];
};

const INERT = "Not in this prototype";

function inert(title: string) {
  toast.message(INERT, { description: title });
}

export function GlobalSidebar({ children }: { children: ReactNode }) {
  const sidebar = useSidebar();
  const location = useLocation();
  const { state } = useMarina();
  const pathname = location.pathname;
  const pendingRequests = state.launchTasks.filter((task) => task.status === "requested").length;

  const navMain: NavItem[] = [
    {
      title: "Dashboard",
      url: "/dashboard/insights",
      icon: LayoutDashboard,
      items: [
        { title: "Insights", url: "/dashboard/insights" },
        { title: "Actions", url: "/dashboard/actions" },
      ],
    },
    {
      title: "Operations",
      url: "/operations/calendar",
      icon: ShipIcon,
      items: [
        { title: "Calendar", url: "/operations/calendar", live: true },
        { title: "Map", url: "/operations/map" },
        { title: "Owners", url: "/operations/owners" },
        { title: "Tenants", url: "/operations/tenants" },
        { title: "Quotes", url: "/operations/quotes" },
        ...(state.settings.dryStorageEnabled
          ? [
              {
                title: "Launch board",
                url: "/operations/launch-board",
                live: true,
                badge: pendingRequests > 0 ? String(pendingRequests) : undefined,
              },
            ]
          : []),
        { title: "Yard tablet", url: "/operations/tablet", live: true },
      ],
    },
    {
      title: "Accounting",
      url: "/accounting/invoices",
      icon: BarChartIcon,
      items: [
        { title: "Invoices & Credits", url: "/accounting/invoices" },
        { title: "Receipts & Refunds", url: "/accounting/payments" },
        { title: "Bulk Invoices", url: "/accounting/bulk-invoices" },
        { title: "Bulk Statements", url: "/accounting/bulk-statements" },
        { title: "Disbursements", url: "/accounting/disbursements" },
        { title: "Reports", url: "/accounting/reports" },
      ],
    },
    {
      title: "Communications",
      url: "/communications",
      icon: Building2Icon,
      items: [
        { title: "Messages", url: "/communications/messages" },
        { title: "Bulk Messaging", url: "/communications/bulk-messaging" },
        { title: "Templates", url: "/communications/templates" },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2Icon,
      items: [
        { title: "General Info", url: "/settings/general-info", live: true },
        { title: "Personalisation", url: "/settings/personalisation" },
        { title: "Marina Connect", url: "/settings/external-integration" },
        { title: "Integrations", url: "/settings/payments" },
        { title: "Activity Log", url: "/settings/activity-log" },
      ],
    },
  ];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navMain.map((item) => [item.title, true])),
  );

  function isSubActive(url: string) {
    if (pathname === url) return true;
    if (url.startsWith("/settings/")) return pathname.startsWith(`${url}/`);
    return false;
  }

  function isItemActive(item: NavItem) {
    if (item.url === pathname) return true;
    return item.items?.some((sub) => isSubActive(sub.url)) ?? false;
  }

  return (
    <>
      <Sidebar variant="inset" className="bg-[hsl(252,75%,99%)]">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className={cn("h-[36px] overflow-hidden transition-all [&>div]:w-full", sidebar.open ? "" : "-mx-1")}>
                <button
                  type="button"
                  onClick={() => inert("Organisation switcher")}
                  className="flex h-9 w-full items-center gap-2 rounded-md px-1.5 hover:bg-sidebar-accent"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[hsl(252,75%,70%)] text-[11px] font-bold text-white">
                    H
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">Harbour Demo</span>
                  <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Home" isActive={pathname === "/home"} onClick={() => inert("Home")}>
                  <HomeIcon />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {navMain.map((item) => (
                <Collapsible
                  key={item.title}
                  asChild
                  open={openSections[item.title] ?? true}
                  onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, [item.title]: open }))}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isItemActive(item)}
                      onClick={() =>
                        setOpenSections((prev) => ({ ...prev, [item.title]: !(prev[item.title] ?? true) }))
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRightIcon />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            {subItem.live ? (
                              <SidebarMenuSubButton asChild isActive={isSubActive(subItem.url)}>
                                <Link to={subItem.url}>
                                  <span>{subItem.title}</span>
                                  {subItem.badge ? (
                                    <Badge
                                      variant="outline"
                                      className="ml-2 border-[hsl(252,75%,80%)] bg-[hsl(252,75%,99%)] text-[hsl(252,75%,70%)]"
                                    >
                                      {subItem.badge}
                                    </Badge>
                                  ) : null}
                                </Link>
                              </SidebarMenuSubButton>
                            ) : (
                              <SidebarMenuSubButton
                                href="#"
                                onClick={(event) => {
                                  event.preventDefault();
                                  inert(subItem.title);
                                }}
                              >
                                <span>{subItem.title}</span>
                              </SidebarMenuSubButton>
                            )}
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => inert("Chat with us")}>
                    <MessageCircleIcon />
                    <span>Chat with us</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="https://www.harbrapp.com/blogs/how-to" target="_blank" rel="noreferrer">
                      <BookOpenIcon />
                      <span>How-to Guides</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <UserMenu />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  );
}
