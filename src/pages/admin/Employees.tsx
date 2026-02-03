import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Users, Search, Award, BookOpen } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  team_id: string | null;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
}

interface EmployeeStats {
  userId: string;
  name: string;
  teamName: string | null;
  chaptersCompleted: number;
  totalChapters: number;
  avgScore: number;
  simulationCount: number;
}

const AdminEmployees = () => {
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      const [profilesRes, teamsRes, chaptersRes, progressRes, sessionsRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("teams").select("*"),
        supabase.from("course_chapters").select("id"),
        supabase.from("learning_progress").select("*"),
        supabase.from("simulation_sessions").select("user_id, overall_score").not("overall_score", "is", null),
      ]);

      const profiles = profilesRes.data || [];
      const teamsData = teamsRes.data || [];
      const chapters = chaptersRes.data || [];
      const progress = progressRes.data || [];
      const sessions = sessionsRes.data || [];

      setTeams(teamsData);

      const employeeStats: EmployeeStats[] = profiles.map((profile) => {
        const userProgress = progress.filter((p) => p.user_id === profile.user_id);
        const completedChapters = userProgress.filter((p) => p.completed_at).length;

        const userSessions = sessions.filter((s) => s.user_id === profile.user_id);
        const avgScore = userSessions.length > 0
          ? Math.round(userSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / userSessions.length)
          : 0;

        const team = teamsData.find((t) => t.id === profile.team_id);

        return {
          userId: profile.user_id,
          name: profile.full_name,
          teamName: team?.name || null,
          chaptersCompleted: completedChapters,
          totalChapters: chapters.length,
          avgScore,
          simulationCount: userSessions.length,
        };
      });

      setEmployees(employeeStats);
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeam === "all" || e.teamName === selectedTeam;
    return matchesSearch && matchesTeam;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">员工管理</h1>
        <p className="text-muted-foreground">查看员工培训进度和表现</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{employees.length}</p>
                <p className="text-sm text-muted-foreground">总员工数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {employees.length > 0
                    ? Math.round(employees.reduce((sum, e) => sum + e.avgScore, 0) / employees.length)
                    : 0}
                </p>
                <p className="text-sm text-muted-foreground">平均得分</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {employees.length > 0 && employees[0].totalChapters > 0
                    ? Math.round(
                        (employees.reduce((sum, e) => sum + e.chaptersCompleted, 0) /
                          (employees.length * employees[0].totalChapters)) *
                          100
                      )
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">平均完成率</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索员工..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="选择团队" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部团队</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.name}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Employees Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>员工</TableHead>
                <TableHead>团队</TableHead>
                <TableHead>课程进度</TableHead>
                <TableHead>平均得分</TableHead>
                <TableHead>模拟次数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无员工数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {employee.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {employee.teamName ? (
                        <Badge variant="secondary">{employee.teamName}</Badge>
                      ) : (
                        <span className="text-muted-foreground">未分配</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={
                            employee.totalChapters > 0
                              ? (employee.chaptersCompleted / employee.totalChapters) * 100
                              : 0
                          }
                          className="w-24 h-2"
                        />
                        <span className="text-sm text-muted-foreground">
                          {employee.chaptersCompleted}/{employee.totalChapters}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={employee.avgScore >= 80 ? "default" : employee.avgScore >= 60 ? "secondary" : "destructive"}
                      >
                        {employee.avgScore} 分
                      </Badge>
                    </TableCell>
                    <TableCell>{employee.simulationCount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmployees;
