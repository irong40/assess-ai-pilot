
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserManagement } from "@/hooks/useUserManagement";
import { Database } from "@/integrations/supabase/types";
import { Users, Shield, UserPlus, UserMinus } from "lucide-react";
import Loading from "@/components/Loading";

type AppRole = Database["public"]["Enums"]["app_role"];

const UserManagement = () => {
  const { users, usersLoading, assignRole, removeRole, isAssigningRole, isRemovingRole } = useUserManagement();
  const [selectedRole, setSelectedRole] = useState<AppRole>("isso");

  const roleColors = {
    admin: "bg-red-500",
    issm: "bg-blue-500", 
    isso: "bg-green-500"
  };

  const roleLabels = {
    admin: "Administrator",
    issm: "ISSM",
    isso: "ISSO"
  };

  if (usersLoading) {
    return <Loading text="Loading users..." />;
  }

  const handleAssignRole = (userId: string, role: AppRole) => {
    assignRole({ userId, role });
  };

  const handleRemoveRole = (userId: string, role: AppRole) => {
    removeRole({ userId, role });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Users & Roles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Current Roles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user.first_name || user.last_name || "N/A"
                      }
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge 
                          key={role} 
                          className={`${roleColors[role]} text-white`}
                        >
                          {roleLabels[role]}
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-slate-500 text-sm">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Select value={selectedRole} onValueChange={(value: AppRole) => setSelectedRole(value)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="issm">ISSM</SelectItem>
                          <SelectItem value="isso">ISSO</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        size="sm"
                        onClick={() => handleAssignRole(user.id, selectedRole)}
                        disabled={user.roles.includes(selectedRole) || isAssigningRole}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveRole(user.id, selectedRole)}
                        disabled={!user.roles.includes(selectedRole) || isRemovingRole}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {users && users.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No users found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
