import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Sparkles, 
  BookOpen, 
  Swords, 
  BarChart3, 
  LogOut,
  User,
  ChevronDown,
  History,
  FileText,
} from "lucide-react";

const menuItems = [
  { title: "网课学习", url: "/courses", icon: BookOpen },
  { title: "实战模拟", url: "/simulation", icon: Swords },
];

const scoreMenuItems = [
  { title: "能力报告", url: "/reports", icon: FileText },
  { title: "历史记录", url: "/history", icon: History },
];

const EmployeeLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  const isScoreActive = location.pathname === "/reports" || location.pathname === "/history";

  const getPageTitle = () => {
    if (location.pathname === "/history") return "历史记录";
    const item = menuItems.find((item) => location.pathname.startsWith(item.url));
    if (item) return item.title;
    const scoreItem = scoreMenuItems.find((item) => location.pathname.startsWith(item.url));
    if (scoreItem) return scoreItem.title;
    return "首页";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r border-border">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-luxury-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-gold bg-clip-text text-transparent">
                  销售培训
                </h1>
                <p className="text-xs text-muted-foreground">员工端</p>
              </div>
            </div>
          </div>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>培训模块</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                          activeClassName="bg-muted text-primary font-medium"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  
                  {/* 评分与能力 - 悬停下拉菜单 */}
                  <SidebarMenuItem>
                    <HoverCard openDelay={0} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <SidebarMenuButton asChild>
                          <div 
                            className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer ${
                              isScoreActive ? "bg-muted text-primary font-medium" : ""
                            }`}
                          >
                            <BarChart3 className="h-5 w-5" />
                            <span>评分与能力</span>
                            <ChevronDown className="h-4 w-4 ml-auto" />
                          </div>
                        </SidebarMenuButton>
                      </HoverCardTrigger>
                      <HoverCardContent side="right" align="start" className="w-48 p-1">
                        {scoreMenuItems.map((item) => (
                          <Button
                            key={item.url}
                            variant="ghost"
                            className={`w-full justify-start gap-2 ${
                              location.pathname === item.url ? "bg-muted text-primary" : ""
                            }`}
                            onClick={() => navigate(item.url)}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                          </Button>
                        ))}
                      </HoverCardContent>
                    </HoverCard>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="mt-auto p-4 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">{user?.email}</span>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  个人资料
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-4">
            <SidebarTrigger className="mr-4" />
            <h2 className="font-semibold flex-1">{getPageTitle()}</h2>
            <ThemeToggle />
          </header>
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default EmployeeLayout;
