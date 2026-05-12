import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';
import React from 'react';

import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyOTP from './pages/VerifyOTP';

import Dashboard from './pages/dashboard/Dashboard';
import Goals from './pages/goals/Goals';
import Tasks from './pages/tasks/Tasks';
import AllTasks from './pages/tasks/AllTasks';
import ResourceManagement from './pages/members/ResourceManagement';
import Chat from './pages/chat/Chat';
import TalentPool from './pages/members/TalentPool';
import InvitationWizard from './pages/members/InvitationWizard';
import Organizations from './pages/organizations/Organizations';
import CreateOrganization from './pages/organizations/CreateOrganization';
import JoinOrganization from './pages/organizations/JoinOrganization';
import SearchOrganization from './pages/organizations/SearchOrganization';
import WorkspaceMailbox from './pages/organizations/WorkspaceMailbox';
import CreateGoal from './pages/goals/CreateGoal';
import GoalDetail from './pages/goals/GoalDetail';
import CreateTask from './pages/tasks/CreateTask';
import TaskDetail from './pages/tasks/TaskDetail';
import Settings from './pages/settings/Settings';
import SetupWorkspace from './pages/SetupWorkspace';
import Personalize from './pages/Personalize';
import InviteTeam from './pages/InviteTeam';
import JoinWorkspace from './pages/JoinWorkspace';
import Trash from './pages/Trash';
import Reports from './pages/Reports';
import HelpCenter from './pages/HelpCenter';
import Permissions from './pages/permissions/Permissions';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/setup-workspace" element={<SetupWorkspace />} />
          <Route path="/personalize" element={<Personalize />} />
          <Route path="/invite-team" element={<InviteTeam />} />
          <Route path="/join/:token" element={<JoinWorkspace />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/tasks" element={<AllTasks />} />
          <Route path="/board" element={<Tasks />} />
          <Route path="/members" element={<ResourceManagement />} />
          <Route path="/chat/:orgId" element={<Chat />} />
          <Route path="/chat/:orgId/:roomId" element={<Chat />} />
          <Route path="/talent-pool" element={<TalentPool />} />
          <Route path="/members/invite" element={<InvitationWizard />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/organizations/create" element={<CreateOrganization />} />
          <Route path="/organizations/:orgId/join" element={<JoinOrganization />} />
          <Route path="/organizations/search" element={<SearchOrganization />} />
          <Route path="/organizations/mailbox" element={<WorkspaceMailbox />} />
          <Route path="/goals/create" element={<CreateGoal />} />
          <Route path="/goals/:goalId" element={<GoalDetail />} />
          <Route path="/tasks/create" element={<CreateTask />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/permissions" element={<Permissions />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster 
          position="top-right" 
          reverseOrder={false}
          gutter={12}
          toastOptions={{
            duration: 5000,
            style: {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              color: '#1e293b',
              borderRadius: '16px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              padding: '16px 24px',
              fontSize: '14px',
              fontWeight: '600',
              maxWidth: '500px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
              style: { borderLeft: '6px solid #10b981' }
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#fff' },
              style: { borderLeft: '6px solid #f43f5e' }
            },
          }}
        />
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;